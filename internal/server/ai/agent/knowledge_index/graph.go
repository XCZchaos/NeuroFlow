package knowledgeindex

import (
	"OnCallAgent/pkg/tool"
	"context"
	"fmt"
	"strings"

	"github.com/cloudwego/eino/components/document"
	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/schema"
	"github.com/google/uuid"
	"github.com/qdrant/go-client/qdrant"
)

const (
	FileLoader       = "FileLoader"
	MarkdownSplitter = "MarkdownSplitter"
	QdrantIndexer    = "QdrantIndexer"
)

func (k *knowledgeIndex) NewGraph(ctx context.Context) (r compose.Runnable[document.Source, bool], err error) {
	g := compose.NewGraph[document.Source, bool]()
	lodder, err := k.NewFileLoader(ctx)
	if err != nil {
		return nil, fmt.Errorf("knowledge_index:Graph:生成lodder失败%v", err)
	}
	err = g.AddLoaderNode(FileLoader, lodder)
	if err != nil {
		return nil, fmt.Errorf("knowledge_index:Graph:添加FileLoader节点失败%v", err)
	}
	transformer, err := k.NewSplitMarkdown(ctx)
	if err != nil {
		return nil, fmt.Errorf("knowledge_index:Graph:生成transformer失败%v", err)
	}
	err = g.AddDocumentTransformerNode(MarkdownSplitter, transformer)
	if err != nil {
		return nil, fmt.Errorf("knowledge_index:Graph:添加transformer节点失败%v", err)
	}
	qdantNode := compose.InvokableLambda(k.textToQdrantIndex())
	err = g.AddLambdaNode(QdrantIndexer, qdantNode)
	if err != nil {
		return nil, fmt.Errorf("knowledge_index:Graph:添加QdrantIndexer节点失败%v", err)
	}

	//构建图
	_ = g.AddEdge(compose.START, FileLoader)
	_ = g.AddEdge(QdrantIndexer, compose.END)
	_ = g.AddEdge(FileLoader, MarkdownSplitter)
	_ = g.AddEdge(MarkdownSplitter, QdrantIndexer)
	r, err = g.Compile(ctx, compose.WithGraphName("KnowledgeIndexing"), compose.WithNodeTriggerMode(compose.AnyPredecessor))
	if err != nil {
		return nil, fmt.Errorf("knowledge_index:Graph:编译图失败%v", err)
	}

	return r, nil
}

func (k *knowledgeIndex) textToQdrantIndex() func(ctx context.Context, req []*schema.Document) (bool, error) {
	return func(ctx context.Context, req []*schema.Document) (bool, error) {
		points := make([]*qdrant.PointStruct, 0, len(req))
		for _, doc := range req {
			lines := strings.Split(doc.Content, "\n")
			if len(lines) == 0 {
				continue
			}
			title := lines[0]
			// 只处理一级标题
			if !strings.HasPrefix(title, "#") {
				continue
			}
			title = strings.TrimSpace(strings.TrimLeft(title, "#"))
			body := lines[1:]
			titleFields := strings.Fields(title)
			if len(titleFields) == 0 {
				continue
			}
			knowledgeID := titleFields[0]
			metadata := parseKnowledgeMetadata(body)

			// title 权重为 2，其余行各一份
			temp := []string{title, title}
			temp = append(temp, body...)

			t, err := k.embederServer.Embedding(ctx, temp)
			if err != nil {
				return false, fmt.Errorf("knowledge_index:Graph:向量化失败: %w", err)
			}
			res, err := k.embederServer.Average(t)
			if err != nil {
				return false, fmt.Errorf("knowledge_index:Graph:求均值失败: %w", err)
			}
			res = k.embederServer.Normalize(res)

			payloadData := map[string]any{
				"knowledge_id": knowledgeID,
				"title":        title,
				"content":      title + "\n" + strings.Join(body, "\n"),
			}
			for key, value := range metadata {
				payloadData[key] = value
			}
			payload := qdrant.NewValueMap(payloadData)
			points = append(points, &qdrant.PointStruct{
				Id: &qdrant.PointId{
					// 稳定 UUID 让同一知识点重新索引时覆盖旧版本，而不是不断产生重复向量。
					PointIdOptions: &qdrant.PointId_Uuid{Uuid: uuid.NewSHA1(uuid.NameSpaceURL, []byte(knowledgeID)).String()},
				},
				Vectors: &qdrant.Vectors{VectorsOptions: &qdrant.Vectors_Vector{Vector: &qdrant.Vector{Vector: &qdrant.Vector_Dense{Dense: &qdrant.DenseVector{Data: tool.ToFloat32(res)}}}}},
				Payload: payload,
			})
		}
		if len(points) == 0 {
			return true, nil
		}
		if err := k.qdrantServer.AddVector(ctx, &qdrant.UpsertPoints{Points: points}); err != nil {
			return false, fmt.Errorf("knowledge_index:Graph:写入Qdrant失败: %w", err)
		}
		return true, nil
	}
}

// parseKnowledgeMetadata 从原子知识正文开头的 "- key: value" 行提取可过滤字段。
// 正文仍完整保存在 content 中，现有语义检索保持兼容；这些 payload 为后续分层检索预留。
func parseKnowledgeMetadata(lines []string) map[string]any {
	allowed := map[string]bool{
		"modality": true, "paradigm": true, "stage": true, "software": true,
		"knowledge_type": true, "review_status": true,
	}
	result := make(map[string]any)
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "来源：") {
			if index := strings.Index(trimmed, "https://"); index >= 0 {
				result["source_url"] = strings.TrimSpace(trimmed[index:])
			}
			continue
		}
		if !strings.HasPrefix(trimmed, "- ") {
			continue
		}
		parts := strings.SplitN(strings.TrimPrefix(trimmed, "- "), ":", 2)
		if len(parts) != 2 {
			continue
		}
		key, value := strings.TrimSpace(parts[0]), strings.TrimSpace(parts[1])
		if !allowed[key] || value == "" {
			continue
		}
		values := strings.Split(value, ",")
		if len(values) == 1 {
			result[key] = value
			continue
		}
		clean := make([]any, 0, len(values))
		for _, item := range values {
			if item = strings.TrimSpace(item); item != "" {
				clean = append(clean, item)
			}
		}
		result[key] = clean
	}
	return result
}
