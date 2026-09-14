// Package batch runs deterministic multi-dataset queues one recording at a time.
package batch

import("context";"encoding/json";"fmt";"strings";"sync";"time";aitools "OnCallAgent/internal/server/ai/tools";"OnCallAgent/internal/server/batchstate";"OnCallAgent/internal/server/dataset";"github.com/google/uuid")

type Manager struct{Store *batchstate.Store;mu sync.Mutex;running map[string]bool}
type CreateInput struct{Name string `json:"name"`;DatasetIDs []string `json:"dataset_ids"`;Parameters aitools.NeuroAnalysisInput `json:"parameters"`;SaveOutput bool `json:"save_output"`}
func New(store *batchstate.Store)*Manager{return &Manager{Store:store,running:map[string]bool{}}}
func(m *Manager)Create(ctx context.Context,in CreateInput)(*batchstate.Job,error){if len(in.DatasetIDs)==0||len(in.DatasetIDs)>200{return nil,fmt.Errorf("batch requires 1-200 datasets")};seen:=map[string]bool{};items:=[]batchstate.Item{};for _,id:=range in.DatasetIDs{id=strings.TrimSpace(id);if seen[id]{continue};seen[id]=true;record,ok:=dataset.Get(id);if !ok{return nil,fmt.Errorf("dataset unavailable: %s",id)};item:=batchstate.Item{DatasetID:id,Name:record.Inspection.SourceName,Status:"pending"};if report:=record.Inspection.StructureReport;report!=nil{item.Subject,_=report["subject"].(string);item.Session,_=report["session"].(string);item.Run,_=report["run"].(string)};items=append(items,item)};parameters,_:=json.Marshal(in.Parameters);now:=time.Now().UTC().Format(time.RFC3339Nano);job:=&batchstate.Job{ID:uuid.NewString(),Name:strings.TrimSpace(in.Name),Status:"queued",CreatedAt:now,UpdatedAt:now,SaveOutput:in.SaveOutput,Parameters:parameters,Items:items};m.summarize(job);if err:=m.Store.Save(ctx,job);err!=nil{return nil,err};m.Start(job.ID);return job,nil}
func(m *Manager)Start(id string){m.mu.Lock();if m.running[id]{m.mu.Unlock();return};m.running[id]=true;m.mu.Unlock();go m.run(id)}
func(m *Manager)run(id string){defer func(){m.mu.Lock();delete(m.running,id);m.mu.Unlock()}();ctx:=context.Background();job,err:=m.Store.Get(ctx,id);if err!=nil||job==nil{return};job.Status="running";_ = m.Store.Save(ctx,job);for index:=range job.Items{fresh,_:=m.Store.Get(ctx,id);if fresh==nil{return};if fresh.Status=="pause_requested"{fresh.Status="paused";m.summarize(fresh);_ = m.Store.Save(ctx,fresh);return};job=fresh;item:=&job.Items[index];if item.Status=="completed"{continue};item.Status="running";item.Error="";m.summarize(job);_ = m.Store.Save(ctx,job);var input aitools.NeuroAnalysisInput;if err=json.Unmarshal(job.Parameters,&input);err==nil{input.DatasetID=item.DatasetID;runCtx,cancel:=context.WithTimeout(ctx,15*time.Minute);var output any;output,err=aitools.ExecuteNeuroAnalysis(runCtx,input,job.SaveOutput);cancel();if err==nil{item.Status="completed";item.Output,_=json.Marshal(output)}else{item.Status="failed";item.Error=err.Error()}}else{item.Status="failed";item.Error=err.Error()};m.summarize(job);_ = m.Store.Save(ctx,job)};job.Status="completed";for _,item:=range job.Items{if item.Status=="failed"{job.Status="completed_with_errors";break}};m.summarize(job);_ = m.Store.Save(ctx,job)}
func(m *Manager)summarize(job *batchstate.Job){
	job.Summary=map[string]int{"total":len(job.Items)}
	var beforeTotal,afterTotal float64
	qualityCount:=0
	failureReasons:=map[string]int{}
	for _,item:=range job.Items{
		job.Summary[item.Status]++
		if item.Error!=""{failureReasons[item.Error]++}
		var output map[string]any
		if len(item.Output)>0&&json.Unmarshal(item.Output,&output)==nil{
			result,_:=output["result"].(map[string]any)
			comparison,_:=result["quality_comparison"].(map[string]any)
			before,_:=comparison["before"].(map[string]any)
			after,_:=comparison["after"].(map[string]any)
			beforeScore,beforeOK:=before["score"].(float64)
			afterScore,afterOK:=after["score"].(float64)
			if beforeOK&&afterOK{beforeTotal+=beforeScore;afterTotal+=afterScore;qualityCount++}
		}
	}
	job.Metrics=map[string]any{"quality_count":qualityCount,"failure_reasons":failureReasons}
	if qualityCount>0{job.Metrics["mean_quality_before"]=beforeTotal/float64(qualityCount);job.Metrics["mean_quality_after"]=afterTotal/float64(qualityCount);job.Metrics["mean_quality_delta"]=(afterTotal-beforeTotal)/float64(qualityCount)}
}
func(m *Manager)Pause(ctx context.Context,id string)(*batchstate.Job,error){job,err:=m.Store.Get(ctx,id);if err!=nil||job==nil{return job,err};if job.Status=="running"||job.Status=="queued"{job.Status="pause_requested";err=m.Store.Save(ctx,job)};return job,err}
func(m *Manager)Resume(ctx context.Context,id string,retryFailed bool)(*batchstate.Job,error){job,err:=m.Store.Get(ctx,id);if err!=nil||job==nil{return job,err};if retryFailed{for i:=range job.Items{if job.Items[i].Status=="failed"||job.Items[i].Status=="interrupted"{job.Items[i].Status="pending";job.Items[i].Error=""}}};job.Status="queued";m.summarize(job);if err=m.Store.Save(ctx,job);err==nil{m.Start(id)};return job,err}
