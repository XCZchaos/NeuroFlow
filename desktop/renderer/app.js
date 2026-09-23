const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const i18n=globalThis.NeuroI18n;
const t=(key,vars)=>i18n.t(key,vars);
const templates = {
  EEG: { name: 'sub-01_task-rest_eeg.edf', channels: '64', rate: '256', format: 'EDF', unit: 'μV', accept: '.edf,.bdf,.gdf,.set,.fdt,.vhdr,.vmrk,.eeg,.fif,.cnt,.egi,.mff,.csv,.tsv,.txt,.mat,.bin,.dat,.raw', labels: ['Fp1','Fp2','F3','F4','C3','C4','P3','P4'], steps: [
    ['带通滤波', 'Band-pass filter', [['低频 Hz','0.5'],['高频 Hz','40']]],
    ['工频陷波', 'Notch filter', [['频率 Hz','50']]],
    ['坏道检测', 'Bad channel detection', [['方法','人工复核']]],
    ['独立成分分析', 'ICA artifact review', [['算法','FastICA'],['成分数','20']]],
    ['重参考', 'Re-reference', [['参考方式','平均参考']]]
  ]},
  MEG: { name: 'sub-01_task-rest_meg.fif', channels: '306', rate: '1000', format: 'FIF', unit: 'fT', accept: '.fif,.con,.sqd', labels: ['MEG0111','MEG0121','MEG0131','MEG0141','MEG0211','MEG0221','MEG0231','MEG0241'], steps: [
    ['传感器质量检查','Sensor quality', [['方法','人工复核']]],
    ['环境噪声抑制','Empty-room SSP', [['方法','空房 SSP']]],
    ['Maxwell 滤波','SSS / tSSS', [['方法','tSSS'],['窗口 s','10']]],
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
const stepKeyByName={'带通滤波':'bandpass_filter','工频陷波':'notch_filter','坏道检测':'bad_channel_detection','坏道插值':'bad_channel_interpolation','独立成分分析':'ica_artifact_removal','重参考':'reference_selection','重采样':'resample','事件分段':'epoching','基线校正':'baseline','Epoch 伪迹拒绝':'autoreject','ERP 分析':'erp','时频分析':'time_frequency','交叉验证解码':'decoding','可复现报告':'report','环境噪声抑制':'environmental_noise','Maxwell 滤波':'maxwell_filter','光强转光密度':'optical_density','运动伪迹校正':'motion_correction','血红蛋白浓度转换':'beer_lambert'};
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
    {key:'autoreject',name:'Epoch 伪迹拒绝',english:'Epoch rejection',params:[['阈值 μV','0']],executable:true},
    {key:'erp',name:'ERP 分析',english:'ERP analysis',params:[],executable:true},
    {key:'time_frequency',name:'时频分析',english:'Time-frequency analysis',params:[],executable:true},
    {key:'decoding',name:'交叉验证解码',english:'Cross-validated decoding',params:[],executable:true},
    {key:'report',name:'可复现报告',english:'Reproducible report',params:[],executable:true}
  ],
  MEG:[
    {key:'environmental_noise',name:'环境噪声抑制',english:'Empty-room SSP',params:[['方法','空房 SSP']],executable:true},
    {key:'maxwell_filter',name:'Maxwell 滤波',english:'SSS / tSSS',params:[['方法','tSSS'],['窗口 s','10']],executable:true},
    {key:'notch_filter',name:'工频陷波',english:'Notch filter',params:[['频率 Hz','50']],executable:true},
    {key:'bandpass_filter',name:'带通滤波',english:'Band-pass filter',params:[['低频 Hz','1'],['高频 Hz','40']],executable:true},
    {key:'report',name:'可复现报告',english:'Reproducible report',params:[],executable:true}
  ],fNIRS:[]
};
const clone = value => JSON.parse(JSON.stringify(value));
const persistedSession=localStorage.getItem('neuroflow-session-id');
const persistedResponseMode=localStorage.getItem('neuroflow-response-mode')==='deep'?'deep':'quick';
const state = { mode:'EEG', responseMode:persistedResponseMode, steps:[], datasets:[], current:null, history:[], sessions:[], running:false, sending:false, importStatus:null, processed:false, analysis:null, selectedChannel:null, singleChannel:false, signalWindow:{start:0,duration:10,preview:null,loading:false}, backend:'demo', url:'http://localhost:8819', session:persistedSession || globalThis.crypto?.randomUUID?.() || `session-${Date.now()}`, streamController:null };

// Narrow read-only bridge for specialist subpages. It exposes verified metadata
// and the existing local signal endpoint without exposing the mutable UI state.
globalThis.NeuroFlowWorkspace = Object.freeze({
  componentState:(id,detail)=>agentComponentState(id,detail),
  backendURL:()=>state.url,
  snapshot:()=>state.current?.datasetId?{datasetId:state.current.datasetId,name:state.current.name,url:state.url,inspection:structuredClone(state.current.inspection||{})}:null,
  signalWindow:async(start,duration,purpose='',signal)=>{
    if(!state.current?.datasetId)throw Error('No parsed dataset is selected');
    const query=new URLSearchParams({source:'raw',start:String(start),duration:String(duration)});
    if(purpose==='sleep')query.set('channel','__sleep__');
    const requestSignal=signal&&AbortSignal.any?AbortSignal.any([signal,AbortSignal.timeout(45000)]):signal||AbortSignal.timeout(45000);
    const response=await fetch(`${state.url}/datasets/${encodeURIComponent(state.current.datasetId)}/signal?${query}`,{signal:requestSignal});
    const data=await response.json();if(!response.ok)throw Error(data.message||`HTTP ${response.status}`);return data;
  },
	// Specialist pages submit through the existing composer pipeline. This
	// preserves the same message renderer, history, response mode, cancellation,
	// SSE handling and ReAct tool execution used by the preprocessing workspace.
	sendAgentMessage:async (question,options)=>sendMessage(question,options),
	latestSleepStages:async()=>{
		if(!state.current?.datasetId)return null;
		const response=await fetch(`${state.url}/datasets/${encodeURIComponent(state.current.datasetId)}/sleep/stages/latest`,{signal:AbortSignal.timeout(30000)});
		if(response.status===404)return null;const data=await response.json();if(!response.ok)throw Error(data.message||`HTTP ${response.status}`);return data;
	},
	configureAgent:({context,placeholder,suggestions}={})=>{
		if(context)$('#context-mode').textContent=context;
		if(placeholder)$('#chat-input').placeholder=placeholder;
		if(Array.isArray(suggestions))$$('.suggestions [data-prompt]').forEach((button,index)=>{const item=suggestions[index];if(item){button.dataset.prompt=item.prompt;button.textContent=item.label;}});
	},
	restoreAgent:()=>{
		$('#context-mode').textContent=i18n.getLocale()==='en'?`${state.mode} preprocessing`:`${state.mode} 预处理`;
		$('#chat-input').placeholder=t('chat.placeholder');
		const defaults=i18n.getLocale()==='en'?[{prompt:'Explain the current preprocessing pipeline',label:'Explain pipeline ↗'},{prompt:'What quality checks should follow data import?',label:'Quality checks ↗'}]:[{prompt:'解释当前预处理流程',label:'解释当前流程 ↗'},{prompt:'数据导入后应做哪些质量检查？',label:'质量检查建议 ↗'}];
		$$('.suggestions [data-prompt]').forEach((button,index)=>{button.dataset.prompt=defaults[index].prompt;button.textContent=defaults[index].label;});
	},
	notify:message=>toast(message),
  reviewStructure:()=>$('#review-structure')?.click()
});
localStorage.setItem('neuroflow-session-id',state.session);
let toastTimer;
function toast(message) { $('#toast').textContent = message; $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').hidden = true, 4000); }
function element(tag, className, text) { const node = document.createElement(tag); if(className) node.className=className; if(text !== undefined) node.textContent=text; return node; }
function importText(key){
  const values={
    reading:['正在读取文件','Reading file','已获得本地文件路径，准备交给解析服务','Local path received; preparing the inspection service'],
    parsing:['正在解析数据结构','Parsing data structure','正在识别表头、数据流、通道、采样率和单位','Detecting headers, streams, channels, sampling rate, and units'],
    preview:['正在读取真实信号预览','Reading real signal preview','元数据解析完成，正在读取首个信号窗口','Metadata is ready; loading the first signal window'],
    confirm:['解析完成，等待结构确认','Parsed · Confirmation required','请核对采样率、单位、通道和解析警告后再执行','Review sampling rate, unit, channels, and warnings before execution'],
    complete:['数据解析完成','Data parsing complete','真实元数据和信号预览已经可用','Real metadata and signal preview are available'],
    failed:['数据解析失败','Data parsing failed','解析阶段失败','Parsing stage failed']
  };const value=values[key]||values.parsing,offset=i18n.getLocale()==='en'?1:0;return {title:value[offset],detail:value[offset+2]};
}
function ensureImportProgress(){
  let panel=$('#import-progress');if(panel)return panel;
  panel=element('div','import-progress');panel.id='import-progress';panel.hidden=true;panel.setAttribute('role','status');panel.setAttribute('aria-live','polite');
  const copy=element('div');copy.append(element('strong',''),element('small',''));panel.append(element('span','import-spinner'),copy);$('#dropzone .dataset-body').after(panel);return panel;
}
function setImportStatus(stage,status='running',error=''){state.importStatus={stage,status,error};renderImportStatus();}
function renderImportStatus(){
  const panel=ensureImportProgress(),current=state.importStatus;panel.hidden=!current;if(!current)return;
  const display=current.status==='failed'?'failed':current.status==='confirm'?'confirm':current.status==='complete'?'complete':current.stage;
  const copy=importText(display);panel.classList.toggle('failed',current.status==='failed');panel.classList.toggle('complete',current.status==='complete'||current.status==='confirm');
  panel.querySelector('strong').textContent=copy.title;panel.querySelector('small').textContent=current.status==='failed'?`${copy.detail}: ${current.error}`:copy.detail;
}
function setMode(mode) {
  if(state.running || state.sending) return toast(t('toast.waitSwitch'));
  if(!templates[mode])return;
  // Each modality keeps its own selected recording, edited pipeline and viewport.
  // References are intentional: completed analysis is attached to that same file.
  state.modePages ||= {};
  if(state.steps.length && state.mode!==mode){
    state.modePages[state.mode]={steps:state.steps,current:state.current,processed:state.processed,analysis:state.analysis,selectedChannel:state.selectedChannel,singleChannel:state.singleChannel,signalWindow:{...state.signalWindow,loading:false},importStatus:state.importStatus};
  }
  const saved=state.mode!==mode?state.modePages[mode]:null;
  if(state.mode!==mode){signalPrefetch?.abort();state.importStatus=null;}
  state.mode=mode; state.steps=templates[mode].steps.map(([name,english,params]) => ({key:stepKeyByName[name]||name,name,english,params:clone(params),enabled:true,executable:mode==='EEG'}));
  state.current=state.datasets.find(item=>item.mode===mode)||null;
  $$('.segmented [data-mode]').forEach(button=>button.classList.toggle('selected',button.dataset.mode===mode));
  $('#context-mode').textContent=i18n.getLocale()==='en'?`${mode} preprocessing`:`${mode} 预处理`; state.processed=false;state.analysis=state.current?.analysis||null;state.selectedChannel=null;state.singleChannel=false;state.signalWindow={start:0,duration:10,preview:null,loading:false};
  $$('.signal-tabs button').forEach(button=>button.classList.toggle('selected',button.dataset.signal==='raw'));
  if(saved){Object.assign(state,saved);$$('.signal-tabs button').forEach(button=>button.classList.toggle('selected',button.dataset.signal===(state.processed?'processed':'raw')));}
  renderDataset(); renderPipeline(); drawSignal();
}
function renderDataset() {
  const template=templates[state.mode], file=state.current;
	const meta=file?.inspection;
  const english=i18n.getLocale()==='en';
  const card=$('#dropzone'),metadata=$('.dataset-card .metadata'),badge=$('#source-badge'),icon=$('.dataset-card .file-icon');
  card.classList.toggle('is-empty',!file);card.classList.toggle('is-pending',Boolean(file&&!meta));card.classList.toggle('is-ready',Boolean(meta));
  badge.classList.toggle('neutral',!meta);metadata.hidden=!meta;
  $('#file-name').textContent=file?.name||t('dataset.noneTitle');
  $('#file-description').textContent=meta?`${formatBytes(file.size)} · ${english?'Metadata read by':'元数据读取器'} ${meta.reader}`:file?`${formatBytes(file.size)} · ${t('dataset.pendingDescription')}`:t('dataset.noneDescription');
  badge.textContent=meta?t('badge.parsed'):file?t('badge.pending'):t('badge.empty');
  icon.textContent=meta?'∿':file?'…':'＋';
  $('#change-file').textContent=t(file?'dataset.replace':'dataset.import');
  $('#meta-channels').textContent=meta?`${meta.channel_count} channels`:'—';
  $('#meta-rate').textContent=meta?`${meta.sampling_rate_hz} Hz`:'—';
  $('#meta-duration').textContent=meta?`${meta.duration_seconds.toFixed(1)} s`:'—';
  $('#meta-format').textContent=meta?meta.format:'—';
  const formats=template.accept.split(',').join(' / ');
  $('#format-hint').textContent=file?t('dataset.supported',{formats}):t('dataset.drop');
  $('#file-input').accept=template.accept;
  const shownPreview=state.processed?state.analysis?.preview?.processed:(state.analysis?.preview?.raw||file?.preview);
  $('#signal-unit').textContent=t('signal.amplitude',{unit:shownPreview?.unit||template.unit});
  const processedTab=$('[data-signal="processed"]');if(processedTab)processedTab.disabled=!state.analysis?.preview?.processed;
  $('#dataset-count').textContent=state.datasets.length;
  renderStructureReview(meta);
  renderChannelLayout();
  renderQuality();
  renderImportStatus();
	const labelPanel=$('#dataset-labels'),labelButton=$('#import-labels');
	if(labelPanel&&labelButton){
		labelPanel.hidden=!file;labelButton.disabled=!file?.datasetId||state.running;
		const config=meta?.structure_report?.import_config||{};
		const labelName=file?.labelName||config.label_source_name;
		const labelCount=Number(file?.labelCount??config.external_annotations?.length??0);
		$('#label-title').textContent=english?'Companion labels':'配套标签';
		$('#label-summary').textContent=labelCount
			?(english?`${labelName||'Label file'} · ${labelCount} annotations`:`${labelName||'标签文件'} · ${labelCount} 条标注`)
			:(english?'CSV / TSV / JSON · onset or sample + label':'CSV / TSV / JSON · 时间或采样点 + 标签');
		labelButton.textContent=english?(labelCount?'Replace labels':'Import labels'):(labelCount?'更换标签':'导入标签');
		labelButton.title=english?'Supports BIDS events.tsv and MNE-style annotation tables':'支持 BIDS events.tsv 与 MNE 注释表结构';
		$('#manage-labels').hidden=!labelCount;$('#remove-labels').hidden=!labelCount;
		$('#manage-labels').textContent=english?'Edit':'编辑';$('#remove-labels').textContent=english?'Delete':'删除';
	}
}

function labelDialogShell(title){
	let dialog=$('#label-dialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='label-dialog';dialog.className='label-dialog';document.body.append(dialog);}
	dialog.returnValue='';dialog.replaceChildren();const heading=element('div','section-heading');heading.append(element('h2','',title));const close=element('button','button light',i18n.getLocale()==='en'?'Close':'关闭');close.type='button';close.onclick=()=>dialog.close();heading.append(close);dialog.append(heading);return dialog;
}

function chooseSampleOrigin(){
	return new Promise(resolve=>{
		const english=i18n.getLocale()==='en',dialog=labelDialogShell(english?'Import companion labels':'导入配套标签');
		dialog.append(element('p','',english?'Choose how sample indices in the label file are numbered. This does not affect onset values expressed in seconds.':'选择标签文件中采样点序号的起点；使用秒数的 onset/time 字段不受影响。'));
		const label=element('label','field-label',english?'Sample index origin':'采样点序号起点'),select=element('select');[['0',english?'Zero-based: first sample = 0':'零起点：第一个采样点 = 0'],['1',english?'One-based: first sample = 1':'一起点：第一个采样点 = 1']].forEach(([value,text])=>{const option=element('option','',text);option.value=value;select.append(option);});label.append(select);dialog.append(label);
		const choose=element('button','button primary',english?'Choose label file':'选择标签文件');choose.type='button';choose.onclick=()=>{const value=Number(select.value);dialog.close(String(value));};dialog.append(choose);
		let completed=false;dialog.addEventListener('close',()=>{if(completed)return;completed=true;resolve(dialog.returnValue===''?null:Number(dialog.returnValue));},{once:true});dialog.showModal();
	});
}

async function importDatasetLabels(){
	if(state.running||state.sending)return toast(t('toast.wait'));
	if(state.backend!=='backend')return toast(t('toast.connectBackend'));
	if(!state.current?.datasetId)return toast(i18n.getLocale()==='en'?'Import a signal dataset first':'请先导入信号数据');
	if(!globalThis.desktop?.selectLabelFile)return toast(i18n.getLocale()==='en'?'Label file picker is unavailable':'当前环境无法选择标签文件');
	const sampleOrigin=await chooseSampleOrigin();if(sampleOrigin===null)return;
	const path=await globalThis.desktop.selectLabelFile();if(!path)return;
	const button=$('#import-labels');button.disabled=true;button.textContent=i18n.getLocale()==='en'?'Validating…':'正在校验…';
	try{
		await ensureDatasetRegistration(state.current);
		const response=await fetch(`${state.url}/datasets/${encodeURIComponent(state.current.datasetId)}/labels`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({path,sample_origin:sampleOrigin}),signal:AbortSignal.timeout(95000)});
		const data=await response.json().catch(()=>({message:`HTTP ${response.status}`}));
		if(!response.ok)throw new Error(data.message||data.code||`HTTP ${response.status}`);
		state.current.inspection=data.inspection;state.current.labelName=data.label_source_name;state.current.labelCount=data.label_count;state.current.labelReport=data.validation_report;
		state.current.analysis=null;state.analysis=null;state.processed=false;state.signalWindow.preview=null;
		try{state.current.preview=await loadRawPreview(state.current.datasetId);}catch(_error){}
		renderDataset();drawSignal();renderLists();
		const warningCount=data.validation_report?.warnings?.length||0;toast(i18n.getLocale()==='en'?`Imported ${data.label_count} annotations${warningCount?` with ${warningCount} warning(s)`:''}`:`已导入 ${data.label_count} 条标签${warningCount?`，有 ${warningCount} 项需复核`:''}`);
	}catch(error){toast(i18n.getLocale()==='en'?`Label import failed: ${error.message}`:`标签导入失败：${error.message}`);renderDataset();}
}

async function openLabelManager(){
	if(!state.current?.datasetId)return;
	const english=i18n.getLocale()==='en',dialog=labelDialogShell(english?'Edit annotations':'编辑标签');
	const status=element('p','settings-note',english?'Loading annotations…':'正在读取标签…');dialog.append(status);dialog.showModal();
	try{
		const response=await fetch(`${state.url}/datasets/${encodeURIComponent(state.current.datasetId)}/labels`,{signal:AbortSignal.timeout(30000)}),data=await response.json();if(!response.ok)throw Error(data.message||`HTTP ${response.status}`);
		dialog.replaceChildren(dialog.firstChild);const note=element('p','',english?'Edit onset and duration in seconds. Changes are validated against the recording before saving.':'起始时间和持续时间单位为秒；保存前会根据记录时长重新验证。');status.textContent='';dialog.append(note,status);
		const table=element('table','review-table label-edit-table'),body=document.createElement('tbody');table.innerHTML=`<thead><tr><th>${english?'Onset (s)':'起始（秒）'}</th><th>${english?'Duration (s)':'持续（秒）'}</th><th>${english?'Label':'标签'}</th><th></th></tr></thead>`;table.append(body);dialog.append(table);
		const annotations=(data.annotations||[]).map(item=>({...item})),pageSize=100;let page=0;const pager=element('div','label-pager'),previous=element('button','button light','←'),pageLabel=element('span',''),next=element('button','button light','→');previous.type=next.type='button';pager.append(previous,pageLabel,next);dialog.append(pager);
		const renderPage=()=>{body.replaceChildren();const pages=Math.max(1,Math.ceil(annotations.length/pageSize));page=Math.max(0,Math.min(pages-1,page));annotations.slice(page*pageSize,(page+1)*pageSize).forEach((item,offset)=>{const index=page*pageSize+offset,row=document.createElement('tr');const onset=element('input');onset.type='number';onset.step='any';onset.min='0';onset.value=String(item.onset??0);onset.oninput=()=>item.onset=Number(onset.value);const duration=element('input');duration.type='number';duration.step='any';duration.min='0';duration.value=String(item.duration??0);duration.oninput=()=>item.duration=Number(duration.value);const description=element('input');description.value=item.description||'';description.maxLength=200;description.oninput=()=>item.description=description.value;const remove=element('button','button light','×');remove.type='button';remove.onclick=()=>{annotations.splice(index,1);renderPage();};[onset,duration,description,remove].forEach(control=>{const cell=document.createElement('td');cell.append(control);row.append(cell);});body.append(row);});pageLabel.textContent=english?`Page ${page+1}/${pages} · ${annotations.length} annotations`:`第 ${page+1}/${pages} 页 · 共 ${annotations.length} 条`;previous.disabled=page===0;next.disabled=page>=pages-1;};previous.onclick=()=>{page--;renderPage();};next.onclick=()=>{page++;renderPage();};renderPage();
		const actions=element('div','label-dialog-actions'),add=element('button','button light',english?'+ Add annotation':'+ 添加标签'),save=element('button','button primary',english?'Validate and save':'验证并保存');add.type=save.type='button';add.onclick=()=>{annotations.push({onset:0,duration:0,description:''});page=Math.floor((annotations.length-1)/pageSize);renderPage();};save.onclick=async()=>{try{save.disabled=true;const result=await fetch(`${state.url}/datasets/${encodeURIComponent(state.current.datasetId)}/labels`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({annotations,label_source_name:data.label_source_name||'edited-labels',sample_origin:data.sample_origin||0}),signal:AbortSignal.timeout(95000)});const updated=await result.json();if(!result.ok)throw Error(updated.message||`HTTP ${result.status}`);state.current.inspection=updated.inspection;state.current.labelCount=updated.label_count;state.current.labelName=updated.label_source_name;state.current.labelReport=updated.validation_report;state.current.analysis=null;state.analysis=null;dialog.close();renderDataset();drawSignal();toast(english?'Annotations saved':'标签已保存');}catch(error){status.textContent=error.message;}finally{save.disabled=false;}};actions.append(add,save);dialog.append(actions);status.textContent=(data.validation_report?.warnings||[]).join('\n');
	}catch(error){status.textContent=error.message;}
}

async function removeDatasetLabels(){
	const english=i18n.getLocale()==='en';if(!state.current?.datasetId)return;if(!confirm(english?'Delete imported companion labels? Native annotations in the signal file will remain.':'删除导入的配套标签吗？信号文件原有标注会保留。'))return;
	try{const response=await fetch(`${state.url}/datasets/${encodeURIComponent(state.current.datasetId)}/labels`,{method:'DELETE',signal:AbortSignal.timeout(95000)}),data=await response.json();if(!response.ok)throw Error(data.message||`HTTP ${response.status}`);state.current.inspection=data.inspection;state.current.labelCount=0;state.current.labelName='';state.current.labelReport=null;state.current.analysis=null;state.analysis=null;renderDataset();drawSignal();toast(english?'Imported labels deleted':'已删除导入标签');}catch(error){toast(error.message);}
}

function renderQuality(){
  const card=$('#quality-card'),comparison=state.analysis?.result?.quality_comparison;card.hidden=!comparison;if(!comparison)return;
  const canvas=$('#quality-canvas'),width=canvas.clientWidth||600,height=150,ratio=devicePixelRatio||1;canvas.width=width*ratio;canvas.height=height*ratio;
  const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);ctx.clearRect(0,0,width,height);ctx.font='11px Segoe UI';
  [['处理前',comparison.before.score,'#aebbb5'],['处理后',comparison.after.score,'#16846d']].forEach(([label,value,color],index)=>{const y=28+index*55;ctx.fillStyle='#718078';ctx.fillText(`${label} ${Number(value).toFixed(1)}`,0,y);ctx.fillStyle='#edf1ef';ctx.fillRect(90,y-14,width-110,18);ctx.fillStyle=color;ctx.fillRect(90,y-14,(width-110)*Math.max(0,Math.min(100,Number(value)))/100,18);});
  const list=$('#audit-steps');list.replaceChildren();(state.analysis.result.audit_log||[]).forEach(item=>{const row=element('div',`audit-step ${item.status}`);row.append(element('strong','',item.step),element('span','',item.detail||item.status));list.append(row);});
  $('#open-audit').disabled=!state.analysis?.output?.audit_relative_path;
}
function renderPipeline() {
  const list=$('#pipeline'); list.replaceChildren();
  state.steps.forEach((step,index)=>{
    const row=element('div',`pipeline-step${step.enabled?'':' disabled'}`);
    row.dataset.agentStepKey=step.key;
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
function setResponseMode(mode){
  state.responseMode=mode==='deep'?'deep':'quick';localStorage.setItem('neuroflow-response-mode',state.responseMode);
  $$('[data-response-mode]').forEach(button=>{const selected=button.dataset.responseMode===state.responseMode;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));button.title=t(button.dataset.responseMode==='deep'?'response.deepDescription':'response.quickDescription');});
  $('#response-mode-hint').textContent=t(state.responseMode==='deep'?'response.deepHint':'response.quickHint');
  let note=$('#response-mode-description');if(!note){note=element('p','response-mode-description');note.id='response-mode-description';$('.response-mode').after(note);}
  note.textContent=t(state.responseMode==='deep'?'response.deepDescription':'response.quickDescription');
}
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
    const displayName=String(path).split(/[\\/]/).pop()||String(path);
    state.current={name:displayName,size:0,modified:0,mode:state.mode,path};setImportStatus('reading');renderDataset();
    try {
      setImportStatus('parsing');
      const record=await registerPath(path), meta=record.inspection;
      // inspection 是 Python/MNE 已验证的数据；后面的界面和对话统一读取它。
      const item={name:meta.source_name,size:meta.source_size_bytes||0,modified:0,mode:meta.modality,datasetId:record.dataset_id,inspection:meta,path};
      state.datasets.push(item); accepted++;
      if(templates[meta.modality]&&state.mode!==meta.modality)setMode(meta.modality);
      state.current=item;state.analysis=null;state.processed=false;state.selectedChannel=null;state.singleChannel=false;state.signalWindow={start:0,duration:10,preview:null,loading:false};
      setImportStatus('preview');renderDataset();
      try{item.preview=await loadRawPreview(item.datasetId);}catch(error){previewFailures.push(`${item.name}: ${error.message}`);}
      setImportStatus('complete',meta.structure_report?.requires_confirmation?'confirm':'complete');
    } catch(error) { failures.push(error.message);setImportStatus(state.importStatus?.stage||'parsing','failed',error.message); }
  }
  renderDataset();renderLists();drawSignal();
  if(window.NeuroPages.modes[state.view]||(state.view==='sleep'&&state.mode!=='EEG'))setView('workspace');
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
function setView(view) {
  const modes=window.NeuroPages.modes;
  if(view==='workspace')view=Object.keys(modes).find(key=>modes[key]===state.mode)||'eeg';
  if(!['eeg','meg','fnirs','datasets','history','sessions','sleep','ppg','help'].includes(view))return;
  // Lock context changes during execution, rather than letting an in-flight tool
  // repaint another page's dataset. Same-page locale refresh remains permitted.
  if(state.view&&state.view!==view&&(state.sending||state.running||state.importStatus?.status==='running'||window.NeuroPPG?.isBusy?.()))return toast(t('toast.waitSwitch'));
  if(modes[view]&&state.mode!==modes[view])setMode(modes[view]);
  if(view==='sleep'&&state.mode!=='EEG')setMode('EEG');
  state.view=view;
  window.NeuroComponents?.pageChanged(view,['help','sessions','ppg'].includes(view)?'':state.current?.datasetId);
  for(const name of ['eeg','meg','fnirs','datasets','history','sessions','sleep','ppg','help'])$(`#${name}-view`).hidden=name!==view;
  $('#workspace-view').hidden=!modes[view];
  window.NeuroPages.mount(view);
  $$('.nav-item[data-view]').forEach(button=>button.classList.toggle('active',button.dataset.view===view));
  const label=window.NeuroPages.pageLabel(view);$('#breadcrumb').textContent=label;$('#page-title').textContent=label;
  const ownsHeading=['help','sleep','ppg'].includes(view);$('.page-heading').hidden=ownsHeading;$('#import-top').hidden=ownsHeading;
  renderLists();if(modes[view])requestAnimationFrame(drawSignal);
  if(view==='sleep')window.NeuroSleep?.activate();if(view==='ppg')window.NeuroPPG?.activate();
  window.NeuroPages.configure(view);
}

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
  indicator.append(element('span'),element('span'),element('span'),element('em','',i18n.getLocale()==='en'?'Waiting for response text':'等待回复正文'));
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
function isAgentOperationRequest(text){return /预处理|滤波|陷波|重参考|坏道|插值|去伪迹|伪迹|覆盖.{0,10}(标签|标注)|睡眠.{0,8}(分期|标注|打标)|自动.{0,6}(分期|标注|打标)|\bICA\b|保存.{0,8}(文件|结果)|运行.{0,6}(流程|处理)|执行.{0,8}(分析|处理)|preprocess|filter|notch|bad channel|artifact|sleep.{0,8}(stag|scor|label)|automatic.{0,8}(stag|scor|label)|save.{0,12}(file|result)|run.{0,8}(pipeline|analysis)/i.test(text);}
// Explicit sleep-staging requests are actions, not open-ended questions. The
// outer workflow executes the validated local tool first, then lets the same
// Agent explain the real result. This prevents a ReAct turn from stopping after
// saying "I will call the tool" without actually doing so.
function isSleepStagingRequest(text){return /睡眠.{0,14}(自动分期|分期工具|自动标注|自动打标|候选标签|覆盖|重打|重新标注)|(?:自动|覆盖|重打|重新).{0,10}(睡眠分期|睡眠标注|睡眠标签|现有标签)|(?:sleep).{0,16}(stag|scor|label|overwrite|replace)/i.test(text);}
function requestsLabelOverwrite(text){return /覆盖.{0,12}(标签|标注|分期)|(现有|已有).{0,8}(标签|标注|分期).{0,12}覆盖|重新.{0,8}(标注|打标|分期)|重打.{0,6}(标签|标注)|overwrite|replace.{0,8}(label|scor|stag)/i.test(text);}

async function executeSleepStagingWorkflow(datasetId,overwriteExisting=false,signal){
  const response=await fetch(`${state.url}/datasets/${encodeURIComponent(datasetId)}/sleep/stage`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(600000)]):AbortSignal.timeout(600000)});
  const result=await response.json();if(!response.ok)throw Error(result.message||`HTTP ${response.status}`);
  // The sleep page owns label provenance and review state. A DOM event keeps
  // that specialist rendering out of the shared Agent implementation.
  document.dispatchEvent(new CustomEvent('neuroflow:sleepstages',{detail:{result,overwriteExisting}}));
  return result;
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
async function consumeSSE(response,onEvent){return window.NeuroAgentStream.consume(response,onEvent);}
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
async function sendMessage(text,options={}) {
  if(state.sending||!text.trim())return;
  if(window.NeuroPPG?.isBusy?.())return toast(t('toast.wait'));
  const page=state.view||'eeg',chatDataset=['help','sessions','ppg'].includes(page)?null:state.current,previousAnalysisId=chatDataset?.analysis?.analysis_id||null;
  const pageContext=window.NeuroPages.context(page,chatDataset);
  let componentContext=window.NeuroComponents?.snapshot(page,chatDataset?.datasetId);
  if(componentContext)componentContext.explain_only=options.explainComponent===true;
  if(page==='history')pageContext.recent_runs=state.history.slice(-4).map(run=>({modality:run.mode,time:run.time,executed:run.real===true,steps:run.steps?.map(step=>step.key||step.name)}));
  if(page==='datasets')pageContext.datasets=state.datasets.map(file=>({dataset_id:file.datasetId,modality:file.mode,parsed:Boolean(file.inspection),selected:file===chatDataset}));
  let ppgID='';
  text=text.trim();const overwriteSleepLabels=requestsLabelOverwrite(text),sleepViewActive=$('.nav-item[data-view="sleep"]')?.classList.contains('active'),sleepOperation=isSleepStagingRequest(text)||(sleepViewActive&&overwriteSleepLabels),expectedOperation=isAgentOperationRequest(text);state.sending=true;$('#chat-input').value='';appendMessage('user',text);
  $('#send-message').textContent='■';$('#send-message').title=t('action.stop');$('#send-message').setAttribute('aria-label',t('action.stop'));
  const pending=appendThinkingMessage(),execution=window.NeuroAgentStream.attach(pending);let answer='',requestTimeout,renderFrame=0;state.streamController=new AbortController();
  if(page==='ppg')window.NeuroPPG.setAgentBusy(true);
  const resetIdleTimeout=()=>{clearTimeout(requestTimeout);requestTimeout=setTimeout(()=>state.streamController?.abort('timeout'),120000);};
  try {
    if(state.backend==='demo') {
      await new Promise((resolve,reject)=>{const timer=setTimeout(resolve,450);state.streamController.signal.addEventListener('abort',()=>{clearTimeout(timer);reject(new DOMException('已停止','AbortError'));},{once:true});});
      answer=demoReply(text);updateAssistantMessage(pending,answer);execution.finish('completed');
    }
    else {
      execution.phase('prepare');
      await ensureDatasetRegistration(chatDataset);
      pageContext.dataset_id=chatDataset?.datasetId||null;
      if(componentContext&&componentContext.dataset_id!==(chatDataset?.datasetId||'')){componentContext=window.NeuroComponents?.snapshot(page,chatDataset?.datasetId);componentContext.explain_only=options.explainComponent===true;}
	  if(page==='ppg'){
        try{ppgID=await window.NeuroPPG.prepareAgent(state.streamController.signal);}
        catch(error){
          if(error.name==='AbortError')throw error;
          // Invalid PPG structure should still allow a conversation explaining
          // which field to correct; it must never inherit the previous EEG file.
          pageContext.ppg.validation_error=error.message;
        }
      }
	  let workflowEvidence='';
	  if(sleepOperation && page==='sleep'){
		if(!state.current?.datasetId)throw Error(i18n.getLocale()==='en'?'Import and confirm a sleep EEG recording first.':'请先导入并确认睡眠 EEG 数据。');
		execution.event({kind:'tool',id:'local-sleep',tool:'suggest_sleep_stages',state:'running'});
		const staged=await executeSleepStagingWorkflow(state.current.datasetId,overwriteSleepLabels,state.streamController.signal);
		execution.event({kind:'tool',id:'local-sleep',tool:'suggest_sleep_stages',state:'completed'});
		workflowEvidence=i18n.getLocale()==='en'
		  ? `\n[The outer workflow has already executed the local sleep-staging tool successfully. Do not call it again and do not describe a future plan. Report this real result naturally: analysis_id=${staged.analysis_id}; epoch_seconds=${staged.epoch_seconds}; counts=${JSON.stringify(staged.counts)}; channels=${JSON.stringify(staged.channel_support)}; capabilities=${JSON.stringify(staged.capabilities)}; detected_events=${JSON.stringify(staged.event_counts)}; existing_labels_overwritten=${overwriteSleepLabels}; review_required=true.]`
		  : `\n[外层工作流已经成功执行本地睡眠分期工具。不要再次调用，也不要再描述将来要做的计划；请自然说明这次真实结果：analysis_id=${staged.analysis_id}；epoch_seconds=${staged.epoch_seconds}；标签计数=${JSON.stringify(staged.counts)}；通道支持=${JSON.stringify(staged.channel_support)}；检测能力=${JSON.stringify(staged.capabilities)}；事件计数=${JSON.stringify(staged.event_counts)}；已覆盖现有标签=${overwriteSleepLabels}；review_required=true。]`;
	  }
      const meta=chatDataset?.inspection;
      // 明确标注证据边界：元数据可以回答通道数和采样率，但不能证明数据质量良好。
      const evidence=meta?`已由 ${meta.reader} 读取：格式=${meta.format}，模态=${meta.modality}，通道数=${meta.channel_count}，采样率=${meta.sampling_rate_hz} Hz，时长=${meta.duration_seconds.toFixed(3)} 秒，样本数=${meta.sample_count}，通道类型=${JSON.stringify(meta.channel_type_counts)}，标注数=${meta.annotation_count}，已标记坏道=${JSON.stringify(meta.bad_channels)}。dataset_id=${chatDataset.datasetId}。这些是文件元数据，尚未执行信号质量分析或预处理。`:`Active page=${page}; no MNE dataset bound to this turn. For PPG use run_ppg_analysis with the prepared page configuration.`;
      resetIdleTimeout();
      const response=await fetch(`${state.url}/chatStream`,{method:'POST',headers:{'Content-Type':'application/json','Accept':'text/event-stream'},body:JSON.stringify({user_query:text,question:`[Active page context: ${JSON.stringify(pageContext)}]\n[界面语言：${i18n.getLocale()==='en'?'English':'简体中文'}；请使用相同语言回答。]\n[数据上下文：${evidence}]${workflowEvidence}\n${text}`,id:state.session,dataset_id:chatDataset?.datasetId||'',workspace:page,ppg_id:ppgID,ui_context:componentContext,response_mode:state.responseMode}),signal:state.streamController.signal});
      if(!response.ok)throw new Error(t('error.backendHttp',{status:response.status}));
      let streamError='',streamErrorCode='',receivedDone=false;
      await consumeSSE(response,(event,data)=>{
        resetIdleTimeout();
        if(event==='status'){execution.event(JSON.parse(data));return;}
        if(event==='done'){receivedDone=true;return;}
        if(event==='message'||event==='replace'){
          answer=event==='replace'?data:answer+data;
          if(event==='message')execution.phase('streaming');
          // 将高频 token 合并到一帧渲染，减少 Markdown 重排造成的闪烁。
          if(!renderFrame)renderFrame=requestAnimationFrame(()=>{renderFrame=0;updateAssistantMessage(pending,answer);});
        } else if(event==='error') {
          try{const failure=JSON.parse(data);streamErrorCode=failure.code;streamError=failure.code==='AGENT_STEP_LIMIT'?(i18n.getLocale()==='en'?'Agent interaction budget reached. Completed actions are not undone. Review tool records before continuing; consider Deep analysis for complex tasks.':failure.message):failure.message||t('error.stream');}catch{streamError=data||t('error.stream');}
        }
      });
      clearTimeout(requestTimeout);
      if(renderFrame)cancelAnimationFrame(renderFrame);
      if(streamError){const error=new Error(streamError);error.code=streamErrorCode;throw error;}
      if(!receivedDone)throw new Error(i18n.getLocale()==='en'?'Response interrupted before completion.':'连接在回答完成前中断。');
      if(!answer.trim())throw new Error(t('error.empty'));
      updateAssistantMessage(pending,answer);execution.finish('completed');
    }
  }catch(error){
    if(renderFrame){cancelAnimationFrame(renderFrame);renderFrame=0;}
    const cancelled=state.streamController?.signal.aborted&&state.streamController.signal.reason!=='timeout';
    execution.finish(cancelled?'cancelled':'failed');
    if(cancelled)updateAssistantMessage(pending,(answer?answer+'\n\n':'')+`*${t('agent.stopped')}*`);
    else if(error.code==='AGENT_STEP_LIMIT')updateAssistantMessage(pending,(answer?answer+'\n\n':'')+error.message);
    else updateAssistantMessage(pending,(answer?answer+'\n\n':'')+t('error.connection',{message:state.streamController?.signal.reason==='timeout'?(i18n.getLocale()==='en'?'No stream activity for 120 seconds':'120 秒未收到流式响应'):error.message}));
  }
  finally{
    clearTimeout(requestTimeout);if(renderFrame)cancelAnimationFrame(renderFrame);
    if(page==='ppg'){try{await window.NeuroPPG.syncAgentResult(ppgID);}catch(error){toast(error.message);}window.NeuroPPG.setAgentBusy(false);}
    state.sending=false;state.streamController=null;$('#send-message').textContent='↑';$('#send-message').title=t('action.send');$('#send-message').setAttribute('aria-label',t('action.send'));
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
function updateSignalNavigation(preview){
  const total=state.current?.inspection?.duration_seconds||0,slider=$('#signal-position'),enabled=Boolean(state.current?.datasetId&&total>0);
  state.signalWindow.duration=Math.min(state.signalWindow.duration,total||state.signalWindow.duration);
  const max=Math.max(0,total-state.signalWindow.duration);state.signalWindow.start=Math.min(state.signalWindow.start,max);
  const limits=signalZoomLimits(),zoomIn=$('#signal-zoom-in'),zoomOut=$('#signal-zoom-out'),english=i18n.getLocale()==='en';
  slider.disabled=!enabled;slider.max=String(max);slider.value=String(state.signalWindow.start);
  zoomIn.disabled=!enabled||state.signalWindow.duration<=limits.min;
  zoomOut.disabled=!enabled||state.signalWindow.duration>=limits.max;
  zoomIn.title=!enabled?(english?'Import a recording first':'请先导入数据'):(zoomIn.disabled?(english?'Maximum zoom: sample resolution reached':'已达到最大放大倍数（原始采样点分辨率）'):(english?'Zoom in on time':'放大时间轴'));
  zoomOut.title=!enabled?(english?'Import a recording first':'请先导入数据'):(zoomOut.disabled?(english?'Maximum time window reached':'已达到最大时间窗口'):(english?'Zoom out on time':'缩小时间轴'));
  $('#signal-window-label').textContent=`${state.signalWindow.start.toFixed(3)}–${(state.signalWindow.start+state.signalWindow.duration).toFixed(3)} s`;
}
function exportSelectedChannel(){
  const preview=activeSignalPreview(),index=preview?.channel_names?.indexOf(state.selectedChannel);if(index===undefined||index<0)return;
  const rate=Number(preview.sample_rate_hz),values=preview.data[index]||[],rows=['time_seconds,value,unit'];
  values.forEach((value,sample)=>rows.push(`${(sample/rate).toFixed(8)},${value},${preview.unit||''}`));
  const url=URL.createObjectURL(new Blob([`\uFEFF${rows.join('\n')}`],{type:'text/csv;charset=utf-8'})),anchor=element('a');anchor.href=url;anchor.download=`${state.current?.name||state.mode}-${state.selectedChannel}-${state.processed?'processed':'raw'}.csv`;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function configSnapshot(){return {schemaVersion:1,mode:state.mode,demo:!state.current?.datasetId,processed:Boolean(state.analysis),datasetId:state.current?.datasetId||null,steps:clone(state.steps),exportedAt:new Date().toISOString()};}

// 组件只读适配器：显式取字段，不返回整个 state/current/analysis。
// 文件路径、API Key、波形数组和完整报告不能通过组件解释进入模型上下文。
function agentComponentState(id,detail={}){
  const file=state.current,meta=file?.inspection,report=meta?.structure_report||{},analysis=state.analysis;
  const stepSummary=step=>({key:step.key,name:step.english||step.name,enabled:step.enabled,parameters:step.params.map(([name,value])=>({name,value}))});
  const metadata=()=>({loaded:Boolean(meta),dataset_id:file?.datasetId||null,modality:meta?.modality,sampling_rate_hz:meta?.sampling_rate_hz,channel_count:meta?.channel_count,duration_seconds:meta?.duration_seconds,format:meta?.format});
  switch(id){
    case 'dataset':return {...metadata(),stage:state.importStatus?.stage,status:state.importStatus?.status,error:state.importStatus?.error,requires_confirmation:report.requires_confirmation};
    case 'labels':return {dataset_id:file?.datasetId,external_count:report.import_config?.external_annotations?.length||0,native_and_external_count:meta?.annotation_count,validation:file?.labelReport,edit_enabled:!$('#manage-labels')?.hidden};
    case 'structure':{
      const draft=$('#structure-dialog')?.open?{sampling_rate_hz:$('#confirm-rate')?.value,unit:$('#confirm-unit')?.value,layout:$('#confirm-layout')?.value,montage:$('#confirm-montage')?.value}:null;
      const row=Number.isInteger(detail.review_channel_index)?$$('.review-channel')[detail.review_channel_index]:null;
      return {...metadata(),unit:report.unit,confidence:meta?.structure_confidence,conflicts:meta?.structure_conflicts,requires_confirmation:report.requires_confirmation,draft,selected_channel_draft:row?{name:row.querySelector('.review-name').value,type:row.querySelector('.review-type').value,reference:row.querySelector('.review-ref').checked,excluded:row.querySelector('.review-drop').checked}:null,warning:'Draft values have not necessarily been validated or saved'};
    }
    case 'pipeline':{
      const step=state.steps.find(item=>item.key===detail.step_key),parameter=step?.params[detail.parameter_index];
      return {modality:state.mode,running:state.running,steps:state.steps.map(stepSummary),selected_step:step?stepSummary(step):null,selected_parameter:parameter?{name:parameter[0],value:parameter[1]}:null,selected_step_missing:Boolean(detail.step_key&&!step)};
    }
    case 'signal':{
      const preview=activeSignalPreview();
      return {...metadata(),source:state.processed?'processed':'raw',real_preview:Boolean(preview?.data?.length),selected_channel:state.singleChannel?state.selectedChannel:null,displayed_channels:preview?.channel_names||[],requested_window:{start_seconds:state.signalWindow.start,duration_seconds:state.signalWindow.duration},displayed_window:preview?{start_seconds:preview.start_seconds??0,end_seconds:preview.end_seconds??null,duration_seconds:preview.duration_seconds??(Number.isFinite(preview.end_seconds)?preview.end_seconds-(preview.start_seconds??0):null)}:null,loading:state.signalWindow.loading,analysis_id:analysis?.analysis_id,preview_unit:preview?.unit,
        display_only_statistics:state.singleChannel?Object.fromEntries(['samples','rate','min','max','mean','rms'].map(key=>[key,$(`#channel-${key}`)?.textContent])):null,limitation:'Display may be downsampled. No raw samples sent. Use a real analysis tool for scientific or artifact conclusions.'};
    }
    case 'channels':return {selected_channel:state.selectedChannel,channel_count:meta?.channel_count,montage:meta?.montage,position_count:report.channel_positions?.filter(p=>[p.x,p.y,p.z].every(Number.isFinite)).length||0,coordinate_basis:meta?.montage?'standard_montage_not_measured':report.channel_positions?.length?'file_positions':'acquisition_order_not_spatial',reference_channels:meta?.reference_channels};
    case 'quality':return {analysis_id:analysis?.analysis_id,comparison:analysis?.result?.quality_comparison,saved:analysis?.output?.saved===true,steps:analysis?.result?.audit_log?.map(item=>({step:item.step,status:item.status}))};
    case 'products':{const products=analysis?.result?.analysis_products||{};return {analysis_id:analysis?.analysis_id,available:Object.keys(products),decoding:products.decoding?{performed:products.decoding.performed,metric:products.decoding.metric,mean:products.decoding.mean,std:products.decoding.std,folds:products.decoding.folds}:null,erp_conditions:Object.keys(products.erp?.conditions||{}),time_frequency_performed:products.time_frequency?.performed};}
    case 'tasks':return {status:$('#task-status')?.textContent,steps:typeof advancedLiveSteps!=='undefined'?[...advancedLiveSteps.values()].map(item=>({step:item.step,status:item.status,attempt:item.attempt})):[],pending_fields:typeof advancedCurrentTask!=='undefined'?advancedCurrentTask?.pending_fields?.map(item=>item.name):[]};
    case 'meg-settings':return {sss_mode:$('#meg-sss-mode')?.value,tsss_duration_seconds:Number($('#meg-st-duration')?.value),empty_room_dataset_id:$('#meg-empty-room')?.value||null};
    case 'run':return {running:state.running,save_output:$('#save-output')?.checked,enabled_steps:state.steps.filter(step=>step.enabled).map(step=>step.key),dataset_id:file?.datasetId||null};
    case 'datasets':return {count:state.datasets.length,focused_row:detail.list_index,records:state.datasets.map((item,index)=>({dataset_id:item.datasetId,modality:item.mode,parsed:Boolean(item.inspection),selected:item===file,focused:index===detail.list_index,channel_count:item.inspection?.channel_count,sampling_rate_hz:item.inspection?.sampling_rate_hz}))};
    case 'bids':return {visible:!$('#bids-browser')?.hidden,listed_items:$('#bids-browser')?.querySelectorAll('button').length||0,limitation:'Browser paths are local only; select a dataset to query verified metadata.'};
    case 'batch':return {selected_count:$('#batch-datasets')?.querySelectorAll('input:checked').length||0,save_output:$('#batch-save')?.checked,running:state.running};
    case 'history':{const summarize=run=>run?{modality:run.mode,executed:run.real===true,time:run.time,steps:run.steps?.map(step=>step.key),quality:run.result?.quality_comparison}:null;return {count:state.history.length,focused_run:Number.isInteger(detail.list_index)?summarize([...state.history].reverse()[detail.list_index]):null,recent_runs:state.history.slice(-5).map(summarize)};}
    case 'sessions':return {count:state.sessions.length,current_session_id:state.session};
    case 'algorithm-library':return {modality:state.mode,available:algorithmCatalog[state.mode]?.map(item=>({key:item.key,name:item.english,executable:item.executable,added:state.steps.some(step=>step.key===item.key)}))};
    default:return {};
  }
}
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
  } else if(state.mode==='MEG') {
    body.enabled_steps=state.steps.filter(step=>step.enabled&&step.executable).map(step=>step.key);
    body.sss_mode=document.querySelector('#meg-sss-mode')?.value||'none';
    body.st_duration=Number(document.querySelector('#meg-st-duration')?.value)||10;
    body.empty_room_dataset_id=document.querySelector('#meg-empty-room')?.value||'';
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
  for(let tick=0;tick<=10;tick++){const x=left+plotWidth*tick/10;ctx.strokeStyle='#edf1ee';ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,height-bottom);ctx.stroke();ctx.fillStyle='#a7b0aa';ctx.fillText((startTime+duration*tick/10).toFixed(duration<.1?4:duration<1?3:duration<10?1:0),x-2,height-5);}
  labels.slice(0,channelCount).forEach((label,index)=>{const y=top+rowHeight*(index+.5);ctx.fillStyle='#9aa79f';ctx.fillText(label,1,y+3);ctx.strokeStyle='#f2f5f3';ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(width-right,y);ctx.stroke();const selected=Boolean(preview)&&label===state.selectedChannel;ctx.strokeStyle=selected?'#0b6657':state.processed?'#52a18d':'#8bb0a5';ctx.lineWidth=selected?1.8:.72;ctx.globalAlpha=preview&&!selected?.48:1;ctx.beginPath();if(series?.[index]?.length){const values=series[index];const center=values.reduce((sum,value)=>sum+value,0)/values.length;const peak=Math.max(...values.map(value=>Math.abs(value-center)),Number.EPSILON);values.forEach((value,sample)=>{const x=left+plotWidth*sample/Math.max(1,values.length-1),point=y-(value-center)/peak*rowHeight*.36;if(sample===0)ctx.moveTo(x,point);else ctx.lineTo(x,point);});}else{for(let pixel=0;pixel<=plotWidth;pixel++){const time=pixel/plotWidth*10;let amplitude=state.mode==='fNIRS'?Math.sin(time*1.7+index)*4+Math.sin(time*4+index)*1.7:Math.sin(time*15+index*2)*2.5+Math.sin(time*36+index)*1.6+Math.sin(time*68+index*4)*1.2;amplitude+=Math.sin(time*123+index)*.7;if(!state.processed&&state.mode!=='fNIRS')amplitude+=Math.exp(-((time-(3+index*.28))**2)/.015)*7;const point=y-amplitude*(state.processed?.65:1);if(pixel===0)ctx.moveTo(left+pixel,point);else ctx.lineTo(left+pixel,point);}}ctx.stroke();});
  ctx.globalAlpha=1;const annotations=state.current?.inspection?.structure_report?.import_config?.external_annotations||[],visibleAnnotations=annotations.filter(item=>Number(item.onset)>=startTime&&Number(item.onset)<=startTime+duration),annotationStride=Math.max(1,Math.ceil(visibleAnnotations.length/500));
  visibleAnnotations.forEach((item,index)=>{if(index%annotationStride)return;const x=left+plotWidth*(Number(item.onset)-startTime)/Math.max(duration,Number.EPSILON);ctx.save();ctx.setLineDash([3,3]);ctx.strokeStyle='#d08a32';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,height-bottom);ctx.stroke();ctx.restore();if(index<40){ctx.fillStyle='#9a641f';ctx.font='8px Segoe UI';const text=String(item.description||'').slice(0,24);ctx.fillText(text,Math.min(width-right-ctx.measureText(text).width,Math.max(left,x+3)),top+9+(index%2)*10);}});
  $('#signal-caption').textContent=preview?t('signal.realCaption',{count:channelCount,duration:duration.toFixed(duration<1?3:1)}):t('signal.caption');$('#signal-unit').textContent=t('signal.amplitude',{unit:preview?.unit||templates[state.mode].unit});$('.signal-card .pill').textContent=preview?t('badge.real'):t('badge.synthetic');$('.chart-footer span:first-child').textContent=preview?t('signal.realDisclaimer'):t('signal.disclaimer');
  canvas.setAttribute('aria-label',preview?t(state.processed?'signal.processedAria':'signal.rawAria'):t('signal.syntheticAria'));
  renderChannelDetail(preview);
  updateSignalNavigation(preview);
  renderChannelLayout();
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
$('#import-labels').addEventListener('click',importDatasetLabels);
$('#manage-labels').addEventListener('click',openLabelManager);
$('#remove-labels').addEventListener('click',removeDatasetLabels);
document.addEventListener('dragover',event=>event.preventDefault());document.addEventListener('drop',event=>event.preventDefault());
$('#dropzone').addEventListener('dragover',event=>{event.preventDefault();$('#dropzone').classList.add('dragging');});$('#dropzone').addEventListener('dragleave',()=>$('#dropzone').classList.remove('dragging'));$('#dropzone').addEventListener('drop',event=>{event.preventDefault();$('#dropzone').classList.remove('dragging');importFiles(event.dataTransfer.files);});
$('#reset-pipeline').addEventListener('click',()=>{if(state.running)return toast(t('toast.resetWait'));const current=state.current;setMode(state.mode);state.current=current;renderDataset();toast(t('toast.resetDone'));});
$('#add-pipeline-step').addEventListener('click',()=>{if(state.running)return toast(t('toast.wait'));renderAlgorithmLibrary();$('#algorithm-dialog').showModal();});
$('#close-algorithms').addEventListener('click',()=>$('#algorithm-dialog').close());
$('#review-structure').addEventListener('click',openStructureReview);
$('#open-audit').addEventListener('click',()=>{const path=state.analysis?.output?.audit_relative_path;if(path&&globalThis.desktop?.showOutput)globalThis.desktop.showOutput(path).catch(error=>toast(error.message));});
$('#export-config').addEventListener('click',()=>download(configSnapshot(),`neuroflow-${state.mode}-pipeline.json`));
$('#run-button').addEventListener('click',runPipeline);
$$('[data-signal]').forEach(button=>button.addEventListener('click',()=>{if(button.dataset.signal==='processed'&&!state.analysis?.preview?.processed)return toast(t('toast.runForProcessed'));state.processed=button.dataset.signal==='processed';state.signalWindow.preview=null;state.signalWindow.start=0;$$('[data-signal]').forEach(item=>item.classList.toggle('selected',item===button));drawSignal();renderDataset();if(state.singleChannel)loadSignalWindow();}));
$('#channel-select').addEventListener('change',event=>{state.singleChannel=event.target.value!=='__all__';state.selectedChannel=state.singleChannel?event.target.value:null;state.signalWindow.preview=null;loadSignalWindow();});
$('#export-channel').addEventListener('click',exportSelectedChannel);
$('#signal-canvas').addEventListener('click',event=>{const preview=activeSignalPreview(),names=preview?.channel_names||[];if(!names.length)return;const rect=event.currentTarget.getBoundingClientRect(),index=Math.max(0,Math.min(names.length-1,Math.floor((event.clientY-rect.top)/rect.height*names.length)));state.selectedChannel=names[index];state.singleChannel=true;state.signalWindow.preview=null;loadSignalWindow();});
installSignalNavigation();
$('#signal-zoom-in').addEventListener('click',()=>zoomSignalWindow(.5));
$('#signal-zoom-out').addEventListener('click',()=>zoomSignalWindow(2));
$('#chat-form').addEventListener('submit',event=>{event.preventDefault();if(state.sending){state.streamController?.abort();return;}sendMessage($('#chat-input').value);});
$('#chat-input').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();sendMessage(event.target.value);}});
$$('[data-prompt]').forEach(button=>button.addEventListener('click',()=>sendMessage(button.dataset.i18n?t(button.dataset.i18n):button.dataset.prompt)));
$$('.settings-trigger').forEach(button=>button.addEventListener('click',async()=>{$('#backend-mode').value=state.backend;$('#backend-url').value=state.url;$('#settings-dialog').showModal();await globalThis.NeuroModelSettings?.load();}));
$('#close-settings').addEventListener('click',()=>$('#settings-dialog').close());
async function checkBackend(){
  if(state.backend==='demo'){setConnectionState('demo',t('status.demo'));return;}
  setConnectionState('checking',t('status.checking'));
  try{const response=await fetch(`${state.url}/ping`,{signal:AbortSignal.timeout(4000)});if(!response.ok)throw new Error(`HTTP ${response.status}`);setConnectionState('online',t('status.online'));await ensureSession();await openSession(state.session);}
  catch{setConnectionState('offline',t('status.offline'));}
}
function setConnectionState(status,label){$('#connection-status').textContent=label;$('#backend-dot').dataset.status=status;}
$('#settings-form').addEventListener('submit',async event=>{event.preventDefault();if(state.sending)return toast(t('toast.wait'));const selectedBackend=$('#backend-mode').value;if(selectedBackend==='backend'){try{await globalThis.NeuroModelSettings?.save();}catch(error){return toast(error.message);}}state.backend=selectedBackend;state.url=$('#backend-url').value;localStorage.setItem('neuroflow-connection',JSON.stringify({backend:state.backend,url:state.url}));$('#agent-mode').textContent=state.backend==='demo'?t('agent.demo'):t('agent.backend');$('#settings-dialog').close();await checkBackend();toast(t('toast.saved'));});
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
