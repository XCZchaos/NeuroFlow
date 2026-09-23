package handler

import (
	"OnCallAgent/internal/server/ai/toolinput"
	"OnCallAgent/internal/server/chatServer"
	"bufio"
	"context"
	"github.com/gin-gonic/gin"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

type streamingChatStub struct {
	chatServer.ChatServer
	release chan struct{}
}

func (s *streamingChatStub) ChatSream(ctx context.Context, _, _, _ string, messages *chan string, done *chan struct{}) error {
	defer close(*messages)
	toolinput.StreamPhase(ctx, "context")
	toolinput.EmitStream(ctx, "message", "first")
	select {
	case <-s.release:
	case <-ctx.Done():
		return ctx.Err()
	}
	toolinput.EmitStream(ctx, "replace", "verified")
	return nil
}

// 用真实 HTTP 连接验证 Flush：服务仍在等待时，客户端已经能读到首段正文。
func TestChatSSEFlushesBeforeCompletion(t *testing.T) {
	stub := &streamingChatStub{release: make(chan struct{})}
	router := gin.New()
	router.POST("/chatStream", NewChatHandler(stub).ChatSream())
	server := httptest.NewServer(router)
	defer server.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	req, _ := http.NewRequestWithContext(ctx, "POST", server.URL+"/chatStream", strings.NewReader(`{"question":"test","id":"s"}`))
	req.Header.Set("Content-Type", "application/json")
	response, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if response.Header.Get("X-Accel-Buffering") != "no" {
		t.Fatal("proxy buffering header missing")
	}
	scanner := bufio.NewScanner(response.Body)
	receivedFirst := false
	for scanner.Scan() {
		if strings.TrimSpace(scanner.Text()) == "data:first" {
			receivedFirst = true
			break
		}
	}
	if !receivedFirst {
		t.Fatalf("no live first chunk: %v", scanner.Err())
	}
	close(stub.release)
	var rest strings.Builder
	for scanner.Scan() {
		rest.WriteString(scanner.Text())
		rest.WriteByte('\n')
	}
	if scanner.Err() != nil {
		t.Fatal(scanner.Err())
	}
	if !strings.Contains(rest.String(), "event:replace") || !strings.Contains(rest.String(), "event:done") {
		t.Fatalf("missing correction/done: %s", rest.String())
	}
	if strings.Index(rest.String(), "event:replace") > strings.Index(rest.String(), "event:done") {
		t.Fatal("done overtook correction")
	}
}
