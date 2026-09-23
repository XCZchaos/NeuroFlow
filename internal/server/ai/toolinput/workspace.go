package toolinput

import "context"

type workspaceKey struct{}

// Workspace is supplied by the HTTP boundary, never parsed from model text.
// An empty DatasetID explicitly means this page has no selected dataset; it
// must not fall back to a dataset remembered by another page or an older turn.
type Workspace struct {
	Page      string
	DatasetID string
	PPGID     string
}

func WithWorkspace(ctx context.Context, value Workspace) context.Context {
	return context.WithValue(ctx, workspaceKey{}, value)
}
func CurrentWorkspace(ctx context.Context) (Workspace, bool) {
	value, ok := ctx.Value(workspaceKey{}).(Workspace)
	return value, ok
}
