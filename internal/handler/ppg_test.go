package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"math"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin"
)

// Exercise the same HTTP -> Python -> JSON boundary as the desktop, without a
// model service or Qdrant. Invalid inputs must not look like successful analyses.
func TestPPGBoundary(t *testing.T) {
	if err := exec.Command("python", "-c", "import neurokit2, pandas").Run(); err != nil {
		t.Skip("Python PPG dependencies unavailable")
	}
	path := filepath.Join(t.TempDir(), "pulse.csv")
	var csv bytes.Buffer
	csv.WriteString("time,PPG\n")
	for i := 0; i < 3000; i++ {
		fmt.Fprintf(&csv, "%g,%g\n", float64(i)/100, math.Sin(2*math.Pi*1.2*float64(i)/100))
	}
	if err := os.WriteFile(path, csv.Bytes(), 0600); err != nil {
		t.Fatal(err)
	}
	r := gin.New()
	r.POST("/ppg/inspect", ProcessPPG("inspect"))
	r.POST("/ppg/analyze", ProcessPPG("analyze"))
	request := func(route string, data map[string]any) (int, map[string]any) {
		body, _ := json.Marshal(data)
		w := httptest.NewRecorder()
		req := httptest.NewRequest("POST", route, bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(w, req)
		var decoded map[string]any
		if err := json.Unmarshal(w.Body.Bytes(), &decoded); err != nil {
			t.Fatal(err, w.Body.String())
		}
		return w.Code, decoded
	}
	if code, data := request("/ppg/inspect", map[string]any{"path": path}); code != 200 || data["sampling_rate_hz"] != nil {
		t.Fatal(code, data)
	}
	options := map[string]any{"path": path, "channel": "PPG", "time_column": "time", "duration_seconds": 30}
	if code, data := request("/ppg/analyze", options); code != 200 || math.Abs(data["mean_bpm"].(float64)-72) > 2 {
		t.Fatal(code, data)
	}
	options["sampling_rate_hz"] = 250
	if code, data := request("/ppg/analyze", options); code != 422 || data["ok"] != false {
		t.Fatal(code, data)
	}
}
