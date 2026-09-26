package handler

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/cloudwego/eino/compose"
	openai "github.com/meguminnnnnnnnn/go-openai"
)

type agentFailure struct {
	Code           string `json:"code"`
	Message        string `json:"message"`
	UpstreamStatus int    `json:"upstream_status,omitempty"`
}

// 有些网关/流式包装层只保留 SDK 错误字符串。只匹配 SDK 的明确状态前缀，
// 不把工具参数、路径或普通文本中的“402”等数字误判成模型 HTTP 状态。
var upstreamStatusPattern = regexp.MustCompile(`(?i)error, status code:\s*([45][0-9]{2})\b`)

// 同步与 SSE 使用相同错误分类。供应商原文可能含 API Key、地址或请求数据，
// 因此只向客户端返回稳定错误码和预设说明，不直接转发 err.Error()。
func describeAgentFailure(err error, mode string, streaming bool) agentFailure {
	out := agentFailure{Code: "AGENT_CALL_FAILED", Message: "Agent 调用失败，请检查后端日志中的具体原因。"}
	if streaming {
		out.Code, out.Message = "AGENT_STREAM_FAILED", "Agent 流式调用失败，请检查后端日志中的具体原因。"
	}
	if errors.Is(err, compose.ErrExceedMaxSteps) {
		out.Code = "AGENT_STEP_LIMIT"
		out.Message = "本轮已达到 Agent 交互预算。已完成的操作不会撤销，请检查工具记录后决定是否继续。"
		if strings.EqualFold(strings.TrimSpace(mode), "deep") {
			out.Message += "当前已是深度分析，可将任务拆小后继续。"
		} else {
			out.Message += "复杂任务可选择深度分析。"
		}
		return out
	}
	var networkError net.Error
	if errors.Is(err, context.DeadlineExceeded) || (errors.As(err, &networkError) && networkError.Timeout()) {
		out.Code, out.Message = "AGENT_TIMEOUT", "模型或工具等待超时。请检查服务状态及已有工具记录，再决定是否继续。"
		return out
	}
	var apiError *openai.APIError
	var requestError *openai.RequestError
	status, detail := 0, ""
	switch {
	case errors.As(err, &apiError):
		status, detail = apiError.HTTPStatusCode, apiError.Message+" "+fmt.Sprint(apiError.Code)
	case errors.As(err, &requestError):
		status, detail = requestError.HTTPStatusCode, string(requestError.Body)
	default:
		if match := upstreamStatusPattern.FindStringSubmatch(err.Error()); len(match) == 2 {
			status, _ = strconv.Atoi(match[1])
			detail = err.Error()
		}
	}
	out.UpstreamStatus = status
	detail = strings.ToLower(detail)
	quota := false
	for _, term := range []string{"insufficient_quota", "free trial quota", "insufficient balance", "credits exhausted", "quota has been exhausted", "余额不足", "额度不足", "点数不足", "额度已耗尽"} {
		quota = quota || strings.Contains(detail, term)
	}
	switch {
	case status == http.StatusPaymentRequired || ((status == http.StatusForbidden || status == http.StatusTooManyRequests) && quota):
		out.Code, out.Message = "MODEL_QUOTA_EXHAUSTED", "模型服务额度不足或计费未就绪，当前请求被拒绝。请在服务商控制台检查额度和计费状态，或在 Electron 模型设置中换用有效配置；重复发送不会恢复额度。"
	case status == http.StatusUnauthorized:
		out.Code, out.Message = "MODEL_AUTH_FAILED", "模型服务认证失败。请在 Electron 模型设置中检查 API Key 与服务地址是否匹配，并测试配置。"
	case status == http.StatusForbidden:
		out.Code, out.Message = "MODEL_ACCESS_DENIED", "模型服务拒绝访问。请检查当前密钥是否有目标模型的使用权限，并测试配置。"
	case status == http.StatusTooManyRequests:
		out.Code, out.Message = "MODEL_RATE_LIMITED", "模型服务触发请求限流。请稍后再试，并检查服务商的并发与速率限制。"
	case status == http.StatusNotFound:
		out.Code, out.Message = "MODEL_NOT_FOUND", "模型或 API 地址不存在。请在 Electron 模型设置中核对模型名称和服务地址，并测试配置。"
	case status == http.StatusBadRequest || status == http.StatusUnprocessableEntity:
		out.Code, out.Message = "MODEL_REQUEST_REJECTED", "模型服务拒绝请求参数。请测试模型配置，检查工具调用、流式输出及参数支持情况；具体原因见后端日志。"
	case status >= 500:
		out.Code, out.Message = "MODEL_UNAVAILABLE", "模型服务或上游网关暂时不可用。请稍后再试，并先检查已有工具记录以避免重复执行。"
	}
	return out
}
