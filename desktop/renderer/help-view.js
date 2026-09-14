(function createHelpView(global){
  const i18n=global.NeuroI18n;
  const sections={
    'zh-CN':[
      ['开始使用','① 在“连接设置”中选择连接 Go 后端。\n② 填写或导入 LLM 配置；打包版会加密保存 API Key。\n③ 导入 EEG、MEG 或 fNIRS 数据。\n④ 核对结构后选择处理步骤，再通过 Agent 或“运行流程”执行。'],
      ['模型与后端','API Base 必须是 OpenAI 兼容的 HTTP/HTTPS 地址。开发模式中，终端启动的 Go 后端需要在修改模型后手动重启；打包版随附后端由 Electron 自动管理。状态栏绿色表示后端已连接。'],
      ['导入数据','支持常见 MNE 文件、CSV、MAT、自定义二进制和 BIDS。导入期间会显示读取、结构解析和信号预览状态。CSV/MAT 的采样率、单位、矩阵方向或事件含义不确定时，必须先完成“数据结构确认”。原始文件不会复制或上传。'],
      ['使用 Agent','可以询问通道数、采样率、事件和数据质量，也可以描述研究目标并要求自动预处理。Agent 会先读取可信元数据，再调用受约束的 MNE 工具。即时回答适合简单问题；深度分析会检索知识并给出更完整的依据和步骤。'],
      ['预处理流程','步骤可以添加、删除、启用和排序。EEG 支持滤波、坏道、参考、ICA、Epoch、ERP、时频和解码；MEG 支持空房 SSP 与 SSS/tSSS；fNIRS 支持光密度、TDDR、Beer–Lambert 和滤波。审计记录中的 completed 才表示执行成功。'],
      ['信号与通道','原始/处理后标签用于切换真实波形。拖动时间轴或 Shift＋滚轮横向移动，＋/− 缩放时间窗口。点击某条信号或在下拉框选择通道可进入单通道视图并导出当前窗口 CSV。'],
      ['BIDS 与结果','数据管理页可浏览 BIDS recording。保存结果时会生成 FIF、审计 JSON、可复现 HTML 报告，并在条件满足时写入 BIDS Derivatives。不勾选保存时仍可查看本次抽稀预览，但不会生成预处理文件。'],
      ['常见问题','连接失败：确认 Go 后端、端口 8819、模型 API 和 Qdrant/Ollama 服务。\n解析失败：检查配套文件、编码、单位和采样率，并查看失败阶段。\nSSS 失败：检查 MEG 设备坐标与线圈信息。\n没有 ERP/解码：确认文件包含已解释的事件且 Epoch 数量足够。']
    ],
    en:[
      ['Getting started','1. Select the Go backend in Connection settings.\n2. Enter or import an LLM configuration; packaged builds encrypt the API key.\n3. Import EEG, MEG, or fNIRS data.\n4. Confirm its structure, choose steps, then run through the Agent or pipeline button.'],
      ['Model and backend','API Base must be an OpenAI-compatible HTTP/HTTPS endpoint. A terminal-launched development backend must be restarted after model changes; packaged backends are managed by Electron. A green status indicator means the backend is online.'],
      ['Importing data','Common MNE formats, CSV, MAT, custom binary, and BIDS are supported. The app reports file reading, structure parsing, and preview stages. Confirm uncertain CSV/MAT rates, units, orientation, and event meanings before execution. Raw files stay local.'],
      ['Using the Agent','Ask about channels, sampling rate, events, or quality, or describe a research goal and request preprocessing. The Agent reads verified metadata before invoking constrained MNE tools. Quick mode suits simple questions; Deep mode retrieves evidence and provides fuller steps.'],
      ['Preprocessing','Steps can be added, removed, enabled, and reordered. EEG supports filtering, bad channels, reference, ICA, epochs, ERP, TFR, and decoding; MEG supports empty-room SSP and SSS/tSSS; fNIRS supports optical density, TDDR, Beer–Lambert, and filtering. Only completed audit entries are successful.'],
      ['Signals and channels','Switch between real raw and processed traces. Drag the timeline or use Shift+wheel to pan; use +/− to zoom. Click a trace or choose a channel for a single-channel view and CSV export.'],
      ['BIDS and outputs','Browse BIDS recordings from Data management. Saved runs create FIF, audit JSON, reproducible HTML, and BIDS Derivatives when supported. With saving disabled, the returned preview remains visible but no processed file is created.'],
      ['Troubleshooting','Connection failure: check the Go backend, port 8819, model API, Qdrant, and Ollama.\nParse failure: inspect companion files, encoding, units, sampling rate, and the reported stage.\nSSS failure: verify MEG device coordinates and coils.\nNo ERP/decoding: verify interpreted events and enough retained epochs.']
    ]
  };
  function ensure(){
    if(document.querySelector('[data-view="help"]'))return;
    const button=document.createElement('button');button.className='nav-item';button.dataset.view='help';button.innerHTML='<span>?</span><span class="help-nav-label"></span>';document.querySelector('.nav-item[data-view="sessions"]').after(button);
    const view=document.createElement('section');view.id='help-view';view.className='card alternative-view help-view';view.hidden=true;document.querySelector('main').append(view);render();
  }
  function render(){
    ensure();const english=i18n.getLocale()==='en',view=document.querySelector('#help-view');document.querySelector('.help-nav-label').textContent=english?'User guide':'使用说明';
    view.replaceChildren();const head=document.createElement('div');head.className='help-heading';head.innerHTML=`<div><div class="eyebrow">NEUROFLOW GUIDE</div><h2>${english?'User guide':'软件使用说明'}</h2><p>${english?'An offline guide for importing, analyzing, and reviewing neural signals.':'无需联网即可查看的数据导入、Agent 分析与结果复核指南。'}</p></div><input id="help-search" type="search" placeholder="${english?'Search the guide':'搜索说明'}">`;view.append(head);
    const grid=document.createElement('div');grid.className='help-grid';for(const [title,body] of sections[english?'en':'zh-CN']){const article=document.createElement('article');article.dataset.search=`${title} ${body}`.toLowerCase();const h=document.createElement('h3');h.textContent=title;const p=document.createElement('p');p.textContent=body;article.append(h,p);grid.append(article);}view.append(grid);
    view.querySelector('#help-search').addEventListener('input',event=>{const query=event.target.value.trim().toLowerCase();grid.querySelectorAll('article').forEach(article=>article.hidden=Boolean(query&&!article.dataset.search.includes(query)));});
  }
  ensure();document.addEventListener('neuroflow:localechange',render);global.NeuroHelp=Object.freeze({render});
})(window);
