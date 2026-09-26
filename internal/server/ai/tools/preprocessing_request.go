package tools

import (
	"context"
	"fmt"
	"sync"

	"OnCallAgent/internal/server/taskstate"
)

var preprocessingRequests sync.Map

type taskContinuationError struct{ message string }

func (e *taskContinuationError) Error() string { return e.message }

// 模型只需提交目标参数，创建→验证→执行由后端衔接。所有动作仍经过原有
// 状态机、revision 和执行结果核验；缺信息就返回 waiting_for_input，不自行补答案。
func runPreprocessingRequest(ctx context.Context, input NeuroAnalysisInput) (*taskstate.State, error) {
	scope, ok := taskstate.FromContext(ctx)
	if !ok || scope.Store == nil {
		return nil, fmt.Errorf("persistent task context unavailable")
	}
	// Eino 可并发调用工具。相同会话的两个完整请求不能各自启动一份处理。
	key := fmt.Sprintf("%p/%s", scope.Store.DB, scope.SessionID)
	if _, busy := preprocessingRequests.LoadOrStore(key, struct{}{}); busy {
		return nil, &taskContinuationError{"a preprocessing request is already running for this session"}
	}
	defer preprocessingRequests.Delete(key)
	current, err := scope.Store.Get(ctx, scope.SessionID)
	if err != nil {
		return nil, err
	}
	if current != nil && current.Active() {
		return nil, &taskContinuationError{"an active task already exists; get its state and continue it instead of creating another"}
	}
	state, err := manageTask(ctx, TaskInput{Action: "start", Plan: &input})
	if err != nil {
		return nil, err
	}
	if len(state.Fields) > 0 {
		return state, nil
	}
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	state, err = manageTask(ctx, TaskInput{Action: "validate", Revision: state.Revision})
	if err != nil || state.Status != "ready" {
		return state, err
	}
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return manageTask(ctx, TaskInput{Action: "resume", Revision: state.Revision})
}
