package model

import (
	"OnCallAgent/pkg/config"
	"context"

	"github.com/cloudwego/eino-ext/components/model/openai"
)

func NewOpenaiModel(ctx context.Context, cfg *config.Config) (*openai.ChatModel, error) {
	maxTokens := cfg.OpenAI.MaxTokens
	temperature := cfg.OpenAI.Temperature
	var temperatureOption *float32
	// 是否发送 temperature 来自真实能力探测，不再根据模型名称猜测。
	// 尚未探测的自定义服务默认省略可选采样参数，以提高兼容性。
	if shouldSendTemperature(cfg.OpenAI) {
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

func shouldSendTemperature(cfg config.OpenAIConfig) bool {
	return cfg.CapabilitiesDetected && cfg.SupportsTemperature
}
