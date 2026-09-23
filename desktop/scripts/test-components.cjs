const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
app.setPath('userData',path.join(__dirname,'../../.cache/component-context-electron'));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1600,height:1000,webPreferences:{contextIsolation:true,nodeIntegration:false,offscreen:true,backgroundThrottling:false}});
 try{
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));
  const result=await win.webContents.executeJavaScript(`(async()=>{
   const el=id=>document.getElementById(id),nav=id=>document.querySelector('[data-view="'+id+'"]').click();
   state.backend='demo';nav('eeg');
   const field=document.querySelector('.param-input');field.click();field.value='2.5';field.dispatchEvent(new Event('input',{bubbles:true}));
   let snapshot=NeuroComponents.snapshot('eeg','');
   if(snapshot.focused_component_id!=='pipeline')throw Error('Parameter focus not tracked: '+JSON.stringify(snapshot)+' active='+document.activeElement.className+' focus='+el('agent-component-focus').textContent);
   let selected=snapshot.components.find(c=>c.id==='pipeline');
   if(selected.state.selected_parameter.value!=='2.5')throw Error('Edited parameter stale');
   const stepKey=selected.state.selected_step.key;movePipelineStep(0,1);snapshot=NeuroComponents.snapshot('eeg','');
   if(snapshot.components.find(c=>c.id==='pipeline').state.selected_step.key!==stepKey)throw Error('Reorder changed selected step identity');
   const enabled=state.steps[1].enabled;el('agent-pick-component').click();document.querySelectorAll('.pipeline-step input[type=checkbox]')[1].click();
   if(state.steps[1].enabled!==enabled)throw Error('Pick mode executed checkbox action');
   el('agent-pick-component').click();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));if(document.body.classList.contains('agent-component-picking'))throw Error('Escape failed');
   state.singleChannel=true;state.selectedChannel='Cz';state.signalWindow={start:15,duration:5,loading:false,preview:{start_seconds:15,duration_seconds:5,unit:'uV',channel_names:['Cz'],data:[[1,2,1]]}};
   document.querySelector('.signal-card h2').click();snapshot=NeuroComponents.snapshot('eeg','');selected=snapshot.components.find(c=>c.id==='signal');
   if(snapshot.focused_component_id!=='signal'||selected.state.selected_channel!=='Cz'||selected.state.requested_window.start_seconds!==15)throw Error('Signal selection lost');
   if(JSON.stringify(snapshot).includes('[[1,2,1]]'))throw Error('Raw waveform exposed');
   el('agent-pick-component').click();el('signal-zoom-in').disabled=true;el('signal-zoom-in').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}));
   snapshot=NeuroComponents.snapshot('eeg','');if(snapshot.components[0].selected_control.control_id!=='signal-zoom-in'||snapshot.components[0].selected_control.control_disabled!==true)throw Error('Disabled control could not be selected');
   const fakeKey='sk-ComponentTestSecret123456789';el('model-api-key').value=fakeKey;el('model-name').value='test-model';el('settings-dialog').showModal();el('model-name').click();
   snapshot=NeuroComponents.snapshot('eeg','');if(snapshot.focused_component_id!=='model-settings'||JSON.stringify(snapshot).includes(fakeKey))throw Error('Settings focus or secret exclusion failed');
   const originalFetch=window.fetch;let request=null;state.backend='backend';
   window.fetch=async(url,options={})=>{
    if(String(url).endsWith('/chatStream')){request=JSON.parse(options.body);return new Response('event: message\\ndata: This is a component explanation.\\n\\nevent: done\\ndata: [DONE]\\n\\n',{headers:{'Content-Type':'text/event-stream'}});}
    return {ok:true,status:200,json:async()=>({sessions:[]})};
   };
   try{
    document.querySelector('#settings-dialog .component-dialog-explain').click();
    for(let i=0;i<100&&state.sending;i++)await new Promise(r=>setTimeout(r,10));
    if(el('settings-dialog').open||request?.ui_context?.focused_component_id!=='model-settings'||!request.ui_context.explain_only)throw Error('Modal explanation lost snapshot or read-only flag before close');
    if(JSON.stringify(request.ui_context).includes(fakeKey))throw Error('Request exposed secret');
    nav('meg');if(!el('agent-explain-component').disabled)throw Error('Focus leaked across pages');
    nav('ppg');document.querySelector('.ppg-settings h2').click();el('ppg-rate').value='100';el('ppg-time-unit').value='ms';snapshot=NeuroComponents.snapshot('ppg','');
    selected=snapshot.components.find(c=>c.id==='ppg-settings');if(selected.state.time_unit!=='ms'||selected.state.sampling_rate_hz!==100)throw Error('PPG controls not represented');
    nav('help');document.querySelector('#help-agent h3').click();await sendMessage('Explain this component');
    if(request.ui_context.focused_component_id!=='help'||request.ui_context.components[0].selected_control.topic!=='help-agent')throw Error('Help topic not supplied');
    nav('eeg');state.importStatus={stage:'parsing',status:'failed',error:'Unable to open C:/private/data.csv '+fakeKey};document.querySelector('#dropzone h2').click();snapshot=NeuroComponents.snapshot('eeg','');
    const encoded=JSON.stringify(snapshot);if(encoded.includes('C:/private')||encoded.includes(fakeKey))throw Error('Sensitive error text not redacted');
    if(new TextEncoder().encode(encoded).length>24000)throw Error('Context exceeded budget');
    NeuroI18n.setLocale('en');if(el('agent-explain-component').textContent!=='Explain component')throw Error('English label missing');NeuroI18n.setLocale('zh-CN');
    document.querySelector('.param-input').focus();
   }finally{window.fetch=originalFetch;state.backend='demo';state.importStatus=null;}
   return 'Passed: focus, live parameters, stable step identity, selection without action, signal window, no raw data/secrets, modal snapshot, page isolation, PPG/help context and localization';
  })()`);
  await new Promise(r=>setTimeout(r,250));const shot=await win.webContents.capturePage();const target=path.join(__dirname,'../../.cache/components.png');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,shot.toPNG());console.log(result);app.exit(0);
 }catch(error){console.error(error);app.exit(1);}
});
