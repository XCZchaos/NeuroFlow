package tools

import "testing"

func TestBuildNeuroPreprocessingDraftEEG(t *testing.T) {
	plan, err := BuildNeuroPreprocessingDraft(NeuroPlanInput{
		Modality:      "eeg",
		Goal:          "运动想象频谱分析",
		SamplingRate:  1000,
		LineFrequency: 50,
	})
	if err != nil {
		t.Fatalf("build draft: %v", err)
	}
	if plan.Modality != "EEG" || plan.Executable {
		t.Fatalf("unexpected plan header: %+v", plan)
	}
	if plan.Status != "draft_not_executed" {
		t.Fatalf("unexpected status: %s", plan.Status)
	}
	if len(plan.Steps) == 0 || plan.Steps[0].Tool != "inspect_dataset" {
		t.Fatalf("inspection must be the first step: %+v", plan.Steps)
	}
	if len(plan.Assumptions) != 0 {
		t.Fatalf("known sampling and line frequency should not add assumptions: %v", plan.Assumptions)
	}
}

func TestBuildNeuroPreprocessingDraftFNIRS(t *testing.T) {
	plan, err := BuildNeuroPreprocessingDraft(NeuroPlanInput{
		Modality: "f-nirs",
		Goal:     "评估任务期 HbO 和 HbR 变化",
	})
	if err != nil {
		t.Fatalf("build draft: %v", err)
	}
	if plan.Modality != "fNIRS" {
		t.Fatalf("unexpected normalized modality: %s", plan.Modality)
	}
	if len(plan.Assumptions) != 2 {
		t.Fatalf("unknown acquisition metadata should be explicit: %v", plan.Assumptions)
	}
	for _, step := range plan.Steps {
		if step.Tool == "set_eeg_reference" || step.Tool == "reduce_meg_environmental_noise" {
			t.Fatalf("fNIRS draft contains a tool from another modality: %s", step.Tool)
		}
	}
}

func TestBuildNeuroPreprocessingDraftRejectsInvalidInput(t *testing.T) {
	if _, err := BuildNeuroPreprocessingDraft(NeuroPlanInput{Modality: "MRI", Goal: "test"}); err == nil {
		t.Fatal("expected unsupported modality error")
	}
	if _, err := BuildNeuroPreprocessingDraft(NeuroPlanInput{Modality: "EEG"}); err == nil {
		t.Fatal("expected empty goal error")
	}
}
