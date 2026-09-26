package tools

import (
	"context"
	"database/sql"
	"encoding/json"
	"path/filepath"
	"strings"
	"testing"

	"OnCallAgent/internal/server/taskstate"
)

// 通过真实工具查询持久化任务，防止“成功读到失败任务”被误报为处理成功，
// 并确保为模型整理观察结果不会删除原问题、修改答案或增加 revision。
func TestTaskToolReportsActionableStateWithoutChangingEvidence(t *testing.T) {
	ctx := context.Background()
	db, err := sql.Open("sqlite", filepath.Join(t.TempDir(), "observations.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)
	if _, err = db.Exec(`CREATE TABLE sessions(id TEXT PRIMARY KEY)`); err != nil {
		t.Fatal(err)
	}
	store := &taskstate.Store{DB: db}
	if err = store.Init(ctx); err != nil {
		t.Fatal(err)
	}
	tool, err := PreprocessingTaskTool()
	if err != nil {
		t.Fatal(err)
	}
	for _, test := range []struct {
		name, status, next string
		answered, blocked  bool
		ok, completed      bool
		pending            int
	}{
		{"missing", "waiting_for_input", "still-missing", false, false, true, false, 1},
		{"answered", "waiting_for_input", "not validated", true, false, true, false, 0},
		{"conflict", "waiting_for_input", "task.validation", true, true, true, false, 0},
		{"ready", "ready", "resume", true, false, true, false, 0},
		{"failed", "failed", "retry", true, false, false, false, 0},
		{"interrupted", "interrupted", "retry", true, false, false, false, 0},
		{"completed", "completed", "task.result", true, false, true, true, 0},
		{"cancelled", "cancelled", "cancelled", true, false, true, false, 0},
		{"running", "running", "duplicate", true, false, true, false, 0},
	} {
		t.Run(test.name, func(t *testing.T) {
			if _, err := db.Exec(`INSERT INTO sessions VALUES(?)`, test.name); err != nil {
				t.Fatal(err)
			}
			state := &taskstate.State{ID: test.name, SessionID: test.name, DatasetID: "bound",
				Status: test.status, Fields: []taskstate.Field{{Name: "unit", Question: "Signal unit?"}},
				Answers: map[string]taskstate.Answer{}}
			if test.answered {
				state.Answers["unit"] = taskstate.Answer{Value: json.RawMessage(`"uV"`), Quote: "unit is uV"}
			}
			if test.blocked {
				state.Steps = []taskstate.Step{{Name: "validate_import", Status: "blocked", Detail: "conflicting declaration"}}
				state.Validation = json.RawMessage(`{"passed":false,"message":"conflicting declaration"}`)
			}
			if err := store.Save(ctx, state); err != nil {
				t.Fatal(err)
			}
			before, _ := json.Marshal(state)
			scoped := taskstate.WithScope(ctx, taskstate.Scope{Store: store, SessionID: test.name, DatasetID: "bound"})
			raw, err := tool.InvokableRun(scoped, `{"action":"get"}`)
			var got taskObservation
			if err != nil || json.Unmarshal([]byte(raw), &got) != nil {
				t.Fatalf("invalid observation: %s %v", raw, err)
			}
			if got.OK != test.ok || got.Completed != test.completed || got.Status != test.status || len(got.PendingFields) != test.pending || !strings.Contains(got.NextAction, test.next) {
				t.Fatalf("misleading task feedback: %s", raw)
			}
			evidence, _ := json.Marshal(got.Task)
			after, err := store.Get(ctx, test.name)
			if err != nil {
				t.Fatal(err)
			}
			persisted, _ := json.Marshal(after)
			if string(before) != string(evidence) || string(before) != string(persisted) {
				t.Fatal("observation changed original task evidence")
			}
		})
	}
	// 没有任务是正常查询结果，不能以 nil 状态崩溃或返回“已完成”。
	scoped := taskstate.WithScope(ctx, taskstate.Scope{Store: store, SessionID: "empty"})
	raw, err := tool.InvokableRun(scoped, `{"action":"get"}`)
	var empty taskObservation
	if err != nil || json.Unmarshal([]byte(raw), &empty) != nil || empty.Task != nil || empty.Completed || empty.Status != "not_found" {
		t.Fatalf("unexpected empty task response: %s %v", raw, err)
	}
}
