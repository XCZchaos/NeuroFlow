const {app,BrowserWindow}=require('electron');
const path=require('node:path');
app.setPath('userData',path.join(__dirname,'../../.cache/agent-lifecycle-electron'));
app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1600,height:1000,webPreferences:{contextIsolation:true,nodeIntegration:false,offscreen:true,backgroundThrottling:false}});
 try{
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));
  const result=await win.webContents.executeJavaScript(String.raw`(async()=>{
   const assert=(condition,message)=>{if(!condition)throw Error(message);};
   const until=async(predicate)=>{for(let i=0;i<150&&!predicate();i++)await new Promise(r=>setTimeout(r,20));assert(predicate(),'Timed out waiting for request');};
   const fails=async(task)=>{let error;try{await task;}catch(value){error=value;}assert(error,'Request unexpectedly succeeded');return error;};
   const json=(data,status=200)=>({ok:status<400,status,json:async()=>data});
   const completed=()=>new Response('event: message\ndata: Test answer\n\nevent: done\ndata: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream'}});
   const panel=()=>document.querySelector('#messages').lastElementChild.querySelector('.agent-execution');
   const originalFetch=window.fetch;
   const file={datasetId:'lifecycle-test',path:'C:/test/record.edf',name:'record.edf',mode:'EEG',size:0};
   state.backend='backend';setView('eeg');state.current=file;state.analysis=null;
   try{
    // 网络故障不能被当成“ID 不存在”进而重复注册；只有 404 才允许恢复注册。
    let registrations=0;
    window.fetch=async(url)=>{if(String(url).endsWith('/datasets/register'))registrations++;throw new TypeError('Failed to fetch');};
    await fails(ensureDatasetRegistration(file));assert(registrations===0,'Network failure triggered re-registration');
    window.fetch=async(url)=>String(url).endsWith('/datasets/register')?(registrations++,json({dataset_id:'restored',inspection:{}})):json({},404);
    const restored=await ensureDatasetRegistration({...file});assert(restored.datasetId==='restored'&&registrations===1,'404 recovery broken');

    // 即使解析 JSON 时收到停止信号，也不能用迟到的结果覆盖原有 ID。
    const registrationController=new AbortController();let releaseRegistration;
    window.fetch=async(url)=>String(url).endsWith('/datasets/register')?{ok:true,status:200,json:()=>new Promise(resolve=>releaseRegistration=resolve)}:json({},404);
    const registration=ensureDatasetRegistration(file,registrationController.signal);
    const registrationFailed=fails(registration);await until(()=>releaseRegistration);registrationController.abort();releaseRegistration({dataset_id:'late-id',inspection:{}});
    await registrationFailed;assert(file.datasetId==='lifecycle-test','Cancelled registration changed dataset');

    // 覆盖中英文、否定句、方法解释和“解释此组件”；正向按钮提示仍可直接执行。
    for(const query of ['不要自动打标','不用重新生成睡眠候选标签','如何生成睡眠候选标签？','请解释自动标注原理','Can you explain sleep staging?','Do not overwrite labels','How do I run sleep scoring?','Tell me what happens if I run sleep scoring'])assert(!isSleepStagingRequest(query),'Question/negation triggers direct execution: '+query);
    for(const query of ['生成睡眠自动分期候选标签','请对现有标签进行覆盖','Run sleep staging now','Generate sleep staging candidates','Inspect the bound sleep recording and call the sleep-staging tool now. Generate 30-second W/N1/N2/N3/REM candidates and tell me what needs review.'])assert(isSleepStagingRequest(query),'Explicit command no longer executes: '+query);
    assert(!isSleepStagingRequest('Run sleep staging now',true),'Explain component bypasses read-only');
    let stagingEvents=0;const observe=()=>stagingEvents++;document.addEventListener('neuroflow:sleepstages',observe);
    try{
     let releaseStage;window.fetch=async()=>({ok:true,status:200,json:()=>new Promise(resolve=>releaseStage=resolve)});
     const controller=new AbortController(),task=executeSleepStagingWorkflow(file.datasetId,false,controller.signal),rejected=fails(task);
     await until(()=>releaseStage);controller.abort();releaseStage({analysis_id:'late-stage'});await rejected;
     assert(stagingEvents===0,'Cancelled staging still updates labels');
    }finally{document.removeEventListener('neuroflow:sleepstages',observe);}

    // 从真实对话入口验证只读标记：不能仅测试分类器，再被调用方漏传标记。
    let stageRequests=0,lastBody;
    window.fetch=async(url,options={})=>{
     if(String(url).endsWith('/sleep/stage')){stageRequests++;return json({analysis_id:'candidate-test',epochs:[]});}
     if(String(url).endsWith('/chatStream')){lastBody=JSON.parse(options.body);return completed();}
     return String(url).endsWith('/analysis/latest')?json({},404):json({sessions:[]});
    };
    setView('sleep');
    await sendMessage('Run sleep staging now',{explainComponent:true});
    assert(stageRequests===0&&lastBody.ui_context.explain_only,'Component explanation called staging before backend guard');
    await sendMessage('不要自动打标');await sendMessage('如何自动标注睡眠？');
    assert(stageRequests===0,'Ordinary sleep question auto-executed');
    await sendMessage('Generate sleep staging candidates');
    assert(stageRequests===1&&lastBody.question.includes('candidate-test'),'Explicit sleep action did not provide real result to model');
    setView('eeg');

    // 完整 UI 回合：正文结束后还在刷新图表，仍须锁住上下文、导入和手工处理。
    let releaseRefresh,refreshSignal,mutations=0;
    window.fetch=async(url,options={})=>{
     if(String(url).endsWith('/chatStream'))return completed();
     if(String(url).endsWith('/analysis/latest'))return new Promise(resolve=>{releaseRefresh=resolve;refreshSignal=options.signal;});
     if(options.method==='POST')mutations++;
     return json({sessions:[]});
    };
    let task=sendMessage('How many channels are there?');await until(()=>releaseRefresh);
    assert(state.sending&&!panel().dataset.state&&/同步|Synchronizing/.test(panel().textContent),'Refresh is not part of active request');
    setView('meg');assert(state.view==='eeg','Page unlocked before result refresh');
    await importPaths(['C:/test/other.edf']);await importFiles([]);await runPipeline();
    assert(state.current===file&&mutations===0,'Manual import/processing raced with Agent');
    releaseRefresh(json({},404));await task;assert(!state.sending&&panel().dataset.state==='completed','Refresh did not release composer');

    // 已读到响应头、尚未读完结果体时取消，迟到的分析不得刷新波形或历史。
    let releaseBody;const historyCount=state.history.length;
    window.fetch=async(url,options={})=>{
     if(String(url).endsWith('/chatStream'))return completed();
     if(String(url).endsWith('/analysis/latest')){refreshSignal=options.signal;return {ok:true,status:200,json:()=>new Promise(resolve=>releaseBody=resolve)};}
     return json({sessions:[]});
    };
    task=sendMessage('Inspect this recording');await until(()=>releaseBody);state.streamController.abort();assert(refreshSignal.aborted,'Stop did not reach result request');
    releaseBody({analysis_id:'late-analysis',result:{},output:{saved:false}});await task;
    assert(!file.analysis&&!state.analysis&&state.history.length===historyCount,'Cancelled result repainted chart/history');
    assert(!state.sending&&panel().dataset.state==='cancelled','Cancellation left composer locked');

    window.fetch=async(url)=>String(url).endsWith('/chatStream')?completed():String(url).endsWith('/analysis/latest')?json({message:'Refresh unavailable'},503):json({sessions:[]});
    await sendMessage('Inspect again');assert(!state.sending&&panel().dataset.state==='sync_failed','Refresh failure masked or left composer locked');

    // 准备数据期间切换回答模式只影响下一轮，不能改变已经发出的请求意图。
    let releaseCheck;const originalMode=state.responseMode;
    window.fetch=async(url,options={})=>{
     if(String(url).endsWith('/datasets/lifecycle-test'))return new Promise(resolve=>releaseCheck=resolve);
     if(String(url).endsWith('/chatStream')){lastBody=JSON.parse(options.body);return completed();}
     return String(url).endsWith('/analysis/latest')?json({},404):json({sessions:[]});
    };
    task=sendMessage('Inspect with the selected mode');await until(()=>releaseCheck);
    setResponseMode(originalMode==='quick'?'deep':'quick');releaseCheck(json({}));await task;
    assert(lastBody.response_mode===originalMode,'Mode changed during request preparation');setResponseMode(originalMode);

    // 请求发出后参数允许编辑；旧结果的历史必须采用发出请求时的快照。
    const snapshot=configSnapshot(),oldStepCount=snapshot.steps.filter(step=>step.enabled).length;
    state.steps.forEach(step=>step.enabled=false);
    window.fetch=async()=>json({analysis_id:'fresh-analysis',result:{},output:{saved:false}});
    await syncLatestAgentAnalysis(file,null,new AbortController().signal,snapshot);
    assert(state.history.at(-1).steps.length===oldStepCount,'History recorded parameters changed after request');
    state.steps=snapshot.steps;
   }finally{window.fetch=originalFetch;state.backend='demo';state.current=null;state.sending=false;}
   return 'Passed: registration recovery, cancellation during JSON reads, sleep intent/read-only routing, refresh locks, stop propagation, visible refresh errors and history snapshots';
  })()`);
  console.log(result);app.exit(0);
 }catch(error){console.error(error);app.exit(1);}
});
