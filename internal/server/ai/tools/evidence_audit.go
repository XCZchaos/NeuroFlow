package tools

import (
	"context"
	"fmt"
	"strings"

	"OnCallAgent/internal/server/knowledgecatalog"
	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/components/tool/utils"
)

type EvidenceClaim struct { Claim string `json:"claim"`; KnowledgeIDs []string `json:"knowledge_ids"` }
type EvidenceAuditInput struct { Claims []EvidenceClaim `json:"claims" jsonschema:"description=需要证据支持的实质性结论及其本地知识 ID"` }
type EvidenceClaimResult struct { Claim string `json:"claim"`; ValidIDs, InvalidIDs []string `json:"valid_ids,omitempty"`; MissingSource []string `json:"missing_source,omitempty"`; Covered bool `json:"covered"` }
type EvidenceAuditResult struct { Coverage float64 `json:"coverage"`; Covered, Total int `json:"covered_claims"`; Claims []EvidenceClaimResult `json:"claims"`; Passed bool `json:"passed"` }

func AuditKnowledgeEvidence(input EvidenceAuditInput) (EvidenceAuditResult,error) {
	entries,err:=knowledgecatalog.Load();if err!=nil{return EvidenceAuditResult{},err};result:=EvidenceAuditResult{Total:len(input.Claims)}
	for _,claim:=range input.Claims { item:=EvidenceClaimResult{Claim:strings.TrimSpace(claim.Claim)};for _,id:=range claim.KnowledgeIDs { entry,ok:=entries[strings.TrimSpace(id)];if !ok { item.InvalidIDs=append(item.InvalidIDs,id) } else if entry.SourceURL=="" { item.MissingSource=append(item.MissingSource,id) } else { item.ValidIDs=append(item.ValidIDs,id) } };item.Covered=item.Claim!=""&&len(item.ValidIDs)>0;if item.Covered{result.Covered++};result.Claims=append(result.Claims,item) }
	if result.Total>0 { result.Coverage=float64(result.Covered)/float64(result.Total) };result.Passed=result.Total>0&&result.Covered==result.Total;return result,nil
}

func KnowledgeEvidenceAuditTool()(tool.InvokableTool,error){return utils.InferTool("audit_knowledge_evidence","在输出复杂专家结论前，核对每条实质性结论引用的本地知识 ID 是否真实存在且带官方来源，并返回引用覆盖率。coverage 不足 1 时必须补检索或明确证据不足。",func(_ context.Context,input EvidenceAuditInput)(EvidenceAuditResult,error){if len(input.Claims)==0{return EvidenceAuditResult{},fmt.Errorf("claims cannot be empty")};return AuditKnowledgeEvidence(input)})}
