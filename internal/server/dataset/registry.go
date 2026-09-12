package dataset

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"

	"github.com/google/uuid"
)

// Inspection 对应 Python 检查器返回的 JSON。
// 这些字段属于文件元数据，不能被解释为已经完成了信号质量分析或预处理。
type Inspection struct {
	OK                bool           `json:"ok"`
	Code              string         `json:"code,omitempty"`
	Message           string         `json:"message,omitempty"`
	Format            string         `json:"format,omitempty"`
	Reader            string         `json:"reader,omitempty"`
	Modality          string         `json:"modality,omitempty"`
	SamplingRateHz    float64        `json:"sampling_rate_hz,omitempty"`
	ChannelCount      int            `json:"channel_count,omitempty"`
	ChannelNames      []string       `json:"channel_names,omitempty"`
	ChannelTypeCounts map[string]int `json:"channel_type_counts,omitempty"`
	DurationSeconds   float64        `json:"duration_seconds,omitempty"`
	SampleCount       int64          `json:"sample_count,omitempty"`
	BadChannels       []string       `json:"bad_channels,omitempty"`
	LineFrequencyHz   *float64       `json:"line_frequency_hz,omitempty"`
	AnnotationCount   int            `json:"annotation_count,omitempty"`
	SourceName        string         `json:"source_name,omitempty"`
	SourceSizeBytes   *int64         `json:"source_size_bytes,omitempty"`
	Supported         []string       `json:"supported_extensions,omitempty"`
}

// Record 把一次已解析的数据集绑定到随机 ID。
// path 使用小写字段，因此 Go JSON 编码器不会把用户的本地绝对路径发送给前端或大模型。
type Record struct {
	ID         string     `json:"dataset_id"`
	Inspection Inspection `json:"inspection"`
	path       string
}

// 当前先使用进程内注册表。sync.Map 允许多个 HTTP 请求安全地并发读写。
// 后端重启后记录会消失，未来可替换为数据库而不影响上层接口。
var records sync.Map

func Register(ctx context.Context, path string) (Record, error) {
	// Electron 只提交用户通过系统对话框选中的路径；Go 负责规范化路径并调用 Python。
	path = strings.TrimSpace(path)
	if path == "" {
		return Record{}, fmt.Errorf("文件路径不能为空")
	}
	abs, err := filepath.Abs(path)
	if err != nil {
		return Record{}, fmt.Errorf("解析文件路径: %w", err)
	}
	script, err := inspectionScriptPath()
	if err != nil {
		return Record{}, err
	}
	// CommandContext 会继承 HTTP 请求的超时；读取器卡住时子进程也会被终止。
	// 参数作为独立 argv 传递，不拼成 shell 命令，因此文件名中的空格不会破坏命令。
	cmd := exec.CommandContext(ctx, "python", script, abs)
	var stdout, stderr bytes.Buffer
	cmd.Stdout, cmd.Stderr = &stdout, &stderr
	runErr := cmd.Run()
	var inspection Inspection
	if err := json.Unmarshal(bytes.TrimSpace(stdout.Bytes()), &inspection); err != nil {
		return Record{}, fmt.Errorf("数据检查服务返回无效结果: %w (%s)", err, strings.TrimSpace(stderr.String()))
	}
	// Python 对“不支持格式”等预期问题也会以非零状态退出，同时给出结构化 JSON。
	if runErr != nil || !inspection.OK {
		return Record{}, &InspectError{Inspection: inspection}
	}
	// dataset_id 是 Agent 查询数据的句柄，避免在对话里暴露真实文件路径。
	record := Record{ID: uuid.NewString(), Inspection: inspection, path: abs}
	records.Store(record.ID, record)
	return record, nil
}

func inspectionScriptPath() (string, error) {
	// go run、单元测试和编译后的程序工作目录可能不同，因此按三个位置查找脚本：
	// 当前目录、可执行文件旁边、Go 源码推导出的项目根目录。
	candidates := []string{filepath.Join("neuro_service", "inspect_dataset.py")}
	if executable, err := os.Executable(); err == nil {
		candidates = append(candidates, filepath.Join(filepath.Dir(executable), "neuro_service", "inspect_dataset.py"))
	}
	if _, source, _, ok := runtime.Caller(0); ok {
		candidates = append(candidates, filepath.Join(filepath.Dir(source), "..", "..", "..", "neuro_service", "inspect_dataset.py"))
	}
	for _, candidate := range candidates {
		absolute, err := filepath.Abs(candidate)
		if err != nil {
			continue
		}
		if info, statErr := os.Stat(absolute); statErr == nil && !info.IsDir() {
			return absolute, nil
		}
	}
	return "", fmt.Errorf("找不到 neuro_service/inspect_dataset.py")
}
func Get(id string) (Record, bool) {
	// Agent 和 GET /datasets/:id 都通过这个只读入口访问已验证元数据。
	value, ok := records.Load(strings.TrimSpace(id))
	if !ok {
		return Record{}, false
	}
	return value.(Record), true
}

// ResolveLocalPath 仅供后端执行本地算法使用。Record 的 path 字段不会参与 JSON
// 序列化，因此 Agent 和前端只能通过 dataset_id 间接引用文件，无法看到本地路径。
func ResolveLocalPath(id string) (string, Inspection, bool) {
	record, ok := Get(id)
	if !ok {
		return "", Inspection{}, false
	}
	return record.path, record.Inspection, true
}

type InspectError struct{ Inspection Inspection }

func (e *InspectError) Error() string { return e.Inspection.Message }

// Preview 只读取数据开头的短窗口并返回抽稀波形。它与 Inspection 分开，避免
// 数据集注册因为一个较慢的波形读取而失败，也避免把波形保存进 Agent 元数据。
func Preview(ctx context.Context, id string, seconds float64) (map[string]any, error) {
	path, inspection, ok := ResolveLocalPath(id)
	if !ok {
		return nil, fmt.Errorf("数据集不存在或后端已重启")
	}
	if seconds <= 0 || seconds > 10 {
		seconds = 10
	}
	return ReadSignalWindow(ctx, path, inspection.Modality, "", 0, seconds)
}

// ReadSignalWindow 按通道和时间范围读取波形。每次最多返回约 2400 点，拖动和
// 缩放时重复调用，因此大型记录也不需要整体载入浏览器内存。
func ReadSignalWindow(ctx context.Context, path, modality, channel string, start, seconds float64) (map[string]any, error) {
	if seconds <= 0 || seconds > 120 {
		seconds = 10
	}
	if start < 0 {
		start = 0
	}
	script, err := datasetScriptPath("preview_dataset.py")
	if err != nil {
		return nil, err
	}
	cmd := exec.CommandContext(ctx, "python", script, path, modality, fmt.Sprintf("%g", seconds), fmt.Sprintf("%g", start), channel)
	var stdout, stderr bytes.Buffer
	cmd.Stdout, cmd.Stderr = &stdout, &stderr
	runErr := cmd.Run()
	var preview map[string]any
	if err := json.Unmarshal(bytes.TrimSpace(stdout.Bytes()), &preview); err != nil {
		return nil, fmt.Errorf("波形预览返回无效结果: %w (%s)", err, strings.TrimSpace(stderr.String()))
	}
	if runErr != nil || preview["ok"] != true {
		return nil, fmt.Errorf("读取真实波形失败: %v", preview["message"])
	}
	return preview, nil
}

func datasetScriptPath(name string) (string, error) {
	candidates := []string{filepath.Join("neuro_service", name)}
	if executable, err := os.Executable(); err == nil {
		candidates = append(candidates, filepath.Join(filepath.Dir(executable), "neuro_service", name))
	}
	if _, source, _, ok := runtime.Caller(0); ok {
		candidates = append(candidates, filepath.Join(filepath.Dir(source), "..", "..", "..", "neuro_service", name))
	}
	for _, candidate := range candidates {
		absolute, err := filepath.Abs(candidate)
		if err == nil {
			if info, statErr := os.Stat(absolute); statErr == nil && !info.IsDir() {
				return absolute, nil
			}
		}
	}
	return "", fmt.Errorf("找不到 neuro_service/%s", name)
}
