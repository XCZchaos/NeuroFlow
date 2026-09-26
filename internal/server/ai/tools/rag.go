package tools

import (
	"OnCallAgent/internal/server/ai/toolinput"
	"context"
	"errors"
	"math"
	"sync"
	"time"

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
	docs, err = retriever.Retrieve(ctx, query.Query)
	if err == nil {
		toolinput.RecordKnowledge(ctx, docs)
	}
	return docs, err
}

func RetrieveTool() (tool.InvokableTool, error) {
	return utils.InferTool("query_internal_docs",
		"检索 BCI 专家知识。外层按模式和问题类型执行零至两轮检索；初次证据不足、包含多个处理阶段或需要补查具体约束时，用本工具针对性补检索。查询包含模态、范式、阶段和问题。检索结果不代表已经处理信号。",
		func(ctx context.Context, request RetrieveRequest) (any, error) {
			// 检索不可用也是一种观察结果。交回模型决定如何说明证据边界，
			// 不让可恢复的知识服务故障直接终止整个 ReAct/SSE 对话。
			lookupCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
			defer cancel()
			docs, err := retrieve(lookupCtx, request)
			if ctx.Err() != nil {
				return nil, ctx.Err()
			}
			if err != nil {
				return map[string]any{"ok": false, "code": "KNOWLEDGE_UNAVAILABLE", "message": "本次知识检索未取得证据；请说明缺失依据，继续可验证的部分，不要原样反复重试。", "retryable": false}, nil
			}
			return docs, nil
		})
}
