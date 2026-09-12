package chat

import (
	"context"
	"time"

	"github.com/cloudwego/eino/compose"
)

func newInputToChatLambda(ctx context.Context, input *UserMessage, opts ...compose.LambdaOpt) (output map[string]any, err error) {
	responseMode := "即时回答模式：直接给出结论和必要依据，通常控制在 3–6 句话；复杂任务仍需执行必要工具。"
	if input.ResponseMode == "deep" {
		responseMode = "Agent 深度分析模式：先核对长期记忆、文件事实和知识证据；专业问题至少执行一次针对性二次知识检索，必要时调用数据工具；回答应完整给出结论、证据、步骤、参数理由、风险限制和验证办法。不要输出隐藏思维链。"
	}
	return map[string]any{
		"content":       input.Query,
		"history":       input.History,
		"memory":        input.Memory,
		"response_mode": responseMode,
		"date":          time.Now().Format("2006-01-02 15:04:05"),
	}, nil
}
