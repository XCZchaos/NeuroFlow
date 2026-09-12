package model

import (
	"OnCallAgent/pkg/config"
	"context"
	"strings"

	"github.com/cloudwego/eino-ext/components/model/openai"
)

func NewOpenaiModel(ctx context.Context, cfg *config.Config) (*openai.ChatModel, error) {
	maxTokens := cfg.OpenAI.MaxTokens
	temperature := cfg.OpenAI.Temperature
	var temperatureOption *float32
	// 当前 Eino 使用的 OpenAI 客户端会把 GPT-5、o1、o3 和 o4 识别为推理模型。
	// 对这些模型，即使 temperature=1，只要请求中出现 temperature 字段也会在
	// 客户端校验阶段失败。因此推理模型必须省略该字段；普通模型仍使用配置值。
	if modelAllowsTemperature(cfg.OpenAI.Model) {
		temperatureOption = &temperature
	}
	return openai.NewChatModel(ctx, &openai.ChatModelConfig{
		APIKey:      cfg.OpenAI.APIKey,
		BaseURL:     cfg.OpenAI.APIBase,
		Model:       cfg.OpenAI.Model,
		MaxTokens:   &maxTokens,
		Temperature: temperatureOption,
	})
}

func modelAllowsTemperature(model string) bool {
	name := strings.ToLower(strings.TrimSpace(model))
	return !strings.HasPrefix(name, "gpt-5") &&
		!strings.HasPrefix(name, "o1") &&
		!strings.HasPrefix(name, "o3") &&
		!strings.HasPrefix(name, "o4")
}
