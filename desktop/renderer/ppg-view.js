/* PPG subpage: real local analysis, independent of EEG unit assumptions.
 * All new labels live in this bilingual dictionary; no demo signals are drawn.
 */
(function (global) {
  'use strict';
  const $ = s => document.querySelector(s);
  const strings = {
    zh: {
      title: 'PPG 信号处理', subtitle: '检查光电容积脉搏信号，比较清洗结果，查看脉搏峰与逐搏心率。',
      import: '选择记录', inspect: '检查文件', path: '本地文件路径', fileHint: '支持有列名的 CSV / TSV / TXT，以及 EDF / BDF / FIF / GDF。文件仅在本机读取。',
      settings: '信号与处理参数', channel: 'PPG 信号通道', time: '时间列', noTime: '无时间列（手动输入采样率）',
      timeUnit: '时间单位', seconds: '秒', milliseconds: '毫秒', rate: '采样率 Hz', start: '分析起点 s', duration: '分析时长 s（10–600）',
      invert: '反转信号极性（倒置脉搏）', algorithm: 'NeuroKit2 · Elgendi：0.5–8 Hz 带通清洗 + 脉搏峰检测',
      run: '运行 PPG 分析', cancel: '取消', empty: '导入记录后选择 PPG 通道并确认采样率，再运行分析。',
      checking: '正在读取文件结构…', processing: '正在清洗信号并检测脉搏峰…', ready: '文件结构已读取，请核对信号通道与采样率。',
      done: '分析完成。波形和脉搏峰已更新。', cancelled: '操作已取消。', changed: '参数已修改，请重新运行分析。',
      rateUnknown: '采样率未知：选择时间列或填写设备采样率。', error: '操作失败：', connection: '无法连接 Go 后端，请检查连接设置和后端运行状态。',
      file: '当前文件', samples: '采样点', pulses: '检测到的脉搏峰', bpm: '平均逐搏心率', range: '已分析区间',
      signal: '真实信号预览', original: '输入信号', cleaned: '清洗信号 · 圆点为脉搏峰', heart: '逐搏心率（bpm）',
      prev: '向左', next: '向右', zoomIn: '放大', zoomOut: '缩小', timeline: '预览时间位置',
      displayHint: 'Shift + 滚轮左右移动；放大/缩小调整时间窗口。显示抽稀保留极值，计算使用原始采样点。',
      export: '导出分析 JSON', csv: '导出脉搏峰 CSV', guide: '使用说明与结果边界',
      guideBody: '1. 导入文件并检查结构。CSV 第一行须为列名，信号列须为数值。\n2. 明确选择 PPG 列；时间列仅支持数值秒或毫秒。没有时间列时手动填写采样率。时间戳不均匀或与采样率冲突时会停止处理。\n3. 选择 10–600 秒分析窗口并运行。峰点应与脉搏波对应；倒置信号可勾选反转极性后重跑。\n4. 检查运动伪迹、漏检和误检，再导出结果。逐搏心率由相邻脉搏峰间隔计算；本页不输出 SpO₂ 或临床诊断，也不把 PPG 指标当作 ECG HRV。原始文件不会修改，结果仅在点击导出时保存。',
      noResult: '尚无分析结果', native: '文件自带采样率', sourceUnits: '幅值保留原始单位；两条波形分别缩放',
    },
    en: {
      title: 'PPG signal processing', subtitle: 'Inspect optical pulse signals, compare cleaning, and review peaks and beat-to-beat heart rate.',
      import: 'Choose recording', inspect: 'Inspect file', path: 'Local file path', fileHint: 'CSV / TSV / TXT with headers, or EDF / BDF / FIF / GDF. Files are read locally.',
      settings: 'Signal and processing parameters', channel: 'PPG signal channel', time: 'Time column', noTime: 'No time column (enter sampling rate)',
      timeUnit: 'Time unit', seconds: 'Seconds', milliseconds: 'Milliseconds', rate: 'Sampling rate (Hz)', start: 'Analysis start (s)', duration: 'Duration (s, 10–600)',
      invert: 'Invert signal polarity', algorithm: 'NeuroKit2 · Elgendi: 0.5–8 Hz bandpass cleaning + pulse peak detection',
      run: 'Run PPG analysis', cancel: 'Cancel', empty: 'Import a recording, select a PPG channel, confirm its sampling rate, then run analysis.',
      checking: 'Reading file structure…', processing: 'Cleaning signal and detecting pulse peaks…', ready: 'File structure ready. Verify the signal channel and sampling rate.',
      done: 'Analysis complete. Waveforms and pulse peaks updated.', cancelled: 'Operation cancelled.', changed: 'Parameters changed. Run analysis again.',
      rateUnknown: 'Unknown sampling rate: select a time column or enter the device rate.', error: 'Operation failed: ', connection: 'Cannot reach the Go backend. Check connection settings and backend status.',
      file: 'Recording', samples: 'Samples', pulses: 'Pulse peaks', bpm: 'Mean beat-to-beat rate', range: 'Analyzed interval',
      signal: 'Real signal preview', original: 'Input signal', cleaned: 'Cleaned signal · dots mark pulse peaks', heart: 'Beat-to-beat rate (bpm)',
      prev: 'Pan left', next: 'Pan right', zoomIn: 'Zoom in', zoomOut: 'Zoom out', timeline: 'Preview time position',
      displayHint: 'Shift + wheel to pan; zoom to change the time window. Display preserves extrema; analysis uses original samples.',
      export: 'Export analysis JSON', csv: 'Export pulse peaks CSV', guide: 'Instructions and result limitations',
      guideBody: '1. Import and inspect a recording. CSV must have a header and numeric signal columns.\n2. Select the PPG column explicitly. Numeric timestamps support seconds or milliseconds. Enter the sampling rate if no time column exists. Irregular timestamps and rate conflicts stop processing.\n3. Analyze a 10–600 second window. Peaks should align with pulses; invert polarity and rerun if needed.\n4. Review motion artifacts and missed/false peaks before export. Heart rate is derived from adjacent pulse intervals. This page does not produce SpO₂, clinical diagnoses, or ECG HRV. Source files are never modified. Results are saved only when you click Export.',
      noResult: 'No analysis yet', native: 'Sampling rate from file', sourceUnits: 'Amplitudes retain source units; traces use separate scales',
    }
  };
  const t = key => strings[global.NeuroI18n?.getLocale() === 'en' ? 'en' : 'zh'][key] || key;
  let metadata = null, result = null, busy = false, agentBusy = false, controller = null, left = 0, width = 10, statusKey = 'empty', agentID = '';
  const view = document.createElement('section');
  view.id = 'ppg-view'; view.hidden = true; view.className = 'ppg-view';
  view.innerHTML = `
    <header class="ppg-hero"><div><div class="eyebrow">OPTICAL PULSE STUDIO</div><h1 data-ppg="title"></h1><p data-ppg="subtitle"></p></div><span class="ppg-badge">PPG · NeuroKit2</span></header>
    <section class="card ppg-import"><label for="ppg-path" data-ppg="path"></label><div class="ppg-path-row"><input id="ppg-path" spellcheck="false" placeholder="C:\\data\\pulse.csv"><button class="button light" id="ppg-select" data-ppg="import"></button><button class="button primary" id="ppg-inspect" data-ppg="inspect"></button></div><p data-ppg="fileHint"></p><div id="ppg-status" role="status" aria-live="polite"></div><div id="ppg-metadata"></div></section>
    <div class="ppg-grid"><section class="card ppg-settings"><h2 data-ppg="settings"></h2>
      <label><span data-ppg="channel"></span><select id="ppg-channel" disabled></select></label>
      <label><span data-ppg="time"></span><select id="ppg-time" disabled><option value="" data-ppg="noTime"></option></select></label>
      <div class="ppg-fields"><label><span data-ppg="rate"></span><input id="ppg-rate" type="number" min="25" max="10000" step="any" placeholder="100"></label><label><span data-ppg="timeUnit"></span><select id="ppg-time-unit"><option value="s" data-ppg="seconds"></option><option value="ms" data-ppg="milliseconds"></option></select></label></div>
      <div class="ppg-fields"><label><span data-ppg="start"></span><input id="ppg-start" type="number" min="0" step="any" value="0"></label><label><span data-ppg="duration"></span><input id="ppg-duration" type="number" min="10" max="600" step="any" value="60"></label></div>
      <label class="ppg-checkbox"><input id="ppg-invert" type="checkbox"><span data-ppg="invert"></span></label>
      <p class="ppg-algorithm" data-ppg="algorithm"></p><button id="ppg-run" class="button primary" data-ppg="run" disabled></button><button id="ppg-cancel" class="button light" data-ppg="cancel" hidden></button>
      <details><summary data-ppg="guide"></summary><p data-ppg="guideBody"></p></details>
    </section><section class="ppg-results"><div class="ppg-metrics"><article class="card"><span data-ppg="bpm"></span><strong id="ppg-bpm">—</strong><small>bpm</small></article><article class="card"><span data-ppg="pulses"></span><strong id="ppg-count">—</strong></article><article class="card"><span data-ppg="range"></span><strong id="ppg-range">—</strong><small>s</small></article></div>
      <section class="card ppg-chart-card"><div class="section-heading"><h2 data-ppg="signal"></h2><div class="ppg-chart-actions"><button class="button light" id="ppg-left" data-ppg="prev" disabled></button><button class="button light" id="ppg-minus" data-ppg="zoomOut" disabled></button><button class="button light" id="ppg-plus" data-ppg="zoomIn" disabled></button><button class="button light" id="ppg-right" data-ppg="next" disabled></button></div></div>
        <p id="ppg-empty" data-ppg="noResult"></p><canvas id="ppg-canvas" height="460" role="img"></canvas><label class="ppg-timeline"><span data-ppg="timeline"></span><input id="ppg-position" type="range" min="0" max="0" step="0.01" value="0" disabled><output id="ppg-window">—</output></label><p data-ppg="displayHint"></p><small data-ppg="sourceUnits"></small>
      </section><div id="ppg-warnings" role="status"></div><div class="ppg-exports"><button id="ppg-export" class="button light" data-ppg="export" disabled></button><button id="ppg-export-csv" class="button light" data-ppg="csv" disabled></button></div>
    </section></div>`;
  $('main').append(view);

  function translate() {
    view.querySelectorAll('[data-ppg]').forEach(node => { node.textContent = t(node.dataset.ppg); });
    $('#ppg-canvas').setAttribute('aria-label', t('signal'));
    if (statusKey) $('#ppg-status').textContent = t(statusKey);
    showMetadata(); draw();
  }
  function status(key, detail = '') { statusKey = detail ? '' : key; $('#ppg-status').textContent = t(key) + detail; }
  function showMetadata() {
    $('#ppg-metadata').textContent = metadata ? `${metadata.file_name} · ${metadata.samples.toLocaleString()} ${t('samples')} · ${metadata.sampling_rate_hz ? metadata.sampling_rate_hz.toFixed(3) + ' Hz' : t('rateUnknown')}` : '';
  }
  function controls() {
    const locked=busy||agentBusy;
    const native = /\.(edf|bdf|fif|gdf)$/i.test($('#ppg-path').value);
    view.querySelectorAll('.ppg-settings input, .ppg-settings select, .ppg-import input, .ppg-import button').forEach(node => { node.disabled = locked; });
    $('#ppg-channel').disabled = locked || !metadata;
    $('#ppg-time').disabled = locked || !metadata || native;
    $('#ppg-time-unit').disabled = locked || native;
    $('#ppg-rate').disabled = locked || native;
    $('#ppg-run').disabled = locked || !metadata;
    $('#ppg-cancel').hidden = !busy;
    $('#ppg-export').disabled = $('#ppg-export-csv').disabled = !result || busy;
    for (const id of ['left', 'right', 'minus', 'plus', 'position']) $(`#ppg-${id}`).disabled = !result;
  }
  function clearResult() {
    agentID='';
    result = null; $('#ppg-bpm').textContent = $('#ppg-count').textContent = $('#ppg-range').textContent = '—';
    $('#ppg-warnings').textContent = ''; $('#ppg-window').textContent = '—';
    $('#ppg-empty').hidden = false; controls(); draw();
  }
  function options() {
    return { path: $('#ppg-path').value.trim(), channel: $('#ppg-channel').value,
      time_column: $('#ppg-time').value, time_unit: $('#ppg-time-unit').value,
      sampling_rate_hz: Number($('#ppg-rate').value) || 0,
      start_seconds: Number($('#ppg-start').value), duration_seconds: Number($('#ppg-duration').value), invert: $('#ppg-invert').checked };
  }
  async function request(operation) {
    if (busy || agentBusy) return;
    if(operation==='inspect')global.NeuroComponents?.clear();
    if (!$('#ppg-path').value.trim()) { $('#ppg-path').focus(); return; }
    // Capture configuration once. Disable edits until completion, and clear old
    // results immediately so a failed rerun cannot display stale peaks as new.
    const config = options();
    if (operation === 'inspect') { metadata = null; config.time_column = ''; config.sampling_rate_hz = 0; }
    clearResult(); busy = true; controls(); status(operation === 'inspect' ? 'checking' : 'processing');
    controller = new AbortController(); const timer = setTimeout(() => controller?.abort(), 185000);
    try {
      const base = global.NeuroFlowWorkspace?.backendURL?.() || 'http://localhost:8819';
      const response = await fetch(`${base}/ppg/${operation}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config), signal: controller.signal });
      const data = await response.json(); if (!response.ok || !data.ok) throw Error(data.message || `HTTP ${response.status}`);
      metadata = data;
      if (operation === 'inspect') {
        $('#ppg-channel').replaceChildren(...data.channels.map(name => new Option(name, name)));
        $('#ppg-time').replaceChildren(new Option(t('noTime'), ''), ...data.channels.map(name => new Option(name, name)));
        const suggested = data.channels.find(name => /ppg|pleth|pulse|光电|脉搏/i.test(name));
        // Never silently pick a numeric time column as a physiological signal.
        $('#ppg-channel').value = suggested || '';
        $('#ppg-rate').value = data.sampling_rate_hz || '';
        $('#ppg-start').value = 0; status('ready');
      } else {
        applyResult(data);
      }
      showMetadata();
    } catch (error) {
      status(error.name === 'AbortError' ? 'cancelled' : 'error', error.name === 'AbortError' ? '' : error instanceof TypeError ? t('connection') : error.message);
    } finally { clearTimeout(timer); controller = null; busy = false; controls(); draw(); }
  }
  function clamp() {
    if (!result) return;
    width = Math.min(Math.max(.5, width), result.end_seconds - result.start_seconds);
    left = Math.max(result.start_seconds, Math.min(left, result.end_seconds - width));
    const slider = $('#ppg-position'); slider.min = result.start_seconds; slider.max = result.end_seconds - width; slider.value = left;
    $('#ppg-window').textContent = `${left.toFixed(2)}–${(left + width).toFixed(2)} s`;
  }
  function pan(delta) { if (!result) return; left += delta; clamp(); draw(); }
  function zoom(factor) { if (!result) return; const center = left + width / 2; width *= factor; clamp(); left = center - width / 2; clamp(); draw(); }
  function draw() {
    const colors=global.NeuroTheme.palette();
    if (view.hidden) return;
    const canvas = $('#ppg-canvas'), rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    const ratio = global.devicePixelRatio || 1, h = 460, w = rect.width;
    canvas.width = Math.round(w * ratio); canvas.height = h * ratio;
    const ctx = canvas.getContext('2d'); ctx.scale(ratio, ratio); ctx.clearRect(0, 0, w, h);
    if (!result) return;
    clamp();
    const x = time => 62 + (time - left) / width * (w - 80);
    const plot = (times, values, offset, label, color, peaks = []) => {
      const visible = []; for (let i = 0; i < times.length; i++) if (times[i] >= left && times[i] <= left + width) visible.push(i);
      ctx.fillStyle = colors.text; ctx.font = '12px sans-serif'; ctx.fillText(label, 12, offset + 15);
      let lo = Infinity, hi = -Infinity; for (const i of visible) { lo = Math.min(lo, values[i]); hi = Math.max(hi, values[i]); }
      if (!visible.length) return;
      const span = Math.max(hi - lo, Math.abs(hi) * .01, 1e-12), y = value => offset + 117 - (value - lo) / span * 78;
      ctx.font = '10px monospace'; ctx.fillText(hi.toPrecision(3), 2, offset + 42); ctx.fillText(lo.toPrecision(3), 2, offset + 119);
      ctx.strokeStyle = colors.grid; ctx.lineWidth = 1;
      for (let j = 0; j <= 4; j++) { const px = 62 + j / 4 * (w - 80); ctx.beginPath(); ctx.moveTo(px, offset + 28); ctx.lineTo(px, offset + 124); ctx.stroke(); ctx.fillText((left + width * j / 4).toFixed(1), px - 12, offset + 138); }
      ctx.strokeStyle = color; ctx.lineWidth = 1.3; ctx.beginPath();
      visible.forEach((i, index) => { if (index) ctx.lineTo(x(times[i]), y(values[i])); else ctx.moveTo(x(times[i]), y(values[i])); }); ctx.stroke();
      ctx.fillStyle = colors.warning;
      peaks.filter(p => p.time >= left && p.time <= left + width).forEach(p => { ctx.beginPath(); ctx.arc(x(p.time), y(p.amplitude), 3, 0, Math.PI * 2); ctx.fill(); });
    };
    plot(result.waveform.time, result.waveform.raw, 0, t('original'), colors.muted);
    plot(result.waveform.time, result.waveform.cleaned, 153, t('cleaned'), colors.accent, result.peaks);
    plot(result.heart_rate.time, result.heart_rate.bpm, 306, t('heart'), colors.traces[1]);
  }
  function download(kind) {
    if (!result) return;
    const value = kind === 'json' ? JSON.stringify(result, null, 2) : 'sample,time_seconds,cleaned_amplitude\r\n' + result.peaks.map(p => `${p.sample},${p.time},${p.amplitude}`).join('\r\n');
    const url = URL.createObjectURL(new Blob([value], { type: kind === 'json' ? 'application/json' : 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `ppg-${result.file_name.replace(/[^\w.-]/g, '_')}.${kind}`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  $('#ppg-select').onclick = async () => {
    try { const paths = await global.desktop?.selectFiles?.(); if (paths?.[0]) { $('#ppg-path').value = paths[0]; await request('inspect'); } else if (!global.desktop?.selectFiles) $('#ppg-path').focus(); }
    catch (error) { status('error', error.message); }
  };
  $('#ppg-inspect').onclick = () => request('inspect'); $('#ppg-run').onclick = () => request('analyze'); $('#ppg-cancel').onclick = () => controller?.abort();
  $('#ppg-path').addEventListener('input', () => { metadata = null; showMetadata(); clearResult(); status('empty'); });
  view.querySelectorAll('.ppg-settings input, .ppg-settings select').forEach(input => input.addEventListener('input', () => { clearResult(); status('changed'); }));
  $('#ppg-left').onclick = () => pan(-width / 2); $('#ppg-right').onclick = () => pan(width / 2);
  $('#ppg-plus').onclick = () => zoom(.5); $('#ppg-minus').onclick = () => zoom(2);
  $('#ppg-position').oninput = event => { left = Number(event.target.value); draw(); };
  $('#ppg-canvas').addEventListener('wheel', event => { if (event.shiftKey && result) { event.preventDefault(); pan(Math.sign(event.deltaY || event.deltaX) * width / 5); } }, { passive: false });
  $('#ppg-export').onclick = () => download('json'); $('#ppg-export-csv').onclick = () => download('csv');
  new ResizeObserver(() => requestAnimationFrame(draw)).observe($('#ppg-canvas'));
  document.addEventListener('neuroflow:localechange', translate);
  document.addEventListener('neuroflow:themechange', draw);
  function applyResult(data){
    result=data;metadata=data;left=data.start_seconds;width=Math.min(10,data.end_seconds-left);
    $('#ppg-rate').value=data.sampling_rate_hz;
    $('#ppg-bpm').textContent=data.mean_bpm==null?'—':data.mean_bpm.toFixed(1);
    $('#ppg-count').textContent=data.peak_count;$('#ppg-range').textContent=`${data.start_seconds.toFixed(1)}–${data.end_seconds.toFixed(1)}`;
    $('#ppg-warnings').textContent=(data.warnings||[]).join('\n');$('#ppg-empty').hidden=true;
    status('done');showMetadata();controls();draw();
  }
  // Only the opaque prepared ID enters the chat request. Configuration is
  // frozen on the Go side; source paths and waveform arrays never enter chat.
  async function prepareAgent(signal){
    if(busy)throw Error(t('processing'));
    if(!metadata)return '';
    const base=global.NeuroFlowWorkspace.backendURL();
    const response=await fetch(`${base}/ppg/prepare`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(options()),signal});
    const data=await response.json();if(!response.ok||!data.ok)throw Error(data.message||`HTTP ${response.status}`);
    agentID=data.ppg_id;return agentID;
  }
  async function syncAgentResult(id,signal){
    if(!id||id!==agentID)return;
    signal?.throwIfAborted();
    const response=await fetch(`${global.NeuroFlowWorkspace.backendURL()}/ppg/${encodeURIComponent(id)}/latest`,{signal:signal?AbortSignal.any([signal,AbortSignal.timeout(15000)]):AbortSignal.timeout(15000)});
    if(response.status===404)return;
    const data=await response.json();if(!response.ok)throw Error(data.message||`HTTP ${response.status}`);
    signal?.throwIfAborted();
    if(id===agentID)applyResult(data);
  }
  global.NeuroPPG = Object.freeze({ activate: () => { translate(); controls(); requestAnimationFrame(draw); },isBusy:()=>busy,
    setAgentBusy:value=>{agentBusy=value;controls();},prepareAgent,syncAgentResult,
    snapshot:()=>({loaded:Boolean(metadata),busy,channels:metadata?.channels||[],channel:$('#ppg-channel').value,sampling_rate_hz:Number($('#ppg-rate').value)||null,time_column:$('#ppg-time').value,time_unit:$('#ppg-time-unit').value,invert:$('#ppg-invert').checked,start_seconds:Number($('#ppg-start').value),duration_seconds:Number($('#ppg-duration').value),display_window:result?{start_seconds:left,duration_seconds:width}:null,status:statusKey||'error',latest_result:result?{analysis_id:result.analysis_id,mean_bpm:result.mean_bpm,peak_count:result.peak_count,method:result.method,warnings:result.warnings,saved:false}:null}) });
  translate();
})(window);
