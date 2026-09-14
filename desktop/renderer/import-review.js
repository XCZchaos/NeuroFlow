/* 导入编辑器：按原始通道索引保存编辑项，删除仅从分析中排除，永不删除采集文件。 */
let reviewDataset=null, reviewResult=null;
const reviewText=(zh,en)=>globalThis.NeuroI18n.getLocale()==='en'?en:zh;
function renderStructureReview(meta){
  const card=document.querySelector('#structure-card');card.hidden=!meta;if(!meta)return;
  const report=meta.structure_report||{};
  document.querySelector('#structure-confidence').textContent=report.confirmed_by_user?reviewText('已重新读取确认','Reread and confirmed'):reviewText('待复核','Review required');
  document.querySelector('#structure-summary').textContent=`${meta.channel_count} channels · ${meta.sampling_rate_hz} Hz · ${meta.montage||'—'}`;
  document.querySelector('#review-structure').textContent=reviewText('编辑并试读','Edit and reread');
  document.querySelector('#structure-card h2').textContent=reviewText('数据结构确认','Import structure');
}
function openStructureReview(){
  if(state.running||state.sending)return toast(reviewText('请等待当前任务结束','Wait for the current task'));
  reviewDataset=state.current;if(!reviewDataset?.inspection)return;
  const dialog=$('#structure-dialog');dialog.replaceChildren();
  const form=element('form');form.id='structure-form';
  const title=element('h2','',reviewText('数据结构与设备模板','Import structure and device templates'));
  const close=element('button','button light',reviewText('关闭','Close'));close.type='button';close.onclick=()=>dialog.close();
  const heading=element('div','section-heading');heading.append(title,close);form.append(heading);
  const note=element('p','',reviewText('单位是表格中的原始电压单位；标准文件由 MNE 转换为 SI。参考通道仅标记采集参考，不执行重参考。排除通道不修改原文件。','Units describe source table voltages; MNE converts standard files to SI. Reference flags describe acquisition only. Exclusion does not modify source files.'));form.append(note);
  const fields=[['confirm-rate',reviewText('采样率 Hz（纠正时基，不重采样）','Sampling rate Hz (timebase correction)'), 'number'],['confirm-unit',reviewText('表格原始单位','Source table unit'),'select'],['confirm-layout',reviewText('矩阵方向（原文件）','Matrix layout (source)'),'select'],['confirm-montage','Montage','text']];
  fields.forEach(([id,label,type])=>{const wrapper=element('label','field-label',label),input=element(type==='select'?'select':'input');input.id=id;if(type!=='select'){input.type=type;if(type==='number'){input.min='.001';input.step='any';input.required=true;}}wrapper.append(input);form.append(wrapper);});
  [['confirm-unit',[['','自动 / Auto'],['nV','nV'],['uV','µV'],['mV','mV'],['V','V']]],['confirm-layout',[['','自动 / Auto'],['samples_x_channels',reviewText('行=采样点，列=通道','Rows=samples, columns=channels')],['channels_x_samples',reviewText('行=通道，列=采样点','Rows=channels, columns=samples')]]]].forEach(([id,options])=>options.forEach(([value,label])=>{const option=element('option','',label);option.value=value;form.querySelector('#'+id).append(option);}));
  const config=reviewDataset.inspection.structure_report?.import_config||{};
  form.querySelector('#confirm-rate').value=config.sampling_rate_hz||reviewDataset.inspection.sampling_rate_hz;
  form.querySelector('#confirm-unit').value=config.unit||reviewDataset.inspection.signal_unit||'';
  form.querySelector('#confirm-layout').value=config.layout||'';
  form.querySelector('#confirm-montage').value=config.montage||reviewDataset.inspection.montage||'';
  const generic=/^(CSV|TSV|TXT|MAT|BIN|DAT|RAW)$/.test(reviewDataset.inspection.format);
  form.querySelector('#confirm-unit').disabled=!generic;form.querySelector('#confirm-layout').disabled=!/^(CSV|TSV|TXT|MAT)$/.test(reviewDataset.inspection.format);
  const table=element('table','review-table');table.id='review-channels';form.append(table);
  const events=element('label','field-label',reviewText('事件字典 JSON（对象表示旧标签 → 新标签）','Event dictionary JSON (object: old → new label)'));const area=element('textarea');area.id='confirm-events';area.value=JSON.stringify(config.event_dictionary||reviewDataset.inspection.event_dictionary||[],null,2);events.append(area);form.append(events);
  const templateName=element('input');templateName.id='review-template-name';templateName.placeholder=reviewText('设备模板名称','Device template name');
  const templates=element('select');templates.id='review-templates';
  const bar=element('div','review-actions');bar.append(templateName,templates);
  const button=(label,fn)=>{const node=element('button','button light',label);node.type='button';node.onclick=fn;return node;};
  bar.append(button(reviewText('保存模板','Save template'),()=>{const name=templateName.value.trim();if(!name)return;try{const saved=JSON.parse(localStorage.getItem('neuroflow-import-templates')||'{}');saved[name]=reviewConfig();delete saved[name].event_dictionary;localStorage.setItem('neuroflow-import-templates',JSON.stringify(saved));loadTemplateOptions();toast(reviewText('模板已保存','Template saved'));}catch(e){toast(e.message);}}),button(reviewText('应用模板','Apply template'),()=>{try{const c=JSON.parse(localStorage.getItem('neuroflow-import-templates')||'{}')[templates.value];if(!c)return;$('#confirm-rate').value=c.sampling_rate_hz;$('#confirm-unit').value=c.unit||'';$('#confirm-layout').value=c.layout||'';$('#confirm-montage').value=c.montage||'';renderReviewChannels(c.channels||[]);reviewResult=null;$('#review-feedback').textContent=reviewText('模板已应用，请重新试读验证','Template applied; reread to validate');}catch(e){toast(e.message);}}));form.append(bar);
  const feedback=element('pre');feedback.id='review-feedback';form.append(feedback);
  const canvas=element('canvas');canvas.id='review-montage';canvas.height=260;form.append(canvas);
  const ranges=element('div');ranges.id='review-ranges';form.append(ranges);
  const preview=button(reviewText('重新读取并预览','Reread and preview'),()=>submitReview(false));
  const save=button(reviewText('验证并确认','Validate and confirm'),()=>submitReview(true));form.append(preview,save);form.onsubmit=e=>e.preventDefault();dialog.append(form);
  renderReviewChannels(config.channels||reviewDataset.inspection.channel_names.map((name,i)=>({name,type:reviewDataset.inspection.structure_report?.channel_types?.[i]||'eeg'})));
  $('#confirm-layout').onchange=()=>{renderReviewChannels([]);$('#review-feedback').textContent=reviewText('方向已变更：请试读生成新通道列表，再编辑名称。','Layout changed: reread to generate channel rows before editing.');};
  loadTemplateOptions();dialog.showModal();reviewResult=null;
}
function loadTemplateOptions(){const select=$('#review-templates');select.replaceChildren();Object.keys(JSON.parse(localStorage.getItem('neuroflow-import-templates')||'{}')).forEach(name=>{const o=element('option','',name);o.value=name;select.append(o);});}
function renderReviewChannels(channels){
  const table=$('#review-channels');table.replaceChildren();const head=element('tr');[reviewText('名称','Name'),reviewText('类型','Type'),reviewText('采集参考','Reference'),reviewText('排除','Exclude')].forEach(label=>head.append(element('th','',label)));table.append(head);
  channels.forEach(c=>{const row=element('tr');row.className='review-channel';const name=element('input');name.value=c.name;name.className='review-name';const type=element('select');type.className='review-type';[...new Set([c.type,'eeg','eog','ecg','emg','stim','misc','bio','resp'])].filter(Boolean).forEach(value=>{const o=element('option','',value);o.value=value;type.append(o);});type.value=c.type||'eeg';const ref=element('input');ref.type='checkbox';ref.className='review-ref';ref.checked=!!c.reference;const drop=element('input');drop.type='checkbox';drop.className='review-drop';drop.checked=!!c.drop;[name,type,ref,drop].forEach(input=>{const td=element('td');td.append(input);row.append(td);});table.append(row);});
}
function reviewConfig(){return {sampling_rate_hz:Number($('#confirm-rate').value),unit:$('#confirm-unit').disabled?'':$('#confirm-unit').value,layout:$('#confirm-layout').disabled?'':$('#confirm-layout').value,montage:$('#confirm-montage').value.trim(),event_dictionary:JSON.parse($('#confirm-events').value||'[]'),channels:[...document.querySelectorAll('.review-channel')].map(row=>({name:row.querySelector('.review-name').value.trim(),type:row.querySelector('.review-type').value,reference:row.querySelector('.review-ref').checked,drop:row.querySelector('.review-drop').checked}))};}
async function submitReview(commit){
  const buttons=[...$('#structure-dialog').querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);
  try{
    const config=reviewConfig();if(!Number.isFinite(config.sampling_rate_hz)||config.sampling_rate_hz<=0)throw Error(reviewText('采样率无效','Invalid sampling rate'));
    $('#review-feedback').textContent=reviewText('正在重新读取原始数据…','Rereading original data…');
    const response=await fetch(`${state.url}/datasets/${encodeURIComponent(reviewDataset.datasetId)}/structure?preview=${!commit}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(config),signal:AbortSignal.timeout(95000)});
    const record=await response.json();if(!response.ok)throw Error(record.message||`HTTP ${response.status}`);
    reviewResult=record.inspection;const report=reviewResult.structure_report;
    if(!config.channels.length)renderReviewChannels(reviewResult.channel_names.map((name,i)=>({name,type:report.channel_types[i]})));
    $('#review-feedback').textContent=[reviewText('重新读取成功','Reread successful'),`${reviewResult.channel_count} channels · ${reviewResult.sample_count} samples · ${reviewResult.sampling_rate_hz} Hz`,...(reviewResult.structure_warnings||[]),...(reviewResult.structure_conflicts||[])].join('\n');
    renderReviewEvidence(report);
    if(commit){reviewDataset.inspection=record.inspection;reviewDataset.analysis=null;reviewDataset.preview=await loadRawPreview(reviewDataset.datasetId);if(state.current===reviewDataset){state.analysis=null;state.processed=false;state.signalWindow.preview=null;state.selectedChannel=null;state.singleChannel=false;renderDataset();drawSignal();}toast(reviewText('配置已保存并用于实际读取','Configuration saved and applied to actual reads'));}
  }catch(error){$('#review-feedback').textContent=error.message;}finally{buttons.forEach(b=>b.disabled=false);}
}
function renderReviewEvidence(report){
  const target=$('#review-ranges');target.replaceChildren();target.append(element('p','',reviewText('首 10 秒以内真实振幅范围（V；未去均值）','Actual amplitude ranges, first ≤10 seconds (V; no centering)')));
  const table=element('table','review-table');(report.amplitude_ranges||[]).forEach(r=>{const row=element('tr');[r.name,r.min.toExponential(4),r.max.toExponential(4),`Δ ${r.peak_to_peak.toExponential(4)} ${r.unit}`].forEach(v=>row.append(element('td','',v)));table.append(row);});target.append(table);
  const canvas=$('#review-montage'),ctx=canvas.getContext('2d');canvas.width=600;canvas.height=260;ctx.clearRect(0,0,600,260);ctx.strokeStyle='#16846d';ctx.beginPath();ctx.arc(300,130,105,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(290,25);ctx.lineTo(300,10);ctx.lineTo(310,25);ctx.stroke();ctx.font='12px sans-serif';
  const positions=report.channel_positions||[];const scale=95/Math.max(.1,...positions.map(p=>Math.hypot(p.x,p.y)));positions.forEach(p=>{const x=300+p.x*scale,y=130-p.y*scale;ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fillStyle='#16846d';ctx.fill();ctx.fillText(p.name,x+6,y);});if(!positions.length)ctx.fillText(reviewText('无可用电极坐标','No electrode coordinates available'),215,130);
}
