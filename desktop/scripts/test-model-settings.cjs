const {app,BrowserWindow}=require('electron');
const path=require('node:path');
app.setPath('userData',path.join(__dirname,'../../.cache/model-settings-ui'));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:900,webPreferences:{contextIsolation:true,nodeIntegration:false,offscreen:true,backgroundThrottling:false}});
 try{
  await win.loadFile(path.join(__dirname,'../renderer/index.html'));
  const result=await win.webContents.executeJavaScript(`(async()=>{
    const el=id=>document.getElementById(id),assert=(ok,message)=>{if(!ok)throw Error(message)},wait=()=>new Promise(r=>setTimeout(r,20));
    let config={provider:'openai-compatible',api_base:'https://provider.test/v1',model:'test-model',max_tokens:1024,temperature:1,revision:'test-revision-00000001',has_api_key:true,capabilities:null},lastSaved=null,resolveProbe;
    const applied=()=>({applied:true,active:{...config,enabled:config.has_api_key}});
    window.desktop={loadModelConfig:async()=>({...config}),syncModelConfig:async()=>applied(),saveModelConfig:async v=>{lastSaved=v;config={...config,model:v.model,has_api_key:v.api_key_action==='clear'?false:v.api_key_action==='replace'?!!v.api_key:config.has_api_key};return {...config,runtime:applied()}},testModelConfig:()=>new Promise(r=>resolveProbe=r),testActiveAgent:async()=>({ok:false,live:true,mode:'deep',tool_executed:false,content_chunks:0,elapsed_ms:4,failure:{code:'MODEL_QUOTA_EXHAUSTED',message:'quota rejected'},tested_at:new Date().toISOString()})};
    NeuroI18n.setLocale('en');el('settings-dialog').showModal();await NeuroModelSettings.load();
    assert(el('model-api-key').value==='','Stored secret was exposed');assert(!el('model-api-key').placeholder.includes('\u2022'),'Fake key dots remain');assert(el('model-key-note').textContent.includes('Leave blank'),'Keep instruction missing');
    el('clear-model-key').click();assert(el('model-key-note').textContent.includes('Pending deletion'),'Removal not visible');el('clear-model-key').click();assert(el('model-key-note').textContent.includes('Leave blank'),'Undo removal failed');
    el('model-api-key').value='new-secret';el('model-api-key').dispatchEvent(new Event('input'));el('show-model-key').click();assert(el('model-api-key').type==='text','Show new key failed');await NeuroModelSettings.save();assert(lastSaved.api_key==='new-secret'&&lastSaved.api_key_action==='replace','Replacement not saved');assert(el('model-api-key').value===''&&el('model-api-key').type==='password','New key not hidden after save');
    el('clear-model-key').click();await NeuroModelSettings.save();assert(lastSaved.api_key_action==='clear'&&!config.has_api_key,'Key not cleared');assert(el('model-runtime-status').textContent.includes('disabled'),'Disabled runtime not shown');assert(el('test-active-agent').disabled,'Disabled model can be tested');
    config.has_api_key=true;await NeuroModelSettings.load();el('test-active-agent').click();await wait();assert(el('model-agent-test-result').textContent.includes('failed')&&!el('model-agent-test-result').textContent.includes('passed'),'Failure displayed as success');
    el('test-model-config').click();await wait();el('model-name').value='changed-model';el('model-name').dispatchEvent(new Event('input'));resolveProbe({detected:true,availability:true,temperature:true});await wait();assert(el('model-config-status').textContent.includes('stale'),'Stale probe accepted');assert(el('test-active-agent').disabled,'Draft edit kept backend test enabled');
    NeuroI18n.setLocale('zh-CN');await NeuroModelSettings.load();assert(el('test-model-config').textContent.includes('\u771f\u5b9e'),'Chinese labels missing');
    const rect=el('model-settings-fields').getBoundingClientRect();assert(rect.width<=el('settings-dialog').clientWidth,'Settings overflow horizontally');
    return {ok:true,checks:'blank key, keep/replace/clear/undo, masking, active state, live failure reporting, stale probes, bilingual UI'};
  })()`);
  require('node:fs').writeFileSync(path.join(__dirname,'../../.cache/model-settings-preview.png'),(await win.webContents.capturePage()).toPNG());
  console.log(JSON.stringify(result));
 }catch(e){console.error(e);process.exitCode=1;}finally{win.destroy();app.exit(process.exitCode||0);}
});
