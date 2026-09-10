const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const i18n=globalThis.NeuroI18n;
const t=(key,vars)=>i18n.t(key,vars);
const templates = {
  EEG: { name: 'sub-01_task-rest_eeg.edf', channels: '64', rate: '256', format: 'EDF', unit: 'μV', accept: '.edf,.bdf,.set,.fdt,.vhdr,.vmrk,.eeg', labels: ['Fp1','Fp2','F3','F4','C3','C4','P3','P4'], steps: [
    ['带通滤波', 'Band-pass filter', [['低频 Hz','0.5'],['高频 Hz','40']]],
    ['工频陷波', 'Notch filter', [['频率 Hz','50']]],
    ['坏道检测', 'Bad channel detection', [['方法','人工复核']]],
    ['独立成分分析', 'ICA artifact review', [['算法','FastICA'],['成分数','20']]],
    ['重参考', 'Re-reference', [['参考方式','平均参考']]]
  ]},
  MEG: { name: 'sub-01_task-rest_meg.fif', channels: '306', rate: '1000', format: 'FIF', unit: 'fT', accept: '.fif,.con,.sqd', labels: ['MEG0111','MEG0121','MEG0131','MEG0141','MEG0211','MEG0221','MEG0231','MEG0241'], steps: [
    ['传感器质量检查','Sensor quality', [['方法','人工复核']]],
    ['环境噪声抑制','SSS / tSSS', [['方法','tSSS'],['窗口 s','10']]],
    ['带通滤波','Band-pass filter', [['低频 Hz','1'],['高频 Hz','40']]],
    ['工频陷波','Notch filter', [['频率 Hz','50']]],
    ['生理伪迹审查','ICA artifact review', [['算法','FastICA'],['成分数','20']]]
  ]},
  fNIRS: { name: 'sub-01_task-rest_nirs.snirf', channels: '48', rate: '10', format: 'SNIRF', unit: 'a.u.', accept: '.snirf,.nirs', labels: ['S1-D1','S1-D2','S2-D1','S2-D3','S3-D2','S3-D4','S4-D3','S4-D4'], steps: [
    ['光强转光密度','Optical density', [['输入','原始光强']]],
    ['通道质量检查','Channel quality', [['方法','人工复核']]],
    ['运动伪迹校正','Motion correction', [['方法','TDDR']]],
    ['带通滤波','Band-pass filter', [['低频 Hz','0.01'],['高频 Hz','0.2']]],
    ['血红蛋白浓度转换','Modified Beer–Lambert', [['PPF（待确认）','6']]]
  ]}
};
const clone = value => JSON.parse(JSON.stringify(value));
const state = { mode:'EEG', steps:[], datasets:[], current:null, history:[], running:false, sending:false, processed:false, backend:'demo', url:'http://localhost:8819', session:globalThis.crypto?.randomUUID?.() || `session-${Date.now()}`, streamController:null };
let toastTimer;
function toast(message) { $('#toast').textContent = message; $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').hidden = true, 4000); }
function element(tag, className, text) { const node = document.createElement(tag); if(className) node.className=className; if(text !== undefined) node.textContent=text; return node; }
function setMode(mode) {
  if(state.running || state.sending) return toast(t('toast.waitSwitch'));
  state.mode=mode; state.steps=templates[mode].steps.map(([name,english,params]) => ({name,english,params:clone(params),enabled:true}));
  state.current=state.datasets.find(item=>item.mode===mode)||null;
  $$('.segmented [data-mode]').forEach(button=>button.classList.toggle('selected',button.dataset.mode===mode));
  $('#context-mode').textContent=i18n.getLocale()==='en'?`${mode} preprocessing`:`${mode} 预处理`; state.processed=false;
  $$('.signal-tabs button').forEach(button=>button.classList.toggle('selected',button.dataset.signal==='raw'));
  renderDataset(); renderPipeline(); drawSignal();
}
function renderDataset() {
  const template=templates[state.mode], file=state.current;
	const meta=file?.inspection;
  $('#file-name').textContent=file ? file.name : template.name;
  const english=i18n.getLocale()==='en';
  $('#file-description').textContent=meta ? `${formatBytes(file.size)} · ${english?'Metadata read by':'已由'} ${meta.reader}` : file ? `${formatBytes(file.size)} · ${english?'Selected, pending inspection':'已选择本地文件，尚未解析信号'}` : english?'Resting state · Synthetic preview':'静息态 · 示例信号，用于预览界面';
  $('#source-badge').textContent=meta?t('badge.parsed'):file?t('badge.pending'):t('badge.example');
  $('#meta-channels').textContent=meta?`${meta.channel_count} channels`:file?t('badge.pending'):`${template.channels} channels`;
  $('#meta-rate').textContent=meta?`${meta.sampling_rate_hz} Hz`:file?t('badge.pending'):`${template.rate} Hz`;
  $('#meta-duration').textContent=meta?`${meta.duration_seconds.toFixed(1)} s`:file?t('badge.pending'):'05:00 min';
  $('#meta-format').textContent=meta?meta.format:file?file.name.split('.').pop().toUpperCase():template.format;
  $('#format-hint').textContent=`${english?'Supports':'支持'} ${template.accept.split(',').join(' / ')} · ${english?'Keep companion files together':'可拖入配套文件'}`;
  $('#file-input').accept=template.accept;
  $('#signal-unit').textContent=t('signal.amplitude',{unit:template.unit});
  $('#dataset-count').textContent=state.datasets.length||1;
}
function renderPipeline() {
  const list=$('#pipeline'); list.replaceChildren();
  state.steps.forEach((step,index)=>{
    const row=element('div',`pipeline-step${step.enabled?'':' disabled'}`);
    row.append(element('span','step-index',String(index+1).padStart(2,'0')));
    const content=element('div','step-content'), top=element('div','step-top');
    top.append(element('strong','',i18n.domain(step.name)),element('small','',step.english));
    const toggle=element('label','toggle'), checkbox=document.createElement('input'); checkbox.type='checkbox'; checkbox.checked=step.enabled; checkbox.disabled=state.running; checkbox.setAttribute('aria-label',t('toggle.enable',{name:i18n.domain(step.name)}));
    checkbox.addEventListener('change',()=>{step.enabled=checkbox.checked;row.classList.toggle('disabled',!step.enabled);updateCount();});
    toggle.append(checkbox,element('span'));top.append(toggle);content.append(top);
    const params=element('div','step-params');
    step.params.forEach(param=>{const label=element('label','param-label',i18n.domain(param[0]));const input=element('input','param-input');input.value=i18n.domain(param[1]);input.maxLength=100;input.disabled=state.running;input.setAttribute('aria-label',`${i18n.domain(step.name)} ${i18n.domain(param[0])}`);input.addEventListener('input',()=>param[1]=input.value);label.append(input);params.append(label);});
    content.append(params);row.append(content);list.append(row);
  }); updateCount();
}
function updateCount() { const count=state.steps.filter(step=>step.enabled).length;$('#enabled-count').textContent=t('steps.enabled',{count});$('#step-count').textContent=t('steps.count',{count:state.steps.length});$('#run-button').disabled=state.running||!count; }
function formatBytes(bytes) { return bytes<1048576?`${(bytes/1024).toFixed(1)} KB`:`${(bytes/1048576).toFixed(1)} MB`; }
async function registerPath(path) {
  // 把本地路径交给本机 Go 服务。响应中只保留 dataset_id 和解析后的元数据。
  const response=await fetch(`${state.url}/datasets/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path}),signal:AbortSignal.timeout(35000)});
  const data=await response.json().catch(()=>({message:`HTTP ${response.status}`}));
  if(!response.ok)throw new Error(data.message||data.code||`HTTP ${response.status}`);
  return data;
}
async function importPaths(paths) {
  // 多选文件逐个注册：一种格式失败不会阻止其他文件继续导入。
  if(state.running)return toast(t('toast.waitImport'));
  if(state.backend!=='backend')return toast(t('toast.connectBackend'));
  let accepted=0; const failures=[];
  for(const path of paths) {
    try {
      const record=await registerPath(path), meta=record.inspection;
      // inspection 是 Python/MNE 已验证的数据；后面的界面和对话统一读取它。
      const item={name:meta.source_name,size:meta.source_size_bytes||0,modified:0,mode:meta.modality,datasetId:record.dataset_id,inspection:meta,path};
      state.datasets.push(item); accepted++;
      if(templates[meta.modality]&&state.mode!==meta.modality)setMode(meta.modality);
      state.current=item;
    } catch(error) { failures.push(error.message); }
  }
  renderDataset();renderLists();
  toast(accepted?`${t('toast.imported',{count:accepted})}${failures.length?t('toast.failedCount',{count:failures.length}):''}`:t('toast.readFailed',{error:failures[0]||(i18n.getLocale()==='en'?'Unknown error':'未知错误')}));
}
function importFiles(files) {
  if(state.running) return toast(t('toast.demoImport'));
  const allowed=templates[state.mode].accept.split(',');let accepted=0,rejected=0;
  for(const file of files) {
    if(!allowed.some(ext=>file.name.toLowerCase().endsWith(ext))) {rejected++;continue;}
    const item={name:file.name,size:file.size,modified:file.lastModified,mode:state.mode};
    const exists=state.datasets.find(data=>data.name===item.name&&data.size===item.size&&data.modified===item.modified&&data.mode===item.mode);
    if(!exists) state.datasets.push(item);
    state.current=exists||item;accepted++;
  }
  renderDataset();renderLists();
  toast(`${accepted?t('toast.selected',{count:accepted}):t('toast.noFile')}${rejected?t('toast.rejected',{count:rejected}):''}`);
}
function renderLists() {
  const datasets=$('#dataset-list');datasets.replaceChildren();
  if(!state.datasets.length) datasets.append(element('p','empty',t('dataset.empty')));
  state.datasets.forEach(file=>{const row=element('div','list-row'),details=element('div');details.append(element('strong','',file.name),element('p','',`${file.mode} · ${formatBytes(file.size)} · ${file.inspection?t('badge.parsed'):t('badge.pending')}`));const button=element('button','button light',t('action.open'));button.addEventListener('click',()=>{if(state.running||state.sending)return toast(i18n.getLocale()==='en'?'Wait for the current task to finish':'请等待当前任务结束');setMode(file.mode);state.current=file;renderDataset();setView('workspace');});row.append(details,button);datasets.append(row);});
  const history=$('#history-list');history.replaceChildren();
  if(!state.history.length) history.append(element('p','empty',t('history.empty')));
  [...state.history].reverse().forEach(run=>{const row=element('div','list-row'),details=element('div');details.append(element('strong','',t('history.complete',{mode:run.mode,count:run.steps.length})),element('p','',`${run.time} · ${t('history.noProcessing')}`));const button=element('button','button light',t('action.export'));button.addEventListener('click',()=>download(run,`neuroflow-${run.mode}-run.json`));row.append(details,button);history.append(row);});
}
function setView(view) { for(const name of ['workspace','datasets','history'])$(`#${name}-view`).hidden=name!==view;$$('.nav-item[data-view]').forEach(button=>button.classList.toggle('active',button.dataset.view===view));const keys={workspace:'nav.preprocessing',datasets:'nav.datasets',history:'nav.history'};$('#breadcrumb').textContent=t(keys[view]);$('#page-title').textContent=view==='workspace'?t('view.title'):t(keys[view]);renderLists();if(view==='workspace')requestAnimationFrame(drawSignal); }
// 把 Markdown 的行内语法转换为 DOM 节点。这里不使用 innerHTML，模型返回的
// HTML 会被当作普通文本处理，从而避免脚本注入；只开放粗体、斜体、行内代码和链接。
function appendInlineMarkdown(parent,text) {
  const pattern=/(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*\n]+)\*)/g;
  let cursor=0,match;
  while((match=pattern.exec(text))!==null){
    if(match.index>cursor)parent.append(document.createTextNode(text.slice(cursor,match.index)));
    if(match[2]&&match[3]){const link=element('a','',match[2]);link.href=match[3];link.target='_blank';link.rel='noopener noreferrer';parent.append(link);}
    else if(match[4])parent.append(element('code','',match[4]));
    else if(match[5]||match[6])parent.append(element('strong','',match[5]||match[6]));
    else if(match[7])parent.append(element('em','',match[7]));
    cursor=pattern.lastIndex;
  }
  if(cursor<text.length)parent.append(document.createTextNode(text.slice(cursor)));
}

// 将 Markdown 表格的一行拆成单元格，同时兼容首尾可选的竖线。
function markdownTableCells(line) {return line.trim().replace(/^\||\|$/g,'').split('|').map(cell=>cell.trim());}

// 渲染 Agent 常用的 Markdown 块：标题、段落、列表、引用、分隔线和代码块。
// 这是一个有意保持精简的安全渲染器，足以显示大模型回答，又不允许任意 HTML。
function renderMarkdown(text) {
  const root=element('div','markdown'),lines=String(text).replace(/\r\n?/g,'\n').split('\n');let index=0;
  while(index<lines.length){
    const line=lines[index];if(!line.trim()){index++;continue;}
    if(line.trim().startsWith('```')){
      const language=line.trim().slice(3).trim(),code=[];index++;
      while(index<lines.length&&!lines[index].trim().startsWith('```'))code.push(lines[index++]);
      if(index<lines.length)index++;
      const pre=element('pre'),codeNode=element('code','',code.join('\n'));if(language)codeNode.dataset.language=language;
      pre.append(codeNode);root.append(pre);continue;
    }
    const heading=line.match(/^(#{1,4})\s+(.+)$/);
    if(heading){const node=element(`h${heading[1].length}`);appendInlineMarkdown(node,heading[2]);root.append(node);index++;continue;}
    if(/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)){root.append(element('hr'));index++;continue;}
    // 只有“表头下一行全部由 ---、:---、---: 构成”时才识别为表格，避免把普通竖线误判。
    if(line.includes('|')&&index+1<lines.length&&/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index+1])){
      const table=element('table'),thead=element('thead'),headerRow=element('tr');
      markdownTableCells(line).forEach(cell=>{const th=element('th');appendInlineMarkdown(th,cell);headerRow.append(th);});
      thead.append(headerRow);table.append(thead);index+=2;
      const tbody=element('tbody');
      while(index<lines.length&&lines[index].includes('|')&&lines[index].trim()){
        const tr=element('tr');markdownTableCells(lines[index++]).forEach(cell=>{const td=element('td');appendInlineMarkdown(td,cell);tr.append(td);});tbody.append(tr);
      }
      table.append(tbody);root.append(table);continue;
    }
    const listMatch=line.match(/^\s*(?:([-+*])|(\d+)\.)\s+(.+)$/);
    if(listMatch){
      const ordered=Boolean(listMatch[2]),list=element(ordered?'ol':'ul');
      while(index<lines.length){const item=lines[index].match(/^\s*(?:([-+*])|(\d+)\.)\s+(.+)$/);if(!item||Boolean(item[2])!==ordered)break;const li=element('li');appendInlineMarkdown(li,item[3]);list.append(li);index++;}
      root.append(list);continue;
    }
    if(/^>\s?/.test(line)){
      const quote=element('blockquote'),parts=[];while(index<lines.length&&/^>\s?/.test(lines[index]))parts.push(lines[index++].replace(/^>\s?/,''));
      appendInlineMarkdown(quote,parts.join('\n'));root.append(quote);continue;
    }
    const paragraph=element('p'),parts=[line.trim()];index++;
    while(index<lines.length&&lines[index].trim()&&!/^(#{1,4})\s|^\s*(?:[-+*]|\d+\.)\s+|^```|^>\s?/.test(lines[index]))parts.push(lines[index++].trim());
    appendInlineMarkdown(paragraph,parts.join(' '));root.append(paragraph);
  }
  return root;
}

function appendMessage(role,text) {
  const row=element('div',`message ${role}`),label=element('div','message-label');
  label.append(element('span','mini-agent',role==='user'?'◉':'✳'),document.createTextNode(role==='user'?t('speaker.you'):state.backend==='demo'?t('speaker.demo'):t('speaker.reply')));
  const body=element('div','message-body');
  // 用户输入保持原样；Agent 回复按 Markdown 排版，效果与常见 GPT 对话界面一致。
  body.append(role==='assistant'?renderMarkdown(text):document.createTextNode(text));
  // Agent 回答提供复制按钮，便于研究者把参数建议或说明粘贴到实验记录中。
  if(role==='assistant'){
    const actions=element('div','message-actions'),copy=element('button','message-action',t('agent.copy'));copy.type='button';
    copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(messageText(body));copy.textContent=t('agent.copied');setTimeout(()=>copy.textContent=t('agent.copy'),1200);}catch{toast(t('toast.copyFailed'));}});
    actions.append(copy);row.append(label,body,actions);
  } else row.append(label,body);
  $('#messages').append(row);$('#messages').scrollTop=$('#messages').scrollHeight;
  return {row,body};
}

function messageText(body){return body.innerText||body.textContent||'';}

// 创建一个与 GPT 类似的等待状态。它占用最终回复所在的同一个消息气泡，
// 收到首个 SSE 文本片段后原地替换，避免界面额外出现一条“正在思考”消息。
function appendThinkingMessage() {
  const message=appendMessage('assistant','');
  message.row.classList.add('thinking');
  const indicator=element('div','thinking-indicator');
  indicator.append(element('span'),element('span'),element('span'),element('em','',t('agent.thinking')));
  message.body.replaceChildren(indicator);
  return message;
}

function updateAssistantMessage(message,text) {
  message.row.classList.remove('thinking');
  message.body.replaceChildren(renderMarkdown(text));
  $('#messages').scrollTop=$('#messages').scrollHeight;
}

// 解析 fetch 返回的 Server-Sent Events。每遇到一个完整事件就回调一次，
// 支持 Gin 输出的 message、error 和 done 三种事件以及跨网络分片的数据。
async function consumeSSE(response,onEvent) {
  if(!response.body)throw new Error(t('error.streamingUnsupported'));
  const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
  const dispatch=block=>{
    let event='message';const data=[];
    for(const line of block.split('\n')){
      if(line.startsWith('event:'))event=line.slice(6).trim();
      else if(line.startsWith('data:'))data.push(line.slice(5).replace(/^ /,''));
    }
    if(data.length)onEvent(event,data.join('\n'));
  };
  while(true){
    const {value,done}=await reader.read();
    buffer+=decoder.decode(value||new Uint8Array(),{stream:!done}).replace(/\r\n/g,'\n');
    let boundary;
    while((boundary=buffer.indexOf('\n\n'))>=0){const block=buffer.slice(0,boundary);buffer=buffer.slice(boundary+2);if(block.trim())dispatch(block);}
    if(done)break;
  }
  if(buffer.trim())dispatch(buffer);
}
function demoReply(question) {
  if(i18n.getLocale()==='en'){
    if(/quality|check/i.test(question))return `The current modality is **${state.mode}**. No real signal-quality analysis has been run yet.\n\nPlease verify:\n\n1. The main file and companion files are complete.\n2. Sampling rate and channel names match the acquisition record.\n3. Events and recording duration are correct.\n4. Run signal profiling before deciding on bad channels or artifacts.\n\nThis is a local demo response, not a model analysis result.`;
    if(/pipeline|step/i.test(question))return `The current **${state.mode}** template contains:\n\n${state.steps.filter(s=>s.enabled).map((s,i)=>`${i+1}. ${i18n.domain(s.name)}`).join('\n')}\n\nThese are editable example settings and have not been validated against the acquisition device or raw signal.`;
    return `I received your question: “${question}”\n\nThe app is using local demo responses. Connect the Go backend in Settings to use the language model.`;
  }
  if(/质量|检查/.test(question))return `当前为 ${state.mode} 模态。界面尚未解析文件，因此无法判断实际数据质量。\n\n你可以先核对：\n① 文件是否完整，配套文件是否齐全。\n② 采样率、通道名称与实验记录是否一致。\n③ 事件标记、时间轴和采集时长是否正确。\n④ 再基于实际信号检查坏道与伪迹。\n\n这是本地预设提示，并非大模型分析结果。`;
  if(/流程|步骤/.test(question))return `当前 ${state.mode} 模板启用了：\n\n${state.steps.filter(s=>s.enabled).map((s,i)=>`${i+1}. ${s.name}：${s.params.map(p=>p.join(' = ')).join('，')}`).join('\n')}\n\n这些是可编辑的示例配置，尚未按你的采集设备、实验设计或原始数据验证。演示运行只模拟步骤进度。`;
  return `已收到你的问题：“${question}”\n\n目前使用本地演示回复，尚未连接大模型。你可以让我“解释当前流程”或查看“质量检查建议”，也可以在连接设置中接入现有 Go 后端。\n\n真实的 ${state.mode} 文件解析与预处理需要后续接入分析服务。`;
}
async function sendMessage(text) {
  if(state.sending||!text.trim())return;
  text=text.trim();state.sending=true;$('#chat-input').value='';appendMessage('user',text);
  $('#send-message').textContent='■';$('#send-message').title=t('action.stop');$('#send-message').setAttribute('aria-label',t('action.stop'));
  const pending=appendThinkingMessage();let answer='',requestTimeout;state.streamController=new AbortController();
  try {
    if(state.backend==='demo') {
      await new Promise((resolve,reject)=>{const timer=setTimeout(resolve,450);state.streamController.signal.addEventListener('abort',()=>{clearTimeout(timer);reject(new DOMException('已停止','AbortError'));},{once:true});});
      answer=demoReply(text);updateAssistantMessage(pending,answer);
    }
    else {
      const meta=state.current?.inspection;
      // 明确标注证据边界：元数据可以回答通道数和采样率，但不能证明数据质量良好。
      const evidence=meta?`已由 ${meta.reader} 读取：格式=${meta.format}，模态=${meta.modality}，通道数=${meta.channel_count}，采样率=${meta.sampling_rate_hz} Hz，时长=${meta.duration_seconds.toFixed(3)} 秒，样本数=${meta.sample_count}，通道类型=${JSON.stringify(meta.channel_type_counts)}，标注数=${meta.annotation_count}，已标记坏道=${JSON.stringify(meta.bad_channels)}。dataset_id=${state.current.datasetId}。这些是文件元数据，尚未执行信号质量分析或预处理。`:`当前只有用户选择的模态 ${state.mode}，没有已解析的数据文件。`;
      requestTimeout=setTimeout(()=>state.streamController?.abort('timeout'),120000);
      const response=await fetch(`${state.url}/chatStream`,{method:'POST',headers:{'Content-Type':'application/json','Accept':'text/event-stream'},body:JSON.stringify({question:`[界面语言：${i18n.getLocale()==='en'?'English':'简体中文'}；请使用相同语言回答。]\n[数据上下文：${evidence}]\n${text}`,id:state.session,dataset_id:state.current?.datasetId||''}),signal:state.streamController.signal});
      if(!response.ok)throw new Error(t('error.backendHttp',{status:response.status}));
      let renderFrame=0,streamError='';
      await consumeSSE(response,(event,data)=>{
        if(event==='message'){
          answer+=data;
          // 将高频 token 合并到一帧渲染，减少 Markdown 重排造成的闪烁。
          if(!renderFrame)renderFrame=requestAnimationFrame(()=>{renderFrame=0;updateAssistantMessage(pending,answer);});
        } else if(event==='error') {
          try{streamError=JSON.parse(data).message||t('error.stream');}catch{streamError=data||t('error.stream');}
        }
      });
      clearTimeout(requestTimeout);
      if(renderFrame)cancelAnimationFrame(renderFrame);
      if(streamError)throw new Error(streamError);
      if(!answer.trim())throw new Error(t('error.empty'));
      updateAssistantMessage(pending,answer);
    }
  }catch(error){
    if(error.name==='AbortError')updateAssistantMessage(pending,answer||`*${t('agent.stopped')}*`);
    else updateAssistantMessage(pending,t('error.connection',{message:error.message}));
  }
  finally{clearTimeout(requestTimeout);state.sending=false;state.streamController=null;$('#send-message').textContent='↑';$('#send-message').title=t('action.send');$('#send-message').setAttribute('aria-label',t('action.send'));}
}
function download(data,name) { const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const anchor=element('a');anchor.href=url;anchor.download=name;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000); }
function configSnapshot(){return {schemaVersion:1,mode:state.mode,demo:true,processed:false,steps:clone(state.steps),exportedAt:new Date().toISOString()};}
async function runDemo(){
  if(state.running)return;const enabled=state.steps.filter(s=>s.enabled);if(!enabled.length)return;
  const snapshot=configSnapshot();state.running=true;renderPipeline();$('#run-button').textContent=t('run.running');
  for(let i=0;i<enabled.length;i++){ $('#run-title').textContent=t('run.step',{name:i18n.domain(enabled[i].name)});$('#run-progress').textContent=`${i+1} / ${enabled.length}`;$$('.step-index')[state.steps.indexOf(enabled[i])].textContent='↻';await new Promise(resolve=>setTimeout(resolve,850));$$('.step-index')[state.steps.indexOf(enabled[i])].textContent='✓'; }
  state.history.push({...snapshot,steps:snapshot.steps.filter(s=>s.enabled),time:new Date().toLocaleString(i18n.getLocale()==='en'?'en-US':'zh-CN')});state.running=false;renderPipeline();$('#run-title').textContent=t('run.completed');$('#run-subtitle').textContent=t('run.recorded');$('#run-progress').textContent=t('run.simulated');$('#run-button').textContent=t('run.again');renderLists();toast(t('run.finishedToast'));
}
function drawSignal(){
  const canvas=$('#signal-canvas');const width=canvas.clientWidth,height=canvas.clientHeight;if(!width)return;const ratio=window.devicePixelRatio||1;canvas.width=width*ratio;canvas.height=height*ratio;const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);const left=state.mode==='MEG'?62:35,right=14,top=9,bottom=22,plotWidth=width-left-right,rowHeight=(height-top-bottom)/8;
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height);ctx.font='8px Segoe UI';ctx.lineWidth=.6;
  for(let tick=0;tick<=10;tick++){const x=left+plotWidth*tick/10;ctx.strokeStyle='#edf1ee';ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,height-bottom);ctx.stroke();ctx.fillStyle='#a7b0aa';ctx.fillText(String(tick),x-2,height-5);}
  templates[state.mode].labels.forEach((label,index)=>{const y=top+rowHeight*(index+.5);ctx.fillStyle='#9aa79f';ctx.fillText(label,1,y+3);ctx.strokeStyle='#f2f5f3';ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(width-right,y);ctx.stroke();ctx.strokeStyle=state.processed?'#228575':'#719c8f';ctx.lineWidth=.85;ctx.beginPath();for(let pixel=0;pixel<=plotWidth;pixel++){const t=pixel/plotWidth*10;let amplitude=state.mode==='fNIRS'?Math.sin(t*1.7+index)*4+Math.sin(t*4+index)*1.7:Math.sin(t*15+index*2)*2.5+Math.sin(t*36+index)*1.6+Math.sin(t*68+index*4)*1.2;amplitude+=Math.sin(t*123+index)*.7;if(!state.processed&&state.mode!=='fNIRS')amplitude+=Math.exp(-((t-(3+index*.28))**2)/.015)*7;const value=y-amplitude*(state.processed?.65:1);if(pixel===0)ctx.moveTo(left+pixel,value);else ctx.lineTo(left+pixel,value);}ctx.stroke();});
}

// 为现有页面绑定翻译键。wrapOwnText 只包装元素自己的文字，不会破坏其中的图标、
// 计数徽章或开关。以后新增界面时可直接在 HTML 使用 data-i18n，无需添加到这里。
function bindI18n() {
  const wrapOwnText=(selector,key)=>{
    const node=$(selector);if(!node)return;
    const textNode=[...node.childNodes].find(child=>child.nodeType===Node.TEXT_NODE&&child.textContent.trim());
    if(!textNode)return;
    // i18n-text 用于区分“翻译文字”和导航图标，避免旧的图标宽度规则把中文挤成竖排。
    const span=element('span','i18n-text');span.dataset.i18n=key;textNode.replaceWith(span);
  };
  const bindText=(selector,key)=>{const node=$(selector);if(node)node.dataset.i18n=key;};
  const bindAttr=(selector,key,attribute)=>{const node=$(selector);if(node){node.dataset.i18n=key;node.dataset.i18nAttr=attribute;}};
  [
    ['.nav-item[data-view="workspace"]','nav.preprocessing'],['.nav-item[data-view="datasets"]','nav.datasets'],['.nav-item[data-view="history"]','nav.history'],['.settings-trigger.nav-item','nav.settings'],['.template-label','nav.templates'],
    ['.dataset-card .section-heading h2','section.dataset'],['.pipeline-card .section-heading h2','section.pipeline'],['.signal-card .section-heading h2','section.signal'],['.agent-context','view.context'],['.workspace>div','workspace.mine'],['.profile>div','profile.name']
  ].forEach(args=>wrapOwnText(...args));
  [
    ['.topbar-path .muted','nav.workspace'],['#page-title','view.title'],['.page-heading p','view.subtitle'],['#import-top','action.import'],['.mode-row .subtle','mode.keep'],['#change-file','action.choose'],['#reset-pipeline','action.reset'],['#export-config','action.export'],
    ['.metadata>div:nth-child(1)>span','meta.channels'],['.metadata>div:nth-child(2)>span','meta.rate'],['.metadata>div:nth-child(3)>span','meta.duration'],['.metadata>div:nth-child(4)>span','meta.format'],
    ['.signal-tabs [data-signal="raw"]','signal.raw'],['.signal-tabs [data-signal="processed"]','signal.processed'],['.chart-footer span:last-child','signal.time'],['[data-prompt]:nth-child(1)','prompt.pipeline'],['[data-prompt]:nth-child(2)','prompt.quality'],['.composer-footer span','chat.hint'],['.agent-footnote','chat.notice'],
    ['.workspace small','workspace.local'],['.local-card strong','privacy.title'],['.local-card p','privacy.body'],['.profile small','profile.space'],['.pipeline-description','pipeline.help'],['#signal-caption','signal.caption'],['.chart-footer span:first-child','signal.disclaimer'],['.note-card strong','note.title'],['.note-card p','note.body'],
    ['#run-title','run.ready'],['#run-subtitle','run.demo'],['#run-progress','run.estimate'],['#run-button','run.start'],['#datasets-view .section-heading h2','section.sessionData'],['#import-list','action.import'],['#datasets-view>p','datasets.note'],['#history-view .section-heading h2','nav.history'],['#history-view .pill','session.label'],
    ['#settings-form .section-heading h2','settings.title'],['#settings-form>p:not(.settings-note)','settings.description'],['#settings-form .settings-note','settings.note'],['#settings-form .field-label[for="backend-mode"]','settings.mode'],['#settings-form .field-label[for="backend-url"]','settings.url'],['#backend-mode option[value="demo"]','settings.demo'],['#backend-mode option[value="backend"]','settings.backend'],['#settings-form button[type="submit"]','action.save'],
    ['.sidebar>.nav-label:not(.template-label)','nav.workspace']
  ].forEach(args=>bindText(...args));
  bindAttr('#chat-input','chat.placeholder','placeholder');bindAttr('#theme-toggle','theme.switch','title');bindAttr('#send-message','action.send','aria-label');bindAttr('#close-settings','action.close','aria-label');
  i18n.apply();
}

function refreshLocale() {
  renderDataset();renderPipeline();renderLists();
  const active=$('.nav-item[data-view].active')?.dataset.view||'workspace';setView(active);
  $('#agent-mode').textContent=state.backend==='demo'?t('agent.demo'):t('agent.backend');
  setConnectionState(state.backend==='demo'?'demo':$('#backend-dot').dataset.status||'checking',state.backend==='demo'?t('status.demo'):t(`status.${$('#backend-dot').dataset.status||'checking'}`));
  $('#language-toggle').textContent=i18n.getLocale()==='en'?'中':'EN';
  document.title=i18n.getLocale()==='en'?'NeuroFlow · Neural Signal Workspace':'NeuroFlow · 神经信号工作台';
  const english=i18n.getLocale()==='en';
  $$('.segmented [data-mode] span').forEach(span=>{const key={EEG:'mode.eeg',MEG:'mode.meg',fNIRS:'mode.fnirs'}[span.parentElement.dataset.mode];span.hidden=english;span.textContent=t(key);});
  $$('.template[data-mode]').forEach(button=>{const textNode=[...button.childNodes].find(node=>node.nodeType===Node.TEXT_NODE&&node.textContent.trim());if(textNode){const key={EEG:'mode.eeg',MEG:'mode.meg',fNIRS:'mode.fnirs'}[button.dataset.mode];textNode.textContent=english?button.dataset.mode:`${button.dataset.mode} · ${t(key)}`;}});
  $$('.avatar').forEach(avatar=>avatar.textContent=english?'R':'研');
}
$$('[data-mode]').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.mode)));
$$('[data-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
for(const id of ['import-top','change-file','import-list'])$(`#${id}`).addEventListener('click',async()=>{
  if(globalThis.desktop?.selectFiles){const paths=await globalThis.desktop.selectFiles();await importPaths(paths);}
  else $('#file-input').click();
});
$('#file-input').addEventListener('change',event=>{importFiles(event.target.files);event.target.value='';});
document.addEventListener('dragover',event=>event.preventDefault());document.addEventListener('drop',event=>event.preventDefault());
$('#dropzone').addEventListener('dragover',event=>{event.preventDefault();$('#dropzone').classList.add('dragging');});$('#dropzone').addEventListener('dragleave',()=>$('#dropzone').classList.remove('dragging'));$('#dropzone').addEventListener('drop',event=>{event.preventDefault();$('#dropzone').classList.remove('dragging');importFiles(event.dataTransfer.files);});
$('#reset-pipeline').addEventListener('click',()=>{if(state.running)return toast(t('toast.resetWait'));const current=state.current;setMode(state.mode);state.current=current;renderDataset();toast(t('toast.resetDone'));});
$('#export-config').addEventListener('click',()=>download(configSnapshot(),`neuroflow-${state.mode}-pipeline.json`));
$('#run-button').addEventListener('click',runDemo);
$$('[data-signal]').forEach(button=>button.addEventListener('click',()=>{state.processed=button.dataset.signal==='processed';$$('[data-signal]').forEach(item=>item.classList.toggle('selected',item===button));drawSignal();}));
$('#chat-form').addEventListener('submit',event=>{event.preventDefault();if(state.sending){state.streamController?.abort();return;}sendMessage($('#chat-input').value);});
$('#chat-input').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();sendMessage(event.target.value);}});
$$('[data-prompt]').forEach(button=>button.addEventListener('click',()=>sendMessage(button.dataset.i18n?t(button.dataset.i18n):button.dataset.prompt)));
$$('.settings-trigger').forEach(button=>button.addEventListener('click',()=>{$('#backend-mode').value=state.backend;$('#backend-url').value=state.url;$('#settings-dialog').showModal();}));
$('#close-settings').addEventListener('click',()=>$('#settings-dialog').close());
async function checkBackend(){
  if(state.backend==='demo'){setConnectionState('demo',t('status.demo'));return;}
  setConnectionState('checking',t('status.checking'));
  try{const response=await fetch(`${state.url}/ping`,{signal:AbortSignal.timeout(4000)});if(!response.ok)throw new Error(`HTTP ${response.status}`);setConnectionState('online',t('status.online'));}
  catch{setConnectionState('offline',t('status.offline'));}
}
function setConnectionState(status,label){$('#connection-status').textContent=label;$('#backend-dot').dataset.status=status;}
$('#settings-form').addEventListener('submit',async event=>{event.preventDefault();if(state.sending)return toast(t('toast.wait'));state.backend=$('#backend-mode').value;state.url=$('#backend-url').value;state.session=globalThis.crypto?.randomUUID?.()||`session-${Date.now()}`;localStorage.setItem('neuroflow-connection',JSON.stringify({backend:state.backend,url:state.url}));$('#agent-mode').textContent=state.backend==='demo'?t('agent.demo'):t('agent.backend');$('#settings-dialog').close();await checkBackend();toast(t('toast.saved'));});

// 深浅主题和侧栏状态保存在本机，重启 Electron 后仍保持用户选择。
function applyAppearance(){const theme=localStorage.getItem('neuroflow-theme')||'light',collapsed=localStorage.getItem('neuroflow-sidebar')==='collapsed';document.documentElement.dataset.theme=theme;document.body.classList.toggle('sidebar-collapsed',collapsed);$('#theme-toggle').textContent=theme==='dark'?'☀':'☾';$('#sidebar-toggle').title=collapsed?t('sidebar.expand'):t('sidebar.collapse');}
$('#theme-toggle').addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';localStorage.setItem('neuroflow-theme',next);applyAppearance();});
$('#sidebar-toggle').addEventListener('click',()=>{const collapsed=!document.body.classList.contains('sidebar-collapsed');localStorage.setItem('neuroflow-sidebar',collapsed?'collapsed':'expanded');applyAppearance();requestAnimationFrame(drawSignal);});
$('#language-toggle').addEventListener('click',()=>i18n.setLocale(i18n.getLocale()==='en'?'zh-CN':'en'));
document.addEventListener('neuroflow:localechange',refreshLocale);
new ResizeObserver(drawSignal).observe($('#signal-canvas'));
try{const saved=JSON.parse(localStorage.getItem('neuroflow-connection')||'null');if(saved?.backend)state.backend=saved.backend;if(saved?.url)state.url=saved.url;}catch{}
bindI18n();applyAppearance();setMode('EEG');renderLists();refreshLocale();checkBackend();appendMessage('assistant',i18n.getLocale()==='en'?'Hello, I am the NeuroFlow assistant.\n\nImport an EEG, MEG, or fNIRS dataset to inspect its metadata, or ask me to explain the current pipeline. Signal preprocessing execution is still under development.':'你好，我是 NeuroFlow 助手。\n\n你可以导入 EEG、MEG 或 fNIRS 数据读取元数据，也可以让我解释当前流程。真实信号预处理执行能力仍在开发中。');
