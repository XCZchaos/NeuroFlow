package tools

import (
	"OnCallAgent/internal/server/ai/toolinput"
	"context"
	"encoding/json"
	"testing"
)

func TestInspectUIComponentIsScopedReadOnly(t *testing.T) {
	callable, err := InspectUIComponentTool()
	if err != nil {
		t.Fatal(err)
	}
	info, err := callable.Info(context.Background())
	if err != nil || info.Name != "inspect_ui_component" {
		t.Fatal(info, err)
	}
	snapshot := &toolinput.UIContext{Version: 1, Page: "eeg", DatasetID: "d1", FocusedComponentID: "pipeline", Components: []toolinput.UIComponent{{ID: "pipeline", State: map[string]any{"enabled": true, "highpass_hz": 1}}}}
	ctx := toolinput.WithWorkspace(context.Background(), toolinput.Workspace{Page: "eeg", DatasetID: "d1"})
	ctx = toolinput.WithUIContext(ctx, snapshot)
	raw, err := callable.InvokableRun(ctx, `{}`)
	if err != nil {
		t.Fatal(err)
	}
	var result map[string]any
	if err = json.Unmarshal([]byte(raw), &result); err != nil {
		t.Fatal(err)
	}
	if result["ok"] != true || result["read_only"] != true || result["verified_signal_evidence"] != false {
		t.Fatal(raw)
	}
	for _, args := range []string{`{"component_id":"not-present"}`} {
		raw, err = callable.InvokableRun(ctx, args)
		if err != nil {
			t.Fatal(err)
		}
		json.Unmarshal([]byte(raw), &result)
		if result["ok"] != false {
			t.Fatal("unknown component accepted")
		}
	}
	wrong := toolinput.WithWorkspace(ctx, toolinput.Workspace{Page: "ppg"})
	raw, err = callable.InvokableRun(wrong, `{}`)
	if err != nil {
		t.Fatal(err)
	}
	json.Unmarshal([]byte(raw), &result)
	if result["ok"] != false {
		t.Fatal("cross-page access allowed")
	}
	if snapshot.Components[0].State["highpass_hz"] != 1 {
		t.Fatal("read operation mutated state")
	}
	snapshot.ExplainOnly = true
	// The wrapped analysis tool must stop before touching its delegate; a nil
	// delegate would panic if this read-only gate accidentally allowed execution.
	guard := &workspaceTool{name: "run_neuro_analysis"}
	raw, err = guard.InvokableRun(ctx, `{"dataset_id":"d1"}`)
	if err != nil {
		t.Fatal(err)
	}
	json.Unmarshal([]byte(raw), &result)
	if result["code"] != "COMPONENT_EXPLANATION_ONLY" {
		t.Fatal("explanation executed an analysis", raw)
	}
}
