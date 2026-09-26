'use strict';
const fs=require('node:fs');

// Loopback only: never send a saved key or local control token to a remote
// backend URL entered in the connection form. Provider requests are separate.
function localBase(value) {
  const url=new URL(value||'http://localhost:8819');
  if(!['http:','https:'].includes(url.protocol)||!['localhost','127.0.0.1','[::1]'].includes(url.hostname)||url.username||url.password||url.search||url.hash||!['','/'].includes(url.pathname))throw new Error('Model configuration can only be applied to a local Go backend');
  return url.origin;
}
async function runtimeRequest(base, tokenPath, route, method='GET', body, fetchImpl=globalThis.fetch) {
  const origin=localBase(base);
  let token;try{token=fs.readFileSync(tokenPath,'utf8').trim();}catch{throw new Error('MODEL_CONTROL_UNAVAILABLE');}
  const response=await fetchImpl(`${origin}/model/${route}`,{method,redirect:'error',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(route==='test-agent'?95000:15000)});
  if(!response.ok)throw new Error(`MODEL_CONTROL_HTTP_${response.status}`);
  return response.json();
}
async function applyConfig(config,base,tokenPath,fetchImpl) {
  try {
    let active=await runtimeRequest(base,tokenPath,'runtime','GET',undefined,fetchImpl);
    if(active.revision!==config.revision) {
      await runtimeRequest(base,tokenPath,'runtime','PUT',{...config,capabilities:config.capabilities||{}},fetchImpl);
      // Read back instead of assuming PUT or process spawn means success.
      active=await runtimeRequest(base,tokenPath,'runtime','GET',undefined,fetchImpl);
    }
    const applied=active.revision===config.revision&&active.provider===config.provider&&active.model===config.model&&active.api_base===config.api_base&&active.has_api_key===Boolean(config.api_key)&&active.max_tokens===config.max_tokens&&Math.abs(active.temperature-config.temperature)<0.001&&active.temperature_sent===Boolean(config.capabilities?.detected&&config.capabilities?.temperature);
    return {applied,active,error:applied?null:'MODEL_CONFIG_MISMATCH'};
  }catch(error){return {applied:false,error:/^MODEL_CONTROL_/.test(error.message)?error.message:'MODEL_BACKEND_UNREACHABLE'};}
}
module.exports={localBase,runtimeRequest,applyConfig};
