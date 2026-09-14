package chatServer

import (
	"OnCallAgent/internal/server/taskstate"
	"context"
	"encoding/json"
	"strings"
	"testing"
)

func TestTaskSurvivesContextCompactionAndCascadesOnDelete(t *testing.T) {
	ctx := context.Background()
	memory := newTestStore(t)
	session, err := memory.CreateSession(ctx, "task-session", "task")
	if err != nil {
		t.Fatal(err)
	}
	state := &taskstate.State{ID: "task", SessionID: session.ID, DatasetID: "data", Status: "waiting_for_input", Plan: json.RawMessage(`{"save_output":false}`), Answers: map[string]taskstate.Answer{"unit": {Value: json.RawMessage(`"uV"`), Quote: "uV"}}}
	if err = memory.TaskStore().Save(ctx, state); err != nil {
		t.Fatal(err)
	}
	server := &chatServer{memory: memory}
	scoped, text, err := server.taskContext(ctx, session, "continue")
	if err != nil {
		t.Fatal(err)
	}
	scope, ok := taskstate.FromContext(scoped)
	if !ok || scope.SessionID != session.ID || scope.UserMessage != "continue" || !strings.Contains(text, "save_output") || !strings.Contains(text, "uV") {
		t.Fatal("task not restored independently of history")
	}
	if err = memory.DeleteSession(ctx, session.ID); err != nil {
		t.Fatal(err)
	}
	if got, err := memory.TaskStore().Get(ctx, session.ID); err != nil || got != nil {
		t.Fatal("orphaned task after session deletion")
	}
}
