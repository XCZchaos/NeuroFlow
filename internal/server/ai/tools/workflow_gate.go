package tools

import "context"

// workflowExecutionKey is private to the tool package. A model-supplied JSON
// argument cannot set it; only manageTask can authorize its own validated run.
type workflowExecutionKey struct{}

func workflowExecutionAllowed(ctx context.Context) bool {
	allowed, _ := ctx.Value(workflowExecutionKey{}).(bool)
	return allowed
}

func withWorkflowExecution(ctx context.Context) context.Context {
	return context.WithValue(ctx, workflowExecutionKey{}, true)
}
