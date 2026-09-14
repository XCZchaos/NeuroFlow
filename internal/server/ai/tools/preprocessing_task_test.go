package tools

import (
	"context"
	"database/sql"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"OnCallAgent/internal/server/dataset"
	"OnCallAgent/internal/server/taskstate"
	_ "modernc.org/sqlite"
)

// This integration test uses the real CSV reader and MNE analysis, but no LLM,
// Qdrant, network, or saved preprocessed file. It proves answers affect execution.
func TestTaskAnswersValidateResumeWithRealMNE(t *testing.T) {
	ctx := context.Background()
	dir := t.TempDir()
	path := filepath.Join(dir, "signal.csv")
	var csv strings.Builder
	csv.WriteString("time,C3,C4\n")
	for i := 0; i < 2500; i++ {
		x := float64(i) / 250
		fmt.Fprintf(&csv, "%.3f,%.8f,%.8f\n", x, 10*math.Sin(2*math.Pi*10*x), 8*math.Sin(2*math.Pi*12*x))
	}
	if err := os.WriteFile(path, []byte(csv.String()), 0600); err != nil {
		t.Fatal(err)
	}
	record, err := dataset.Register(ctx, path)
	if err != nil {
		t.Fatal(err)
	}
	db, err := sql.Open("sqlite", filepath.Join(dir, "tasks.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)
	if _, err = db.Exec(`CREATE TABLE sessions(id TEXT PRIMARY KEY); INSERT INTO sessions VALUES('s')`); err != nil {
		t.Fatal(err)
	}
	store := &taskstate.Store{DB: db}
	if err = store.Init(ctx); err != nil {
		t.Fatal(err)
	}
	scope := taskstate.Scope{Store: store, SessionID: "s", DatasetID: record.ID, UserMessage: "unit is uV; sampling rate is 250 Hz; do not save"}
	ctx = taskstate.WithScope(ctx, scope)
	noSave := false
	state, err := manageTask(ctx, TaskInput{Action: "start", Fields: []taskstate.Field{{Name: "sampling_rate_hz", Question: "Rate?"}}, Plan: &NeuroAnalysisInput{DatasetID: record.ID, AnalysisType: "summary", SaveOutput: &noSave}})
	if err != nil {
		t.Fatal(err)
	}
	if _, err = manageTask(ctx, TaskInput{Action: "resume", Revision: state.Revision}); err == nil {
		t.Fatal("must block missing answers")
	}
	tool, err := RunNeuroAnalysisTool()
	if err != nil {
		t.Fatal(err)
	}
	blocked, err := tool.InvokableRun(ctx, fmt.Sprintf(`{"dataset_id":%q}`, record.ID))
	if err != nil || !strings.Contains(blocked, "TASK_REQUIRES_RESUME") {
		t.Fatalf("direct bypass: %s %v", blocked, err)
	}
	if _, err = manageTask(ctx, TaskInput{Action: "answer", Revision: state.Revision, Answers: map[string]any{"unit": "uV"}, UserQuote: "invented answer"}); err == nil {
		t.Fatal("fabricated quote accepted")
	}
	state, err = manageTask(ctx, TaskInput{Action: "answer", Revision: state.Revision, Answers: map[string]any{"unit": "uV", "sampling_rate_hz": 500}, UserQuote: scope.UserMessage})
	if err != nil {
		t.Fatal(err)
	}
	state, err = manageTask(ctx, TaskInput{Action: "validate", Revision: state.Revision})
	if err != nil {
		t.Fatal(err)
	}
	if state.Status != "waiting_for_input" || !strings.Contains(string(state.Validation), `"passed":false`) {
		t.Fatalf("conflicting time column accepted: %+v", state)
	}
	state, err = manageTask(ctx, TaskInput{Action: "answer", Revision: state.Revision, Answers: map[string]any{"sampling_rate_hz": 250}, UserQuote: scope.UserMessage})
	if err != nil {
		t.Fatal(err)
	}
	state, err = manageTask(ctx, TaskInput{Action: "validate", Revision: state.Revision})
	if err != nil {
		t.Fatal(err)
	}
	if state.Status != "ready" {
		t.Fatalf("validation failed: %s", state.Validation)
	}
	revision := state.Revision
	state, err = manageTask(ctx, TaskInput{Action: "resume", Revision: revision})
	if err != nil {
		t.Fatal(err)
	}
	if state.Status != "completed" || len(state.Result) == 0 {
		t.Fatalf("execution failed: %+v", state)
	}
	if _, err = manageTask(ctx, TaskInput{Action: "resume", Revision: revision}); err == nil {
		t.Fatal("duplicate execution accepted")
	}
	result, ok := LatestNeuroAnalysis(record.ID)
	if !ok || result["ok"] != true {
		t.Fatal("actual analysis result not available to waveform UI")
	}
	if output, ok := result["output"].(map[string]any); ok && output["file_name"] != nil {
		t.Fatalf("save_output=false was ignored: %+v", output)
	}
	taskTool, err := PreprocessingTaskTool()
	if err != nil {
		t.Fatal(err)
	}
	if _, err = taskTool.Info(ctx); err != nil {
		t.Fatal(err)
	}
}
