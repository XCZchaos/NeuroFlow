package main

import (
	indexerr "OnCallAgent/internal/repo/qrdant/indexer"
	initQdrantRepo "OnCallAgent/internal/repo/qrdant/init"
	"OnCallAgent/internal/repo/qrdant/retriever"
	"OnCallAgent/internal/router"
	"OnCallAgent/internal/server/ai/agent/chat"
	knowledgeindex "OnCallAgent/internal/server/ai/agent/knowledge_index"
	"OnCallAgent/internal/server/ai/embeder"
	"OnCallAgent/internal/server/chatServer"
	"OnCallAgent/internal/server/model"
	"OnCallAgent/pkg/config"
	"OnCallAgent/pkg/log"
	"context"
	"fmt"

	"github.com/gin-gonic/gin"
)

func main() {
	ctx := context.Background()
	// 初始化日志记录器
	log := log.InitLogger("info", "log/OnCallAgent.log")
	//初始化配置
	config, err := config.InitConfig("./config/config.json")
	if err != nil {
		panic(err)
	}
	//初始化qdrant
	indexer, err := initQdrantRepo.NewQdrantIndexer(ctx, config)
	if err != nil {
		panic(err)
	}
	//初始化embedding
	embedder, err := embeder.NewEmbedder(ctx, config)
	if err != nil {
		panic(err)
	}
	//初始化retriever
	retriever := retriever.NewRetrieverServer(ctx, indexer, *embedder)
	// 专家知识采用原子化条目。TopK=5 在提供多来源证据的同时避免把过多文本塞入模型上下文。
	run, err := retriever.NewRetrieverServer(ctx, "oncallagent", 0.5, 5)
	if err != nil {
		panic(err)
	}
	//初始化chatAgent
	re := chat.NewChatServer(run, config)
	runner, err := re.BuildChatAgent(ctx)
	if err != nil {
		panic(err)
	}
	//新建集合
	indexerr := indexerr.NewQdranIndexerServer(ctx, indexer, *embedder)
	err = indexerr.NewQdrantIndexer(ctx)
	if err != nil {
		panic(err)
	}
	//初始化RAGagent
	knowledgeIndex := knowledgeindex.NewKnowledgeIndex(embeder.NewEmbeddingServer(embedder), indexerr)
	runnerRAG, err := knowledgeIndex.NewGraph(ctx)
	if err != nil {
		panic(err)
	}
	//初始化model
	chatModel, err := model.NewOpenaiModel(ctx, config)
	if err != nil {
		panic(err)
	}
	// SQLite 同时保存完整消息、近期上下文之外的摘要、结构化偏好和数据集绑定。
	memoryStore, err := chatServer.NewSQLiteMemoryStore("./data/neuroflow.db")
	if err != nil {
		panic(err)
	}
	defer memoryStore.Close()
	// 初始化gin
	r := gin.Default()
	router.InitRouter(ctx, r, log, config, runnerRAG, runner, chatModel, run, memoryStore)
	// 启动 HTTP 服务
	addr := fmt.Sprintf("%s:%d", config.Server.Host, config.Server.Port)
	if err = r.Run(addr); err != nil {
		panic(err)
	}
}
