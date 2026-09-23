package toolinput

import (
	"context"
	"github.com/cloudwego/eino/schema"
	"testing"
)

func TestPolicyAndEvidenceAreRequestScoped(t *testing.T) {
	quick := WithResponseMode(context.Background(), "quick")
	deep := WithResponseMode(context.Background(), "deep")
	if CurrentResponsePolicy(quick).MaxGraphSteps != 12 || CurrentResponsePolicy(deep).MaxGraphSteps != 30 || Policy("unknown").Mode != "quick" {
		t.Fatal("policy mismatch")
	}
	trace := &Trace{}
	ctx := WithTrace(deep, trace)
	RecordKnowledge(ctx, []*schema.Document{nil, {Content: "# MNE-EEG-001 Title\nSee OTHER-EEG-999"}, {Content: "MNE-EEG-001 duplicate"}, {Content: "no valid title"}})
	first := trace.Snapshot()
	if len(first) != 1 || len(first[0].KnowledgeIDs) != 1 || first[0].KnowledgeIDs[0] != "MNE-EEG-001" {
		t.Fatalf("invalid evidence IDs: %+v", first)
	}
	first[0].KnowledgeIDs[0] = "mutated"
	if trace.Snapshot()[0].KnowledgeIDs[0] == "mutated" {
		t.Fatal("mutable snapshot leaked")
	}
}
