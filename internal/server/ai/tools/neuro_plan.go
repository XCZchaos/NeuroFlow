package tools

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/components/tool/utils"
)

type NeuroPlanInput struct {
	Modality      string  `json:"modality" jsonschema:"description=数据模态，只允许 EEG、MEG 或 fNIRS"`
	Goal          string  `json:"goal" jsonschema:"description=用户的研究或预处理目标"`
	SamplingRate  float64 `json:"sampling_rate,omitempty" jsonschema:"description=已由数据检查确认的采样率；未知时填 0"`
	LineFrequency float64 `json:"line_frequency,omitempty" jsonschema:"description=已确认的工频；未知时填 0"`
}

type NeuroPlanStep struct {
	ID             string         `json:"id"`
	Tool           string         `json:"tool"`
	Parameters     map[string]any `json:"parameters"`
	Reason         string         `json:"reason"`
	RequiresReview bool           `json:"requires_review"`
}

type NeuroPlanOutput struct {
	Status      string          `json:"status"`
	Modality    string          `json:"modality"`
	Goal        string          `json:"goal"`
	Executable  bool            `json:"executable"`
	Assumptions []string        `json:"assumptions"`
	Steps       []NeuroPlanStep `json:"steps"`
	Warnings    []string        `json:"warnings"`
}

func NeuroPreprocessingDraftTool() (tool.InvokableTool, error) {
	return utils.InferTool(
		"create_neuro_preprocessing_draft",
		"为 EEG、MEG 或 fNIRS 生成结构化预处理草案。该工具只规划，不读取文件、不执行算法。用户询问预处理步骤、流程或参数时使用。",
		func(ctx context.Context, input NeuroPlanInput) (string, error) {
			plan, err := BuildNeuroPreprocessingDraft(input)
			if err != nil {
				return "", err
			}
			payload, err := json.Marshal(plan)
			if err != nil {
				return "", fmt.Errorf("序列化预处理草案失败: %w", err)
			}
			return string(payload), nil
		},
	)
}

// BuildNeuroPreprocessingDraft creates a deterministic, non-executable draft.
// It is exported so HTTP handlers and the Agent tool use the same validation.
func BuildNeuroPreprocessingDraft(input NeuroPlanInput) (NeuroPlanOutput, error) {
	modality := normalizeModality(input.Modality)
	if modality == "" {
		return NeuroPlanOutput{}, fmt.Errorf("不支持的模态 %q，只允许 EEG、MEG 或 fNIRS", input.Modality)
	}
	if strings.TrimSpace(input.Goal) == "" {
		return NeuroPlanOutput{}, fmt.Errorf("研究目标不能为空")
	}

	plan := NeuroPlanOutput{
		Status:     "draft_not_executed",
		Modality:   modality,
		Goal:       strings.TrimSpace(input.Goal),
		Executable: false,
		Warnings: []string{
			"这是预处理草案，当前工具没有读取数据或执行任何算法。",
			"运行前必须由数据检查服务验证通道类型、事件、采样率和参数范围。",
		},
	}
	if input.SamplingRate <= 0 {
		plan.Assumptions = append(plan.Assumptions, "采样率未知，滤波上限必须在读取数据后按 Nyquist 频率校验。")
	}
	if input.LineFrequency <= 0 {
		plan.Assumptions = append(plan.Assumptions, "工频未知，需要从采集地点或功率谱确认 50 Hz/60 Hz。")
	}

	switch modality {
	case "EEG":
		plan.Steps = eegDraft(input)
	case "MEG":
		plan.Steps = megDraft()
	case "fNIRS":
		plan.Steps = fnirsDraft()
	}
	return plan, nil
}

func normalizeModality(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "eeg":
		return "EEG"
	case "meg":
		return "MEG"
	case "fnirs", "f-nirs", "nirs":
		return "fNIRS"
	default:
		return ""
	}
}

func eegDraft(input NeuroPlanInput) []NeuroPlanStep {
	return []NeuroPlanStep{
		{ID: "inspect", Tool: "inspect_dataset", Parameters: map[string]any{"quick_quality": true}, Reason: "确认通道、采样率、事件和基础质量"},
		{ID: "notch", Tool: "notch_filter", Parameters: map[string]any{"frequency_hz": input.LineFrequency}, Reason: "仅在质量检查确认工频噪声后使用", RequiresReview: input.LineFrequency <= 0},
		{ID: "bandpass", Tool: "bandpass_filter", Parameters: map[string]any{"low_hz": 1.0, "high_hz": 40.0}, Reason: "提供常用起点，最终范围应按研究目标调整", RequiresReview: true},
		{ID: "bad_channels", Tool: "detect_bad_channels", Parameters: map[string]any{"method": "robust_statistics"}, Reason: "在重参考和 ICA 前识别异常通道", RequiresReview: true},
		{ID: "reference", Tool: "set_eeg_reference", Parameters: map[string]any{"reference": "average"}, Reason: "平均参考是常见起点，但必须结合设备和研究设计确认", RequiresReview: true},
		{ID: "ica", Tool: "fit_ica", Parameters: map[string]any{"classify_components": true}, Reason: "识别眼动、心电等独立成分", RequiresReview: true},
		{ID: "quality", Tool: "evaluate_quality", Parameters: map[string]any{"compare_with_input": true}, Reason: "检查去噪效果与信号保留情况"},
	}
}

func megDraft() []NeuroPlanStep {
	return []NeuroPlanStep{
		{ID: "inspect", Tool: "inspect_dataset", Parameters: map[string]any{"quick_quality": true}, Reason: "确认设备类型、传感器、头位和补偿信息"},
		{ID: "bad_channels", Tool: "detect_bad_channels", Parameters: map[string]any{"method": "meg_sensor_statistics"}, Reason: "识别跳变和异常传感器", RequiresReview: true},
		{ID: "environment", Tool: "reduce_meg_environmental_noise", Parameters: map[string]any{"method": "auto_by_device"}, Reason: "根据设备能力选择 SSS、参考传感器或其他方法", RequiresReview: true},
		{ID: "bandpass", Tool: "bandpass_filter", Parameters: map[string]any{"low_hz": 1.0, "high_hz": 40.0}, Reason: "常用起点，需按研究目标和采样率调整", RequiresReview: true},
		{ID: "artifacts", Tool: "fit_ica", Parameters: map[string]any{"use_eog_ecg": true}, Reason: "辅助识别眼动与心电伪迹", RequiresReview: true},
		{ID: "quality", Tool: "evaluate_quality", Parameters: map[string]any{"compare_with_input": true}, Reason: "检查环境噪声、坏道和信号保留情况"},
	}
}

func fnirsDraft() []NeuroPlanStep {
	return []NeuroPlanStep{
		{ID: "inspect", Tool: "inspect_dataset", Parameters: map[string]any{"quick_quality": true}, Reason: "确认光源、探测器、波长、距离和数据类型"},
		{ID: "coupling", Tool: "compute_scalp_coupling_index", Parameters: map[string]any{}, Reason: "识别耦合质量较差的通道", RequiresReview: true},
		{ID: "optical_density", Tool: "convert_to_optical_density", Parameters: map[string]any{}, Reason: "将连续波光强转换为光密度"},
		{ID: "motion", Tool: "correct_fnirs_motion", Parameters: map[string]any{"method": "auto"}, Reason: "根据运动伪迹特征选择校正方法", RequiresReview: true},
		{ID: "beer_lambert", Tool: "beer_lambert_law", Parameters: map[string]any{}, Reason: "计算 HbO 与 HbR 浓度变化", RequiresReview: true},
		{ID: "quality", Tool: "evaluate_quality", Parameters: map[string]any{"compare_with_input": true}, Reason: "检查耦合、运动伪迹和信号保留情况"},
	}
}
