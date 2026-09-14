package handler

import (
	aitools "OnCallAgent/internal/server/ai/tools"
	"OnCallAgent/internal/server/analysisprogress"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// analyzeDatasetRequest 是工作台允许用户控制的确定性参数。
// dataset_id 来自 URL，避免渲染进程在请求体中替换分析对象。
type analyzeDatasetRequest struct {
	AnalysisType       string   `json:"analysis_type"`
	StartSeconds       float64  `json:"start_seconds"`
	EndSeconds         float64  `json:"end_seconds"`
	LeftChannel        string   `json:"left_channel"`
	RightChannel       string   `json:"right_channel"`
	HighpassHz         float64  `json:"highpass_hz"`
	LowpassHz          float64  `json:"lowpass_hz"`
	NotchHz            float64  `json:"notch_hz"`
	ResampleHz         float64  `json:"resample_hz"`
	EpochTMin          float64  `json:"epoch_tmin"`
	EpochTMax          float64  `json:"epoch_tmax"`
	BaselineStart      float64  `json:"baseline_start"`
	BaselineEnd        float64  `json:"baseline_end"`
	EpochRejectUV      float64  `json:"epoch_reject_uv"`
	SSSMode            string   `json:"sss_mode"`
	STDuration         float64  `json:"st_duration"`
	EmptyRoomDatasetID string   `json:"empty_room_dataset_id"`
	EnabledSteps       []string `json:"enabled_steps"`
	SaveOutput         *bool    `json:"save_output"`
}

// AnalysisEvents keeps one lightweight SSE connection per open dataset view.
// Last-Event-ID allows Electron to reconnect without losing buffered steps.
func AnalysisEvents() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		after, _ := strconv.ParseInt(ctx.GetHeader("Last-Event-ID"), 10, 64)
		if query, err := strconv.ParseInt(ctx.Query("after"), 10, 64); err == nil && query > after {
			after = query
		}
		ch, backlog, unsubscribe := analysisprogress.Subscribe(ctx.Param("id"), after)
		defer unsubscribe()
		ctx.Header("Content-Type", "text/event-stream")
		ctx.Header("Cache-Control", "no-cache")
		ctx.Header("X-Accel-Buffering", "no")
		write := func(event analysisprogress.Event) bool {
			payload, _ := json.Marshal(event)
			_, err := fmt.Fprintf(ctx.Writer, "id: %d\nevent: progress\ndata: %s\n\n", event.Sequence, payload)
			ctx.Writer.Flush()
			return err == nil
		}
		for _, event := range backlog {
			if !write(event) {
				return
			}
		}
		ticker := time.NewTicker(15 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case event := <-ch:
				if !write(event) {
					return
				}
			case <-ticker.C:
				_, _ = ctx.Writer.Write([]byte(": keepalive\n\n"))
				ctx.Writer.Flush()
			case <-ctx.Request.Context().Done():
				return
			}
		}
	}
}

// AnalyzeDataset 让 Electron 的“运行流程”和 Agent function call 共用同一个执行层。
// Python 返回的是抽稀后的绘图数据；完整预处理信号写入 outputs 下的 FIF 文件。
func AnalyzeDataset() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var request analyzeDatasetRequest
		if err := ctx.ShouldBindJSON(&request); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"code": "INVALID_REQUEST", "message": "分析参数不是有效 JSON"})
			return
		}
		analysisCtx, cancel := context.WithTimeout(ctx.Request.Context(), 5*time.Minute)
		defer cancel()
		saveOutput := true
		if request.SaveOutput != nil {
			saveOutput = *request.SaveOutput
		}
		result, err := aitools.ExecuteNeuroAnalysis(analysisCtx, aitools.NeuroAnalysisInput{
			DatasetID: ctx.Param("id"), AnalysisType: request.AnalysisType,
			StartSeconds: request.StartSeconds, EndSeconds: request.EndSeconds,
			LeftChannel: request.LeftChannel, RightChannel: request.RightChannel,
			HighpassHz: request.HighpassHz, LowpassHz: request.LowpassHz, NotchHz: request.NotchHz,
			ResampleHz: request.ResampleHz, EpochTMin: request.EpochTMin, EpochTMax: request.EpochTMax,
			BaselineStart: request.BaselineStart, BaselineEnd: request.BaselineEnd,
			EpochRejectUV: request.EpochRejectUV,
			SSSMode:       request.SSSMode, STDuration: request.STDuration,
			EmptyRoomDatasetID: request.EmptyRoomDatasetID,
			EnabledSteps:       request.EnabledSteps,
		}, saveOutput)
		if err != nil {
			ctx.JSON(http.StatusUnprocessableEntity, gin.H{"code": "ANALYSIS_FAILED", "message": err.Error()})
			return
		}
		ctx.JSON(http.StatusOK, result)
	}
}

// LatestDatasetAnalysis 供 Electron 获取 Agent 最近完成的真实波形。
// 该接口只在本机后端使用，不会把 preview 注入大模型上下文。
func LatestDatasetAnalysis() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		result, ok := aitools.LatestNeuroAnalysis(ctx.Param("id"))
		if !ok {
			ctx.JSON(http.StatusNotFound, gin.H{"code": "ANALYSIS_NOT_FOUND", "message": "该数据集还没有成功的分析结果"})
			return
		}
		ctx.JSON(http.StatusOK, result)
	}
}

func DatasetDerivatives() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		result, ok := aitools.AnalysisArtifacts(ctx.Param("id"))
		if !ok {
			ctx.JSON(http.StatusNotFound, gin.H{"code": "DERIVATIVES_NOT_FOUND", "message": "该数据集还没有分析产物"})
			return
		}
		ctx.JSON(http.StatusOK, result)
	}
}
