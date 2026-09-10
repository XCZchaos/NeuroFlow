package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestNeuroPreprocessingDraft(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/agent/preprocessing/draft", NeuroPreprocessingDraft())

	request := httptest.NewRequest(http.MethodPost, "/agent/preprocessing/draft", strings.NewReader(`{
		"modality":"EEG",
		"goal":"运动想象分析",
		"sampling_rate":1000,
		"line_frequency":50
	}`))
	request.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("unexpected status %d: %s", recorder.Code, recorder.Body.String())
	}
	var response struct {
		Data struct {
			Status     string `json:"status"`
			Modality   string `json:"modality"`
			Executable bool   `json:"executable"`
			Steps      []struct {
				Tool string `json:"tool"`
			} `json:"steps"`
		} `json:"data"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if response.Data.Status != "draft_not_executed" || response.Data.Modality != "EEG" || response.Data.Executable {
		t.Fatalf("unexpected response: %+v", response.Data)
	}
	if len(response.Data.Steps) == 0 || response.Data.Steps[0].Tool != "inspect_dataset" {
		t.Fatalf("unexpected steps: %+v", response.Data.Steps)
	}
}

func TestNeuroPreprocessingDraftRejectsUnsupportedModality(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/agent/preprocessing/draft", NeuroPreprocessingDraft())

	request := httptest.NewRequest(http.MethodPost, "/agent/preprocessing/draft", strings.NewReader(`{"modality":"MRI","goal":"test"}`))
	request.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusUnprocessableEntity {
		t.Fatalf("unexpected status %d: %s", recorder.Code, recorder.Body.String())
	}
}
