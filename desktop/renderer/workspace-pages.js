/* One chat composer and one preprocessing renderer, with explicit page state.
 * Reparenting keeps listeners, streamed messages and Markdown intact; copying
 * innerHTML would create duplicate element IDs and separate conversations.
 */
(function (global) {
  'use strict';
  const modes = {eeg:'EEG',meg:'MEG',fnirs:'fNIRS'};
  const main = document.querySelector('main');
  for (const page of Object.keys(modes)) {
    const section = document.createElement('section'); section.id = `${page}-view`; section.hidden = true;
    section.className = 'modality-page'; section.dataset.modality = modes[page]; main.append(section);
  }
  const layout = document.createElement('div'); layout.className = 'app-content';
  main.before(layout); layout.append(main);
  const dock = document.createElement('aside'); dock.id = 'global-agent-dock';
  dock.append(document.querySelector('.agent-column')); layout.append(dock);
  const toggle = document.createElement('button'); toggle.type = 'button'; toggle.id = 'toggle-global-agent';
  toggle.className = 'button light'; toggle.setAttribute('aria-controls', dock.id); toggle.setAttribute('aria-expanded', 'true');
  document.querySelector('.top-actions').prepend(toggle);
  toggle.onclick = () => { const closed = layout.classList.toggle('agent-collapsed'); toggle.setAttribute('aria-expanded', String(!closed)); translate(); };
  function translate() {
    const en = global.NeuroI18n?.getLocale() === 'en';
    toggle.textContent = layout.classList.contains('agent-collapsed') ? (en?'Show Agent':'展开 Agent') : (en?'Hide Agent':'收起 Agent');
    dock.setAttribute('aria-label', en?'Shared NeuroFlow Agent':'全局 NeuroFlow Agent');
  }
  function mount(page) {
    document.documentElement.dataset.workspace=page;
    global.NeuroTheme.refresh();
    // Legacy code can continue targeting #workspace-view. Only its parent page
    // changes; scientific data and parameters are restored by app.setMode().
    if (modes[page]) document.querySelector(`#${page}-view`).append(document.querySelector('#workspace-view'));
    if (document.querySelector('.agent-column').parentElement !== dock) dock.append(document.querySelector('.agent-column'));
  }
  function pageLabel(page) {
    const en = global.NeuroI18n?.getLocale() === 'en';
    const names = en ? {eeg:'EEG preprocessing',meg:'MEG preprocessing',fnirs:'fNIRS preprocessing',ppg:'PPG signals',sleep:'Sleep scoring',datasets:'Datasets',history:'Run history',sessions:'Conversations',help:'User guide'} : {eeg:'EEG 脑电预处理',meg:'MEG 脑磁预处理',fnirs:'fNIRS 近红外预处理',ppg:'PPG 信号处理',sleep:'睡眠标注',datasets:'数据管理',history:'运行记录',sessions:'长期对话',help:'使用说明'};
    return names[page] || page;
  }
  function context(page, dataset) {
    // This compact snapshot never contains a local path or raw waveform. Capture
    // it before sending so an async answer cannot acquire a different page's data.
    const value = {page, title:pageLabel(page), dataset_id:dataset?.datasetId || null};
    if (page === 'ppg') value.ppg = global.NeuroPPG?.snapshot?.() || {loaded:false};
    if (page === 'sleep') value.sleep = global.NeuroSleep?.snapshot?.() || {};
    if (page === 'help') value.help = {query:document.querySelector('#help-search')?.value || '',
      guide:[...document.querySelectorAll('#help-view article')].filter(node=>!node.hidden).map(node=>node.textContent).join('\n').slice(0,12000)};
    return value;
  }
  function configure(page) {
    const en = global.NeuroI18n?.getLocale() === 'en';
    const prompts = {
      ppg: en?['Analyze this PPG with the selected settings','Explain the current PPG result']:['按页面当前参数分析 PPG 信号','解释当前 PPG 分析结果'],
      sleep: en?['Generate sleep staging candidates','Explain the current sleep annotations']:['生成睡眠自动分期候选标签','解释当前睡眠标注结果'],
      datasets: en?['Inspect the selected dataset structure','What information is missing from this recording?']:['检查当前所选数据集的结构','这份数据还缺哪些采集信息？'],
      history: en?['Explain the latest run result','What should I review in the audit report?']:['解释最近的运行结果','审计报告中应该重点检查什么？'],
      sessions: en?['Summarize our research goal','What information should I provide next?']:['总结当前会话的研究目标','下一步需要补充哪些信息？'],
      help: en?['How do I import a recording?','Explain the workflow from import to export']:['如何导入并检查数据？','解释从数据导入到结果导出的操作流程']
    };
    const defaults = en?['Explain the current preprocessing pipeline','Inspect data quality']:['解释当前预处理流程','检查当前数据质量'];
    const suggestions = (prompts[page] || defaults).map(prompt => ({prompt,label:prompt}));
    global.NeuroFlowWorkspace?.configureAgent?.({context:pageLabel(page),placeholder:en?`Ask about ${pageLabel(page)}…`:`询问${pageLabel(page)}，或描述你想执行的操作…`,suggestions});
    // Existing i18n bindings must not overwrite a page-specific suggestion later.
    document.querySelectorAll('.suggestions [data-prompt]').forEach(node=>delete node.dataset.i18n);
    translate();
  }
  document.addEventListener('neuroflow:localechange',translate);
  global.NeuroPages = Object.freeze({modes,mount,pageLabel,context,configure}); translate();
})(window);
