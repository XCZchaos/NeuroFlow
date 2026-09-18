package tools

import (
	"context"
	"strings"
	"testing"

	"OnCallAgent/internal/server/taskstate"
)

func TestFullAnalysisRequiresPersistedWorkflow(t *testing.T) {
	ctx := taskstate.WithScope(context.Background(), taskstate.Scope{DatasetID: "bound"})
	_, err := ExecuteNeuroAnalysis(ctx, NeuroAnalysisInput{DatasetID: "bound", AnalysisType: "full"}, false)
	if err == nil || !strings.Contains(err.Error(), "WORKFLOW_REQUIRED") {
		t.Fatalf("full analysis bypassed workflow: %v", err)
	}
	// A validated resume supplies a private context value; it can pass the
	// workflow gate and reach normal dataset validation.
	_, err = ExecuteNeuroAnalysis(withWorkflowExecution(ctx), NeuroAnalysisInput{DatasetID: "bound", AnalysisType: "full"}, false)
	if err == nil || strings.Contains(err.Error(), "WORKFLOW_REQUIRED") {
		t.Fatalf("workflow resume did not pass gate: %v", err)
	}
}

func TestVerifyWorkflowResult(t *testing.T) {
	plan := NeuroAnalysisInput{AnalysisType: "full"}
	valid := map[string]any{"ok": true, "modality": "EEG", "output": map[string]any{"saved": false},
		"result": map[string]any{"execution_plan": []any{map[string]any{"step": "filter", "status": "completed"}}}}
	if err := verifyWorkflowResult(valid, plan, false); err != nil {
		t.Fatal(err)
	}
	if err := verifyWorkflowResult(valid, plan, true); err == nil {
		t.Fatal("unsaved output accepted for a save request")
	}
	valid["result"] = map[string]any{"execution_plan": []any{map[string]any{"step": "filter", "status": "failed"}}}
	if err := verifyWorkflowResult(valid, plan, false); err == nil {
		t.Fatal("failed processing step accepted")
	}
}
