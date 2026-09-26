'use strict';

const safeError = error => error.name === 'AbortError' || error.name === 'TimeoutError' ? 'MODEL_PROBE_TIMEOUT' : /^HTTP [0-9]{3}$/.test(error.message) ? error.message : 'MODEL_PROBE_INVALID_RESPONSE';
const validMessage = data => data?.choices?.[0]?.message?.role === 'assistant' && typeof data.choices[0].message.content === 'string' && Boolean(data.choices[0].message.content.trim());

// A byte, heartbeat, HTML page, or HTTP-200 JSON error is not a valid stream.
// Parse SSE across arbitrary network boundaries and require content plus an end.
async function verifyStream(response) {
  if(!String(response.headers?.get('content-type')||'').includes('text/event-stream'))throw new Error('invalid stream type');
  const reader=response.body?.getReader();if(!reader)throw new Error('empty stream');
  const decoder=new TextDecoder();let buffer='',content=0,done=false,finished=false,bytes=0;
  const consume=line=>{
    if(!line.startsWith('data:'))return;
    const raw=line.slice(5).trim();if(!raw)return;
    if(raw==='[DONE]'){done=true;return;}
    const data=JSON.parse(raw);if(data.error)throw new Error('stream error');
    const choice=data.choices?.[0];
    if(typeof choice?.delta?.content==='string'&&choice.delta.content.length)content++;
    if(choice?.finish_reason)finished=true;
  };
  try {
    while(!done) {
      const part=await reader.read();if(part.done)break;
      bytes+=part.value.length;if(bytes>1048576)throw new Error('probe too large');
      buffer+=decoder.decode(part.value,{stream:true});
      let index;while((index=buffer.indexOf('\n'))>=0){consume(buffer.slice(0,index).replace(/\r$/,''));buffer=buffer.slice(index+1);}
    }
    if(buffer.trim())consume(buffer.trim());
    if(!content||(!done&&!finished))throw new Error('incomplete stream');
    return {content_chunks:content};
  }finally{await reader.cancel().catch(()=>{});}
}

async function probeModelCapabilities(candidate, fetchImpl=globalThis.fetch) {
  const base=String(candidate.api_base||'').replace(/\/$/,'');
  if(!candidate.api_key||!base||!candidate.model)throw new Error('API Base, model, and API Key are required');
  const headers={'Content-Type':'application/json',Authorization:`Bearer ${candidate.api_key}`};
  const request=async(extra={},stream=false)=>{
    const response=await fetchImpl(`${base}/chat/completions`,{method:'POST',redirect:'error',headers,
      body:JSON.stringify({model:candidate.model,max_tokens:candidate.max_tokens||4096,messages:[{role:'user',content:'Connectivity check. Reply only OK.'}],...extra}),signal:AbortSignal.timeout(60000)});
    // Provider errors may echo credentials. Return status codes, never raw bodies.
    if(!response.ok){await response.body?.cancel?.();throw new Error(`HTTP ${response.status}`);}
    return stream?verifyStream(response):response.json();
  };
  const result={detected:true,live:true,availability:false,temperature:false,stream:false,tool_calling:false,structured_output:false,tested_at:new Date().toISOString(),details:{}};
  try{if(!validMessage(await request()))throw new Error('invalid assistant');result.availability=true;}
  catch(error){result.details.availability=safeError(error);return result;}
  const probes=[
    ['temperature',{temperature:candidate.temperature??1},validMessage],
    ['tool_calling',{messages:[{role:'user',content:'Call probe_tool with value="ok".'}],tools:[{type:'function',function:{name:'probe_tool',description:'Return probe value',parameters:{type:'object',properties:{value:{type:'string'}},required:['value'],additionalProperties:false}}}],tool_choice:{type:'function',function:{name:'probe_tool'}}},data=>{
      const calls=data?.choices?.[0]?.message?.tool_calls;if(!Array.isArray(calls)||calls.length!==1)return false;
      const call=calls[0];if(!call.id||call.type!=='function'||call.function?.name!=='probe_tool')return false;
      try{const args=JSON.parse(call.function.arguments);return args&&Object.keys(args).length===1&&args.value==='ok';}catch{return false;}
    }],
    ['structured_output',{response_format:{type:'json_schema',json_schema:{name:'capability_probe',strict:true,schema:{type:'object',properties:{ok:{type:'boolean'}},required:['ok'],additionalProperties:false}}},messages:[{role:'user',content:'Return JSON with ok=true.'}]},data=>{
      try{const value=JSON.parse(data?.choices?.[0]?.message?.content);return value&&Object.keys(value).length===1&&value.ok===true;}catch{return false;}
    }]
  ];
  await Promise.all([
    ...probes.map(async([name,extra,check])=>{try{result[name]=Boolean(check(await request(extra)));if(!result[name])result.details[name]='MODEL_PROBE_INVALID_RESPONSE';}catch(error){result.details[name]=safeError(error);}}),
    (async()=>{try{result.stream_observation=await request({stream:true},true);result.stream=true;}catch(error){result.details.stream=safeError(error);}})()
  ]);
  return result;
}
module.exports={probeModelCapabilities,verifyStream};
