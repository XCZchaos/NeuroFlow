// Exercise the real Electron DOM with deterministic local API responses.
const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
app.setPath('userData', path.join(__dirname, '../../.cache/ppg-electron'));
app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false, width: 1500, height: 1000, webPreferences: { contextIsolation: true, nodeIntegration: false, offscreen: true, backgroundThrottling: false } });
  try {
    await window.loadFile(path.join(__dirname, '../renderer/index.html'));
    const result = await window.webContents.executeJavaScript(`(async () => {
      const el = id => document.getElementById(id);
      document.querySelector('[data-view="ppg"]').click();
      if (el('ppg-view').hidden || !el('workspace-view').hidden) throw Error('PPG navigation failed');
      if (!el('ppg-run').disabled || !el('ppg-export').disabled) throw Error('Empty page enables processing');
      const originalFetch = window.fetch;
      let fail = false, request;
      const meta = {ok:true,channels:['time','PPG'],samples:3000,sampling_rate_hz:null,file_name:'pulse.csv'};
      const time = Array.from({length:3000},(_,i)=>i/100), raw=time.map(t=>Math.sin(t*7.54)+Math.sin(t*.5)), cleaned=time.map(t=>Math.sin(t*7.54));
      const data = {...meta,sampling_rate_hz:100,start_seconds:0,end_seconds:30,mean_bpm:72,peak_count:35,warnings:[],waveform:{time,raw,cleaned},peaks:[{time:1,amplitude:1,sample:100}],heart_rate:{time:[1,2,3],bpm:[72,73,72]}};
      window.fetch = async (url,options) => {
        if(!String(url).includes('/ppg/'))return originalFetch(url,options);
        request=JSON.parse(options.body);
        if(fail)return {ok:false,json:async()=>({ok:false,message:'Sampling rate conflict'})};
        return {ok:true,json:async()=>String(url).endsWith('/inspect')?meta:data};
      };
      const wait = async () => { for(let i=0;i<50;i++){await new Promise(r=>setTimeout(r,10));if(el('ppg-cancel').hidden)return;}throw Error('Operation did not finish'); };
      try {
        el('ppg-path').value='C:/test/pulse.csv';el('ppg-inspect').click();await wait();
        if(el('ppg-channel').value!=='PPG'||el('ppg-rate').value!==''||el('ppg-run').disabled)throw Error('CSV metadata or unknown rate incorrect');
        el('ppg-time').value='time';el('ppg-run').click();await wait();
        if(request.time_column!=='time'||el('ppg-bpm').textContent!=='72.0'||el('ppg-export').disabled)throw Error('Analysis result not applied');
        el('ppg-right').click();if(!el('ppg-window').textContent.startsWith('5.00'))throw Error('Pan failed');
        el('ppg-plus').click();if(!el('ppg-window').textContent.startsWith('7.50'))throw Error('Centered zoom failed');
        el('ppg-canvas').dispatchEvent(new WheelEvent('wheel',{shiftKey:true,deltaY:100,cancelable:true}));
        if(!el('ppg-window').textContent.startsWith('8.50'))throw Error('Shift wheel failed');
        NeuroI18n.setLocale('en');if(el('ppg-run').textContent!=='Run PPG analysis'||document.querySelector('[data-view="ppg"]').textContent.includes('nav.ppg'))throw Error('English translation missing');
        NeuroI18n.setLocale('zh-CN');
        el('ppg-rate').dispatchEvent(new Event('input'));if(!el('ppg-export').disabled||el('ppg-bpm').textContent!=='—')throw Error('Stale result retained after parameter change');
        fail=true;el('ppg-run').click();await wait();if(!el('ppg-status').textContent.includes('Sampling rate conflict')||!el('ppg-export').disabled)throw Error('Failure hidden');
        fail=false;el('ppg-run').click();await wait();
        document.querySelector('[data-view="eeg"]').click();if(!el('ppg-view').hidden)throw Error('PPG did not hide');
        document.querySelector('[data-view="ppg"]').click();
        return 'Passed: PPG navigation, import, sampling configuration, results, pan/zoom, Shift+wheel, bilingual UI, invalidation and error feedback';
      } finally {window.fetch=originalFetch;}
    })()`);
    // Wait for Chromium to paint the final navigation; capturePage can otherwise
    // return the compositor's preceding workspace frame after a rapid DOM test.
    await new Promise(resolve => setTimeout(resolve, 250));
    await window.webContents.executeJavaScript(`if(document.getElementById('ppg-view').hidden)throw Error('PPG view changed after navigation');`);
    const shot = await window.webContents.capturePage();
    const target = path.join(__dirname, '../../.cache/ppg-ui.png');
    fs.mkdirSync(path.dirname(target), {recursive:true});fs.writeFileSync(target, shot.toPNG());
    console.log(result); app.exit(0);
  } catch (error) { console.error(error); app.exit(1); }
});
