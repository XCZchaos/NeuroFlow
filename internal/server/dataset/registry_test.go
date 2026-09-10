package dataset

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func TestRegisterUnsupportedFormat(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "recording.xyz")
	if err := os.WriteFile(path, []byte("not neuro data"), 0o600); err != nil {
		t.Fatal(err)
	}
	_, err := Register(context.Background(), path)
	var inspectErr *InspectError
	if !errors.As(err, &inspectErr) {
		t.Fatalf("expected InspectError, got %v", err)
	}
	if inspectErr.Inspection.Code != "UNSUPPORTED_FORMAT" {
		t.Fatalf("unexpected code: %s", inspectErr.Inspection.Code)
	}
	if len(inspectErr.Inspection.Supported) == 0 {
		t.Fatal("supported format list should not be empty")
	}
}

func TestGetUnknownDataset(t *testing.T) {
	if _, ok := Get("missing"); ok {
		t.Fatal("unknown dataset must not exist")
	}
}
