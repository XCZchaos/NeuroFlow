package tools

import (
	"context"
	"errors"
	"math"
	"sync"

	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/components/tool/utils"

	"github.com/cloudwego/eino-ext/components/embedding/ollama"
	qdrant_retriever "github.com/cloudwego/eino-ext/components/retriever/qdrant"
	"github.com/cloudwego/eino/components/embedding"
	"github.com/cloudwego/eino/schema"
	"github.com/qdrant/go-client/qdrant"
)

// RAGTool 信息检索工具

var ragToolGlobal *qdrant_retriever.Retriever
var mu sync.Mutex

// InitRAGTool 初始化 RAG 工具
func InitRAGTool(retriever *qdrant_retriever.Retriever) {
	mu.Lock()
	defer mu.Unlock()
	ragToolGlobal = retriever
}

func NewRetrieverServer(ctx context.Context, client *qdrant.Client, collectionName string, embeddder ollama.Embedder, ScoreThreshold float64, limit int) (*qdrant_retriever.Retriever, error) {
	mu.Lock()
	defer mu.Unlock()
	var err error
	if ragToolGlobal == nil {
		ragToolGlobal, err = qdrant_retriever.NewRetriever(ctx, &qdrant_retriever.Config{
			Client:         client,
			Collection:     collectionName,
			Embedding:      &embeddderNormalize{embedder: embeddder},
			ScoreThreshold: &ScoreThreshold,
			TopK:           limit, // 返回最相似的N个文档
		})
	}
	if err != nil {
		return nil, err
	}
	return ragToolGlobal, nil
}

type embeddderNormalize struct {
	embedder ollama.Embedder
}

func (e *embeddderNormalize) EmbedStrings(ctx context.Context, texts []string, opts ...embedding.Option) ([][]float64, error) {
	res, err := e.embedder.EmbedStrings(ctx, texts, opts...)
	if err != nil {
		return nil, err
	}
	//归一化
	for i, v := range res {
		mo := 0.
		for _, vv := range v {
			mo += vv * vv
		}
		mo = math.Sqrt(mo)
		if mo == 0 {
			continue // 零向量，跳过，避免除零
		}
		for j, vv := range v {
			res[i][j] = vv / mo
		}
	}
	return res, nil
}

type RetrieveRequest struct {
	Query string `json:"query" jsonschema:"description=用于检索 BCI 专家知识的具体问题；应包含已知的模态、范式和处理阶段，例如 EEG motor imagery filtering"`
}

func retrieve(ctx context.Context, query RetrieveRequest) (docs []*schema.Document, err error) {
	mu.Lock()
	retriever := ragToolGlobal
	mu.Unlock()
	if retriever == nil {
		return nil, errors.New("知识库检索器尚未初始化，请确认 Qdrant 与 embedding 服务已经启动")
	}
	return retriever.Retrieve(ctx, query.Query)
}

func RetrieveTool() (tool.InvokableTool, error) {
	return utils.InferTool("query_internal_docs",
		"检索经过提炼的 BCI 专家知识库。主聊天流程会先执行一次检索；当初次证据不足、问题包含多个处理阶段或需要补查具体约束时，必须调用本工具进行二次检索。查询应包含模态、范式、处理阶段和具体问题。检索结果是知识证据，不代表工具已经执行了信号处理。",
		retrieve)
}
