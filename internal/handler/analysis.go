package handler

import (
	aitools "OnCallAgent/internal/server/ai/tools"
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// analyzeDatasetRequest 是工作台允许用户控制的确定性参数。
// dataset_id 来自 URL，避免渲染进程在请求体中替换分析对象。
type analyzeDatasetRequest struct {
	AnalysisType string  `json:"analysis_type"`
	StartSeconds float64 `json:"start_seconds"`
	EndSeconds   float64 `json:"end_seconds"`
	LeftChannel  string  `json:"left_channel"`
	RightChannel string  `json:"right_channel"`
	HighpassHz   float64 `json:"highpass_hz"`
	LowpassHz    float64 `json:"lowpass_hz"`
	NotchHz      float64 `json:"notch_hz"`
	SaveOutput   *bool   `json:"save_output"`
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
