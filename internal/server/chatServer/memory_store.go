package chatServer

import (
	"context"
	"time"

	"github.com/cloudwego/eino/schema"
)

// Session 是前端会话列表所需的稳定元数据。DatasetID 为空表示尚未绑定数据集。
type Session struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	DatasetID string    `json:"dataset_id,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// StructuredMemory 保存不应依赖最近消息窗口的长期信息。
// Preferences 使用有限键值而不是自由文本指令，避免历史内容改变系统安全规则。
type StructuredMemory struct {
	ResearchGoal string            `json:"research_goal,omitempty"`
	Preferences  map[string]string `json:"preferences"`
	Summary      string            `json:"summary,omitempty"`
}

type MemoryStore interface {
	CreateSession(ctx context.Context, id, title string) (Session, error)
	EnsureSession(ctx context.Context, id string) (Session, error)
	ListSessions(ctx context.Context) ([]Session, error)
	DeleteSession(ctx context.Context, id string) error
	BindDataset(ctx context.Context, id, datasetID string) error
	Messages(ctx context.Context, id string, limit int) ([]*schema.Message, error)
	AppendTurn(ctx context.Context, id, question, answer string) error
	LongTermMemory(ctx context.Context, id string) (StructuredMemory, error)
	UpdateStructuredMemory(ctx context.Context, id string, memory StructuredMemory) error
	Close() error
}
