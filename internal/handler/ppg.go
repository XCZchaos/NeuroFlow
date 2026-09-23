package handler

import (
	"OnCallAgent/internal/server/ppg"
	"github.com/gin-gonic/gin"
	"net/http"
)

// Desktop and Agent use the same read-only PPG service. Preparing a context
// freezes the selected local configuration; no raw path is sent to the model.
func ProcessPPG(operation string) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input map[string]any
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 64*1024)
		if err := c.ShouldBindJSON(&input); err != nil || input == nil {
			c.JSON(400, gin.H{"ok": false, "message": "Invalid PPG configuration"})
			return
		}
		if operation == "prepare" {
			id, meta, err := ppg.Prepare(c.Request.Context(), input)
			if err != nil {
				c.JSON(422, gin.H{"ok": false, "message": err.Error()})
				return
			}
			c.JSON(200, gin.H{"ok": true, "ppg_id": id, "metadata": meta})
			return
		}
		result, err := ppg.Invoke(c.Request.Context(), input, operation)
		if err != nil {
			c.JSON(422, gin.H{"ok": false, "message": err.Error()})
			return
		}
		c.JSON(200, result)
	}
}
func LatestPPG() gin.HandlerFunc {
	return func(c *gin.Context) {
		result, ok := ppg.Latest(c.Param("id"))
		if !ok {
			c.JSON(404, gin.H{"message": "No new PPG result"})
			return
		}
		c.JSON(200, result)
	}
}
