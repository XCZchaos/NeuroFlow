# 独立模态页面与全局 Agent

侧栏提供 EEG、MEG、fNIRS 三个独立预处理页面，以及数据管理、运行记录、长期对话、使用说明、PPG 和睡眠标注。旧的“预处理工作台”导航和页内三模态切换条已替换。

## 页面使用

- 在对应模态页面导入数据、编辑处理流程并查看结果。同一次应用运行期间，切换模态会保存所选文件、步骤参数、原始/处理后选择、通道选择与波形时间窗口。
- 右侧 Agent 始终复用原来的聊天渲染器、流式接口、会话记忆、即时/深度模式与 ReAct 工具。切页不会创建一份重复聊天；可用顶部“收起/展开 Agent”调整空间。小窗口中对话栏排列在主内容下方。
- Agent 上方显示当前页面，快捷问题也随页面变化。发送时附带页面上下文；数据管理附带本地列表的 ID 与模态，运行记录附带最近运行的精简摘要，睡眠附带 Epoch 与标注统计，PPG 附带配置和结果摘要。绝对文件路径和原始波形不拼接进聊天消息。
- EEG、MEG、fNIRS 与睡眠页面使用当前选定的 `dataset_id`；无数据就是无数据，不会自动改用历史会话绑定的文件。
- 数据管理、运行记录、长期对话和说明页用于问答、结果解释和只读查询。要运行实际信号处理，进入对应信号页面。运行中暂时禁止切换页面，避免异步结果与当前文件错配。
- PPG 使用专用 `run_ppg_analysis`，按页面参数执行后刷新真实图表。其他模态沿用已有 MNE 工具；睡眠沿用候选标注工具与人工复核流程。

## 实现位置

| 文件 | 本次职责 |
| --- | --- |
| `desktop/renderer/index.html` | 三个模态导航和新增脚本/样式 |
| `desktop/renderer/workspace-pages.js` | 独立页面容器、唯一 Agent 对话栏、页面名/快捷提问/上下文 |
| `desktop/renderer/workspace-pages.css` | 全局两栏布局、折叠和窄屏适配 |
| `desktop/renderer/app.js` | 模态状态缓存、路由、执行期间锁定切页、流式请求携带 workspace、PPG 工具结果同步 |
| `desktop/renderer/sleep-label.js` | 复用全局对话栏，提供睡眠标注上下文 |
| `desktop/renderer/ppg-view.js` | 配置快照准备、Agent 执行后回填结果、处理中锁定编辑 |
| `internal/handler/chat.go` | 校验 workspace 与文件模态，设置本轮执行范围 |
| `internal/server/ai/toolinput/workspace.go` | 不从模型文字解析的请求级页面上下文 |
| `internal/server/ai/tools/workspace.go` | 工具执行前检查页面与数据集范围 |
| `internal/server/chatServer/chat.go`、`workflow.go` | 本轮上下文覆盖历史绑定；PPG 单独计划；避免注入其他数据集的任务 |
| `internal/server/ai/agent/chat/new_react_agent.go` | 注册 PPG 工具，并包装现有工具的页面范围检查 |
| `internal/server/ai/tools/ppg.go`、`internal/server/ppg/service.go` | PPG function call 与页面共享 Python 实现，模型只接收摘要 |

三个模态页面有各自的路由容器和状态；底层复用一个预处理组件，通过移动 DOM 保留现有监听器与元素 ID。全局聊天组件也只有一份，不复制三套 Agent。

现在还支持[组件级上下文](component-context.md)：Agent 下方的“选择组件 / 解释此组件”可定位具体参数、波形、Epoch 等组件，并按需读取发送时的只读状态快照。

## 验证

`npm --prefix desktop run test:pages` 验证九个页面、模态状态隔离、同一个聊天节点、语言切换、执行期间切页保护、请求上下文及 PPG 结果回填。`test:ui` 与 `test:ppg` 保留既有功能回归。

Go 测试覆盖 HTTP 页面范围、工具跨数据集阻断及真实 Python PPG 执行。测试不依赖付费模型服务；实际在线模型是否选择正确工具，还取决于用户配置的模型是否支持 tool calling。
