package chatServer

import (
	"OnCallAgent/internal/server/ai/agent/chat"
	"context"
	"errors"
	"fmt"
	"io"
	"strings"

	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/schema"
	"github.com/sirupsen/logrus"
)

type ChatServer interface {
	Chat(ctx context.Context, question string, id string) (string, error)
	ChatSream(ctx context.Context, question string, id string, msgChan *chan string, doneChan *chan struct{}) error
}

type chatServer struct {
	logger *logrus.Logger
	runner compose.Runnable[*chat.UserMessage, *schema.Message]
}

func NewChatServer(log *logrus.Logger, runner compose.Runnable[*chat.UserMessage, *schema.Message]) ChatServer {
	return &chatServer{logger: log, runner: runner}
}

func (c *chatServer) Chat(ctx context.Context, question string, id string) (string, error) {
	memory, err := loadOrCreateMemory(id)
	if err != nil {
		return "", err
	}

	output, err := c.runner.Invoke(ctx, &chat.UserMessage{
		ID:      id,
		Query:   question,
		History: memory.historySnapshot(),
	})
	if err != nil {
		c.logger.Errorf("Agent 调用失败, session_id=%s, err=%v", id, err)
		return "", fmt.Errorf("Agent 调用失败: %w", err)
	}

	memory.appendTurn(schema.UserMessage(question), output)
	return output.Content, nil
}

func (c *chatServer) ChatSream(ctx context.Context, question string, id string, msgChan *chan string, doneChan *chan struct{}) error {
	defer close(*msgChan)
	defer func() {
		select {
		case *doneChan <- struct{}{}:
		default:
		}
	}()

	memory, err := loadOrCreateMemory(id)
	if err != nil {
		return err
	}
	output, err := c.runner.Stream(ctx, &chat.UserMessage{
		ID:      id,
		Query:   question,
		History: memory.historySnapshot(),
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
			memory.appendTurn(schema.UserMessage(question), schema.AssistantMessage(response.String(), nil))
			return nil
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
