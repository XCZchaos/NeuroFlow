package tools

import (
	"OnCallAgent/internal/server/ai/toolinput"
	"testing"
)

func TestWorkspaceToolBoundary(t *testing.T) {
	tests := []struct {
		page, id, name, args string
		blocked              bool
	}{
		{"eeg", "eeg-1", "run_neuro_analysis", `{"dataset_id":"eeg-1"}`, false},
		{"meg", "", "run_neuro_analysis", `{"dataset_id":"eeg-1"}`, true},
		{"meg", "meg-1", "inspect_dataset", `{"dataset_id":"eeg-1"}`, true},
		{"ppg", "", "run_neuro_analysis", `{"dataset_id":"eeg-1"}`, true},
		{"ppg", "", "run_ppg_analysis", `{"action":"analyze"}`, false},
		{"eeg", "eeg-1", "run_ppg_analysis", `{"action":"analyze"}`, true},
		{"help", "", "manage_preprocessing_task", `{"action":"resume"}`, true},
		{"history", "eeg-1", "run_neuro_analysis", `{"dataset_id":"eeg-1"}`, true},
		{"datasets", "eeg-1", "inspect_dataset", `{"dataset_id":"eeg-1"}`, false},
		{"datasets", "eeg-1", "run_neuro_analysis", `{"dataset_id":"eeg-1","analysis_type":"quality"}`, false},
		{"history", "eeg-1", "run_neuro_analysis", `{"dataset_id":"eeg-1","analysis_type":"summary","save_output":true}`, false},
		{"history", "eeg-1", "run_neuro_analysis", `{"dataset_id":"eeg-1","analysis_type":"full"}`, true},
		{"history", "eeg-1", "run_neuro_analysis", `{"dataset_id":"other","analysis_type":"quality"}`, true},
		{"datasets", "", "run_neurokit_analysis", `{}`, true},
		{"history", "eeg-1", "run_neurokit_analysis", `{"dataset_id":"eeg-1","method":"gfp"}`, false},
		{"help", "", "query_internal_docs", `{"query":"how to import CSV"}`, false},
	}
	for _, test := range tests {
		t.Run(test.page+"/"+test.name, func(t *testing.T) {
			message := workspaceToolError(toolinput.Workspace{Page: test.page, DatasetID: test.id}, test.name, test.args)
			if (message != "") != test.blocked {
				t.Fatalf("blocked=%v, message=%s", test.blocked, message)
			}
		})
	}
}
