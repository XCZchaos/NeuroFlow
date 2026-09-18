package tools

import (
	"OnCallAgent/internal/server/taskstate"
	"context"
	"strings"
	"testing"
)

func TestNeuroKitToolAndArgumentGuards(t *testing.T) {
	if _, err := RunNeuroKitAnalysisTool(); err != nil {
		t.Fatalf("cannot expose NeuroKit2 function call: %v", err)
	}
	for _, input := range []NeuroKitAnalysisInput{
		{DatasetID: "missing", Method: "arbitrary_python"},
		{DatasetID: "missing", Method: "gfp", StartSeconds: 5, EndSeconds: 3},
	} {
		if _, err := ExecuteNeuroKitAnalysis(context.Background(), input); err == nil {
			t.Fatalf("invalid arguments should fail before Python is started: %+v", input)
		}
	}
	_, err := ExecuteNeuroKitAnalysis(context.Background(), NeuroKitAnalysisInput{DatasetID: "missing", Method: "gfp"})
	if err == nil || !strings.Contains(err.Error(), "dataset_id") {
		t.Fatalf("unregistered data should not reach Python: %v", err)
	}
}

func TestNeuroKitRejectsDifferentSessionDataset(t *testing.T) {
	ctx := taskstate.WithScope(context.Background(), taskstate.Scope{DatasetID: "bound-dataset"})
	_, err := ExecuteNeuroKitAnalysis(ctx, NeuroKitAnalysisInput{DatasetID: "other-dataset", Method: "gfp"})
	if err == nil || !strings.Contains(err.Error(), "当前会话绑定") {
		t.Fatalf("cross-session dataset call must be rejected: %v", err)
	}
}
