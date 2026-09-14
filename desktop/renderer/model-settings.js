(function exposeModelSettings(global){
  const $=selector=>document.querySelector(selector),english=()=>global.NeuroI18n?.getLocale()==='en';
  function ensure(){
    if($('#model-settings-fields'))return;
    const group=document.createElement('fieldset');group.id='model-settings-fields';group.className='model-settings-fields';
    group.innerHTML=`<legend>LLM</legend><button id="import-model-config" class="button light" type="button">Import JSON</button><label class="field-label">API Base<input id="model-api-base" type="url" required placeholder="https://api.openai.com/v1"></label><label class="field-label">Model<input id="model-name" required placeholder="gpt-5"></label><label class="field-label">API Key<input id="model-api-key" type="password" autocomplete="new-password" placeholder="sk-…"></label><label class="field-label">Max tokens<input id="model-max-tokens" type="number" min="128" max="32768" value="4096"></label><p id="model-config-status" class="settings-note"></p>`;
    $('#settings-form .settings-note').before(group);
    $('#import-model-config').addEventListener('click',async()=>{try{const result=await global.desktop?.importModelConfig?.();if(result)await load();}catch(error){$('#model-config-status').textContent=error.message;}});
  }
  async function load(){
    ensure();if(!global.desktop?.loadModelConfig)return;
    try{const value=await global.desktop.loadModelConfig();$('#import-model-config').textContent=english()?'Import JSON':'导入 JSON 配置';$('#model-api-base').value=value.api_base||'';$('#model-name').value=value.model||'';$('#model-max-tokens').value=value.max_tokens||4096;$('#model-api-key').value='';$('#model-api-key').placeholder=value.has_api_key?'••••••••':'sk-…';$('#model-config-status').textContent=value.has_api_key?(english()?'API key is stored with operating-system encryption.':'API Key 已使用操作系统加密保存。'):(english()?'Enter an API key to enable the packaged Agent.':'输入 API Key 后即可启用打包版 Agent。');}catch(error){$('#model-config-status').textContent=error.message;}
  }
  async function save(){
    ensure();if(!global.desktop?.saveModelConfig)return null;
    const result=await global.desktop.saveModelConfig({api_base:$('#model-api-base').value,model:$('#model-name').value,api_key:$('#model-api-key').value,max_tokens:Number($('#model-max-tokens').value)});
    $('#model-api-key').value='';$('#model-api-key').placeholder='••••••••';$('#model-config-status').textContent=result.backend_restarted?(english()?'Saved securely; packaged backend restarted.':'已安全保存，打包后端已自动重启。'):(english()?'Saved securely. Restart the development Go backend to apply it.':'已安全保存；开发模式下请重启 Go 后端以应用。');return result;
  }
  ensure();global.NeuroModelSettings=Object.freeze({load,save});
})(window);
