package handler

import (
	"OnCallAgent/internal/server/ai/toolinput"
	"github.com/gin-gonic/gin"
	"net/http/httptest"
	"testing"
)

func TestWorkspaceRequestDoesNotInheritDataset(t *testing.T) {
	for _, page := range []string{"ppg", "help", "sessions", "meg"} {
		ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
		ctx.Request = httptest.NewRequest("POST", "/chatStream", nil)
		request := ChatRequest{Workspace: page, DatasetID: "old-eeg", PPGID: "selected-ppg"}
		if page == "meg" {
			request.DatasetID = ""
		}
		if !applyWorkspace(ctx, request) {
			t.Fatalf("page %s rejected", page)
		}
		scope, ok := toolinput.CurrentWorkspace(ctx.Request.Context())
		if !ok || scope.DatasetID != "" {
			t.Fatal("old dataset leaked", scope)
		}
		if page != "ppg" && scope.PPGID != "" {
			t.Fatal("PPG selection leaked", scope)
		}
	}
	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	ctx.Request = httptest.NewRequest("POST", "/chat", nil)
	if applyWorkspace(ctx, ChatRequest{Workspace: "eeg", DatasetID: "nonexistent"}) {
		t.Fatal("missing dataset accepted")
	}
}
