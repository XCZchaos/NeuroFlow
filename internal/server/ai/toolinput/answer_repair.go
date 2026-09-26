package toolinput

import "context"

type answerRepairKey struct{}

// 修正回答是同一轮的受限延续，不是新的用户授权。标记只能由服务端设置，
// 模型的 JSON 参数无法打开它；工具边界据此阻止重复分析、写入和任务修改。
func WithAnswerRepair(ctx context.Context) context.Context {
	return context.WithValue(ctx, answerRepairKey{}, true)
}

func IsAnswerRepair(ctx context.Context) bool {
	value, _ := ctx.Value(answerRepairKey{}).(bool)
	return value
}

const AnswerRepairMaxSteps = 8
