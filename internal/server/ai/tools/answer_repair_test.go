package tools

import (
	"context"
	"strings"
	"testing"

	"OnCallAgent/internal/server/ai/toolinput"
	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/components/tool/utils"
)

func TestAnswerRepairBlocksActionsAtExecutionBoundary(t *testing.T) {
	for _, test := range []struct {
		name, args string
		allowed    bool
	}{
		{"run_neuro_analysis", `{"analysis_type":"full"}`, false},
		{"run_neurokit_analysis", `{}`, false},
		{"suggest_sleep_stages", `{}`, false},
		{"run_ppg_analysis", `{"action":"analyze"}`, false},
		{"manage_preprocessing_task", `{"action":"resume"}`, false},
		{"manage_preprocessing_task", `{"action":"get"}`, true},
		{"inspect_dataset", `{}`, true},
		{"query_internal_docs", `{}`, true},
		{"audit_knowledge_evidence", `{}`, true},
		{"future_write_tool", `{}`, false},
	} {
		t.Run(test.name+test.args, func(t *testing.T) {
			calls := 0
			original, err := utils.InferTool(test.name, "test", func(context.Context, map[string]any) (string, error) { calls++; return `{"ok":true}`, nil })
			if err != nil {
				t.Fatal(err)
			}
			ctx := toolinput.WithAnswerRepair(context.Background())
			wrapped, err := ScopeTool(ctx, original)
			if err != nil {
				t.Fatal(err)
			}
			result, err := wrapped.(tool.InvokableTool).InvokableRun(ctx, test.args)
			if err != nil || (calls == 1) != test.allowed || (!test.allowed && !strings.Contains(result, "ANSWER_REPAIR_READ_ONLY")) {
				t.Fatalf("calls=%d allowed=%v result=%s err=%v", calls, test.allowed, result, err)
			}
		})
	}
}

func TestUnavailableKnowledgeIsObservationNotFatalToolError(t *testing.T) {
	// 此测试不并行，恢复全局检索器，避免影响其他工具测试。
	mu.Lock()
	old := ragToolGlobal
	ragToolGlobal = nil
	mu.Unlock()
	defer func() { mu.Lock(); ragToolGlobal = old; mu.Unlock() }()
	tool, err := RetrieveTool()
	if err != nil {
		t.Fatal(err)
	}
	result, err := tool.InvokableRun(context.Background(), `{"query":"EEG"}`)
	if err != nil || !strings.Contains(result, "KNOWLEDGE_UNAVAILABLE") {
		t.Fatalf("retrieval stopped agent: %s %v", result, err)
	}
}
