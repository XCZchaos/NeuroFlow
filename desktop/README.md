# NeuroFlow 桌面前端

面向 EEG、MEG、fNIRS 预处理的 Electron 工作台。使用原生 HTML/CSS/JavaScript，无渲染端构建步骤。

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

- 三种模态模板、步骤开关、参数编辑、模板重置。
- 文件选择、拖放、多配套文件选择、会话内文件元信息列表。
- 合成波形与处理示意、演示步骤进度、会话内运行记录。
- JSON 配置导出，包含模态、步骤、参数和演示标记。
- 本地预设助手回复，以及可选的现有 Go `/chat` 接口连接。
- Electron context isolation、sandbox 和限制页面导航；渲染层没有 Node.js 权限。

## 当前边界

不解析 EDF/FIF/SNIRF 等文件，不执行滤波、ICA、SSS 或浓度转换。界面参数是示例，不是经过设备或实验验证的推荐配置。导入后采样率等字段显示“待解析”，波形始终标为合成演示。文件内容不会读取或上传；刷新会清空本次会话数据与记录。

MEG 文件夹格式（例如 `.ds`）尚未支持。多文件导入仅登记文件元信息，尚未验证配套关系。

连接设置可选 `http://localhost:8819` 或 `http://127.0.0.1:8819`，请求格式为 `{question, id}`，读取响应 `{message}`。开启后仅发送文字与模态，现有 Go 后端仍为原运维 Agent，需要另行修改提示词及工具才能支持神经信号分析。

## 后续后端接入位置

- `renderer/app.js` 的 `importFiles`：接入文件解析，返回真实采样率、通道与时长。
- `drawSignal`：接入降采样后的真实波形数据。
- `runDemo`：替换为真实处理任务提交、进度与取消接口。
- `sendMessage`：对话后端适配。

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
