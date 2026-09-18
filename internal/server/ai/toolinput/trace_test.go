package toolinput

import (
	"context"
	"testing"
)

func TestTraceSnapshotIsIndependent(t *testing.T) {
	trace := &Trace{}
	ctx := WithTrace(context.Background(), trace)
	Record(ctx, ToolResult{Name: "run_neuro_analysis", Succeeded: true, Steps: map[string]string{"filter": "completed"}})
	snapshot := trace.Snapshot()
	snapshot[0].Steps["filter"] = "failed"
	if trace.Snapshot()[0].Steps["filter"] != "completed" {
		t.Fatal("caller changed recorded tool evidence")
	}
}
