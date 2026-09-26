/* 执行过程只消费真实事件；计时器仅更新等待时长，不推测工具/模型的思维步骤。 */
(function(global){
  const labels={
    connecting:['正在连接后端','Connecting to backend'],context:['正在加载会话和数据上下文','Loading conversation and dataset context'],
    model:['等待模型响应','Waiting for model response'],
    verification:['正在核验回答与工具结果','Verifying answer against tool results'],
    repair:['正在补查证据并修正回答','Checking evidence and correcting the answer'],
    streaming:['正在生成回答（待核验）','Generating answer (pending verification)'],
    sync:['正在同步结果与图表','Synchronizing results and plots'],sync_failed:['回答已结束，结果刷新失败','Response ended; result refresh failed'],
    completed:['已完成','Completed'],failed:['失败','Failed'],cancelled:['已停止','Stopped'],
    degraded:['降级处理','Degraded'],retrying:['正在重试','Retrying'],empty:['未找到知识','No knowledge found'],
    running:['执行中','Running'],skipped:['已跳过','Skipped'],interrupted:['请求已结束，未收到工具完成确认','Request ended without tool completion confirmation'],
    prepare:['正在准备当前页面数据','Preparing active page data'],sleep:['正在执行睡眠候选分期','Generating sleep-stage candidates']
  };
  const text=key=>(labels[key]||[key,key])[global.NeuroI18n?.getLocale()==='en'?1:0];
  // 按后端稳定错误码翻译，保留真正的失败原因。上游额度不足不能笼统显示成
  // “Go 后端未启动”，也不能仅凭回答失败就断言之前没有任何工具产物。
  function failureMessage(failure,mode){
    if(failure.code==='AGENT_STEP_LIMIT')return global.NeuroI18n.t(mode==='deep'?'error.agentBudgetDeep':'error.agentBudgetQuick');
    const key={MODEL_QUOTA_EXHAUSTED:'error.modelQuota',MODEL_AUTH_FAILED:'error.modelAuth',MODEL_ACCESS_DENIED:'error.modelAccess',MODEL_RATE_LIMITED:'error.modelRateLimit',MODEL_NOT_FOUND:'error.modelNotFound',MODEL_REQUEST_REJECTED:'error.modelRequest',MODEL_UNAVAILABLE:'error.modelUnavailable',AGENT_TIMEOUT:'error.agentTimeout'}[failure.code];
    return key?global.NeuroI18n.t(key):failure.message||global.NeuroI18n.t('error.stream');
  }
  const tools={inspect_dataset:['读取数据集结构','Inspect dataset'],inspect_ui_component:['读取当前组件','Inspect UI component'],
    query_internal_docs:['检索知识库','Search knowledge base'],run_neuro_analysis:['执行 MNE 分析','Run MNE analysis'],
    run_neurokit_analysis:['执行 NeuroKit2 分析','Run NeuroKit2 analysis'],suggest_sleep_stages:['生成睡眠候选分期','Suggest sleep stages'],
    run_ppg_analysis:['分析 PPG 信号','Analyze PPG'],validate_acquisition_config:['验证采集配置','Validate acquisition configuration'],
    manage_preprocessing_task:['管理预处理任务','Manage preprocessing task'],answer_repair:['补查证据并修正回答','Check evidence and correct answer'],knowledge_primary:['检索问题依据','Retrieve primary evidence'],knowledge_constraints:['检索前提与风险','Retrieve prerequisites and risks']};
  function attach(message){
    const panel=document.createElement('details');panel.className='agent-execution';panel.open=true;
    const summary=document.createElement('summary'),note=document.createElement('p'),list=document.createElement('ol');
    note.className='agent-execution-note';panel.append(summary,note,list);message.body.before(panel);
    let phase='connecting',ended=false,policy=null;const started=Date.now(),calls=new Map();
    const paint=()=>{
      summary.textContent=`${text(phase)} · ${Math.floor((Date.now()-started)/1000)}s`;
      note.textContent=global.NeuroI18n?.getLocale()==='en'?'Actual execution events; not private model reasoning.':'真实执行记录，不是模型内部思维链。';
      if(policy){const english=global.NeuroI18n?.getLocale()==='en';note.textContent=(english?`${policy.mode==='deep'?'Deep analysis':'Quick answer'} · ${policy.automatic_searches} planned searches · ${policy.max_graph_steps} graph steps. `:`${policy.mode==='deep'?'深度分析':'即时回答'} · 计划 ${policy.automatic_searches} 轮自动检索 · ${policy.max_graph_steps} 图步骤预算。`)+note.textContent;}
      for(const {node,event} of calls.values()){
        const name=tools[event.tool]?.[global.NeuroI18n?.getLocale()==='en'?1:0]||event.tool;
        node.title=event.tool;
        node.textContent=`${name} · ${text(event.state)}${event.document_count!=null?' · '+event.document_count+(global.NeuroI18n?.getLocale()==='en'?' documents':' 条文档'):''}${event.attempt?' · #'+event.attempt:''}${event.elapsed_ms!=null?' · '+(event.elapsed_ms/1000).toFixed(1)+'s':''}`;
      }
    };
    const timer=setInterval(paint,1000);paint();
    return {
      event(event){
        if(ended)return;
        if(event.kind==='policy'){policy=event;panel.dataset.mode=event.mode;}
        if(event.kind==='phase')phase=event.phase;
        if(event.kind==='tool'||event.kind==='step'){
          let item=calls.get(event.id);
          if(!item){item={node:document.createElement('li')};calls.set(event.id,item);list.append(item.node);}
          item.event=event;item.node.dataset.state=event.state;
          phase=[...calls.values()].some(item=>item.event.state==='running')?'running':'model';
        }
        paint();
      },
      phase(value){if(!ended){phase=value;paint();}},
      finish(value){
        if(ended)return;ended=true;clearInterval(timer);phase=value;
        for(const item of calls.values())if(item.event.state==='running'){item.event={...item.event,state:value==='cancelled'?'cancelled':'interrupted'};item.node.dataset.state=item.event.state;}
        panel.dataset.state=value;paint();
      }
    };
  }

  // CRLF 可能刚好在两个网络分片之间拆开，因此必须拼接后再规范换行。
  // TextDecoder 保留半个 UTF-8 字符；finally 释放读取锁，支持主动停止。
  async function consume(response,onEvent){
    if(!response.body)throw Error('Streaming response body unavailable');
    const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
    function dispatch(block){
      let event='message';const data=[];
      for(const line of block.split('\n')){
        if(line.startsWith('event:'))event=line.slice(6).trim();
        else if(line.startsWith('data:'))data.push(line.slice(5).replace(/^ /,''));
      }
      if(data.length)onEvent(event,data.join('\n'));
    }
    try{
      while(true){
        const {value,done}=await reader.read();
        buffer=(buffer+decoder.decode(value||new Uint8Array(),{stream:!done})).replace(/\r\n/g,'\n');
        let boundary;
        while((boundary=buffer.indexOf('\n\n'))>=0){dispatch(buffer.slice(0,boundary));buffer=buffer.slice(boundary+2);}
        if(done)break;
      }
      if(buffer.trim())dispatch(buffer);
    }finally{reader.releaseLock();}
  }
  global.NeuroAgentStream={attach,consume,failureMessage};
})(window);
