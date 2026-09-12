package chatServer

import (
	"testing"

	"github.com/cloudwego/eino/schema"
)

func TestNewMemoryUsesRequestedWindowSize(t *testing.T) {
	id := "memory-window-test"
	SimpleMemoryMap.Delete(id)
	t.Cleanup(func() { SimpleMemoryMap.Delete(id) })

	if err := NewMemory(id, 4); err != nil {
		t.Fatalf("create memory: %v", err)
	}
	memory, err := loadOrCreateMemory(id)
	if err != nil {
		t.Fatalf("load memory: %v", err)
	}
	if memory.MaxWindowSize != 4 {
		t.Fatalf("expected window size 4, got %d", memory.MaxWindowSize)
	}

	for i := 0; i < 3; i++ {
		memory.appendTurn(schema.UserMessage("question"), schema.AssistantMessage("answer", nil))
	}
	if got := len(memory.historySnapshot()); got != 4 {
		t.Fatalf("expected trimmed history length 4, got %d", got)
	}
}

func TestNewMemoryRejectsEmptyID(t *testing.T) {
	if err := NewMemory("   ", 6); err == nil {
		t.Fatal("expected empty session ID error")
	}
}
