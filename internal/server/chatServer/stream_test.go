package chatServer

import (
	"OnCallAgent/internal/server/ai/toolinput"
	"context"
	"github.com/cloudwego/eino/schema"
	"testing"
	"time"
)

// 不关闭上游也必须先收到增量；这个测试直接防止 RequiresVerification 再次缓冲整段。
func TestVerifiedTurnStreamsBeforeEOFAndReplacesDraft(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	events := make(chan toolinput.StreamEvent, 16)
	ctx = toolinput.WithStreamEvents(ctx, events)
	store := newTestStore(t)
	if _, err := store.EnsureSession(ctx, "stream"); err != nil {
		t.Fatal(err)
	}
	server := &chatServer{memory: store}
	reader, writer := schema.Pipe[*schema.Message](4)
	defer reader.Close()
	legacy := make(chan string, 4)
	finished := make(chan error, 1)
	go func() {
		finished <- server.forwardStream(ctx, reader, &toolinput.Trace{}, true, "stream", "请预处理", &legacy)
	}()
	writer.Send(&schema.Message{Content: "已完成预处理，并已保存预处理文件。"}, nil)
	select {
	case event := <-events:
		if event.Name != "message" {
			t.Fatalf("first event must be live text: %+v", event)
		}
	case <-ctx.Done():
		t.Fatal("first chunk buffered until EOF")
	}
	writer.Close()
	if err := <-finished; err != nil {
		t.Fatal(err)
	}
	phase := <-events
	if phase.Name != "status" {
		t.Fatalf("verification missing: %+v", phase)
	}
	corrected := <-events
	if corrected.Name != "replace" {
		t.Fatalf("correction must replace: %+v", corrected)
	}
	messages, err := store.Messages(ctx, "stream", 10)
	if err != nil {
		t.Fatal(err)
	}
	if len(messages) != 2 || messages[1].Content != corrected.Data {
		t.Fatalf("persisted answer differs from UI: %+v", messages)
	}
}

func TestCancelledEventSenderDoesNotBlock(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	ctx = toolinput.WithStreamEvents(ctx, make(chan toolinput.StreamEvent))
	done := make(chan struct{})
	go func() { toolinput.EmitStream(ctx, "message", "x"); close(done) }()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("cancelled event sender blocked")
	}
}
