package chat

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"OnCallAgent/internal/server/ai/toolinput"
	"OnCallAgent/internal/server/taskstate"
	"OnCallAgent/pkg/config"
)

// 模拟模型根据真实工具反馈选择后续调用，走 Eino 和 SQLite，验证业务错误
// 不会终止 ReAct 循环。它测试协议与状态保护，不代表真实模型的自主决策准确率。
func TestReActReceivesTaskFailureAndContinuesWithStateLookup(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	db, err := sql.Open("sqlite", filepath.Join(t.TempDir(), "feedback.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)
	if _, err = db.Exec(`CREATE TABLE sessions(id TEXT PRIMARY KEY); INSERT INTO sessions VALUES('feedback')`); err != nil {
		t.Fatal(err)
	}
	store := &taskstate.Store{DB: db}
	if err = store.Init(ctx); err != nil {
		t.Fatal(err)
	}
	state := &taskstate.State{ID: "waiting", SessionID: "feedback", DatasetID: "bound", Status: "waiting_for_input",
		Fields: []taskstate.Field{{Name: "unit", Question: "Signal unit?"}}}
	if err = store.Save(ctx, state); err != nil {
		t.Fatal(err)
	}
	before, _ := json.Marshal(state)
	var calls atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Messages []struct{ Role, Content string } `json:"messages"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || len(req.Messages) == 0 {
			t.Errorf("invalid model request: %v", err)
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}
		n := calls.Add(1)
		last := req.Messages[len(req.Messages)-1]
		args := `{"action":"resume","revision":1}`
		final := false
		switch n {
		case 1:
		case 2:
			var feedback struct {
				OK, Completed bool
				Code, Message string
			}
			if last.Role != "tool" || json.Unmarshal([]byte(last.Content), &feedback) != nil || feedback.OK || feedback.Completed || feedback.Code != "TASK_ACTION_FAILED" || !strings.Contains(feedback.Message, "missing unit") {
				t.Errorf("model did not receive actionable failure: %+v", last)
				http.Error(w, "missing tool failure", http.StatusBadRequest)
				return
			}
			args = `{"action":"get"}`
		case 3:
			var feedback struct {
				Completed     bool
				Status        string
				PendingFields []taskstate.Field `json:"pending_fields"`
				NextAction    string            `json:"next_action"`
			}
			if last.Role != "tool" || json.Unmarshal([]byte(last.Content), &feedback) != nil || feedback.Completed || feedback.Status != "waiting_for_input" || len(feedback.PendingFields) != 1 || feedback.PendingFields[0].Name != "unit" || feedback.NextAction == "" {
				t.Errorf("model did not receive pending task: %+v", last)
				http.Error(w, "missing task state", http.StatusBadRequest)
				return
			}
			final = true
		default:
			t.Error("unexpected repeated tool loop")
			http.Error(w, "unexpected model call", http.StatusBadRequest)
			return
		}
		message := map[string]any{"role": "assistant", "content": "Please confirm the signal unit; processing has not started."}
		reason := "stop"
		if !final {
			message = map[string]any{"role": "assistant", "content": "", "tool_calls": []any{map[string]any{"id": "task_call", "type": "function", "function": map[string]any{"name": "manage_preprocessing_task", "arguments": args}}}}
			reason = "tool_calls"
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{"id": "mock", "object": "chat.completion", "model": "test", "choices": []any{map[string]any{"index": 0, "message": message, "finish_reason": reason}}})
	}))
	defer server.Close()
	ctx = toolinput.WithResponseMode(ctx, "quick")
	ctx = toolinput.WithWorkspace(ctx, toolinput.Workspace{Page: "eeg", DatasetID: "bound"})
	ctx = taskstate.WithScope(ctx, taskstate.Scope{Store: store, SessionID: "feedback", DatasetID: "bound", UserMessage: "continue"})
	u := NewChatServer(nil, &config.Config{OpenAI: config.OpenAIConfig{APIBase: server.URL + "/v1", APIKey: "local-test-only", Model: "test", MaxTokens: 128}})
	runner, err := u.BuildChatAgent(ctx)
	if err != nil {
		t.Fatal(err)
	}
	out, err := runner.Invoke(ctx, &UserMessage{Query: "continue", ResponseMode: "quick"})
	if err != nil || out == nil || !strings.Contains(out.Content, "confirm the signal unit") || calls.Load() != 3 {
		t.Fatalf("feedback loop failed after %d calls: %+v %v", calls.Load(), out, err)
	}
	after, err := store.Get(ctx, "feedback")
	if err != nil {
		t.Fatal(err)
	}
	persisted, _ := json.Marshal(after)
	if string(before) != string(persisted) {
		t.Fatal("failed resume or lookup changed the waiting task")
	}
}
