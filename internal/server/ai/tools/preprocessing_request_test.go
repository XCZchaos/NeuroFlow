package tools

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"OnCallAgent/internal/server/ai/toolinput"
	"OnCallAgent/internal/server/dataset"
	"OnCallAgent/internal/server/taskstate"
)

// 真实 CSV→MNE→SQLite 回归：证明模型只调用一次也确实通过全部工作流关口，
// 同时检查已存在的等待任务不会被只读诊断改变。使用临时合成记录，不需要外部服务。
func TestFullToolRunsWorkflowAndWaitingTaskAllowsDiagnostics(t *testing.T) {
	ctx := context.Background()
	dir := t.TempDir()
	path := filepath.Join(dir, "eeg.csv")
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
	_, err = dataset.ReviewStructure(ctx, record.ID, map[string]any{"unit": "uV", "sampling_rate_hz": 250}, true)
	if err != nil {
		t.Fatal(err)
	}
	db, err := sql.Open("sqlite", filepath.Join(dir, "tasks.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)
	if _, err = db.Exec(`CREATE TABLE sessions(id TEXT PRIMARY KEY); INSERT INTO sessions VALUES('single')`); err != nil {
		t.Fatal(err)
	}
	store := &taskstate.Store{DB: db}
	if err = store.Init(ctx); err != nil {
		t.Fatal(err)
	}
	scope := taskstate.Scope{Store: store, SessionID: "single", DatasetID: record.ID, UserMessage: "请滤波，不要保存文件"}
	ctx = taskstate.WithScope(ctx, scope)
	trace := &toolinput.Trace{}
	ctx = toolinput.WithTrace(ctx, trace)
	tool, err := RunNeuroAnalysisTool()
	if err != nil {
		t.Fatal(err)
	}
	out, err := tool.InvokableRun(ctx, fmt.Sprintf(`{"dataset_id":%q,"analysis_type":"full","enabled_steps":["bandpass_filter"],"save_output":true}`, record.ID))
	var response struct {
		OK        bool            `json:"ok"`
		Completed bool            `json:"completed"`
		Status    string          `json:"status"`
		Task      taskstate.State `json:"task"`
	}
	if err != nil || json.Unmarshal([]byte(out), &response) != nil || !response.OK || !response.Completed || response.Status != "completed" || response.Task.Status != "completed" {
		t.Fatalf("single tool workflow failed: %s %v", out, err)
	}
	for _, step := range response.Task.Steps {
		if step.Status != "completed" {
			t.Fatalf("workflow gate not passed: %+v", step)
		}
	}
	if len(trace.Snapshot()) != 1 || trace.Snapshot()[0].Saved {
		t.Fatal("workflow duplicated execution or ignored no-save")
	}
	if _, err = os.Stat(filepath.Join("..", "..", "..", "..", "outputs", record.ID)); !os.IsNotExist(err) {
		t.Fatalf("no-save created an output directory: %v", err)
	}
	// 等待与信号结构无关的研究目标；诊断不需要给这项答案，也不能擅自填答或取消任务。
	state, err := manageTask(ctx, TaskInput{Action: "start", Fields: []taskstate.Field{{Name: "research_goal", Question: "目标是什么？"}}, Plan: &NeuroAnalysisInput{DatasetID: record.ID, AnalysisType: "full", EnabledSteps: []string{"epoching"}}})
	if err != nil {
		t.Fatal(err)
	}
	before, _ := json.Marshal(state)
	// 当前请求没有“不保存”字样，证明诊断本身强制不落盘，而非靠用户原话拦截。
	scope.UserMessage = "只检查信号质量"
	ctx = taskstate.WithScope(ctx, scope)
	out, err = tool.InvokableRun(ctx, fmt.Sprintf(`{"dataset_id":%q,"analysis_type":"quality","save_output":true}`, record.ID))
	var diagnostic map[string]any
	if err != nil || json.Unmarshal([]byte(out), &diagnostic) != nil || diagnostic["ok"] != true {
		t.Fatalf("waiting task blocked diagnosis: %s %v", out, err)
	}
	if diagnostic["output"].(map[string]any)["saved"] != false {
		t.Fatal("diagnostic saved processed data")
	}
	afterState, err := store.Get(ctx, "single")
	if err != nil {
		t.Fatal(err)
	}
	after, _ := json.Marshal(afterState)
	if string(before) != string(after) {
		t.Fatal("diagnostic changed pending task state")
	}
	out, err = tool.InvokableRun(ctx, fmt.Sprintf(`{"dataset_id":%q,"analysis_type":"full"}`, record.ID))
	if err != nil || !strings.Contains(out, "TASK_REQUIRES_RESUME") {
		t.Fatalf("full analysis bypassed waiting task: %s %v", out, err)
	}
	out, err = tool.InvokableRun(ctx, `{"dataset_id":"unbound","analysis_type":"quality"}`)
	if err != nil || !strings.Contains(out, `"ok":false`) {
		t.Fatalf("diagnostic bypassed binding: %s %v", out, err)
	}
}

func TestOnlyEventDependentOperationsRequireEventSemantics(t *testing.T) {
	for _, test := range []struct {
		profile string
		steps   []string
		needs   bool
	}{
		{"summary", nil, false}, {"quality", []string{"epoching"}, false},
		{"full", nil, true}, {"full", []string{"bandpass_filter"}, false},
		{"full", []string{"erp"}, true}, {"full", []string{"decoding"}, true}, {"full", []string{"time_frequency"}, true},
	} {
		if got := analysisNeedsEvents(NeuroAnalysisInput{AnalysisType: test.profile, EnabledSteps: test.steps}); got != test.needs {
			t.Fatalf("event prerequisite %s %v: %v", test.profile, test.steps, got)
		}
	}
}
