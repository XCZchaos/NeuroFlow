'use strict';
const {createHash, randomUUID} = require('node:crypto');

// Fingerprints are main-process-only; neither keys nor their hashes are exposed
// to the renderer. A probe belongs to the exact endpoint, key and parameters.
function fingerprint(value) {
  return createHash('sha256').update(JSON.stringify([value.provider,value.api_base,value.model,value.api_key,value.max_tokens,value.temperature])).digest('hex');
}
function resolveConfig(value, previous = {}, probe = null) {
  const base=String(value.api_base||'').trim().replace(/\/+$/,''), model=String(value.model||'').trim();
  let url;try{url=new URL(base);}catch{throw new Error('API Base must be a valid URL');}
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw new Error('API Base must be HTTP(S), without credentials or query');
  if(!model)throw new Error('Model name is required');
  const action=value.api_key_action|| (String(value.api_key||'').trim()?'replace':'keep');
  if(!['keep','replace','clear'].includes(action))throw new Error('Invalid API key action');
  const apiKey=action==='clear'?'':action==='replace'?String(value.api_key||'').trim():String(previous.api_key||'');
  if(action==='replace'&&!apiKey)throw new Error('Enter a replacement API key');
  if(!apiKey&&action!=='clear'&&!Object.hasOwn(previous,'api_key'))throw new Error('Enter an API key before saving the first configuration');
  const max=Number(value.max_tokens??4096),temperature=Number(value.temperature??1);
  if(!Number.isInteger(max)||max<128||max>32768||!Number.isFinite(temperature)||temperature<0||temperature>2)throw new Error('Invalid token limit or temperature');
  const provider=['openai','deepseek','openai-compatible'].includes(value.provider)?value.provider:'openai-compatible';
  const config={provider,api_base:base,model,api_key:apiKey,max_tokens:max,temperature};
  const identity=fingerprint(config),same=identity===fingerprint(previous);
  // Never trust imported JSON or renderer claims that a capability was tested.
  config.capabilities=probe?.fingerprint===identity?probe.result:(same&&previous.capabilities?.live?previous.capabilities:null);
  config.revision=same&&previous.revision&&JSON.stringify(config.capabilities)===JSON.stringify(previous.capabilities)?previous.revision:randomUUID();
  return config;
}
function publicConfig(config) {
  const value=config||{provider:'openai-compatible',api_base:'https://api.openai.com/v1',model:'gpt-5',max_tokens:4096,temperature:1};
  const {provider,api_base,model,max_tokens,temperature,capabilities,revision}=value;
  return {provider,api_base,model,max_tokens,temperature,capabilities:capabilities||null,revision,has_api_key:Boolean(value.api_key)};
}
module.exports={resolveConfig,publicConfig,fingerprint};
