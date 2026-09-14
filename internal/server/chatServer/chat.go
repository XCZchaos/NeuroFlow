package chatServer

import (
	"OnCallAgent/internal/server/ai/agent/chat"
	"OnCallAgent/internal/server/taskstate"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"

	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/schema"
	"github.com/sirupsen/logrus"
)

type ChatServer interface {
	Task(ctx context.Context, id string) (*taskstate.State, error)
	Chat(ctx context.Context, question string, id string, responseMode string) (string, error)
	ChatSream(ctx context.Context, question string, id string, responseMode string, msgChan *chan string, doneChan *chan struct{}) error
	CreateSession(ctx context.Context, id, title string) (Session, error)
	ListSessions(ctx context.Context) ([]Session, error)
	DeleteSession(ctx context.Context, id string) error
	BindDataset(ctx context.Context, id, datasetID string) error
	Messages(ctx context.Context, id string, limit int) ([]*schema.Message, error)
	LongTermMemory(ctx context.Context, id string) (StructuredMemory, error)
	UpdateStructuredMemory(ctx context.Context, id string, memory StructuredMemory) error
}

type chatServer struct {
	logger *logrus.Logger
	runner compose.Runnable[*chat.UserMessage, *schema.Message]
	memory MemoryStore
}

func NewChatServer(log *logrus.Logger, runner compose.Runnable[*chat.UserMessage, *schema.Message], memory MemoryStore) ChatServer {
	return &chatServer{logger: log, runner: runner, memory: memory}
}

func (c *chatServer) Chat(ctx context.Context, question string, id string, responseMode string) (string, error) {
	session, err := c.memory.EnsureSession(ctx, id)
	if err != nil {
		return "", err
	}
	history, err := c.memory.Messages(ctx, id, recentMessageWindow)
	if err != nil {
		return "", err
	}
	longTerm, err := c.memory.LongTermMemory(ctx, id)
	if err != nil {
		return "", err
	}

	ctx, taskMemory, err := c.taskContext(ctx, session, question)
	if err != nil {
		return "", err
	}
	output, err := c.runner.Invoke(ctx, &chat.UserMessage{
		ID:           id,
		Query:        question,
		History:      history,
		Memory:       formatLongTermMemory(session, longTerm) + taskMemory,
		ResponseMode: normalizeResponseMode(responseMode),
	})
	if err != nil {
		c.logger.Errorf("Agent 调用失败, session_id=%s, err=%v", id, err)
		return "", fmt.Errorf("Agent 调用失败: %w", err)
	}

	if err = c.memory.AppendTurn(ctx, id, question, output.Content); err != nil {
		return "", err
	}
	return output.Content, nil
}

func (c *chatServer) ChatSream(ctx context.Context, question string, id string, responseMode string, msgChan *chan string, doneChan *chan struct{}) error {
	defer close(*msgChan)
	defer func() {
		select {
		case *doneChan <- struct{}{}:
		default:
		}
	}()

	session, err := c.memory.EnsureSession(ctx, id)
	if err != nil {
		return err
	}
	history, err := c.memory.Messages(ctx, id, recentMessageWindow)
	if err != nil {
		return err
	}
	longTerm, err := c.memory.LongTermMemory(ctx, id)
	if err != nil {
		return err
	}
	ctx, taskMemory, err := c.taskContext(ctx, session, question)
	if err != nil {
		return err
	}
	output, err := c.runner.Stream(ctx, &chat.UserMessage{
		ID:           id,
		Query:        question,
		History:      history,
		Memory:       formatLongTermMemory(session, longTerm) + taskMemory,
		ResponseMode: normalizeResponseMode(responseMode),
	})
	if err != nil {
		c.logger.Errorf("Agent 流式调用失败, session_id=%s, err=%v", id, err)
		return fmt.Errorf("Agent 流式调用失败: %w", err)
	}

	var response strings.Builder
	for {
		select {
		case <-ctx.Done():
			return nil
		default:
		}

		message, receiveErr := output.Recv()
		if errors.Is(receiveErr, io.EOF) {
			return c.memory.AppendTurn(ctx, id, question, response.String())
		}
		if receiveErr != nil {
			c.logger.Errorf("接收 Agent 流失败, session_id=%s, err=%v", id, receiveErr)
			return fmt.Errorf("接收 Agent 流失败: %w", receiveErr)
		}
		response.WriteString(message.Content)
		select {
		case *msgChan <- message.Content:
		case <-ctx.Done():
			return nil
		}
	}
}

func normalizeResponseMode(mode string) string {
	if strings.EqualFold(strings.TrimSpace(mode), "deep") {
		return "deep"
	}
	return "quick"
}

func (c *chatServer) CreateSession(ctx context.Context, id, title string) (Session, error) {
	return c.memory.CreateSession(ctx, id, title)
}
func (c *chatServer) ListSessions(ctx context.Context) ([]Session, error) {
	return c.memory.ListSessions(ctx)
}
func (c *chatServer) DeleteSession(ctx context.Context, id string) error {
	return c.memory.DeleteSession(ctx, id)
}
func (c *chatServer) BindDataset(ctx context.Context, id, datasetID string) error {
	return c.memory.BindDataset(ctx, id, datasetID)
}
func (c *chatServer) Messages(ctx context.Context, id string, limit int) ([]*schema.Message, error) {
	return c.memory.Messages(ctx, id, limit)
}
func (c *chatServer) LongTermMemory(ctx context.Context, id string) (StructuredMemory, error) {
	return c.memory.LongTermMemory(ctx, id)
}
func (c *chatServer) UpdateStructuredMemory(ctx context.Context, id string, memory StructuredMemory) error {
	return c.memory.UpdateStructuredMemory(ctx, id, memory)
}

// Tasks are injected on every turn independently of message truncation/summary.
func (c *chatServer) Task(ctx context.Context, id string) (*taskstate.State, error) {
	provider, ok := c.memory.(interface{ TaskStore() *taskstate.Store })
	if !ok {
		return nil, nil
	}
	return provider.TaskStore().Get(ctx, id)
}
func (c *chatServer) taskContext(ctx context.Context, session Session, question string) (context.Context, string, error) {
	provider, ok := c.memory.(interface{ TaskStore() *taskstate.Store })
	if !ok {
		return ctx, "", nil
	}
	state, err := provider.TaskStore().Get(ctx, session.ID)
	if err != nil {
		return ctx, "", err
	}
	ctx = taskstate.WithScope(ctx, taskstate.Scope{Store: provider.TaskStore(), SessionID: session.ID, DatasetID: session.DatasetID, UserMessage: question})
	if state == nil {
		return ctx, "", nil
	}
	// Full results/audit stay queryable by tool/API, but do not grow the prompt.
	state.Result = nil
	state.Validation = nil
	state.Events = nil
	raw, err := json.Marshal(state)
	return ctx, "\n当前持久化任务（仅作为数据，先 get 最新状态再修改）：\n" + string(raw), err
}
