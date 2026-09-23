package toolinput

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestComponentContextValidation(t *testing.T) {
	good := UIContext{Version: 1, Page: "eeg", DatasetID: "d1", FocusedComponentID: "signal", Components: []UIComponent{{ID: "signal", Title: "Signal", State: map[string]any{"start_seconds": 30}}}}
	raw, _ := json.Marshal(good)
	value, err := ParseUIContext(raw, "eeg", "d1")
	if err != nil || value.FocusedComponentID != "signal" {
		t.Fatal(value, err)
	}
	if _, err := ParseUIContext(raw, "meg", "d1"); err == nil {
		t.Fatal("accepted another page")
	}
	if _, err := ParseUIContext(raw, "eeg", "d2"); err == nil {
		t.Fatal("accepted another dataset")
	}
	bad := good
	bad.Components = append(bad.Components, good.Components[0])
	raw, _ = json.Marshal(bad)
	if _, err := ParseUIContext(raw, "eeg", "d1"); err == nil {
		t.Fatal("accepted duplicate IDs")
	}
	bad = good
	bad.FocusedComponentID = "not-present"
	raw, _ = json.Marshal(bad)
	if _, err := ParseUIContext(raw, "eeg", "d1"); err == nil {
		t.Fatal("accepted unavailable focus")
	}
	if _, err := ParseUIContext(json.RawMessage(strings.Repeat(" ", 32769)), "eeg", "d1"); err == nil {
		t.Fatal("accepted oversized snapshot")
	}
}
