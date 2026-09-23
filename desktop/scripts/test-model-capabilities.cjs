const assert = require('node:assert/strict');
const {probeModelCapabilities} = require('../electron/model-capabilities.cjs');

(async()=>{
  const requests=[];
  const fetchImpl=async(url,options)=>{
    const body=JSON.parse(options.body);requests.push(body);
    assert.equal(url,'https://provider.test/v1/chat/completions');
    assert.equal(options.headers.Authorization,'Bearer secret');
    if(body.stream)return {ok:true,body:{getReader:()=>({read:async()=>({done:false,value:new Uint8Array([1])}),cancel:async()=>{}})}};
    if(body.tools)return {ok:true,json:async()=>({choices:[{message:{tool_calls:[{function:{name:'probe_tool'}}]}}]})};
    if(body.response_format)return {ok:true,json:async()=>({choices:[{message:{content:'{"ok":true}'}}]})};
    return {ok:true,json:async()=>({choices:[{message:{content:'OK'}}]})};
  };
  const result=await probeModelCapabilities({api_base:'https://provider.test/v1/',model:'custom-model',api_key:'secret'},fetchImpl);
  assert.equal(requests.length,5);for(const key of ['availability','temperature','stream','tool_calling','structured_output'])assert.equal(result[key],true,key);
  const failed=await probeModelCapabilities({api_base:'https://provider.test/v1',model:'custom-model',api_key:'secret'},async()=>({ok:false,status:401,text:async()=>'invalid key'}));
  assert.equal(failed.availability,false);assert.match(failed.details.availability,/401/);
  console.log('Passed: model connectivity and four capability probes');
})().catch(error=>{console.error(error);process.exitCode=1;});
