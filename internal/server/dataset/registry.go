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

type InspectError struct{ Inspection Inspection }

func (e *InspectError) Error() string { return e.Inspection.Message }
