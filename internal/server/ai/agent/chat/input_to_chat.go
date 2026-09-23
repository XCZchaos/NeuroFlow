package chat

import (
	"context"
	"time"

	"github.com/cloudwego/eino/compose"
)

func newInputToChatLambda(ctx context.Context, input *UserMessage, opts ...compose.LambdaOpt) (output map[string]any, err error) {
	responseMode := "即时回答模式：结论优先，简单问题简洁回答，不硬性限制为 3–6 句话；用户要求详细或涉及执行时保留必要参数、完成状态、保存情况和失败原因。外层对专业问题执行一次检索，对简单事实可跳过；缺证据才补查，不为展示过程重复调用。复杂任务仍需执行必要工具，不能跳过数据验证。"
	if input.ResponseMode == "deep" {
		responseMode = "Agent 深度分析模式：外层对非简单问题已执行主问题和约束二次知识检索，先检查实际检索状态；核对长期记忆、文件事实和知识证据，证据不足时再补查。把问题拆为可验证的检查点，必要时调用数据工具；回答给出结论、证据、步骤、参数理由、风险限制、未解决项和验证办法。只能引用本轮实际读取的条目，不得把两轮检索等同于证据充分；简单事实不必强行长篇。不要输出隐藏思维链。"
	}
	return map[string]any{
		"content":       input.Query,
		"history":       input.History,
		"memory":        input.Memory,
		"response_mode": responseMode,
		"date":          time.Now().Format("2006-01-02 15:04:05"),
		"workflow_plan": input.WorkflowPlan,
	}, nil
}
