package tools

import (
	"OnCallAgent/internal/server/ai/toolinput"
	"context"
	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/schema"
	"testing"
	"time"
)

type waitingTool struct{ release chan struct{} }

func (t *waitingTool) Info(context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{Name: "test_tool"}, nil
}
func (t *waitingTool) InvokableRun(ctx context.Context, _ string, _ ...tool.Option) (string, error) {
	select {
	case <-t.release:
		return `{"ok":false,"message":"sensitive-result"}`, nil
	case <-ctx.Done():
		return "", ctx.Err()
	}
}
func TestToolEventsReportRealLifecycleWithoutPayload(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	events := make(chan toolinput.StreamEvent, 4)
	ctx = toolinput.WithStreamEvents(ctx, events)
	underlying := &waitingTool{release: make(chan struct{})}
	wrapped, err := ScopeTool(ctx, underlying)
	if err != nil {
		t.Fatal(err)
	}
	done := make(chan struct{})
	go func() { wrapped.(tool.InvokableTool).InvokableRun(ctx, `{"secret":"private-key"}`); close(done) }()
	var start toolinput.StreamEvent
	select {
	case start = <-events:
	case <-ctx.Done():
		t.Fatal("start was buffered")
	}
	first := start.Data.(map[string]any)
	if first["state"] != "running" {
		t.Fatalf("unexpected start: %+v", first)
	}
	close(underlying.release)
	<-done
	last := (<-events).Data.(map[string]any)
	if last["state"] != "failed" || last["id"] != first["id"] {
		t.Fatalf("business failure not reported: %+v", last)
	}
	if len(last) != 5 {
		t.Fatalf("unexpected payload fields: %+v", last)
	}
}
