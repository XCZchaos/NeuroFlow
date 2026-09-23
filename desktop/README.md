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
```

## 已实现

- EEG、MEG、fNIRS 独立页面，支持流程步骤选择和参数编辑。
- 文件结构确认、通道配置、外部事件标签导入与编辑、真实波形时间窗和单通道查看。
- PPG 信号清洗、脉搏峰和逐搏心率；睡眠 30 秒波形、人工标注及待复核候选。
- 共享 Agent、页面与组件上下文、SSE 流式回答和真实工具执行进度。
- SQLite 长期对话、数据集注册与任务状态，以及分析结果和审计报告查看。
- 模型配置导入、加密保存与能力探测，中英文界面和 20 章离线使用说明。
- Electron context isolation、sandbox 和限制页面导航；渲染层没有 Node.js 权限。

## 当前边界

真实文件解析和计算依赖 Go 后端及 Python/MNE/NeuroKit2；本地演示回复不能证明分析已执行。界面模板需要按数据和任务确认，SSS、插值等方法仍有元数据前提。睡眠自动结果需要人工复核。

默认 Go 地址为 `http://localhost:8819` 或 `http://127.0.0.1:8819`。按项目配置启动 Qdrant 和 embedding 服务，再启动 Go。打包版只有在随包包含后端及必要运行环境时，才能由 Electron 管理后端。

原始数据由本机工具读取；对话、页面上下文和允许的工具摘要会发送给配置的模型服务商。不要在对话中粘贴密钥或不应外发的数据。

## 代码入口

- `renderer/app.js`：文件导入、流程与共享对话。
- `renderer/signal-window.js`：真实波形窗口、平移和缩放。
- `renderer/agent-stream.js`：SSE 解析与执行面板。
- `renderer/component-context.js`：组件注册、快照和解释入口。
- `renderer/ppg-view.js`、`renderer/sleep-label.js`：PPG 和睡眠子页面。
- `renderer/help-content.js`：中英文说明内容，按稳定的 topic ID 成对维护。
- `renderer/help-view.js`、`renderer/help-view.css`：说明目录、搜索、列表和响应式排版。

新增功能时同步补充两种语言的使用步骤与边界。软件显示版本取自页面 `application-version` 元信息；升级时与 `package.json`、`package-lock.json` 和根 README 一并更新。

真实处理参数应由后端验证；不能直接把模型生成的文字当作代码执行。

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
