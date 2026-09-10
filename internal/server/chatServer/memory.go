package chatServer

import (
	"fmt"
	"strings"
	"sync"

	"github.com/cloudwego/eino/schema"
)

var SimpleMemoryMap = &sync.Map{}

type SimpleMemory struct {
	mu            sync.Mutex
	ID            string
	Messages      []*schema.Message
	MaxWindowSize int
}

func NewMemory(id string, max int) error {
	id = strings.TrimSpace(id)
	if id == "" {
		return fmt.Errorf("会话 ID 不能为空")
	}
	if max <= 0 {
		// 一轮对话包含 user 和 assistant 两条消息；12 条约等于最近 6 轮。
		// 这里限制的是历史记忆，并不限制模型当前一次回答的输出长度。
		max = 12
	}
	SimpleMemoryMap.LoadOrStore(id, &SimpleMemory{
		ID:            id,
		Messages:      []*schema.Message{},
		MaxWindowSize: max,
	})
	return nil
}

func loadOrCreateMemory(id string) (*SimpleMemory, error) {
	if err := NewMemory(id, 0); err != nil {
		return nil, err
	}
	value, ok := SimpleMemoryMap.Load(strings.TrimSpace(id))
	if !ok {
		return nil, fmt.Errorf("创建会话失败")
	}
	memory, ok := value.(*SimpleMemory)
	if !ok {
		return nil, fmt.Errorf("会话状态类型错误")
	}
	return memory, nil
}

func (m *SimpleMemory) historySnapshot() []*schema.Message {
	m.mu.Lock()
	defer m.mu.Unlock()
	history := make([]*schema.Message, len(m.Messages))
	copy(history, m.Messages)
	return history
}

func (m *SimpleMemory) appendTurn(user, assistant *schema.Message) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.Messages = append(m.Messages, user, assistant)
	if len(m.Messages) > m.MaxWindowSize {
		m.Messages = m.Messages[len(m.Messages)-m.MaxWindowSize:]
	}
}
