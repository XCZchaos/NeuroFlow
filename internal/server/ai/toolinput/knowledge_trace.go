package toolinput

import (
	"context"
	"github.com/cloudwego/eino/schema"
	"regexp"
	"strings"
)

var knowledgeTitleID = regexp.MustCompile(`^([A-Z][A-Z0-9-]*-[0-9]{3})(?:\s|$)`)

// 只登记实际交给模型的文档标题 ID，而不是目录里所有可用的知识。
// Qdrant 内容可能以 '# ID 标题' 或 'ID 标题' 开头，两种索引均兼容。
func RecordKnowledge(ctx context.Context, docs []*schema.Document) {
	ids := []string{}
	seen := map[string]bool{}
	for _, doc := range docs {
		if doc == nil {
			continue
		}
		title := strings.TrimSpace(strings.SplitN(doc.Content, "\n", 2)[0])
		title = strings.TrimSpace(strings.TrimLeft(title, "#"))
		if match := knowledgeTitleID.FindStringSubmatch(title); len(match) > 1 && !seen[match[1]] {
			ids = append(ids, match[1])
			seen[match[1]] = true
		}
	}
	Record(ctx, ToolResult{Name: "query_internal_docs", Succeeded: true, KnowledgeIDs: ids})
}
