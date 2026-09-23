package tools

import (
	"OnCallAgent/internal/server/ai/toolinput"
	"context"
	"encoding/json"
	"fmt"
	"github.com/cloudwego/eino/components/tool"
	"github.com/google/uuid"
	"time"
)

type workspaceTool struct {
	tool.InvokableTool
	name string
}

// ScopeTool checks page capability at the execution boundary, not just in the
// prompt. Older clients without workspace continue using existing task guards.
func ScopeTool(ctx context.Context, original tool.BaseTool) (tool.BaseTool, error) {
	callable, ok := original.(tool.InvokableTool)
	if !ok {
		return nil, fmt.Errorf("workspace tool must be invokable")
	}
	info, err := original.Info(ctx)
	if err != nil {
		return nil, err
	}
	return &workspaceTool{InvokableTool: callable, name: info.Name}, nil
}
func (t *workspaceTool) InvokableRun(ctx context.Context, arguments string, opts ...tool.Option) (result string, err error) {
	// 在真实调用边界报告开始/结束，包括被作用域守卫拒绝的调用。
	// 工具可能用 JSON ok:false 返回业务失败，不能只依据 Go error 宣称成功。
	callID, started := uuid.NewString(), time.Now()
	toolinput.EmitStream(ctx, "status", map[string]any{"kind": "tool", "id": callID, "tool": t.name, "state": "running"})
	defer func() {
		status := "completed"
		var payload struct {
			OK     *bool           `json:"ok"`
			Error  json.RawMessage `json:"error"`
			Status string          `json:"status"`
		}
		_ = json.Unmarshal([]byte(result), &payload)
		if err != nil || (payload.OK != nil && !*payload.OK) || (len(payload.Error) > 0 && string(payload.Error) != "null" && string(payload.Error) != `""`) || payload.Status == "failed" || payload.Status == "error" {
			status = "failed"
		}
		if ctx.Err() != nil {
			status = "cancelled"
		}
		toolinput.EmitStream(ctx, "status", map[string]any{"kind": "tool", "id": callID, "tool": t.name, "state": status, "elapsed_ms": time.Since(started).Milliseconds()})
	}()
	// “解释此组件”是纯问答入口：即使模型误选分析工具，也不能执行处理。
	if ui := toolinput.CurrentUIContext(ctx); ui != nil && ui.ExplainOnly {
		var input map[string]any
		_ = json.Unmarshal([]byte(arguments), &input)
		blocked := t.name == "run_neuro_analysis" || t.name == "run_neurokit_analysis" || t.name == "suggest_sleep_stages" || (t.name == "run_ppg_analysis" && input["action"] != "inspect") || (t.name == "manage_preprocessing_task" && input["action"] != "get")
		if blocked {
			return `{"ok":false,"code":"COMPONENT_EXPLANATION_ONLY","message":"This request only explains a component. Do not execute or modify anything."}`, nil
		}
	}
	scope, scoped := toolinput.CurrentWorkspace(ctx)
	if scoped {
		if message := workspaceToolError(scope, t.name, arguments); message != "" {
			raw, _ := json.Marshal(map[string]any{"ok": false, "code": "WORKSPACE_SCOPE_MISMATCH", "message": message})
			return string(raw), nil
		}
	}
	return t.InvokableTool.InvokableRun(toolinput.WithToolCallID(ctx, callID), arguments, opts...)
}
func workspaceToolError(scope toolinput.Workspace, name, arguments string) string {
	if name == "run_ppg_analysis" {
		if scope.Page != "ppg" {
			return "Open the PPG page to process PPG; do not use another page's dataset"
		}
		return ""
	}
	// Read-only knowledge tools work on every page. All registered data tools
	// either carry dataset_id or mutate preprocessing state and need a bound file.
	var input map[string]any
	_ = json.Unmarshal([]byte(arguments), &input)
	id, _ := input["dataset_id"].(string)
	if id != "" && (scope.DatasetID == "" || id != scope.DatasetID) {
		return "Tool dataset_id differs from the active page; select the intended recording first"
	}
	switch name {
	case "run_neuro_analysis", "run_neurokit_analysis", "suggest_sleep_stages", "manage_preprocessing_task":
		if scope.Page != "eeg" && scope.Page != "meg" && scope.Page != "fnirs" && scope.Page != "sleep" {
			return "This page is for review and questions. Open the matching signal workspace before executing data operations"
		}
		if scope.DatasetID == "" {
			return "No dataset selected in this workspace; import and confirm a recording first"
		}
	}
	return ""
}
