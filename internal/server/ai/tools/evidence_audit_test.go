package tools

import "testing"

func TestEvidenceAuditRejectsInventedIDAndMeasuresCoverage(t *testing.T){
	result,err:=AuditKnowledgeEvidence(EvidenceAuditInput{Claims:[]EvidenceClaim{{Claim:"filtering requires review",KnowledgeIDs:[]string{"MNE-EEG-001"}},{Claim:"invented",KnowledgeIDs:[]string{"NOT-REAL-999"}}}})
	if err!=nil{t.Fatal(err)}
	if result.Covered!=1||result.Total!=2||result.Coverage!=.5||result.Passed{t.Fatalf("unexpected audit: %+v",result)}
}
