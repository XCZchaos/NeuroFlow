package tools

import (
	"context"
	"encoding/json"
	"fmt"
	"slices"
	"strings"
	"time"

	"OnCallAgent/internal/server/dataset"
	"OnCallAgent/internal/server/taskstate"
	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/components/tool/utils"
	"github.com/google/uuid"
)

// All answers remain user declarations until MNE has reread the file. The model
// cannot set validation/status/result itself. Session identity comes from HTTP,
// never from model-provided parameters.
type TaskInput struct {
	Action    string              `json:"action" jsonschema:"description=start/get/answer/validate/resume/cancel/retry. start saves a plan and questions; answer records current user declarations; validate rereads the file; resume executes only validated work; retry requires explicit user permission after failure/interruption"`
	Revision  int                 `json:"revision,omitempty" jsonschema:"description=Current revision returned by get; required for all mutations except start"`
	Fields    []taskstate.Field   `json:"fields,omitempty" jsonschema:"description=Questions for missing fields: sampling_rate_hz,unit,layout,channels,montage,event_dictionary,channel_count,device,reference,research_goal"`
	Answers   map[string]any      `json:"answers,omitempty" jsonschema:"description=Values explicitly supplied by the user. channels is an array of name/type/reference/drop objects; event_dictionary is a mapping"`
	UserQuote string              `json:"user_quote,omitempty" jsonschema:"description=Exact excerpt from current user message supporting the answers or explicit retry request"`
	Plan      *NeuroAnalysisInput `json:"plan,omitempty" jsonschema:"description=Executable analysis parameters, required for start. Persist user save_output preference and requested enabled_steps"`
}

func PreprocessingTaskTool() (tool.InvokableTool, error) {
	return utils.InferTool("manage_preprocessing_task", "持久化预处理任务：保存待确认字段、用户原话、验证结果和待执行步骤。信息不足时 start 后向用户提问；下轮 get/answer/validate/resume。等待状态禁止直接调用 run_neuro_analysis 绕过。", func(ctx context.Context, in TaskInput) (string, error) {
		state, err := manageTask(ctx, in)
		if err != nil {
			raw, _ := json.Marshal(map[string]any{"ok": false, "message": err.Error(), "next_action": "get task and explain the missing information or failure to the user"})
			return string(raw), nil
		}
		raw, err := json.Marshal(map[string]any{"ok": true, "task": state})
		return string(raw), err
	})
}

var taskFields = []string{"sampling_rate_hz", "unit", "layout", "channels", "montage", "event_dictionary", "channel_count", "device", "reference", "research_goal"}

func manageTask(ctx context.Context, in TaskInput) (*taskstate.State, error) {
	scope, ok := taskstate.FromContext(ctx)
	if !ok || scope.Store == nil {
		return nil, fmt.Errorf("persistent task context unavailable")
	}
	state, err := scope.Store.Get(ctx, scope.SessionID)
	if err != nil {
		return nil, err
	}
	if in.Action == "get" {
		return state, nil
	}
	if in.Action == "start" {
		if state != nil && state.Active() {
			return nil, fmt.Errorf("an active task already exists; get/answer/resume or cancel it first")
		}
		if in.Plan == nil || scope.DatasetID == "" || in.Plan.DatasetID != scope.DatasetID {
			return nil, fmt.Errorf("plan must reference the dataset bound to this session")
		}
		record, ok := dataset.Get(scope.DatasetID)
		if !ok {
			return nil, fmt.Errorf("dataset unavailable; import and bind it first")
		}
		seen := map[string]bool{}
		for _, field := range in.Fields {
			if !slices.Contains(taskFields, field.Name) || strings.TrimSpace(field.Question) == "" || seen[field.Name] {
				return nil, fmt.Errorf("invalid or duplicate pending field: %s", field.Name)
			}
			seen[field.Name] = true
		}
		// 程序补充已知的不确定字段，防止模型漏问后直接确认推断的单位或矩阵方向。
		add := func(name, question string) {
			if !seen[name] {
				in.Fields = append(in.Fields, taskstate.Field{Name: name, Question: question})
				seen[name] = true
			}
		}
		if record.Inspection.UnitConfidence < 1 && record.Inspection.SignalUnit != "" {
			add("unit", "请确认文件数值单位：V、mV 或 uV？")
		}
		if layout, _ := record.Inspection.StructureReport["layout"].(string); strings.Contains(layout, "inferred") {
			add("layout", "数据矩阵是每行一个采样点，还是每行一个通道？")
		}
		if record.Inspection.EventsRequireConfirmation && slices.Contains(in.Plan.EnabledSteps, "epoching") {
			add("event_dictionary", "请说明各事件编码对应的实验含义。")
		}
		plan, _ := json.Marshal(in.Plan)
		state = &taskstate.State{ID: uuid.NewString(), SessionID: scope.SessionID, DatasetID: scope.DatasetID, Status: "waiting_for_input", Fields: in.Fields, Answers: map[string]taskstate.Answer{}, Plan: plan, Steps: []taskstate.Step{{Name: "validate_import", Status: "pending"}, {Name: "run_neuro_analysis", Status: "pending"}}}
		state.Record("created", "Plan saved; pending fields must be answered before validation")
		return state, scope.Store.Save(ctx, state)
	}
	if state == nil {
		return nil, fmt.Errorf("no task exists")
	}
	if state.Revision != in.Revision {
		return nil, fmt.Errorf("stale revision; get the current task")
	}
	if !state.Active() {
		return nil, fmt.Errorf("task is terminal; start a new task")
	}
	if state.Status == "running" || state.Status == "validating" {
		return nil, fmt.Errorf("task is busy")
	}
	if in.Action == "cancel" {
		state.Status = "cancelled"
		state.Record("cancelled", scope.UserMessage)
		return state, scope.Store.Save(ctx, state)
	}
	if state.DatasetID != scope.DatasetID {
		return nil, fmt.Errorf("session dataset changed; cancel this task and create a new plan for the new dataset")
	}
	switch in.Action {
	case "answer":
		if state.Status == "failed" || state.Status == "interrupted" {
			return nil, fmt.Errorf("explicit retry is required before changing a failed/interrupted task")
		}
		if len(in.Answers) == 0 || strings.TrimSpace(in.UserQuote) == "" || !strings.Contains(scope.UserMessage, in.UserQuote) {
			return nil, fmt.Errorf("answers require an exact quote from the current user message")
		}
		for name, value := range in.Answers {
			if !slices.Contains(taskFields, name) || value == nil || value == "" {
				return nil, fmt.Errorf("invalid answer: %s", name)
			}
		}
		for name, value := range in.Answers {
			raw, err := json.Marshal(value)
			if err != nil {
				return nil, err
			}
			state.Answers[name] = taskstate.Answer{Value: raw, Quote: in.UserQuote, At: time.Now().UTC().Format(time.RFC3339Nano)}
		}
		state.Validation = nil
		state.Status = "waiting_for_input"
		state.Steps[0] = taskstate.Step{Name: "validate_import", Status: "pending"}
		// 审计保留每次提交的值和原话；后续修正只覆盖当前答案，不抹掉历史证据。
		answerAudit, _ := json.Marshal(map[string]any{"answers": in.Answers, "user_quote": in.UserQuote})
		state.Record("answered", string(answerAudit))
	case "retry":
		if state.Status != "failed" && state.Status != "interrupted" {
			return nil, fmt.Errorf("retry is only for failed or interrupted tasks")
		}
		if strings.TrimSpace(in.UserQuote) == "" || !strings.Contains(scope.UserMessage, in.UserQuote) {
			return nil, fmt.Errorf("explicit current user retry request required")
		}
		state.Status = "waiting_for_input"
		state.Validation = nil
		state.Steps = []taskstate.Step{{Name: "validate_import", Status: "pending"}, {Name: "run_neuro_analysis", Status: "pending"}}
		state.Record("retry_requested", in.UserQuote)
	case "validate", "resume":
		if state.Status == "failed" || state.Status == "interrupted" {
			return nil, fmt.Errorf("inspect prior outputs and request explicit retry first")
		}
		for _, field := range state.Fields {
			if _, ok := state.Answers[field.Name]; !ok {
				return nil, fmt.Errorf("missing %s: %s", field.Name, field.Question)
			}
		}
		if in.Action == "resume" && state.Status != "ready" {
			return nil, fmt.Errorf("validate the task before resuming")
		}
		state.Status = "validating"
		state.Steps[0].Status = "running"
		state.Record("validation_started", "")
		if err = scope.Store.Save(ctx, state); err != nil {
			return nil, err
		}
		// Reread again on resume. A previous successful validation is not a permanent
		// permission to run on a file or import configuration that may have changed.
		validation, validateErr := validateTask(ctx, state, in.Action == "resume")
		state.Validation, _ = json.Marshal(validation)
		if validateErr != nil {
			state.Status = "waiting_for_input"
			state.Steps[0].Status = "blocked"
			state.Steps[0].Detail = validateErr.Error()
			state.Record("validation_failed", validateErr.Error())
			return state, persistTask(ctx, scope.Store, state)
		}
		state.Steps[0] = taskstate.Step{Name: "validate_import", Status: "completed"}
		state.Status = "ready"
		state.Record("validated", "")
		if in.Action == "resume" {
			state.Status = "running"
			state.Steps[1].Status = "running"
			state.Record("execution_started", "")
			if err = persistTask(ctx, scope.Store, state); err != nil {
				return nil, err
			}
			var plan NeuroAnalysisInput
			if err = json.Unmarshal(state.Plan, &plan); err != nil {
				return nil, err
			}
			save := true
			if plan.SaveOutput != nil {
				save = *plan.SaveOutput
			}
			result, runErr := ExecuteNeuroAnalysis(ctx, plan, save)
			if runErr != nil {
				state.Status = "failed"
				state.Steps[1].Status = "failed"
				state.Steps[1].Detail = runErr.Error()
				state.Record("execution_failed", runErr.Error())
			} else {
				delete(result, "preview")
				state.Result, _ = json.Marshal(result)
				state.Status = "completed"
				state.Steps[1].Status = "completed"
				state.Record("completed", "")
			}
		}
	default:
		return nil, fmt.Errorf("unsupported task action: %s", in.Action)
	}
	return state, persistTask(ctx, scope.Store, state)
}

// Persist terminal observations even when the HTTP/SSE connection is cancelled.
// A short independent timeout avoids leaving an ordinary cancelled run 'running'.
func persistTask(ctx context.Context, store *taskstate.Store, state *taskstate.State) error {
	saveCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 5*time.Second)
	defer cancel()
	return store.Save(saveCtx, state)
}

func validateTask(ctx context.Context, state *taskstate.State, commit bool) (map[string]any, error) {
	evidence := map[string]any{"passed": false, "checked_at": time.Now().UTC().Format(time.RFC3339Nano)}
	fail := func(err error) (map[string]any, error) { evidence["message"] = err.Error(); return evidence, err }
	record, ok := dataset.Get(state.DatasetID)
	if !ok {
		return fail(fmt.Errorf("dataset unavailable after restart; reimport, cancel old task and create a new one"))
	}
	// Preserve previously confirmed import settings. Only supported user answers
	// override them; research goals and device descriptions never mutate samples.
	config := map[string]any{}
	if old, ok := record.Inspection.StructureReport["import_config"].(map[string]any); ok {
		for k, v := range old {
			config[k] = v
		}
	}
	var declared AcquisitionConfigInput
	declared.DatasetID = state.DatasetID
	declared.Modality = record.Inspection.Modality
	for name, answer := range state.Answers {
		var value any
		if err := json.Unmarshal(answer.Value, &value); err != nil {
			return fail(err)
		}
		if name == "unit" {
			unit, ok := value.(string)
			if !ok || !slices.Contains([]string{"V", "mV", "uV", "µV", "μV"}, unit) {
				return fail(fmt.Errorf("unit must be V, mV or uV"))
			}
		}
		if name == "layout" {
			layout, ok := value.(string)
			if !ok || !slices.Contains([]string{"samples_x_channels", "channels_x_samples"}, layout) {
				return fail(fmt.Errorf("invalid matrix layout"))
			}
		}
		if name == "event_dictionary" {
			dictionary, ok := value.(map[string]any)
			if !ok || len(dictionary) == 0 {
				return fail(fmt.Errorf("event_dictionary must contain event labels"))
			}
			for _, label := range dictionary {
				text, ok := label.(string)
				if !ok || strings.TrimSpace(text) == "" {
					return fail(fmt.Errorf("event labels must be nonempty strings"))
				}
			}
		}
		switch name {
		case "sampling_rate_hz", "unit", "layout", "channels", "montage", "event_dictionary":
			config[name] = value
		}
		switch name {
		case "sampling_rate_hz":
			if err := json.Unmarshal(answer.Value, &declared.SamplingRateHz); err != nil || declared.SamplingRateHz <= 0 {
				return fail(fmt.Errorf("sampling_rate_hz must be a positive number"))
			}
		case "channel_count":
			if err := json.Unmarshal(answer.Value, &declared.ChannelCount); err != nil || declared.ChannelCount <= 0 {
				return fail(fmt.Errorf("channel_count must be a positive integer"))
			}
		case "device":
			if err := json.Unmarshal(answer.Value, &declared.Device); err != nil {
				return fail(err)
			}
		case "reference":
			if err := json.Unmarshal(answer.Value, &declared.Reference); err != nil {
				return fail(err)
			}
		}
	}
	// Preview first: a failed physical/declaration check must not commit settings.
	reviewed, err := dataset.ReviewStructure(ctx, state.DatasetID, config, false)
	if err != nil {
		return fail(err)
	}
	check := BuildAcquisitionValidation(declared, &reviewed.Inspection)
	evidence["acquisition"] = check
	evidence["inspection"] = reviewed.Inspection
	if !check.CanExecute || len(reviewed.Inspection.StructureConflicts) > 0 {
		return fail(fmt.Errorf("file structure or acquisition declaration conflicts; correct the answers before execution"))
	}
	var plan NeuroAnalysisInput
	if err = json.Unmarshal(state.Plan, &plan); err != nil {
		return fail(err)
	}
	// Unknown event semantics cannot be cleared merely by saying 'confirmed'.
	if reviewed.Inspection.EventsRequireConfirmation && slices.Contains(plan.EnabledSteps, "epoching") {
		dictionary, ok := config["event_dictionary"].(map[string]any)
		if !ok || len(dictionary) == 0 {
			return fail(fmt.Errorf("event_dictionary is required before epoching"))
		}
	}
	if commit {
		reviewed, err = dataset.ReviewStructure(ctx, state.DatasetID, config, true)
		if err != nil {
			return fail(err)
		}
		InvalidateDatasetAnalysis(state.DatasetID)
	}
	evidence["passed"] = true
	evidence["committed"] = commit
	evidence["inspection"] = reviewed.Inspection
	return evidence, nil
}
