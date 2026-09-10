package handler

import (
	"OnCallAgent/internal/server/ai/tools"
	"net/http"

	"github.com/gin-gonic/gin"
)

type NeuroPlanRequest struct {
	Modality      string  `json:"modality" binding:"required"`
	Goal          string  `json:"goal" binding:"required"`
	SamplingRate  float64 `json:"sampling_rate,omitempty"`
	LineFrequency float64 `json:"line_frequency,omitempty"`
}

func NeuroPreprocessingDraft() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var request NeuroPlanRequest
		if err := ctx.ShouldBindJSON(&request); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"code":    "INVALID_REQUEST",
				"message": "modality 和 goal 是必填字段",
			})
			return
		}

		plan, err := tools.BuildNeuroPreprocessingDraft(tools.NeuroPlanInput{
			Modality:      request.Modality,
			Goal:          request.Goal,
			SamplingRate:  request.SamplingRate,
			LineFrequency: request.LineFrequency,
		})
		if err != nil {
			ctx.JSON(http.StatusUnprocessableEntity, gin.H{
				"code":    "INVALID_PLAN_INPUT",
				"message": err.Error(),
			})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"data": plan})
	}
}
