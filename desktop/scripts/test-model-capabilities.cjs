const assert=require('node:assert/strict');
const {probeModelCapabilities,verifyStream}=require('../electron/model-capabilities.cjs');
const {resolveConfig,publicConfig,fingerprint}=require('../electron/model-config.cjs');
const {applyConfig,localBase}=require('../electron/model-runtime.cjs');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const candidate={provider:'openai-compatible',api_base:'https://provider.test/v1',model:'custom-model',api_key:'secret',max_tokens:1024,temperature:0.6};
const message=content=>({choices:[{message:{role:'assistant',content}}]});
const sse=text=>new Response(text,{headers:{'content-type':'text/event-stream'}});
(async()=>{
  const requests=[];
  const fetchImpl=async(url,options)=>{
    const body=JSON.parse(options.body);requests.push(body);
    assert.equal(url,'https://provider.test/v1/chat/completions');assert.equal(options.headers.Authorization,'Bearer secret');assert.equal(body.max_tokens,1024);
    if(body.stream)return sse('data: {"choices":[{"delta":{"content":"OK"}}]}\n\ndata: [DONE]\n\n');
    if(body.tools)return Response.json({choices:[{message:{role:'assistant',tool_calls:[{id:'call1',type:'function',function:{name:'probe_tool',arguments:'{"value":"ok"}'}}]}}]});
    if(body.response_format)return Response.json(message('{"ok":true}'));
    return Response.json(message('OK'));
  };
  const result=await probeModelCapabilities(candidate,fetchImpl);
  assert.equal(requests.length,5);for(const key of ['availability','temperature','stream','tool_calling','structured_output'])assert.equal(result[key],true,key);
  const failed=await probeModelCapabilities(candidate,async()=>new Response('secret echoed upstream',{status:401}));assert.equal(failed.availability,false);assert.equal(failed.details.availability,'HTTP 401');assert(!JSON.stringify(failed).includes('secret'));
  const invalid=await probeModelCapabilities(candidate,async()=>Response.json({error:{message:'no'}}));assert.equal(invalid.availability,false);
  for(const response of [new Response('plain JSON'),sse(': heartbeat\n\n'),sse('data: {"error":{"message":"bad"}}\n\n'),sse('data: {"choices":[{"delta":{"content":"incomplete"}}]}\n\n')])await assert.rejects(verifyStream(response));
  const bad=await probeModelCapabilities(candidate,async(url,options)=>{
    const b=JSON.parse(options.body);
    if(b.stream)return sse('data: [DONE]\n\n');
    if(b.tools)return Response.json({choices:[{message:{tool_calls:[{id:'x',type:'function',function:{name:'wrong',arguments:'{}'}}]}}]});
    if(b.response_format)return Response.json(message('{"ok":true,"extra":1}'));
    return Response.json(message('OK'));
  });assert(!bad.stream&&!bad.tool_calling&&!bad.structured_output);
  const previous=resolveConfig(candidate,{}, {fingerprint:fingerprint(candidate),result});
  assert(previous.capabilities.temperature);assert(!('api_key' in publicConfig(previous)));
  const kept=resolveConfig({...candidate,api_key:'',api_key_action:'keep'},previous);assert.equal(kept.api_key,'secret');assert.equal(kept.revision,previous.revision);
  const changed=resolveConfig({...candidate,api_key:'new',api_key_action:'replace',capabilities:result},previous,{fingerprint:fingerprint(candidate),result});assert.equal(changed.api_key,'new');assert.equal(changed.capabilities,null);assert.notEqual(changed.revision,previous.revision);
  const cleared=resolveConfig({...candidate,api_key_action:'clear'},previous);assert.equal(cleared.api_key,'');assert.equal(cleared.capabilities,null);
  const imported=resolveConfig({...candidate,capabilities:result},{});assert.equal(imported.capabilities,null);
  assert.throws(()=>localBase('https://evil.test'));assert.throws(()=>localBase('http://localhost@evil.test'));assert.throws(()=>localBase('http://localhost/path'));
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'neuro-model-test-')),tokenPath=path.join(dir,'token');fs.writeFileSync(tokenPath,'local-test-token');
  try{
    let active={revision:'old'},puts=0;
    const server=async(url,opts)=>{if(opts.method==='PUT'){puts++;const c=JSON.parse(opts.body);active={...publicConfig(c),enabled:true,temperature_sent:Boolean(c.capabilities?.detected&&c.capabilities?.temperature)};}return Response.json(active);};
    assert((await applyConfig(previous,'http://localhost:8819',tokenPath,server)).applied);assert.equal(puts,1);
    assert((await applyConfig(previous,'http://localhost:8819',tokenPath,server)).applied);assert.equal(puts,1);
    const mismatch=await applyConfig(previous,'http://localhost:8819',tokenPath,async()=>Response.json({revision:previous.revision,model:'wrong'}));assert.equal(mismatch.applied,false);
  }finally{fs.rmSync(tokenPath);fs.rmdirSync(dir);}
  console.log('Passed: offline provider protocol, key lifecycle, probe identity, apply/read-back regressions (mock provider; not a live model test)');
})().catch(error=>{console.error(error);process.exitCode=1;});
