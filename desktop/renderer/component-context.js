/* 组件语义注册表：只发送显式登记的状态，不遍历 DOM 表单或读取整页文本。
 * 新组件只需注册稳定 ID、选择器、用途及只读 read()，即可进入相同的 Agent
 * 上下文协议。显示状态不是科学分析证据，也不是修改界面的授权。
 */
(function(global){
  'use strict';
  const registry=new Map();let focused=null,picking=false,hovered=null,scopeKey='',suppressedTarget=null;
  const $=s=>document.querySelector(s),en=()=>global.NeuroI18n?.getLocale()==='en';
  const label=(zh,english)=>en()?english:zh;
  const toolbar=document.createElement('div');toolbar.className='component-agent-toolbar';
  toolbar.innerHTML='<div id="agent-component-focus" role="status"></div><div><button type="button" id="agent-pick-component"></button><button type="button" id="agent-explain-component" disabled></button><button type="button" id="agent-clear-component" hidden>×</button></div>';
  $('.agent-context').after(toolbar);
  function visible(node){return !!node&&node.isConnected&&!node.closest('[hidden]')&&getComputedStyle(node).display!=='none'&&(node.tagName!=='DIALOG'||node.open)&&node.getClientRects().length>0;}
  function register(def){if(!/^[a-z][a-z0-9_-]{0,63}$/.test(def.id)||registry.has(def.id))throw Error('Invalid or duplicate component id');registry.set(def.id,def);}
  function clean(value,depth=0){
    // 白名单适配器之外再做一次有界清理。字段名或字符串包含文件路径、密钥
    // 时不发送；数组保留摘要上限，禁止通过新适配器意外带入大波形。
    if(depth>6)return '[truncated]';
    if(typeof value==='string')return value.replace(/\bsk-[a-zA-Z0-9_-]{8,}/g,'[redacted]').replace(/[A-Za-z]:[\\/][^\s"<>]+|\\\\[^\s"<>]+|\/(?:Users|home|tmp|mnt|data)\/[^\s"<>]+/g,'[local path]').slice(0,500);
    if(typeof value==='number')return Number.isFinite(value)?value:null;
    if(value==null||typeof value==='boolean')return value;
    if(Array.isArray(value))return value.slice(0,40).map(item=>clean(item,depth+1));
    if(typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>!/(?:password|api.?key|token|secret|path|waveform|^data$)/i.test(key)).slice(0,40).map(([key,item])=>[key,clean(item,depth+1)]));
    return null;
  }
  const mainRead=(id,detail)=>global.NeuroFlowWorkspace?.componentState?.(id,detail)||{};
  function add(id,selector,zh,english,purpose,read=(detail)=>mainRead(id,detail)){register({id,selector,title:[zh,english],purpose,read});}
  add('dataset','#dropzone','数据导入','Dataset import','Read file metadata and parse/confirmation status. Metadata alone does not establish signal quality.');
  add('labels','#dataset-labels','外部标签','External annotations','Imported event labels; edit/delete affects external annotations, not native source data.');
  add('structure','#structure-card, #structure-dialog[open]','数据结构确认','Structure review','Review sampling rate, units, channels and conflicts before processing. Draft edits are not confirmed metadata.');
  add('pipeline','.pipeline-card','预处理流程 / 步骤参数','Pipeline / step parameters','Ordered editable steps. Enabled is not executed. Explain the selected step and parameter without silently modifying it.');
  add('signal','.signal-card','信号预览','Signal preview','Selected channel and time window; preview statistics are display-sample summaries, not diagnostic results.');
  add('channels','#channel-layout-panel','通道排布','Channel layout','Electrode geometry and channel selection. A schematic layout must not be described as measured coordinates.');
  add('quality','#quality-card','质量与审计','Quality and audit','Results from the last analysis; do not claim improvement without comparable measured scores.');
  add('products','#analysis-products','ERP / 时频 / 解码','ERP / time-frequency / decoding','Analysis products and execution status. Only performed results can be interpreted as computed.');
  add('tasks','#task-monitor','任务进度','Task progress','Execution state, pending fields and backend step events.');
  add('meg-settings','#meg-controls','MEG 参数','MEG settings','SSS/tSSS and empty-room selection, not proof of device geometry compatibility.');
  add('run','.run-bar','运行与保存','Run and save','Whether execution is active and output saving is selected. A checked option is not evidence of a saved file.');
  add('datasets','#dataset-list','数据列表','Dataset list','Registered dataset summaries; user must select a recording before operations.');
  add('bids','#bids-browser','BIDS 浏览器','BIDS browser','Local BIDS browser. Paths are not sent to the model.');
  add('batch','#batch-panel','批处理','Batch processing','Batch selection and save option, not permission to start a job.');
  add('history','#history-list','运行记录','Run history','Recent local run summaries, distinguish demonstration runs from real processing.');
  add('sessions','#session-list','会话列表','Conversation list','Conversation count and active session; no other conversation content is copied.');
  add('help','#help-view','使用说明','User guide','Explain the focused help topic using application documentation.',detail=>({topic:detail?.topic||null,excerpt:detail?.topic?document.getElementById(detail.topic)?.textContent?.slice(0,1500):null}));
  add('ppg-import','.ppg-import','PPG 文件检查','PPG import','PPG parser and signal selection; no EEG voltage conversion.',()=>global.NeuroPPG?.snapshot?.());
  add('ppg-settings','.ppg-settings','PPG 处理参数','PPG settings','Explicit channel, sampling rate, time unit and analysis range; processing uses these configured values.',()=>global.NeuroPPG?.snapshot?.());
  add('ppg-signal','.ppg-chart-card','PPG 波形','PPG waveform','Raw/cleaned display and detected pulse peaks; the displayed range can differ from the analyzed range.',()=>global.NeuroPPG?.snapshot?.());
  add('ppg-results','.ppg-metrics','PPG 心率结果','PPG results','Beat-to-beat pulse rate summaries, not ECG HRV or SpO2.',()=>global.NeuroPPG?.snapshot?.());
  add('sleep-summary','.sleep-summary, .sleep-data-check','睡眠记录与检查','Sleep record and checks','Current sleep record and detector availability.',()=>global.NeuroSleep?.snapshot?.());
  add('sleep-import','#sleep-empty','睡眠数据导入','Sleep import','No linked recording; import and confirm EEG data before scoring.',()=>({loaded:false}));
  add('sleep-timeline','.sleep-hypnogram-card','睡眠阶段图','Hypnogram','Overview of labels; unscored segments are not predictions.',()=>global.NeuroSleep?.snapshot?.());
  add('sleep-epoch','.sleep-editor','当前 Epoch','Current epoch','Selected 30-second epoch, label provenance, candidate confidence and review state.',()=>global.NeuroSleep?.snapshot?.());
  add('sleep-queue','.sleep-queue','Epoch 队列','Epoch queue','Scored/unscored epochs and current selection.',()=>global.NeuroSleep?.snapshot?.());
  add('model-settings','#settings-dialog[open]','模型与连接设置','Model and connection settings','UI-selected model settings; secrets and endpoints are excluded. Settings may not be saved.',()=>({provider:$('#model-provider')?.value,model:$('#model-name')?.value,backend_mode:$('#backend-mode')?.value,temperature:$('#model-temperature')?.value,temperature_editable:!$('#model-temperature')?.disabled}));
  add('algorithm-library','#algorithm-dialog[open]','算法步骤库','Algorithm library','Available processing step catalog; adding a step does not execute it.');
  function locate(target){
    if(!(target instanceof Element)||target.closest('#global-agent-dock'))return null;
    // 从最近的已注册父节点开始匹配，标签子区、MEG 控件等优先于外层卡片。
    for(let node=target;node;node=node.parentElement){for(const def of registry.values())if(node.matches(def.selector)&&visible(node))return {def,node};}
    return null;
  }
  function detailFor(target){
    const row=target.closest('.pipeline-step');
    const field=target.closest('input,select,textarea,button');
    const listRow=target.closest('.list-row'),reviewRow=target.closest('.review-channel');
    return {step_key:row?.dataset.agentStepKey||null,parameter_index:target.matches('.param-input')?[...row.querySelectorAll('.param-input')].indexOf(target):null,
      list_index:listRow?[...listRow.parentElement.querySelectorAll('.list-row')].indexOf(listRow):null,review_channel_index:reviewRow?[...document.querySelectorAll('.review-channel')].indexOf(reviewRow):null,
      channel:target.closest('[data-channel]')?.dataset.channel||null,topic:target.closest('#help-view article')?.id||null,control_id:field?.id||null,control_disabled:field?Boolean(field.disabled):null};
  }
  function choose(target){
    if(target.closest('.component-dialog-explain'))return false;
    const found=locate(target);if(!found)return false;clearHighlight();focused={id:found.def.id,detail:detailFor(target)};found.node.classList.add('agent-component-selected');
    // 原生 modal 会遮住全局聊天栏，因此在已登记的弹窗中提供同样的解释入口。
    // 发送时先冻结状态，再关闭弹窗，不能关闭后重新读取导致焦点组件丢失。
    const dialog=target.closest('dialog[open]');
    if(dialog&&!dialog.querySelector('.component-dialog-explain')){const button=document.createElement('button');button.type='button';button.className='button light component-dialog-explain';button.textContent=label('让 Agent 解释此组件','Ask Agent about this component');button.onclick=()=>{explainFocused();dialog.close();};dialog.append(button);}
    render();return true;
  }
  function clearHighlight(){document.querySelectorAll('.agent-component-selected,.agent-component-hover').forEach(node=>node.classList.remove('agent-component-selected','agent-component-hover'));hovered=null;}
  function focusVisible(){return focused&&registry.get(focused.id)&&[...document.querySelectorAll(registry.get(focused.id).selector)].some(visible);}
  function render(){
    document.querySelectorAll('.component-dialog-explain').forEach(node=>{node.textContent=label('让 Agent 解释此组件','Ask Agent about this component');});
    if(focused&&!focusVisible()){focused=null;clearHighlight();}
    const title=focused?registry.get(focused.id).title[en()?1:0]:label('未指定组件','No component selected');
    $('#agent-component-focus').textContent=(picking?label('点击页面中想询问的组件；Esc 取消','Click a component to inspect; Esc cancels'):label('关注：','Focus: ')+title);
    $('#agent-pick-component').textContent=picking?label('取消选择','Cancel selection'):label('选择组件','Select component');$('#agent-pick-component').setAttribute('aria-pressed',String(picking));
    $('#agent-explain-component').textContent=label('解释此组件','Explain component');$('#agent-explain-component').disabled=!focused;
    $('#agent-clear-component').hidden=!focused;$('#agent-clear-component').setAttribute('aria-label',label('清除组件选择','Clear component selection'));
  }
  function stopPicking(){picking=false;document.body.classList.remove('agent-component-picking');hovered?.classList.remove('agent-component-hover');hovered=null;render();}
  document.addEventListener('click',event=>{
    if(suppressedTarget===event.target){suppressedTarget=null;event.preventDefault();event.stopImmediatePropagation();return;}
    if(event.target.closest('#global-agent-dock'))return;
    if(picking){event.preventDefault();event.stopImmediatePropagation();if(choose(event.target))stopPicking();return;}
    choose(event.target);
  },true);
  // disabled 按钮不触发 click，但仍可通过 pointerdown 被选中解释。
  document.addEventListener('pointerdown',event=>{
    if(!picking||event.target.closest('#global-agent-dock'))return;
    event.preventDefault();event.stopImmediatePropagation();suppressedTarget=event.target;
    setTimeout(()=>{suppressedTarget=null;},700);if(choose(event.target))stopPicking();
  },true);
  document.addEventListener('focusin',event=>{if(!picking)choose(event.target);});
  document.addEventListener('pointermove',event=>{if(!picking)return;const node=locate(event.target)?.node;if(node===hovered)return;hovered?.classList.remove('agent-component-hover');hovered=node;hovered?.classList.add('agent-component-hover');});
  document.addEventListener('keydown',event=>{if(picking&&event.key==='Escape'){event.preventDefault();stopPicking();}},true);
  $('#agent-pick-component').onclick=()=>{if(picking){stopPicking();return;}picking=true;document.body.classList.add('agent-component-picking');render();};
  $('#agent-clear-component').onclick=()=>{focused=null;clearHighlight();render();};
  function explainFocused(){
    render();if(!focused)return;
    // 发送的是普通用户问题。模型可以读取状态并解释；不会因此触发参数修改。
    const title=registry.get(focused.id).title[en()?1:0];
    global.NeuroFlowWorkspace.sendAgentMessage(en()?`Explain the selected component “${title}”, its current values and any limitations. Do not execute or modify anything.`:`解释当前选中的“${title}”组件、它的参数和状态，以及需要注意的地方。只解释，不执行或修改。`,{explainComponent:true});
  }
  $('#agent-explain-component').onclick=explainFocused;
  function snapshot(page,datasetID){
    pageChanged(page,datasetID);render();const components=[];
    for(const def of registry.values()){
      if(![...document.querySelectorAll(def.selector)].some(visible))continue;
      const detail=focused?.id===def.id?focused.detail:{};
      let state;try{state=clean(def.read(detail)||{});}catch{state={unavailable:true};}
      components.push({id:def.id,title:def.title[en()?1:0],purpose:def.purpose,state,selected_control:focused?.id===def.id?clean(detail):null});
    }
    // 优先保留当前组件的完整小型状态，其余组件提供受限摘要，避免上下文膨胀。
    components.sort((a,b)=>Number(b.id===focused?.id)-Number(a.id===focused?.id));
    const value={version:1,page,dataset_id:datasetID||'',focused_component_id:focused?.id||'',components:components.slice(0,24)};
    const bytes=()=>new TextEncoder().encode(JSON.stringify(value)).length;
    while(bytes()>24000&&value.components.length>1)value.components.pop();
    if(bytes()>24000)value.components[0].state={truncated:true};
    return value;
  }
  function pageChanged(page,datasetID){const key=page+':'+(datasetID||'');if(key!==scopeKey){scopeKey=key;focused=null;clearHighlight();stopPicking();}render();}
  document.addEventListener('neuroflow:localechange',render);
  document.addEventListener('close',render,true);
  global.NeuroComponents=Object.freeze({register,snapshot,pageChanged,clear:()=>{focused=null;clearHighlight();render();}});render();
})(window);
