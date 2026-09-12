package chat

import "github.com/cloudwego/eino/schema"

type UserMessage struct {
	ID      string            `json:"id"`
	Query   string            `json:"query"`
	History []*schema.Message `json:"history"`
	// Memory 是 SQLite 中的长期摘要、研究目标、偏好和数据集绑定。
	// 它与最近原始消息分开注入，避免扩大 history 窗口。
	Memory string `json:"memory"`
}
