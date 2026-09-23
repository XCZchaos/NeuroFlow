package tools

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"OnCallAgent/internal/server/ai/toolinput"
	"OnCallAgent/internal/server/analysisprogress"
	"OnCallAgent/internal/server/dataset"
	"OnCallAgent/internal/server/taskstate"
	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/components/tool/utils"
)

// SleepStagingInput is deliberately small: the model may select a registered
// dataset, but it cannot provide an arbitrary path or execute Python code.
type SleepStagingInput struct {
	DatasetID string `json:"dataset_id" jsonschema:"description=当前会话绑定且结构已经确认的睡眠 EEG 数据集 ID"`
}

var latestSleepStages sync.Map

// SleepStagingTool gives the ReAct agent one auditable function call. The full
// per-epoch output remains local; only a compact summary reaches the model.
func SleepStagingTool() (tool.InvokableTool, error) {
	return utils.InferTool("suggest_sleep_stages",
		"使用本地 MNE 和可审计的确定性规则，为睡眠 EEG 生成每 30 秒 W/N1/N2/N3/REM 候选标签。结果必须人工复核，不得描述为临床诊断或已确认金标准。",
		func(ctx context.Context, input SleepStagingInput) (string, error) {
			result, err := ExecuteSleepStaging(ctx, input.DatasetID)
			if err != nil {
				failure, _ := json.Marshal(map[string]any{"ok": false, "code": "SLEEP_STAGING_FAILED", "message": err.Error()})
				return string(failure), nil
			}
			epochCount := 0
			if epochs, ok := result["epochs"].([]any); ok {
				epochCount = len(epochs)
			}
			summary := map[string]any{
				"ok": true, "dataset_id": input.DatasetID, "analysis_id": result["analysis_id"],
				"engine": result["engine"], "epoch_seconds": result["epoch_seconds"],
				"review_required": true, "channel_support": result["channel_support"],
				"capabilities": result["capabilities"], "event_counts": result["event_counts"],
				"counts": result["counts"], "epoch_count": epochCount,
				"ui_hint": "逐 Epoch 候选标签已发送到睡眠标注页面，请提醒用户复核。",
			}
			raw, marshalErr := json.Marshal(summary)
			return string(raw), marshalErr
		})
}

// ExecuteSleepStaging is shared by the Agent function call and the sleep page,
// so both entry points use identical validation and Python execution logic.
func ExecuteSleepStaging(ctx context.Context, id string) (map[string]any, error) {
	id = strings.TrimSpace(id)
	if scope, ok := taskstate.FromContext(ctx); ok && (scope.DatasetID == "" || scope.DatasetID != id) {
		return nil, fmt.Errorf("dataset_id 与当前会话绑定不一致")
	}
	path, inspection, ok := dataset.ResolveLocalPath(id)
	if !ok {
		return nil, fmt.Errorf("数据集不可用，请重新导入")
	}
	if inspection.Modality != "EEG" {
		return nil, fmt.Errorf("睡眠自动分期当前需要 EEG 数据，文件模态为 %s", inspection.Modality)
	}
	requiresConfirmation, _ := inspection.StructureReport["requires_confirmation"].(bool)
	if len(inspection.StructureConflicts) > 0 || requiresConfirmation {
		return nil, fmt.Errorf("自动分期前必须先确认数据结构、采样率、单位和通道类型")
	}
	base, err := neuroAnalysisScriptPath()
	if err != nil {
		return nil, err
	}
	script := filepath.Join(filepath.Dir(base), "sleep_staging.py")
	if info, statErr := os.Stat(script); statErr != nil || info.IsDir() {
		return nil, fmt.Errorf("找不到 neuro_service/sleep_staging.py")
	}
	analysisprogress.Publish(id, "sleep_staging", "started", "Sleep-stage candidate generation started", 1)
	cmd := exec.CommandContext(ctx, "python", script, path)
	var stdout, stderr bytes.Buffer
	cmd.Stdout, cmd.Stderr = &stdout, &stderr
	runErr := cmd.Run()
	var result map[string]any
	if err := json.Unmarshal(bytes.TrimSpace(stdout.Bytes()), &result); err != nil {
		analysisprogress.Publish(id, "sleep_staging", "failed", "Sleep staging returned invalid JSON", 1)
		return nil, fmt.Errorf("睡眠分期返回无效 JSON: %w (%s)", err, strings.TrimSpace(stderr.String()))
	}
	if runErr != nil || result["ok"] != true {
		analysisprogress.Publish(id, "sleep_staging", "failed", fmt.Sprint(result["message"]), 1)
		return nil, fmt.Errorf("睡眠分期失败: %v", result["message"])
	}
	result["dataset_id"] = id
	result["analysis_id"] = fmt.Sprintf("sleep-%d", time.Now().UTC().UnixNano())
	result["generated_at"] = time.Now().UTC().Format(time.RFC3339Nano)
	latestSleepStages.Store(id, result)
	toolinput.Record(ctx, toolinput.ToolResult{Name: "suggest_sleep_stages", DatasetID: id, Succeeded: true})
	analysisprogress.Publish(id, "sleep_staging", "completed", "Sleep-stage candidates are ready for review", 1)
	return cloneSleepResult(result), nil
}

func LatestSleepStages(id string) (map[string]any, bool) {
	value, ok := latestSleepStages.Load(strings.TrimSpace(id))
	if !ok {
		return nil, false
	}
	result, ok := value.(map[string]any)
	if !ok {
		return nil, false
	}
	return cloneSleepResult(result), true
}

func cloneSleepResult(value map[string]any) map[string]any {
	raw, _ := json.Marshal(value)
	var copied map[string]any
	if json.Unmarshal(raw, &copied) != nil {
		return map[string]any{}
	}
	return copied
}
