(function sleepLabelWorkspace(global) {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const text = {
    'zh-CN': {
      title: '睡眠数据标注', subtitle: '按 30 秒 Epoch 完成睡眠分期、伪迹标记与一致性检查。',
      import: '导入睡眠记录', guide: '使用说明', noData: '尚未关联数据', noDataBody: '支持 CSV、EDF、BDF、FIF 等记录。CSV 至少需要信号列，并提供时间列或可确认的采样率；EEG 为必需，EOG/EMG 建议提供。标注只保存在本机。',
      recording: '当前记录', standard: '标注规范', standardValue: 'AASM · 30 秒', progress: '完成进度', scored: '已标注', unscored: '未标注', artifacts: '伪迹',
      timeline: '整夜睡眠图', timelineHint: '点击睡眠图可快速跳转到对应 Epoch', epoch: '当前 Epoch', start: '开始时间', stage: '睡眠阶段',
      check: '数据格式检查', checkHint: '沿用预处理工作台的真实解析结果', format: '格式', channels: '通道', rate: '采样率', unit: '单位', structure: '结构状态', confirmed: '已确认', needsReview: '需要复核', reviewStructure: '检查数据结构',
      waveform: '当前 30 秒真实波形', waveformHint: '显示 EEG/EOG/EMG；波形仅做显示抽稀，不修改源数据', loadingWaveform: '正在读取当前 Epoch 波形…', waveformFailed: '波形读取失败：', noSleepChannels: '没有可显示的 EEG/EOG/EMG 通道',
      artifact: '标记伪迹', clearStage: '清除当前标签', note: '标注备注', notePlaceholder: '记录觉醒、体动、导联脱落或其他观察…', previous: '上一段', next: '下一段',
      save: '已自动保存到本机', keys: '快捷键：0=W，1=N1，2=N2，3=N3，4=REM，Delete=清除，A=伪迹，←/→=切换', queue: 'Epoch 队列', exportJSON: '导出 JSON', exportCSV: '导出 CSV',
      emptyStage: '未标注', complete: '标注完成', wake: '清醒', review: '待复核', dataReady: '已关联当前导入记录', unknownDuration: '无法读取记录时长，请先在预处理工作台完成数据解析。',
      autoStage: 'Agent 自动候选标注', candidate: 'Agent 候选', reviewed: '人工确认', candidateApplied: '已载入 {count} 个 Agent 候选标签，请逐段复核。', candidateFailed: '自动标注失败：', confirmBeforeAuto: '当前文件的采样率、单位或通道结构仍有待确认项。请先在打开的窗口中“验证并确认”，然后再次启动自动标注。', detectorAwaiting: '运行自动标注后，这里会显示 EEG/EOG/EMG 检测能力。', detectorMode: '检测模式', detectorEvents: '事件候选', detectorMissing: '缺少 {names}，对应检测器已关闭并降低相关分期可信度。',
      guideTitle: '睡眠标注使用说明', guideIntro: '本页面用于人工睡眠分期、Agent 辅助候选标注和伪迹记录，不会自动修改原始数据。', guideImport: '1. 导入与确认', guideImportBody: '可导入 CSV、EDF、BDF、FIF 等格式。CSV 建议第一行为列名，包含 time/timestamp 或明确采样率，并至少包含一个 EEG 信号列；EOG 和 EMG 有助于可靠分期。导入后先在预处理工作台核对通道类型、单位、采样率和时长。', guideScore: '2. 逐段标注', guideScoreBody: '系统按照 30 秒划分 Epoch。可让 Agent 生成待复核候选标签，也可使用 W、N1、N2、N3、REM 按钮或数字键 0–4 人工分期。任何人工选择都会把当前候选转为人工确认。再次点击已选阶段，或使用清除按钮、Delete/Backspace，可取消错误标签。', guideReview: '3. 复核与导出', guideReviewBody: '候选标签不是临床诊断或金标准。整夜睡眠图用于检查阶段转换和遗漏。导出结果会保留标签来源、置信度和复核状态。', close: '关闭'
    },
    en: {
      title: 'Sleep scoring', subtitle: 'Score 30-second epochs, mark artifacts, and review annotation consistency.',
      import: 'Import sleep record', guide: 'User guide', noData: 'No recording linked', noDataBody: 'CSV, EDF, BDF, FIF, and other records are supported. CSV needs signal columns plus a time column or confirmed sampling rate. EEG is required; EOG/EMG are recommended. Annotations stay local.',
      recording: 'Current recording', standard: 'Scoring standard', standardValue: 'AASM · 30 seconds', progress: 'Progress', scored: 'Scored', unscored: 'Unscored', artifacts: 'Artifacts',
      timeline: 'Whole-night hypnogram', timelineHint: 'Click the hypnogram to jump to an epoch', epoch: 'Current epoch', start: 'Start time', stage: 'Sleep stage',
      check: 'Data format check', checkHint: 'Uses the verified parser results from Preprocessing', format: 'Format', channels: 'Channels', rate: 'Sampling rate', unit: 'Unit', structure: 'Structure', confirmed: 'Confirmed', needsReview: 'Review required', reviewStructure: 'Review structure',
      waveform: 'Real 30-second signal window', waveformHint: 'EEG/EOG/EMG display; downsampled for display without changing source data', loadingWaveform: 'Loading this epoch…', waveformFailed: 'Unable to load waveform: ', noSleepChannels: 'No EEG/EOG/EMG channels are available',
      artifact: 'Mark artifact', clearStage: 'Clear current label', note: 'Annotation note', notePlaceholder: 'Record arousal, movement, electrode loss, or another observation…', previous: 'Previous', next: 'Next',
      save: 'Saved locally automatically', keys: 'Shortcuts: 0=W, 1=N1, 2=N2, 3=N3, 4=REM, Delete=clear, A=artifact, ←/→=navigate', queue: 'Epoch queue', exportJSON: 'Export JSON', exportCSV: 'Export CSV',
      emptyStage: 'Unscored', complete: 'Complete', wake: 'Wake', review: 'Review', dataReady: 'Linked to the imported recording', unknownDuration: 'Recording duration is unavailable. Parse the dataset in Preprocessing first.',
      autoStage: 'Agent candidate scoring', candidate: 'Agent candidate', reviewed: 'Human reviewed', candidateApplied: 'Loaded {count} Agent candidates. Review each epoch.', candidateFailed: 'Automatic staging failed: ', confirmBeforeAuto: 'Sampling rate, units, or channel structure still require confirmation. Use Validate and confirm in the opened dialog, then start automatic scoring again.', detectorAwaiting: 'Run automatic scoring to inspect EEG/EOG/EMG detector capabilities.', detectorMode: 'Detection mode', detectorEvents: 'Event candidates', detectorMissing: 'Missing {names}; related detectors are disabled and affected stages have reduced confidence.',
      guideTitle: 'Sleep scoring guide', guideIntro: 'This workspace supports manual scoring, Agent-assisted candidates, and artifact notes without modifying the source recording.', guideImport: '1. Import and verify', guideImportBody: 'Import CSV, EDF, BDF, FIF, or another supported format. CSV should have a header, time/timestamp or a confirmed sampling rate, and at least one EEG signal column. EOG and EMG improve scoring reliability. Verify channel types, units, rate, and duration in Preprocessing first.', guideScore: '2. Score each epoch', guideScoreBody: 'The recording is divided into 30-second epochs. Ask the Agent for review-required candidates, or score manually with W, N1, N2, N3, REM or number keys 0–4. A manual selection confirms the current epoch. Click the selected stage again, use Clear, or press Delete/Backspace to remove a wrong label.', guideReview: '3. Review and export', guideReviewBody: 'Candidates are not a clinical diagnosis or gold standard. Use the hypnogram to find transitions and omissions. Exports retain label source, confidence, and review status.', close: 'Close'
    }
  };
  const stages = ['W', 'N1', 'N2', 'N3', 'REM'];
  const colors = { W: '#f0b84f', N1: '#93b9ae', N2: '#4d927e', N3: '#24584c', REM: '#9871d4' };
  let model = { key: '', file: '', duration: 0, current: 0, epochs: [], waveform: null, loadedEpoch: -1, loadingEpoch: -1, lastAnalysisId: '', capabilities: null, eventCounts: null };
  // LRU waveform cache plus a pending-request map prevent repeated Python file
  // opens. Adjacent epochs are fetched after the visible epoch is ready.
  const waveformCache = new Map(), waveformPending = new Map();

  function locale() { return global.NeuroI18n?.getLocale() === 'en' ? 'en' : 'zh-CN'; }
  function t(key) { return text[locale()][key] || key; }
  function ensureView() {
    if ($('#sleep-view')) return;
    const view = document.createElement('section');
    view.id = 'sleep-view'; view.className = 'sleep-view'; view.hidden = true;
    view.innerHTML = `
      <div class="sleep-hero"><div><div class="eyebrow">SLEEP SCORING STUDIO</div><h1 data-sleep="title"></h1><p data-sleep="subtitle"></p></div><div class="sleep-actions"><button class="button primary" id="sleep-auto-stage" data-sleep="autoStage"></button><button class="button light" id="sleep-guide" data-sleep="guide"></button><button class="button light" id="sleep-export-json" disabled data-sleep="exportJSON"></button><button class="button primary" id="sleep-export-csv" disabled data-sleep="exportCSV"></button></div></div>
      <div id="sleep-empty" class="card sleep-empty"><div class="sleep-moon">☾</div><h2 data-sleep="noData"></h2><p data-sleep="noDataBody"></p><button class="button primary" id="sleep-import" data-sleep="import"></button></div>
      <div id="sleep-workspace" hidden>
        <div class="sleep-summary">
          <article class="card"><span data-sleep="recording"></span><strong id="sleep-file">—</strong><small data-sleep="dataReady"></small></article>
          <article class="card"><span data-sleep="standard"></span><strong data-sleep="standardValue"></strong><small id="sleep-duration">—</small></article>
          <article class="card sleep-progress-card"><span data-sleep="progress"></span><strong id="sleep-progress">0%</strong><div class="sleep-progress"><i id="sleep-progress-bar"></i></div></article>
        </div>
        <section class="card sleep-data-check"><div class="section-heading"><div><h2 data-sleep="check"></h2><p data-sleep="checkHint"></p></div><button class="button light" id="sleep-review-structure" data-sleep="reviewStructure"></button></div><div class="sleep-metadata"><div><span data-sleep="format"></span><strong id="sleep-meta-format">—</strong></div><div><span data-sleep="channels"></span><strong id="sleep-meta-channels">—</strong></div><div><span data-sleep="rate"></span><strong id="sleep-meta-rate">—</strong></div><div><span data-sleep="unit"></span><strong id="sleep-meta-unit">—</strong></div><div><span data-sleep="structure"></span><strong id="sleep-meta-structure">—</strong></div></div><div id="sleep-detector-summary" class="sleep-detector-summary"></div><div id="sleep-structure-messages" class="sleep-structure-messages"></div></section>
        <section class="card sleep-hypnogram-card"><div class="section-heading"><div><h2 data-sleep="timeline"></h2><p data-sleep="timelineHint"></p></div><div class="sleep-legend">${stages.map(s => `<span><i class="stage-${s}"></i>${s}</span>`).join('')}</div></div><canvas id="sleep-hypnogram" height="190"></canvas></section>
        <div class="sleep-editor-grid">
          <section class="card sleep-editor"><div class="section-heading"><h2 data-sleep="epoch"></h2><span class="pill neutral" id="sleep-epoch-counter">—</span></div><div class="sleep-time"><span data-sleep="start"></span><strong id="sleep-epoch-time">00:00:00</strong></div><div class="sleep-waveform-head"><div><strong data-sleep="waveform"></strong><span data-sleep="waveformHint"></span></div><span id="sleep-waveform-status" role="status"></span></div><canvas id="sleep-waveform" height="310"></canvas><label class="sleep-field"><span data-sleep="stage"></span><div id="sleep-stage-buttons" class="sleep-stage-buttons">${stages.map((s,i) => `<button type="button" data-stage="${s}"><small>${i}</small>${s}</button>`).join('')}</div><button type="button" class="sleep-clear-stage" id="sleep-clear-stage" data-sleep="clearStage"></button></label><label class="sleep-artifact"><input id="sleep-artifact" type="checkbox"><span data-sleep="artifact"></span></label><label class="sleep-field"><span data-sleep="note"></span><textarea id="sleep-note" rows="3" maxlength="500" data-sleep-placeholder="notePlaceholder"></textarea></label><div class="sleep-nav"><button class="button light" id="sleep-previous" data-sleep="previous"></button><span data-sleep="save"></span><button class="button primary" id="sleep-next" data-sleep="next"></button></div><p class="sleep-shortcuts" data-sleep="keys"></p></section>
          <section class="card sleep-queue-card"><div class="section-heading"><h2 data-sleep="queue"></h2><div class="sleep-counts"><span><b id="sleep-scored">0</b> <i data-sleep="scored"></i></span><span><b id="sleep-unscored">0</b> <i data-sleep="unscored"></i></span><span><b id="sleep-artifacts">0</b> <i data-sleep="artifacts"></i></span></div></div><div id="sleep-epoch-list" class="sleep-epoch-list"></div></section>
        </div>
      </div><div id="sleep-agent-host"></div>
      <dialog id="sleep-guide-dialog" class="sleep-guide-dialog"><div class="section-heading"><h2 data-sleep="guideTitle"></h2><button type="button" class="icon-button" id="sleep-guide-close" aria-label="Close">×</button></div><p data-sleep="guideIntro"></p><article><h3 data-sleep="guideImport"></h3><p data-sleep="guideImportBody"></p></article><article><h3 data-sleep="guideScore"></h3><p data-sleep="guideScoreBody"></p></article><article><h3 data-sleep="guideReview"></h3><p data-sleep="guideReviewBody"></p></article><button type="button" class="button primary" id="sleep-guide-done" data-sleep="close"></button></dialog>`;
    $('main').append(view);
    bind(); translate();
  }

  function datasetInfo() {
    const snapshot = global.NeuroFlowWorkspace?.snapshot?.();
    if (snapshot?.inspection?.duration_seconds > 0) return { file: snapshot.name, duration: Number(snapshot.inspection.duration_seconds), snapshot };
    const metadata = $('.metadata');
    const file = $('#file-name')?.textContent.trim() || '';
    if (!metadata || metadata.hidden || !file) return null;
    const raw = $('#meta-duration')?.textContent || '';
    const duration = Number((raw.match(/[\d.]+/) || [0])[0]);
    return duration > 0 ? { file, duration, snapshot: null } : { file, duration: 0, snapshot: null };
  }
  function storageKey(info) { return `neuroflow-sleep:${info.file}:${info.duration}`; }
  function waveformKey(epoch) { return `${model.snapshot?.datasetId || model.key}:${epoch}`; }
  function cacheWaveform(key, value) { waveformCache.delete(key); waveformCache.set(key, value); while (waveformCache.size > 12) waveformCache.delete(waveformCache.keys().next().value); }
  function requestEpoch(epoch) {
    if (epoch < 0 || epoch >= model.epochs.length || !global.NeuroFlowWorkspace?.signalWindow) return Promise.resolve(null);
    const key = waveformKey(epoch);
    if (waveformCache.has(key)) { const value = waveformCache.get(key); cacheWaveform(key, value); return Promise.resolve(value); }
    if (waveformPending.has(key)) return waveformPending.get(key);
    const request = global.NeuroFlowWorkspace.signalWindow(epoch * 30, Math.min(30, model.duration - epoch * 30), 'sleep')
      .then(data => { cacheWaveform(key, data); return data; })
      .finally(() => waveformPending.delete(key));
    waveformPending.set(key, request); return request;
  }
  function load() {
    const info = datasetInfo();
    $('#sleep-empty').hidden = Boolean(info?.duration);
    $('#sleep-workspace').hidden = !info?.duration;
    if (!info?.duration) return;
    const key = storageKey(info);
    if (model.key !== key) {
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem(key)); } catch (_) { /* start clean */ }
      const count = Math.max(1, Math.ceil(info.duration / 30));
      model = { key, file: info.file, duration: info.duration, current: Math.min(saved?.current || 0, count - 1), epochs: Array.from({ length: count }, (_, i) => ({ stage: '', artifact: false, note: '', source: '', reviewed: false, confidence: null, ...(saved?.epochs?.[i] || {}) })), waveform: null, loadedEpoch: -1, loadingEpoch: -1, snapshot: info.snapshot, lastAnalysisId: saved?.lastAnalysisId || '', capabilities: saved?.capabilities || null, eventCounts: saved?.eventCounts || null };
    } else {
      model.snapshot = info.snapshot;
    }
    render();
  }
  function persist() { if (model.key) localStorage.setItem(model.key, JSON.stringify({ current: model.current, epochs: model.epochs, lastAnalysisId: model.lastAnalysisId, capabilities: model.capabilities, eventCounts: model.eventCounts })); }
  function formatTime(seconds) { const s = Math.max(0, Math.floor(seconds)); return [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60].map(v => String(v).padStart(2, '0')).join(':'); }
  function selectEpoch(index) { model.current = Math.max(0, Math.min(model.epochs.length - 1, index)); persist(); render(); }
  function setStage(stage) {
    // Selecting the active stage again is an intentional toggle back to
    // unscored. Artifact and note are independent and remain untouched.
    const item = model.epochs[model.current];
    item.stage = item.stage === stage ? '' : stage;
    item.source = item.stage ? 'manual' : '';
    item.reviewed = Boolean(item.stage);
    item.confidence = null;
    persist(); render();
  }
  function clearStage() { Object.assign(model.epochs[model.current], { stage: '', source: '', reviewed: false, confidence: null }); persist(); render(); }

  // Candidate results fill only unscored epochs. Existing manual work is never
  // overwritten. A manual stage selection later changes source to "manual" and
  // reviewed to true, making the provenance explicit in JSON/CSV exports.
  function applyCandidates(result, overwriteExisting = false) {
    if (!result?.analysis_id || result.analysis_id === model.lastAnalysisId || !Array.isArray(result.epochs)) return 0;
    let applied = 0;
    result.epochs.forEach(candidate => {
      const index = Number(candidate.epoch) - 1, item = model.epochs[index];
      if (!item || (!overwriteExisting && item.stage) || !stages.includes(candidate.stage)) return;
      Object.assign(item, { stage: candidate.stage, artifact: item.artifact || Boolean(candidate.artifact), source: 'agent_candidate', reviewed: false, confidence: Number(candidate.confidence) || 0 });
      applied += 1;
    });
    model.lastAnalysisId = result.analysis_id;
	model.capabilities = result.capabilities || null;
	model.eventCounts = result.event_counts || null;
	persist(); render();
    return applied;
  }

  async function autoStage() {
	// The primary action deliberately enters through ReAct. The model receives
	// the user's explicit intent, selects suggest_sleep_stages, and explains the
	// outcome. The page then fetches the locally cached per-epoch result.
	const inspection = model.snapshot?.inspection || {};
	const report = inspection.structure_report || {};
	// Match the server-side tool guard before spending an LLM request. Warnings
	// such as nominal-vs-timestamp sampling-rate disagreement require an explicit
	// import decision because they change every 30-second epoch boundary.
	if ((report.requires_confirmation || inspection.structure_conflicts?.length) && !report.confirmed_by_user) {
		global.NeuroFlowWorkspace.notify(t('confirmBeforeAuto'));
		global.NeuroFlowWorkspace.reviewStructure();
		return;
	}
	const prompt = locale() === 'en'
		? 'Inspect the bound sleep recording and call the sleep-staging tool now. Generate 30-second W/N1/N2/N3/REM candidates and tell me what needs review.'
		: '请检查当前绑定的睡眠记录，现在调用睡眠自动分期工具，生成每 30 秒的 W/N1/N2/N3/REM 候选标签，并说明需要复核的内容。';
	const automatic = $('#sleep-auto-stage'); automatic.disabled = true;
	const context = locale() === 'en'
		? `[Interface language: English]\n[Sleep workspace: dataset_id=${model.snapshot?.datasetId}; 30-second epochs=${model.epochs.length}; scored=${model.epochs.filter(item => item.stage).length}; review-required Agent candidates=${model.epochs.filter(item => item.source === 'agent_candidate' && !item.reviewed).length}]\n${prompt}`
		: `[界面语言：简体中文]\n[睡眠标注上下文：dataset_id=${model.snapshot?.datasetId}；30秒 Epoch 数=${model.epochs.length}；已标注=${model.epochs.filter(item => item.stage).length}；待复核 Agent 候选=${model.epochs.filter(item => item.source === 'agent_candidate' && !item.reviewed).length}]\n${prompt}`;
    try {
	  await global.NeuroFlowWorkspace.sendAgentMessage(context);
      const latest = await global.NeuroFlowWorkspace.latestSleepStages();
      const count = applyCandidates(latest);
	  if (count) global.NeuroFlowWorkspace.notify(t('candidateApplied').replace('{count}', count));
    } catch (error) {
	  global.NeuroFlowWorkspace.notify(t('candidateFailed') + error.message);
	} finally { automatic.disabled = false; }
  }

  function render() {
    if (!model.epochs.length) return;
    const item = model.epochs[model.current];
    const scored = model.epochs.filter(e => e.stage).length;
    const artifacts = model.epochs.filter(e => e.artifact).length;
    const percentage = Math.round(scored / model.epochs.length * 100);
    $('#sleep-file').textContent = model.file; $('#sleep-duration').textContent = `${formatTime(model.duration)} · ${model.epochs.length} Epochs`;
    renderInspection();
    $('#sleep-progress').textContent = `${percentage}%`; $('#sleep-progress-bar').style.width = `${percentage}%`;
    $('#sleep-scored').textContent = scored; $('#sleep-unscored').textContent = model.epochs.length - scored; $('#sleep-artifacts').textContent = artifacts;
    $('#sleep-epoch-counter').textContent = `${model.current + 1} / ${model.epochs.length}`; $('#sleep-epoch-time').textContent = formatTime(model.current * 30);
    $('#sleep-artifact').checked = item.artifact; $('#sleep-note').value = item.note;
    document.querySelectorAll('#sleep-stage-buttons button').forEach(button => button.classList.toggle('selected', button.dataset.stage === item.stage));
    $('#sleep-previous').disabled = model.current === 0; $('#sleep-next').disabled = model.current === model.epochs.length - 1;
    $('#sleep-export-json').disabled = false; $('#sleep-export-csv').disabled = false;
    const from = Math.max(0, Math.min(model.current - 5, model.epochs.length - 11));
    $('#sleep-epoch-list').innerHTML = model.epochs.slice(from, from + 11).map((epoch, offset) => { const index = from + offset, candidate = epoch.source === 'agent_candidate' && !epoch.reviewed; return `<button type="button" data-epoch="${index}" class="${index === model.current ? 'active' : ''}${candidate ? ' candidate' : ''}"><span>${String(index + 1).padStart(4, '0')}</span><time>${formatTime(index * 30)}</time><b class="stage-${epoch.stage || 'empty'}">${epoch.stage || '—'}</b>${candidate ? `<em title="${t('candidate')}">AI</em>` : ''}${epoch.artifact ? '<i>!</i>' : ''}</button>`; }).join('');
    document.querySelectorAll('#sleep-epoch-list [data-epoch]').forEach(button => button.addEventListener('click', () => selectEpoch(Number(button.dataset.epoch))));
    drawHypnogram();
    if (model.loadedEpoch === model.current && model.waveform) drawWaveform(model.waveform);
    else loadEpochWaveform();
  }

  function renderInspection() {
    const meta = model.snapshot?.inspection || {};
    $('#sleep-meta-format').textContent = meta.format || '—';
    $('#sleep-meta-channels').textContent = meta.channel_count ?? '—';
    $('#sleep-meta-rate').textContent = meta.sampling_rate_hz ? `${Number(meta.sampling_rate_hz).toFixed(2)} Hz` : '—';
    $('#sleep-meta-unit').textContent = meta.signal_unit || '—';
    const report = meta.structure_report || {};
    const needsReview = Boolean(meta.structure_conflicts?.length || report.requires_confirmation) && !report.confirmed_by_user;
    $('#sleep-meta-structure').textContent = t(needsReview ? 'needsReview' : 'confirmed');
    $('#sleep-meta-structure').className = needsReview ? 'needs-review' : 'confirmed';
    const messages = [...(meta.structure_conflicts || []), ...(meta.structure_warnings || [])];
    $('#sleep-structure-messages').textContent = messages.join('\n');
    $('#sleep-structure-messages').hidden = messages.length === 0;
	const detector = $('#sleep-detector-summary');
	if (!model.capabilities) {
		detector.textContent = t('detectorAwaiting');
	} else {
		const channels = model.capabilities.channels || {}, counts = model.eventCounts || {};
		const channelText = `EEG ${channels.eeg?.length || 0} · EOG ${channels.eog?.length || 0} · EMG ${channels.emg?.length || 0}`;
		const eventText = `Spindle ${counts.sleep_spindles || 0} · K-complex ${counts.k_complexes || 0} · SEM ${counts.slow_eye_movements || 0} · REM ${counts.rapid_eye_movements || 0} · Arousal ${counts.micro_arousal_candidates || 0}`;
		const missing = (model.capabilities.missing_modalities || []).join(' / ');
		const missingText = missing ? t('detectorMissing').replace('{names}', missing) : '';
		detector.textContent = `${t('detectorMode')}：${model.capabilities.mode}（${channelText}）\n${t('detectorEvents')}：${eventText}${missingText ? `\n${missingText}` : ''}`;
	}
	const automatic = $('#sleep-auto-stage');
	automatic.classList.toggle('needs-confirmation', needsReview);
	automatic.title = needsReview ? t('confirmBeforeAuto') : '';
  }

  async function loadEpochWaveform() {
    if (!global.NeuroFlowWorkspace?.signalWindow || model.loadingEpoch === model.current) return;
    const epoch = model.current;
    model.loadingEpoch = epoch;
    $('#sleep-waveform-status').textContent = t('loadingWaveform');
    $('#sleep-waveform').setAttribute('aria-busy', 'true');
    try {
      const data = await requestEpoch(epoch);
      if (model.current !== epoch) return;
      model.waveform = data; model.loadedEpoch = epoch;
      $('#sleep-waveform-status').textContent = `${data.channel_names?.length || 0} ch · ${Number(data.original_sample_rate_hz || data.sample_rate_hz || 0).toFixed(1)} Hz`;
      drawWaveform(data);
      // Likely navigation targets are warmed in the background. Failures stay
      // silent because the visible request will report them if selected later.
      requestEpoch(epoch + 1).catch(() => {});
      requestEpoch(epoch - 1).catch(() => {});
    } catch (error) {
      if (error.name === 'AbortError') return;
      if (model.current !== epoch) return;
      model.waveform = null; model.loadedEpoch = -1;
      $('#sleep-waveform-status').textContent = t('waveformFailed') + error.message;
      drawWaveform(null);
    } finally {
      if (model.current === epoch) { model.loadingEpoch = -1; $('#sleep-waveform').setAttribute('aria-busy', 'false'); }
    }
  }

  function drawWaveform(preview) {
    const canvas = $('#sleep-waveform'); if (!canvas) return;
    const ratio = devicePixelRatio || 1, width = Math.max(500, canvas.clientWidth), height = 310;
    canvas.width = width * ratio; canvas.height = height * ratio;
    const ctx = canvas.getContext('2d'); ctx.scale(ratio, ratio); ctx.clearRect(0, 0, width, height);
    const dark = document.documentElement.dataset.theme === 'dark';
    const series = preview?.data || [], labels = preview?.channel_names || [];
    if (!series.length) { ctx.fillStyle = dark ? '#8ea9a0' : '#849790'; ctx.font = '12px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(t('noSleepChannels'), width / 2, height / 2); ctx.textAlign = 'left'; return; }
    const left = 65, right = 12, top = 12, bottom = 24, plotW = width - left - right, rowH = (height - top - bottom) / series.length;
    ctx.font = '10px Segoe UI'; ctx.lineWidth = 1;
    series.forEach((values, row) => {
      const center = top + rowH * (row + .5), numeric = values.map(Number).filter(Number.isFinite);
      const peak = Math.max(1e-9, ...numeric.map(value => Math.abs(value)));
      ctx.strokeStyle = dark ? '#29483f' : '#e5eeea'; ctx.beginPath(); ctx.moveTo(left, center); ctx.lineTo(width - right, center); ctx.stroke();
      ctx.fillStyle = dark ? '#a9c4ba' : '#647d74'; ctx.fillText(labels[row] || `CH${row + 1}`, 5, center + 3);
      ctx.strokeStyle = row % 3 === 0 ? '#4d927e' : row % 3 === 1 ? '#9871d4' : '#5b7fa3'; ctx.beginPath();
      numeric.forEach((value, index) => { const x = left + index / Math.max(1, numeric.length - 1) * plotW, y = center - value / peak * rowH * .38; if (index) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.stroke();
    });
    ctx.fillStyle = dark ? '#8ea9a0' : '#849790'; ctx.fillText(formatTime(model.current * 30), left, height - 7); ctx.textAlign = 'right'; ctx.fillText(formatTime(Math.min(model.duration, (model.current + 1) * 30)), width - right, height - 7); ctx.textAlign = 'left';
  }

  function drawHypnogram() {
    const canvas = $('#sleep-hypnogram'); if (!canvas) return;
    const ratio = devicePixelRatio || 1, width = Math.max(500, canvas.clientWidth), height = 190;
    canvas.width = width * ratio; canvas.height = height * ratio; const ctx = canvas.getContext('2d'); ctx.scale(ratio, ratio);
    const dark = document.documentElement.dataset.theme === 'dark'; ctx.clearRect(0, 0, width, height); ctx.font = '11px Segoe UI';
    const top = 18, bottom = 30, plotH = height - top - bottom, row = plotH / stages.length;
    stages.forEach((stage, i) => { const y = top + i * row + row / 2; ctx.fillStyle = dark ? '#9db8af' : '#71877f'; ctx.fillText(stage, 8, y + 4); ctx.strokeStyle = dark ? '#29483f' : '#e5eeea'; ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(width - 12, y); ctx.stroke(); });
    const plotW = width - 54, cell = plotW / model.epochs.length;
    model.epochs.forEach((epoch, index) => { if (!epoch.stage) return; const y = top + stages.indexOf(epoch.stage) * row; ctx.fillStyle = colors[epoch.stage]; ctx.fillRect(42 + index * cell, y + 2, Math.max(1, cell + .4), row - 4); if (epoch.artifact) { ctx.fillStyle = '#e05e5e'; ctx.fillRect(42 + index * cell, top, Math.max(1, cell + .4), 3); } });
    const x = 42 + model.current * cell; ctx.strokeStyle = dark ? '#fff' : '#173f35'; ctx.lineWidth = 2; ctx.strokeRect(x, top - 3, Math.max(2, cell), plotH + 6);
    ctx.fillStyle = dark ? '#9db8af' : '#71877f'; ctx.fillText('00:00', 42, height - 9); ctx.fillText(formatTime(model.duration), width - 62, height - 9);
  }
  function exportFile(kind) {
    const rows = model.epochs.map((e, i) => ({ epoch: i + 1, onset_seconds: i * 30, duration_seconds: Math.min(30, model.duration - i * 30), stage: e.stage || 'UNSCORED', artifact: e.artifact, source: e.source || '', confidence: e.confidence ?? '', reviewed: Boolean(e.reviewed), note: e.note }));
    const body = kind === 'json' ? JSON.stringify({ format: 'NeuroFlow sleep annotations', version: 3, source: model.file, epoch_seconds: 30, recording_duration_seconds: model.duration, capabilities: model.capabilities, event_counts: model.eventCounts, annotations: rows }, null, 2) : ['epoch,onset_seconds,duration_seconds,stage,artifact,source,confidence,reviewed,note', ...rows.map(r => [r.epoch,r.onset_seconds,r.duration_seconds,r.stage,r.artifact,r.source,r.confidence,r.reviewed,`"${r.note.replace(/"/g,'""')}"`].join(','))].join('\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([body], { type: kind === 'json' ? 'application/json' : 'text/csv' })); link.download = `${model.file.replace(/\.[^.]+$/, '')}-sleep-annotations.${kind}`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
  function translate() { const root = $('#sleep-view'); if (!root) return; root.querySelectorAll('[data-sleep]').forEach(node => { node.textContent = t(node.dataset.sleep); }); root.querySelectorAll('[data-sleep-placeholder]').forEach(node => { node.placeholder = t(node.dataset.sleepPlaceholder); }); if (model.epochs.length) render(); if (!root.hidden) configureAgent(); }
  function bind() {
    // Reuse the application's import path so Electron gets native file paths and
    // the existing CSV/MNE structure detector, progress UI, and validation.
    $('#sleep-import').addEventListener('click', () => $('#import-top')?.click());
    $('#sleep-guide').addEventListener('click', () => $('#sleep-guide-dialog').showModal());
    $('#sleep-guide-close').addEventListener('click', () => $('#sleep-guide-dialog').close());
    $('#sleep-guide-done').addEventListener('click', () => $('#sleep-guide-dialog').close());
    $('#sleep-review-structure').addEventListener('click', () => global.NeuroFlowWorkspace?.reviewStructure?.());
	$('#sleep-auto-stage').addEventListener('click', autoStage);
    $('#sleep-previous').addEventListener('click', () => selectEpoch(model.current - 1)); $('#sleep-next').addEventListener('click', () => selectEpoch(model.current + 1));
    $('#sleep-stage-buttons').addEventListener('click', event => { const button = event.target.closest('[data-stage]'); if (button) setStage(button.dataset.stage); });
    $('#sleep-clear-stage').addEventListener('click', clearStage);
    $('#sleep-artifact').addEventListener('change', event => { model.epochs[model.current].artifact = event.target.checked; persist(); render(); });
    $('#sleep-note').addEventListener('input', event => { model.epochs[model.current].note = event.target.value; persist(); });
    $('#sleep-export-json').addEventListener('click', () => exportFile('json')); $('#sleep-export-csv').addEventListener('click', () => exportFile('csv'));
    $('#sleep-hypnogram').addEventListener('click', event => { const box = event.currentTarget.getBoundingClientRect(); selectEpoch(Math.floor((event.clientX - box.left - 42) / Math.max(1, box.width - 54) * model.epochs.length)); });
    global.addEventListener('resize', () => { if (!$('#sleep-view').hidden) { drawHypnogram(); drawWaveform(model.waveform); } });
    document.addEventListener('keydown', event => { if ($('#sleep-view').hidden || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return; const map = {'0':'W','1':'N1','2':'N2','3':'N3','4':'REM'}; if (map[event.key]) setStage(map[event.key]); else if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); clearStage(); } else if (event.key.toLowerCase() === 'a') { model.epochs[model.current].artifact = !model.epochs[model.current].artifact; persist(); render(); } else if (event.key === 'ArrowLeft') selectEpoch(model.current - 1); else if (event.key === 'ArrowRight') selectEpoch(model.current + 1); });
    const observer = new MutationObserver(() => { if (!$('#sleep-view').hidden) load(); });
    observer.observe($('#file-name'), { childList: true, characterData: true, subtree: true });
    observer.observe($('.metadata'), { attributes: true, childList: true, characterData: true, subtree: true });
    document.addEventListener('neuroflow:localechange', translate);
	// Both the automatic button and a natural-language command in the shared
	// Agent arrive here after the outer workflow has produced real candidates.
	document.addEventListener('neuroflow:sleepstages', event => {
		const count = applyCandidates(event.detail.result, Boolean(event.detail.overwriteExisting));
		if (count) global.NeuroFlowWorkspace.notify(t('candidateApplied').replace('{count}', count));
	});
  }
  function configureAgent() {
	global.NeuroFlowWorkspace?.configureAgent?.(locale() === 'en' ? {
		context: 'Sleep scoring', placeholder: 'Ask about sleep staging or request automatic candidates…',
		suggestions: [{ prompt: 'Explain how to review sleep-stage candidates', label: 'Review candidates ↗' }, { prompt: 'Check whether this recording is suitable for automatic sleep staging', label: 'Check suitability ↗' }]
	} : {
		context: '睡眠标注', placeholder: '询问睡眠分期，或要求 Agent 自动生成候选标签…',
		suggestions: [{ prompt: '解释应该怎样复核睡眠分期候选标签', label: '复核候选标签 ↗' }, { prompt: '检查当前记录是否适合自动睡眠分期', label: '检查分期条件 ↗' }]
	});
	}
  function activate() {
	ensureView();
	configureAgent();
	load(); requestAnimationFrame(drawHypnogram);
  }
  function deactivate() {
	global.NeuroFlowWorkspace?.restoreAgent?.();
  }
  ensureView(); global.NeuroSleep = Object.freeze({ activate, deactivate, snapshot:()=>!datasetInfo()?.duration?{loaded:false,epoch_seconds:30,epochs:0}:({loaded:true,epoch_seconds:30,current_epoch:model.current+1,epochs:model.epochs.length,scored:model.epochs.filter(item=>item.stage).length,candidates:model.epochs.filter(item=>item.source==='agent_candidate'&&!item.reviewed).length,selected_epoch:model.epochs[model.current]?{start_seconds:model.current*30,duration_seconds:Math.max(0,Math.min(30,model.duration-model.current*30)),stage:model.epochs[model.current].stage||null,source:model.epochs[model.current].source,reviewed:model.epochs[model.current].reviewed,confidence:model.epochs[model.current].confidence,artifact:model.epochs[model.current].artifact}:null,capabilities:model.capabilities,event_counts:model.eventCounts,loading:model.loadingEpoch>=0}) });
})(window);
