package toolinput

import (
	"context"
	"strings"
)

// ResponsePolicy 控制应用层工作流，不等同于模型供应商的 reasoning_effort。
// 图步数计入模型和工具节点，并非工具调用次数，也不改变保存/审批规则。
type ResponsePolicy struct {
	Mode                                        string
	Searches, TopK, MaxDocuments, MaxGraphSteps int
}

func Policy(mode string) ResponsePolicy {
	if strings.EqualFold(strings.TrimSpace(mode), "deep") {
		return ResponsePolicy{"deep", 2, 5, 8, 30}
	}
	return ResponsePolicy{"quick", 1, 3, 3, 12}
}

type responseModeKey struct{}
type intentTextKey struct{}

func WithResponseMode(ctx context.Context, mode string) context.Context {
	return context.WithValue(ctx, responseModeKey{}, Policy(mode).Mode)
}
func CurrentResponsePolicy(ctx context.Context) ResponsePolicy {
	mode, _ := ctx.Value(responseModeKey{}).(string)
	return Policy(mode)
}

// 原始提问只用于检索路由；权限、文件绑定和“不保存”等约束仍由原有守卫处理。
// 旧客户端未提供此字段时回退到完整问题，宁可多检索，不误当作简单问题。
func WithIntentText(ctx context.Context, query string) context.Context {
	return context.WithValue(ctx, intentTextKey{}, strings.TrimSpace(query))
}
func IntentText(ctx context.Context, fallback string) string {
	query, _ := ctx.Value(intentTextKey{}).(string)
	if query != "" {
		return query
	}
	return fallback
}
