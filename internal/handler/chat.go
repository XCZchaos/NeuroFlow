package handler

import (
	"OnCallAgent/internal/server/ai/toolinput"
	"OnCallAgent/internal/server/chatServer"
	"OnCallAgent/internal/server/dataset"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/cloudwego/eino/compose"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type chatHandler struct {
	chat chatServer.ChatServer
}

type ChatHandler interface {
	SessionTask() gin.HandlerFunc
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
	Question     string          `json:"question" binding:"required"`
	UserQuery    string          `json:"user_query,omitempty"`
	ID           string          `json:"id" binding:"required"`
	DatasetID    string          `json:"dataset_id"`
	ResponseMode string          `json:"response_mode"`
	Workspace    string          `json:"workspace"`
	PPGID        string          `json:"ppg_id"`
	UIContext    json.RawMessage `json:"ui_context,omitempty"`
}

// Bind the current page to this request, even when no dataset is selected.
// Historical session binding remains persistent, but cannot silently supply the
// file for a new page. Both streaming and non-streaming routes use this guard.
func applyWorkspace(ctx *gin.Context, request ChatRequest) bool {
	// Electron 的 question 还包含页面元数据。只接受与正文末尾一致的原话，
	// 防止把上下文中的 EEG/滤波关键词误认成用户意图。此字段不参与授权。
	query := strings.TrimSpace(request.UserQuery)
	if query != "" && strings.HasSuffix(strings.TrimSpace(request.Question), query) {
		ctx.Request = ctx.Request.WithContext(toolinput.WithIntentText(ctx.Request.Context(), query))
	}
	if request.Workspace == "" {
		if len(request.UIContext) > 0 {
			ctx.JSON(400, gin.H{"message": "Component context requires workspace"})
			return false
		}
		return true
	} // Older API clients retain compatibility.
	valid := map[string]string{"eeg": "EEG", "meg": "MEG", "fnirs": "fNIRS", "sleep": "EEG", "ppg": "", "datasets": "", "history": "", "sessions": "", "help": ""}
	modality, ok := valid[request.Workspace]
	if !ok {
		ctx.JSON(400, gin.H{"message": "Unknown workspace"})
		return false
	}
	id := strings.TrimSpace(request.DatasetID)
	if request.Workspace == "ppg" || request.Workspace == "help" || request.Workspace == "sessions" {
		id = ""
	}
	if id != "" {
		record, exists := dataset.Get(id)
		if !exists || (modality != "" && record.Inspection.Modality != modality) {
			ctx.JSON(422, gin.H{"message": "Dataset missing or modality does not match this workspace"})
			return false
		}
	}
	ppgID := ""
	if request.Workspace == "ppg" {
		ppgID = request.PPGID
	}
	ctx.Request = ctx.Request.WithContext(toolinput.WithWorkspace(ctx.Request.Context(), toolinput.Workspace{Page: request.Workspace, DatasetID: id, PPGID: ppgID}))
	componentContext, err := toolinput.ParseUIContext(request.UIContext, request.Workspace, id)
	if err != nil {
		ctx.JSON(400, gin.H{"message": err.Error()})
		return false
	}
	if componentContext != nil {
		ctx.Request = ctx.Request.WithContext(toolinput.WithUIContext(ctx.Request.Context(), componentContext))
	}
	return true
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
		if !applyWorkspace(ctx, request) {
			return
		}
		if strings.TrimSpace(request.DatasetID) != "" && request.Workspace != "ppg" && request.Workspace != "help" && request.Workspace != "sessions" {
			if err := c.chat.BindDataset(ctx.Request.Context(), request.ID, request.DatasetID); err != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"code": "MEMORY_WRITE_FAILED", "message": "数据集与会话绑定失败"})
				return
			}
		}

		message, err := c.chat.Chat(ctx.Request.Context(), request.Question, request.ID, request.ResponseMode)
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
		if !applyWorkspace(ctx, request) {
			return
		}
		if strings.TrimSpace(request.DatasetID) != "" && request.Workspace != "ppg" && request.Workspace != "help" && request.Workspace != "sessions" {
			if err := c.chat.BindDataset(ctx.Request.Context(), request.ID, request.DatasetID); err != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"code": "MEMORY_WRITE_FAILED", "message": "数据集与会话绑定失败"})
				return
			}
		}

		ctx.Header("Content-Type", "text/event-stream")
		ctx.Header("Cache-Control", "no-cache")
		ctx.Header("Connection", "keep-alive")
		ctx.Header("X-Accel-Buffering", "no")

		messages := make(chan string, 8)
		done := make(chan struct{}, 1)
		// 所有事件共用 FIFO。断开连接后取消工具/模型，并释放阻塞的发送者。
		events := make(chan toolinput.StreamEvent, 32)
		requestCtx, cancel := context.WithCancel(ctx.Request.Context())
		defer cancel()
		requestCtx = toolinput.WithStreamEvents(requestCtx, events)
		go func() {
			// 不关闭共享事件通道：取消时仍可能有工具正在退出并报告结束。
			// 消费方收到终止事件即退出，cancel 负责释放剩余发送者。
			if err := c.chat.ChatSream(requestCtx, request.Question, request.ID, request.ResponseMode, &messages, &done); err != nil {
				failure := gin.H{"code": "AGENT_STREAM_FAILED", "message": "Agent 流式调用失败"}
				if errors.Is(err, compose.ErrExceedMaxSteps) {
					failure = gin.H{"code": "AGENT_STEP_LIMIT", "message": "本轮已达到 Agent 交互预算。已完成的操作不会撤销，请检查工具记录后决定是否继续；复杂任务可选择深度分析。"}
				}
				toolinput.EmitStream(requestCtx, "error", failure)
				return
			}
			toolinput.EmitStream(requestCtx, "done", "[DONE]")
		}()
		heartbeat := time.NewTicker(10 * time.Second)
		defer heartbeat.Stop()
		ctx.Writer.Flush()
		for {
			terminal := false
			select {
			case <-requestCtx.Done():
				return
			case event := <-events:
				ctx.SSEvent(event.Name, event.Data)
				terminal = event.Name == "done" || event.Name == "error"
			case <-heartbeat.C:
				// 仅证明连接存活；不能把心跳当作分析步骤已完成。
				ctx.SSEvent("heartbeat", gin.H{"alive": true})
			}
			ctx.Writer.Flush()
			if terminal {
				return
			}
		}
	}
}

// SessionTask exposes durable progress to clients without an LLM call.
func (c *chatHandler) SessionTask() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		state, err := c.chat.Task(ctx.Request.Context(), ctx.Param("id"))
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
			return
		}
		ctx.JSON(http.StatusOK, gin.H{"task": state})
	}
}
