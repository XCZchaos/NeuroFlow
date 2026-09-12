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
// key 与 Python/MNE 审计日志中的步骤 ID 一致。只有 executable=true 的步骤
// 会出现在真实 EEG 请求中；规划中的算法可以展示，但不能伪装成已经接入。
const stepKeyByName={'带通滤波':'bandpass_filter','工频陷波':'notch_filter','坏道检测':'bad_channel_detection','坏道插值':'bad_channel_interpolation','独立成分分析':'ica_artifact_removal','重参考':'reference_selection','重采样':'resample','事件分段':'epoching','基线校正':'baseline','Epoch 伪迹拒绝':'autoreject','传感器质量检查':'sensor_quality','环境噪声抑制':'maxwell_filter','生理伪迹审查':'physiological_artifacts','光强转光密度':'optical_density','通道质量检查':'channel_quality','运动伪迹校正':'motion_correction','血红蛋白浓度转换':'beer_lambert'};
const algorithmCatalog={
  EEG:[
    {key:'bad_channel_detection',name:'坏道检测',english:'Bad channel detection',params:[['方法','自动检测']],executable:true},
    {key:'bad_channel_interpolation',name:'坏道插值',english:'Bad channel interpolation',params:[['条件','需要电极坐标']],executable:true},
    {key:'notch_filter',name:'工频陷波',english:'Notch filter',params:[['频率 Hz','50']],executable:true},
    {key:'bandpass_filter',name:'带通滤波',english:'Band-pass filter',params:[['低频 Hz','0.5'],['高频 Hz','40']],executable:true},
    {key:'reference_selection',name:'重参考',english:'Re-reference',params:[['参考方式','平均参考']],executable:true},
    {key:'ica_artifact_removal',name:'独立成分分析',english:'ICA artifact review',params:[['算法','FastICA'],['成分数','20']],executable:true},
    {key:'resample',name:'重采样',english:'Resampling',params:[['目标 Hz','250']],executable:true},
    {key:'epoching',name:'事件分段',english:'Epoching',params:[['起点 s','-0.2'],['终点 s','0.8']],executable:true},
    {key:'baseline',name:'基线校正',english:'Baseline correction',params:[['区间','-0.2, 0']],executable:true},
    {key:'autoreject',name:'Epoch 伪迹拒绝',english:'Epoch rejection',params:[['阈值 μV','0']],executable:true}
  ],
  MEG:[],fNIRS:[]
};
const clone = value => JSON.parse(JSON.stringify(value));
const persistedSession=localStorage.getItem('neuroflow-session-id');
const persistedResponseMode=localStorage.getItem('neuroflow-response-mode')==='deep'?'deep':'quick';
const state = { mode:'EEG', responseMode:persistedResponseMode, steps:[], datasets:[], current:null, history:[], sessions:[], running:false, sending:false, processed:false, analysis:null, selectedChannel:null, singleChannel:false, signalWindow:{start:0,duration:10,preview:null,loading:false}, backend:'demo', url:'http://localhost:8819', session:persistedSession || globalThis.crypto?.randomUUID?.() || `session-${Date.now()}`, streamController:null };
localStorage.setItem('neuroflow-session-id',state.session);
let toastTimer;
function toast(message) { $('#toast').textContent = message; $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').hidden = true, 4000); }
function element(tag, className, text) { const node = document.createElement(tag); if(className) node.className=className; if(text !== undefined) node.textContent=text; return node; }
function setMode(mode) {
  if(state.running || state.sending) return toast(t('toast.waitSwitch'));
  state.mode=mode; state.steps=templates[mode].steps.map(([name,english,params]) => ({key:stepKeyByName[name]||name,name,english,params:clone(params),enabled:true,executable:mode==='EEG'}));
  state.current=state.datasets.find(item=>item.mode===mode)||null;
  $$('.segmented [data-mode]').forEach(button=>button.classList.toggle('selected',button.dataset.mode===mode));
  $('#context-mode').textContent=i18n.getLocale()==='en'?`${mode} preprocessing`:`${mode} 预处理`; state.processed=false;state.analysis=state.current?.analysis||null;state.selectedChannel=null;state.singleChannel=false;state.signalWindow={start:0,duration:10,preview:null,loading:false};
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
  const shownPreview=state.processed?state.analysis?.preview?.processed:(state.analysis?.preview?.raw||file?.preview);
  $('#signal-unit').textContent=t('signal.amplitude',{unit:shownPreview?.unit||template.unit});
  const processedTab=$('[data-signal="processed"]');if(processedTab)processedTab.disabled=!state.analysis?.preview?.processed;
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
    toggle.append(checkbox,element('span'));top.append(toggle);
    const actions=element('div','step-actions');[['↑','pipeline.moveUp',-1],['↓','pipeline.moveDown',1]].forEach(([symbol,label,direction])=>{const button=element('button','step-action',symbol);button.type='button';button.title=t(label);button.disabled=state.running||(direction<0?index===0:index===state.steps.length-1);button.addEventListener('click',()=>movePipelineStep(index,index+direction));actions.append(button);});const remove=element('button','step-action','×');remove.type='button';remove.title=t('pipeline.remove');remove.disabled=state.running;remove.addEventListener('click',()=>{state.steps.splice(index,1);renderPipeline();});actions.append(remove);top.append(actions);content.append(top);
    const params=element('div','step-params');
    step.params.forEach(param=>{const label=element('label','param-label',i18n.domain(param[0]));const input=element('input','param-input');input.value=i18n.domain(param[1]);input.maxLength=100;input.disabled=state.running;input.setAttribute('aria-label',`${i18n.domain(step.name)} ${i18n.domain(param[0])}`);input.addEventListener('input',()=>param[1]=input.value);label.append(input);params.append(label);});
    content.append(params);row.append(content);list.append(row);
  }); updateCount();
}
function updateCount() { const count=state.steps.filter(step=>step.enabled).length;$('#enabled-count').textContent=t('steps.enabled',{count});$('#step-count').textContent=t('steps.count',{count:state.steps.length});$('#run-button').disabled=state.running||!count; }
function setResponseMode(mode){state.responseMode=mode==='deep'?'deep':'quick';localStorage.setItem('neuroflow-response-mode',state.responseMode);$$('[data-response-mode]').forEach(button=>button.classList.toggle('selected',button.dataset.responseMode===state.responseMode));$('#response-mode-hint').textContent=t(state.responseMode==='deep'?'response.deepHint':'response.quickHint');}
function movePipelineStep(from,to){if(to<0||to>=state.steps.length||state.running)return;const [step]=state.steps.splice(from,1);state.steps.splice(to,0,step);renderPipeline();}
function renderAlgorithmLibrary(){const list=$('#algorithm-list');list.replaceChildren();const catalog=algorithmCatalog[state.mode]||[];if(!catalog.length){list.append(element('p','empty',i18n.getLocale()==='en'?'This modality currently uses its template; more executable steps are being integrated.':'当前模态暂时使用模板，更多可执行步骤仍在接入。'));return;}catalog.forEach(item=>{const exists=state.steps.some(step=>step.key===item.key),row=element('div','algorithm-option'),details=element('div');details.append(element('strong','',i18n.getLocale()==='en'?item.english:item.name),element('small','',item.executable?t('pipeline.available'):(i18n.getLocale()==='en'?'Planned · not executable':'规划中 · 尚不可执行')));const button=element('button','button light',exists?t('pipeline.added'):t('pipeline.add'));button.type='button';button.disabled=exists||!item.executable;button.addEventListener('click',()=>{state.steps.push({...clone(item),enabled:true});renderPipeline();renderAlgorithmLibrary();});row.append(details,button);list.append(row);});}
function formatBytes(bytes) { return bytes<1048576?`${(bytes/1024).toFixed(1)} KB`:`${(bytes/1048576).toFixed(1)} MB`; }
async function registerPath(path) {
  // 把本地路径交给本机 Go 服务。响应中只保留 dataset_id 和解析后的元数据。
  const response=await fetch(`${state.url}/datasets/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path}),signal:AbortSignal.timeout(35000)});
  const data=await response.json().catch(()=>({message:`HTTP ${response.status}`}));
  if(!response.ok)throw new Error(data.message||data.code||`HTTP ${response.status}`);
  return data;
}
async function ensureDatasetRegistration(item) {
  if(!item?.path)return item;
  // 后端注册表当前保存在内存中，Go 进程重启后旧 dataset_id 会失效。发送消息前
  // 先做一次轻量检查；仅在 404 时用用户原先选择的本地路径重新注册。
  if(item.datasetId){
    const check=await fetch(`${state.url}/datasets/${encodeURIComponent(item.datasetId)}`,{signal:AbortSignal.timeout(5000)}).catch(()=>null);
    if(check?.ok)return item;
    if(check&&check.status!==404)throw new Error(`HTTP ${check.status}`);
  }
  const record=await registerPath(item.path);
  item.datasetId=record.dataset_id;item.inspection=record.inspection;item.analysis=null;
  if(state.current===item){state.analysis=null;state.processed=false;}
  return item;
}
async function loadRawPreview(datasetId) {
  // 注册完成后立即读取最多 10 秒真实原始波形；这是只读预览，不会启动预处理。
  const response=await fetch(`${state.url}/datasets/${encodeURIComponent(datasetId)}/preview`,{signal:AbortSignal.timeout(45000)});
  const data=await response.json().catch(()=>({message:`HTTP ${response.status}`}));
  if(!response.ok)throw new Error(data.message||data.code||`HTTP ${response.status}`);
  return data;
}
async function importPaths(paths) {
  // 多选文件逐个注册：一种格式失败不会阻止其他文件继续导入。
  if(state.running)return toast(t('toast.waitImport'));
  if(state.backend!=='backend')return toast(t('toast.connectBackend'));
  let accepted=0; const failures=[],previewFailures=[];
  for(const path of paths) {
    try {
      const record=await registerPath(path), meta=record.inspection;
      // inspection 是 Python/MNE 已验证的数据；后面的界面和对话统一读取它。
      const item={name:meta.source_name,size:meta.source_size_bytes||0,modified:0,mode:meta.modality,datasetId:record.dataset_id,inspection:meta,path};
      state.datasets.push(item); accepted++;
      if(templates[meta.modality]&&state.mode!==meta.modality)setMode(meta.modality);
      state.current=item;state.analysis=null;state.processed=false;state.selectedChannel=null;state.singleChannel=false;state.signalWindow={start:0,duration:10,preview:null,loading:false};
      try{item.preview=await loadRawPreview(item.datasetId);}catch(error){previewFailures.push(`${item.name}: ${error.message}`);}
    } catch(error) { failures.push(error.message); }
  }
  renderDataset();renderLists();drawSignal();
  toast(accepted?`${t('toast.imported',{count:accepted})}${previewFailures.length?t('toast.previewFailed',{count:previewFailures.length}):''}${failures.length?t('toast.failedCount',{count:failures.length}):''}`:t('toast.readFailed',{error:failures[0]||(i18n.getLocale()==='en'?'Unknown error':'未知错误')}));
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
  state.datasets.forEach(file=>{const row=element('div','list-row'),details=element('div');details.append(element('strong','',file.name),element('p','',`${file.mode} · ${formatBytes(file.size)} · ${file.inspection?t('badge.parsed'):t('badge.pending')}`));const button=element('button','button light',t('action.open'));button.addEventListener('click',()=>{if(state.running||state.sending)return toast(i18n.getLocale()==='en'?'Wait for the current task to finish':'请等待当前任务结束');setMode(file.mode);state.current=file;state.analysis=file.analysis||null;state.processed=false;renderDataset();setView('workspace');drawSignal();});row.append(details,button);datasets.append(row);});
  const history=$('#history-list');history.replaceChildren();
  if(!state.history.length) history.append(element('p','empty',t('history.empty')));
  [...state.history].reverse().forEach(run=>{const row=element('div','list-row'),details=element('div'),comparison=run.result?.quality_comparison,degraded=run.result?.audit_log?.filter(item=>item.status==='degraded').length||0;const quality=comparison?t('history.quality',{before:Number(comparison.before.score).toFixed(1),after:Number(comparison.after.score).toFixed(1),degraded}):'';details.append(element('strong','',t(run.real?'history.realComplete':'history.complete',{mode:run.mode,count:run.steps.length})),element('p','',`${run.time} · ${run.real?`${quality} · ${run.output?.file_name||t('history.processed')}`:t('history.noProcessing')}`));const button=element('button','button light',run.real&&run.output?.relative_path?t('action.locate'):t('action.export'));button.addEventListener('click',()=>run.real&&run.output?.relative_path&&globalThis.desktop?.showOutput?globalThis.desktop.showOutput(run.output.relative_path).catch(error=>toast(error.message)):download(run,`neuroflow-${run.mode}-run.json`));row.append(details,button);history.append(row);});
	const sessions=$('#session-list');if(sessions){sessions.replaceChildren();if(!state.sessions.length)sessions.append(element('p','empty',t('session.empty')));state.sessions.forEach(item=>{const row=element('div',`list-row session-row${item.id===state.session?' current':''}`),details=element('div');details.append(element('strong','',item.title||t('session.untitled')),element('p','',`${item.dataset_id||t('session.noDataset')} · ${new Date(item.updated_at).toLocaleString()}`));const actions=element('div','session-actions'),open=element('button','button light',item.id===state.session?t('session.current'):t('session.open')),remove=element('button','button danger',t('session.delete'));open.disabled=item.id===state.session;open.addEventListener('click',()=>openSession(item.id));remove.addEventListener('click',()=>deleteSession(item.id));actions.append(open,remove);row.append(details,actions);sessions.append(row);});}
}
function setView(view) { for(const name of ['workspace','datasets','history','sessions'])$(`#${name}-view`).hidden=name!==view;$$('.nav-item[data-view]').forEach(button=>button.classList.toggle('active',button.dataset.view===view));const keys={workspace:'nav.preprocessing',datasets:'nav.datasets',history:'nav.history',sessions:'nav.sessions'};$('#breadcrumb').textContent=t(keys[view]);$('#page-title').textContent=view==='workspace'?t('view.title'):t(keys[view]);renderLists();if(view==='workspace')requestAnimationFrame(drawSignal); }

async function memoryRequest(path,options={}){const response=await fetch(`${state.url}${path}`,{headers:{'Content-Type':'application/json',...(options.headers||{})},...options});const data=response.status===204?null:await response.json().catch(()=>({message:`HTTP ${response.status}`}));if(!response.ok)throw new Error(data?.message||`HTTP ${response.status}`);return data;}
async function ensureSession(){if(state.backend!=='backend')return;await memoryRequest('/sessions',{method:'POST',body:JSON.stringify({id:state.session,title:t('session.untitled')})});await loadSessions();}
async function loadSessions(){if(state.backend!=='backend')return;const data=await memoryRequest('/sessions');state.sessions=data.sessions||[];renderLists();}
async function createSession(){if(state.sending)return toast(t('toast.wait'));const item=await memoryRequest('/sessions',{method:'POST',body:JSON.stringify({title:t('session.untitled')})});state.session=item.id;localStorage.setItem('neuroflow-session-id',state.session);$('#messages').replaceChildren();appendMessage('assistant',t('session.started'));await loadSessions();setView('workspace');}
async function openSession(id){if(state.sending)return toast(t('toast.wait'));const data=await memoryRequest(`/sessions/${encodeURIComponent(id)}/messages?limit=500`);state.session=id;localStorage.setItem('neuroflow-session-id',id);$('#messages').replaceChildren();(data.messages||[]).forEach(message=>appendMessage(message.role==='user'?'user':'assistant',message.content));if(!(data.messages||[]).length)appendMessage('assistant',t('session.started'));await loadSessions();setView('workspace');}
async function deleteSession(id){if(state.sending)return toast(t('toast.wait'));if(!confirm(t('session.confirmDelete')))return;await memoryRequest(`/sessions/${encodeURIComponent(id)}`,{method:'DELETE'});if(id===state.session){state.session=globalThis.crypto?.randomUUID?.()||`session-${Date.now()}`;localStorage.setItem('neuroflow-session-id',state.session);await ensureSession();$('#messages').replaceChildren();appendMessage('assistant',t('session.started'));}await loadSessions();}
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
    const fence=line.match(/^\s*(```|~~~)\s*([^\s`]*)?\s*$/);
    if(fence){
      const marker=fence[1],language=(fence[2]||'text').trim(),code=[];index++;
      while(index<lines.length&&!new RegExp(`^\\s*${marker}`).test(lines[index]))code.push(lines[index++]);
      const closed=index<lines.length;if(closed)index++;
      const block=element('div',`code-block${closed?'':' streaming'}`),toolbar=element('div','code-toolbar'),pre=element('pre'),codeNode=element('code','',code.join('\n'));
      const languageLabel=element('span','code-language',language||'text'),copy=element('button','code-copy',t('agent.copyCode'));copy.type='button';
      copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(codeNode.textContent);copy.textContent=t('agent.copied');setTimeout(()=>copy.textContent=t('agent.copyCode'),1200);}catch{toast(t('toast.copyFailed'));}});
      toolbar.append(languageLabel,copy);pre.append(codeNode);block.append(toolbar,pre);root.append(block);continue;
    }
    const heading=line.match(/^(#{1,4})\s+(.+)$/);
    // 聊天气泡使用统一的紧凑标题节点，避免页面级 h1/h2 样式把回答撑得忽大忽小。
    if(heading){const node=element('div',`markdown-heading level-${heading[1].length}`);appendInlineMarkdown(node,heading[2]);root.append(node);index++;continue;}
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
    while(index<lines.length&&lines[index].trim()&&!/^(#{1,4})\s|^\s*(?:[-+*]|\d+\.)\s+|^\s*(?:```|~~~)|^>\s?/.test(lines[index]))parts.push(lines[index++].trim());
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

// 只有用户明确要求执行信号处理时才显示操作进度，普通知识问答仍使用简洁的思考状态。
// 这些状态表示当前请求所处阶段；最终是否真正执行，以后端生成的新 analysis_id 为准。
function isAgentOperationRequest(text){return /预处理|滤波|陷波|重参考|坏道|插值|去伪迹|伪迹|\bICA\b|保存.{0,8}(文件|结果)|运行.{0,6}(流程|处理)|执行.{0,8}(分析|处理)|preprocess|filter|notch|bad channel|artifact|save.{0,12}(file|result)|run.{0,8}(pipeline|analysis)/i.test(text);}
function showAgentOperationProgress(message,hasDataset){
  const labels=hasDataset?[t('agent.progressPlan'),t('agent.progressRead'),t('agent.progressExecute'),t('agent.progressFinalize')]:[t('agent.progressPlan'),t('agent.progressAwaitDataset')];
  const panel=element('div','agent-operation'),title=element('div','agent-operation-title'),list=element('div','agent-operation-steps');
  title.append(element('span','agent-operation-spinner'),document.createTextNode(t('agent.operating')));panel.append(title,list);message.body.replaceChildren(panel);
  let active=0;
  const paint=()=>{list.replaceChildren(...labels.map((label,index)=>{const row=element('div',`agent-operation-step ${index<active?'done':index===active?'active':'pending'}`);row.append(element('span','operation-state',index<active?'✓':index===active?'●':'○'),document.createTextNode(label));return row;}));$('#messages').scrollTop=$('#messages').scrollHeight;};
  paint();const timer=setInterval(()=>{if(active<labels.length-1){active++;paint();}},hasDataset?2600:1800);
  return ()=>clearInterval(timer);
}
function appendAgentOutcome(message,result,expectedOperation){
  if(!expectedOperation)return;
  const success=Boolean(result),card=element('div',`agent-outcome ${success?'success':'warning'}`),heading=element('div','agent-outcome-heading');
  heading.append(element('span','agent-outcome-icon',success?'✓':'!'),document.createTextNode(t(success?'agent.operationComplete':'agent.operationUnverified')));card.append(heading);
  if(success){
    const output=result.output||{},comparison=result.result?.quality_comparison||result.quality_comparison;
    card.append(element('p','',output.file_name?t('agent.outputSaved',{name:output.file_name}):t('agent.outputMemory')));
    if(comparison?.before?.score!==undefined&&comparison?.after?.score!==undefined)card.append(element('p','',t('agent.qualityResult',{before:Number(comparison.before.score).toFixed(1),after:Number(comparison.after.score).toFixed(1)})));
    card.append(element('p','',t('agent.previewReady')));
  }else card.append(element('p','',t('agent.noNewResult')));
  message.body.append(card);$('#messages').scrollTop=$('#messages').scrollHeight;
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
  const chatDataset=state.current,previousAnalysisId=chatDataset?.analysis?.analysis_id||null;
  text=text.trim();const expectedOperation=isAgentOperationRequest(text);state.sending=true;$('#chat-input').value='';appendMessage('user',text);
  $('#send-message').textContent='■';$('#send-message').title=t('action.stop');$('#send-message').setAttribute('aria-label',t('action.stop'));
  const pending=appendThinkingMessage();let answer='',requestTimeout,stopOperationProgress=()=>{};state.streamController=new AbortController();
  if(expectedOperation)stopOperationProgress=showAgentOperationProgress(pending,Boolean(chatDataset?.datasetId));
  try {
    if(state.backend==='demo') {
      await new Promise((resolve,reject)=>{const timer=setTimeout(resolve,450);state.streamController.signal.addEventListener('abort',()=>{clearTimeout(timer);reject(new DOMException('已停止','AbortError'));},{once:true});});
      answer=demoReply(text);updateAssistantMessage(pending,answer);
    }
    else {
      await ensureDatasetRegistration(chatDataset);
      const meta=state.current?.inspection;
      // 明确标注证据边界：元数据可以回答通道数和采样率，但不能证明数据质量良好。
      const evidence=meta?`已由 ${meta.reader} 读取：格式=${meta.format}，模态=${meta.modality}，通道数=${meta.channel_count}，采样率=${meta.sampling_rate_hz} Hz，时长=${meta.duration_seconds.toFixed(3)} 秒，样本数=${meta.sample_count}，通道类型=${JSON.stringify(meta.channel_type_counts)}，标注数=${meta.annotation_count}，已标记坏道=${JSON.stringify(meta.bad_channels)}。dataset_id=${state.current.datasetId}。这些是文件元数据，尚未执行信号质量分析或预处理。`:`当前只有用户选择的模态 ${state.mode}，没有已解析的数据文件。`;
      requestTimeout=setTimeout(()=>state.streamController?.abort('timeout'),120000);
      const response=await fetch(`${state.url}/chatStream`,{method:'POST',headers:{'Content-Type':'application/json','Accept':'text/event-stream'},body:JSON.stringify({question:`[界面语言：${i18n.getLocale()==='en'?'English':'简体中文'}；请使用相同语言回答。]\n[数据上下文：${evidence}]\n${text}`,id:state.session,dataset_id:state.current?.datasetId||'',response_mode:state.responseMode}),signal:state.streamController.signal});
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
  finally{
    clearTimeout(requestTimeout);stopOperationProgress();state.sending=false;state.streamController=null;$('#send-message').textContent='↑';$('#send-message').title=t('action.send');$('#send-message').setAttribute('aria-label',t('action.send'));
    // Agent 工具在服务端执行，SSE 正文不会携带大体积波形；回答结束后用
    // dataset_id 查询一次最新结果，只有 analysis_id 变化才刷新画布。
    let operationResult=null;
    if(state.backend==='backend'&&chatDataset?.datasetId)operationResult=await syncLatestAgentAnalysis(chatDataset,previousAnalysisId);
	// 成功产生分析结果时展示独立结果卡。失败原因已经由 Agent 或连接错误正文说明，
	// 不再追加第二张“未检测到结果”卡，避免用户看到两个含义不清的错误提示。
	if(operationResult)appendAgentOutcome(pending,operationResult,true);
	if(state.backend==='backend')loadSessions().catch(()=>{});
  }
}
function download(data,name) { const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const anchor=element('a');anchor.href=url;anchor.download=name;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000); }
function activeSignalPreview(){if(state.signalWindow.preview)return state.signalWindow.preview;return state.processed?state.analysis?.preview?.processed:(state.analysis?.preview?.raw||state.current?.preview);}
function formatSignalValue(value,unit){if(!Number.isFinite(value))return '—';const absolute=Math.abs(value);const digits=absolute>=100?2:absolute>=1?3:5;return `${value.toFixed(digits)} ${unit}`;}
function renderChannelDetail(preview){
  const select=$('#channel-select'),button=$('#export-channel'),names=preview?.available_channel_names||preview?.channel_names||[],data=preview?.data||[];
  if(!names.length||!data.length){select.replaceChildren(element('option','', '—'));select.disabled=true;button.disabled=true;$('#channel-source').textContent=t('channel.awaiting');for(const id of ['samples','rate','min','max','mean','rms'])$(`#channel-${id}`).textContent='—';return;}
  if(state.singleChannel&&!names.includes(state.selectedChannel))state.selectedChannel=names[0];
  const optionNames=['__all__',...names];if(select.options.length!==optionNames.length||[...select.options].some((option,index)=>option.value!==optionNames[index])){select.replaceChildren(...optionNames.map(name=>{const option=element('option','',name==='__all__'?t('channel.all'):name);option.value=name;return option;}));}
  select.value=state.singleChannel?state.selectedChannel:'__all__';select.disabled=false;button.disabled=!state.singleChannel;
  if(!state.singleChannel){$('#channel-source').textContent=t('channel.choose');for(const id of ['samples','rate','min','max','mean','rms'])$(`#channel-${id}`).textContent='—';return;}
  const index=(preview.channel_names||[]).indexOf(state.selectedChannel),values=(data[index]||[]).map(Number).filter(Number.isFinite),unit=preview.unit||'';
  const mean=values.length?values.reduce((sum,value)=>sum+value,0)/values.length:NaN;
  const rms=values.length?Math.sqrt(values.reduce((sum,value)=>sum+value*value,0)/values.length):NaN;
  $('#channel-source').textContent=t(state.processed?'channel.processedSource':'channel.rawSource',{name:state.selectedChannel});
  $('#channel-samples').textContent=String(values.length);$('#channel-rate').textContent=`${Number(preview.sample_rate_hz).toFixed(2)} Hz`;
  $('#channel-min').textContent=formatSignalValue(Math.min(...values),unit);$('#channel-max').textContent=formatSignalValue(Math.max(...values),unit);$('#channel-mean').textContent=formatSignalValue(mean,unit);$('#channel-rms').textContent=formatSignalValue(rms,unit);
}
async function loadSignalWindow(){
  if(!state.current?.datasetId||state.signalWindow.loading)return;
  state.signalWindow.loading=true;
  const source=state.processed?'processed':'raw',channel=state.singleChannel?state.selectedChannel:'';
  const query=new URLSearchParams({source,start:String(state.signalWindow.start),duration:String(state.signalWindow.duration)});if(channel)query.set('channel',channel);
  try{
    const response=await fetch(`${state.url}/datasets/${encodeURIComponent(state.current.datasetId)}/signal?${query}`,{signal:AbortSignal.timeout(45000)}),data=await response.json();
    if(!response.ok)throw new Error(data.message||`HTTP ${response.status}`);
    state.signalWindow.preview=data;state.signalWindow.start=Number(data.start_seconds)||0;drawSignal();
  }catch(error){toast(t('signal.windowFailed',{message:error.message}));}
  finally{state.signalWindow.loading=false;}
}
function updateSignalNavigation(preview){
  const total=state.current?.inspection?.duration_seconds||0,slider=$('#signal-position'),enabled=Boolean(state.current?.datasetId&&preview);
  state.signalWindow.duration=Math.min(state.signalWindow.duration,total||state.signalWindow.duration);
  const max=Math.max(0,total-state.signalWindow.duration);state.signalWindow.start=Math.min(state.signalWindow.start,max);
  slider.disabled=!enabled;slider.max=String(max);slider.value=String(state.signalWindow.start);$('#signal-zoom-in').disabled=!enabled||state.signalWindow.duration<=.5;$('#signal-zoom-out').disabled=!enabled||state.signalWindow.duration>=Math.min(120,total||120);
  $('#signal-window-label').textContent=`${state.signalWindow.start.toFixed(1)}–${(state.signalWindow.start+state.signalWindow.duration).toFixed(1)} s`;
}
function exportSelectedChannel(){
  const preview=activeSignalPreview(),index=preview?.channel_names?.indexOf(state.selectedChannel);if(index===undefined||index<0)return;
  const rate=Number(preview.sample_rate_hz),values=preview.data[index]||[],rows=['time_seconds,value,unit'];
  values.forEach((value,sample)=>rows.push(`${(sample/rate).toFixed(8)},${value},${preview.unit||''}`));
  const url=URL.createObjectURL(new Blob([`\uFEFF${rows.join('\n')}`],{type:'text/csv;charset=utf-8'})),anchor=element('a');anchor.href=url;anchor.download=`${state.current?.name||state.mode}-${state.selectedChannel}-${state.processed?'processed':'raw'}.csv`;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function configSnapshot(){return {schemaVersion:1,mode:state.mode,demo:!state.current?.datasetId,processed:Boolean(state.analysis),datasetId:state.current?.datasetId||null,steps:clone(state.steps),exportedAt:new Date().toISOString()};}
async function syncLatestAgentAnalysis(dataset,previousAnalysisId){
  try{
    const response=await fetch(`${state.url}/datasets/${encodeURIComponent(dataset.datasetId)}/analysis/latest`,{signal:AbortSignal.timeout(10000)});
    if(response.status===404)return null;
    const result=await response.json();if(!response.ok||!result.analysis_id||result.analysis_id===previousAnalysisId)return null;
    dataset.analysis=result;
    if(state.current!==dataset)return result;
    state.analysis=result;state.processed=true;state.selectedChannel=null;state.singleChannel=false;state.signalWindow={start:0,duration:10,preview:null,loading:false};
    $$('[data-signal]').forEach(item=>item.classList.toggle('selected',item.dataset.signal==='processed'));
    const snapshot=configSnapshot();state.history.push({...snapshot,real:true,agentTriggered:true,result:result.result,selection:result.selection,output:result.output,steps:snapshot.steps.filter(step=>step.enabled),time:new Date().toLocaleString(i18n.getLocale()==='en'?'en-US':'zh-CN')});
    renderDataset();drawSignal();renderLists();toast(t('agent.waveformUpdated'));return result;
  }catch(error){console.warn('Unable to synchronize Agent waveform',error);return null;}
}
function numericPipelineParameter(stepName,paramName,fallback){const step=state.steps.find(item=>item.name===stepName&&item.enabled);const value=step?.params.find(item=>item[0]===paramName)?.[1];const number=Number.parseFloat(value);return Number.isFinite(number)?number:fallback;}
// 区间参数允许用户输入“-0.2, 0”或“-0.2，0”。解析失败时使用经过验证的默认值，
// 后端仍会再次校验区间是否位于 epoch 内，避免只依赖界面校验。
function intervalPipelineParameter(stepName,paramName,fallback){const step=state.steps.find(item=>item.name===stepName&&item.enabled);const value=step?.params.find(item=>item[0]===paramName)?.[1];const numbers=String(value??'').split(/[,，]/).map(item=>Number.parseFloat(item.trim()));return numbers.length===2&&numbers.every(Number.isFinite)?numbers:fallback;}
async function requestAnalysis(){
  const body={analysis_type:'full',start_seconds:0,end_seconds:0,save_output:$('#save-output').checked};
  if(state.mode==='EEG'){
    body.highpass_hz=numericPipelineParameter('带通滤波','低频 Hz',1);
    body.lowpass_hz=numericPipelineParameter('带通滤波','高频 Hz',45);
    body.notch_hz=numericPipelineParameter('工频陷波','频率 Hz',50);
	body.resample_hz=numericPipelineParameter('重采样','目标 Hz',250);
	body.epoch_tmin=numericPipelineParameter('事件分段','起点 s',-.2);
	body.epoch_tmax=numericPipelineParameter('事件分段','终点 s',.8);
	[body.baseline_start,body.baseline_end]=intervalPipelineParameter('基线校正','区间',[-.2,0]);
	body.epoch_reject_uv=numericPipelineParameter('Epoch 伪迹拒绝','阈值 μV',0);
	body.enabled_steps=state.steps.filter(step=>step.enabled&&step.executable).map(step=>step.key);
  }
  const response=await fetch(`${state.url}/datasets/${encodeURIComponent(state.current.datasetId)}/analyze`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await response.json().catch(()=>({message:`HTTP ${response.status}`}));
  if(!response.ok)throw new Error(data.message||data.code||`HTTP ${response.status}`);
  return data;
}
async function runDemo(){
  if(state.running)return;const enabled=state.steps.filter(s=>s.enabled);if(!enabled.length)return;
  const snapshot=configSnapshot();state.running=true;renderPipeline();$('#run-button').textContent=t('run.running');
  for(let i=0;i<enabled.length;i++){ $('#run-title').textContent=t('run.step',{name:i18n.domain(enabled[i].name)});$('#run-progress').textContent=`${i+1} / ${enabled.length}`;$$('.step-index')[state.steps.indexOf(enabled[i])].textContent='↻';await new Promise(resolve=>setTimeout(resolve,850));$$('.step-index')[state.steps.indexOf(enabled[i])].textContent='✓'; }
  state.history.push({...snapshot,steps:snapshot.steps.filter(s=>s.enabled),time:new Date().toLocaleString(i18n.getLocale()==='en'?'en-US':'zh-CN')});state.running=false;renderPipeline();$('#run-title').textContent=t('run.completed');$('#run-subtitle').textContent=t('run.recorded');$('#run-progress').textContent=t('run.simulated');$('#run-button').textContent=t('run.again');renderLists();toast(t('run.finishedToast'));
}
async function runPipeline(){
  if(state.running)return;
  const enabled=state.steps.filter(step=>step.enabled);if(!enabled.length)return;
  if(state.backend!=='backend'||!state.current?.datasetId)return runDemo();
  const willSave=$('#save-output').checked;state.running=true;$('#save-output').disabled=true;renderPipeline();$('#run-button').textContent=t('run.processing');$('#run-title').textContent=t('run.processingData');$('#run-subtitle').textContent=t(willSave?'run.processingHint':'run.processingMemoryHint');$('#run-progress').textContent=t('run.wait');
  try{
    const result=await requestAnalysis();state.analysis=result;state.current.analysis=result;state.processed=true;state.singleChannel=false;state.signalWindow={start:0,duration:10,preview:null,loading:false};
    $$('[data-signal]').forEach(item=>item.classList.toggle('selected',item.dataset.signal==='processed'));
    const snapshot=configSnapshot();state.history.push({...snapshot,real:true,result:result.result,selection:result.selection,output:result.output,steps:snapshot.steps.filter(step=>step.enabled),time:new Date().toLocaleString(i18n.getLocale()==='en'?'en-US':'zh-CN')});
    $('#run-title').textContent=t('run.realCompleted');$('#run-subtitle').textContent=result.output?.saved?(result.output.file_name||t('run.saved')):t('run.memoryOnly');$('#run-progress').textContent=t('run.realResult');toast(t(result.output?.saved?'run.realToast':'run.memoryToast'));renderDataset();drawSignal();renderLists();
  }catch(error){$('#run-title').textContent=t('run.failed');$('#run-subtitle').textContent=error.message;$('#run-progress').textContent=t('run.noOutput');toast(t('run.failedToast',{message:error.message}));}
  finally{state.running=false;$('#save-output').disabled=false;renderPipeline();$('#run-button').textContent=t('run.runAgain');}
}
function drawSignal(){
  const canvas=$('#signal-canvas');const preview=activeSignalPreview();const series=preview?.data;const labels=preview?.channel_names||templates[state.mode].labels;const channelCount=Math.max(1,Math.min(8,series?.length||labels.length));const width=canvas.clientWidth,height=canvas.clientHeight;if(!width)return;const ratio=window.devicePixelRatio||1;canvas.width=width*ratio;canvas.height=height*ratio;const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);const left=state.mode==='MEG'?62:45,right=14,top=9,bottom=22,plotWidth=width-left-right,rowHeight=(height-top-bottom)/channelCount;
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height);ctx.font='8px Segoe UI';ctx.lineWidth=.6;
  const duration=series?.[0]?.length&&preview.sample_rate_hz?series[0].length/preview.sample_rate_hz:10,startTime=Number(preview?.start_seconds)||0;
  for(let tick=0;tick<=10;tick++){const x=left+plotWidth*tick/10;ctx.strokeStyle='#edf1ee';ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,height-bottom);ctx.stroke();ctx.fillStyle='#a7b0aa';ctx.fillText((startTime+duration*tick/10).toFixed(duration<10?1:0),x-2,height-5);}
  labels.slice(0,channelCount).forEach((label,index)=>{const y=top+rowHeight*(index+.5);ctx.fillStyle='#9aa79f';ctx.fillText(label,1,y+3);ctx.strokeStyle='#f2f5f3';ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(width-right,y);ctx.stroke();const selected=Boolean(preview)&&label===state.selectedChannel;ctx.strokeStyle=selected?'#0b6657':state.processed?'#52a18d':'#8bb0a5';ctx.lineWidth=selected?1.8:.72;ctx.globalAlpha=preview&&!selected?.48:1;ctx.beginPath();if(series?.[index]?.length){const values=series[index];const center=values.reduce((sum,value)=>sum+value,0)/values.length;const peak=Math.max(...values.map(value=>Math.abs(value-center)),Number.EPSILON);values.forEach((value,sample)=>{const x=left+plotWidth*sample/Math.max(1,values.length-1),point=y-(value-center)/peak*rowHeight*.36;if(sample===0)ctx.moveTo(x,point);else ctx.lineTo(x,point);});}else{for(let pixel=0;pixel<=plotWidth;pixel++){const time=pixel/plotWidth*10;let amplitude=state.mode==='fNIRS'?Math.sin(time*1.7+index)*4+Math.sin(time*4+index)*1.7:Math.sin(time*15+index*2)*2.5+Math.sin(time*36+index)*1.6+Math.sin(time*68+index*4)*1.2;amplitude+=Math.sin(time*123+index)*.7;if(!state.processed&&state.mode!=='fNIRS')amplitude+=Math.exp(-((time-(3+index*.28))**2)/.015)*7;const point=y-amplitude*(state.processed?.65:1);if(pixel===0)ctx.moveTo(left+pixel,point);else ctx.lineTo(left+pixel,point);}}ctx.stroke();});
  $('#signal-caption').textContent=preview?t('signal.realCaption',{count:channelCount,duration:duration.toFixed(1)}):t('signal.caption');$('#signal-unit').textContent=t('signal.amplitude',{unit:preview?.unit||templates[state.mode].unit});$('.signal-card .pill').textContent=preview?t('badge.real'):t('badge.synthetic');$('.chart-footer span:first-child').textContent=preview?t('signal.realDisclaimer'):t('signal.disclaimer');
  canvas.setAttribute('aria-label',preview?t(state.processed?'signal.processedAria':'signal.rawAria'):t('signal.syntheticAria'));
  renderChannelDetail(preview);
  updateSignalNavigation(preview);
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
    ['.nav-item[data-view="workspace"]','nav.preprocessing'],['.nav-item[data-view="datasets"]','nav.datasets'],['.nav-item[data-view="history"]','nav.history'],['.nav-item[data-view="sessions"]','nav.sessions'],['.settings-trigger.nav-item','nav.settings'],['.template-label','nav.templates'],
    ['.dataset-card .section-heading h2','section.dataset'],['.pipeline-card .section-heading h2','section.pipeline'],['.signal-card .section-heading h2','section.signal'],['.agent-context','view.context'],['.workspace>div','workspace.mine'],['.profile>div','profile.name']
  ].forEach(args=>wrapOwnText(...args));
  [
    ['.topbar-path .muted','nav.workspace'],['#page-title','view.title'],['.page-heading p','view.subtitle'],['#import-top','action.import'],['.mode-row .subtle','mode.keep'],['#change-file','action.choose'],['#reset-pipeline','action.reset'],['#export-config','action.export'],
    ['.metadata>div:nth-child(1)>span','meta.channels'],['.metadata>div:nth-child(2)>span','meta.rate'],['.metadata>div:nth-child(3)>span','meta.duration'],['.metadata>div:nth-child(4)>span','meta.format'],
    ['.signal-tabs [data-signal="raw"]','signal.raw'],['.signal-tabs [data-signal="processed"]','signal.processed'],['.chart-footer span:last-child','signal.time'],['[data-prompt]:nth-child(1)','prompt.pipeline'],['[data-prompt]:nth-child(2)','prompt.quality'],['[data-response-mode="quick"]','response.quick'],['[data-response-mode="deep"]','response.deep'],['.composer-footer span:nth-child(2)','chat.hint'],['.agent-footnote','chat.notice'],
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
	setResponseMode(state.responseMode);
  document.title=i18n.getLocale()==='en'?'NeuroFlow · Neural Signal Workspace':'NeuroFlow · 神经信号工作台';
  const english=i18n.getLocale()==='en';
  $$('.segmented [data-mode] span').forEach(span=>{const key={EEG:'mode.eeg',MEG:'mode.meg',fNIRS:'mode.fnirs'}[span.parentElement.dataset.mode];span.hidden=english;span.textContent=t(key);});
  $$('.template[data-mode]').forEach(button=>{const textNode=[...button.childNodes].find(node=>node.nodeType===Node.TEXT_NODE&&node.textContent.trim());if(textNode){const key={EEG:'mode.eeg',MEG:'mode.meg',fNIRS:'mode.fnirs'}[button.dataset.mode];textNode.textContent=english?button.dataset.mode:`${button.dataset.mode} · ${t(key)}`;}});
  $$('.avatar').forEach(avatar=>avatar.textContent=english?'R':'研');
}
$$('[data-mode]').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.mode)));
$$('[data-response-mode]').forEach(button=>button.addEventListener('click',()=>{if(!state.sending)setResponseMode(button.dataset.responseMode);}));
$$('[data-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
for(const id of ['import-top','change-file','import-list'])$(`#${id}`).addEventListener('click',async()=>{
  if(globalThis.desktop?.selectFiles){const paths=await globalThis.desktop.selectFiles();await importPaths(paths);}
  else $('#file-input').click();
});
$('#file-input').addEventListener('change',event=>{importFiles(event.target.files);event.target.value='';});
document.addEventListener('dragover',event=>event.preventDefault());document.addEventListener('drop',event=>event.preventDefault());
$('#dropzone').addEventListener('dragover',event=>{event.preventDefault();$('#dropzone').classList.add('dragging');});$('#dropzone').addEventListener('dragleave',()=>$('#dropzone').classList.remove('dragging'));$('#dropzone').addEventListener('drop',event=>{event.preventDefault();$('#dropzone').classList.remove('dragging');importFiles(event.dataTransfer.files);});
$('#reset-pipeline').addEventListener('click',()=>{if(state.running)return toast(t('toast.resetWait'));const current=state.current;setMode(state.mode);state.current=current;renderDataset();toast(t('toast.resetDone'));});
$('#add-pipeline-step').addEventListener('click',()=>{if(state.running)return toast(t('toast.wait'));renderAlgorithmLibrary();$('#algorithm-dialog').showModal();});
$('#close-algorithms').addEventListener('click',()=>$('#algorithm-dialog').close());
$('#export-config').addEventListener('click',()=>download(configSnapshot(),`neuroflow-${state.mode}-pipeline.json`));
$('#run-button').addEventListener('click',runPipeline);
$$('[data-signal]').forEach(button=>button.addEventListener('click',()=>{if(button.dataset.signal==='processed'&&!state.analysis?.preview?.processed)return toast(t('toast.runForProcessed'));state.processed=button.dataset.signal==='processed';state.signalWindow.preview=null;state.signalWindow.start=0;$$('[data-signal]').forEach(item=>item.classList.toggle('selected',item===button));drawSignal();renderDataset();if(state.singleChannel)loadSignalWindow();}));
$('#channel-select').addEventListener('change',event=>{state.singleChannel=event.target.value!=='__all__';state.selectedChannel=state.singleChannel?event.target.value:null;state.signalWindow.preview=null;loadSignalWindow();});
$('#export-channel').addEventListener('click',exportSelectedChannel);
$('#signal-canvas').addEventListener('click',event=>{const preview=activeSignalPreview(),names=preview?.channel_names||[];if(!names.length)return;const rect=event.currentTarget.getBoundingClientRect(),index=Math.max(0,Math.min(names.length-1,Math.floor((event.clientY-rect.top)/rect.height*names.length)));state.selectedChannel=names[index];state.singleChannel=true;state.signalWindow.preview=null;loadSignalWindow();});
let signalSlideTimer;$('#signal-position').addEventListener('input',event=>{state.signalWindow.start=Number(event.target.value);$('#signal-window-label').textContent=`${state.signalWindow.start.toFixed(1)}–${(state.signalWindow.start+state.signalWindow.duration).toFixed(1)} s`;clearTimeout(signalSlideTimer);signalSlideTimer=setTimeout(()=>{state.signalWindow.preview=null;loadSignalWindow();},180);});
$('#signal-zoom-in').addEventListener('click',()=>{state.signalWindow.duration=Math.max(.5,state.signalWindow.duration/2);state.signalWindow.preview=null;loadSignalWindow();});
$('#signal-zoom-out').addEventListener('click',()=>{const total=state.current?.inspection?.duration_seconds||120;state.signalWindow.duration=Math.min(120,total,state.signalWindow.duration*2);state.signalWindow.preview=null;loadSignalWindow();});
$('#chat-form').addEventListener('submit',event=>{event.preventDefault();if(state.sending){state.streamController?.abort();return;}sendMessage($('#chat-input').value);});
$('#chat-input').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();sendMessage(event.target.value);}});
$$('[data-prompt]').forEach(button=>button.addEventListener('click',()=>sendMessage(button.dataset.i18n?t(button.dataset.i18n):button.dataset.prompt)));
$$('.settings-trigger').forEach(button=>button.addEventListener('click',()=>{$('#backend-mode').value=state.backend;$('#backend-url').value=state.url;$('#settings-dialog').showModal();}));
$('#close-settings').addEventListener('click',()=>$('#settings-dialog').close());
async function checkBackend(){
  if(state.backend==='demo'){setConnectionState('demo',t('status.demo'));return;}
  setConnectionState('checking',t('status.checking'));
  try{const response=await fetch(`${state.url}/ping`,{signal:AbortSignal.timeout(4000)});if(!response.ok)throw new Error(`HTTP ${response.status}`);setConnectionState('online',t('status.online'));await ensureSession();await openSession(state.session);}
  catch{setConnectionState('offline',t('status.offline'));}
}
function setConnectionState(status,label){$('#connection-status').textContent=label;$('#backend-dot').dataset.status=status;}
$('#settings-form').addEventListener('submit',async event=>{event.preventDefault();if(state.sending)return toast(t('toast.wait'));state.backend=$('#backend-mode').value;state.url=$('#backend-url').value;localStorage.setItem('neuroflow-connection',JSON.stringify({backend:state.backend,url:state.url}));$('#agent-mode').textContent=state.backend==='demo'?t('agent.demo'):t('agent.backend');$('#settings-dialog').close();await checkBackend();toast(t('toast.saved'));});
$('#new-session').addEventListener('click',()=>createSession().catch(error=>toast(error.message)));

// 深浅主题和侧栏状态保存在本机，重启 Electron 后仍保持用户选择。
function applyAppearance(){const theme=localStorage.getItem('neuroflow-theme')||'light',collapsed=localStorage.getItem('neuroflow-sidebar')==='collapsed';document.documentElement.dataset.theme=theme;document.body.classList.toggle('sidebar-collapsed',collapsed);$('#theme-toggle').textContent=theme==='dark'?'☀':'☾';$('#sidebar-toggle').title=collapsed?t('sidebar.expand'):t('sidebar.collapse');}
$('#theme-toggle').addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';localStorage.setItem('neuroflow-theme',next);applyAppearance();});
$('#sidebar-toggle').addEventListener('click',()=>{const collapsed=!document.body.classList.contains('sidebar-collapsed');localStorage.setItem('neuroflow-sidebar',collapsed?'collapsed':'expanded');applyAppearance();requestAnimationFrame(drawSignal);});
$('#language-toggle').addEventListener('click',()=>i18n.setLocale(i18n.getLocale()==='en'?'zh-CN':'en'));
document.addEventListener('neuroflow:localechange',refreshLocale);
new ResizeObserver(drawSignal).observe($('#signal-canvas'));
try{const saved=JSON.parse(localStorage.getItem('neuroflow-connection')||'null');if(saved?.backend)state.backend=saved.backend;if(saved?.url)state.url=saved.url;}catch{}
bindI18n();applyAppearance();setMode('EEG');setResponseMode(state.responseMode);renderLists();refreshLocale();checkBackend();appendMessage('assistant',i18n.getLocale()==='en'?'Hello, I am the NeuroFlow assistant.\n\nImport an EEG or fNIRS dataset to inspect metadata and run local preprocessing. MEG metadata inspection is available; its preprocessing pipeline is still being implemented.':'你好，我是 NeuroFlow 助手。\n\n你可以导入 EEG 或 fNIRS 数据读取元数据并运行本地预处理。MEG 目前支持元数据解析，预处理流程仍在实现中。');
