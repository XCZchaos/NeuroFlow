package router

import (
	"OnCallAgent/internal/handler"
	"OnCallAgent/internal/server/batch"
	"OnCallAgent/internal/server/batchstate"
	"OnCallAgent/internal/server/chatServer"
	knowledgeindex "OnCallAgent/internal/server/knowledge_index"
	"OnCallAgent/internal/server/modelruntime"
	"OnCallAgent/internal/server/plan"
	"OnCallAgent/pkg/config"
	"context"

	qdrant_retriever "github.com/cloudwego/eino-ext/components/retriever/qdrant"
	"github.com/cloudwego/eino/components/document"
	"github.com/cloudwego/eino/compose"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func InitRouter(ctx context.Context, r *gin.Engine, loger *logrus.Logger, config *config.Config, runner compose.Runnable[document.Source, bool], models *modelruntime.Manager, controlToken string, retriever *qdrant_retriever.Retriever, memory chatServer.MemoryStore) {
	//cors
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{"*"}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	r.Use(cors.New(corsConfig))
	r.GET("/ping", func(ctx *gin.Context) {
		ctx.JSON(200, gin.H{
			"message": "pong",
		})
	})
	//文件上传
	uploder := knowledgeindex.NewFileUploaderServer(loger, runner)
	// 上传副本属于运行时文件，保存在已被 Git 忽略的 uploads 目录；审核后的知识源仍位于 docs/knowledge。
	uploderHandler := handler.NewFileUploader("./uploads/", uploder)
	r.POST("/upload", uploderHandler.Upload())
	//对话
	// Pin the complete generation per HTTP request, including answer repair.
	chaterHandler := func(method func(handler.ChatHandler) gin.HandlerFunc, needsModel bool) gin.HandlerFunc {
		return func(c *gin.Context) {
			snapshot := models.Snapshot()
			if needsModel && snapshot.Config.OpenAI.APIKey == "" {
				c.JSON(503, gin.H{"code": "MODEL_DISABLED", "message": "API Key is empty; save a model configuration first"})
				return
			}
			method(handler.NewChatHandler(chatServer.NewChatServer(loger, snapshot.Runner, memory)))(c)
		}
	}
	r.POST("/chat", chaterHandler(func(h handler.ChatHandler) gin.HandlerFunc { return h.Chat() }, true))
	r.POST("/chatStream", chaterHandler(func(h handler.ChatHandler) gin.HandlerFunc { return h.ChatSream() }, true))
	r.GET("/sessions", chaterHandler(func(h handler.ChatHandler) gin.HandlerFunc { return h.ListSessions() }, false))
	r.POST("/sessions", chaterHandler(func(h handler.ChatHandler) gin.HandlerFunc { return h.CreateSession() }, false))
	r.DELETE("/sessions/:id", chaterHandler(func(h handler.ChatHandler) gin.HandlerFunc { return h.DeleteSession() }, false))
	r.GET("/sessions/:id/task", chaterHandler(func(h handler.ChatHandler) gin.HandlerFunc { return h.SessionTask() }, false))
	r.GET("/sessions/:id/messages", chaterHandler(func(h handler.ChatHandler) gin.HandlerFunc { return h.SessionMessages() }, false))
	r.PUT("/sessions/:id/dataset", chaterHandler(func(h handler.ChatHandler) gin.HandlerFunc { return h.BindDataset() }, false))
	r.GET("/sessions/:id/memory", chaterHandler(func(h handler.ChatHandler) gin.HandlerFunc { return h.GetSessionMemory() }, false))
	r.PUT("/sessions/:id/memory", chaterHandler(func(h handler.ChatHandler) gin.HandlerFunc { return h.UpdateSessionMemory() }, false))
	r.POST("/agent/preprocessing/draft", handler.NeuroPreprocessingDraft())
	r.GET("/knowledge/catalog", handler.KnowledgeCatalog())
	r.POST("/knowledge/audit", handler.AuditKnowledgeEvidence())
	// 数据集接口与普通知识库上传分开：这里读取的是神经信号元数据，
	// 不会把二进制波形当作文档切片写入向量数据库。
	r.POST("/datasets/register", handler.RegisterDataset())
	r.POST("/ppg/inspect", handler.ProcessPPG("inspect"))
	r.POST("/ppg/analyze", handler.ProcessPPG("analyze"))
	r.POST("/ppg/prepare", handler.ProcessPPG("prepare"))
	r.GET("/ppg/:id/latest", handler.LatestPPG())
	r.POST("/bids/browse", handler.BrowseBIDS())
	r.GET("/datasets/:id", handler.GetDataset())
	r.PUT("/datasets/:id/structure", handler.ConfirmDatasetStructure())
	r.PUT("/datasets/:id/labels", handler.AttachDatasetLabels())
	r.GET("/datasets/:id/labels", handler.GetDatasetLabels())
	r.DELETE("/datasets/:id/labels", handler.DeleteDatasetLabels())
	r.GET("/datasets/:id/preview", handler.PreviewDataset())
	r.GET("/datasets/:id/signal", handler.SignalWindow())
	r.GET("/datasets/:id/analysis/latest", handler.LatestDatasetAnalysis())
	r.GET("/datasets/:id/analysis/events", handler.AnalysisEvents())
	r.GET("/datasets/:id/derivatives", handler.DatasetDerivatives())
	r.POST("/datasets/:id/analyze", handler.AnalyzeDataset())
	r.POST("/datasets/:id/sleep/stage", handler.StageSleepDataset())
	r.GET("/datasets/:id/sleep/stages/latest", handler.LatestSleepStages())
	if provider, ok := memory.(interface{ BatchStore() *batchstate.Store }); ok {
		batches := batch.New(provider.BatchStore())
		r.POST("/batches", handler.CreateBatch(batches))
		r.GET("/batches", handler.ListBatches(batches))
		r.GET("/batches/:id", handler.GetBatch(batches))
		r.POST("/batches/:id/pause", handler.PauseBatch(batches))
		r.POST("/batches/:id/resume", handler.ResumeBatch(batches))
		r.DELETE("/batches/:id", handler.DeleteBatch(batches))
	}
	//运维
	r.GET("/plan", func(c *gin.Context) {
		snapshot := models.Snapshot()
		if snapshot.Config.OpenAI.APIKey == "" {
			c.JSON(503, gin.H{"code": "MODEL_DISABLED", "message": "API Key is empty"})
			return
		}
		handler.NewPlanHandler(plan.NewPlanServer(snapshot.Config, snapshot.Model, loger, retriever)).Plan()(c)
	})
	control := r.Group("/model", handler.ModelControlAuth(controlToken))
	control.GET("/runtime", handler.ModelStatus(models))
	control.PUT("/runtime", handler.ApplyModelSettings(models))
	control.POST("/test-agent", handler.TestActiveAgent(models))
}
