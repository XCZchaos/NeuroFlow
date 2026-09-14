package tools

import (
	"OnCallAgent/internal/server/dataset"
	"context"
	"encoding/json"
	"fmt"
	"math"
	"slices"
	"strings"

	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/components/tool/utils"
)

// AcquisitionConfigInput 是 Agent 从用户自然语言中提取的采集条件。
// 所有字段都代表“用户声明”；只有 DatasetID 对应的 Inspection 才是 MNE 读取的文件事实。
type AcquisitionConfigInput struct {
	DatasetID       string   `json:"dataset_id,omitempty" jsonschema:"description=已导入数据集 ID；没有真实文件时省略"`
	Device          string   `json:"device,omitempty" jsonschema:"description=设备厂商和型号，例如 OpenBCI Cyton"`
	Modality        string   `json:"modality" jsonschema:"description=采集模态：EEG、MEG 或 fNIRS"`
	ChannelCount    int      `json:"channel_count,omitempty" jsonschema:"description=用户声明的采集通道数；未知时为 0"`
	SamplingRateHz  float64  `json:"sampling_rate_hz,omitempty" jsonschema:"description=用户声明的采样率 Hz；未知时为 0"`
	LineFrequencyHz float64  `json:"line_frequency_hz,omitempty" jsonschema:"description=采集环境工频 50 或 60 Hz；未知时为 0"`
	Reference       string   `json:"reference,omitempty" jsonschema:"description=采集参考方式或参考电极；未知时省略"`
	ChannelNames    []string `json:"channel_names,omitempty" jsonschema:"description=用户声明的通道名称列表"`
}

type AcquisitionCheck struct {
	Field    string `json:"field"`
	Status   string `json:"status"`
	Declared any    `json:"declared,omitempty"`
	Observed any    `json:"observed,omitempty"`
	Message  string `json:"message"`
}

type AcquisitionValidation struct {
	Status          string                 `json:"status"`
	Evidence        string                 `json:"evidence"`
	Declared        AcquisitionConfigInput `json:"declared"`
	Observed        *dataset.Inspection    `json:"observed,omitempty"`
	Checks          []AcquisitionCheck     `json:"checks"`
	Warnings        []string               `json:"warnings"`
	Recommendations []string               `json:"recommendations"`
	CanExecute      bool                   `json:"can_execute_preprocessing"`
	DeviceProfile   *DeviceProfile         `json:"device_profile,omitempty"`
}

// DeviceProfile 是保守的设备知识映射。只有厂家固定规格才填写精确值；可配置设备保留为 0，避免误导 Agent。
type DeviceProfile struct {
	CanonicalName        string   `json:"canonical_name"`
	Aliases              []string `json:"aliases"`
	Modality             string   `json:"modality"`
	ChannelCount         int      `json:"channel_count,omitempty"`
	SamplingRateHz       float64  `json:"sampling_rate_hz,omitempty"`
	ChannelNames         []string `json:"channel_names,omitempty"`
	NativeUnit           string   `json:"native_unit"`
	DefaultReference     string   `json:"default_reference"`
	Montage              string   `json:"montage"`
	RequiresConfirmation bool     `json:"requires_confirmation"`
}

var deviceProfiles = []DeviceProfile{
	{CanonicalName: "OpenBCI Cyton", Aliases: []string{"cyton", "openbci cyton"}, Modality: "EEG", ChannelCount: 8, SamplingRateHz: 250, NativeUnit: "uV", DefaultReference: "device configuration dependent", Montage: "match supplied electrode names to standard_1020", RequiresConfirmation: true},
	{CanonicalName: "OpenBCI Ganglion", Aliases: []string{"ganglion", "openbci ganglion"}, Modality: "EEG", ChannelCount: 4, SamplingRateHz: 200, NativeUnit: "uV", DefaultReference: "device configuration dependent", Montage: "match supplied electrode names to standard_1020", RequiresConfirmation: true},
	{CanonicalName: "Muse 2", Aliases: []string{"muse", "muse 2", "muse2"}, Modality: "EEG", ChannelCount: 4, SamplingRateHz: 256, ChannelNames: []string{"TP9", "AF7", "AF8", "TP10"}, NativeUnit: "uV", DefaultReference: "device reference; verify auxiliary/reference electrode metadata", Montage: "standard_1020", RequiresConfirmation: true},
	{CanonicalName: "Brain Products actiCHamp", Aliases: []string{"actichamp", "brain products actichamp"}, Modality: "EEG", NativeUnit: "uV", DefaultReference: "recording configuration dependent", Montage: "use cap/channel coordinate file", RequiresConfirmation: true},
	{CanonicalName: "g.tec g.Nautilus", Aliases: []string{"g.nautilus", "gnautilus", "gtec g.nautilus"}, Modality: "EEG", NativeUnit: "uV", DefaultReference: "recording configuration dependent", Montage: "use cap/channel coordinate file", RequiresConfirmation: true},
}

func findDeviceProfile(name string) *DeviceProfile {
	needle := strings.ToLower(strings.TrimSpace(name))
	if needle == "" {
		return nil
	}
	for _, profile := range deviceProfiles {
		for _, alias := range append(profile.Aliases, profile.CanonicalName) {
			if strings.Contains(needle, strings.ToLower(alias)) {
				copyOfProfile := profile
				return &copyOfProfile
			}
		}
	}
	return nil
}

// ValidateAcquisitionConfigTool 将自然语言中的采集配置变成可审计 JSON，并在有数据集时
// 与 MNE Inspection 对照。它不读取波形，也不执行预处理。
func ValidateAcquisitionConfigTool() (tool.InvokableTool, error) {
	return utils.InferTool(
		"validate_acquisition_config",
		"解析并验证用户描述的 EEG、MEG 或 fNIRS 采集配置，包括设备、通道数、通道名、采样率、工频和参考方式。提供 dataset_id 时与 MNE 读取的文件元数据逐项核对；没有文件时只做物理约束和流程适用性检查，不得声称已经验证真实数据。",
		func(ctx context.Context, input AcquisitionConfigInput) (string, error) {
			_ = ctx
			var observed *dataset.Inspection
			if strings.TrimSpace(input.DatasetID) != "" {
				if record, ok := dataset.Get(input.DatasetID); ok {
					copyOfInspection := record.Inspection
					observed = &copyOfInspection
				}
			}
			result := BuildAcquisitionValidation(input, observed)
			payload, err := json.Marshal(result)
			if err != nil {
				return "", fmt.Errorf("序列化采集配置验证结果: %w", err)
			}
			return string(payload), nil
		},
	)
}

// BuildAcquisitionValidation 是不依赖大模型的确定性规则层，便于测试和复用。
func BuildAcquisitionValidation(input AcquisitionConfigInput, observed *dataset.Inspection) AcquisitionValidation {
	input.Device = strings.TrimSpace(input.Device)
	input.Modality = normalizeModality(input.Modality)
	input.Reference = strings.TrimSpace(input.Reference)
	input.ChannelNames = cleanChannelNames(input.ChannelNames)
	result := AcquisitionValidation{Declared: input, Observed: observed, Evidence: "user_declaration_only"}
	result.DeviceProfile = findDeviceProfile(input.Device)
	if result.DeviceProfile != nil {
		profile := result.DeviceProfile
		result.Recommendations = append(result.Recommendations, "设备知识映射仅用于校验；参考电极、帽型和固件设置仍需从文件或用户确认")
		if input.Modality != "" && profile.Modality != input.Modality {
			result.Checks = append(result.Checks, AcquisitionCheck{Field: "device_modality", Status: "conflict", Declared: input.Modality, Observed: profile.Modality, Message: "声明模态与设备知识映射冲突"})
		}
		if profile.ChannelCount > 0 && input.ChannelCount > 0 && profile.ChannelCount != input.ChannelCount {
			result.Checks = append(result.Checks, AcquisitionCheck{Field: "device_channel_count", Status: "conflict", Declared: input.ChannelCount, Observed: profile.ChannelCount, Message: "声明通道数与该设备的固定规格不一致"})
		}
		if profile.SamplingRateHz > 0 && input.SamplingRateHz > 0 && math.Abs(profile.SamplingRateHz-input.SamplingRateHz) > .01 {
			result.Checks = append(result.Checks, AcquisitionCheck{Field: "device_sampling_rate_hz", Status: "conflict", Declared: input.SamplingRateHz, Observed: profile.SamplingRateHz, Message: "声明采样率与设备知识映射不一致，请确认设备模式或固件设置"})
		}
	}

	if input.Modality == "" {
		result.Checks = append(result.Checks, AcquisitionCheck{Field: "modality", Status: "invalid", Message: "模态必须是 EEG、MEG 或 fNIRS"})
	}
	if input.ChannelCount < 0 || input.SamplingRateHz < 0 || input.LineFrequencyHz < 0 {
		result.Checks = append(result.Checks, AcquisitionCheck{Field: "numeric_ranges", Status: "invalid", Message: "通道数和频率不能为负数"})
	}
	if input.ChannelCount > 0 && len(input.ChannelNames) > 0 && input.ChannelCount != len(input.ChannelNames) {
		result.Checks = append(result.Checks, AcquisitionCheck{Field: "channel_names", Status: "conflict", Declared: input.ChannelCount, Observed: len(input.ChannelNames), Message: "声明通道数与通道名称数量不一致"})
	}
	if input.SamplingRateHz > 0 {
		nyquist := input.SamplingRateHz / 2
		result.Recommendations = append(result.Recommendations, fmt.Sprintf("滤波上限必须低于 Nyquist 频率 %.3g Hz", nyquist))
		if input.LineFrequencyHz > 0 && input.LineFrequencyHz >= nyquist {
			result.Checks = append(result.Checks, AcquisitionCheck{Field: "line_frequency_hz", Status: "invalid", Declared: input.LineFrequencyHz, Message: "工频不低于 Nyquist，不能直接执行该陷波"})
		}
	}
	if input.LineFrequencyHz > 0 && input.LineFrequencyHz != 50 && input.LineFrequencyHz != 60 {
		result.Warnings = append(result.Warnings, "工频通常为 50 Hz 或 60 Hz，请核对采集地点和设备设置")
	}
	if input.Modality == "EEG" && input.ChannelCount > 0 {
		if input.ChannelCount < 3 {
			result.Warnings = append(result.Warnings, "少于 3 个 EEG 通道时不自动使用平均参考")
		}
		if input.ChannelCount < 4 {
			result.Warnings = append(result.Warnings, "少于 4 个可用 EEG 通道时当前自动流程不会执行 ICA")
		}
	}

	if strings.TrimSpace(input.DatasetID) != "" && observed == nil {
		result.Checks = append(result.Checks, AcquisitionCheck{Field: "dataset_id", Status: "unverified", Declared: input.DatasetID, Message: "数据集不存在或后端已重启，需要重新注册文件"})
	} else if observed != nil {
		result.Evidence = "compared_with_mne_file_metadata"
		compareAcquisitionWithFile(&result, input, *observed)
	}

	invalid, conflict := false, false
	for _, check := range result.Checks {
		invalid = invalid || check.Status == "invalid"
		conflict = conflict || check.Status == "conflict"
	}
	switch {
	case invalid:
		result.Status = "invalid"
	case conflict:
		result.Status = "conflict"
	case observed != nil:
		result.Status = "validated_against_dataset"
	default:
		result.Status = "parsed_not_file_verified"
	}
	result.CanExecute = observed != nil && !invalid && !conflict
	return result
}

func compareAcquisitionWithFile(result *AcquisitionValidation, input AcquisitionConfigInput, observed dataset.Inspection) {
	if input.Modality != "" {
		addEqualityCheck(result, "modality", input.Modality, observed.Modality,
			strings.EqualFold(input.Modality, observed.Modality))
	}
	if input.ChannelCount > 0 {
		addEqualityCheck(result, "channel_count", input.ChannelCount, observed.ChannelCount,
			input.ChannelCount == observed.ChannelCount)
	}
	if input.SamplingRateHz > 0 {
		addEqualityCheck(result, "sampling_rate_hz", input.SamplingRateHz, observed.SamplingRateHz,
			math.Abs(input.SamplingRateHz-observed.SamplingRateHz) <= math.Max(0.01, input.SamplingRateHz*1e-6))
	}
	if input.LineFrequencyHz > 0 && observed.LineFrequencyHz != nil {
		addEqualityCheck(result, "line_frequency_hz", input.LineFrequencyHz, *observed.LineFrequencyHz,
			math.Abs(input.LineFrequencyHz-*observed.LineFrequencyHz) < 0.01)
	}
	if len(input.ChannelNames) > 0 {
		declared := normalizedChannelNames(input.ChannelNames)
		actual := normalizedChannelNames(observed.ChannelNames)
		missing, unexpected := difference(declared, actual), difference(actual, declared)
		status := "match"
		message := "声明通道名称与文件一致"
		if len(missing) > 0 || len(unexpected) > 0 {
			status, message = "conflict", fmt.Sprintf("文件缺少声明通道 %v；文件额外通道 %v", missing, unexpected)
		}
		result.Checks = append(result.Checks, AcquisitionCheck{Field: "channel_names", Status: status, Declared: input.ChannelNames, Observed: observed.ChannelNames, Message: message})
	}
}

func addEqualityCheck(result *AcquisitionValidation, field string, declared, observed any, equal bool) {
	status, message := "match", "用户声明与 MNE 文件元数据一致"
	if !equal {
		status, message = "conflict", "用户声明与 MNE 文件元数据不一致；真实执行应采用文件值并要求用户确认"
	}
	result.Checks = append(result.Checks, AcquisitionCheck{Field: field, Status: status, Declared: declared, Observed: observed, Message: message})
}

func cleanChannelNames(names []string) []string {
	cleaned := make([]string, 0, len(names))
	for _, name := range names {
		if value := strings.TrimSpace(name); value != "" && !slices.Contains(cleaned, value) {
			cleaned = append(cleaned, value)
		}
	}
	return cleaned
}

func normalizedChannelNames(names []string) []string {
	result := make([]string, 0, len(names))
	for _, name := range names {
		result = append(result, strings.ToLower(strings.TrimSpace(name)))
	}
	slices.Sort(result)
	return result
}

func difference(left, right []string) []string {
	result := make([]string, 0)
	for _, value := range left {
		if !slices.Contains(right, value) {
			result = append(result, value)
		}
	}
	return result
}
