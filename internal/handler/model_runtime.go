package handler

import (
	"context"
	"crypto/subtle"
	"errors"
	"io"
	"net"
	"net/http"
	"strings"
	"time"

	"OnCallAgent/internal/server/ai/agent/chat"
	"OnCallAgent/internal/server/ai/toolinput"
	"OnCallAgent/internal/server/modelruntime"
	"github.com/gin-gonic/gin"
)

// Only the local Electron main process may update secrets. Do not trust forwarded
// IP headers, browser CORS, or a renderer-supplied hostname as authorization.
func ModelControlAuth(token string) gin.HandlerFunc {
	return func(c *gin.Context) {
		host, _, _ := net.SplitHostPort(c.Request.RemoteAddr)
		ip := net.ParseIP(host)
		supplied := strings.TrimPrefix(c.GetHeader("Authorization"), "Bearer ")
		if ip == nil || !ip.IsLoopback() || c.GetHeader("Origin") != "" || subtle.ConstantTimeCompare([]byte(supplied), []byte(token)) != 1 {
			c.AbortWithStatusJSON(403, gin.H{"message": "Local model control authorization required"})
			return
		}
		c.Next()
	}
}

func ModelStatus(m *modelruntime.Manager) gin.HandlerFunc {
	return func(c *gin.Context) { c.JSON(200, m.Snapshot().Public()) }
}
func ApplyModelSettings(m *modelruntime.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 32768)
		var input modelruntime.Settings
		if c.ShouldBindJSON(&input) != nil {
			c.JSON(400, gin.H{"message": "Invalid model settings"})
			return
		}
		next, err := m.Apply(c.Request.Context(), input)
		if err != nil {
			c.JSON(400, gin.H{"message": err.Error()})
			return
		}
		c.JSON(200, next.Public())
	}
}

// This is a live diagnostic, not a canned success response. It uses the active
// Eino graph, provider stream and real read-only tool, without modifying sessions.
func TestActiveAgent(m *modelruntime.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		snapshot := m.Snapshot()
		if snapshot.Config.OpenAI.APIKey == "" {
			c.JSON(409, gin.H{"message": "Model is disabled: API key is empty"})
			return
		}
		var input struct {
			Mode     string `json:"mode"`
			Revision string `json:"revision"`
		}
		if c.ShouldBindJSON(&input) != nil || (input.Mode != "quick" && input.Mode != "deep") {
			c.JSON(400, gin.H{"message": "Choose quick or deep mode"})
			return
		}
		if input.Revision != snapshot.Revision {
			c.JSON(409, gin.H{"message": "Configuration changed; save and test again"})
			return
		}
		started := time.Now()
		ctx, cancel := context.WithTimeout(c.Request.Context(), 90*time.Second)
		defer cancel()
		ctx = toolinput.WithModelProbe(toolinput.WithResponseMode(ctx, input.Mode))
		ctx = toolinput.WithWorkspace(ctx, toolinput.Workspace{Page: "help"})
		challenge := modelruntime.NewID()
		ctx = toolinput.WithUIContext(ctx, &toolinput.UIContext{Version: 1, Page: "help", ExplainOnly: true, FocusedComponentID: "model-probe", Components: []toolinput.UIComponent{{ID: "model-probe", Title: "Model diagnostic", State: map[string]any{"challenge": challenge}}}})
		// The random challenge appears only in the tool result, never in the prompt.
		// Seeing it in the answer plus a completed tool event proves the round trip.
		events := make(chan toolinput.StreamEvent, 256)
		ctx = toolinput.WithStreamEvents(ctx, events)
		stream, err := snapshot.Runner.Stream(ctx, &chat.UserMessage{Query: "Read the current component with inspect_ui_component (component_id=model-probe). Reply with only its state.challenge exactly. This is a read-only connectivity check.", ResponseMode: input.Mode, WorkflowPlan: toolinput.UIContextInstruction(ctx)})
		chunks := 0
		var answer strings.Builder
		if err == nil {
			defer stream.Close()
			for {
				msg, e := stream.Recv()
				if errors.Is(e, io.EOF) {
					break
				}
				if e != nil {
					err = e
					break
				}
				if msg != nil && msg.Content != "" {
					chunks++
					answer.WriteString(msg.Content)
				}
			}
		}
		// Eino has finished when the stream ends. Drain recorded events without
		// closing the shared channel; a cancelled worker may still finish its defer.
		executed := false
	drain:
		for {
			select {
			case event := <-events:
				if data, ok := event.Data.(map[string]any); ok && data["kind"] == "tool" && data["tool"] == "inspect_ui_component" && data["state"] == "completed" {
					executed = true
				}
			default:
				break drain
			}
		}
		result := gin.H{"ok": false, "live": true, "mode": input.Mode, "revision": snapshot.Revision, "model": snapshot.Config.OpenAI.Model, "tool_executed": executed, "content_chunks": chunks, "elapsed_ms": time.Since(started).Milliseconds(), "tested_at": time.Now().UTC().Format(time.RFC3339)}
		if err != nil {
			result["failure"] = describeAgentFailure(err, input.Mode, true)
		} else {
			matched := strings.Contains(answer.String(), challenge)
			result["tool_result_verified"] = matched
			result["ok"] = executed && matched && chunks > 0
			if result["ok"] == false {
				result["message"] = "Agent did not complete the verified tool-result round trip"
			}
		}
		c.JSON(200, result)
	}
}
