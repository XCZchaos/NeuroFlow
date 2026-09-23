const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
app.setPath('userData',path.join(__dirname,'../../.cache/workspace-pages-electron'));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const window=new BrowserWindow({show:false,width:1600,height:1000,webPreferences:{contextIsolation:true,nodeIntegration:false,offscreen:true,backgroundThrottling:false}});
 try{
  await window.loadFile(path.join(__dirname,'../renderer/index.html'));
  const result=await window.webContents.executeJavaScript(`(async()=>{
    const el=id=>document.getElementById(id),nav=page=>document.querySelector('[data-view="'+page+'"]').click();
    const sameChat=el('chat-form'),sameMessages=el('messages');
    if(document.querySelector('[data-view="workspace"]'))throw Error('old combined navigation still present');
    state.backend='demo';nav('eeg');state.steps[0].params[0][1]='3';state.current={name:'EEG selected',mode:'EEG',size:0};
    nav('meg');if(state.mode!=='MEG'||el('workspace-view').parentElement.id!=='meg-view')throw Error('MEG page not active');
    state.steps[0].enabled=false;nav('fnirs');if(state.mode!=='fNIRS')throw Error('fNIRS page not active');
    nav('eeg');if(state.steps[0].params[0][1]!=='3'||state.current?.name!=='EEG selected')throw Error('EEG state lost: '+JSON.stringify({param:state.steps[0].params[0][1],start:state.signalWindow.start}));
    nav('meg');if(state.steps[0].enabled)throw Error('MEG state lost');
    for(const page of ['eeg','meg','fnirs','datasets','history','sessions','help','sleep','ppg']){
      nav(page);if(el(page+'-view').hidden||state.view!==page)throw Error('navigation failed: '+page);
      if(el('chat-form')!==sameChat||el('messages')!==sameMessages||!el('global-agent-dock').contains(sameChat))throw Error('chat duplicated or moved into hidden page');
      if(document.querySelectorAll('#chat-form').length!==1||el('context-mode').textContent!==NeuroPages.pageLabel(page))throw Error('wrong agent context');
    }
    state.sending=true;nav('meg');if(state.view!=='ppg')throw Error('page changed during active request');state.sending=false;
    NeuroI18n.setLocale('en');if(!document.querySelector('[data-view="meg"]').textContent.includes('MEG preprocessing'))throw Error('translation missing');
    NeuroI18n.setLocale('zh-CN');
    const originalFetch=window.fetch;let requests=[];
    state.backend='backend';state.current={datasetId:'old-eeg',name:'private.edf',mode:'EEG'};
    window.fetch=async(url,options={})=>{
      if(String(url).endsWith('/chatStream')){requests.push(JSON.parse(options.body));return new Response('event: message\\ndata: Answer from test model\\n\\nevent: done\\ndata: [DONE]\\n\\n',{headers:{'Content-Type':'text/event-stream'}});}
      if(String(url).endsWith('/sessions'))return {ok:true,status:200,json:async()=>({sessions:[]})};
      if(String(url).endsWith('/ppg/prepare'))return {ok:true,json:async()=>({ok:true,ppg_id:'ppg-token'})};
      if(String(url).endsWith('/ppg/inspect'))return {ok:true,json:async()=>({ok:true,channels:['PPG'],samples:3000,sampling_rate_hz:100,file_name:'private.csv'})};
      if(String(url).endsWith('/ppg/ppg-token/latest'))return {ok:true,json:async()=>({ok:true,file_name:'private.csv',channels:['PPG'],sampling_rate_hz:100,samples:3000,start_seconds:0,end_seconds:30,mean_bpm:72,peak_count:36,warnings:[],analysis_id:'new-ppg',waveform:{time:[0,1,2],raw:[0,1,0],cleaned:[0,.5,0]},peaks:[],heart_rate:{time:[1,2],bpm:[72,72]}})};
      return {ok:false,status:404,json:async()=>({message:'not found'})};
    };
    try{
      nav('help');await sendMessage('How do I import data?');
      if(requests.at(-1).dataset_id!==''||requests.at(-1).workspace!=='help'||requests.at(-1).question.includes('private.edf'))throw Error('help inherited EEG data');
      nav('ppg');el('ppg-path').value='C:/private/pulse.csv';el('ppg-inspect').click();
      for(let i=0;i<50&&!el('ppg-cancel').hidden;i++)await new Promise(r=>setTimeout(r,10));
      await sendMessage('Analyze PPG with selected settings');
      const body=requests.at(-1);if(body.workspace!=='ppg'||body.dataset_id!==''||body.ppg_id!=='ppg-token'||body.question.includes('C:/private'))throw Error('PPG context or privacy boundary failed');
      if(el('ppg-bpm').textContent!=='72.0')throw Error('Agent result not plotted');
    }finally{window.fetch=originalFetch;state.backend='demo';state.current=null;}
    nav('eeg');
    return 'Passed: nine pages, modality state isolation, shared chat, language, execution lock, page-scoped requests and PPG Agent result refresh';
  })()`);
  await new Promise(r=>setTimeout(r,250));const shot=await window.webContents.capturePage();const target=path.join(__dirname,'../../.cache/workspace-pages.png');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,shot.toPNG());
  console.log(result);app.exit(0);
 }catch(error){console.error(error);app.exit(1);}
});
