package chatServer

import (
	"OnCallAgent/internal/server/ai/toolinput"
	"strings"
	"testing"
)

func TestPlanTurnRequiresDatasetForExecution(t *testing.T) {
	plan := planTurn("请帮我进行 EEG 预处理", "")
	if !plan.RequiresVerification || !strings.Contains(plan.Text, "未绑定 dataset_id") {
		t.Fatalf("unexpected plan: %+v", plan)
	}
	question := planTurn("什么是 ICA？", "")
	if question.RequiresVerification {
		t.Fatalf("method question should not wait for execution review: %+v", question)
	}
}

func TestReflectTurnChecksRealExecution(t *testing.T) {
	claim := "已完成预处理，并已保存预处理文件。"
	if got := reflectTurn(claim, nil); got == claim {
		t.Fatal("unsupported execution claim must not pass")
	}
	unsaved := []toolinput.ToolResult{{Name: "run_neuro_analysis", Succeeded: true, Saved: false}}
	if got := reflectTurn(claim, unsaved); got == claim || !strings.Contains(got, "不能证明") {
		t.Fatalf("unsaved output must not be described as saved: %q", got)
	}
	saved := []toolinput.ToolResult{{Name: "run_neuro_analysis", Succeeded: true, Saved: true}}
	if got := reflectTurn(claim, saved); got != claim {
		t.Fatalf("verified claim should pass: %q", got)
	}
}

func TestReflectTurnDoesNotTreatSkippedAsCompleted(t *testing.T) {
	answer := "所有步骤均已完成。"
	trace := []toolinput.ToolResult{{Name: "run_neuro_analysis", Succeeded: true,
		Steps: map[string]string{"filter": "completed", "ica": "skipped"}}}
	if got := reflectTurn(answer, trace); !strings.Contains(got, "skipped") {
		t.Fatalf("skipped step should be disclosed: %q", got)
	}
}

func TestReflectTurnComparesQualityScores(t *testing.T) {
	before, after := 80.0, 72.0
	trace := []toolinput.ToolResult{{Name: "run_neuro_analysis", Succeeded: true, BeforeScore: &before, AfterScore: &after}}
	if got := reflectTurn("质量已改善", trace); !strings.Contains(got, "并未提高") {
		t.Fatalf("unsupported quality improvement must be corrected: %q", got)
	}
}

func TestReflectTurnUsesAnswerLanguage(t *testing.T) {
	got := reflectTurn("Preprocessing completed", nil)
	if !strings.Contains(got, "No successful analysis tool call") {
		t.Fatalf("English answer should receive English verification: %q", got)
	}
}

func TestReflectTurnRejectsInventedKnowledgeCitation(t *testing.T) {
	answer := "依据[FAKE-EEG-999](https://example.com/fake)建议滤波。"
	if got := reflectTurn(answer, nil); !strings.Contains(got, "未通过") {
		t.Fatalf("invented knowledge ID must not pass review: %q", got)
	}
}

func TestDiagnosisCannotProvePreprocessing(t *testing.T) {
	for _, kind := range []string{"summary", "quality"} {
		trace := []toolinput.ToolResult{{Name: "run_neuro_analysis", AnalysisType: kind, Succeeded: true}}
		if reflectTurn("已完成预处理", trace) == "已完成预处理" {
			t.Fatal("diagnostic counted as preprocessing")
		}
		if got := reflectTurn("已取得质量诊断结果。", trace); got != "已取得质量诊断结果。" {
			t.Fatal("valid diagnostic result blocked")
		}
	}
}
