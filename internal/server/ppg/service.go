// Package ppg shares one execution path between the desktop and the Agent.
package ppg

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sync"
	"time"
)

type entry struct {
	Config   map[string]any
	Metadata map[string]any
	Result   map[string]any
	Size     int64
	Modified time.Time
	Created  time.Time
}

var records = struct {
	sync.Mutex
	data map[string]*entry
}{data: make(map[string]*entry)}

// Invoke never builds a shell command. JSON travels through stdin; the path is
// local-only and the process is bounded by the caller's cancellation/deadline.
func Invoke(ctx context.Context, input map[string]any, operation string) (map[string]any, error) {
	config := copyMap(input)
	config["operation"] = operation
	encoded, err := json.Marshal(config)
	if err != nil {
		return nil, err
	}
	candidates := []string{filepath.Join("neuro_service", "ppg_analysis.py")}
	if executable, err := os.Executable(); err == nil {
		candidates = append(candidates, filepath.Join(filepath.Dir(executable), "neuro_service", "ppg_analysis.py"))
	}
	if _, source, _, ok := runtime.Caller(0); ok {
		candidates = append(candidates, filepath.Join(filepath.Dir(source), "..", "..", "..", "neuro_service", "ppg_analysis.py"))
	}
	var script string
	for _, candidate := range candidates {
		if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
			script = candidate
			break
		}
	}
	if script == "" {
		return nil, fmt.Errorf("Missing neuro_service/ppg_analysis.py")
	}
	ctx, cancel := context.WithTimeout(ctx, 3*time.Minute)
	defer cancel()
	cmd := exec.CommandContext(ctx, "python", script)
	cmd.Env = append(os.Environ(), "PYTHONIOENCODING=utf-8")
	cmd.Stdin = bytes.NewReader(encoded)
	var stdout, stderr bytes.Buffer
	cmd.Stdout, cmd.Stderr = &stdout, &stderr
	err = cmd.Run()
	var result map[string]any
	if json.Unmarshal(stdout.Bytes(), &result) != nil {
		if ctx.Err() != nil {
			return nil, fmt.Errorf("PPG processing cancelled or timed out")
		}
		return nil, fmt.Errorf("PPG Python service failed; check Python and NeuroKit2 installation")
	}
	if err != nil || result["ok"] != true {
		return nil, fmt.Errorf("%v", result["message"])
	}
	return result, nil
}

// Prepare freezes a browser-selected configuration under an opaque ID. The LLM
// never receives the source path and cannot replace it with a fabricated path.
func Prepare(ctx context.Context, config map[string]any) (string, map[string]any, error) {
	path, _ := config["path"].(string)
	before, err := os.Stat(path)
	if err != nil {
		return "", nil, fmt.Errorf("PPG source unavailable; inspect the file again")
	}
	meta, err := Invoke(ctx, config, "inspect")
	if err != nil {
		return "", nil, err
	}
	after, err := os.Stat(path)
	if err != nil || before.Size() != after.Size() || !before.ModTime().Equal(after.ModTime()) {
		return "", nil, fmt.Errorf("PPG source changed during inspection; inspect again")
	}
	random := make([]byte, 16)
	if _, err = rand.Read(random); err != nil {
		return "", nil, err
	}
	id := hex.EncodeToString(random)
	records.Lock()
	defer records.Unlock()
	for key, value := range records.data {
		if time.Since(value.Created) > time.Hour {
			delete(records.data, key)
		}
	}
	if len(records.data) >= 128 {
		var oldest string
		var oldestTime time.Time
		for key, value := range records.data {
			if oldest == "" || value.Created.Before(oldestTime) {
				oldest = key
				oldestTime = value.Created
			}
		}
		delete(records.data, oldest)
	}
	records.data[id] = &entry{Config: copyMap(config), Metadata: copyMap(meta), Size: after.Size(), Modified: after.ModTime(), Created: time.Now()}
	return id, meta, nil
}

func Execute(ctx context.Context, id, action string) (map[string]any, error) {
	records.Lock()
	item := records.data[id]
	var config, meta map[string]any
	var size int64
	var modified time.Time
	if item != nil && time.Since(item.Created) <= time.Hour {
		config = copyMap(item.Config)
		meta = copyMap(item.Metadata)
		size = item.Size
		modified = item.Modified
	}
	records.Unlock()
	if config == nil {
		return nil, fmt.Errorf("PPG context expired; inspect the file again in the PPG page")
	}
	path, _ := config["path"].(string)
	info, err := os.Stat(path)
	if err != nil || info.Size() != size || !info.ModTime().Equal(modified) {
		return nil, fmt.Errorf("PPG file changed or disappeared; inspect again")
	}
	if action == "inspect" {
		delete(meta, "file_name")
		meta["selected_channel"] = config["channel"]
		meta["start_seconds"] = config["start_seconds"]
		meta["requested_duration_seconds"] = config["duration_seconds"]
		return meta, nil
	}
	if action != "analyze" {
		return nil, fmt.Errorf("action must be inspect or analyze")
	}
	result, err := Invoke(ctx, config, "analyze")
	if err != nil {
		return nil, err
	}
	after, err := os.Stat(path)
	if err != nil || after.Size() != size || !after.ModTime().Equal(modified) {
		return nil, fmt.Errorf("PPG file changed during processing; rerun inspection")
	}
	result["analysis_id"] = fmt.Sprintf("ppg-%s-%d", id, time.Now().UnixNano())
	records.Lock()
	if current := records.data[id]; current == item {
		current.Result = copyMap(result)
	}
	records.Unlock()
	// Full waves/peaks stay in local memory and are fetched by Electron after SSE.
	summary := copyMap(result)
	for _, key := range []string{"waveform", "peaks", "heart_rate", "file_name"} {
		delete(summary, key)
	}
	return summary, nil
}

func Latest(id string) (map[string]any, bool) {
	records.Lock()
	defer records.Unlock()
	item := records.data[id]
	if item == nil || item.Result == nil || time.Since(item.Created) > time.Hour {
		return nil, false
	}
	return copyMap(item.Result), true
}
func copyMap(value map[string]any) map[string]any {
	raw, _ := json.Marshal(value)
	var result map[string]any
	_ = json.Unmarshal(raw, &result)
	return result
}
