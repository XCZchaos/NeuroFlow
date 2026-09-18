package tools

import (
	"OnCallAgent/internal/server/ai/toolinput"
	"OnCallAgent/internal/server/analysisprogress"
	"OnCallAgent/internal/server/dataset"
	"OnCallAgent/internal/server/taskstate"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/components/tool/utils"
)

// NeuroKitAnalysisInput 是给模型填写的最小参数集。只接受已注册数据集 ID，
// 不接受任意文件路径或 Python 函数名，防止模型越过文件注册和参数校验。
type NeuroKitAnalysisInput struct {
	DatasetID    string   `json:"dataset_id" jsonschema:"description=已导入并完成结构确认的 EEG 数据集 ID"`
	Method       string   `json:"method" jsonschema:"description=只允许 bad_channels、band_power 或 gfp；分别表示候选坏道、各通道频带功率和全局场功率"`
	StartSeconds float64  `json:"start_seconds,omitempty" jsonschema:"description=分析起点秒，默认 0"`
	EndSeconds   float64  `json:"end_seconds,omitempty" jsonschema:"description=分析终点秒，0 表示记录末尾；长数据请指定短窗口"`
	Channels     []string `json:"channels,omitempty" jsonschema:"description=可选 EEG 通道名；不填则分析全部 EEG 通道"`
}

func RunNeuroKitAnalysisTool() (tool.InvokableTool, error) {
	return utils.InferTool("run_neurokit_analysis",
		"用 NeuroKit2 对已导入 EEG 做只读诊断。method=bad_channels 检测候选坏道，band_power 算各通道频带功率，gfp 算全局场功率摘要。需要 dataset_id；不插值、不滤波、不保存预处理文件。结果仅表示本次窗口的分析，不得说成已完成 MNE 预处理。",
		func(ctx context.Context, input NeuroKitAnalysisInput) (string, error) {
			result, err := ExecuteNeuroKitAnalysis(ctx, input)
			if err != nil {
				// 可解释的参数或依赖错误作为工具观察值返回，供 ReAct 修正参数或告知用户。
				failure, _ := json.Marshal(map[string]any{"ok": false, "code": "NEUROKIT_ANALYSIS_FAILED", "message": err.Error(), "dataset_id": input.DatasetID})
				return string(failure), nil
			}
			payload, err := json.Marshal(result)
			return string(payload), err
		})
}

// ExecuteNeuroKitAnalysis 是工具的确定性执行边界：先检查数据集与方法，
// 再把受限参数传给 Python。分析结果不会覆盖 MNE 的 latestAnalysis。
func ExecuteNeuroKitAnalysis(ctx context.Context, input NeuroKitAnalysisInput) (map[string]any, error) {
	if scope, ok := taskstate.FromContext(ctx); ok && (scope.DatasetID == "" || scope.DatasetID != input.DatasetID) {
		return nil, fmt.Errorf("dataset_id 与当前会话绑定不一致；请先在界面选择数据集")
	}
	method := strings.ToLower(strings.TrimSpace(input.Method))
	if method != "bad_channels" && method != "band_power" && method != "gfp" {
		return nil, fmt.Errorf("method 必须是 bad_channels、band_power 或 gfp")
	}
	if input.StartSeconds < 0 || input.EndSeconds < 0 || (input.EndSeconds > 0 && input.EndSeconds <= input.StartSeconds) {
		return nil, fmt.Errorf("分析时间范围无效")
	}
	path, inspection, ok := dataset.ResolveLocalPath(strings.TrimSpace(input.DatasetID))
	if !ok {
		return nil, fmt.Errorf("dataset_id 不存在或后端已重启，请重新导入数据")
	}
	if inspection.Modality != "EEG" {
		return nil, fmt.Errorf("NeuroKit2 当前工具仅支持 EEG；文件模态为 %s", inspection.Modality)
	}
	requiresConfirmation, _ := inspection.StructureReport["requires_confirmation"].(bool)
	if len(inspection.StructureConflicts) > 0 || requiresConfirmation {
		return nil, fmt.Errorf("数据结构仍需确认，请先完成导入确认")
	}
	script, err := neuroAnalysisScriptPath()
	if err != nil {
		return nil, err
	}
	script = filepath.Join(filepath.Dir(script), "neurokit_analysis.py")
	if info, err := os.Stat(script); err != nil || info.IsDir() {
		return nil, fmt.Errorf("找不到 neuro_service/neurokit_analysis.py")
	}
	args := []string{script, path, method, "--start", fmt.Sprintf("%g", input.StartSeconds), "--end", fmt.Sprintf("%g", input.EndSeconds)}
	if len(input.Channels) > 0 {
		encoded, err := json.Marshal(input.Channels)
		if err != nil {
			return nil, fmt.Errorf("编码通道列表: %w", err)
		}
		args = append(args, "--channels", string(encoded))
	}
	analysisprogress.Publish(input.DatasetID, "neurokit_"+method, "started", "NeuroKit2 diagnostic started", 1)
	cmd := exec.CommandContext(ctx, "python", args...)
	var stdout, stderr bytes.Buffer
	cmd.Stdout, cmd.Stderr = &stdout, &stderr
	runErr := cmd.Run()
	var result map[string]any
	if err := json.Unmarshal(bytes.TrimSpace(stdout.Bytes()), &result); err != nil {
		analysisprogress.Publish(input.DatasetID, "neurokit_"+method, "failed", "NeuroKit2 returned invalid JSON", 1)
		return nil, fmt.Errorf("NeuroKit2 返回无效 JSON: %w (%s)", err, strings.TrimSpace(stderr.String()))
	}
	if runErr != nil || result["ok"] != true {
		analysisprogress.Publish(input.DatasetID, "neurokit_"+method, "failed", fmt.Sprint(result["message"]), 1)
		return nil, fmt.Errorf("NeuroKit2 分析失败: %v", result["message"])
	}
	result["dataset_id"] = input.DatasetID
	toolinput.Record(ctx, toolinput.ToolResult{Name: "run_neurokit_analysis", DatasetID: input.DatasetID, Succeeded: true})
	analysisprogress.Publish(input.DatasetID, "neurokit_"+method, "completed", "NeuroKit2 diagnostic ready", 1)
	return result, nil
}
