package handler

import (
	"net/http"

	aitools "OnCallAgent/internal/server/ai/tools"
	"OnCallAgent/internal/server/knowledgecatalog"
	"github.com/gin-gonic/gin"
)

// KnowledgeCatalog exposes the local evidence inventory so the desktop client
// can show whether an answer is backed by a traceable, reviewed source.
func KnowledgeCatalog() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		entries, err := knowledgecatalog.Load()
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
			return
		}
		summary := gin.H{"total": len(entries), "with_source": 0, "with_version": 0, "reviewed": 0}
		for _, entry := range entries {
			if entry.SourceURL != "" { summary["with_source"] = summary["with_source"].(int) + 1 }
			if entry.SourceVersion != "" { summary["with_version"] = summary["with_version"].(int) + 1 }
			if entry.ReviewedAt != "" { summary["reviewed"] = summary["reviewed"].(int) + 1 }
		}
		ctx.JSON(http.StatusOK, gin.H{"summary": summary, "schema": "docs/knowledge/SCHEMA.md"})
	}
}

// AuditKnowledgeEvidence checks every claim against stable local knowledge IDs.
func AuditKnowledgeEvidence() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var input aitools.EvidenceAuditInput
		if err := ctx.ShouldBindJSON(&input); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		result, err := aitools.AuditKnowledgeEvidence(input)
		if err != nil { ctx.JSON(http.StatusUnprocessableEntity, gin.H{"message": err.Error()}); return }
		ctx.JSON(http.StatusOK, result)
	}
}
