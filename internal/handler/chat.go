package handler

import (
	"OnCallAgent/internal/server/chatServer"
	"net/http"

	"github.com/gin-gonic/gin"
)

type chatHandler struct {
	chat chatServer.ChatServer
}

type ChatHandler interface {
	Chat() gin.HandlerFunc
	ChatSream() gin.HandlerFunc
}

func NewChatHandler(chat chatServer.ChatServer) ChatHandler {
	return &chatHandler{chat: chat}
}

type ChatRequest struct {
	Question string `json:"question" binding:"required"`
	ID       string `json:"id" binding:"required"`
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
