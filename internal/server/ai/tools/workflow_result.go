package tools

import (
	"fmt"
	"strings"

	"OnCallAgent/internal/server/taskstate"
)

func workflowSteps() []taskstate.Step {
	return []taskstate.Step{
		{Name: "validate_import", Status: "pending"},
		{Name: "run_neuro_analysis", Status: "pending"},
		{Name: "verify_result", Status: "pending"},
	}
}

// verifyWorkflowResult checks machine-readable tool evidence, never the model's
// description. A failed or mismatched run cannot become a completed task.
func verifyWorkflowResult(result map[string]any, plan NeuroAnalysisInput, save bool) error {
	if result["ok"] != true {
		return fmt.Errorf("analysis did not report success")
	}
	modality, _ := result["modality"].(string)
	if modality != "EEG" && modality != "MEG" && modality != "fNIRS" {
		return fmt.Errorf("analysis returned an unknown modality")
	}
	output, ok := result["output"].(map[string]any)
	if !ok || output["saved"] != save {
		return fmt.Errorf("saved output does not match the authorized plan")
	}
	if save {
		name, _ := output["file_name"].(string)
		if strings.TrimSpace(name) == "" {
			return fmt.Errorf("saved output has no file name")
		}
	}
	if strings.EqualFold(strings.TrimSpace(plan.AnalysisType), "full") || plan.AnalysisType == "" {
		if modality == "EEG" || modality == "MEG" {
			body, ok := result["result"].(map[string]any)
			if !ok {
				return fmt.Errorf("full analysis has no result body")
			}
			steps, ok := body["execution_plan"].([]any)
			if !ok || len(steps) == 0 {
				return fmt.Errorf("full analysis has no execution plan")
			}
			for _, raw := range steps {
				step, ok := raw.(map[string]any)
				if !ok {
					return fmt.Errorf("invalid execution step")
				}
				if step["status"] == "failed" {
					return fmt.Errorf("execution step failed: %v", step["step"])
				}
			}
		}
	}
	return nil
}
