package chatServer

import (
	"OnCallAgent/internal/server/ai/toolinput"
	"OnCallAgent/internal/server/knowledgecatalog"
	"context"
	"fmt"
	"testing"
)

func TestDeepReflectionRequiresEvidenceFromCurrentTurn(t *testing.T) {
	entries, err := knowledgecatalog.Load()
	if err != nil {
		t.Fatal(err)
	}
	entry, ok := entries["MNE-EEG-001"]
	if !ok || entry.SourceURL == "" {
		t.Fatal("test knowledge missing")
	}
	answer := fmt.Sprintf("参考 [%s](%s)。", entry.ID, entry.SourceURL)
	quick := toolinput.WithResponseMode(context.Background(), "quick")
	deep := toolinput.WithResponseMode(context.Background(), "deep")
	if got := reflectModeTurn(quick, answer, nil); got != answer {
		t.Fatalf("quick catalog validation failed: %s", got)
	}
	if got := reflectModeTurn(deep, answer, nil); got == answer {
		t.Fatal("deep accepted unseen citation")
	}
	trace := []toolinput.ToolResult{{Name: "query_internal_docs", Succeeded: true, KnowledgeIDs: []string{entry.ID}}}
	if got := reflectModeTurn(deep, answer, trace); got != answer {
		t.Fatalf("retrieved evidence rejected: %s", got)
	}
	if got := reflectModeTurn(deep, "已完成预处理", trace); got == "已完成预处理" {
		t.Fatal("deep bypassed execution verification")
	}
}
