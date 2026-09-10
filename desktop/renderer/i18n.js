/*
 * NeuroFlow 国际化核心。
 * 新功能：HTML 使用 data-i18n="action.save"；JS 使用 NeuroI18n.t('action.save')。
 * 动态插入且带 data-i18n 的节点会被自动翻译，消息正文不会被自动改写。
 */
(function createI18n(global) {
  const messages = {
    'zh-CN': {
      'action.save':'保存设置','action.close':'关闭','action.import':'＋ 导入数据','action.choose':'选择文件','action.open':'打开','action.export':'↓ 导出配置','action.reset':'↺ 重置模板',
      'nav.workspace':'工作空间','nav.preprocessing':'预处理工作台','nav.datasets':'数据管理','nav.history':'运行记录','nav.settings':'连接设置','nav.templates':'处理模板',
      'status.demo':'本地演示模式','status.checking':'正在检测后端…','status.online':'Go 后端已连接','status.offline':'Go 后端未连接',
      'agent.demo':'你的预处理助手 · 演示','agent.backend':'Go 后端 · 流式对话','agent.thinking':'正在思考','agent.copy':'复制','agent.copied':'已复制','agent.stopped':'已停止生成。',
      'view.title':'让每一段信号，更清晰。','view.subtitle':'从原始数据到分析就绪，用可复现的流程探索神经信号。','view.context':'当前上下文',
      'section.dataset':'数据集','section.pipeline':'预处理流程','section.signal':'信号预览','section.sessionData':'本次会话的数据',
      'meta.channels':'通道数','meta.rate':'采样率','meta.duration':'记录时长','meta.format':'数据格式','badge.example':'示例数据','badge.parsed':'已解析','badge.pending':'待解析','badge.synthetic':'合成演示',
      'chat.placeholder':'询问处理步骤，或描述你的研究需求…','chat.hint':'Enter 发送 · Shift + Enter 换行','chat.notice':'建议仅供研究参考，处理参数需由研究者确认',
      'prompt.pipeline':'解释当前流程 ↗','prompt.quality':'质量检查建议 ↗','mode.keep':'模板可编辑 · 全程保留配置',
      'settings.mode':'对话模式','settings.url':'后端地址','settings.demo':'本地演示回复','settings.backend':'连接 Go 后端',
      'toast.wait':'请等待当前任务结束','toast.waitSwitch':'请等待当前任务结束后再切换模态','toast.waitImport':'请等待当前任务结束后再导入','toast.connectBackend':'请先在连接设置中选择“连接 Go 后端”','toast.imported':'已读取 {count} 个数据集','toast.failedCount':'，{count} 个失败','toast.readFailed':'读取失败：{error}','toast.demoImport':'演示运行中，请稍后导入','toast.selected':'已选择 {count} 个文件，尚未执行解析','toast.noFile':'未导入文件','toast.rejected':'；{count} 个文件格式不匹配','toast.resetWait':'请等待演示结束','toast.resetDone':'已恢复当前模态模板','toast.copyFailed':'复制失败，请手动选择文本','toast.saved':'设置已保存',
      'history.empty':'暂无运行记录。可以在工作台运行一次演示流程。','history.complete':'{mode} · {count} 个步骤 · 演示完成','history.noProcessing':'未执行真实信号处理','dataset.empty':'尚未导入本地文件。工作台目前展示合成示例。','toggle.enable':'启用{name}',
      'error.streamingUnsupported':'当前环境不支持流式响应','error.backendHttp':'后端返回 HTTP {status}','error.stream':'Agent 流式调用失败','error.empty':'后端没有返回回答内容','error.connection':'**连接失败：** {message}\n\n请确认 Go 服务已启动、地址正确且模型服务可用。没有生成分析结果。',
      'run.running':'演示运行中…','run.step':'演示：{name}','run.completed':'演示流程已完成','run.recorded':'未执行真实处理；配置已记录在本次会话的运行记录中','run.simulated':'仅模拟步骤进度','run.again':'▷ 再次运行演示','run.finishedToast':'演示已完成，可在运行记录中导出配置',
      'run.ready':'流程已就绪','run.demo':'演示执行 · 不会处理或修改原始数据','run.start':'▷ 运行演示流程','signal.raw':'原始','signal.processed':'处理示意','signal.time':'时间 / s',
      'theme.switch':'切换主题','sidebar.collapse':'折叠侧栏','sidebar.expand':'展开侧栏','language.switch':'切换语言','steps.enabled':'{count} 个步骤已启用','steps.count':'{count} 步','speaker.you':'你','speaker.reply':'NeuroFlow · 后端回复','speaker.demo':'NeuroFlow · 演示回复',
      'workspace.mine':'我的研究空间','workspace.local':'本地工作区','privacy.title':'数据留在本地','privacy.body':'原始文件不会上传。Agent 只接收对话和已解析的元数据。','profile.name':'研究者','profile.space':'个人工作区','mode.eeg':'脑电','mode.meg':'脑磁','mode.fnirs':'近红外',
      'pipeline.help':'按顺序执行处理步骤。点击参数可编辑，开关控制是否启用。','signal.caption':'8 个示例通道 · 10 秒窗口','signal.amplitude':'振幅 / {unit}','signal.disclaimer':'演示波形不代表导入文件内容或处理效果','note.title':'可复现，从每一步开始','note.body':'导出流程参数，保留模态、步骤顺序与启用状态，让分析更容易复查。','run.estimate':'预计演示用时约 5 秒','session.label':'本次会话','datasets.note':'元数据保存在本次会话内；原始文件仍位于原位置，关闭后清空。','settings.title':'Agent 连接设置','settings.description':'连接 Go 后端后，可以读取 EEG、MEG、fNIRS 元数据并进行流式对话。','settings.note':'只发送对话和已解析元数据；原始波形及本地路径不会发送给大模型。','action.send':'发送消息','action.stop':'停止生成'
    },
    en: {
      'action.save':'Save settings','action.close':'Close','action.import':'+ Import data','action.choose':'Choose file','action.open':'Open','action.export':'↓ Export config','action.reset':'↺ Reset template',
      'nav.workspace':'Workspace','nav.preprocessing':'Preprocessing','nav.datasets':'Datasets','nav.history':'Run history','nav.settings':'Connection settings','nav.templates':'Templates',
      'status.demo':'Local demo mode','status.checking':'Checking backend…','status.online':'Go backend connected','status.offline':'Go backend unavailable',
      'agent.demo':'Your preprocessing assistant · Demo','agent.backend':'Go backend · Streaming','agent.thinking':'Thinking','agent.copy':'Copy','agent.copied':'Copied','agent.stopped':'Generation stopped.',
      'view.title':'Make every signal clearer.','view.subtitle':'Explore neural signals through a reproducible path from raw data to analysis-ready output.','view.context':'Current context',
      'section.dataset':'Dataset','section.pipeline':'Preprocessing pipeline','section.signal':'Signal preview','section.sessionData':'Datasets in this session',
      'meta.channels':'Channels','meta.rate':'Sampling rate','meta.duration':'Duration','meta.format':'Format','badge.example':'Example','badge.parsed':'Parsed','badge.pending':'Pending','badge.synthetic':'Synthetic demo',
      'chat.placeholder':'Ask about processing steps or describe your research goal…','chat.hint':'Enter to send · Shift + Enter for a new line','chat.notice':'Research guidance only; parameters require researcher review',
      'prompt.pipeline':'Explain pipeline ↗','prompt.quality':'Quality checks ↗','mode.keep':'Editable templates · Configuration preserved',
      'settings.mode':'Conversation mode','settings.url':'Backend URL','settings.demo':'Local demo response','settings.backend':'Connect Go backend',
      'toast.wait':'Wait for the current task to finish','toast.waitSwitch':'Wait for the current task to finish before switching modality','toast.waitImport':'Wait for the current task to finish before importing','toast.connectBackend':'Select “Connect Go backend” in connection settings first','toast.imported':'Read {count} dataset(s)','toast.failedCount':', {count} failed','toast.readFailed':'Read failed: {error}','toast.demoImport':'The demo is running; import files when it finishes','toast.selected':'Selected {count} file(s), pending inspection','toast.noFile':'No files imported','toast.rejected':'; {count} file(s) have an unsupported format','toast.resetWait':'Wait for the demo to finish','toast.resetDone':'Current modality template restored','toast.copyFailed':'Copy failed; select the text manually','toast.saved':'Settings saved',
      'history.empty':'No runs yet. Start a demo pipeline from the workspace.','history.complete':'{mode} · {count} steps · Demo complete','history.noProcessing':'No real signal processing was performed','dataset.empty':'No local dataset imported. A synthetic preview is shown.','toggle.enable':'Enable {name}',
      'error.streamingUnsupported':'Streaming is unavailable in this environment','error.backendHttp':'Backend returned HTTP {status}','error.stream':'Agent streaming request failed','error.empty':'The backend returned no response content','error.connection':'**Connection failed:** {message}\n\nCheck that the Go service is running, the address is correct, and the model service is available. No analysis result was generated.',
      'run.running':'Running demo…','run.step':'Demo: {name}','run.completed':'Demo pipeline complete','run.recorded':'No real processing was performed; the configuration was added to this session’s run history','run.simulated':'Step progress simulation only','run.again':'▷ Run demo again','run.finishedToast':'Demo complete. Export its configuration from run history.',
      'run.ready':'Pipeline ready','run.demo':'Demo only · Original data will not be modified','run.start':'▷ Run demo pipeline','signal.raw':'Raw','signal.processed':'Processed demo','signal.time':'Time / s',
      'theme.switch':'Switch theme','sidebar.collapse':'Collapse sidebar','sidebar.expand':'Expand sidebar','language.switch':'Switch to Chinese','steps.enabled':'{count} steps enabled','steps.count':'{count} steps','speaker.you':'You','speaker.reply':'NeuroFlow · Backend','speaker.demo':'NeuroFlow · Demo',
      'workspace.mine':'My research workspace','workspace.local':'Local workspace','privacy.title':'Your data stays local','privacy.body':'Raw files are never uploaded. The Agent only receives chat text and parsed metadata.','profile.name':'Researcher','profile.space':'Personal workspace','mode.eeg':'EEG','mode.meg':'MEG','mode.fnirs':'Near-infrared',
      'pipeline.help':'Steps run in order. Edit parameters directly and use switches to enable or disable them.','signal.caption':'8 example channels · 10-second window','signal.amplitude':'Amplitude / {unit}','signal.disclaimer':'Synthetic traces do not represent imported data or processing results','note.title':'Reproducible from the first step','note.body':'Export pipeline parameters and preserve modality, order, and enabled state for review.','run.estimate':'Estimated demo time: 5 seconds','session.label':'This session','datasets.note':'Metadata is held for this session; raw files stay in place and the list clears on exit.','settings.title':'Agent connection','settings.description':'Connect the Go backend to inspect EEG, MEG, and fNIRS metadata and use streaming chat.','settings.note':'Only chat text and parsed metadata are sent; raw signals and local paths are not sent to the model.','action.send':'Send message','action.stop':'Stop generating'
    }
  };
  // 科研领域词汇集中维护，动态生成的预处理步骤也能随语言切换。
  const domainEN={'带通滤波':'Band-pass filter','工频陷波':'Notch filter','坏道检测':'Bad-channel detection','独立成分分析':'ICA artifact review','重参考':'Re-reference','传感器质量检查':'Sensor quality','环境噪声抑制':'Environmental noise reduction','生理伪迹审查':'Physiological artifact review','光强转光密度':'Convert intensity to optical density','通道质量检查':'Channel quality','运动伪迹校正':'Motion correction','血红蛋白浓度转换':'Hemoglobin conversion','低频 Hz':'Low cutoff (Hz)','高频 Hz':'High cutoff (Hz)','频率 Hz':'Frequency (Hz)','方法':'Method','算法':'Algorithm','成分数':'Components','参考方式':'Reference','窗口 s':'Window (s)','输入':'Input','原始光强':'Raw intensity','人工复核':'Manual review','平均参考':'Average reference'};
  // URL 的 lang 参数仅用于自动化截图/调试；正常使用读取上次保存的语言。
  const previewLocale=new URLSearchParams(location.search).get('lang');
  let locale=previewLocale==='en'?'en':previewLocale==='zh-CN'?'zh-CN':localStorage.getItem('neuroflow-locale')==='en'?'en':'zh-CN';
  const interpolate=(value,vars={})=>value.replace(/\{(\w+)\}/g,(_,key)=>vars[key]??`{${key}}`);
  const t=(key,vars)=>interpolate(messages[locale][key]||messages['zh-CN'][key]||key,vars);
  function translateElement(element){const key=element.dataset.i18n;if(!key)return;const attribute=element.dataset.i18nAttr;if(attribute)element.setAttribute(attribute,t(key));else element.textContent=t(key);}
  function apply(root=document){if(root.nodeType===Node.ELEMENT_NODE&&root.matches('[data-i18n]'))translateElement(root);root.querySelectorAll?.('[data-i18n]').forEach(translateElement);document.documentElement.lang=locale;}
  function setLocale(next){locale=next==='en'?'en':'zh-CN';localStorage.setItem('neuroflow-locale',locale);apply();document.dispatchEvent(new CustomEvent('neuroflow:localechange',{detail:{locale}}));}
  new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===Node.ELEMENT_NODE)apply(node);}))).observe(document.documentElement,{childList:true,subtree:true});
  const domain=value=>locale==='en'?(domainEN[value]||value):value;
  global.NeuroI18n=Object.freeze({t,domain,apply,setLocale,getLocale:()=>locale});
})(window);
