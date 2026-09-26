package toolinput

import (
	"context"
	"sync"
)

type traceKey struct{}

// ToolResult 只记录可核验的工具事实；大模型生成的文字不能写进执行证据。
type ToolResult struct {
	Name         string
	DatasetID    string
	AnalysisType string // summary/quality/full，防止只读诊断被当成已执行预处理。
	Succeeded    bool
	Saved        bool
	Steps        map[string]string
	BeforeScore  *float64
	AfterScore   *float64
	KnowledgeIDs []string
}

// Trace 是单次聊天请求的执行记录。Eino 的工具节点可能并发执行，故需加锁。
type Trace struct {
	mu      sync.Mutex
	results []ToolResult
}

func WithTrace(ctx context.Context, trace *Trace) context.Context {
	return context.WithValue(ctx, traceKey{}, trace)
}

func Record(ctx context.Context, result ToolResult) {
	trace, _ := ctx.Value(traceKey{}).(*Trace)
	if trace == nil {
		return
	}
	trace.mu.Lock()
	defer trace.mu.Unlock()
	trace.results = append(trace.results, result)
}

func (t *Trace) Snapshot() []ToolResult {
	if t == nil {
		return nil
	}
	t.mu.Lock()
	defer t.mu.Unlock()
	result := make([]ToolResult, len(t.results))
	for i, item := range t.results {
		result[i] = item
		result[i].KnowledgeIDs = append([]string(nil), item.KnowledgeIDs...)
		result[i].Steps = make(map[string]string, len(item.Steps))
		if item.BeforeScore != nil {
			value := *item.BeforeScore
			result[i].BeforeScore = &value
		}
		if item.AfterScore != nil {
			value := *item.AfterScore
			result[i].AfterScore = &value
		}
		for key, value := range item.Steps {
			result[i].Steps[key] = value
		}
	}
	return result
}
