'use strict';

// Probe behavior instead of inferring capabilities from a model name. Each
// capability is isolated so one unsupported option does not hide the others.
async function probeModelCapabilities(candidate, fetchImpl = globalThis.fetch) {
  const base = String(candidate.api_base || '').replace(/\/$/, '');
  if (!candidate.api_key || !base || !candidate.model) throw new Error('API Base, model, and API Key are required');
  const endpoint = `${base}/chat/completions`;
  const headers = {'Content-Type': 'application/json', 'Authorization': `Bearer ${candidate.api_key}`};
  const request = async (extra = {}, stream = false) => {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetchImpl(endpoint, {method: 'POST', headers,
        body: JSON.stringify({model: candidate.model, messages: [{role: 'user', content: 'Capability probe. Follow the requested response format exactly.'}], ...extra}), signal: controller.signal});
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`);
      if (stream) {
        const reader = response.body?.getReader(), first = reader ? await reader.read() : {done: true};
        await reader?.cancel();
        if (first.done) throw new Error('stream returned no chunks');
        return true;
      }
      return response.json();
    } finally { clearTimeout(timer); }
  };
  const result = {detected: true, availability: false, temperature: false, stream: false,
    tool_calling: false, structured_output: false, tested_at: new Date().toISOString(), details: {}};
  try { await request(); result.availability = true; }
  catch (error) { result.details.availability = error.message; return result; }
  const probes = [
    ['temperature', {temperature: 0.7}, () => true],
    ['tool_calling', {tools: [{type: 'function', function: {name: 'probe_tool', description: 'Return the probe value', parameters: {type: 'object', properties: {value: {type: 'string'}}, required: ['value'], additionalProperties: false}}}], tool_choice: {type: 'function', function: {name: 'probe_tool'}}}, data => Boolean(data?.choices?.[0]?.message?.tool_calls?.length)],
    ['structured_output', {response_format: {type: 'json_schema', json_schema: {name: 'capability_probe', strict: true, schema: {type: 'object', properties: {ok: {type: 'boolean'}}, required: ['ok'], additionalProperties: false}}}, messages: [{role: 'user', content: 'Return JSON with ok=true.'}]}, data => { try { return JSON.parse(data?.choices?.[0]?.message?.content).ok === true; } catch { return false; }}]
  ];
  // Once connectivity is known, the four independent probes run together so
  // a slow unsupported feature cannot make the settings dialog wait 4×25 s.
  await Promise.all([
    ...probes.map(async ([name, extra, check]) => {
      try { const data = await request(extra); result[name] = Boolean(check(data)); if (!result[name]) result.details[name] = 'response did not satisfy the probe'; }
      catch (error) { result.details[name] = error.message; }
    }),
    (async()=>{try { await request({stream: true}, true); result.stream = true; }
      catch (error) { result.details.stream = error.message; }})()
  ]);
  return result;
}

module.exports = {probeModelCapabilities};
