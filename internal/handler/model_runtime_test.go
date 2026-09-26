package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

	"OnCallAgent/internal/server/ai/agent/chat"
	"OnCallAgent/internal/server/model"
	"OnCallAgent/internal/server/modelruntime"
	"OnCallAgent/pkg/config"
	"github.com/cloudwego/eino/schema"
	"github.com/gin-gonic/gin"
)

// These tests use a deterministic local HTTP provider to verify wiring. They
// are intentionally distinct from the user-facing live-provider diagnostic.
func TestRuntimeSwitchAndActualReActToolRoundTrip(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var mu sync.Mutex
	seen := []string{}
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Model    string `json:"model"`
			Stream   bool   `json:"stream"`
			Messages []struct {
				Role    string `json:"role"`
				Content string `json:"content"`
			} `json:"messages"`
			Tools []any `json:"tools"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			t.Error(err)
			return
		}
		mu.Lock()
		seen = append(seen, body.Model+"/"+r.Header.Get("Authorization"))
		mu.Unlock()
		if body.Model == "quota" {
			w.WriteHeader(402)
			fmt.Fprint(w, `{"error":{"message":"free trial quota exhausted secret-not-for-client","type":"quota"}}`)
			return
		}
		content := "OK"
		last := body.Messages[len(body.Messages)-1]
		toolCall := len(body.Tools) > 0 && last.Role != "tool" && body.Model != "no-tool"
		if last.Role == "tool" {
			var observation struct {
				Component struct {
					State struct {
						Challenge string `json:"challenge"`
					} `json:"state"`
				} `json:"component"`
			}
			if err := json.Unmarshal([]byte(last.Content), &observation); err != nil {
				t.Error(err)
			}
			content = observation.Component.State.Challenge
		}
		reason := "stop"
		message := map[string]any{"role": "assistant", "content": content}
		if toolCall {
			reason = "tool_calls"
			message["content"] = ""
			message["tool_calls"] = []any{map[string]any{"index": 0, "id": "call_probe", "type": "function", "function": map[string]any{"name": "inspect_ui_component", "arguments": "{\"component_id\":\"model-probe\"}"}}}
		}
		if body.Stream {
			w.Header().Set("Content-Type", "text/event-stream")
			raw, _ := json.Marshal(map[string]any{"id": "test", "object": "chat.completion.chunk", "model": body.Model, "choices": []any{map[string]any{"index": 0, "delta": message}}})
			fmt.Fprintf(w, "data: %s\n\n", raw)
			fmt.Fprintf(w, "data: {\"id\":\"test\",\"object\":\"chat.completion.chunk\",\"choices\":[{\"index\":0,\"delta\":{},\"finish_reason\":\"%s\"}]}\n\ndata: [DONE]\n\n", reason)
		} else {
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(map[string]any{"id": "test", "object": "chat.completion", "choices": []any{map[string]any{"index": 0, "message": message, "finish_reason": reason}}})
		}
	}))
	defer upstream.Close()
	cfg := &config.Config{OpenAI: config.OpenAIConfig{Provider: "openai-compatible", APIBase: upstream.URL + "/v1", APIKey: "old", Model: "old", MaxTokens: 256}}
	agent := chat.NewChatServer(nil, cfg)
	runner, err := agent.BuildChatAgent(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	chatModel, err := model.NewOpenaiModel(context.Background(), cfg)
	if err != nil {
		t.Fatal(err)
	}
	manager := modelruntime.New(cfg, runner, chatModel, nil)
	original := manager.Snapshot()
	router := gin.New()
	group := router.Group("/model", ModelControlAuth("test-local-token"))
	group.PUT("/runtime", ApplyModelSettings(manager))
	group.GET("/runtime", ModelStatus(manager))
	group.POST("/test-agent", TestActiveAgent(manager))
	request := func(method, route string, input any) *httptest.ResponseRecorder {
		t.Helper()
		raw, _ := json.Marshal(input)
		r := httptest.NewRequest(method, route, bytes.NewReader(raw))
		r.RemoteAddr = "127.0.0.1:1234"
		r.Header.Set("Authorization", "Bearer test-local-token")
		r.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, r)
		return w
	}
	value := modelruntime.Settings{Provider: "openai-compatible", APIBase: upstream.URL + "/v1", APIKey: "new", Model: "new", MaxTokens: 1024, Temperature: 0.5, Revision: modelruntime.NewID()}
	if w := request("PUT", "/model/runtime", value); w.Code != 200 {
		t.Fatal(w.Body.String())
	}
	next := manager.Snapshot()
	if next.Config.OpenAI.APIKey != "new" || next.Model == original.Model || next.Runner == original.Runner {
		t.Fatal("not all consumers switched")
	}
	// Plan receives the same new model generation; an in-flight snapshot stays old.
	for _, snapshot := range []*modelruntime.Snapshot{next, original} {
		if _, err := snapshot.Model.Generate(context.Background(), []*schema.Message{schema.UserMessage("OK")}); err != nil {
			t.Fatal(err)
		}
	}
	for _, mode := range []string{"quick", "deep"} {
		w := request("POST", "/model/test-agent", map[string]any{"mode": mode, "revision": next.Revision})
		var result struct {
			OK                 bool `json:"ok"`
			ToolExecuted       bool `json:"tool_executed"`
			ToolResultVerified bool `json:"tool_result_verified"`
			Chunks             int  `json:"content_chunks"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
			t.Fatal(err)
		}
		if w.Code != 200 || !result.OK || !result.ToolExecuted || !result.ToolResultVerified || result.Chunks < 1 {
			t.Fatalf("%s did not execute real Eino/tool path: %s", mode, w.Body)
		}
	}
	mu.Lock()
	if seen[0] != "new/Bearer new" || seen[1] != "old/Bearer old" {
		t.Errorf("wrong generations: %v", seen)
	}
	mu.Unlock()
	// Plain assistant text cannot impersonate a tool call; upstream failures remain failures.
	for _, name := range []string{"no-tool", "quota"} {
		value.Model = name
		value.Revision = modelruntime.NewID()
		request("PUT", "/model/runtime", value)
		w := request("POST", "/model/test-agent", map[string]any{"mode": "deep", "revision": value.Revision})
		if strings.Contains(w.Body.String(), `"ok":true`) {
			t.Fatal(w.Body.String())
		}
		if strings.Contains(w.Body.String(), "secret-not-for-client") {
			t.Fatal("upstream secret exposed")
		}
		if name == "quota" && !strings.Contains(w.Body.String(), "MODEL_QUOTA_EXHAUSTED") {
			t.Fatal(w.Body.String())
		}
	}
	before := manager.Snapshot()
	invalid := value
	invalid.APIBase = "not a URL"
	if w := request("PUT", "/model/runtime", invalid); w.Code != 400 {
		t.Fatal(w.Code)
	}
	if manager.Snapshot() != before {
		t.Fatal("invalid update changed runtime")
	}
	value.APIKey = ""
	value.Revision = modelruntime.NewID()
	request("PUT", "/model/runtime", value)
	if manager.Snapshot().Config.OpenAI.APIKey != "" || manager.Snapshot().Runner != nil || manager.Snapshot().Model != nil {
		t.Fatal("clear restored old model")
	}
	if w := request("POST", "/model/test-agent", map[string]any{"mode": "quick", "revision": value.Revision}); w.Code != 409 {
		t.Fatal(w.Code)
	}
}

func TestModelControlRejectsRemoteBrowserAndMissingToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/", ModelControlAuth("local-secret"), func(c *gin.Context) { c.Status(204) })
	for _, tc := range []struct {
		address, origin, token string
		status                 int
	}{{"127.0.0.1:5", "", "Bearer local-secret", 204}, {"10.0.0.1:5", "", "Bearer local-secret", 403}, {"127.0.0.1:5", "http://localhost", "Bearer local-secret", 403}, {"127.0.0.1:5", "", "", 403}} {
		req := httptest.NewRequest("GET", "/", nil)
		req.RemoteAddr = tc.address
		req.Header.Set("Origin", tc.origin)
		req.Header.Set("Authorization", tc.token)
		req.Header.Set("X-Forwarded-For", "127.0.0.1")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != tc.status {
			t.Fatalf("want %d got %d", tc.status, w.Code)
		}
	}
}
