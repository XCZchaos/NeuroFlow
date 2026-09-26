package handler

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"OnCallAgent/internal/server/chatServer"
	"github.com/cloudwego/eino/compose"
	"github.com/gin-gonic/gin"
	openai "github.com/meguminnnnnnnnn/go-openai"
)

func TestAgentFailureClassifiesProviderErrorsWithoutExposingDetails(t *testing.T) {
	for _, test := range []struct {
		name string
		err  error
		code string
	}{
		{"trial exhausted", &openai.APIError{HTTPStatusCode: 402, Message: "free trial quota exhausted; sk-private-test-value"}, "MODEL_QUOTA_EXHAUSTED"},
		{"quota forbidden", &openai.APIError{HTTPStatusCode: 403, Message: "7天免费点数不足以支持本次请求"}, "MODEL_QUOTA_EXHAUSTED"},
		{"quota limited", &openai.APIError{HTTPStatusCode: 429, Code: "insufficient_quota"}, "MODEL_QUOTA_EXHAUSTED"},
		{"rate limited", &openai.APIError{HTTPStatusCode: 429, Message: "tokens per minute limit"}, "MODEL_RATE_LIMITED"},
		{"authentication", &openai.APIError{HTTPStatusCode: 401}, "MODEL_AUTH_FAILED"},
		{"permissions", &openai.APIError{HTTPStatusCode: 403}, "MODEL_ACCESS_DENIED"},
		{"model unavailable", &openai.APIError{HTTPStatusCode: 404}, "MODEL_NOT_FOUND"},
		{"invalid parameters", &openai.APIError{HTTPStatusCode: 400}, "MODEL_REQUEST_REJECTED"},
		{"gateway", &openai.RequestError{HTTPStatusCode: 503, Body: []byte("sk-private-test-value")}, "MODEL_UNAVAILABLE"},
		{"timeout", context.DeadlineExceeded, "AGENT_TIMEOUT"},
		{"steps", compose.ErrExceedMaxSteps, "AGENT_STEP_LIMIT"},
		{"string-only SDK wrapper", errors.New("[NodeRunError] error, status code: 402, status: 402 Payment Required, message: quota exhausted"), "MODEL_QUOTA_EXHAUSTED"},
		{"unrelated number", errors.New("tool failed at sample 402, sk-private-test-value"), "AGENT_STREAM_FAILED"},
	} {
		t.Run(test.name, func(t *testing.T) {
			result := describeAgentFailure(fmt.Errorf("Agent stream: %w", test.err), "deep", true)
			if result.Code != test.code {
				t.Fatalf("wrong cause: %+v", result)
			}
			raw, _ := json.Marshal(result)
			if strings.Contains(string(raw), "sk-private") {
				t.Fatal("provider secret leaked in client error")
			}
			if result.Code == "AGENT_STEP_LIMIT" && strings.Contains(result.Message, "可选择深度分析") {
				t.Fatal("already-deep request told to select deep mode")
			}
		})
	}
}

type rejectedChatStub struct {
	chatServer.ChatServer
	err error
}

func (s *rejectedChatStub) Chat(context.Context, string, string, string) (string, error) {
	return "", s.err
}
func (s *rejectedChatStub) ChatSream(_ context.Context, _, _, _ string, messages *chan string, _ *chan struct{}) error {
	close(*messages)
	return s.err
}

// 回归真实路由，确认两种回答模式都能收到额度错误，SSE 不发送虚假的 done。
func TestChatRoutesExposeQuotaCauseInBothModes(t *testing.T) {
	stub := &rejectedChatStub{err: fmt.Errorf("model node: %w", &openai.APIError{HTTPStatusCode: 402, Message: "trial exhausted; sk-private-test-value"})}
	router := gin.New()
	handler := NewChatHandler(stub)
	router.POST("/chat", handler.Chat())
	router.POST("/chatStream", handler.ChatSream())
	for _, mode := range []string{"quick", "deep"} {
		for _, endpoint := range []string{"/chat", "/chatStream"} {
			t.Run(mode+endpoint, func(t *testing.T) {
				req := httptest.NewRequest("POST", endpoint, strings.NewReader(fmt.Sprintf(`{"question":"hello","id":"s","response_mode":%q}`, mode)))
				req.Header.Set("Content-Type", "application/json")
				recorder := httptest.NewRecorder()
				router.ServeHTTP(recorder, req)
				body := recorder.Body.String()
				if !strings.Contains(body, `"code":"MODEL_QUOTA_EXHAUSTED"`) || !strings.Contains(body, `"upstream_status":402`) || strings.Contains(body, "sk-private") {
					t.Fatalf("missing safe quota explanation: %s", body)
				}
				if endpoint == "/chatStream" {
					if recorder.Code != http.StatusOK || !strings.Contains(body, "event:error") || strings.Contains(body, "event:done") {
						t.Fatalf("invalid SSE terminal event: %d %s", recorder.Code, body)
					}
				} else if recorder.Code != http.StatusBadGateway {
					t.Fatalf("invalid sync failure status: %d", recorder.Code)
				}
			})
		}
	}
}
