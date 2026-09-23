package handler

import (
	aitools "OnCallAgent/internal/server/ai/tools"
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// StageSleepDataset lets the specialist Electron page invoke the exact same
// validated execution boundary used by the ReAct function call. The endpoint
// returns candidates, never silently writes them into the source recording.
func StageSleepDataset() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		analysisCtx, cancel := context.WithTimeout(ctx.Request.Context(), 10*time.Minute)
		defer cancel()
		result, err := aitools.ExecuteSleepStaging(analysisCtx, ctx.Param("id"))
		if err != nil {
			ctx.JSON(http.StatusUnprocessableEntity, gin.H{"code": "SLEEP_STAGING_FAILED", "message": err.Error()})
			return
		}
		ctx.JSON(http.StatusOK, result)
	}
}

// LatestSleepStages transfers the full local result to Electron after an Agent
// function call. The large epoch list is intentionally kept out of LLM context.
func LatestSleepStages() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		result, ok := aitools.LatestSleepStages(ctx.Param("id"))
		if !ok {
			ctx.JSON(http.StatusNotFound, gin.H{"code": "SLEEP_STAGING_NOT_FOUND", "message": "该数据集还没有自动分期候选结果"})
			return
		}
		ctx.JSON(http.StatusOK, result)
	}
}
