package chatServer

import (
	"context"
	"errors"
	"strings"
	"testing"

	"OnCallAgent/internal/server/ai/agent/chat"
	"OnCallAgent/internal/server/ai/toolinput"
	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/schema"
	"github.com/sirupsen/logrus"
)

type repairTestRunner struct {
	compose.Runnable[*chat.UserMessage, *schema.Message]
	draft, correction string
	repairs           int
	fail              bool
	onRepair          func(context.Context, *chat.UserMessage)
}

func (r *repairTestRunner) Invoke(ctx context.Context, input *chat.UserMessage, _ ...compose.Option) (*schema.Message, error) {
	if toolinput.IsAnswerRepair(ctx) {
		r.repairs++
		if r.onRepair != nil {
			r.onRepair(ctx, input)
		}
		if r.fail {
			return nil, errors.New("model unavailable")
		}
		return &schema.Message{Content: r.correction}, nil
	}
	return &schema.Message{Content: r.draft}, nil
}
func (r *repairTestRunner) Stream(ctx context.Context, input *chat.UserMessage, _ ...compose.Option) (*schema.StreamReader[*schema.Message], error) {
	message, err := r.Invoke(ctx, input)
	if err != nil {
		return nil, err
	}
	reader, writer := schema.Pipe[*schema.Message](1)
	writer.Send(message, nil)
	writer.Close()
	return reader, nil
}

// 同步和 SSE 都保存修正后的自然回答；草稿不能进入长期记忆，用户原话也不能
// 被核验反馈覆盖。流式路径仍先发草稿，再用一次 replace 更新最终文本。
func TestAnswerRepairPreservesUserContextAndPersistsFinal(t *testing.T) {
	for _, streaming := range []bool{false, true} {
		t.Run(map[bool]string{false: "sync", true: "stream"}[streaming], func(t *testing.T) {
			store := newTestStore(t)
			runner := &repairTestRunner{draft: "已完成预处理，并已保存预处理文件。", correction: "当前没有成功的工具执行记录。采样率确认后可以继续处理；我会遵守不保存文件的要求。"}
			query := "检查 EEG，不要保存文件"
			runner.onRepair = func(ctx context.Context, input *chat.UserMessage) {
				if toolinput.UserText(ctx) != query || toolinput.IntentText(ctx, "") != query || !strings.Contains(input.Query, "recorded_tool_facts") {
					t.Fatal("repair lost original constraints or evidence")
				}
				if _, ok := ctx.Deadline(); !ok {
					t.Fatal("repair has no time budget")
				}
			}
			ctx := toolinput.WithIntentText(context.Background(), query)
			events := make(chan toolinput.StreamEvent, 32)
			ctx = toolinput.WithStreamEvents(ctx, events)
			server := NewChatServer(logrus.New(), runner, store)
			if streaming {
				messages, done := make(chan string, 8), make(chan struct{}, 1)
				if err := server.ChatSream(ctx, query, "repair", "deep", &messages, &done); err != nil {
					t.Fatal(err)
				}
				var text, replacement string
				for len(events) > 0 {
					event := <-events
					if event.Name == "message" {
						text += event.Data.(string)
					}
					if event.Name == "replace" {
						replacement = event.Data.(string)
					}
				}
				if text != runner.draft || replacement != runner.correction {
					t.Fatalf("stream/replace broken: %q / %q", text, replacement)
				}
			} else {
				answer, err := server.Chat(ctx, query, "repair", "deep")
				if err != nil || answer != runner.correction {
					t.Fatalf("repair failed: %q %v", answer, err)
				}
			}
			messages, err := store.Messages(ctx, "repair", 10)
			if err != nil || len(messages) != 2 || messages[0].Content != query || messages[1].Content != runner.correction || runner.repairs != 1 {
				t.Fatalf("incorrect persistence or repair count: %+v %d %v", messages, runner.repairs, err)
			}
		})
	}
}

func TestAnswerRepairIsBoundedAndRetainsVerification(t *testing.T) {
	for _, fail := range []bool{false, true} {
		r := &repairTestRunner{correction: "已完成预处理", fail: fail}
		s := &chatServer{runner: r}
		answer, err := s.verifyAndRepairAnswer(context.Background(), "已完成预处理", &toolinput.Trace{}, &chat.UserMessage{Query: "inspect"})
		if err != nil || r.repairs != 1 || answer == "已完成预处理" {
			t.Fatalf("invalid repair escaped or retried: %q %d %v", answer, r.repairs, err)
		}
	}
	r := &repairTestRunner{}
	s := &chatServer{runner: r}
	answer, err := s.verifyAndRepairAnswer(context.Background(), "这份文件有 2 个通道。", &toolinput.Trace{}, &chat.UserMessage{})
	if err != nil || r.repairs != 0 || answer != "这份文件有 2 个通道。" {
		t.Fatal("valid answer incurred repair")
	}
}

func TestCancelDuringAnswerRepairDoesNotPersistDraft(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	store := newTestStore(t)
	r := &repairTestRunner{draft: "已完成预处理", correction: "Hello", onRepair: func(context.Context, *chat.UserMessage) { cancel() }}
	s := NewChatServer(logrus.New(), r, store)
	_, err := s.Chat(ctx, "请检查文件", "cancel-repair", "quick")
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("cancel swallowed: %v", err)
	}
	messages, err := store.Messages(context.Background(), "cancel-repair", 10)
	if err != nil || len(messages) != 0 {
		t.Fatal("cancelled draft persisted")
	}
}
