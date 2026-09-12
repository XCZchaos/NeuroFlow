package handler

import (
	"OnCallAgent/internal/server/chatServer"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type chatHandler struct {
	chat chatServer.ChatServer
}

type ChatHandler interface {
	Chat() gin.HandlerFunc
	ChatSream() gin.HandlerFunc
	CreateSession() gin.HandlerFunc
	ListSessions() gin.HandlerFunc
	DeleteSession() gin.HandlerFunc
	SessionMessages() gin.HandlerFunc
	BindDataset() gin.HandlerFunc
	GetSessionMemory() gin.HandlerFunc
	UpdateSessionMemory() gin.HandlerFunc
}

func NewChatHandler(chat chatServer.ChatServer) ChatHandler {
	return &chatHandler{chat: chat}
}

type ChatRequest struct {
	Question  string `json:"question" binding:"required"`
	ID        string `json:"id" binding:"required"`
	DatasetID string `json:"dataset_id"`
}

func (c *chatHandler) Chat() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var request ChatRequest
		if err := ctx.ShouldBindJSON(&request); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"code":    "INVALID_REQUEST",
				"message": "question 和 id 是必填字段",
			})
			return
		}
		if strings.TrimSpace(request.DatasetID) != "" {
			if err := c.chat.BindDataset(ctx.Request.Context(), request.ID, request.DatasetID); err != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"code": "MEMORY_WRITE_FAILED", "message": "数据集与会话绑定失败"})
				return
			}
		}

		message, err := c.chat.Chat(ctx.Request.Context(), request.Question, request.ID)
		if err != nil {
			ctx.JSON(http.StatusBadGateway, gin.H{
				"code":    "AGENT_CALL_FAILED",
				"message": "Agent 调用失败，请检查模型服务和后端日志",
			})
			return
		}
		ctx.JSON(http.StatusOK, gin.H{"message": message})
	}
}

type createSessionRequest struct {
	ID    string `json:"id"`
	Title string `json:"title"`
}
type bindDatasetRequest struct {
	DatasetID string `json:"dataset_id"`
}

func (c *chatHandler) CreateSession() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var request createSessionRequest
		if err := ctx.ShouldBindJSON(&request); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"code": "INVALID_REQUEST", "message": "请求格式错误"})
			return
		}
		if strings.TrimSpace(request.ID) == "" {
			request.ID = uuid.NewString()
		}
		session, err := c.chat.CreateSession(ctx.Request.Context(), request.ID, request.Title)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"code": "MEMORY_WRITE_FAILED", "message": err.Error()})
			return
		}
		ctx.JSON(http.StatusCreated, session)
	}
}

func (c *chatHandler) ListSessions() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		sessions, err := c.chat.ListSessions(ctx.Request.Context())
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"code": "MEMORY_READ_FAILED", "message": err.Error()})
			return
		}
		ctx.JSON(http.StatusOK, gin.H{"sessions": sessions})
	}
}

func (c *chatHandler) DeleteSession() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		if err := c.chat.DeleteSession(ctx.Request.Context(), ctx.Param("id")); err != nil {
			ctx.JSON(http.StatusNotFound, gin.H{"code": "SESSION_NOT_FOUND", "message": "会话不存在"})
			return
		}
		ctx.Status(http.StatusNoContent)
	}
}

func (c *chatHandler) SessionMessages() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "200"))
		if limit < 1 || limit > 1000 {
			limit = 200
		}
		messages, err := c.chat.Messages(ctx.Request.Context(), ctx.Param("id"), limit)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"code": "MEMORY_READ_FAILED", "message": err.Error()})
			return
		}
		ctx.JSON(http.StatusOK, gin.H{"messages": messages})
	}
}

func (c *chatHandler) BindDataset() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var request bindDatasetRequest
		if err := ctx.ShouldBindJSON(&request); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"code": "INVALID_REQUEST", "message": "请求格式错误"})
			return
		}
		if err := c.chat.BindDataset(ctx.Request.Context(), ctx.Param("id"), request.DatasetID); err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"code": "MEMORY_WRITE_FAILED", "message": err.Error()})
			return
		}
		ctx.Status(http.StatusNoContent)
	}
}

func (c *chatHandler) GetSessionMemory() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		memory, err := c.chat.LongTermMemory(ctx.Request.Context(), ctx.Param("id"))
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"code": "MEMORY_READ_FAILED", "message": err.Error()})
			return
		}
		ctx.JSON(http.StatusOK, memory)
	}
}

func (c *chatHandler) UpdateSessionMemory() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var memory chatServer.StructuredMemory
		if err := ctx.ShouldBindJSON(&memory); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"code": "INVALID_REQUEST", "message": "请求格式错误"})
			return
		}
		if err := c.chat.UpdateStructuredMemory(ctx.Request.Context(), ctx.Param("id"), memory); err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"code": "MEMORY_WRITE_FAILED", "message": err.Error()})
			return
		}
		ctx.JSON(http.StatusOK, memory)
	}
}

func (c *chatHandler) ChatSream() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var request ChatRequest
		if err := ctx.ShouldBindJSON(&request); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"code":    "INVALID_REQUEST",
				"message": "question 和 id 是必填字段",
			})
			return
		}
		if strings.TrimSpace(request.DatasetID) != "" {
			if err := c.chat.BindDataset(ctx.Request.Context(), request.ID, request.DatasetID); err != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"code": "MEMORY_WRITE_FAILED", "message": "数据集与会话绑定失败"})
				return
			}
		}

		ctx.Header("Content-Type", "text/event-stream")
		ctx.Header("Cache-Control", "no-cache")
		ctx.Header("Connection", "keep-alive")

		messages := make(chan string, 8)
		done := make(chan struct{}, 1)
		errors := make(chan error, 1)
		go func() {
			errors <- c.chat.ChatSream(ctx.Request.Context(), request.Question, request.ID, &messages, &done)
		}()

		for message := range messages {
			ctx.SSEvent("message", message)
			ctx.Writer.Flush()
		}
		if err := <-errors; err != nil {
			ctx.SSEvent("error", gin.H{
				"code":    "AGENT_STREAM_FAILED",
				"message": "Agent 流式调用失败",
			})
			ctx.Writer.Flush()
			return
		}
		ctx.SSEvent("done", "[DONE]")
		ctx.Writer.Flush()
	}
}
