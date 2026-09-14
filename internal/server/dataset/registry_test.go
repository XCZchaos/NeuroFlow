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

func TestReviewMissingDataset(t *testing.T) {
	if _, err := ReviewStructure(context.Background(), "missing", map[string]any{}, false); err == nil {
		t.Fatal("must reject unknown dataset")
	}
}

func TestReviewRereadsCandidateWithoutChangingRecord(t *testing.T) {
	path := filepath.Join(t.TempDir(), "sample.csv")
	if err := os.WriteFile(path, []byte("time,C3,C4\n0,10,20\n0.004,11,22\n"), 0600); err != nil {
		t.Fatal(err)
	}
	record, err := Register(context.Background(), path)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { records.Delete(record.ID) })
	candidate := map[string]any{"unit": "uV", "sampling_rate_hz": 250,
		"channels": []map[string]any{{"name": "Fp1", "type": "eeg"}, {"name": "Fp2", "type": "eeg", "drop": true}}}
	reviewed, err := ReviewStructure(context.Background(), record.ID, candidate, false)
	if err != nil {
		t.Fatal(err)
	}
	if reviewed.Inspection.ChannelCount != 1 || reviewed.Inspection.ChannelNames[0] != "Fp1" {
		t.Fatalf("wrong reread: %+v", reviewed.Inspection)
	}
	stored, _ := Get(record.ID)
	if stored.Inspection.ChannelCount != 2 {
		t.Fatal("preview modified registered metadata")
	}
}

func TestGetUnknownDataset(t *testing.T) {
	if _, ok := Get("missing"); ok {
		t.Fatal("unknown dataset must not exist")
	}
}
