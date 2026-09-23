package ppg

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"math"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

// Real Python integration without a model provider. Verifies that an Agent
// receives only a summary while Electron can retrieve the complete new result.
func TestPreparedPPGExecution(t *testing.T) {
	if err := exec.Command("python", "-c", "import neurokit2, pandas").Run(); err != nil {
		t.Skip("Python dependencies unavailable")
	}
	path := filepath.Join(t.TempDir(), "pulse.csv")
	var csv bytes.Buffer
	csv.WriteString("time,PPG\n")
	for i := 0; i < 2000; i++ {
		fmt.Fprintf(&csv, "%g,%g\n", float64(i)/100, math.Sin(2*math.Pi*1.2*float64(i)/100))
	}
	if err := os.WriteFile(path, csv.Bytes(), 0600); err != nil {
		t.Fatal(err)
	}
	config := map[string]any{"path": path, "channel": "PPG", "time_column": "time", "duration_seconds": 20}
	ctx := context.Background()
	id, _, err := Prepare(ctx, config)
	if err != nil {
		t.Fatal(err)
	}
	config["channel"] = "invented" // Caller mutation cannot alter the frozen request.
	inspected, err := Execute(ctx, id, "inspect")
	if err != nil {
		t.Fatal(err)
	}
	if inspected["selected_channel"] != "PPG" {
		t.Fatal("configuration was not frozen")
	}
	summary, err := Execute(ctx, id, "analyze")
	if err != nil {
		t.Fatal(err)
	}
	if summary["waveform"] != nil || summary["file_name"] != nil || summary["peaks"] != nil {
		t.Fatal("raw signal/file data leaked into model summary")
	}
	raw, _ := json.Marshal(summary)
	if strings.Contains(string(raw), path) {
		t.Fatal("local path leaked")
	}
	if math.Abs(summary["mean_bpm"].(float64)-72) > 2 {
		t.Fatal(summary["mean_bpm"])
	}
	full, ok := Latest(id)
	if !ok || full["waveform"] == nil || full["analysis_id"] != summary["analysis_id"] {
		t.Fatal("UI result missing")
	}
	full["analysis_id"] = "changed"
	again, _ := Latest(id)
	if again["analysis_id"] == "changed" {
		t.Fatal("mutable result escaped cache")
	}
	if err := os.WriteFile(path, []byte("changed"), 0600); err != nil {
		t.Fatal(err)
	}
	if _, err := Execute(ctx, id, "analyze"); err == nil {
		t.Fatal("changed source was accepted")
	}
	if _, err := Execute(ctx, "unknown", "analyze"); err == nil {
		t.Fatal("unknown context was accepted")
	}
}
