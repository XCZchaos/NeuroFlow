package chatServer

import (
	"context"
	"fmt"
	"path/filepath"
	"strings"
	"testing"
)

func newTestStore(t *testing.T) *SQLiteMemoryStore {
	t.Helper()
	store, err := NewSQLiteMemoryStore(filepath.Join(t.TempDir(), "memory.db"))
	if err != nil {
		t.Fatalf("创建测试数据库失败: %v", err)
	}
	t.Cleanup(func() { _ = store.Close() })
	return store
}

func TestSQLiteMemoryPersistsSessionMessagesAndBinding(t *testing.T) {
	ctx := context.Background()
	store := newTestStore(t)
	if _, err := store.CreateSession(ctx, "session-1", "测试会话"); err != nil {
		t.Fatal(err)
	}
	if err := store.BindDataset(ctx, "session-1", "dataset-1"); err != nil {
		t.Fatal(err)
	}
	if err := store.AppendTurn(ctx, "session-1", "我的研究目标是 P300 分类，请用中文，不要保存", "已经记录"); err != nil {
		t.Fatal(err)
	}
	sessions, err := store.ListSessions(ctx)
	if err != nil || len(sessions) != 1 || sessions[0].DatasetID != "dataset-1" {
		t.Fatalf("会话或绑定未持久化: %+v %v", sessions, err)
	}
	messages, err := store.Messages(ctx, "session-1", 12)
	if err != nil || len(messages) != 2 {
		t.Fatalf("消息未持久化: %d %v", len(messages), err)
	}
	memory, err := store.LongTermMemory(ctx, "session-1")
	if err != nil || memory.ResearchGoal == "" || memory.Preferences["language"] != "zh-CN" || memory.Preferences["save_output"] != "false" {
		t.Fatalf("结构化记忆提取错误: %+v %v", memory, err)
	}
}

func TestSQLiteMemoryKeepsRecentWindowAndSummarizesOlderTurns(t *testing.T) {
	ctx := context.Background()
	store := newTestStore(t)
	for i := 0; i < 8; i++ {
		if err := store.AppendTurn(ctx, "session-2", fmt.Sprintf("问题%d", i), fmt.Sprintf("回答%d", i)); err != nil {
			t.Fatal(err)
		}
	}
	messages, err := store.Messages(ctx, "session-2", recentMessageWindow)
	if err != nil || len(messages) != recentMessageWindow {
		t.Fatalf("近期窗口错误: %d %v", len(messages), err)
	}
	memory, err := store.LongTermMemory(ctx, "session-2")
	if err != nil || memory.Summary == "" {
		t.Fatalf("旧消息没有形成摘要: %+v %v", memory, err)
	}
	if err = store.AppendTurn(ctx, "session-2", "问题8", "回答8"); err != nil {
		t.Fatal(err)
	}
	memory, err = store.LongTermMemory(ctx, "session-2")
	if err != nil || strings.Count(memory.Summary, "问题0") != 1 {
		t.Fatalf("旧消息被重复压缩: %+v %v", memory, err)
	}
	all, err := store.Messages(ctx, "session-2", 100)
	if err != nil || len(all) != 18 {
		t.Fatalf("完整消息历史不应被删除: %d %v", len(all), err)
	}
}

func TestSQLiteMemoryDeleteCascades(t *testing.T) {
	ctx := context.Background()
	store := newTestStore(t)
	if err := store.AppendTurn(ctx, "session-3", "问题", "回答"); err != nil {
		t.Fatal(err)
	}
	if err := store.DeleteSession(ctx, "session-3"); err != nil {
		t.Fatal(err)
	}
	messages, err := store.Messages(ctx, "session-3", 20)
	if err != nil || len(messages) != 0 {
		t.Fatalf("删除会话后仍有消息: %d %v", len(messages), err)
	}
}

func TestSQLiteMemorySurvivesReopen(t *testing.T) {
	ctx := context.Background()
	path := filepath.Join(t.TempDir(), "persistent.db")
	first, err := NewSQLiteMemoryStore(path)
	if err != nil {
		t.Fatal(err)
	}
	if err = first.AppendTurn(ctx, "persistent-session", "长期问题", "长期回答"); err != nil {
		t.Fatal(err)
	}
	if err = first.Close(); err != nil {
		t.Fatal(err)
	}

	second, err := NewSQLiteMemoryStore(path)
	if err != nil {
		t.Fatal(err)
	}
	defer second.Close()
	messages, err := second.Messages(ctx, "persistent-session", 20)
	if err != nil || len(messages) != 2 || messages[0].Content != "长期问题" {
		t.Fatalf("数据库重开后消息丢失: %+v %v", messages, err)
	}
}
