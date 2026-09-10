package handler

import (
	"OnCallAgent/internal/server/dataset"
	"context"
	"errors"
	"github.com/gin-gonic/gin"
	"net/http"
	"time"
)

type registerDatasetRequest struct {
	// Path 由 Electron 主进程的系统文件选择框产生，不是上传后的临时文件名。
	Path string `json:"path" binding:"required"`
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
