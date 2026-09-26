# NeuroFlow v0.2 桌面前端

面向 EEG、MEG、fNIRS 预处理、PPG 分析和睡眠标注的 Electron 工作台。使用原生 HTML/CSS/JavaScript，无渲染端构建步骤。桌面包版本为 `0.2.0`。

## 启动

需要 Node.js 和 npm，在本目录运行：

```powershell
npm.cmd install
npm.cmd start
```

如果 GitHub 上的 Electron 运行时下载失败，可在 Windows 使用镜像安装脚本（npm 包仍通过官方源下载，保留 HTTPS 证书校验）：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install.ps1
npm.cmd start
```

项目 `.npmrc` 使用 npm 官方源，避免继承机器上已失效的旧镜像。启动脚本仅对子进程清除 `ELECTRON_RUN_AS_NODE`，防止终端环境使 Electron 进入 Node 模式；不修改系统环境变量。

也可以直接用浏览器打开 `renderer/index.html` 查看界面并体验本地演示。

```powershell
npm.cmd run check
npm.cmd run test:stream
npm.cmd run test:lifecycle
npm.cmd run test:help
```

`test:stream` 验证增量正文、真实工具进度、异常断流与停止；`test:lifecycle` 使用隐藏 Electron 窗口和模拟后端，覆盖注册失败恢复、取消后迟到的结果、睡眠请求路由、图表同步期间的页面锁和历史参数快照。测试不调用外部模型。

`test:help` 在隐藏 Electron 窗口中验证双语章节一致性、分组目录、全文搜索、快捷跳转、Agent 章节定位以及深浅主题下的窄屏排版。此测试不调用模型或运行文档中的命令。

## 已实现

- EEG、MEG、fNIRS 独立页面，支持流程步骤选择和参数编辑。
- 文件结构确认、通道配置、外部事件标签导入与编辑、真实波形时间窗和单通道查看。
- PPG 信号清洗、脉搏峰和逐搏心率；睡眠 30 秒波形、人工标注及待复核候选。
- 共享 Agent、页面与组件上下文、SSE 流式回答和真实工具执行进度。
- SQLite 长期对话、数据集注册与任务状态，以及分析结果和审计报告查看。
- 模型配置导入、加密保存与能力探测，中英文界面和 20 章离线使用说明。
- Electron context isolation、sandbox 和限制页面导航；渲染层没有 Node.js 权限。

## 当前边界

模型连接设置现在区分本机保存、后端应用和真实测试：

- API Key 输入框不显示假圆点。留空保留已保存的密钥；输入新值替换；“删除已保存密钥”在保存后清空密钥并停用新的模型请求，保存前可撤销。
- “保存、核对并应用”将配置传入本机 Go 后端，重建 Agent 与 Plan 的模型后一次切换，并回读配置版本、模型和参数。正在执行的请求使用原来的版本，新请求使用新版本。
- 开发模式也支持应用，不需要把密钥复制到 `config/config.json`。第一次升级该功能需重启 Go；以后 Electron 连接、发送消息及打开设置时会重新核对已保存配置，Go 重启后会恢复应用。
- 此功能不会改写独立的 `config/config.json`。如果单独启动 Go 而没有 Electron 连接，启动配置仍来自文件及环境变量；清空 Electron 密钥后，连接时会向 Go 明确应用“停用”，不会退回旧密钥。
- “测试模型能力”向服务商发送最多 5 个真实请求，验证有效回答、实际选择的 temperature、SSE、工具名及参数、JSON Schema 输出。HTTP 200 或收到任意字节不足以证明成功。参数被接受不意味着能验证模型的随机性统计分布。
- “测试后端 Agent”分别选择即时或深度模式，用当前后端的 Eino 图调用真实只读组件工具，再让模型读取其随机校验值。通过工具完成记录和返回值核验才显示成功；不读研究数据、不写会话，也不证明所有科学算法均已验证。可看到模式、正文块数、耗时与时间戳。
- 能力测试可能消耗服务商额度。HTTP 429 是限流，需等待后再测；HTTP 402 是额度或计费问题，均不会被显示为通过。修改模型、地址、密钥或参数后旧测试失效。
- RAG embedding、Qdrant 和本地 Python 算法不是聊天模型配置的一部分。远程 Go 地址不能接收本机保存密钥；运行时管理接口只接受本地、无浏览器 Origin、具有控制令牌的请求。

代码：`electron/model-config.cjs` 管理密钥操作与测试绑定；`electron/model-runtime.cjs` 应用并核对后端；`electron/model-capabilities.cjs` 发送服务商请求；`renderer/model-settings.js` 展示三种状态。Go 对应 `internal/server/modelruntime`、`internal/handler/model_runtime.go` 和路由中的配置快照。

`npm run test:model`、`npm run test:model-ui` 和 Go 中的 `TestRuntimeSwitchAndActualReActToolRoundTrip` 是使用模拟服务商的回归测试，不能替代设置页面的真实联网测试。

真实文件解析和计算依赖 Go 后端及 Python/MNE/NeuroKit2；本地演示回复不能证明分析已执行。界面模板需要按数据和任务确认，SSS、插值等方法仍有元数据前提。睡眠自动结果需要人工复核。

默认 Go 地址为 `http://localhost:8819` 或 `http://127.0.0.1:8819`。按项目配置启动 Qdrant 和 embedding 服务，再启动 Go。打包版只有在随包包含后端及必要运行环境时，才能由 Electron 管理后端。

原始数据由本机工具读取；对话、页面上下文和允许的工具摘要会发送给配置的模型服务商。不要在对话中粘贴密钥或不应外发的数据。

## 代码入口

- `renderer/app.js`：文件导入、流程与共享对话。
- `renderer/science-theme.css`：最后加载的科研仪器视觉层，统一深浅主题、模态强调色、侧栏、Agent 和全部子页面。
- `renderer/visual-theme.js`：CSS/Canvas 共用的配色、导航 SVG 图标与波形优先布局；`renderer/assets/neural-field.svg` 为静态装饰。
- `renderer/signal-window.js`：真实波形窗口、平移和缩放。
- `renderer/agent-stream.js`：SSE 解析与执行面板。
- `renderer/component-context.js`：组件注册、快照和解释入口。
- `renderer/ppg-view.js`、`renderer/sleep-label.js`：PPG 和睡眠子页面。
- `renderer/help-content.js`：20 章双语说明，按开始使用、导入与检查、分析与标注、进度与结果、排查与开发分组。每一条内容同时维护中文和英文，避免在文件尾部反复追加覆盖。
- `renderer/help-view.js`、`renderer/help-view.css`：分组目录、常用入口、全文搜索、步骤列表、结果提示、示例、命令和表格的响应式排版。

新增功能时同步补充两种语言的使用步骤与边界。软件显示版本取自页面 `application-version` 元信息；升级时与 `package.json`、`package-lock.json` 和根 README 一并更新。

维护说明时，把内容放进对应操作章节，写清入口、前提、步骤及可观察的成功结果。使用 `steps`、`result`、`note`、`example`、`table` 等内容块，开发命令放到最后的开发章节。保持已有 topic ID 不变（如 `agent` 对应 `help-agent`），供组件提问定位；全部文字通过 `textContent` 渲染，不将说明当作 HTML 或可执行脚本。

真实处理参数应由后端验证；不能直接把模型生成的文字当作代码执行。

## 科研仪器主题

未设置主题时默认使用深蓝背景；顶栏太阳/月亮按钮切换深浅主题，保留用户已保存的偏好。EEG、MEG、fNIRS、PPG、睡眠页面分别使用青、紫、琥珀、薄荷和蓝紫强调色。工作台先展示数据与信号，再展示可编辑流程。

Canvas 波形、质量图和电极图共用主题颜色；切换主题只重绘已有数据，不重新分析文件。标题旁的静态信号/电极插画仅作装饰。未导入文件时的示例波形仍明确标为“合成演示”。新增组件应使用 `--nf-ink`、`--nf-subtle`、`--nf-line`、`--panel` 等语义颜色；绘图使用 `NeuroTheme.palette()`，避免写死白底或使用全局亮度滤镜。

## 中英文国际化

界面语言由 `renderer/i18n.js` 统一管理，用户在顶栏点击 `EN` 或 `中` 切换，选择保存在本机 `localStorage`。

新增静态界面时使用翻译键：

```html
<button data-i18n="action.save"></button>
```

新增动态内容时调用：

```javascript
const label = NeuroI18n.t('action.save');
```

带变量的文本使用：

```javascript
NeuroI18n.t('steps.enabled', { count: 5 });
```

每个新翻译键必须同时写入 `zh-CN` 和 `en` 字典。MutationObserver 会自动处理运行期间新增且带有 `data-i18n` 的元素。用户消息和 Agent 回答正文不会被自动翻译；前端会把当前语言传给 Agent，请模型使用相同语言回答。
