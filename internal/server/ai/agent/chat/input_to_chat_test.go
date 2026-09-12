package chat

import (
	"context"
	"strings"
	"testing"
)

func TestInputToChatSelectsDeepModeInstruction(t *testing.T) {
	result, err := newInputToChatLambda(context.Background(), &UserMessage{Query: "test", ResponseMode: "deep"})
	if err != nil {
		t.Fatal(err)
	}
	mode, _ := result["response_mode"].(string)
	if !strings.Contains(mode, "二次知识检索") || !strings.Contains(mode, "风险限制") {
		t.Fatalf("深度模式指令不完整: %s", mode)
	}
}
