package toolinput

import "context"

// StreamEvent 是用户可见的执行事实，不包含模型的隐藏推理、工具参数或原始数据。
// 正文和状态使用同一队列，确保最终核验的 replace 不会被迟到的 token 覆盖。
type StreamEvent struct {
	Name string
	Data any
}

type streamKey struct{}
type toolCallKey struct{}

func WithToolCallID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, toolCallKey{}, id)
}

// Python 的结构化步骤事件携带调用 ID，重试/并行工具不会覆盖彼此的状态。
// 不转发 stderr 原文或 detail（可能包含本机路径和原始数据）。
func StreamAnalysisStep(ctx context.Context, step, status string, attempt int) {
	id, _ := ctx.Value(toolCallKey{}).(string)
	if id == "" {
		return
	}
	if status == "started" {
		status = "running"
	}
	if len(step) > 128 {
		step = step[:128]
	}
	EmitStream(ctx, "status", map[string]any{"kind": "step", "id": id + ":" + step, "tool": step, "state": status, "attempt": attempt})
}

func WithStreamEvents(ctx context.Context, events chan<- StreamEvent) context.Context {
	return context.WithValue(ctx, streamKey{}, events)
}

func HasStreamEvents(ctx context.Context) bool {
	_, ok := ctx.Value(streamKey{}).(chan<- StreamEvent)
	return ok
}

func EmitStream(ctx context.Context, name string, data any) {
	events, ok := ctx.Value(streamKey{}).(chan<- StreamEvent)
	if !ok {
		return
	}
	select {
	case events <- StreamEvent{Name: name, Data: data}:
	case <-ctx.Done():
	}
}

func StreamPhase(ctx context.Context, phase string) {
	EmitStream(ctx, "status", map[string]any{"kind": "phase", "phase": phase})
}
