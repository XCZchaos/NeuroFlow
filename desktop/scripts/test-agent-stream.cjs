const {app,BrowserWindow}=require('electron');
const path=require('node:path');
app.setPath('userData',path.join(__dirname,'../../.cache/agent-stream-electron'));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1600,height:1000,webPreferences:{contextIsolation:true,nodeIntegration:false,offscreen:true,backgroundThrottling:false}});
 try{
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));
  const result=await win.webContents.executeJavaScript(String.raw`(async()=>{
   const assert=(condition,message)=>{if(!condition)throw Error(message);};
   const wait=()=>new Promise(resolve=>setTimeout(resolve,30));
   const bytes=new TextEncoder().encode('event: message\r\ndata: 中文\r\ndata: second line\r\n\r\nevent: done\r\ndata: [DONE]\r\n\r\n');
   const parsed=[];
   await NeuroAgentStream.consume(new Response(new ReadableStream({start(controller){for(const byte of bytes)controller.enqueue(new Uint8Array([byte]));controller.close();}})),(event,data)=>parsed.push([event,data]));
   assert(parsed.length===2&&parsed[0][1]==='中文\nsecond line'&&parsed[1][0]==='done','UTF-8 or CRLF split parsing failed');
   state.backend='backend';state.current=null;setView('help');setResponseMode('deep');
   assert(document.querySelector('[data-response-mode=deep]').getAttribute('aria-pressed')==='true'&&document.querySelector('#response-mode-description').textContent.length>20,'Mode description/accessibility missing');
   const originalFetch=window.fetch;let stream=null;
   window.fetch=async(url,options={})=>{
    if(String(url).endsWith('/chatStream')){const body=JSON.parse(options.body);assert(body.response_mode===state.responseMode&&body.user_query&&body.question.endsWith(body.user_query),'Mode or raw intent lost');return new Response(new ReadableStream({start(controller){stream=controller;options.signal.addEventListener('abort',()=>controller.error(new DOMException('Stopped','AbortError')),{once:true});}}),{headers:{'Content-Type':'text/event-stream'}});}
    return {ok:true,status:200,json:async()=>({sessions:[]})};
   };
   function emit(name,data){stream.enqueue(new TextEncoder().encode('event: '+name+'\ndata: '+(typeof data==='string'?data:JSON.stringify(data))+'\n\n'));}
   const last=()=>document.querySelector('#messages').lastElementChild;
   try{
    let task=sendMessage('Explain the help page');
    for(let i=0;i<100&&!stream;i++)await wait();assert(stream,'Request did not start');
    emit('status',{kind:'policy',mode:'deep',automatic_searches:2,max_graph_steps:30});await wait();assert(last().querySelector('.agent-execution').dataset.mode==='deep','Mode policy not displayed');
    emit('status',{kind:'tool',id:'call-1',tool:'inspect_ui_component',state:'running'});await wait();
    assert(last().querySelector('li[data-state=running]'),'Real tool start not visible');
    emit('status',{kind:'tool',id:'call-1',tool:'inspect_ui_component',state:'completed',elapsed_ms:15});
    emit('message','FIRST_CHUNK');
    // 隐藏窗口的首次布局可能超过两帧；上游保持打开，等待实际绘制而非固定休眠。
    for(let i=0;i<100&&state.sending&&last().querySelector('.message-body').textContent!=='FIRST_CHUNK';i++)await wait();
    assert(state.sending&&last().querySelector('.message-body').textContent==='FIRST_CHUNK','Text buffered until stream finished: '+last().querySelector('.message-body').textContent);
    assert(last().querySelector('.agent-execution li[data-state=completed]'),'Timeline disappeared when text arrived');
    emit('message','_SECOND');emit('status',{kind:'phase',phase:'verification'});
    emit('status',{kind:'phase',phase:'repair'});emit('status',{kind:'step',id:'answer-repair',tool:'answer_repair',state:'running',attempt:1});await wait();
    assert(/修正回答|correct answer/.test(last().querySelector('.agent-execution').textContent),'Answer correction progress not visible');
    emit('status',{kind:'step',id:'answer-repair',tool:'answer_repair',state:'completed',attempt:1,elapsed_ms:40});
    emit('replace','VERIFIED_ANSWER');emit('done','[DONE]');stream.close();await task;
    assert(last().querySelector('.message-body').textContent==='VERIFIED_ANSWER','Correction appended or overwritten by queued frame');
    assert(last().querySelector('.agent-execution').dataset.state==='completed','Completion missing');
    setResponseMode('quick');stream=null;task=sendMessage('Another question');for(let i=0;i<100&&!stream;i++)await wait();
    emit('message','PARTIAL');emit('error',{message:'TOOL_FAILURE'});stream.close();await task;await wait();
    assert(last().querySelector('.message-body').textContent.includes('PARTIAL')&&last().querySelector('.message-body').textContent.includes('TOOL_FAILURE'),'Failure lost partial text or was overwritten by RAF');
    assert(last().querySelector('.agent-execution').dataset.state==='failed','Error marked complete');
    // 深度模式被上游 402 拒绝：中英文均说明额度问题，保留已显示正文和真实失败状态。
    const previousLocale=NeuroI18n.getLocale();setResponseMode('deep');
    for(const locale of ['zh-CN','en']){
     NeuroI18n.setLocale(locale);stream=null;task=sendMessage('Quota failure check');for(let i=0;i<100&&!stream;i++)await wait();
     emit('message','EXISTING_TEXT');emit('error',{code:'MODEL_QUOTA_EXHAUSTED',message:'模型服务额度不足',upstream_status:402});stream.close();await task;
     const body=last().querySelector('.message-body').textContent;
     assert(body.includes('EXISTING_TEXT')&&(locale==='en'?body.includes('quota'):body.includes('额度')),'Quota cause missing or not translated: '+body);
     assert(!/连接失败|Connection failed|没有生成分析结果|No analysis result was generated/.test(body),'Quota error incorrectly claims connection failure or no tool results');
     assert(last().querySelector('.agent-execution').dataset.state==='failed'&&!state.sending,'Quota error did not release composer');
     assert(!/可选择深度分析|consider Deep analysis/.test(NeuroAgentStream.failureMessage({code:'AGENT_STEP_LIMIT'},'deep')),'Deep mode wrongly told to select itself');
    }
    NeuroI18n.setLocale(previousLocale);
    stream=null;task=sendMessage('Interrupted response');for(let i=0;i<100&&!stream;i++)await wait();
    emit('message','NO_DONE');stream.close();await task;
    assert(last().querySelector('.agent-execution').dataset.state==='failed','Missing done incorrectly marked success');
    stream=null;task=sendMessage('Stop this request');for(let i=0;i<100&&!stream;i++)await wait();
    emit('status',{kind:'tool',id:'cancel-tool',tool:'run_neuro_analysis',state:'running'});emit('message','BEFORE_STOP');await wait();state.streamController.abort();await task;
    assert(last().querySelector('.agent-execution').dataset.state==='cancelled'&&last().querySelector('li[data-state=cancelled]'),'Stop did not settle active tool');
    assert(last().querySelector('.message-body').textContent.includes('BEFORE_STOP'),'Stop lost partial response');
   }finally{window.fetch=originalFetch;state.backend='demo';}
   return 'Passed: split SSE/UTF-8, first text before EOF, real tool lifecycle, atomic correction, bilingual quota errors, partial errors, missing done, cancellation';
  })()`);
  console.log(result);app.exit(0);
 }catch(error){console.error(error);app.exit(1);}
});
