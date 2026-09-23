(function exposeModelSettings(global) {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const english = () => global.NeuroI18n?.getLocale() === 'en';
	let currentCapabilities=null;

  function updateTemperatureCapability() {
    const slider = $('#model-temperature');
    const supported = currentCapabilities?.detected && currentCapabilities.temperature;
    slider.disabled = !supported;
    $('#model-temperature-title').textContent = english() ? 'Response randomness' : '回答随机性';
    $('#model-temperature-value').textContent = Number(slider.value).toFixed(1);
    $('#model-temperature-note').textContent = supported
      ? (english() ? 'Lower values are steadier; higher values are more varied. Restart the backend to apply changes.' : '数值越低越稳定，越高表达越多样；重启后端后生效。')
      : currentCapabilities?.detected
		? (english() ? 'The capability probe rejected temperature; the backend will omit it.' : '能力探测未通过 temperature；后端将省略该参数。')
		: (english() ? 'Run the capability test before enabling randomness.' : '请先运行模型能力测试，再启用随机性设置。');
  }

	function formValue(){return {provider:$('#model-provider').value,api_base:$('#model-api-base').value,model:$('#model-name').value,api_key:$('#model-api-key').value,max_tokens:Number($('#model-max-tokens').value),temperature:Number($('#model-temperature').value),capabilities:currentCapabilities};}
	function renderCapabilities(){const target=$('#model-capabilities');if(!target)return;target.replaceChildren();const names={availability:['连接','Available'],temperature:['随机性','Temperature'],stream:['流式','Streaming'],tool_calling:['工具调用','Tool calling'],structured_output:['结构化输出','Structured output']};if(!currentCapabilities?.detected){target.textContent=english()?'Capabilities have not been tested.':'尚未检测模型能力。';return;}Object.entries(names).forEach(([key,labels])=>{const item=document.createElement('span');item.className=`model-capability ${currentCapabilities[key]?'supported':'unsupported'}`;item.textContent=`${currentCapabilities[key]?'✓':'×'} ${labels[english()?1:0]}`;item.title=currentCapabilities.details?.[key]||'';target.append(item);});}

  function ensure() {
    if ($('#model-settings-fields')) return;
    const group = document.createElement('fieldset');
    group.id = 'model-settings-fields';
    group.className = 'model-settings-fields';
    group.innerHTML = `
      <legend>LLM</legend>
      <button id="import-model-config" class="button light" type="button">Import JSON</button>
      <label class="field-label"><span id="model-provider-title">服务商类型</span><select id="model-provider"><option value="openai-compatible">OpenAI Compatible</option><option value="openai">OpenAI</option><option value="deepseek">DeepSeek</option></select></label>
      <label class="field-label">API Base<input id="model-api-base" type="url" required placeholder="https://api.openai.com/v1"></label>
      <label class="field-label">Model<input id="model-name" required placeholder="gpt-5"></label>
      <label class="field-label">API Key<input id="model-api-key" type="password" autocomplete="new-password" placeholder="sk-…"></label>
      <label class="field-label">Max tokens<input id="model-max-tokens" type="number" min="128" max="32768" value="4096"></label>
      <label class="field-label model-temperature-label"><span id="model-temperature-title">回答随机性</span><output id="model-temperature-value">1.0</output><input id="model-temperature" type="range" min="0" max="2" step="0.1" value="1"></label>
      <p id="model-temperature-note" class="model-field-note"></p>
      <button id="test-model-config" class="button light" type="button">测试模型能力</button>
      <div id="model-capabilities" class="model-capabilities"></div>
      <p id="model-config-status" class="settings-note"></p>`;
    $('#settings-form .settings-note').before(group);
    $('#import-model-config').addEventListener('click', async () => {
      try {
        const result = await global.desktop?.importModelConfig?.();
        if (result) await load();
      } catch (error) {
        $('#model-config-status').textContent = error.message;
      }
    });
    $('#model-temperature').addEventListener('input', updateTemperatureCapability);
		for(const id of ['model-provider','model-api-base','model-name'])$("#"+id).addEventListener('input',()=>{currentCapabilities=null;updateTemperatureCapability();renderCapabilities();});
		$('#test-model-config').addEventListener('click',async()=>{const button=$('#test-model-config');button.disabled=true;$('#model-config-status').textContent=english()?'Testing five capabilities…':'正在检测连接、随机性、流式、工具调用和结构化输出…';try{currentCapabilities=await global.desktop?.testModelConfig?.(formValue());renderCapabilities();updateTemperatureCapability();$('#model-config-status').textContent=currentCapabilities?.availability?(english()?'Capability test complete. Save settings to apply the result.':'能力检测完成，请保存设置以应用检测结果。'):(currentCapabilities?.details?.availability||'Connection failed');}catch(error){$('#model-config-status').textContent=error.message;}finally{button.disabled=false;}});
  }

  async function load() {
    ensure();
    if (!global.desktop?.loadModelConfig) return;
    try {
      const value = await global.desktop.loadModelConfig();
			$('#model-provider-title').textContent=english()?'Provider type':'服务商类型';
			$('#model-provider').value=value.provider||'openai-compatible';
      $('#import-model-config').textContent = english() ? 'Import JSON' : '导入 JSON 配置';
      $('#model-api-base').value = value.api_base || '';
      $('#model-name').value = value.model || '';
      $('#model-max-tokens').value = value.max_tokens || 4096;
      $('#model-temperature').value = Number(value.temperature ?? 1);
			currentCapabilities=value.capabilities||null;
      $('#model-api-key').value = '';
      $('#model-api-key').placeholder = value.has_api_key ? '••••••••' : 'sk-…';
      updateTemperatureCapability();
			renderCapabilities();
			$('#test-model-config').textContent=english()?'Test model capabilities':'测试模型能力';
      $('#model-config-status').textContent = value.has_api_key
        ? (english() ? 'API key is stored with operating-system encryption.' : 'API Key 已使用操作系统加密保存。')
        : (english() ? 'Enter an API key to enable the packaged Agent.' : '输入 API Key 后即可启用打包版 Agent。');
    } catch (error) {
      $('#model-config-status').textContent = error.message;
    }
  }

  async function save() {
    ensure();
    if (!global.desktop?.saveModelConfig) return null;
    const result = await global.desktop.saveModelConfig(formValue());
    $('#model-api-key').value = '';
    $('#model-api-key').placeholder = '••••••••';
    $('#model-config-status').textContent = result.backend_restarted
      ? (english() ? 'Saved securely; packaged backend restarted.' : '已安全保存，打包后端已自动重启。')
      : (english() ? 'Saved securely. Restart the development Go backend to apply it.' : '已安全保存；开发模式下请重启 Go 后端以应用。');
    return result;
  }

  ensure();
  global.NeuroModelSettings = Object.freeze({ load, save });
})(window);
