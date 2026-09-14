// 在实际 Electron DOM 中验证编辑器、模板和试读按钮，网络响应由固定样本替代。
const {app,BrowserWindow}=require('electron');
const path=require('node:path');
const fs=require('node:fs');
const resultPath=path.join(__dirname,'../../.cache/import-review-result.json');
fs.mkdirSync(path.dirname(resultPath),{recursive:true});
fs.writeFileSync(resultPath,JSON.stringify({status:'running'}));
app.setPath('userData',path.join(__dirname,'../../.cache/import-review-electron'));
app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
  const window=new BrowserWindow({show:false,webPreferences:{contextIsolation:true,nodeIntegration:false}});
  try{
    await window.loadFile(path.join(__dirname,'../renderer/index.html'));
    const result=await window.webContents.executeJavaScript(`(async()=>{
      if(!document.querySelector('#task-monitor')||!document.querySelector('#browse-bids')||!document.querySelector('#analysis-products'))throw Error('advanced task/BIDS/analysis panels missing');
      state.backend='demo';
      const original=localStorage.getItem('neuroflow-import-templates');
      try {
        state.current={datasetId:'test',inspection:{format:'CSV',modality:'EEG',channel_count:2,sampling_rate_hz:250,channel_names:['C3','C4'],structure_report:{channel_types:['eeg','eeg']}}};
        openStructureReview();
        if(document.querySelectorAll('.review-channel').length!==2)throw Error('channel rows missing');
        document.querySelector('.review-name').value='Fp1';
        document.querySelector('.review-ref').checked=true;
        document.querySelectorAll('.review-drop')[1].checked=true;
        const config=reviewConfig();
        if(config.channels[0].name!=='Fp1'||!config.channels[0].reference||!config.channels[1].drop)throw Error('channel editing failed');
        document.querySelector('#review-template-name').value='test-device';
        document.querySelector('.review-actions button').click();
        if(!JSON.parse(localStorage.getItem('neuroflow-import-templates'))['test-device'])throw Error('template not persisted');
        window.fetch=async()=>({ok:true,json:async()=>({inspection:{channel_count:1,sample_count:500,sampling_rate_hz:250,channel_names:['Fp1'],structure_report:{channel_types:['eeg'],amplitude_ranges:[{name:'Fp1',min:-1e-5,max:1e-5,peak_to_peak:2e-5,unit:'V'}],channel_positions:[{name:'Fp1',x:-.03,y:.08,z:.06}]}}})});
        await submitReview(false);
        if(!document.querySelector('#review-ranges').textContent.includes('Fp1'))throw Error('amplitude preview missing');
        state.current.inspection.structure_report={channel_types:['eeg','eeg'],reference_channels:['C3'],excluded_channels:['AUX'],channel_positions:[{name:'C3',x:-.04,y:0,z:.08}]};
        state.current.preview={available_channel_names:['C3','C4']};state.processed=false;state.analysis=null;state.signalWindow.preview=null;
        renderChannelLayout();
        if(document.querySelectorAll('#channel-layout-panel .layout-channel').length!==3)throw Error('layout channel list missing');
        if(document.querySelectorAll('#channel-layout-panel g[data-channel]').length!==1)throw Error('unknown coordinates were fabricated');
        if(!document.querySelector('#channel-layout-panel .excluded').disabled)throw Error('excluded channel enabled');
        const oldLoader=loadSignalWindow;let requested=false;
        loadSignalWindow=async()=>{requested=state.selectedChannel==='C3'&&state.singleChannel;};
        try{document.querySelector('#channel-layout-panel g[data-channel="C3"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));await Promise.resolve();if(!requested)throw Error('electrode click did not select waveform');}finally{loadSignalWindow=oldLoader;}
        state.current.inspection.structure_report.channel_positions=[];renderChannelLayout();
        if(document.querySelector('#channel-layout-panel svg'))throw Error('head outline shown without coordinates');
        if(document.querySelectorAll('.channel-order-tile').length!==3)throw Error('coordinate-free grid missing');
        requested=false;loadSignalWindow=async()=>{requested=state.selectedChannel==='C4'&&state.singleChannel;};
        try{document.querySelector('.channel-order-tile[data-channel="C4"]').click();await Promise.resolve();if(!requested)throw Error('coordinate-free channel click failed');}finally{loadSignalWindow=oldLoader;}
        const oldDraw=drawSignal;let paints=0,calls=0;
        drawSignal=()=>{paints++;};
        try{
          state.current.inspection.duration_seconds=100;
          state.signalWindow={start:0,duration:10,preview:null,loading:false};
          window.fetch=async url=>{calls++;const start=Number(new URL(url).searchParams.get('start'));return {ok:true,json:async()=>({start_seconds:start,channel_names:['C4'],available_channel_names:['C3','C4'],sample_rate_hz:250,data:[[1,2,3]]})};};
          await loadSignalWindow();await new Promise(r=>setTimeout(r,10));
          const before=calls;await loadSignalWindow();if(calls!==before)throw Error('window cache not reused');
          const wheel=new WheelEvent('wheel',{shiftKey:true,deltaY:120,bubbles:true,cancelable:true});document.querySelector('.signal-card').dispatchEvent(wheel);
          if(!wheel.defaultPrevented||state.signalWindow.start!==3)throw Error('Shift wheel pan failed');
          await new Promise(r=>setTimeout(r,130));if(state.signalWindow.preview.start_seconds!==3)throw Error('pan window not loaded');
          panSignalTo(-999);if(state.signalWindow.start!==0)throw Error('left bound failed');
          panSignalTo(999);if(state.signalWindow.start!==90)throw Error('right bound failed');
          clearTimeout(signalPanTimer);signalPanTimer=null;signalPrefetch?.abort();
          signalCache.clear();let aborted=false;
          window.fetch=async(url,options)=>{const start=Number(new URL(url).searchParams.get('start'));let completed=false;options.signal.addEventListener('abort',()=>{if(start===15&&!completed)aborted=true;});await new Promise(r=>setTimeout(r,30));completed=true;return {ok:true,json:async()=>({start_seconds:start,channel_names:['C4'],sample_rate_hz:250,data:[[start,2,3]]})};};
          state.signalWindow.start=15;const pending=loadSignalWindow();
          state.signalWindow.start=20;await loadSignalWindow();await pending;
          await new Promise(r=>setTimeout(r,80));
          if(aborted||state.signalWindow.preview.start_seconds!==20)throw Error('slow pan lost latest target or aborted foreground request');
          signalPrefetch?.abort();
          state.signalWindow.start=90;state.signalWindow.duration=10;
          updateSignalNavigation(state.signalWindow.preview);
          document.querySelector('#signal-zoom-out').click();
          if(state.signalWindow.start!==80||state.signalWindow.duration!==20)throw Error('zoom out at file end did not clamp window');
          await new Promise(r=>setTimeout(r,80));
          document.querySelector('#signal-zoom-in').click();
          if(state.signalWindow.start!==85||state.signalWindow.duration!==10)throw Error('zoom did not preserve center');
          document.querySelector('#signal-zoom-in').click();
          if(state.signalWindow.duration!==5)throw Error('second zoom click ignored');
          await new Promise(r=>setTimeout(r,130));
          if(state.signalWindow.preview.start_seconds!==87.5)throw Error('latest zoom target not displayed');
          state.current.inspection.sampling_rate_hz=250;
          state.signalWindow.duration=.5;state.signalWindow.preview=null;
          updateSignalNavigation(null);
          if(document.querySelector('#signal-zoom-in').disabled)throw Error('zoom disabled without preview or at old 0.5s limit');
          document.querySelector('#signal-zoom-in').click();
          if(state.signalWindow.duration!==.25)throw Error('cannot zoom below half a second');
          for(let i=0;i<8;i++)document.querySelector('#signal-zoom-in').click();
          if(state.signalWindow.duration!==.008||!document.querySelector('#signal-zoom-in').disabled)throw Error('sample-resolution zoom bound incorrect');
          document.querySelector('#signal-zoom-out').click();
          if(document.querySelector('#signal-zoom-in').disabled)throw Error('zoom in did not re-enable after zoom out');
          await new Promise(r=>setTimeout(r,130));
          signalPrefetch?.abort();
        }finally{drawSignal=oldDraw;}
        return 'Passed: channel layout, waveform selection, window cache, Shift+wheel navigation and time bounds';
      } finally { if(original===null)localStorage.removeItem('neuroflow-import-templates');else localStorage.setItem('neuroflow-import-templates',original); }
    })()`);
    fs.writeFileSync(resultPath,JSON.stringify({status:'passed',result}));console.log(result);app.exit(0);
  }catch(error){fs.writeFileSync(resultPath,JSON.stringify({status:'failed',error:String(error)}));console.error(error);app.exit(1);}
});
