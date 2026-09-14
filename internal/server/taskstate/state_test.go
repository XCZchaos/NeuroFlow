package taskstate

import (
	"context"
	"database/sql"
	"encoding/json"
	_ "modernc.org/sqlite"
	"path/filepath"
	"testing"
)

func TestDurabilityCASRecoveryAndSessionIsolation(t *testing.T) {
	ctx := context.Background()
	path := filepath.Join(t.TempDir(), "memory.db")
	open := func() *Store {
		db, err := sql.Open("sqlite", path)
		if err != nil {
			t.Fatal(err)
		}
		db.SetMaxOpenConns(1)
		t.Cleanup(func() { db.Close() })
		return &Store{DB: db}
	}
	store := open()
	if _, err := store.DB.Exec(`CREATE TABLE sessions(id TEXT PRIMARY KEY); INSERT INTO sessions VALUES('a'),('b')`); err != nil {
		t.Fatal(err)
	}
	if err := store.Init(ctx); err != nil {
		t.Fatal(err)
	}
	state := &State{ID: "task", SessionID: "a", DatasetID: "dataset", Status: "waiting_for_input", Answers: map[string]Answer{"unit": {Value: json.RawMessage(`"uV"`), Quote: "unit is uV"}}, Plan: json.RawMessage(`{"save_output":false}`), Steps: []Step{{Name: "run_neuro_analysis", Status: "pending"}}}
	if err := store.Save(ctx, state); err != nil {
		t.Fatal(err)
	}
	stale := *state
	state.Status = "running"
	state.Steps[0].Status = "running"
	if err := store.Save(ctx, state); err != nil {
		t.Fatal(err)
	}
	if err := store.Save(ctx, &stale); err == nil {
		t.Fatal("stale write must fail")
	}
	if got, err := store.Get(ctx, "b"); err != nil || got != nil {
		t.Fatal("session isolation failed")
	}
	store.DB.Close()
	store = open()
	if err := store.Init(ctx); err != nil {
		t.Fatal(err)
	}
	got, err := store.Get(ctx, "a")
	if err != nil {
		t.Fatal(err)
	}
	if got.Status != "interrupted" || got.Steps[0].Status != "interrupted" || got.Answers["unit"].Quote != "unit is uV" || string(got.Plan) != `{"save_output":false}` {
		t.Fatalf("incorrect restored state: %+v", got)
	}
	duplicate := &State{ID: "other", SessionID: "a", Status: "waiting_for_input"}
	if err := store.Save(ctx, duplicate); err == nil {
		t.Fatal("second active task must fail")
	}
}
