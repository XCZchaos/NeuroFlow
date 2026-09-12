package model

import "testing"

func TestModelAllowsTemperature(t *testing.T) {
	tests := []struct {
		model string
		want  bool
	}{
		{model: "gpt-5.6-sol", want: false},
		{model: "GPT-5", want: false},
		{model: "o3-mini", want: false},
		{model: "gpt-4o-mini", want: true},
	}
	for _, test := range tests {
		if got := modelAllowsTemperature(test.model); got != test.want {
			t.Fatalf("modelAllowsTemperature(%q) = %v, want %v", test.model, got, test.want)
		}
	}
}
