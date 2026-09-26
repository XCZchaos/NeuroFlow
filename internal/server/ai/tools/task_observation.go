package tools

import (
	"encoding/json"

	"OnCallAgent/internal/server/taskstate"
)

// taskObservation 是两个任务入口共同使用的模型观察结果，不改变数据库状态。
// ok 不能证明处理完成：只有 completed=true 才表示通过了任务的结果核验。
// task 保留原有完整证据；顶层字段让模型不必从审计历史猜测当前应该做什么。
type taskObservation struct {
	OK            bool              `json:"ok"`
	Status        string            `json:"status"`
	Completed     bool              `json:"completed"`
	Code          string            `json:"code,omitempty"`
	PendingFields []taskstate.Field `json:"pending_fields"`
	NextAction    string            `json:"next_action"`
	Task          *taskstate.State  `json:"task"`
}

func marshalTaskObservation(state *taskstate.State) (string, error) {
	out := taskObservation{OK: true, Status: "not_found", PendingFields: []taskstate.Field{}, Task: state,
		NextAction: "No task exists. For a new authorized analysis use run_neuro_analysis(full); for questions answer or inspect the dataset as needed."}
	if state != nil {
		out.Status = state.Status
		// State.Fields 保留最初的问题用于恢复和审计，已有答案的字段不应重复问用户。
		// 答案是否有效仍由 validate/MNE 检查，不把“有答案”等同于“验证通过”。
		for _, field := range state.Fields {
			if _, answered := state.Answers[field.Name]; !answered {
				out.PendingFields = append(out.PendingFields, field)
			}
		}
		switch state.Status {
		case "waiting_for_input":
			out.NextAction = "Answers are recorded but not validated. If execution was requested, call manage_preprocessing_task validate with task.revision; no additional approval is needed."
			if len(out.PendingFields) > 0 {
				out.NextAction = "Use current user-provided answers for pending_fields with manage_preprocessing_task answer, or ask only for the still-missing values. Independent read-only checks may continue."
			} else {
				// 验证失败未必生成新 Field，例如单位填了但量纲冲突。此时应看实际
				// 错误修正，而不是因为 pending_fields 为空就重复 validate/resume。
				for _, step := range state.Steps {
					if step.Name == "validate_import" && step.Status == "blocked" {
						out.NextAction = "Inspect task.validation and the blocked step detail. Correct the conflicting information using file evidence or the user's answer before validating again; do not repeat unchanged parameters."
						break
					}
				}
			}
		case "ready":
			out.NextAction = "Validation passed. If the user requested execution, call manage_preprocessing_task resume with task.revision in this turn; do not ask for permission again. For a validation-only request, report the result."
		case "running", "validating":
			out.NextAction = "Work is already in progress. Report that status; do not start duplicate work or repeatedly poll within this turn."
		case "completed":
			out.Completed = true
			out.NextAction = "Report task.result and actual step outcomes. Do not rerun completed work or claim that skipped operations succeeded."
		case "failed", "interrupted":
			out.OK = false
			out.Code = "TASK_FAILED"
			if state.Status == "interrupted" {
				out.Code = "TASK_INTERRUPTED"
			}
			out.NextAction = "Inspect steps, validation and any saved result before retrying. Reuse an explicit retry request in the current user message if present; otherwise explain the failure and ask before repeating potentially saved work."
		case "cancelled":
			out.NextAction = "The task was cancelled. Do not resume it; create another task only if the user requests new work."
		default:
			out.OK = false
			out.Code = "UNKNOWN_TASK_STATUS"
			out.NextAction = "The task status is not recognized. Inspect the task and report the inconsistency; do not assume execution succeeded."
		}
	}
	raw, err := json.Marshal(out)
	return string(raw), err
}
