package tools

import (
	"OnCallAgent/internal/server/dataset"
	"slices"
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

func TestValidateAcquisitionConfigToolSchema(t *testing.T) {
	if _, err := ValidateAcquisitionConfigTool(); err != nil {
		t.Fatalf("failed to build acquisition config tool: %v", err)
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
