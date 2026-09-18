package tools

import (
	"OnCallAgent/internal/server/dataset"
	"slices"
	"strings"
	"testing"
)

func TestBuildAcquisitionValidationDeclaredTwoChannelEEG(t *testing.T) {
	result := BuildAcquisitionValidation(AcquisitionConfigInput{
		Device: "Example EEG", Modality: "EEG", ChannelCount: 2,
		SamplingRateHz: 250, LineFrequencyHz: 50, ChannelNames: []string{"C3", "C4"},
	}, nil)
	if result.Status != "parsed_not_file_verified" || result.CanExecute {
		t.Fatalf("unexpected declared-only result: %+v", result)
	}
	if len(result.Warnings) < 2 {
		t.Fatalf("expected reference and ICA warnings, got %v", result.Warnings)
	}
}

func TestValidateAcquisitionEvidenceRequiresCurrentUserQuote(t *testing.T) {
	input := AcquisitionConfigInput{
		Modality: "EEG", ChannelCount: 2, SamplingRateHz: 250,
		FieldEvidence: map[string]string{"channel_count": "2通道", "sampling_rate_hz": "250Hz"},
	}
	if err := validateAcquisitionEvidence(input, "这是2通道、250Hz的EEG"); err != nil {
		t.Fatalf("explicit values should pass: %v", err)
	}
	input.FieldEvidence["sampling_rate_hz"] = "256Hz"
	if err := validateAcquisitionEvidence(input, "这是2通道、250Hz的EEG"); err == nil {
		t.Fatal("a quote absent from the current user message must be rejected")
	}
	input.FieldEvidence["sampling_rate_hz"] = "250Hz"
	input.ChannelCount = 25
	if err := validateAcquisitionEvidence(input, "这是2通道、250Hz的EEG"); err == nil || !strings.Contains(err.Error(), "channel_count") {
		t.Fatalf("a mismatched value must be rejected: %v", err)
	}
}

func TestValidateAcquisitionEvidenceLeavesFileFactsUnknown(t *testing.T) {
	input := AcquisitionConfigInput{DatasetID: "dataset-1", Modality: "EEG"}
	if err := validateAcquisitionEvidence(input, "请检查我上传的数据"); err != nil {
		t.Fatalf("unknown user declarations should remain omitted: %v", err)
	}
	input.SamplingRateHz = 250 // 可能是模型从设备说明或文件推断出的数值，不能冒充用户声明。
	if err := validateAcquisitionEvidence(input, "请检查我上传的数据"); err == nil {
		t.Fatal("an unquoted inferred sample rate must be rejected")
	}
}

func TestValidateAcquisitionConfigToolSchema(t *testing.T) {
	if _, err := ValidateAcquisitionConfigTool(); err != nil {
		t.Fatalf("failed to build acquisition config tool: %v", err)
	}
}

func TestDeviceProfileDetectsConflict(t *testing.T) {
	result := BuildAcquisitionValidation(AcquisitionConfigInput{
		Device: "OpenBCI Cyton", Modality: "EEG", ChannelCount: 2, SamplingRateHz: 250,
	}, nil)
	if result.DeviceProfile == nil || result.DeviceProfile.CanonicalName != "OpenBCI Cyton" {
		t.Fatalf("device profile was not resolved: %+v", result.DeviceProfile)
	}
	if result.Status != "conflict" {
		t.Fatalf("expected device channel conflict, got %+v", result)
	}
}

func TestBuildAcquisitionValidationFindsFileConflicts(t *testing.T) {
	lineFrequency := 50.0
	observed := &dataset.Inspection{OK: true, Modality: "EEG", ChannelCount: 4,
		SamplingRateHz: 256, LineFrequencyHz: &lineFrequency,
		ChannelNames: []string{"F3", "F4", "C3", "C4"}}
	result := BuildAcquisitionValidation(AcquisitionConfigInput{
		DatasetID: "dataset-1", Modality: "EEG", ChannelCount: 2,
		SamplingRateHz: 250, ChannelNames: []string{"C3", "C4"},
	}, observed)
	if result.Status != "conflict" || result.CanExecute {
		t.Fatalf("expected conflict, got %+v", result)
	}
	fields := make([]string, 0, len(result.Checks))
	for _, check := range result.Checks {
		if check.Status == "conflict" {
			fields = append(fields, check.Field)
		}
	}
	for _, field := range []string{"channel_count", "sampling_rate_hz", "channel_names"} {
		if !slices.Contains(fields, field) {
			t.Fatalf("missing conflict for %s: %+v", field, result.Checks)
		}
	}
}
