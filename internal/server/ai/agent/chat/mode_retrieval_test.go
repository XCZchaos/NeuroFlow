package chat

import (
	"OnCallAgent/internal/server/ai/toolinput"
	"context"
	"errors"
	"fmt"
	"github.com/cloudwego/eino/components/retriever"
	"github.com/cloudwego/eino/schema"
	"strings"
	"testing"
)

type recordingRetriever struct {
	queries []string
	limits  []int
	fail    bool
}

func (r *recordingRetriever) Retrieve(ctx context.Context, q string, opts ...retriever.Option) ([]*schema.Document, error) {
	if ctx.Err() != nil {
		return nil, ctx.Err()
	}
	r.queries = append(r.queries, q)
	r.limits = append(r.limits, *retriever.GetCommonOptions(nil, opts...).TopK)
	if r.fail {
		return nil, errors.New("offline")
	}
	docs := []*schema.Document{}
	for i := 0; i < 5; i++ {
		id := fmt.Sprintf("MNE-EEG-%03d", (len(r.queries)-1)*3+i+1)
		docs = append(docs, &schema.Document{ID: id, Content: "# " + id + " Evidence\n" + strings.Repeat("a", 4200)})
	}
	return docs, nil
}

func TestModesApplyDifferentEvidenceWorkflows(t *testing.T) {
	for _, mode := range []string{"quick", "deep"} {
		t.Run(mode, func(t *testing.T) {
			r := &recordingRetriever{}
			trace := &toolinput.Trace{}
			ctx := toolinput.WithTrace(context.Background(), trace)
			out, err := modeRetrieval(r)(ctx, &UserMessage{Query: "EEG filtering prerequisites", ResponseMode: mode})
			if err != nil {
				t.Fatal(err)
			}
			policy := toolinput.Policy(mode)
			if len(r.queries) != policy.Searches {
				t.Fatalf("searches: %v", r.queries)
			}
			for _, k := range r.limits {
				if k != policy.TopK {
					t.Fatalf("topK=%d", k)
				}
			}
			docs := out["documents"].([]*schema.Document)
			if len(docs) != policy.MaxDocuments {
				t.Fatalf("dedup/budget: %d", len(docs))
			}
			if len([]rune(docs[0].Content)) > 4050 {
				t.Fatal("oversized evidence")
			}
			if len(trace.Snapshot()) != 1 || len(trace.Snapshot()[0].KnowledgeIDs) != len(docs) {
				t.Fatal("actual evidence not recorded")
			}
			if mode == "deep" && r.queries[0] == r.queries[1] {
				t.Fatal("second search did not change focus")
			}
		})
	}
}

func TestSimpleQuestionIgnoresAttachedScientificContext(t *testing.T) {
	r := &recordingRetriever{}
	ctx := toolinput.WithIntentText(context.Background(), "这个文件多少通道？")
	out, err := modeRetrieval(r)(ctx, &UserMessage{Query: "[EEG preprocessing filter metadata] 这个文件多少通道？", ResponseMode: "deep"})
	if err != nil || len(r.queries) != 0 || len(out["documents"].([]*schema.Document)) != 0 {
		t.Fatalf("light route failed: %v %v", r.queries, err)
	}
	for _, query := range []string{"What sampling rate should I choose?", "采样率是多少，如何滤波？", "EEG preprocessing", "这个单位如何换算？"} {
		if lightweightQuestion(query, false) {
			t.Fatalf("scientific question bypassed retrieval: %s", query)
		}
	}
}

func TestEvidenceFailureAndCancellation(t *testing.T) {
	r := &recordingRetriever{fail: true}
	out, err := modeRetrieval(r)(context.Background(), &UserMessage{Query: "EEG filtering", ResponseMode: "deep"})
	if err != nil || !strings.Contains(out["evidence_status"].(string), "失败") || len(out["documents"].([]*schema.Document)) != 0 {
		t.Fatalf("failure hidden: %+v %v", out, err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	_, err = modeRetrieval(r)(ctx, &UserMessage{Query: "EEG filtering", ResponseMode: "deep"})
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("cancel ignored: %v", err)
	}
}
