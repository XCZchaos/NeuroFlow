(function exposeModelSettings(global) {
  'use strict';
  const $=s=>document.querySelector(s),en=()=>global.NeuroI18n?.getLocale()==='en',say=(zh,english)=>en()?english:zh;
  let capabilities=null,saved=null,keyAction='keep',runtime=null,editVersion=0,busy=false,dirty=false;
  const backendURL=()=>$('#backend-url').value,status=text=>{$('#model-config-status').textContent=text;};
  function formValue(){return {provider:$('#model-provider').value,api_base:$('#model-api-base').value,model:$('#model-name').value,api_key:$('#model-api-key').value,api_key_action:keyAction,max_tokens:Number($('#model-max-tokens').value),temperature:Number($('#model-temperature').value),backend_url:backendURL()};}
  function failure(code) {
    if(/402/.test(code||''))return say('模型服务额度不足或计费未就绪（HTTP 402）。','Provider quota or billing unavailable (HTTP 402).');
    if(/401/.test(code||''))return say('密钥认证失败（HTTP 401）。','API key authentication failed (HTTP 401).');
    if(/429/.test(code||''))return say('服务商请求限流（HTTP 429）。请等待限流窗口恢复后重试，不要连续点击测试。','Provider rate limit (HTTP 429). Wait for the limit to reset before testing again.');
    if(code==='MODEL_CONTROL_UNAVAILABLE'||code==='MODEL_CONTROL_HTTP_404')return say('尚未应用：请用更新后的代码重启 Go 后端，再点击“核对并应用”。仅保存或重启旧版后端不会应用此配置。','Not applied: restart Go with the updated code, then click Verify & apply. Saving alone does not update an older backend.');
    if(code==='NO_SAVED_MODEL')return say('尚未保存 Electron 模型配置；后端可能使用 config 文件中的配置。','No Electron model configuration saved; Go may be using its config file.');
    return say(`尚未通过：${code||'后端不可用'}。请检查后端地址、模型权限及网络。`,`Not verified: ${code||'backend unavailable'}. Check the backend URL, model access and network.`);
  }
  function renderKey() {
    $('#model-api-key').placeholder=say('输入新密钥','Enter a new API key');
    $('#model-key-note').textContent=keyAction==='clear'?say('待删除：保存后清除 Electron 保存的密钥，并停用后端的新模型请求。','Pending deletion: save to remove the Electron key and disable new backend model requests.'):
      keyAction==='replace'?say('待替换：保存后使用新密钥。','Pending replacement: save to use the new key.'):
      saved?.has_api_key?say('已有加密保存的密钥。输入框留空表示保留；删除请使用右侧按钮。','A key is stored encrypted. Leave blank to keep it; use the button to remove it.'):say('尚未保存密钥。','No key saved.');
    $('#clear-model-key').textContent=keyAction==='clear'?say('撤销删除','Undo removal'):say('删除已保存密钥','Remove saved key');
    $('#clear-model-key').disabled=busy||!saved?.has_api_key;
    $('#show-model-key').textContent=$('#model-api-key').type==='password'?say('显示新密钥','Show new key'):say('隐藏新密钥','Hide new key');
  }
  function renderCapabilities() {
    const target=$('#model-capabilities');target.replaceChildren();
    if(!capabilities?.detected){target.textContent=say('当前表单尚未检测模型能力。','Capabilities of this draft have not been tested.');return;}
    const names={availability:['连接','Connection'],temperature:['随机性参数','Temperature parameter'],stream:['SSE 流式','SSE streaming'],tool_calling:['工具参数','Tool arguments'],structured_output:['结构化输出','Structured output']};
    Object.entries(names).forEach(([key,names])=>{const item=document.createElement('span');item.className=`model-capability ${capabilities[key]?'supported':'unsupported'}`;item.textContent=`${capabilities[key]?'✓':'×'} ${names[en()?1:0]}`;item.title=capabilities.details?.[key]||'';target.append(item);});
  }
  function renderTemperature(){
    $('#model-temperature-value').textContent=Number($('#model-temperature').value).toFixed(1);
    $('#model-temperature-note').textContent=capabilities?.temperature?say('服务商已接受此随机性参数；保存并应用后用于新请求。','The provider accepted this temperature; save and apply for new requests.'):say('可调整随机性；当前参数通过能力测试后才会传给后端模型。','Adjust temperature here. It is sent to the model only after this configuration passes its probe.');
  }
  function renderRuntime() {
    if(runtime?.applied){const a=runtime.active;$('#model-runtime-status').textContent=say(`已核对后端：${a.model}（${a.api_base||''}） · 输出上限 ${a.max_tokens} · ${a.enabled?'模型已启用':'密钥已清除，模型已停用'}。适用于各页面 Agent、即时/深度模式及 Plan。配置版本 ${a.revision.slice(0,8)}。随机性参数：${a.temperature_sent?a.temperature:'未发送（未通过探测）'}。`,`Verified backend: ${a.model} (${a.api_base||''}) · token limit ${a.max_tokens} · ${a.enabled?'model enabled':'key cleared, model disabled'}. Applies to all page Agents, quick/deep modes and Plan. Revision ${a.revision.slice(0,8)}. Temperature: ${a.temperature_sent?a.temperature:'omitted (probe not passed)'}.`);}
    else $('#model-runtime-status').textContent=failure(runtime?.error||'NO_SAVED_MODEL');
    $('#test-active-agent').disabled=busy||!runtime?.applied||!runtime.active?.enabled;
  }
  function changed(invalidate=true,modelEdit=true){editVersion++;dirty=dirty||modelEdit;runtime=null;if(invalidate)capabilities=null;$('#model-runtime-status').textContent=say('有未保存修改；运行中的后端仍使用上一次已应用配置。','Unsaved changes; the running backend still uses its previous configuration.');$('#test-active-agent').disabled=true;$('#model-agent-test-result').textContent='';renderCapabilities();renderTemperature();}
  function setBusy(value){busy=value;for(const s of ['#test-model-config','#verify-model-runtime','#import-model-config','#settings-form button[type="submit"]'])$(s).disabled=value;$('#test-active-agent').disabled=value||!runtime?.applied||!runtime?.active?.enabled;renderKey();}
  function fill(value){dirty=false;saved=value;capabilities=value.capabilities||null;keyAction='keep';$('#model-provider').value=value.provider||'openai-compatible';$('#model-api-base').value=value.api_base||'';$('#model-name').value=value.model||'';$('#model-max-tokens').value=value.max_tokens||4096;$('#model-temperature').value=value.temperature??1;$('#model-api-key').value='';$('#model-api-key').type='password';editVersion++;renderKey();renderCapabilities();renderTemperature();}
  function ensure(){
    if($('#model-settings-fields'))return;
    const group=document.createElement('fieldset');group.id='model-settings-fields';group.className='model-settings-fields';
    group.innerHTML=`<legend>LLM</legend><button id="import-model-config" class="button light" type="button"></button>
      <label class="field-label"><span id="model-provider-title"></span><select id="model-provider"><option value="openai-compatible">OpenAI Compatible</option><option value="openai">OpenAI</option><option value="deepseek">DeepSeek</option></select></label>
      <label class="field-label">API Base<input id="model-api-base" type="url" required></label><label class="field-label">Model<input id="model-name" required></label>
      <label class="field-label">API Key<input id="model-api-key" type="password" autocomplete="new-password" aria-describedby="model-key-note"></label>
      <div class="model-key-actions"><button id="show-model-key" class="button light" type="button"></button><button id="clear-model-key" class="button light" type="button"></button></div><p id="model-key-note" class="model-field-note"></p>
      <label class="field-label">Max tokens<input id="model-max-tokens" type="number" min="128" max="32768" value="4096"></label>
      <label class="field-label model-temperature-label"><span id="model-temperature-title"></span><output id="model-temperature-value">1.0</output><input id="model-temperature" type="range" min="0" max="2" step="0.1" value="1"></label><p id="model-temperature-note" class="model-field-note"></p>
      <button id="test-model-config" class="button light" type="button"></button><p id="model-probe-note" class="model-field-note"></p><div id="model-capabilities" class="model-capabilities"></div><p id="model-config-status" class="settings-note" role="status" aria-live="polite"></p>
      <div class="model-runtime-panel"><p id="model-runtime-status" role="status" aria-live="polite"></p><button id="verify-model-runtime" class="button light" type="button"></button>
      <div class="model-agent-test-controls"><select id="model-test-mode" aria-label="Agent test mode"><option value="quick"></option><option value="deep"></option></select><button id="test-active-agent" class="button light" type="button" disabled></button></div><p id="model-agent-test-note" class="model-field-note"></p><p id="model-agent-test-result" role="status" aria-live="polite"></p></div>`;
    $('#settings-form .settings-note').before(group);
    for(const id of ['model-provider','model-api-base','model-name','model-max-tokens','model-temperature'])$('#'+id).addEventListener('input',()=>changed());
    $('#backend-url').addEventListener('input',()=>changed(false,false));
    $('#model-api-key').addEventListener('input',()=>{keyAction=$('#model-api-key').value.trim()?'replace':'keep';changed();renderKey();});
    $('#show-model-key').addEventListener('click',()=>{$('#model-api-key').type=$('#model-api-key').type==='password'?'text':'password';renderKey();});
    $('#clear-model-key').addEventListener('click',()=>{keyAction=keyAction==='clear'?'keep':'clear';$('#model-api-key').value='';changed();renderKey();});
    $('#import-model-config').addEventListener('click',async()=>{setBusy(true);try{const r=await global.desktop.importModelConfig(backendURL());if(r){fill(r);runtime=r.runtime;renderRuntime();status(say('配置已导入并加密保存。','Configuration imported and encrypted.'));}}catch(e){status(e.message);}finally{setBusy(false);}});
    $('#verify-model-runtime').addEventListener('click',()=>save().catch(e=>status(e.message)));
    $('#test-model-config').addEventListener('click',async()=>{
      changed(false);const version=editVersion;setBusy(true);status(say('正在向服务商发送真实能力测试请求…','Sending live capability requests to the provider…'));
      try{const r=await global.desktop.testModelConfig(formValue());if(editVersion!==version){status(say('测试期间表单已更改；旧测试结果已丢弃，请重新测试。','Draft changed during testing; stale results discarded. Please test again.'));return;}capabilities=r;renderCapabilities();renderTemperature();status(r.availability?say('能力测试完成。请保存并应用，再测试后端 Agent。','Capability test finished. Save and apply, then test the backend Agent.'):failure(r.details?.availability));}catch(e){status(e.message);}finally{setBusy(false);}
    });
    $('#test-active-agent').addEventListener('click',async()=>{
      const version=editVersion,mode=$('#model-test-mode').value;setBusy(true);const target=$('#model-agent-test-result');target.textContent=say('正在执行真实 Eino Agent：模型 → 只读工具 → 模型流式回答…','Running the live Eino Agent: model → read-only tool → streamed model answer…');
      try{const r=await global.desktop.testActiveAgent({backend_url:backendURL(),mode,revision:runtime.active.revision});if(version!==editVersion){target.textContent=say('配置已更改，此测试不代表当前表单。','Settings changed; this test does not validate the current draft.');return;}
        const metrics=say(`模式 ${mode} · 工具执行 ${r.tool_executed?'成功':'未完成'} · 正文块 ${r.content_chunks||0} · ${((r.elapsed_ms||0)/1000).toFixed(1)} 秒 · ${r.tested_at||''}`,`Mode ${mode} · tool ${r.tool_executed?'executed':'not completed'} · ${r.content_chunks||0} content chunks · ${((r.elapsed_ms||0)/1000).toFixed(1)} s · ${r.tested_at||''}`);
        target.textContent=(r.ok?say('真实 Agent 测试通过，已核验工具返回值。','Live Agent test passed; tool result verified.'):say('真实 Agent 测试未通过。','Live Agent test failed.'))+' '+metrics+' '+(r.failure?(en()?r.failure.code:r.failure.message):r.message||'');
      }catch(e){target.textContent=failure(e.message);}finally{setBusy(false);}
    });
  }
  function labels(){
    const entries={'model-provider-title':['服务商类型','Provider type'],'import-model-config':['导入并保存 JSON 配置','Import & save JSON configuration'],'model-temperature-title':['回答随机性','Response randomness'],'test-model-config':['测试模型能力（真实请求）','Test provider capabilities (live)'],'verify-model-runtime':['保存、核对并应用','Save, verify & apply'],'test-active-agent':['测试后端 Agent','Test backend Agent'],'model-probe-note':['会发送最多 5 个真实请求，可能消耗额度。检测参数是否被接受，不代表算法处理已验证。','Sends up to 5 real requests and may consume credits. Checks API behavior; does not validate scientific algorithms.'],'model-agent-test-note':['使用实际生效配置和现有 Eino Agent，调用只读组件工具并核验返回值；不读取你的数据、不写入会话。','Uses the active configuration and existing Eino Agent with a read-only component tool. No dataset access or session writes.']};
    for(const[id,words]of Object.entries(entries))$('#'+id).textContent=words[en()?1:0];$('#model-test-mode option[value="quick"]').textContent=say('即时回答','Quick');$('#model-test-mode option[value="deep"]').textContent=say('深度分析','Deep');
  }
  async function load(){ensure();labels();if(!global.desktop?.loadModelConfig){status(say('模型设置需要在 Electron 中使用。','Model settings require Electron.'));return;}
    try{fill(await global.desktop.loadModelConfig());runtime=await global.desktop.syncModelConfig(backendURL());renderRuntime();status(say('密钥仅在本机加密保存；模型测试结果与后端应用状态分别显示。','Keys are encrypted locally; provider test results and backend application state are shown separately.'));}catch(e){status(e.message);}
  }
  async function save(){ensure();if(!global.desktop?.saveModelConfig)throw new Error(say('请在 Electron 中保存模型配置。','Use Electron to save model configuration.'));setBusy(true);
    try{const version=editVersion,r=await global.desktop.saveModelConfig(formValue());if(editVersion===version){fill(r);runtime=r.runtime;renderRuntime();status(say('已加密保存。后端生效状态见下方；新配置的可用性请运行真实测试。','Saved encrypted. See backend status below; run a live test to verify availability.'));}return r;}finally{setBusy(false);}
  }
  ensure();labels();renderKey();renderTemperature();
  global.NeuroModelSettings=Object.freeze({load,save,hasChanges:()=>dirty});
})(window);
