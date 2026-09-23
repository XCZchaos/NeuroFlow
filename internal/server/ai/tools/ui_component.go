package tools

import (
	"OnCallAgent/internal/server/ai/toolinput"
	"context"
	"encoding/json"
	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/components/tool/utils"
)

type InspectUIComponentInput struct {
	ComponentID string `json:"component_id,omitempty" jsonschema:"description=本轮组件索引中的ID；省略时读取用户当前关注的组件。只读，不触发分析或修改。"`
}

func InspectUIComponentTool() (tool.InvokableTool, error) {
	return utils.InferTool("inspect_ui_component", "读取当前页面已注册组件的用途、参数、选中控件及显示状态。用于理解用户指代的这个图/参数/按钮。不含原始波形，不能作为已执行算法或信号异常的证据。", func(ctx context.Context, input InspectUIComponentInput) (string, error) {
		result := map[string]any{"ok": false, "source": "client_ui_snapshot", "read_only": true, "verified_signal_evidence": false}
		snapshot := toolinput.CurrentUIContext(ctx)
		if snapshot == nil {
			result["message"] = "No component snapshot. Ask the user to select a component in the page."
		} else {
			scope, scoped := toolinput.CurrentWorkspace(ctx)
			if !scoped || scope.Page != snapshot.Page || scope.DatasetID != snapshot.DatasetID {
				result["message"] = "Component snapshot is not bound to this workspace"
			} else {
				id := input.ComponentID
				if id == "" {
					id = snapshot.FocusedComponentID
				}
				result["page"] = snapshot.Page
				for _, item := range snapshot.Components {
					if item.ID == id {
						result["ok"] = true
						result["component"] = item
						break
					}
				}
				if result["ok"] == false {
					result["message"] = "Component not selected or unavailable in this page; ask the user to select it."
				}
			}
		}
		encoded, err := json.Marshal(result)
		return string(encoded), err
	})
}
