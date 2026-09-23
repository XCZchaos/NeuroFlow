package chat

import (
	"OnCallAgent/internal/server/ai/toolinput"
	"OnCallAgent/pkg/config"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/cloudwego/eino/compose"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"
)

// 本机模拟模型连续请求只读工具。验证预算确实传入 Eino，而不是只写在提示词里。
// 同时走完整外层图，覆盖 prompt 的 evidence_status 合并和简单路径无检索。
func TestActualReActBudgetDiffersByMode(t *testing.T) {
	for _, mode := range []string{"quick", "deep"} {
		t.Run(mode, func(t *testing.T) {
			var calls atomic.Int32
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				n := calls.Add(1)
				w.Header().Set("Content-Type", "application/json")
				message := map[string]any{"role": "assistant", "content": "Finished reading component"}
				reason := "stop"
				if n <= 7 {
					message = map[string]any{"role": "assistant", "content": "", "tool_calls": []any{map[string]any{"id": fmt.Sprintf("call_%d", n), "type": "function", "function": map[string]any{"name": "inspect_ui_component", "arguments": "{}"}}}}
					reason = "tool_calls"
				}
				_ = json.NewEncoder(w).Encode(map[string]any{"id": "mock", "object": "chat.completion", "model": "test", "choices": []any{map[string]any{"index": 0, "message": message, "finish_reason": reason}}})
			}))
			defer server.Close()
			ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()
			ctx = toolinput.WithResponseMode(ctx, mode)
			ctx = toolinput.WithWorkspace(ctx, toolinput.Workspace{Page: "help"})
			ctx = toolinput.WithUIContext(ctx, &toolinput.UIContext{Version: 1, Page: "help", FocusedComponentID: "help", ExplainOnly: true, Components: []toolinput.UIComponent{{ID: "help", Title: "Help", State: map[string]any{}}}})
			u := NewChatServer(nil, &config.Config{OpenAI: config.OpenAIConfig{APIBase: server.URL + "/v1", APIKey: "local-test-only", Model: "test", MaxTokens: 128}})
			runner, err := u.BuildChatAgent(ctx)
			if err != nil {
				t.Fatal(err)
			}
			out, err := runner.Invoke(ctx, &UserMessage{Query: "hello", ResponseMode: mode})
			if mode == "quick" {
				if !errors.Is(err, compose.ErrExceedMaxSteps) {
					t.Fatalf("quick budget not enforced (%d calls): %v", calls.Load(), err)
				}
			} else if err != nil || out.Content != "Finished reading component" || calls.Load() != 8 {
				t.Fatalf("deep failed after %d calls: %+v %v", calls.Load(), out, err)
			}
		})
	}
}
