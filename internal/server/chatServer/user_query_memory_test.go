package chatServer

import (
	"context"
	"fmt"
	"strings"
	"testing"

	"OnCallAgent/internal/server/ai/agent/chat"
	"OnCallAgent/internal/server/ai/toolinput"
	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/schema"
	"github.com/sirupsen/logrus"
)

// 在会话服务边界模拟模型，实际读写 SQLite：既检查历史内容，也验证标题、
// 偏好和摘要的派生结果。模型本轮仍必须收到页面上下文，工具约束原文保持完整。
type memoryQueryRunner struct {
	compose.Runnable[*chat.UserMessage, *schema.Message]
	input    *chat.UserMessage
	toolText string
}

func (r *memoryQueryRunner) Invoke(ctx context.Context, input *chat.UserMessage, _ ...compose.Option) (*schema.Message, error) {
	r.input, r.toolText = input, toolinput.UserText(ctx)
	return &schema.Message{Role: schema.Assistant, Content: "你好，请选择需要查看的通道。"}, nil
}

func (r *memoryQueryRunner) Stream(ctx context.Context, input *chat.UserMessage, _ ...compose.Option) (*schema.StreamReader[*schema.Message], error) {
	answer, _ := r.Invoke(ctx, input)
	reader, writer := schema.Pipe[*schema.Message](1)
	writer.Send(answer, nil)
	writer.Close()
	return reader, nil
}

func TestChatPersistsUserQueryWithoutPageMetadata(t *testing.T) {
	for _, stream := range []bool{false, true} {
		t.Run(fmt.Sprintf("stream=%t", stream), func(t *testing.T) {
			store := newTestStore(t)
			runner := &memoryQueryRunner{}
			server := NewChatServer(logrus.New(), runner, store)
			ctx := context.Background()
			const sessionID = "clean-memory"
			const page = "[Active page context: 界面示例：研究目标是演示，请保存，用英文]\n"
			for turn := 0; turn < 8; turn++ {
				query := fmt.Sprintf("你好\n请问有多少通道？第%d次", turn)
				question := page + query
				turnCtx := toolinput.WithIntentText(ctx, query)
				if stream {
					messages, done := make(chan string, 4), make(chan struct{}, 1)
					if err := server.ChatSream(turnCtx, question, sessionID, "quick", &messages, &done); err != nil {
						t.Fatal(err)
					}
				} else if _, err := server.Chat(turnCtx, question, sessionID, "quick"); err != nil {
					t.Fatal(err)
				}
				if runner.input.Query != question || runner.toolText != question {
					t.Fatal("current model context or tool provenance was truncated")
				}
				for _, previous := range runner.input.History {
					if strings.Contains(previous.Content, "Active page context") {
						t.Fatal("page metadata leaked into the next turn's history")
					}
				}
			}
			messages, err := store.Messages(ctx, sessionID, 100)
			if err != nil || len(messages) != 16 {
				t.Fatalf("messages: %d, %v", len(messages), err)
			}
			for turn := 0; turn < 8; turn++ {
				if messages[turn*2].Content != fmt.Sprintf("你好\n请问有多少通道？第%d次", turn) {
					t.Fatal("stored user message is not the original multiline query")
				}
			}
			memory, err := store.LongTermMemory(ctx, sessionID)
			if err != nil || memory.ResearchGoal != "" || len(memory.Preferences) != 0 || !strings.Contains(memory.Summary, "第0次") || strings.Contains(memory.Summary, "Active page context") {
				t.Fatalf("context polluted structured memory or summary: %+v, %v", memory, err)
			}
			sessions, err := store.ListSessions(ctx)
			if err != nil || len(sessions) != 1 || !strings.HasPrefix(sessions[0].Title, "你好") {
				t.Fatalf("context polluted title: %+v, %v", sessions, err)
			}
		})
	}
}

func TestChatLegacyMultilineQuestionAndExplicitPreferencesRemainIntact(t *testing.T) {
	ctx := context.Background()
	store := newTestStore(t)
	server := NewChatServer(logrus.New(), &memoryQueryRunner{}, store)
	// 旧客户端没有 user_query，不能靠“取最后一行”丢掉用户的配置或代码块。
	question := "研究目标是 P300\n不要保存\n```json\n{\"channels\": 2}\n```"
	if _, err := server.Chat(ctx, question, "legacy", "quick"); err != nil {
		t.Fatal(err)
	}
	messages, err := store.Messages(ctx, "legacy", 10)
	if err != nil || len(messages) != 2 || messages[0].Content != question {
		t.Fatalf("legacy multiline message truncated: %+v, %v", messages, err)
	}
	memory, err := store.LongTermMemory(ctx, "legacy")
	if err != nil || memory.ResearchGoal != "P300" || memory.Preferences["save_output"] != "false" {
		t.Fatalf("explicit preference lost: %+v, %v", memory, err)
	}
}
