package router

import (
	"OnCallAgent/internal/handler"
	"OnCallAgent/internal/server/ai/agent/chat"
	"OnCallAgent/internal/server/chatServer"
	knowledgeindex "OnCallAgent/internal/server/knowledge_index"
	"OnCallAgent/internal/server/plan"
	"OnCallAgent/pkg/config"
	"context"

	"github.com/cloudwego/eino-ext/components/model/openai"
	qdrant_retriever "github.com/cloudwego/eino-ext/components/retriever/qdrant"
	"github.com/cloudwego/eino/components/document"
	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/schema"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func InitRouter(ctx context.Context, r *gin.Engine, loger *logrus.Logger, config *config.Config, runner compose.Runnable[document.Source, bool], runnerChat compose.Runnable[*chat.UserMessage, *schema.Message], model *openai.ChatModel, retriever *qdrant_retriever.Retriever) {
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
	chater := chatServer.NewChatServer(loger, runnerChat)
	chaterHandler := handler.NewChatHandler(chater)
	r.POST("/chat", chaterHandler.Chat())
	r.POST("/chatStream", chaterHandler.ChatSream())
	r.POST("/agent/preprocessing/draft", handler.NeuroPreprocessingDraft())
	// 数据集接口与普通知识库上传分开：这里读取的是神经信号元数据，
	// 不会把二进制波形当作文档切片写入向量数据库。
	r.POST("/datasets/register", handler.RegisterDataset())
	r.GET("/datasets/:id", handler.GetDataset())
	r.GET("/datasets/:id/preview", handler.PreviewDataset())
	r.GET("/datasets/:id/signal", handler.SignalWindow())
	r.GET("/datasets/:id/analysis/latest", handler.LatestDatasetAnalysis())
	r.POST("/datasets/:id/analyze", handler.AnalyzeDataset())
	//运维
	planer := plan.NewPlanServer(*config, model, loger, retriever)
	planerH := handler.NewPlanHandler(planer)
	r.GET("/plan", planerH.Plan())
}
