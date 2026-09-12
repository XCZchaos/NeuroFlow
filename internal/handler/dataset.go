package handler

import (
	aitools "OnCallAgent/internal/server/ai/tools"
	"OnCallAgent/internal/server/dataset"
	"context"
	"errors"
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
	"time"
)

type registerDatasetRequest struct {
	// Path 由 Electron 主进程的系统文件选择框产生，不是上传后的临时文件名。
	Path string `json:"path" binding:"required"`
}

// SignalWindow 按需读取单通道时间窗。source=processed 需要最近一次分析已保存 FIF；
// 不保存模式仍可查看分析响应中的整体抽稀预览，但不能从已结束的 Python 进程重读完整结果。
func SignalWindow() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		path, inspection, ok := dataset.ResolveLocalPath(ctx.Param("id"))
		if !ok {
			ctx.JSON(http.StatusNotFound, gin.H{"code": "DATASET_NOT_FOUND", "message": "数据集不存在或后端已重启"})
			return
		}
		if ctx.Query("source") == "processed" {
			var found bool
			path, found = aitools.LatestAnalysisOutputPath(ctx.Param("id"))
			if !found {
				ctx.JSON(http.StatusUnprocessableEntity, gin.H{"code": "PROCESSED_FILE_UNAVAILABLE", "message": "完整处理后浏览需要保存预处理文件"})
				return
			}
		}
		start, _ := strconv.ParseFloat(ctx.DefaultQuery("start", "0"), 64)
		duration, _ := strconv.ParseFloat(ctx.DefaultQuery("duration", "10"), 64)
		readCtx, cancel := context.WithTimeout(ctx.Request.Context(), 45*time.Second)
		defer cancel()
		preview, err := dataset.ReadSignalWindow(readCtx, path, inspection.Modality, ctx.Query("channel"), start, duration)
		if err != nil {
			ctx.JSON(http.StatusUnprocessableEntity, gin.H{"code": "SIGNAL_WINDOW_FAILED", "message": err.Error()})
			return
		}
		ctx.JSON(http.StatusOK, preview)
	}
}

// RegisterDataset 把“选择本地文件”转换成“获得 dataset_id 和真实元数据”。
func RegisterDataset() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var request registerDatasetRequest
		if err := ctx.ShouldBindJSON(&request); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"code": "INVALID_REQUEST", "message": "path 是必填字段"})
			return
		}
		// 防止损坏文件或第三方读取器长期占用请求。
		inspectCtx, cancel := context.WithTimeout(ctx.Request.Context(), 30*time.Second)
		defer cancel()
		record, err := dataset.Register(inspectCtx, request.Path)
		if err != nil {
			var inspectErr *dataset.InspectError
			// 文件不存在、格式不支持、配套文件缺失等属于可修正输入问题，返回 422。
			if errors.As(err, &inspectErr) {
				ctx.JSON(http.StatusUnprocessableEntity, inspectErr.Inspection)
				return
			}
			ctx.JSON(http.StatusBadGateway, gin.H{"code": "INSPECTION_FAILED", "message": err.Error()})
			return
		}
		ctx.JSON(http.StatusOK, record)
	}
}
func GetDataset() gin.HandlerFunc {
	// 此接口用于界面刷新或调试；它同样不会返回 Record 内部保存的本地路径。
	return func(ctx *gin.Context) {
		record, ok := dataset.Get(ctx.Param("id"))
		if !ok {
			ctx.JSON(http.StatusNotFound, gin.H{"code": "DATASET_NOT_FOUND", "message": "数据集不存在或后端已重启"})
			return
		}
		ctx.JSON(http.StatusOK, record)
	}
}

// PreviewDataset 返回最多 10 秒、8 通道的真实原始波形。这里只读数据，
// 不执行滤波，也不会修改源文件或把波形送进大模型。
func PreviewDataset() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		previewCtx, cancel := context.WithTimeout(ctx.Request.Context(), 45*time.Second)
		defer cancel()
		preview, err := dataset.Preview(previewCtx, ctx.Param("id"), 10)
		if err != nil {
			ctx.JSON(http.StatusUnprocessableEntity, gin.H{"code": "PREVIEW_FAILED", "message": err.Error()})
			return
		}
		ctx.JSON(http.StatusOK, preview)
	}
}
