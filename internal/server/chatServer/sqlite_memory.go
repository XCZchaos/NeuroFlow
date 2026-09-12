package chatServer

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/cloudwego/eino/schema"
	_ "modernc.org/sqlite"
)

const recentMessageWindow = 12

type SQLiteMemoryStore struct{ db *sql.DB }

func NewSQLiteMemoryStore(path string) (*SQLiteMemoryStore, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, fmt.Errorf("创建长期记忆目录失败: %w", err)
	}
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("打开长期记忆数据库失败: %w", err)
	}
	store := &SQLiteMemoryStore{db: db}
	if err = store.migrate(context.Background()); err != nil {
		db.Close()
		return nil, err
	}
	return store, nil
}

func (s *SQLiteMemoryStore) migrate(ctx context.Context) error {
	statements := []string{
		`PRAGMA journal_mode=WAL`,
		`PRAGMA foreign_keys=ON`,
		`CREATE TABLE IF NOT EXISTS sessions (
			id TEXT PRIMARY KEY, title TEXT NOT NULL, dataset_id TEXT NOT NULL DEFAULT '',
			created_at TEXT NOT NULL, updated_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS messages (
			id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL,
			role TEXT NOT NULL CHECK(role IN ('user','assistant')), content TEXT NOT NULL,
			created_at TEXT NOT NULL, FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
		)`,
		`CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id, id)`,
		`CREATE TABLE IF NOT EXISTS session_memory (
			session_id TEXT PRIMARY KEY, research_goal TEXT NOT NULL DEFAULT '',
			preferences_json TEXT NOT NULL DEFAULT '{}', summary TEXT NOT NULL DEFAULT '',
			summary_through_id INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL,
			FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
		)`,
	}
	for _, statement := range statements {
		if _, err := s.db.ExecContext(ctx, statement); err != nil {
			return fmt.Errorf("初始化长期记忆数据库失败: %w", err)
		}
	}
	// 为已经由旧版 NeuroFlow 创建的数据库补列；重复列错误表示迁移已完成。
	if _, err := s.db.ExecContext(ctx, `ALTER TABLE session_memory ADD COLUMN summary_through_id INTEGER NOT NULL DEFAULT 0`); err != nil && !strings.Contains(strings.ToLower(err.Error()), "duplicate column") {
		return fmt.Errorf("升级长期记忆数据库失败: %w", err)
	}
	return nil
}

func normalizeSessionID(id string) (string, error) {
	id = strings.TrimSpace(id)
	if id == "" || len(id) > 128 {
		return "", errors.New("会话 ID 不能为空且不能超过 128 个字符")
	}
	return id, nil
}

func (s *SQLiteMemoryStore) CreateSession(ctx context.Context, id, title string) (Session, error) {
	var err error
	if id, err = normalizeSessionID(id); err != nil {
		return Session{}, err
	}
	title = strings.TrimSpace(title)
	if title == "" {
		title = "新对话"
	}
	if len([]rune(title)) > 80 {
		title = string([]rune(title)[:80])
	}
	now := time.Now().UTC()
	_, err = s.db.ExecContext(ctx, `INSERT INTO sessions(id,title,created_at,updated_at)
		VALUES(?,?,?,?) ON CONFLICT(id) DO NOTHING`, id, title, now.Format(time.RFC3339Nano), now.Format(time.RFC3339Nano))
	if err != nil {
		return Session{}, fmt.Errorf("创建会话失败: %w", err)
	}
	_, err = s.db.ExecContext(ctx, `INSERT INTO session_memory(session_id,updated_at) VALUES(?,?)
		ON CONFLICT(session_id) DO NOTHING`, id, now.Format(time.RFC3339Nano))
	if err != nil {
		return Session{}, fmt.Errorf("创建会话记忆失败: %w", err)
	}
	return s.session(ctx, id)
}

func (s *SQLiteMemoryStore) EnsureSession(ctx context.Context, id string) (Session, error) {
	return s.CreateSession(ctx, id, "新对话")
}

func (s *SQLiteMemoryStore) session(ctx context.Context, id string) (Session, error) {
	var item Session
	var created, updated string
	err := s.db.QueryRowContext(ctx, `SELECT id,title,dataset_id,created_at,updated_at FROM sessions WHERE id=?`, id).
		Scan(&item.ID, &item.Title, &item.DatasetID, &created, &updated)
	if err != nil {
		return Session{}, err
	}
	item.CreatedAt, _ = time.Parse(time.RFC3339Nano, created)
	item.UpdatedAt, _ = time.Parse(time.RFC3339Nano, updated)
	return item, nil
}

func (s *SQLiteMemoryStore) ListSessions(ctx context.Context) ([]Session, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id,title,dataset_id,created_at,updated_at FROM sessions ORDER BY updated_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []Session{}
	for rows.Next() {
		var item Session
		var created, updated string
		if err = rows.Scan(&item.ID, &item.Title, &item.DatasetID, &created, &updated); err != nil {
			return nil, err
		}
		item.CreatedAt, _ = time.Parse(time.RFC3339Nano, created)
		item.UpdatedAt, _ = time.Parse(time.RFC3339Nano, updated)
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *SQLiteMemoryStore) DeleteSession(ctx context.Context, id string) error {
	result, err := s.db.ExecContext(ctx, `DELETE FROM sessions WHERE id=?`, strings.TrimSpace(id))
	if err != nil {
		return err
	}
	if affected, _ := result.RowsAffected(); affected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (s *SQLiteMemoryStore) BindDataset(ctx context.Context, id, datasetID string) error {
	if _, err := s.EnsureSession(ctx, id); err != nil {
		return err
	}
	_, err := s.db.ExecContext(ctx, `UPDATE sessions SET dataset_id=?,updated_at=? WHERE id=?`, strings.TrimSpace(datasetID), time.Now().UTC().Format(time.RFC3339Nano), id)
	return err
}

func (s *SQLiteMemoryStore) Messages(ctx context.Context, id string, limit int) ([]*schema.Message, error) {
	if limit <= 0 {
		limit = recentMessageWindow
	}
	rows, err := s.db.QueryContext(ctx, `SELECT role,content FROM (
		SELECT id,role,content FROM messages WHERE session_id=? ORDER BY id DESC LIMIT ?
	) ORDER BY id ASC`, id, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := []*schema.Message{}
	for rows.Next() {
		var role, content string
		if err = rows.Scan(&role, &content); err != nil {
			return nil, err
		}
		if role == "user" {
			result = append(result, schema.UserMessage(content))
		} else {
			result = append(result, schema.AssistantMessage(content, nil))
		}
	}
	return result, rows.Err()
}

func (s *SQLiteMemoryStore) AppendTurn(ctx context.Context, id, question, answer string) error {
	if _, err := s.EnsureSession(ctx, id); err != nil {
		return err
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	now := time.Now().UTC().Format(time.RFC3339Nano)
	for _, message := range []struct{ role, content string }{{"user", question}, {"assistant", answer}} {
		if _, err = tx.ExecContext(ctx, `INSERT INTO messages(session_id,role,content,created_at) VALUES(?,?,?,?)`, id, message.role, message.content, now); err != nil {
			return err
		}
	}
	// 第一条问题自动成为会话标题，避免列表中全部显示“新对话”。
	title := conversationTitle(question)
	if len([]rune(title)) > 36 {
		title = string([]rune(title)[:36]) + "…"
	}
	if _, err = tx.ExecContext(ctx, `UPDATE sessions SET title=CASE WHEN (SELECT COUNT(*) FROM messages WHERE session_id=?)=2 THEN ? ELSE title END,updated_at=? WHERE id=?`, id, title, now, id); err != nil {
		return err
	}
	if err = s.updateDerivedMemory(ctx, tx, id, question, now); err != nil {
		return err
	}
	return tx.Commit()
}

var goalPattern = regexp.MustCompile(`(?i)(研究目标|我的目标|我想研究|I want to study|research goal)[是为：:\s]*(.+)`)

func (s *SQLiteMemoryStore) updateDerivedMemory(ctx context.Context, tx *sql.Tx, id, question, now string) error {
	memory, err := s.longTermMemory(ctx, tx, id)
	if err != nil {
		return err
	}
	if match := goalPattern.FindStringSubmatch(question); len(match) == 3 {
		memory.ResearchGoal = truncateRunes(strings.TrimSpace(match[2]), 1000)
	}
	lower := strings.ToLower(question)
	if strings.Contains(question, "不要保存") || strings.Contains(lower, "do not save") {
		memory.Preferences["save_output"] = "false"
	}
	if strings.Contains(question, "需要保存") || strings.Contains(question, "请保存") || strings.Contains(lower, "save the output") {
		memory.Preferences["save_output"] = "true"
	}
	if strings.Contains(question, "用中文") {
		memory.Preferences["language"] = "zh-CN"
	}
	if strings.Contains(lower, "use english") || strings.Contains(question, "用英文") {
		memory.Preferences["language"] = "en"
	}

	// 只把窗口之外的旧消息压缩为提取式摘要；完整原始消息仍保存在 messages 表中，
	// 因而摘要可以在未来升级为 LLM 摘要而不丢失证据。
	var summarizedThrough int64
	if err = tx.QueryRowContext(ctx, `SELECT summary_through_id FROM session_memory WHERE session_id=?`, id).Scan(&summarizedThrough); err != nil {
		return err
	}
	rows, err := tx.QueryContext(ctx, `SELECT id,role,content FROM messages WHERE session_id=? AND id>?
		AND id < COALESCE((SELECT id FROM messages WHERE session_id=? ORDER BY id DESC LIMIT 1 OFFSET ?),0)
		ORDER BY id ASC`, id, summarizedThrough, id, recentMessageWindow-1)
	if err != nil {
		return err
	}
	parts := []string{}
	latestSummarizedID := summarizedThrough
	for rows.Next() {
		var messageID int64
		var role, content string
		if err = rows.Scan(&messageID, &role, &content); err != nil {
			rows.Close()
			return err
		}
		latestSummarizedID = messageID
		parts = append(parts, role+": "+truncateRunes(strings.TrimSpace(content), 240))
	}
	rows.Close()
	if len(parts) > 0 {
		memory.Summary = truncateRunesTail(strings.TrimSpace(memory.Summary+"\n"+strings.Join(parts, "\n")), 4000)
	}
	preferences, _ := json.Marshal(memory.Preferences)
	_, err = tx.ExecContext(ctx, `UPDATE session_memory SET research_goal=?,preferences_json=?,summary=?,summary_through_id=?,updated_at=? WHERE session_id=?`, memory.ResearchGoal, string(preferences), memory.Summary, latestSummarizedID, now, id)
	return err
}

type queryer interface {
	QueryRowContext(context.Context, string, ...any) *sql.Row
}

func (s *SQLiteMemoryStore) longTermMemory(ctx context.Context, q queryer, id string) (StructuredMemory, error) {
	result := StructuredMemory{Preferences: map[string]string{}}
	var preferences string
	err := q.QueryRowContext(ctx, `SELECT research_goal,preferences_json,summary FROM session_memory WHERE session_id=?`, id).Scan(&result.ResearchGoal, &preferences, &result.Summary)
	if errors.Is(err, sql.ErrNoRows) {
		return result, nil
	}
	if err != nil {
		return result, err
	}
	_ = json.Unmarshal([]byte(preferences), &result.Preferences)
	if result.Preferences == nil {
		result.Preferences = map[string]string{}
	}
	return result, nil
}

func (s *SQLiteMemoryStore) LongTermMemory(ctx context.Context, id string) (StructuredMemory, error) {
	if _, err := s.EnsureSession(ctx, id); err != nil {
		return StructuredMemory{}, err
	}
	return s.longTermMemory(ctx, s.db, id)
}

func (s *SQLiteMemoryStore) UpdateStructuredMemory(ctx context.Context, id string, memory StructuredMemory) error {
	if _, err := s.EnsureSession(ctx, id); err != nil {
		return err
	}
	if memory.Preferences == nil {
		memory.Preferences = map[string]string{}
	}
	preferences, err := json.Marshal(memory.Preferences)
	if err != nil {
		return err
	}
	_, err = s.db.ExecContext(ctx, `UPDATE session_memory SET research_goal=?,preferences_json=?,summary=?,updated_at=? WHERE session_id=?`,
		truncateRunes(memory.ResearchGoal, 1000), string(preferences), truncateRunes(memory.Summary, 4000), time.Now().UTC().Format(time.RFC3339Nano), id)
	return err
}

func (s *SQLiteMemoryStore) Close() error { return s.db.Close() }

func truncateRunes(value string, maximum int) string {
	runes := []rune(value)
	if len(runes) <= maximum {
		return value
	}
	return string(runes[:maximum]) + "…"
}

func truncateRunesTail(value string, maximum int) string {
	runes := []rune(value)
	if len(runes) <= maximum {
		return value
	}
	return "…" + string(runes[len(runes)-maximum:])
}

// Electron 会在问题前附加界面语言和数据证据。它们应进入审计消息，
// 但自动会话标题只展示用户真正输入的部分。
func conversationTitle(question string) string {
	lines := strings.Split(strings.TrimSpace(question), "\n")
	visible := make([]string, 0, len(lines))
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "[界面语言：") || strings.HasPrefix(trimmed, "[数据上下文：") || trimmed == "" {
			continue
		}
		visible = append(visible, trimmed)
	}
	if len(visible) == 0 {
		return "新对话"
	}
	return strings.Join(visible, " ")
}

func formatLongTermMemory(session Session, memory StructuredMemory) string {
	preferences, _ := json.Marshal(memory.Preferences)
	return fmt.Sprintf("绑定数据集：%s\n研究目标：%s\n用户偏好：%s\n较早对话摘要：\n%s",
		emptyAsUnknown(session.DatasetID), emptyAsUnknown(memory.ResearchGoal), string(preferences), emptyAsUnknown(memory.Summary))
}

func emptyAsUnknown(value string) string {
	if strings.TrimSpace(value) == "" {
		return "未记录"
	}
	return value
}
