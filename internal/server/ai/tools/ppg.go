package tools

import (
	"OnCallAgent/internal/server/ai/toolinput"
	"OnCallAgent/internal/server/ppg"
	"context"
	"encoding/json"
	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/components/tool/utils"
)

type PPGInput struct {
	Action string `json:"action" jsonschema:"enum=inspect,enum=analyze,description=inspect读取当前PPG页面已选择的文件事实；analyze使用页面确认的参数执行清洗脉搏峰和心率计算并更新图像。不接受路径、不修改原文件。"`
}

func PPGTool() (tool.InvokableTool, error) {
	return utils.InferTool("run_ppg_analysis", "检查或处理当前PPG页面的真实记录，使用NeuroKit2 Elgendi，返回元数据或分析摘要；完整波形回传PPG页面。参数以用户在页面选择的设置为准。", func(ctx context.Context, input PPGInput) (string, error) {
		scope, ok := toolinput.CurrentWorkspace(ctx)
		if !ok || scope.Page != "ppg" || scope.PPGID == "" {
			return `{"ok":false,"message":"请先在 PPG 页面导入文件、选择通道并确认采样率 / Select and configure a recording in the PPG page first"}`, nil
		}
		result, err := ppg.Execute(ctx, scope.PPGID, input.Action)
		if err != nil {
			result = map[string]any{"ok": false, "message": err.Error()}
		} else if input.Action == "analyze" {
			toolinput.Record(ctx, toolinput.ToolResult{Name: "run_ppg_analysis", Succeeded: true})
		}
		encoded, marshalErr := json.Marshal(result)
		return string(encoded), marshalErr
	})
}
