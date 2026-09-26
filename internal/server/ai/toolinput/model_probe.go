package toolinput

import "context"

type modelProbeKey struct{}

// Only server-side diagnostics can set this flag. Tests must not process files,
// modify tasks, or depend on whichever dataset the user happens to have open.
func WithModelProbe(ctx context.Context) context.Context {
	return context.WithValue(ctx, modelProbeKey{}, true)
}
func IsModelProbe(ctx context.Context) bool { v, _ := ctx.Value(modelProbeKey{}).(bool); return v }
