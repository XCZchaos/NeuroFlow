package tools

import (
	"OnCallAgent/internal/server/dataset"
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
	"time"

	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/components/tool/utils"
)

// latestAnalysis 保存每个数据集最近一次成功结果，供本地 Electron 在 Agent
// function call 完成后取回波形。只保留一份，避免多次分析持续占用内存。
var latestAnalysis sync.Map

// NeuroAnalysisInput 是大模型可以填写的 function-call 参数。波形和本地路径
// 不进入参数；dataset_id 由后端解析为用户已经导入的本地文件。
type NeuroAnalysisInput struct {
	DatasetID     string   `json:"dataset_id" jsonschema:"description=已导入数据集的 dataset_id"`
	AnalysisType  string   `json:"analysis_type" jsonschema:"description=summary 基础指标；quality 增加质量检查；full 执行 EEG 自动坏道、参考、ICA 与质量对比；默认 full"`
	StartSeconds  float64  `json:"start_seconds,omitempty" jsonschema:"description=分析起点（秒），默认为 0"`
	EndSeconds    float64  `json:"end_seconds,omitempty" jsonschema:"description=分析终点（秒），0 表示记录末尾；长数据应分段调用"`
	LeftChannel   string   `json:"left_channel,omitempty" jsonschema:"description=计算 EEG 左右不对称时的左侧通道名，例如 F3"`
	RightChannel  string   `json:"right_channel,omitempty" jsonschema:"description=计算 EEG 左右不对称时的右侧通道名，例如 F4"`
	HighpassHz    float64  `json:"highpass_hz,omitempty" jsonschema:"description=EEG 高通截止频率 Hz；省略或 0 时使用 1 Hz"`
	LowpassHz     float64  `json:"lowpass_hz,omitempty" jsonschema:"description=EEG 低通截止频率 Hz；省略或 0 时使用 45 Hz，并自动限制在 Nyquist 以下"`
	NotchHz       float64  `json:"notch_hz,omitempty" jsonschema:"description=EEG 工频陷波频率 Hz；省略或 0 时使用文件 line_freq，缺失时使用 50 Hz"`
	ResampleHz    float64  `json:"resample_hz,omitempty" jsonschema:"description=EEG 目标采样率 Hz；0 时自动选择不高于 250 Hz 的安全值"`
	EpochTMin     float64  `json:"epoch_tmin,omitempty" jsonschema:"description=EEG 事件分段起点秒，默认 -0.2"`
	EpochTMax     float64  `json:"epoch_tmax,omitempty" jsonschema:"description=EEG 事件分段终点秒，默认 0.8"`
	BaselineStart float64  `json:"baseline_start,omitempty" jsonschema:"description=EEG 基线起点秒，默认 -0.2"`
	BaselineEnd   float64  `json:"baseline_end,omitempty" jsonschema:"description=EEG 基线终点秒，默认 0"`
	EpochRejectUV float64  `json:"epoch_reject_uv,omitempty" jsonschema:"description=Epoch 峰峰值拒绝阈值微伏；0 时根据数据稳健估计"`
	EnabledSteps  []string `json:"enabled_steps,omitempty" jsonschema:"description=可选 EEG 步骤：bad_channel_detection、bad_channel_interpolation、notch_filter、bandpass_filter、reference_selection、ica_artifact_removal、resample、epoching、baseline、autoreject；省略时执行完整安全流程"`
	SaveOutput    *bool    `json:"save_output,omitempty" jsonschema:"description=是否保存处理后的 FIF 和审计文件；默认 true；用户明确要求不保存时必须设为 false"`
}

// RunNeuroAnalysisTool 执行 NeuroFlow 自己的 Python/MNE 算法，并把紧凑的指标
// JSON 返回给 Agent。只有此工具成功返回的内容才能被表述为“已经计算”。
func RunNeuroAnalysisTool() (tool.InvokableTool, error) {
	return utils.InferTool("run_neuro_analysis",
		"使用本地 Python/MNE 对已导入 EEG 或 fNIRS 数据执行真实计算。EEG full 模式支持坏道检测与插值、陷波、带通、重参考、ICA、重采样、基于 annotations/stim 的事件分段、基线校正和 Epoch 峰峰值伪迹拒绝，并返回处理前后质量与逐步审计记录；fNIRS 支持光密度、TDDR、Beer-Lambert、滤波、耦合质量和 HbO/HbR 统计。需要 dataset_id；不支持 MEG。",
		func(ctx context.Context, input NeuroAnalysisInput) (string, error) {
			saveOutput := true
			if input.SaveOutput != nil {
				saveOutput = *input.SaveOutput
			}
			result, err := ExecuteNeuroAnalysis(ctx, input, saveOutput)
			if err != nil {
				// 数据缺少事件、坐标或参数不适用属于工具层可解释失败。把错误作为
				// 结构化观察结果交还 ReAct Agent，使模型可以说明原因并调整参数，
				// 而不是让 Eino ToolsNode 终止整个 SSE 对话流。
				failure, _ := json.Marshal(map[string]any{
					"ok":         false,
					"code":       "NEURO_ANALYSIS_FAILED",
					"message":    err.Error(),
					"dataset_id": input.DatasetID,
					"retryable":  true,
				})
				return string(failure), nil
			}
			// 波形预览只发给本地 Electron，避免扩大模型上下文。
			delete(result, "preview")
			clean, _ := json.Marshal(result)
			return string(clean), nil
		})
}

// ExecuteNeuroAnalysis 是 Agent function call 和本地 HTTP 接口共用的确定性执行层。
func ExecuteNeuroAnalysis(ctx context.Context, input NeuroAnalysisInput, saveOutput bool) (map[string]any, error) {
	analysisType := strings.ToLower(strings.TrimSpace(input.AnalysisType))
	if analysisType == "" {
		analysisType = "full"
	}
	if analysisType != "summary" && analysisType != "quality" && analysisType != "full" {
		return nil, fmt.Errorf("analysis_type 必须是 summary、quality 或 full")
	}
	if input.StartSeconds < 0 || input.EndSeconds < 0 || (input.EndSeconds > 0 && input.EndSeconds <= input.StartSeconds) {
		return nil, fmt.Errorf("分析时间范围无效")
	}
	if input.HighpassHz < 0 || input.LowpassHz < 0 || input.NotchHz < 0 {
		return nil, fmt.Errorf("滤波频率不能为负数")
	}
	if input.ResampleHz < 0 || input.EpochRejectUV < 0 {
		return nil, fmt.Errorf("重采样频率和 Epoch 拒绝阈值不能为负数")
	}
	// JSON 中省略字段会得到零值。Epoch 的 0 秒起点通常不符合 ERP/BCI 基线流程，
	// 因此在上下界同时为零时应用界面与 MNE 执行器共享的默认时间窗。
	if input.EpochTMin == 0 && input.EpochTMax == 0 {
		input.EpochTMin, input.EpochTMax = -0.2, 0.8
	}
	if input.BaselineStart == 0 && input.BaselineEnd == 0 {
		input.BaselineStart, input.BaselineEnd = -0.2, 0
	}
	path, inspection, ok := dataset.ResolveLocalPath(input.DatasetID)
	if !ok {
		return nil, fmt.Errorf("dataset_id 不存在或后端已重启，请重新导入数据")
	}
	if inspection.Modality != "EEG" && inspection.Modality != "fNIRS" {
		return nil, fmt.Errorf("Python 分析工具当前支持 EEG 和 fNIRS，数据模态为 %s", inspection.Modality)
	}
	script, err := neuroAnalysisScriptPath()
	if err != nil {
		return nil, err
	}
	args := []string{script, path, inspection.Modality, analysisType,
		"--start", fmt.Sprintf("%g", input.StartSeconds), "--end", fmt.Sprintf("%g", input.EndSeconds)}
	if inspection.Modality == "EEG" {
		// 0 会原样传给 Python，表示让自动流程结合采样率和频谱质量选择参数。
		args = append(args, "--highpass-hz", fmt.Sprintf("%g", input.HighpassHz),
			"--lowpass-hz", fmt.Sprintf("%g", input.LowpassHz), "--notch-hz", fmt.Sprintf("%g", input.NotchHz),
			"--resample-hz", fmt.Sprintf("%g", input.ResampleHz),
			"--epoch-tmin", fmt.Sprintf("%g", input.EpochTMin), "--epoch-tmax", fmt.Sprintf("%g", input.EpochTMax),
			"--baseline-start", fmt.Sprintf("%g", input.BaselineStart), "--baseline-end", fmt.Sprintf("%g", input.BaselineEnd),
			"--epoch-reject-uv", fmt.Sprintf("%g", input.EpochRejectUV))
		if len(input.EnabledSteps) > 0 {
			allowed := map[string]bool{"bad_channel_detection": true, "bad_channel_interpolation": true, "notch_filter": true, "bandpass_filter": true, "reference_selection": true, "ica_artifact_removal": true, "resample": true, "epoching": true, "baseline": true, "autoreject": true}
			steps := make([]string, 0, len(input.EnabledSteps))
			for _, step := range input.EnabledSteps {
				step = strings.TrimSpace(step)
				if !allowed[step] {
					return nil, fmt.Errorf("不支持的 EEG 执行步骤: %s", step)
				}
				steps = append(steps, step)
			}
			args = append(args, "--steps", strings.Join(steps, ","))
		}
	}
	if strings.TrimSpace(input.LeftChannel) != "" || strings.TrimSpace(input.RightChannel) != "" {
		if strings.TrimSpace(input.LeftChannel) == "" || strings.TrimSpace(input.RightChannel) == "" {
			return nil, fmt.Errorf("left_channel 和 right_channel 必须同时提供")
		}
		args = append(args, "--left-channel", input.LeftChannel, "--right-channel", input.RightChannel)
	}
	if saveOutput {
		root := filepath.Dir(filepath.Dir(script))
		outputDir := filepath.Join(root, "outputs", input.DatasetID)
		if err := os.MkdirAll(outputDir, 0755); err != nil {
			return nil, fmt.Errorf("创建结果目录: %w", err)
		}
		name := fmt.Sprintf("%s-%s-%s-preprocessed_raw.fif", strings.ToLower(inspection.Modality), analysisType, time.Now().Format("20060102-150405"))
		args = append(args, "--output", filepath.Join(outputDir, name))
	}
	var stdout, stderr bytes.Buffer
	cmd := exec.CommandContext(ctx, "python", args...)
	cmd.Stdout, cmd.Stderr = &stdout, &stderr
	runErr := cmd.Run()
	var result map[string]any
	if err := json.Unmarshal(bytes.TrimSpace(stdout.Bytes()), &result); err != nil {
		return nil, fmt.Errorf("Python 分析器返回无效结果: %w (%s)", err, strings.TrimSpace(stderr.String()))
	}
	if runErr != nil || result["ok"] != true {
		return nil, fmt.Errorf("Python 分析失败: %v", result["message"])
	}
	// 前端只拿项目内相对路径。Electron 主进程会再次验证该路径必须位于 outputs 下，
	// 因而渲染进程既能定位结果，也不会获得任意文件系统访问能力。
	if output, ok := result["output"].(map[string]any); ok && output != nil {
		if fileName, ok := output["file_name"].(string); ok {
			output["relative_path"] = filepath.ToSlash(filepath.Join("outputs", input.DatasetID, fileName))
		}
		if auditName, ok := output["audit_file_name"].(string); ok {
			output["audit_relative_path"] = filepath.ToSlash(filepath.Join("outputs", input.DatasetID, auditName))
		}
		if epochsName, ok := output["epochs_file_name"].(string); ok {
			output["epochs_relative_path"] = filepath.ToSlash(filepath.Join("outputs", input.DatasetID, epochsName))
		}
	}
	result["analysis_id"] = fmt.Sprintf("%d", time.Now().UnixNano())
	result["completed_at"] = time.Now().UTC().Format(time.RFC3339Nano)
	// 存储深拷贝，因为 Agent 返回前会删除自己的 preview 字段。
	if encoded, err := json.Marshal(result); err == nil {
		var snapshot map[string]any
		if json.Unmarshal(encoded, &snapshot) == nil {
			latestAnalysis.Store(input.DatasetID, snapshot)
		}
	}
	return result, nil
}

// LatestNeuroAnalysis 返回本机某个数据集最近一次成功分析的独立副本。
func LatestNeuroAnalysis(datasetID string) (map[string]any, bool) {
	value, ok := latestAnalysis.Load(strings.TrimSpace(datasetID))
	if !ok {
		return nil, false
	}
	encoded, err := json.Marshal(value)
	if err != nil {
		return nil, false
	}
	var result map[string]any
	if json.Unmarshal(encoded, &result) != nil {
		return nil, false
	}
	return result, true
}

// LatestAnalysisOutputPath 返回最近一次已保存的预处理文件，仅供本地波形窗口接口使用。
func LatestAnalysisOutputPath(datasetID string) (string, bool) {
	result, ok := LatestNeuroAnalysis(datasetID)
	if !ok {
		return "", false
	}
	output, ok := result["output"].(map[string]any)
	if !ok || output["saved"] != true {
		return "", false
	}
	relative, ok := output["relative_path"].(string)
	if !ok {
		return "", false
	}
	script, err := neuroAnalysisScriptPath()
	if err != nil {
		return "", false
	}
	root := filepath.Dir(filepath.Dir(script))
	target := filepath.Clean(filepath.Join(root, filepath.FromSlash(relative)))
	outputRoot := filepath.Clean(filepath.Join(root, "outputs"))
	if target != outputRoot && !strings.HasPrefix(target, outputRoot+string(os.PathSeparator)) {
		return "", false
	}
	if info, err := os.Stat(target); err != nil || info.IsDir() {
		return "", false
	}
	return target, true
}

func neuroAnalysisScriptPath() (string, error) {
	candidates := []string{filepath.Join("neuro_service", "analyze_dataset.py")}
	if _, source, _, ok := runtime.Caller(0); ok {
		candidates = append(candidates, filepath.Join(filepath.Dir(source), "..", "..", "..", "..", "neuro_service", "analyze_dataset.py"))
	}
	if executable, err := os.Executable(); err == nil {
		candidates = append(candidates, filepath.Join(filepath.Dir(executable), "neuro_service", "analyze_dataset.py"))
	}
	for _, candidate := range candidates {
		absolute, err := filepath.Abs(candidate)
		if err == nil {
			if info, statErr := os.Stat(absolute); statErr == nil && !info.IsDir() {
				return absolute, nil
			}
		}
	}
	return "", fmt.Errorf("找不到 neuro_service/analyze_dataset.py")
}
