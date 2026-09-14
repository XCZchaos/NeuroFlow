package batchstate

import (
	"context"
	"database/sql"
	"testing"

	_ "modernc.org/sqlite"
)

func TestInitRecoversRunningBatch(t *testing.T) {
	db, err := sql.Open("sqlite", "file::memory:?cache=shared")
	if err != nil { t.Fatal(err) }
	defer db.Close()
	store := &Store{DB: db}
	ctx := context.Background()
	if err = store.Init(ctx); err != nil { t.Fatal(err) }
	job := &Job{ID: "batch-1", Name: "study", Status: "running", CreatedAt: "2026-09-14T00:00:00Z", Items: []Item{{DatasetID: "d1", Status: "running"}}, Summary: map[string]int{"total": 1}}
	if err = store.Save(ctx, job); err != nil { t.Fatal(err) }
	if err = store.Init(ctx); err != nil { t.Fatal(err) }
	recovered, err := store.Get(ctx, job.ID)
	if err != nil { t.Fatal(err) }
	if recovered.Status != "interrupted" || recovered.Items[0].Status != "interrupted" { t.Fatalf("unexpected recovery: %#v", recovered) }
}
