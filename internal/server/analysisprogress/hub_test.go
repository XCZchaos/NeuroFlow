package analysisprogress

import "testing"

func TestPublishSubscribeBacklogAndUnsubscribe(t *testing.T) {
	Publish("dataset-test", "read", "completed", "ok", 1)
	ch, backlog, stop := Subscribe("dataset-test", 0)
	if len(backlog) != 1 || backlog[0].Step != "read" {
		t.Fatalf("missing backlog: %+v", backlog)
	}
	Publish("dataset-test", "filter", "running", "", 2)
	if event := <-ch; event.Step != "filter" || event.Attempt != 2 {
		t.Fatalf("wrong live event: %+v", event)
	}
	stop()
}
