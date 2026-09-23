package model

import (
	"OnCallAgent/pkg/config"
	"testing"
)

func TestTemperatureUsesDetectedCapabilityInsteadOfModelName(t *testing.T) {
	tests := []struct {
		config config.OpenAIConfig
		want   bool
	}{
		{config: config.OpenAIConfig{Model: "custom-thinking", CapabilitiesDetected: true, SupportsTemperature: true}, want: true},
		{config: config.OpenAIConfig{Model: "gpt-4o-mini", CapabilitiesDetected: true, SupportsTemperature: false}, want: false},
		{config: config.OpenAIConfig{Model: "deepseek-chat"}, want: false},
	}
	for _, test := range tests {
		if got := shouldSendTemperature(test.config); got != test.want {
			t.Fatalf("shouldSendTemperature(%+v) = %v, want %v", test.config, got, test.want)
		}
	}
}
