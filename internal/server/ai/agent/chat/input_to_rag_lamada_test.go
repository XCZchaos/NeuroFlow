package chat

import (
	"strings"
	"testing"
)

func TestBuildKnowledgeQueryAddsDomainVocabulary(t *testing.T) {
	query := buildKnowledgeQuery("我的脑电坏道应该如何插值？")
	for _, expected := range []string{"modality:EEG", "stage:bad_channels"} {
		if !strings.Contains(query, expected) {
			t.Fatalf("检索查询缺少 %q: %s", expected, query)
		}
	}
}

func TestBuildKnowledgeQueryKeepsUnknownQuestion(t *testing.T) {
	const input = "你好"
	if got := buildKnowledgeQuery(input); got != input {
		t.Fatalf("非专业问题不应被扩写: %q", got)
	}
}

func TestBuildKnowledgeQueryDoesNotInventModality(t *testing.T) {
	query := buildKnowledgeQuery("我应该怎样进行滤波？")
	if !strings.Contains(query, "stage:filtering") {
		t.Fatalf("应补充处理阶段: %s", query)
	}
	if strings.Contains(query, "modality:") {
		t.Fatalf("用户未提供模态时不应推断模态: %s", query)
	}
}
