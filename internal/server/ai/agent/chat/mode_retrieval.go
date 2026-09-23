package chat

import (
	"OnCallAgent/internal/server/ai/toolinput"
	"context"
	"fmt"
	"github.com/cloudwego/eino/components/retriever"
	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/schema"
	"strings"
	"time"
)

type knowledgeRetriever interface {
	Retrieve(context.Context, string, ...retriever.Option) ([]*schema.Document, error)
}

// 轻量路由采用保守白名单；任何专业术语/复合问题仍保留检索。
// 不根据前端“help 页面”就跳过科学证据，也不让此判断改变工具权限。
func lightweightQuestion(query string, explainComponent bool) bool {
	q := strings.ToLower(strings.TrimSpace(query))
	for _, term := range []string{"滤波", "参考", "ica", "坏道", "伪迹", "预处理", "分期", "频带", "原理", "为什么", "风险", "影响", "合适", "选择", "建议", "分析", "处理", "计算", "单位", "filter", "reference", "artifact", "preprocess", "staging", "risk", "why", "erp", "decod", "nyquist", "should", "choose", "affect", "analy", "calculate", "run ", "unit"} {
		if strings.Contains(q, term) {
			return false
		}
	}
	if explainComponent {
		return true
	}
	q = strings.Trim(q, " ?？!！。.")
	for _, greeting := range []string{"你好", "您好", "谢谢", "hello", "hi", "thanks", "thank you"} {
		if q == greeting {
			return true
		}
	}
	for _, fact := range []string{"多少通道", "几个通道", "通道数", "采样率是多少", "采样频率是多少", "记录时长", "文件格式", "how many channels", "channel count", "sampling rate", "recording duration", "file format"} {
		if strings.Contains(q, fact) && len([]rune(q)) <= 80 {
			return true
		}
	}
	return false
}

func modeRetrieval(reader knowledgeRetriever) func(context.Context, *UserMessage, ...compose.LambdaOpt) (map[string]any, error) {
	return func(ctx context.Context, input *UserMessage, _ ...compose.LambdaOpt) (map[string]any, error) {
		policy := toolinput.Policy(input.ResponseMode)
		query := toolinput.IntentText(ctx, input.Query)
		ui := toolinput.CurrentUIContext(ctx)
		light := lightweightQuestion(query, ui != nil && ui.ExplainOnly)
		searches := policy.Searches
		if light {
			searches = 0
		}
		toolinput.EmitStream(ctx, "status", map[string]any{"kind": "policy", "mode": policy.Mode, "automatic_searches": searches, "max_graph_steps": policy.MaxGraphSteps})
		if light {
			return map[string]any{"documents": []*schema.Document{}, "evidence_status": "本轮走简单事实/组件路径，未做自动知识检索。涉及文件事实仍需 inspect_dataset；专业判断仍可主动检索，不得声称已查过知识库。"}, nil
		}
		queries := []string{buildKnowledgeQuery(query)}
		if searches == 2 {
			queries = append(queries, buildKnowledgeQuery(query)+"\n前提条件 禁忌 风险 验证方法 prerequisites contraindications constraints risks validation audit")
		}
		documents := []*schema.Document{}
		seen := map[string]bool{}
		notes := []string{}
		for index, search := range queries {
			if ctx.Err() != nil {
				return nil, ctx.Err()
			}
			id := fmt.Sprintf("evidence-%d", index+1)
			toolName := "knowledge_primary"
			if index > 0 {
				toolName = "knowledge_constraints"
			}
			toolinput.EmitStream(ctx, "status", map[string]any{"kind": "step", "id": id, "tool": toolName, "state": "running"})
			// 限定单次检索等待，知识服务故障不再让整个聊天只返回连接失败。
			lookupCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
			var docs []*schema.Document
			var err error
			if reader == nil {
				err = fmt.Errorf("knowledge retriever unavailable")
			} else {
				docs, err = reader.Retrieve(lookupCtx, search, retriever.WithTopK(policy.TopK))
			}
			cancel()
			if ctx.Err() != nil {
				return nil, ctx.Err()
			}
			state := "completed"
			if err != nil {
				state = "failed"
				notes = append(notes, fmt.Sprintf("第 %d 轮知识检索失败；不可将该轮描述为已取得证据。", index+1))
			} else {
				if len(docs) == 0 {
					state = "empty"
					notes = append(notes, fmt.Sprintf("第 %d 轮未命中本地知识，请区分一般解释与有来源的建议。", index+1))
				}
				for _, doc := range docs {
					if doc == nil || strings.TrimSpace(doc.Content) == "" {
						continue
					}
					key := doc.ID
					if key == "" {
						key = doc.Content
					}
					if seen[key] || len(documents) >= policy.MaxDocuments {
						continue
					}
					seen[key] = true
					copyDoc := *doc
					body := []rune(copyDoc.Content)
					if len(body) > 4000 {
						copyDoc.Content = string(body[:4000]) + "\n[文档节选已截断；完整约束需要补检索]"
					}
					documents = append(documents, &copyDoc)
				}
			}
			toolinput.EmitStream(ctx, "status", map[string]any{"kind": "step", "id": id, "tool": toolName, "state": state, "document_count": len(docs)})
		}
		toolinput.RecordKnowledge(ctx, documents)
		status := fmt.Sprintf("外层已执行 %d 轮检索，合并后向模型提供 %d 条文档。", searches, len(documents)) + strings.Join(notes, " ")
		if policy.Mode == "deep" {
			status += "已执行主问题与约束二次知识检索，不必机械重复；证据不足时仍需针对性补查。最终引用必须来自本轮实际读取的证据。"
		}
		return map[string]any{"documents": documents, "evidence_status": status}, nil
	}
}
