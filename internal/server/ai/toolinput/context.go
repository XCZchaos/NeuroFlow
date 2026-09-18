package toolinput

import (
	"context"
	"strings"
)

// userTextKey 使用私有类型，避免与其他中间件的 context 键发生碰撞。
type userTextKey struct{}

// WithUserText 保存当前轮用户原话。工具可用它核对模型填写的参数来源；
// 历史摘要或知识库文本不能替代当前轮用户的明确声明。
func WithUserText(ctx context.Context, text string) context.Context {
	return context.WithValue(ctx, userTextKey{}, text)
}

func UserText(ctx context.Context) string {
	text, _ := ctx.Value(userTextKey{}).(string)
	return text
}

// ExplicitNoSave 只识别当前轮明确的否定保存要求。它是执行前的保护规则，
// 不能代替 Agent 理解完整意图；含糊的措辞仍由 Agent 向用户确认。
func ExplicitNoSave(text string) bool {
	lower := strings.ToLower(text)
	for _, phrase := range []string{
		"不保存", "不要保存", "不用保存", "无需保存", "无须保存",
		"不要生成文件", "不生成文件", "do not save", "don't save", "without saving",
	} {
		if strings.Contains(lower, phrase) {
			return true
		}
	}
	return false
}
