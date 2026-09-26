/* Offline product guide. One bilingual definition per topic avoids append/override
 * drift. Keep topic IDs stable: the Agent uses help-<id> to explain a focused topic.
 * Add new features to their workflow chapter with steps and an observable result. */
(function (global) {
  'use strict';
  const pair = (zh, en) => ({zh, en});
  const paragraph = (zh, en) => ({type:'paragraph', text:pair(zh,en)});
  const list = (titleZh, titleEn, zh, en) => ({type:'list', title:pair(titleZh,titleEn), items:pair(zh,en)});
  const steps = (zh, en) => ({...list('操作步骤','Steps',zh,en), type:'steps'});
  const result = (zh, en) => ({type:'result', title:pair('如何确认成功','Check the result'), text:pair(zh,en)});
  const note = (zh, en) => ({type:'note', title:pair('使用边界','What this means'), text:pair(zh,en)});
  const example = (zh, en) => ({type:'example', title:pair('可以这样问 Agent','Example request'), text:pair(zh,en)});
  const code = (titleZh, titleEn, value) => ({type:'code', title:pair(titleZh,titleEn), text:pair(value,value)});
  const table = (headersZh, headersEn, rowsZh, rowsEn) => ({type:'table', headers:pair(headersZh,headersEn), rows:pair(rowsZh,rowsEn)});
  const topic = (id, group, titleZh, titleEn, summaryZh, summaryEn, blocks) => ({id,group,title:pair(titleZh,titleEn),summary:pair(summaryZh,summaryEn),blocks});

  const groups = [
    {id:'start',label:pair('开始使用','Get started')},
    {id:'data',label:pair('导入与检查','Import and inspect')},
    {id:'work',label:pair('分析与标注','Analyze and annotate')},
    {id:'results',label:pair('进度、结果与记录','Progress and results')},
    {id:'support',label:pair('排查与开发','Troubleshoot and develop')}
  ];
  const topics = [
    topic('overview','start','先选对工作页面','Choose a workspace',
      '从你的任务出发，找到对应页面和下一步。','Find the page and next action for your task.',[
      paragraph('NeuroFlow 将文件检查、信号处理、睡眠标注和对话集中在本地工作台中。右侧 Agent 随当前页面切换上下文；它可以解释参数、检查文件并调用已接入的工具。','NeuroFlow brings file inspection, signal processing, sleep scoring and conversation into a local workspace. The shared Agent follows the active page and can explain controls, inspect recordings and call available tools.'),
      table(['我想做什么','从哪里开始'],['My task','Start here'],[
        ['预处理 EEG、MEG 或 fNIRS','进入对应模态页面，导入并确认文件。'],['分析 PPG 脉搏信号','进入 PPG，检查文件并选择信号列。'],['标注睡眠阶段','进入睡眠标注，检查结构并查看 30 秒波形。'],['查文件、结果或历史对话','使用数据管理、运行记录或长期对话页面。']
      ],[
        ['Preprocess EEG, MEG or fNIRS','Open the matching page, import and confirm a recording.'],['Analyze optical pulse signals','Open PPG, inspect a file and select its signal column.'],['Score sleep stages','Open Sleep scoring, verify structure and inspect 30-second traces.'],['Review files, results or conversations','Use Datasets, Run history or Conversations.']
      ]),
      note('文件卡片显示的是读取结果；流程中勾选的是待执行步骤；聊天中的建议是文字。判断是否真正完成分析，要核对工具记录、步骤状态和结果产物。','File cards show inspection results; selected pipeline steps describe intended work; chat recommendations are text. Verify tool records, step states and artifacts to establish what actually ran.')
    ]),
    topic('first','start','第一次打开软件','First launch',
      '先连接服务，再用一个小文件验证完整流程。','Connect services, then validate the workflow with a small recording.',[
      steps([
        '启动 Electron。若使用开发版，先启动项目配置的 Qdrant、embedding 服务和 Go 后端；具体命令见“开发启动与自动重载”。带有随包后端的安装包会尝试由 Electron 启动后端。',
        '打开右上角连接设置，选择“连接 Go 后端”，核对后端地址；本地默认端口为 8819。“本地演示回复”不会请求真实模型。',
        '按下一章配置模型，检查后端应用状态，再分别测试模型能力与后端 Agent。',
        '进入目标信号页面，导入一个来源清楚的小文件，完成结构确认并检查真实波形。'
      ],[
        'Open Electron. In development, start the configured Qdrant, embedding service and Go backend first; see Development and reload. An installation containing a bundled backend lets Electron attempt to launch it.',
        'Open Connection settings at the top right, choose the Go backend and verify its address (local default port 8819). Local demo responses do not contact a real model.',
        'Configure the model in the next chapter, check backend application status, then test provider capabilities and the backend Agent separately.',
        'Open the relevant signal page, import a small recording of known provenance, confirm its structure and inspect the real trace.'
      ]),
      result('后端显示在线、模型配置已核对、文件能显示真实通道和波形，是三个独立检查。Go 在线不代表模型额度充足，也不代表 Python 算法依赖已经齐全。','Backend online, verified model settings, and a real recording preview are three separate checks. An online Go service does not establish provider quota or complete Python dependencies.'),
      note('只打开浏览器页面可以查看说明和演示；本地文件选择、密钥加密配置等能力需要 Electron。安装包是否能独立运行，取决于是否包含后端和算法环境。','A browser can show the guide and demo. Local file selection and encrypted model settings require Electron. Standalone operation depends on whether the package includes the backend and algorithm environment.')
    ]),
    topic('llm','start','配置模型并验证生效','Configure and verify the model',
      '分清已保存、已应用和实测通过这三种状态。','Distinguish saved settings, applied settings and a passing live test.',[
      steps([
        '打开连接设置，填写服务商、API Base、Model、API Key 和 Max tokens。API Base 使用纯 URL，不要粘贴 Markdown 链接；Model 使用服务商实际提供的模型 ID。也可“导入并保存 JSON 配置”。',
        '已有密钥时，空输入框表示保留。输入新值会替换；“删除已保存密钥”可在保存前撤销，保存后清除 Electron 的密钥并停用后端的新模型请求。显示按钮只显示刚输入的新密钥。',
        '点击“测试模型能力（真实请求）”。它会发送最多 5 个请求，分别检查连接、当前随机性参数、SSE 流式、工具参数和结构化输出；测试可能消耗额度。',
        '点击“保存、核对并应用”。查看后端实际模型、服务地址、输出上限、随机性是否发送，以及配置版本。“已保存”本身不能证明后端切换成功。',
        '选择即时或深度模式，点击“测试后端 Agent”。它使用已生效模型和现有 Eino Agent，实际调用只读组件工具，再核验模型是否使用了工具返回值。'
      ],[
        'Open Connection settings and enter provider, API Base, Model, API Key and Max tokens. Use a plain URL, not a Markdown link, and the provider’s actual model ID. You can also Import & save JSON configuration.',
        'A blank input keeps an existing key. Type to replace it, or use Remove saved key; removal can be undone before saving. Saving removal clears the Electron key and disables new backend model requests. Show new key only reveals newly typed text.',
        'Run Test provider capabilities (live). Up to 5 requests check connection, the selected temperature, SSE streaming, tool arguments and structured output. Tests may consume credits.',
        'Use Save, verify & apply. Check the active backend model, endpoint, token limit, whether temperature is sent, and revision. Saved alone does not prove a backend update.',
        'Choose Quick or Deep and Test backend Agent. The active model and existing Eino Agent call a real read-only component tool; the response must use its returned value.'
      ]),
      table(['状态','能说明什么'],['State','What it establishes'],[
        ['已加密保存','Electron 已保存配置；还需检查后端应用结果。'],['后端已核对','当前模型入口已切换；新请求使用新配置。'],['模型能力通过','这些服务商请求在测试时成功，不保证后续不限流。'],['后端 Agent 通过','测试的模型与只读工具往返成功，不代表所有科学算法均已验证。']
      ],[
        ['Saved encrypted','Electron saved the configuration; inspect backend application status.'],['Backend verified','Model consumers switched; new requests use the new settings.'],['Provider probe passed','Those requests succeeded at test time; future rate limits remain possible.'],['Backend Agent passed','The tested model/tool round trip succeeded; this does not validate all scientific algorithms.']
      ]),
      note('Max tokens 是单次生成上限，不是上下文或长期记忆容量。随机性只有在当前配置实测接受后才发送；修改模型、密钥或参数需重新检测。两种回答模式共用这些设置。正在执行的请求保留原配置，下一轮才使用新配置。','Max tokens limits a generated response, not context or long-term memory. Temperature is sent only after this configuration accepts it; changed models, keys or parameters need a new probe. Both response modes share these settings. In-flight requests keep their original configuration.'),
      paragraph('运行时设置只应用到本机 Go 后端，不改写独立的 config/config.json。Go 单独启动时读取文件和环境变量，Electron 连接或发送消息前再应用其加密保存配置。首次升级运行时设置功能，需要重启 Go 和 Electron。','Runtime settings apply to a local Go backend and do not rewrite config/config.json. Go starts with file/environment settings; Electron reapplies its encrypted settings on connection or before chat. First upgrading runtime settings requires restarting Go and Electron.')
    ]),
    topic('quickstart','start','完成第一次 EEG 分析','Your first EEG analysis',
      '先检查输入，再执行小范围任务，最后核对结果。','Inspect the input, execute a bounded task, then verify the result.',[
      steps([
        '进入 EEG 脑电预处理页面，导入文件，确认采样率、单位和通道类型。先在信号预览中查看一段真实波形。',
        '让 Agent 只检查文件事实，核对返回的通道数、时长和事件是否与设备信息一致。',
        '说明研究目标、工频及保存要求。缺失字段按提示补充，并查看验证结果；不要只回答“确认”。',
        '先运行质量检查。需要预处理时，再明确提出要执行的步骤，或让 Agent 根据检查结果选择可执行流程。',
        '查看工具和步骤状态，再比较同一通道、同一时间段的处理前后结果。需要保存时检查输出记录中的实际文件。'
      ],[
        'Open EEG preprocessing, import a recording, and confirm rate, units and channel types. Inspect a real trace in Signal preview first.',
        'Ask the Agent to inspect file facts only. Check channels, duration and events against acquisition information.',
        'State the research goal, mains frequency and saving preference. Answer missing fields with values and provenance, then review validation; avoid only saying “confirmed”.',
        'Start with quality inspection. When ready, explicitly request preprocessing steps or ask the Agent to choose an executable pipeline from the findings.',
        'Check tool and step states, then compare matching channels and time intervals before/after processing. Verify actual output files when saving is requested.'
      ]),
      example('先检查这个文件的采样率、通道类型、单位和事件，不执行预处理。','Inspect this recording’s rate, channel types, units and events without preprocessing.'),
      example('根据已经确认的数据结构执行预处理，不保存处理文件；说明实际完成、跳过的步骤以及质量比较。','Preprocess using the confirmed structure without saving processed files. Report completed/skipped steps and quality comparisons.'),
      result('聊天记录中能找到实际工具执行，页面有对应分析结果，且步骤状态与保存记录一致。若只得到计划或文字建议，尚不能认为预处理完成。','There is actual tool execution, a matching analysis result, and consistent step/saving records. A plan or recommendation alone does not establish completed preprocessing.')
    ]),
    topic('import','data','导入记录和外部标签','Import recordings and event labels',
      '保留配套文件，并核对事件的时间单位和采样点起点。','Keep companion files and verify event timing and sample indexing.',[
      steps([
        '先进入 EEG、MEG、fNIRS 或睡眠页面，再选择记录。PPG 使用自己的“检查文件”入口。EDF/BDF/GDF、FIF、BrainVision、EEGLAB、SNIRF、CSV/TSV、MAT 等能否读取，以解析结果和安装的依赖为准。',
        '等待读取、结构解析和真实预览完成。BrainVision 的 VHDR/VMRK/EEG、EEGLAB 的 SET/FDT 等配套文件应保留原有相对位置。BIDS 数据可从“浏览 BIDS”选择记录。',
        '核对通道数、采样率、时长和格式。若出现结构确认窗口，先完成下一章的检查，再开始处理。',
        '需要事件标签时点击“导入标签”，选择 CSV、TSV 或 JSON；有配套同名事件文件时可检查自动匹配结果。确认秒数或采样点，并选择零基或一基起点。',
        '查看重复、重叠和类别名称提示。用“编辑”逐条修正，或用“删除”移除外部标签；修改标签后重新运行依赖事件的分析。'
      ],[
        'Open EEG, MEG, fNIRS or Sleep before choosing a recording. PPG has its own Inspect file action. Readability of EDF/BDF/GDF, FIF, BrainVision, EEGLAB, SNIRF, CSV/TSV, MAT and other formats depends on parsing results and installed readers.',
        'Wait for reading, structure parsing and real preview. Keep companion files such as VHDR/VMRK/EEG and SET/FDT in their relative locations. Use Browse BIDS to select a BIDS recording.',
        'Check channel count, rate, duration and format. Complete the next chapter’s structure checks if a confirmation dialog appears.',
        'Use Import labels for CSV, TSV or JSON events; review automatic matching when a matching event file exists. Confirm seconds versus samples and zero- versus one-based indexing.',
        'Review duplicate, overlap and class-name messages. Edit individual events or Delete imported labels. Rerun event-dependent analysis after label changes.'
      ]),
      code('秒数格式示例','Example using seconds','onset,duration,label\n1.2,0,target\n2.4,0,standard'),
      paragraph('采样点格式可使用 sample,label。例如 250 Hz 下 sample=251，一基起点对应 1 秒，零基起点对应 1.004 秒；起点选择会影响事件对齐。','A sample-based file can use sample,label. At 250 Hz, sample=251 is 1 second with one-based indexing and 1.004 seconds with zero-based indexing. The choice affects event alignment.'),
      result('验证后的标签进入记录的事件/Annotations，波形可显示事件标记。删除外部标签不会删除信号文件或原生 annotations；仍应检查原生和外部事件是否正确去重。','Validated labels become events/annotations with markers on the waveform. Deleting imported labels preserves signal files and native annotations; still inspect duplicate handling between native and imported events.')
    ]),
    topic('structured','data','确认 CSV、MAT 和通道结构','Confirm CSV, MAT and channel structure',
      '自动识别提供候选解释，需要用采集信息验证。','Automatic detection proposes a structure; verify it against acquisition facts.',[
      steps([
        '在结构确认页面核对信号矩阵和方向。CSV 中时间、事件、设备状态列不能误当成 EEG；MAT 中要选择正确的数据变量。复合采集导出需核对本次读入的是哪条数据流。',
        '检查采样率与时间戳单位。设备标称值和时间戳估算冲突时，提供设备说明、丢包或重采样信息；不能只为了通过验证随意修改数值。',
        '逐通道编辑名称、类型，标记参考通道，排除无关列，核对 nV/µV/mV/V 和单位换算后的振幅范围。',
        '匹配 montage 并查看电极布局；没有坐标时的示意排布不能作为真实空间位置或插值依据。事件字典也需要确认含义。',
        '使用重新试读/验证并确认，检查变化后的通道数、时长和波形。确认无误后，可将设备导入设置保存为模板供同类文件复用。'
      ],[
        'Check the signal matrix and orientation in structure review. Time, event and device-status columns must not become EEG channels. Select the correct MAT variable; verify which stream is imported from a mixed acquisition export.',
        'Check sampling rate and timestamp units. When nominal and estimated rates conflict, provide device, packet-loss or resampling information instead of choosing an arbitrary value to pass validation.',
        'Edit names and types per channel, mark reference channels, exclude unrelated columns, and review nV/µV/mV/V plus converted amplitude ranges.',
        'Match a montage and inspect the electrode layout. A fallback schematic without coordinates is not measured geometry or a basis for interpolation. Confirm event meanings too.',
        'Reread/validate and confirm, then inspect updated channels, duration and traces. Save verified device import settings as a template for similar files if useful.'
      ]),
      result('试读结果与采集信息一致，冲突已解释并通过验证。置信度分数是解析线索，不代表信号质量或科学结论已验证。','The reread agrees with acquisition facts, and conflicts are resolved through validation. Structure confidence is a parsing clue, not a signal-quality or scientific-validity score.'),
      example('这是两路 EEG，设备标称 250 Hz，时间列单位为毫秒，原始电压单位为 nV。请核对这些信息与文件是否一致，冲突时先说明。','This is two-channel EEG, nominally 250 Hz, with millisecond timestamps and nV amplitudes. Check these claims against the file and explain any conflicts first.')
    ]),
    topic('signal','data','查看真实波形与单通道','Inspect real signals and channels',
      '先确认数据来源，再移动时间窗、缩放和比较。','Check the signal source before navigating, zooming or comparing.',[
      steps([
        '确认已经导入并读取记录。空工作台的示意波形不是文件数据；查看当前来源是原始还是处理后。',
        '拖动时间轴、使用左右导航或 Shift＋鼠标滚轮移动时间窗；使用 ＋/− 改变时间跨度。到达记录边界或采样分辨率时，相应操作会受限。',
        '从通道选择器、波形或电极布局选择单通道，查看当前窗口的最小值、最大值、均值和 RMS；按需导出该窗口 CSV。',
        '比较处理效果时保持相同通道、时间范围及数据来源说明，并结合质量指标和步骤记录查看。'
      ],[
        'Confirm a recording was imported and read. Empty-workspace example traces are not file data. Check whether the source is Raw or Processed.',
        'Drag the timeline, use navigation controls or Shift+wheel to move the window; use +/− to change its duration. Record boundaries and sample resolution limit available movement/zoom.',
        'Select one channel using the selector, trace or electrode layout. Inspect minimum, maximum, mean and RMS for the displayed window, and export that window as CSV if needed.',
        'Compare matching channels and intervals with clearly identified sources, together with quality metrics and step records.'
      ]),
      note('总览会抽稀以保持交互流畅，导出当前窗口不等于导出完整记录。未保存完整处理文件时，可浏览的处理后范围以实际返回预览为准；界面缩放不会改变原始采样率。','Overview traces are downsampled for responsiveness; exporting a window is not a full-recording export. Without a saved processed recording, available processed navigation depends on returned previews. Display zoom does not change the original sampling rate.')
    ]),
    topic('agent','work','向 Agent 提出可执行请求','Ask the Agent to act',
      '说明对象、目标和保存要求，再依据真实反馈继续。','State the input, objective and saving preference, then follow actual feedback.',[
      steps([
        '确认右侧 Agent 显示的是当前页面，以及本次要处理的数据集。所有页面共用对话入口，但文件和操作范围由当前页面决定。',
        '明确区分“解释/给方案”和“执行”。需要处理时说明研究目标、已知采集信息、需要保留的信号特征及是否保存。',
        '收到待确认字段时，提供具体值及来源。工具反馈不足或有冲突时继续核对，不把历史会话里的旧文件信息当作本轮事实。',
        '查看执行记录和结果。数据管理、运行记录页可查询并对已选数据做只读诊断；完整处理在相应信号页面执行。'
      ],[
        'Verify the Agent’s page context and selected dataset. All pages share the conversation UI, but the current page determines the input and permitted operations.',
        'Distinguish explaining/planning from executing. For processing, state the research objective, known acquisition facts, signal features to preserve and saving preference.',
        'Answer pending fields with values and provenance. Resolve tool conflicts instead of treating old conversation data as current file facts.',
        'Review execution records and results. Datasets and Run history allow questions and read-only diagnostics on selected data; run full processing from the relevant signal page.'
      ]),
      table(['模式','适合的任务','实际差别'],['Mode','Useful for','Behavior'],[
        ['即时回答','文件事实、组件解释、简单操作','简单问题可跳过自动检索；其他问题通常一轮，初始证据最多 3 条。'],['深度分析','复杂方案、证据比较、多步骤处理','非简单问题执行主问题与约束两轮检索，最多合并 8 条初始证据，并核对引用来源。']
      ],[
        ['Quick','File facts, component help, simple actions','Simple questions can skip automatic retrieval; other questions usually start with one search and up to 3 documents.'],['Deep','Complex plans, evidence comparison, multistep work','Nontrivial questions get primary and constraint searches, up to 8 initial documents, and citation-source checks.']
      ]),
      note('两种模式共用模型、权限、记忆和保存规则，不自动更换模型或提高 temperature，也不等于打开服务商的原生 reasoning_effort。ReAct 图步骤预算为 12/30，包含模型与工具节点，并非允许调用工具 12/30 次。','Both modes share the model, permissions, memory and saving rules. They do not automatically change model, temperature or native reasoning_effort. The 12/30 ReAct graph-step budgets count model and tool nodes, not 12/30 tool calls.'),
      example('先检查这份 EEG 的数据质量，再给出适合当前研究目标的预处理方案；本轮先不执行滤波，也不保存处理文件。','Inspect EEG quality and propose preprocessing for the current research goal. Do not filter or save processed files in this turn.')
    ]),
    topic('components','work','询问某个按钮、图或参数','Ask about a control or plot',
      '让“这个参数”指向明确的界面对象。','Make “this parameter” refer to a specific interface component.',[
      steps([
        '点击组件或参数后，查看 Agent 区域的“关注”目标。也可以先点“选择组件”，再点目标；此时只选择，不触发按钮操作，Esc 可退出。',
        '点击“解释此组件”，或直接提出具体问题。弹窗内有解释入口时，也可从那里提问。',
        '要运行处理时，回到对应信号页面提出明确执行要求；只读解释不会授权分析或修改。'
      ],[
        'Click a component/parameter and check the focused target in the Agent area. Alternatively use Select component first; selection does not trigger its action, and Escape exits.',
        'Choose Explain component or ask a specific question. Use the explanation entry in a dialog when available.',
        'For processing, make an explicit execution request in the relevant signal page; read-only explanation does not authorize analysis or changes.'
      ]),
      result('Agent 可以获得已注册组件的名称、选中参数、通道或时间范围。当前说明章节也可作为关注对象。','The Agent can receive a registered component’s name, selected parameters, channels or time range. A guide chapter can also be the focused component.'),
      note('组件上下文在每轮请求时采集，不是截图，也不是 RAG 知识库内容。Agent 不会看到所有屏幕细节，不能任意点击全部按钮；界面状态也不是算法已执行的证据。','Component context is captured per request; it is neither a screenshot nor RAG knowledge. The Agent cannot see every screen detail or freely click every control. UI state is not evidence of executed analysis.')
    ]),
    topic('eeg','work','组织 EEG 预处理与分析','Build an EEG pipeline',
      '按研究目标添加步骤，检查前提和执行结果。','Choose steps for the research goal and inspect prerequisites and outcomes.',[
      steps([
        '在 EEG 页面完成文件确认和质量检查，再从步骤库添加、移除或启用步骤，检查各步参数。也可向 Agent 描述目标，由其调用已有工具。',
        '可用步骤包括坏道检测/插值、陷波、带通、重参考、ICA、重采样、事件分段、基线校正和 Epoch 伪迹拒绝。通道位置、参考信息、足够数据或有效事件等前提不满足时，查看具体提示。',
        '需要 ERP/GFP、Morlet 时频或 CSP＋LDA 解码时，先确认事件字典、Epoch 窗口和每类试次数，再选择分析产物。',
        '运行后复核每一步是否完成、跳过、降级或失败，结合质量对比和输出记录确认效果。'
      ],[
        'Confirm the recording and inspect quality on EEG, then add, remove or enable steps from the library and review parameters. You can also describe the goal to the Agent for tool execution.',
        'Available steps include bad-channel detection/interpolation, notch, bandpass, rereferencing, ICA, resampling, epoching, baseline correction and epoch rejection. Inspect messages when prerequisites such as geometry, reference information, adequate data or valid events are missing.',
        'For ERP/GFP, Morlet time-frequency or CSP+LDA decoding, first confirm event meanings, epoch windows and trials per class, then choose analysis products.',
        'Review completed, skipped, degraded and failed steps alongside quality comparisons and actual artifacts.'
      ]),
      note('界面顺序表达计划，真实执行还会依据算法依赖安排顺序并记录。自动参数搜索只覆盖已实现的候选策略，不是无限试错。记录内交叉验证不能直接证明跨会话或跨被试泛化。','UI order describes the plan; execution also respects algorithm dependencies and records its order. Automatic search is limited to implemented candidate policies. Within-recording cross-validation does not establish cross-session or cross-subject generalization.'),
      result('步骤审计能解释哪些方法实际运行、用了什么参数、为什么跳过或回退。质量分数应与波形和任务需求一起判断，不以分数上升单独认定处理正确。','The audit explains which methods ran, their parameters and reasons for skips/fallbacks. Interpret quality scores with traces and the research task; a score increase alone does not establish correct processing.')
    ]),
    topic('other','work','处理 MEG 与 fNIRS','Process MEG and fNIRS',
      '使用各自页面，先核对模态特有的输入条件。','Use the separate pages and verify modality-specific requirements.',[
      list('MEG 页面','MEG workspace',[
        '导入并核对传感器类型、设备坐标、头位变换和线圈信息；需要环境噪声处理时准备兼容的空房记录。',
        '根据目标选择空房 SSP、Maxwell/SSS/tSSS、陷波和带通等已接入方法。缺少几何信息时不能靠普通 EEG montage 替代。',
        '运行后查看审计中的方法、时间窗、投影及降级原因，确认期望的噪声处理是否真正执行。'
      ],[
        'Inspect sensor types, device coordinates, head transforms and coils; provide compatible empty-room data for environmental-noise processing.',
        'Choose integrated methods such as empty-room SSP, Maxwell/SSS/tSSS, notch or bandpass as appropriate. An EEG montage cannot replace missing MEG geometry.',
        'Review methods, windows, projections and fallback reasons to establish which noise processing actually ran.'
      ]),
      list('fNIRS 页面','fNIRS workspace',[
        '确认输入是光强、光密度还是血红蛋白浓度，并核对波长和源—探测器信息。复合 CSV 中的数值列不一定具备完整测量元数据。',
        '已有流程包括光强转光密度、TDDR 运动校正、Beer–Lambert 转换和滤波；根据当前数据表示及必要元数据选择步骤。',
        '检查 HbO/HbR 等输出的类型、单位和步骤记录；缺少必要输入时按提示补充，不能把失败或降级当作完整转换。'
      ],[
        'Confirm whether input represents intensity, optical density or hemoglobin concentration, and verify wavelengths and source-detector information. Numeric columns in mixed CSV may lack measurement metadata.',
        'Integrated operations include intensity-to-optical-density conversion, TDDR, Beer–Lambert conversion and filtering. Select them according to the current representation and required metadata.',
        'Check output types such as HbO/HbR, units and step records. Supply missing inputs; failed or degraded execution is not a completed conversion.'
      ]),
      result('当前模态、数据表示及执行步骤一致，结果说明中能看到实际方法与限制。','The active modality, data representation and executed steps agree, with actual methods and limitations in the result.')
    ]),
    topic('ppg','work','分析 PPG 脉搏信号','Analyze PPG signals',
      '显式选择信号列，再检查脉搏峰与心率曲线。','Select the signal column explicitly, then inspect peaks and heart rate.',[
      steps([
        '进入 PPG 信号处理页面，选择有列名的 CSV/TSV/TXT 或支持的 EDF/BDF/FIF/GDF，然后点击“检查文件”。',
        '选择真实 PPG 列及时间列。数值时间支持秒或毫秒；没有时间列时填写采样率。时间不均匀或采样率冲突要先修正。',
        '设置起点与 10–600 秒分析区间，再点“运行 PPG 分析”或让 Agent 按页面参数分析。需要时反转极性；参数修改后要重新运行。',
        '核对清洗曲线上的峰点，复核运动干扰、误检和漏检，再导出分析 JSON 或脉搏峰 CSV。'
      ],[
        'Open PPG, choose CSV/TSV/TXT with headers or supported EDF/BDF/FIF/GDF, then Inspect file.',
        'Select the PPG and time columns. Numeric timestamps support seconds or milliseconds; enter a rate if no time column exists. Resolve irregular timing or rate conflicts first.',
        'Set the start and a 10–600 second interval, then Run PPG analysis or ask the Agent to use the page settings. Invert polarity if needed and rerun after parameter changes.',
        'Inspect peaks on the cleaned trace, review motion interference and false/missed peaks, then export analysis JSON or pulse-peak CSV.'
      ]),
      example('按 PPG 页面当前参数分析这段信号，解释脉搏峰数、心率曲线以及需要复核的异常。','Analyze PPG with the current page settings and explain peak count, heart rate and findings that need review.'),
      note('当前使用 NeuroKit2 的 Elgendi 清洗和峰检测，心率由相邻脉搏峰间隔计算。本页不输出 SpO₂ 或 ECG HRV。幅值保留源单位，两条曲线分别缩放；结果不会因画得更平滑就自动变得更可靠。','The current engine uses NeuroKit2 Elgendi cleaning and peak detection; heart rate comes from adjacent pulse intervals. This page does not output SpO₂ or ECG HRV. Amplitudes retain source units and traces have separate scales; smoother plots do not establish better validity.')
    ]),
    topic('sleep','work','人工标注与 Agent 睡眠候选','Score sleep and review Agent candidates',
      '根据真实 30 秒波形标注，保留人工复核状态。','Score real 30-second traces and preserve human-review status.',[
      steps([
        '进入睡眠标注页面导入记录，查看数据格式检查。确认采样率、单位和 EEG/EOG/EMG 类型；结构未确认时先验证。',
        '从 Epoch 队列或睡眠图选择一段，等待当前真实波形显示。最后不足 30 秒的一段按实际时长检查。',
        '用 W/N1/N2/N3/REM 按钮或数字键 0–4 标注。再次点已选阶段、点“清除当前标签”或按 Delete/Backspace 可取消误标；A 标记伪迹，左右键切段。',
        '点击“Agent 自动候选标注”或在本页提出生成候选的要求。需要覆盖已有标签时明确说明；生成后逐段复核，人工选择阶段会记录确认状态。',
        '检查未标注段、阶段变化、伪迹及备注，再导出 JSON/CSV。自动保存在本机不等于已生成可分享的导出文件。'
      ],[
        'Import a recording in Sleep scoring and inspect format checks. Confirm rate, units and EEG/EOG/EMG types; resolve structure questions first.',
        'Choose an epoch from the queue or hypnogram and wait for its real trace. Review a final partial epoch at its actual duration.',
        'Use W/N1/N2/N3/REM or keys 0–4. Click the selected stage again, Clear current label, or Delete/Backspace to remove it. A marks artifacts; arrow keys navigate.',
        'Use Agent candidate scoring or request candidates in this page. Explicitly state if existing labels should be overwritten. Review each epoch; manual stage selection records human confirmation.',
        'Review unscored epochs, transitions, artifacts and notes, then export JSON/CSV. Local autosave is not a standalone file for sharing.'
      ]),
      result('波形、Epoch 起止时间、标签来源和复核状态一致。导出时保留候选来源、置信度、复核状态和备注。','Traces, epoch timing, label provenance and review state agree. Exports retain candidate source, confidence, review status and notes.'),
      note('检测器根据实际模态启用：EEG 可提供纺锤波、K-complex 等候选；EOG/EMG 支持相应眼动和肌张力分析。缺少模态时相关能力关闭或降级。当前候选是规则辅助结果，未完整实现或临床验证全部 AASM 规则，置信度也不是金标准。','Detectors follow available modalities: EEG provides candidates such as spindles and K-complexes; EOG/EMG enable relevant eye-movement and muscle-tone analyses. Missing modalities disable or limit these capabilities. Current candidates are rule-assisted, not a complete, clinically validated implementation of all AASM rules; confidence is not a gold standard.')
    ]),
    topic('streaming','results','读懂执行过程与流式回复','Read execution and streaming status',
      '等待模型、执行工具和完成整个任务是不同状态。','Waiting for a model, completing a tool and finishing a task are different states.',[
      table(['看到的提示','实际含义'],['Visible state','Meaning'],[
        ['加载上下文／等待模型','正在准备请求或等待服务商；不表示滤波已开始。'],['工具运行／完成／失败','对应真实工具事件；某个查询完成，不代表整个分析完成。'],['补查证据并修正回答','核验发现不一致，进行一次受限修正；不是重新授权执行分析。'],['同步结果与图表','正在读取实际产物并更新界面；等待结束或停止后再切换任务。'],['中断／失败','本轮没有正常结束；已完成的操作仍以工具记录为准。']
      ],[
        ['Loading context / waiting for model','Preparing the request or waiting for the provider; filtering has not necessarily started.'],['Tool running / completed / failed','Actual tool events; a finished query is not a finished analysis.'],['Checking evidence and correcting answer','A bounded correction after verification; not renewed permission to process data.'],['Synchronizing results and plots','Fetching actual results into the UI; wait or stop before switching tasks.'],['Interrupted / failed','The turn did not finish normally; existing tool records still describe completed work.']
      ]),
      paragraph('正文可以增量显示，结束时会核验执行性陈述；修正后的最终回答可能替换草稿。当前修正最多一次，限 45 秒和额外 8 个图步骤，仅可做已有结果和证据查询，不重跑分析。','Text can arrive incrementally and execution claims are verified at the end; a corrected final answer may replace the draft. Current correction is limited to one attempt, 45 seconds and 8 additional graph steps, with evidence/existing-result reads rather than repeated analysis.'),
      note('执行面板展示后端事件与耗时，不是模型隐藏思维链。点击停止会取消当前请求，但不会回滚已经完成的文件写入。服务商若只发一个大块，界面不能凭空生成真实 token 流。','The panel shows backend events and elapsed time, not private model reasoning. Stop cancels the current request but does not roll back completed file writes. A provider sending one large chunk cannot be turned into genuine upstream token streaming by the UI.')
    ]),
    topic('tasks','results','补充信息、恢复任务与批处理','Clarify, resume and batch tasks',
      '按持久化任务状态继续，避免重复执行。','Continue from persisted task state and avoid duplicate processing.',[
      steps([
        '任务等待确认时，查看待确认字段、已提交回答和验证结果。补充具体值及来源，再按提示继续。',
        '恢复任务前检查当前数据集是否仍有效、文件是否移动或修改，以及已完成的步骤；不要把恢复理解成从头重跑。',
        '失败时先看最后有效步骤及错误。只修改与错误相关的参数；已实现的重试和候选搜索有明确范围，不能修复所有问题。',
        '批量分析中选择同一模态的数据集，核对当前流程与保存选项，再启动队列。逐条查看结果；暂停、恢复/重试不会把先前失败改成成功。'
      ],[
        'For waiting tasks, inspect pending fields, submitted answers and validation results. Supply specific values and provenance, then continue as directed.',
        'Before resuming, check dataset validity, moved/changed files and completed steps. Resuming does not necessarily mean restarting from the beginning.',
        'On failure, inspect the last valid step and error before changing related parameters. Implemented retries and candidate search are bounded and cannot fix every problem.',
        'For a batch, select datasets of one modality and verify the current pipeline and saving option before starting. Inspect each item; pause/resume/retry does not turn a previous failure into success.'
      ]),
      table(['状态','如何处理'],['State','What to do'],[
        ['等待确认','补充并验证缺失信息。'],['skipped','该步骤未执行，查看是否属于必要步骤。'],['degraded','使用了回退或受限处理，查看限制。'],['failed / interrupted','定位失败位置，检查已有结果后再恢复。'],['completed','核对任务结果和各步骤，不只看一个工具完成事件。']
      ],[
        ['Waiting','Supply and validate missing information.'],['skipped','The step did not run; check whether it was required.'],['degraded','A fallback or limited method was used; read the limitation.'],['failed / interrupted','Locate the failure and inspect existing results before resuming.'],['completed','Verify the task result and individual steps, not a single tool event.']
      ]),
      note('任务状态和聊天消息会持久化，但重新打开历史会话并不恢复当时所有实时动画或流式事件。重启后应以恢复面板和实际产物为准。','Tasks and messages persist, but reopening conversation history does not recreate every live animation or streaming event. Use restored task state and actual artifacts after restarting.')
    ]),
    topic('outputs','results','核对保存、报告与 BIDS','Verify saved outputs, reports and BIDS',
      '把处理结果、流程配置和标签导出分开核对。','Check processed signals, pipeline settings and label exports separately.',[
      steps([
        '执行前明确是否保存处理文件。普通 full 分析默认可能保存；只读质量/摘要检查不导出处理文件。手动运行和批处理也要核对各自保存选项。',
        '执行后检查 output.saved 和输出记录，按实际列出的路径查看 FIF、Epoch、审计 JSON 或 HTML 报告；不同模态和分析不一定生成相同文件。',
        '比较同一记录的前后质量和步骤状态，保留数据指纹、参数、软件版本等审计信息。导出流程配置不等于导出处理后的信号。',
        '处理 BIDS 时先浏览并选中 recording，核对 subject/session/task/run。符合写入条件时查看 outputs 中的 BIDS Derivatives 和审计；目录出现本身不能证明导出完整。'
      ],[
        'Specify whether to save processed files before execution. Full analysis may save by default; read-only quality/summary checks do not export processed files. Review saving options for manual and batch runs too.',
        'Check output.saved and actual output records, then inspect listed FIF, epochs, audit JSON or HTML files. Different modalities/analyses do not necessarily produce identical artifacts.',
        'Compare before/after quality and step states for the same recording; retain fingerprints, parameters and software versions. Exporting pipeline configuration is not exporting processed signals.',
        'For BIDS, browse/select a recording and verify subject/session/task/run. When writing is supported, review BIDS Derivatives under outputs and the audit; a directory alone does not prove a complete export.'
      ]),
      note('“不保存处理文件”不等于关闭会话、任务状态或睡眠标签的本机保存。没有导出完整处理文件时，不能假定事后能恢复全部处理后波形；需要保存时明确提出请求并核对实际产物。','“Do not save processed files” does not disable local conversations, task state or sleep labels. Without a full processed export, do not assume all processed traces can be restored later; explicitly request saving and verify the artifacts.')
    ]),
    topic('memory','results','管理长期对话和数据集','Manage conversations and datasets',
      '让同一个研究任务持续，同时防止旧数据混入新任务。','Keep a research task continuous without carrying old inputs into new work.',[
      steps([
        '在长期对话中新建、选择或删除会话。不同研究目标可使用不同会话，减少参数和文件混淆。',
        '导入或选择文件后，确认当前页面及数据集上下文；历史消息里提到的文件不一定是本轮处理对象。',
        '明确研究目标和偏好，例如解释语言、默认保存要求。执行时仍说明本轮条件，重要参数以结构验证和审计记录为准。',
        '恢复旧任务时检查源文件是否仍在原位置。数据集注册信息会持久化并校验文件状态；文件移动或变化后可能需要重新导入。'
      ],[
        'Create, select or delete sessions in Conversations. Separate research goals into separate sessions to reduce file and parameter confusion.',
        'After import/selection, verify current page and dataset context. A file mentioned in history is not necessarily this turn’s input.',
        'State research goals and preferences such as language or saving defaults, while specifying conditions for the current operation. Use validated structure and audits for exact parameters.',
        'When restoring work, check original file locations. Dataset registrations persist and file state is validated; moved/changed recordings may need reimport.'
      ]),
      paragraph('近期消息保留原文，较早对话会摘要压缩，结构化偏好和研究目标分开保存。自动附加的页面/组件说明供本轮使用，不作为用户原话写入新消息标题和摘要。','Recent messages retain original text, older turns are summarized, and preferences/research goals are stored separately. Automatically attached page/component descriptions inform the turn without becoming the user’s text in new titles and summaries.'),
      note('摘要不是逐字档案，不能替代完整参数报告。删除会话不等于删除源文件、已导出的结果或所有页面的本地标注。','Summaries are not verbatim archives or a substitute for parameter reports. Deleting a conversation does not delete source files, exported results or every page’s local annotations.')
    ]),
    topic('privacy','results','数据保存在哪里','Where data and settings live',
      '明确本地保存和发送给模型的内容。','Understand local storage and the information sent to the model.',[
      table(['内容','位置或去向'],['Content','Location or destination'],[
        ['导入的原始记录','通常仍在所选路径，由本机工具读取；导入不等于复制到仓库。'],['会话、任务与数据集注册','本机 data/neuroflow.db 等运行时存储；文件状态仍需验证。'],['处理文件和审计','成功保存的分析产物通常位于 outputs，以返回路径为准。'],['睡眠标注和界面偏好','本机应用存储；需要独立文件时手动导出。'],['Electron 模型配置','应用用户目录内加密保存，不放入 Git 或聊天上下文。'],['模型请求','对话、页面状态、元数据与允许的工具摘要发送到所配置服务商。']
      ],[
        ['Imported recordings','Usually remain at their chosen paths and are read by local tools; import is not a repository copy.'],['Sessions, tasks, dataset registry','Local runtime storage such as data/neuroflow.db; file state still requires validation.'],['Processed signals and audits','Successful saved artifacts normally reside under outputs; use returned paths.'],['Sleep labels and UI preferences','Local application storage; explicitly export standalone files.'],['Electron model configuration','Encrypted in the application user directory, not Git or chat context.'],['Model requests','Chat, page state, metadata and allowed tool summaries go to the configured provider.']
      ]),
      note('软件不会自动将整份原始记录上传给模型。你主动粘贴到聊天中的内容也会进入请求；API Key 作为认证信息发送给对应模型服务商，不是聊天提示词。清理本机数据或换电脑前，应导出需要保留的结果和标注。','The app does not automatically upload entire raw recordings to the model. Content pasted into chat also enters requests. The API key authenticates requests to its provider; it is not prompt text. Export needed results and annotations before clearing local data or moving computers.')
    ]),
    topic('errors','support','按现象排查问题','Troubleshoot by symptom',
      '先定位后端、模型、文件还是工具，避免无效重试。','Identify the failing layer before retrying.',[
      table(['现象／错误','先检查什么'],['Symptom / error','First check'],[
        ['Failed to fetch / 后端离线','Go 是否仍运行、地址是否正确、8819 是否可达；不要直接判定 CSV 损坏。'],['6334 connection refused','Qdrant 服务及配置的 gRPC 端口；从 Go 启动日志的第一条错误开始看。'],['8819 bind / address already in use','是否已有后端或 Air 在运行，先查看状态，避免启动第二份。'],['已保存但未应用','核对配置版本与后端状态；旧后端需更新重启，再点保存、核对并应用。'],['HTTP 401 / 403 / 404','密钥是否匹配地址、是否有模型权限、模型名和 API Base 是否正确。'],['HTTP 400 / 422','服务商是否接受当前参数、temperature、工具或结构化输出格式，查看能力测试。'],['HTTP 402','额度不足或计费未就绪，检查服务商账户；重复发送不能恢复额度。'],['HTTP 429 / TPM / RPM','服务商限流；等待窗口恢复或检查账户限额。一次测试通过不保证之后不受限流。'],['回答整段出现或异常断流','检查流式能力、真实 SSE 错误和工具记录；区分服务商合并输出与请求失败。'],['只说将要执行，没有结果','核对是否有工具调用、是否缺信息、是否在正确页面；不要把计划当结果。'],['波形为空、缩放或平移无效','是否仍在加载、到达边界、选错通道，或没有该处理后时间窗。'],['Epoch / ERP / 解码失败','事件字典、分段窗口、保留试次数及工具返回的具体前提。']
      ],[
        ['Failed to fetch / backend offline','Check Go, the configured address and port 8819 before blaming CSV structure.'],['6334 connection refused','Check Qdrant and its configured gRPC port; start with the first Go startup error.'],['8819 bind / address already in use','Check existing Go/Air status instead of launching a second backend.'],['Saved but not applied','Check revision and runtime status. Update/restart an older backend, then Save, verify & apply.'],['HTTP 401 / 403 / 404','Verify matching key/endpoint, model permission, model ID and API Base.'],['HTTP 400 / 422','Check whether the provider accepts current parameters, temperature, tools and structured output.'],['HTTP 402','Check quota or billing in the provider account; repeated requests do not restore credits.'],['HTTP 429 / TPM / RPM','Wait for rate limits to reset or review account limits. A passed test does not prevent later throttling.'],['Whole answer at once / interrupted stream','Inspect streaming capability, actual SSE errors and tool records. Distinguish provider buffering from request failure.'],['Only a promised action, no result','Check actual tool calls, missing information and page context; a plan is not a result.'],['Blank or unresponsive signal navigation','Check loading, boundaries, selected channel and available processed windows.'],['Epoch / ERP / decoding failure','Check event meanings, epoch windows, retained trial counts and reported prerequisites.']
      ]),
      paragraph('反馈问题时提供当前页面、操作步骤、错误代码和脱敏日志；说明使用 Air、go run 还是安装包。不要贴 API Key，也不要仅重复点击运行来覆盖已有执行证据。','When reporting an issue, include the page, steps, error code and redacted logs, and say whether you use Air, go run or a packaged build. Do not include API keys or repeatedly rerun over existing execution evidence.')
    ]),
    topic('services','support','开发启动与自动重载','Development startup and reload',
      '本章面向开发者；普通使用者优先查看首次启动和模型设置。','For developers; start with First launch and Model settings for normal use.',[
      paragraph('Go/Gin/Eino 负责 Agent 与工具调度；Python/MNE/NeuroKit2 负责本地信号计算。Qdrant 存储知识向量，Ollama 默认提供 embedding；它们的配置与聊天大模型独立。按项目 README 安装依赖并启动所需服务。','Go/Gin/Eino orchestrate the Agent and tools; Python/MNE/NeuroKit2 perform local signal computation. Qdrant stores knowledge vectors and Ollama supplies embeddings by default, separately from the chat model. Install dependencies and start services as documented in the project README.'),
      code('Windows：在项目根目录启动 Air','Windows: start Air from the project root','powershell -ExecutionPolicy Bypass -File .\\scripts\\dev-go.ps1'),
      code('查看或停止本项目后台 Air','Inspect or stop this project’s background Air','powershell -ExecutionPolicy Bypass -File .\\scripts\\dev-go.ps1 -Action Status\npowershell -ExecutionPolicy Bypass -File .\\scripts\\dev-go.ps1 -Action Stop'),
      list('自动重载的范围','What reload covers',[
        '需要先按 README 将 Air 安装到 .tools/bin。加 -Background 可后台启动；不要同时运行另一个 go run ./cmd 实例。',
        '保存 cmd/、internal/、pkg/ 的 Go 源码会重新编译并启动。go.mod、go.sum 和本地配置也受监控；测试文件、Electron、数据和输出目录不会触发 Go 重载。',
        '编译失败时旧版本停止，查看 .cache/air/build-errors.log；修复后保存即可重新启动。Air 的运行与启动错误分别记录在 watcher.stdout.log、watcher.stderr.log。',
        'Go 重启会中断当前请求。Electron 在连接或发送消息前重新应用已保存模型配置；修改 Electron 主进程/界面代码仍需重新打开应用。',
        '源码内提示词变更需要重新编译；Electron 中的模型设置通过保存、核对并应用即时更新，不需要为每次设置修改重启 Go。'
      ],[
        'First install Air into .tools/bin as described in README. Add -Background to run it in the background; do not also start go run ./cmd.',
        'Saving Go source under cmd/, internal/ or pkg/ rebuilds and starts the backend. go.mod, go.sum and local configuration are watched too; tests, Electron, data and output directories do not trigger Go reload.',
        'A failed build stops the old version. Inspect .cache/air/build-errors.log, fix and save. Watcher output and startup errors are in watcher.stdout.log and watcher.stderr.log.',
        'A Go restart interrupts active requests. Electron reapplies saved model settings on connection or before chat; Electron main-process/UI changes still require reopening the app.',
        'Prompts embedded in Go require recompilation. Model settings in Electron update through Save, verify & apply without restarting Go for each edit.'
      ]),
      note('本说明随软件离线分发，与 docs/knowledge 中的专家 RAG 知识分开。新增功能时同时维护中文、英文、前提、操作和结果说明，不把“规划中”功能写成已可用。','This offline product guide is separate from expert RAG knowledge in docs/knowledge. For new features, update both languages, prerequisites, actions and observable results, and do not describe planned features as available.')
    ])
  ];

  // Convert paired content once. The renderer deals only with text/data and never
  // executes examples or accepts documentation strings as HTML.
  function localize(lang) {
    return topics.map(item => ({id:item.id,group:item.group,title:item.title[lang],summary:item.summary[lang],blocks:item.blocks.map(block => {
      const out={type:block.type};
      for(const key of ['title','text','items','headers','rows'])if(block[key])out[key]=block[key][lang];
      return out;
    })}));
  }
  global.NeuroHelpContent=Object.freeze({groups,zh:localize('zh'),en:localize('en')});
})(window);
