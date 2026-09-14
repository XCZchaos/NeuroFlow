// Live backend progress, persistent task state, BIDS browser, and MEG controls.
let advancedProgressSource=null, advancedProgressDataset='', advancedTaskRevision=-1;
let advancedCurrentTask=null;
let advancedRenderedAnalysis='';
let advancedBatchSignature='';
const advancedLiveSteps=new Map();
const advancedStepEN={erp:'ERP analysis',time_frequency:'Time-frequency analysis',decoding:'Cross-validated decoding',report:'Reproducible report',maxwell_filter:'Maxwell filter',environmental_noise:'Empty-room noise reduction',analysis:'Analysis'};

function ensureAdvancedPanels(){
  const aside=document.querySelector('.agent-column'),agent=aside?.querySelector('.agent-card');
  if(aside&&agent&&!document.querySelector('#task-monitor')){
    const panel=document.createElement('section');panel.id='task-monitor';panel.className='card task-monitor';
    panel.innerHTML='<div class="section-heading"><h2>任务与执行进度</h2><span class="pill neutral" id="task-status">空闲</span></div><p class="task-empty" id="task-summary">运行流程或让 Agent 执行操作后，这里会显示后端真实步骤。</p><div id="task-steps" class="audit-steps"></div><div id="meg-controls" class="meg-controls" hidden><label>SSS 模式<select id="meg-sss-mode"><option value="none">不执行</option><option value="sss">SSS</option><option value="tsss">tSSS</option></select></label><label>tSSS 窗口（秒）<input id="meg-st-duration" type="number" min="0.1" step="0.1" value="10"></label><label class="wide">空房 MEG 数据<select id="meg-empty-room"><option value="">未选择</option></select></label></div>';
    agent.after(panel);
  }
  const quality=$('#quality-card');
  if(quality&&!$('#analysis-products')){const products=document.createElement('section');products.id='analysis-products';products.className='card analysis-products';products.hidden=true;products.innerHTML='<div class="section-heading"><h2>ERP、时频与解码</h2><span class="pill">MNE</span></div><div id="product-grid" class="product-grid"></div><canvas id="product-canvas" aria-label="ERP 与时频结果图"></canvas>';quality.after(products);}
  const datasets=document.querySelector('#datasets-view'),heading=datasets?.querySelector('.section-heading');
  if(heading&&!document.querySelector('#browse-bids')){
    const button=element('button','button light',i18n.getLocale()==='en'?'Browse BIDS':'浏览 BIDS');button.id='browse-bids';
    button.addEventListener('click',browseBIDSRoot);heading.append(button);
    const browser=document.createElement('div');browser.id='bids-browser';browser.hidden=true;heading.after(browser);
  }
  if(datasets&&!document.querySelector('#batch-panel')){
    const panel=document.createElement('section');panel.id='batch-panel';panel.className='batch-panel';panel.innerHTML='<div class="section-heading"><h2>批量分析</h2><span class="pill neutral">SQLite 队列</span></div><p class="task-empty">选择同一模态的多个数据集，使用当前流程依次处理。单个失败不会中止整个批次。</p><div id="batch-datasets"></div><div class="batch-actions"><input id="batch-name" maxlength="80" placeholder="批次名称"><label><input id="batch-save" type="checkbox" checked> 保存结果</label><button id="create-batch" class="button primary">开始批处理</button></div><div id="batch-jobs"></div>';
    datasets.append(panel);panel.querySelector('#create-batch').addEventListener('click',createAdvancedBatch);
  }
}

function renderBatchDatasets(){
  ensureAdvancedPanels();const target=$('#batch-datasets');if(!target)return;const items=state.datasets.filter(item=>item.datasetId&&item.mode===state.mode),signature=items.map(item=>`${item.datasetId}:${item.name}`).join('|');if(signature===advancedBatchSignature)return;advancedBatchSignature=signature;target.replaceChildren();
  if(!items.length){target.append(element('p','task-empty',i18n.getLocale()==='en'?'Import at least one parsed dataset in the current modality.':'请先导入当前模态的已解析数据集。'));return;}
  for(const item of items){const label=element('label','batch-dataset');const input=document.createElement('input');input.type='checkbox';input.value=item.datasetId;label.append(input,element('span','',item.name),element('small','',`${item.inspection?.channel_count||0} ch · ${item.inspection?.sampling_rate_hz||0} Hz`));target.append(label);}
}
async function createAdvancedBatch(){
  if(state.backend!=='backend')return toast(t('toast.connectBackend'));const ids=[...document.querySelectorAll('#batch-datasets input:checked')].map(input=>input.value);if(!ids.length)return toast(i18n.getLocale()==='en'?'Select at least one dataset':'请至少选择一个数据集');
  const enabled=state.steps.filter(step=>step.enabled).map(step=>step.key),body={name:$('#batch-name').value||`${state.mode} batch`,dataset_ids:ids,save_output:$('#batch-save').checked,parameters:{analysis_type:'full',enabled_steps:enabled}};
  const response=await fetch(`${state.url}/batches`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await response.json();if(!response.ok)return toast(data.message||'Batch creation failed');toast(i18n.getLocale()==='en'?'Batch queued':'批次已进入队列');await loadAdvancedBatches();
}
async function batchAction(id,action,retry=false){const response=await fetch(`${state.url}/batches/${encodeURIComponent(id)}/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({retry_failed:retry})});if(!response.ok){const data=await response.json();toast(data.message||'Batch action failed')}await loadAdvancedBatches();}
async function loadAdvancedBatches(){
  renderBatchDatasets();if(state.backend!=='backend')return;try{const response=await fetch(`${state.url}/batches`,{signal:AbortSignal.timeout(5000)});if(!response.ok)return;const data=await response.json(),target=$('#batch-jobs');target.replaceChildren();for(const job of data.batches||[]){const card=element('article','batch-job'),head=element('div','batch-job-head');head.append(element('strong','',job.name||job.id),element('span',`pill ${job.status==='completed'?'':'neutral'}`,job.status));card.append(head,element('p','',`${job.summary?.completed||0}/${job.summary?.total||0} completed · ${job.summary?.failed||0} failed`));const items=element('div','batch-items');for(const item of job.items||[]){const row=element('div',`audit-step ${item.status}`);row.append(element('strong','',item.name||item.dataset_id),element('span','',item.error||item.status));items.append(row)}card.append(items);const actions=element('div','batch-job-actions');if(['running','queued'].includes(job.status)){const pause=element('button','button light',i18n.getLocale()==='en'?'Pause':'暂停');pause.onclick=()=>batchAction(job.id,'pause');actions.append(pause)}if(['paused','interrupted','completed_with_errors'].includes(job.status)){const resume=element('button','button light',i18n.getLocale()==='en'?'Resume / retry':'恢复 / 重试');resume.onclick=()=>batchAction(job.id,'resume',true);actions.append(resume)}card.append(actions);target.append(card)}}catch{}
}

function renderAnalysisProducts(){
  ensureAdvancedPanels();const panel=$('#analysis-products'),products=state.analysis?.result?.analysis_products||{};
  const id=state.analysis?.analysis_id||'';if(id===advancedRenderedAnalysis)return;advancedRenderedAnalysis=id;
  if(!panel||!Object.keys(products).length){if(panel)panel.hidden=true;return;}panel.hidden=false;
  panel.querySelector('h2').textContent=i18n.getLocale()==='en'?'ERP, time-frequency and decoding':'ERP、时频与解码';
  const grid=$('#product-grid');grid.replaceChildren();
  const erp=products.erp;if(erp){const names=Object.keys(erp.conditions||{}),item=element('div','product-item');item.append(element('strong','',`ERP · ${names.length} conditions`),element('span','',names.map(name=>`${name}: ${erp.conditions[name].gfp_peak_time_s.toFixed(3)} s`).join(' · ')||erp.reason||'—'));grid.append(item);}
  const tfr=products.time_frequency;if(tfr){const item=element('div','product-item');item.append(element('strong','',`Morlet TFR · ${(tfr.frequencies_hz||[]).length} bins`),element('span','',tfr.performed?`${tfr.epoch_limit} epochs · ${tfr.channel_limit} channels`:(tfr.reason||'—')));grid.append(item);}
  const decoding=products.decoding;if(decoding){const item=element('div','product-item');item.append(element('strong','',`CSP + LDA · ${decoding.metric||'not run'}`),element('span','',decoding.performed?`${(decoding.mean*100).toFixed(1)}% ± ${(decoding.std*100).toFixed(1)}% · ${decoding.folds} folds`:(decoding.reason||'—')));grid.append(item);}
  const canvas=$('#product-canvas'),width=canvas.clientWidth,height=150,ratio=devicePixelRatio||1;canvas.width=width*ratio;canvas.height=height*ratio;const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
  const first=erp?.conditions?.[Object.keys(erp.conditions||{})[0]],series=first?.gfp_si||tfr?.mean_power_si2||[];
  if(series.length>1){const min=Math.min(...series),max=Math.max(...series),range=max-min||1;ctx.strokeStyle='#16846d';ctx.lineWidth=1.5;ctx.beginPath();series.forEach((value,index)=>{const x=10+(width-20)*index/(series.length-1),y=height-12-(height-24)*(value-min)/range;if(index)ctx.lineTo(x,y);else ctx.moveTo(x,y)});ctx.stroke();}
}

function renderAdvancedProgress(task=advancedCurrentTask){
  ensureAdvancedPanels();const list=$('#task-steps'),badge=$('#task-status'),summary=$('#task-summary');if(!list)return;
  document.querySelector('#task-monitor h2').textContent=i18n.getLocale()==='en'?'Tasks and execution progress':'任务与执行进度';
  const bidsButton=$('#browse-bids');if(bidsButton)bidsButton.textContent=i18n.getLocale()==='en'?'Browse BIDS':'浏览 BIDS';
  const persisted=task?.steps||[],combined=new Map(persisted.map(item=>[item.name,{step:item.name,...item}]));
  for(const [name,event] of advancedLiveSteps)combined.set(name,event);
  list.replaceChildren(...[...combined.values()].map(item=>{
    const row=element('div',`audit-step ${item.status||'pending'}`),attempt=item.attempt>1?` · #${item.attempt}`:'';
    const name=item.step||item.name,label=i18n.getLocale()==='en'?(advancedStepEN[name]||i18n.domain(name)):i18n.domain(name);
    row.append(element('strong','',label),element('span','',`${item.status||'pending'}${attempt}${item.detail?` · ${item.detail}`:''}`));return row;
  }));
  const status=task?.status||([...advancedLiveSteps.values()].some(v=>['started','running','candidate'].includes(v.status))?'running':advancedLiveSteps.size?'updated':'idle');
  badge.textContent=status;badge.className=`pill ${status==='completed'?'':'neutral'}`;
  const missing=(task?.pending_fields||[]).filter(field=>!task.answers?.[field.name]);
  summary.textContent=missing.length?(i18n.getLocale()==='en'?`Waiting for: ${missing.map(v=>v.name).join(', ')}`:`等待用户确认：${missing.map(v=>v.name).join('、')}`):(task?`${task.dataset_id||''} · revision ${task.revision}`:(i18n.getLocale()==='en'?'Backend steps appear here in real time.':'后端真实步骤会实时显示在这里。'));
  const controls=$('#meg-controls');if(controls)controls.hidden=state.mode!=='MEG';
  const empty=$('#meg-empty-room');if(empty){const selected=empty.value,items=state.datasets.filter(item=>item.mode==='MEG'&&item.datasetId!==state.current?.datasetId),signature=items.map(item=>`${item.datasetId}:${item.name}`).join('|');if(empty.dataset.signature!==signature){const placeholder=element('option','','未选择');placeholder.value='';empty.replaceChildren(placeholder,...items.map(item=>{const option=element('option','',item.name);option.value=item.datasetId;return option;}));empty.dataset.signature=signature;empty.value=items.some(v=>v.datasetId===selected)?selected:'';}}
}

function connectAdvancedProgress(){
  const id=state.current?.datasetId||'';if(id===advancedProgressDataset)return;
  advancedProgressSource?.close();advancedProgressSource=null;advancedProgressDataset=id;advancedLiveSteps.clear();
  if(!id||state.backend!=='backend'||typeof EventSource==='undefined'){renderAdvancedProgress();return;}
  advancedProgressSource=new EventSource(`${state.url}/datasets/${encodeURIComponent(id)}/analysis/events`);
  advancedProgressSource.addEventListener('progress',event=>{
    const value=JSON.parse(event.data);if(value.step==='analysis'&&value.status==='started')advancedLiveSteps.clear();
    advancedLiveSteps.set(value.step,value);renderAdvancedProgress();
    if(value.status==='completed'&&value.step==='analysis')syncLatestAgentAnalysis(state.current,'');
  });
}

async function loadAdvancedTask(){
  if(state.backend!=='backend'||!state.session)return renderAdvancedProgress();
  try{const response=await fetch(`${state.url}/sessions/${encodeURIComponent(state.session)}/task`,{signal:AbortSignal.timeout(5000)});if(!response.ok)return;const data=await response.json();if((data.task?.revision??-1)!==advancedTaskRevision){advancedTaskRevision=data.task?.revision??-1;advancedCurrentTask=data.task;renderAdvancedProgress();}}catch{}
}

async function browseBIDSRoot(){
  if(state.backend!=='backend')return toast(t('toast.connectBackend'));
  const root=await globalThis.desktop?.selectBIDSRoot?.();if(!root)return;
  const response=await fetch(`${state.url}/bids/browse`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:root})});
  const data=await response.json();if(!response.ok)return toast(data.message||'BIDS browse failed');
  const panel=$('#bids-browser');panel.hidden=false;panel.replaceChildren(element('strong','',`${data.name} · ${data.recordings.length} recordings`));
  for(const recording of data.recordings){const row=element('div','bids-recording'),info=element('div');info.append(element('strong','',recording.relative_path),element('small','',`sub-${recording.subject||'?'} · ${recording.datatype} · task-${recording.task||'n/a'}`));const open=element('button','button light',i18n.getLocale()==='en'?'Import':'导入');open.addEventListener('click',()=>importPaths([recording.path]));row.append(info,open);panel.append(row);}
}

ensureAdvancedPanels();renderAdvancedProgress();connectAdvancedProgress();loadAdvancedTask();loadAdvancedBatches();
setInterval(()=>{connectAdvancedProgress();loadAdvancedTask();renderAdvancedProgress();renderAnalysisProducts();loadAdvancedBatches();},1500);
document.addEventListener('neuroflow:localechange',()=>{advancedProgressDataset='';connectAdvancedProgress();loadAdvancedTask();});
