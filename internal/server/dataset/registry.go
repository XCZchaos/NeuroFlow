package dataset

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	_ "modernc.org/sqlite"
)

// Inspection 对应 Python 检查器返回的 JSON。
// 这些字段属于文件元数据，不能被解释为已经完成了信号质量分析或预处理。
type Inspection struct {
	OK                        bool              `json:"ok"`
	Code                      string            `json:"code,omitempty"`
	Message                   string            `json:"message,omitempty"`
	Format                    string            `json:"format,omitempty"`
	Reader                    string            `json:"reader,omitempty"`
	Modality                  string            `json:"modality,omitempty"`
	SamplingRateHz            float64           `json:"sampling_rate_hz,omitempty"`
	ChannelCount              int               `json:"channel_count,omitempty"`
	ChannelNames              []string          `json:"channel_names,omitempty"`
	ChannelTypeCounts         map[string]int    `json:"channel_type_counts,omitempty"`
	DurationSeconds           float64           `json:"duration_seconds,omitempty"`
	SampleCount               int64             `json:"sample_count,omitempty"`
	BadChannels               []string          `json:"bad_channels,omitempty"`
	LineFrequencyHz           *float64          `json:"line_frequency_hz,omitempty"`
	AnnotationCount           int               `json:"annotation_count,omitempty"`
	SourceName                string            `json:"source_name,omitempty"`
	SourceSizeBytes           *int64            `json:"source_size_bytes,omitempty"`
	Supported                 []string          `json:"supported_extensions,omitempty"`
	StructureConfidence       float64           `json:"structure_confidence,omitempty"`
	StructureReport           map[string]any    `json:"structure_report,omitempty"`
	ChannelNameMapping        map[string]string `json:"channel_name_mapping,omitempty"`
	Montage                   string            `json:"montage,omitempty"`
	SignalUnit                string            `json:"signal_unit,omitempty"`
	UnitConfidence            float64           `json:"unit_confidence,omitempty"`
	EventDictionary           any               `json:"event_dictionary,omitempty"`
	EventsRequireConfirmation bool              `json:"events_require_confirmation,omitempty"`
	StructureWarnings         []string          `json:"structure_warnings,omitempty"`
	StructureConflicts        []string          `json:"structure_conflicts,omitempty"`
}

// Record 把一次已解析的数据集绑定到随机 ID。
// path 使用小写字段，因此 Go JSON 编码器不会把用户的本地绝对路径发送给前端或大模型。
type Record struct {
	ID         string     `json:"dataset_id"`
	Inspection Inspection `json:"inspection"`
	path       string
}

// LabelAttachment 是外部标签绑定后的摘要。标签内容只会以标准化后的
// MNE Annotation 形式写入导入配置，原始信号文件和标签文件都不会被修改。
type LabelAttachment struct {
	SourceName       string         `json:"label_source_name"`
	Count            int            `json:"label_count"`
	SampleOrigin     int            `json:"sample_origin"`
	Annotations      []Annotation   `json:"annotations,omitempty"`
	ValidationReport map[string]any `json:"validation_report,omitempty"`
}

type Annotation struct {
	Onset       float64 `json:"onset"`
	Duration    float64 `json:"duration"`
	Description string  `json:"description"`
}

// AttachLabels 校验 CSV/TSV/JSON 标签，并把它绑定到已注册的数据集。
// Python 负责理解列名、样本序号换算和越界检查；全部验证成功后才更新元数据。
func AttachLabels(ctx context.Context, id, labelPath string, sampleOrigin int) (Record, LabelAttachment, error) {
	record, ok := Get(id)
	if !ok {
		return Record{}, LabelAttachment{}, fmt.Errorf("dataset not found")
	}
	abs, err := filepath.Abs(strings.TrimSpace(labelPath))
	if err != nil {
		return Record{}, LabelAttachment{}, fmt.Errorf("resolve label path: %w", err)
	}
	info, err := os.Stat(abs)
	if err != nil || info.IsDir() {
		return Record{}, LabelAttachment{}, fmt.Errorf("label file does not exist")
	}
	script, err := datasetScriptPath("attach_labels.py")
	if err != nil {
		return Record{}, LabelAttachment{}, err
	}
	if sampleOrigin != 0 && sampleOrigin != 1 {
		return Record{}, LabelAttachment{}, fmt.Errorf("sample_origin must be 0 or 1")
	}
	cmd := exec.CommandContext(ctx, "python", script, record.path, abs, fmt.Sprintf("%d", sampleOrigin))
	// Windows 的系统代码页可能不是 UTF-8；Python 必须稳定输出可被 JSON 解码的字节。
	cmd.Env = append(os.Environ(), "PYTHONIOENCODING=utf-8")
	var stdout, stderr bytes.Buffer
	cmd.Stdout, cmd.Stderr = &stdout, &stderr
	runErr := cmd.Run()
	var result struct {
		OK               bool           `json:"ok"`
		Message          string         `json:"message"`
		LabelSourceName  string         `json:"label_source_name"`
		LabelCount       int            `json:"label_count"`
		SampleOrigin     int            `json:"sample_origin"`
		Annotations      []Annotation   `json:"annotations"`
		ValidationReport map[string]any `json:"validation_report"`
		Record           struct {
			Inspection Inspection `json:"inspection"`
		} `json:"record"`
	}
	if err := json.Unmarshal(bytes.TrimSpace(stdout.Bytes()), &result); err != nil {
		return Record{}, LabelAttachment{}, fmt.Errorf("label parser returned invalid JSON: %w (%s)", err, strings.TrimSpace(stderr.String()))
	}
	if runErr != nil || !result.OK {
		if result.Message == "" {
			result.Message = strings.TrimSpace(stderr.String())
		}
		return Record{}, LabelAttachment{}, fmt.Errorf("attach labels failed: %s", result.Message)
	}
	record.Inspection = result.Record.Inspection
	records.Store(id, record)
	if err := persistRecord(record); err != nil {
		return Record{}, LabelAttachment{}, err
	}
	return record, LabelAttachment{SourceName: result.LabelSourceName, Count: result.LabelCount, SampleOrigin: result.SampleOrigin, Annotations: result.Annotations, ValidationReport: result.ValidationReport}, nil
}

func runLabelOperation(ctx context.Context, record Record, operation string, input any) (Record, LabelAttachment, error) {
	script, err := datasetScriptPath("attach_labels.py")
	if err != nil {
		return Record{}, LabelAttachment{}, err
	}
	cmd := exec.CommandContext(ctx, "python", script, record.path, operation)
	cmd.Env = append(os.Environ(), "PYTHONIOENCODING=utf-8")
	if input != nil {
		encoded, marshalErr := json.Marshal(input)
		if marshalErr != nil {
			return Record{}, LabelAttachment{}, marshalErr
		}
		cmd.Stdin = bytes.NewReader(encoded)
	}
	var stdout, stderr bytes.Buffer
	cmd.Stdout, cmd.Stderr = &stdout, &stderr
	runErr := cmd.Run()
	var result struct {
		OK               bool           `json:"ok"`
		Message          string         `json:"message"`
		LabelSourceName  string         `json:"label_source_name"`
		LabelCount       int            `json:"label_count"`
		SampleOrigin     int            `json:"sample_origin"`
		Annotations      []Annotation   `json:"annotations"`
		ValidationReport map[string]any `json:"validation_report"`
		Record           struct {
			Inspection Inspection `json:"inspection"`
		} `json:"record"`
	}
	if err = json.Unmarshal(bytes.TrimSpace(stdout.Bytes()), &result); err != nil {
		return Record{}, LabelAttachment{}, fmt.Errorf("label service returned invalid JSON: %w (%s)", err, strings.TrimSpace(stderr.String()))
	}
	if runErr != nil || !result.OK {
		return Record{}, LabelAttachment{}, fmt.Errorf("label operation failed: %s", result.Message)
	}
	if operation != "--list" {
		record.Inspection = result.Record.Inspection
		records.Store(record.ID, record)
		if err = persistRecord(record); err != nil {
			return Record{}, LabelAttachment{}, err
		}
	}
	return record, LabelAttachment{SourceName: result.LabelSourceName, Count: result.LabelCount, SampleOrigin: result.SampleOrigin, Annotations: result.Annotations, ValidationReport: result.ValidationReport}, nil
}

func ListLabels(ctx context.Context, id string) (LabelAttachment, error) {
	record, ok := Get(id)
	if !ok {
		return LabelAttachment{}, fmt.Errorf("dataset not found")
	}
	_, labels, err := runLabelOperation(ctx, record, "--list", nil)
	labels.Count = len(labels.Annotations)
	return labels, err
}

func ReplaceLabels(ctx context.Context, id, source string, sampleOrigin int, annotations []Annotation) (Record, LabelAttachment, error) {
	record, ok := Get(id)
	if !ok {
		return Record{}, LabelAttachment{}, fmt.Errorf("dataset not found")
	}
	return runLabelOperation(ctx, record, "--replace", map[string]any{"label_source_name": source, "sample_origin": sampleOrigin, "annotations": annotations})
}

func DeleteLabels(ctx context.Context, id string) (Record, error) {
	record, ok := Get(id)
	if !ok {
		return Record{}, fmt.Errorf("dataset not found")
	}
	record, _, err := runLabelOperation(ctx, record, "--delete", nil)
	return record, err
}

var records sync.Map
var registryDatabase struct {
	sync.RWMutex
	db *sql.DB
}

// InitRegistry 恢复持久化的数据集句柄，并核对源路径的大小和修改时间。
// 失效记录仍留在 SQLite 供历史审计，但不会重新暴露给分析工具。
func InitRegistry(path string) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return fmt.Errorf("create dataset registry directory: %w", err)
	}
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return fmt.Errorf("open dataset registry: %w", err)
	}
	db.SetMaxOpenConns(1)
	// A reinitialization (used by tests and future profile switching) must not
	// leave handles from the previous database in memory.
	records.Range(func(key, _ any) bool { records.Delete(key); return true })
	for _, statement := range []string{
		`PRAGMA journal_mode=WAL`, `PRAGMA busy_timeout=5000`,
		`CREATE TABLE IF NOT EXISTS dataset_registry (
			id TEXT PRIMARY KEY, path TEXT NOT NULL UNIQUE, size_bytes INTEGER NOT NULL,
			modified_ns INTEGER NOT NULL, inspection_json TEXT NOT NULL,
			valid INTEGER NOT NULL DEFAULT 1, invalid_reason TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL
		)`,
	} {
		if _, err = db.Exec(statement); err != nil {
			db.Close()
			return fmt.Errorf("initialize dataset registry: %w", err)
		}
	}
	rows, err := db.Query(`SELECT id,path,size_bytes,modified_ns,inspection_json FROM dataset_registry WHERE valid=1`)
	if err != nil {
		db.Close()
		return err
	}
	type restored struct {
		id, path       string
		size, modified int64
		inspection     string
	}
	var candidates []restored
	for rows.Next() {
		var item restored
		if err = rows.Scan(&item.id, &item.path, &item.size, &item.modified, &item.inspection); err != nil {
			rows.Close()
			db.Close()
			return err
		}
		candidates = append(candidates, item)
	}
	rows.Close()
	for _, item := range candidates {
		info, statErr := os.Stat(item.path)
		if statErr != nil || info.Size() != item.size || info.ModTime().UnixNano() != item.modified {
			reason := "source path is missing"
			if statErr == nil {
				reason = "source fingerprint changed"
			}
			_, _ = db.Exec(`UPDATE dataset_registry SET valid=0,invalid_reason=?,updated_at=? WHERE id=?`, reason, time.Now().UTC().Format(time.RFC3339Nano), item.id)
			continue
		}
		var inspection Inspection
		if json.Unmarshal([]byte(item.inspection), &inspection) == nil {
			records.Store(item.id, Record{ID: item.id, Inspection: inspection, path: item.path})
		}
	}
	registryDatabase.Lock()
	old := registryDatabase.db
	registryDatabase.db = db
	registryDatabase.Unlock()
	if old != nil {
		_ = old.Close()
	}
	return nil
}

func CloseRegistry() error {
	registryDatabase.Lock()
	defer registryDatabase.Unlock()
	if registryDatabase.db == nil {
		return nil
	}
	err := registryDatabase.db.Close()
	registryDatabase.db = nil
	return err
}

func persistRecord(record Record) error {
	registryDatabase.RLock()
	db := registryDatabase.db
	registryDatabase.RUnlock()
	if db == nil {
		return nil
	}
	info, err := os.Stat(record.path)
	if err != nil {
		return err
	}
	encoded, err := json.Marshal(record.Inspection)
	if err != nil {
		return err
	}
	_, err = db.Exec(`INSERT INTO dataset_registry(id,path,size_bytes,modified_ns,inspection_json,valid,invalid_reason,updated_at)
		VALUES(?,?,?,?,?,1,'',?) ON CONFLICT(path) DO UPDATE SET id=excluded.id,size_bytes=excluded.size_bytes,
		modified_ns=excluded.modified_ns,inspection_json=excluded.inspection_json,valid=1,invalid_reason='',updated_at=excluded.updated_at`,
		record.ID, record.path, info.Size(), info.ModTime().UnixNano(), string(encoded), time.Now().UTC().Format(time.RFC3339Nano))
	return err
}

func persistedID(path string) string {
	registryDatabase.RLock()
	db := registryDatabase.db
	registryDatabase.RUnlock()
	if db == nil {
		return ""
	}
	var id string
	_ = db.QueryRow(`SELECT id FROM dataset_registry WHERE path=?`, path).Scan(&id)
	return id
}

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
	id := persistedID(abs)
	if id == "" {
		id = uuid.NewString()
	}
	record := Record{ID: id, Inspection: inspection, path: abs}
	records.Store(record.ID, record)
	if err := persistRecord(record); err != nil {
		records.Delete(record.ID)
		return Record{}, fmt.Errorf("persist dataset registry: %w", err)
	}
	if companion := companionLabelPath(abs); companion != "" {
		if attached, _, attachErr := AttachLabels(ctx, record.ID, companion, 0); attachErr == nil {
			record = attached
		} else {
			record.Inspection.StructureWarnings = append(record.Inspection.StructureWarnings, "matched companion label file but validation failed: "+attachErr.Error())
			records.Store(record.ID, record)
			_ = persistRecord(record)
		}
	}
	return record, nil
}

func companionLabelPath(signalPath string) string {
	ext := filepath.Ext(signalPath)
	stem := strings.TrimSuffix(filepath.Base(signalPath), ext)
	base := stem
	for _, suffix := range []string{"_eeg", "_meg", "_fnirs", "_ieeg"} {
		if strings.HasSuffix(strings.ToLower(base), suffix) {
			base = base[:len(base)-len(suffix)]
			break
		}
	}
	directory := filepath.Dir(signalPath)
	for _, name := range []string{base + "_events.tsv", stem + "_events.tsv", stem + "_labels.csv", stem + ".labels.csv", stem + ".labels.json"} {
		candidate := filepath.Join(directory, name)
		if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
			return candidate
		}
	}
	return ""
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

// ReviewStructure 重新读取源文件。候选配置验证成功后才更新注册信息。
// Python 将确认配置持久化，预览、检查和分析共用它，不修改原始采集文件。
func ReviewStructure(ctx context.Context, id string, config map[string]any, commit bool) (Record, error) {
	record, ok := Get(id)
	if !ok {
		return Record{}, fmt.Errorf("dataset not found")
	}
	script, err := datasetScriptPath("review_dataset.py")
	if err != nil {
		return Record{}, err
	}
	mode := "preview"
	if commit {
		mode = "commit"
	}
	encoded, err := json.Marshal(config)
	if err != nil {
		return Record{}, err
	}
	cmd := exec.CommandContext(ctx, "python", script, record.path, mode)
	cmd.Stdin = bytes.NewReader(encoded)
	var stdout, stderr bytes.Buffer
	cmd.Stdout, cmd.Stderr = &stdout, &stderr
	runErr := cmd.Run()
	var inspection Inspection
	if err := json.Unmarshal(bytes.TrimSpace(stdout.Bytes()), &inspection); err != nil {
		return Record{}, fmt.Errorf("structure reread failed: %v (%s)", err, stderr.String())
	}
	if runErr != nil || !inspection.OK {
		return Record{}, &InspectError{Inspection: inspection}
	}
	record.Inspection = inspection
	if commit {
		records.Store(id, record)
		if err := persistRecord(record); err != nil {
			return Record{}, err
		}
	}
	return record, nil
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

// BrowseBIDS enumerates recordings and entities without loading sample arrays.
func BrowseBIDS(ctx context.Context, root string) (map[string]any, error) {
	script, err := datasetScriptPath("bids_catalog.py")
	if err != nil {
		return nil, err
	}
	abs, err := filepath.Abs(strings.TrimSpace(root))
	if err != nil {
		return nil, err
	}
	cmd := exec.CommandContext(ctx, "python", script, abs)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	runErr := cmd.Run()
	var result map[string]any
	if err = json.Unmarshal(bytes.TrimSpace(stdout.Bytes()), &result); err != nil {
		return nil, fmt.Errorf("BIDS catalog returned invalid JSON: %w (%s)", err, stderr.String())
	}
	if runErr != nil || result["ok"] != true {
		return nil, fmt.Errorf("BIDS browse failed: %v", result["message"])
	}
	return result, nil
}
