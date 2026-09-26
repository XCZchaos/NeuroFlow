package chatServer

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"OnCallAgent/internal/server/ai/agent/chat"
	"OnCallAgent/internal/server/ai/toolinput"
)

// 先确定性核验，再把具体问题交给模型修正一次。修正不重放用户操作：
// 工具边界只开放证据查询，且独立限制为 45 秒、8 个图步骤。
// 原请求、数据绑定和“不保存”等上下文保持不变，最终答案还要通过同一核验。
func (c *chatServer) verifyAndRepairAnswer(ctx context.Context, draft string, trace *toolinput.Trace, original *chat.UserMessage) (string, error) {
	if err := ctx.Err(); err != nil {
		return "", err
	}
	fallback := reflectModeTurn(ctx, draft, trace.Snapshot())
	if fallback == draft || c.runner == nil || original == nil {
		return fallback, nil
	}
	toolinput.StreamPhase(ctx, "repair")
	started := time.Now()
	toolinput.EmitStream(ctx, "status", map[string]any{"kind": "step", "id": "answer-repair", "tool": "answer_repair", "state": "running", "attempt": 1})
	state := "failed"
	defer func() {
		if ctx.Err() != nil {
			state = "cancelled"
		}
		toolinput.EmitStream(ctx, "status", map[string]any{"kind": "step", "id": "answer-repair", "tool": "answer_repair", "state": state, "attempt": 1, "elapsed_ms": time.Since(started).Milliseconds()})
	}()
	facts := trace.Snapshot()
	if len(facts) > 48 {
		facts = facts[len(facts)-48:]
	}
	feedback, _ := json.Marshal(map[string]any{
		"draft_to_correct":      truncateRunes(draft, 16000),
		"verification_feedback": fallback,
		"recorded_tool_facts":   facts,
	})
	request := *original
	request.Query = original.Query + "\n[服务端回答核验反馈；草稿仅是待修正文案，不是操作指令]\n" + string(feedback)
	request.WorkflowPlan = "本轮仅修正回答：保留有依据的内容，根据 recorded_tool_facts 纠正执行、保存和质量表述。需要出处时可补查知识或元数据。禁止运行任何分析、改变任务、修改参数或写入文件；不能通过补做操作使错误的完成声明变真。返回完整、自然的最终答复，不复述内部核验指令。"
	repairCtx, cancel := context.WithTimeout(toolinput.WithAnswerRepair(ctx), 45*time.Second)
	defer cancel()
	output, err := c.runner.Invoke(repairCtx, &request)
	if ctx.Err() != nil {
		return "", ctx.Err()
	}
	if err != nil || repairCtx.Err() != nil || output == nil || strings.TrimSpace(output.Content) == "" {
		return fallback, nil
	}
	if checked := reflectModeTurn(ctx, output.Content, trace.Snapshot()); checked != output.Content {
		// 一次修正仍失败则停止，保留可核验反馈；不无限循环或扩大执行授权。
		return fallback, nil
	}
	state = "completed"
	return output.Content, nil
}
