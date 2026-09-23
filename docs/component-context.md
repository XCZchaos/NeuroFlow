# Agent 组件上下文

Agent 通过组件的**语义说明和结构化状态**了解界面，不通过屏幕截图或全页 DOM 猜测状态，也不会收到原始波形。

## 如何使用

1. 在任意页面点击一个组件或编辑参数，右侧 Agent 的“关注”栏会显示该组件。
2. 若不想触发按钮，点击“选择组件”，再点目标组件；选择模式只定位，不操作。禁用按钮也可以选中，Esc 取消选择。
3. 点击“解释此组件”，或在聊天栏输入“这个参数是什么意思”“当前看的是什么通道和时间范围”。弹窗里可以使用“让 Agent 解释此组件”，系统先保存本轮状态快照，再关闭弹窗显示聊天。
4. 点击 × 清除选择；切换页面或绑定的数据集变化时也会清除。更改参数后，下一次发送读取新值，而不是沿用上次对话的值。

“解释此组件”是只读入口，允许读取组件状态、文件元数据、知识检索，禁止分析或修改任务。普通聊天仍可按原有页面权限调用处理工具。想实际执行时，请明确提出处理请求。

## 覆盖内容

| 组件 | 提供给 Agent 的信息 |
| --- | --- |
| 数据导入、标签、结构确认 | 元数据、解析状态与错误、确认冲突、标签数量、所选通道的未保存草案 |
| 处理流程与参数 | 步骤顺序、启用状态、当前值、关注的步骤与参数；换序后按步骤 key 保持对应关系 |
| 信号预览 | 原始/处理后选择、所选通道、请求/显示窗口、单位、是否有真实预览；单通道的显示统计明确标为抽稀预览统计 |
| 通道排布 | 当前通道、Montage、坐标数量、标准模板/文件位置/通道顺序图的区别 |
| 质量、分析产物、任务 | 已有分析 ID、质量对比、执行状态、待确认字段、ERP/时频/解码摘要 |
| MEG、运行、算法库 | SSS/tSSS 参数、空房 ID、保存选项、步骤配置；勾选不代表已执行 |
| 数据管理、历史、会话、批处理、BIDS | 记录数量、所关注的数据或运行行、当前会话、批次选中数量等摘要；不发送路径和其他会话内容 |
| PPG | 通道、采样率、时间单位、极性、分析窗口、当前显示窗口、已有脉搏峰与心率摘要 |
| 睡眠 | 当前 Epoch、实际窗口长度、标签来源、置信度、人工复核和伪迹标记、检测器能力 |
| 使用说明 | 选中的说明主题与短摘录 |
| 模型设置 | 服务商类型、模型名、temperature 编辑状态等白名单字段；不发送 Key 或 API 地址 |

没有选择组件、组件已不可见或数据已切换时，Agent 应提示重新选择，不猜测“这个”指什么。界面草案可能未经确认，客户端显示状态也不是独立的科学证据。

例如 Agent 能知道“你正在看 Cz 的 15–20 秒原始预览”，但不能仅据此断言“这里有眼动伪迹”。后者需要调用真实分析工具，核对实际分析通道、时间范围和数据来源；没有适用工具时应说明限制。

## 数据流与实现

```text
点击组件或参数
  → 前端注册表定位稳定 ID，保存关注对象
  → 发送问题时冻结白名单状态 ui_context
  → Go 校验版本、页面、dataset_id、组件 ID 和体积
  → 外层工作流给出组件索引
  → ReAct 按需调用 inspect_ui_component
  → 读取只读状态并回答
```

| 文件 | 职责 |
| --- | --- |
| `desktop/renderer/component-context.js` | 组件注册、定位、选择模式、弹窗入口、状态清理、大小上限 |
| `desktop/renderer/component-context.css` | 关注提示和选择高亮 |
| `desktop/renderer/app.js` | 白名单状态适配器 `agentComponentState` 与聊天发送快照 |
| `desktop/renderer/ppg-view.js`、`sleep-label.js` | 专用页面提供局部窗口、Epoch 等状态 |
| `internal/handler/chat.go` | 接收并验证 `ui_context`，绑定本轮请求 |
| `internal/server/ai/toolinput/ui_context.go` | 快照协议及校验、工作流索引提示 |
| `internal/server/ai/tools/ui_component.go` | `inspect_ui_component` 只读 function call |
| `internal/server/ai/tools/workspace.go` | 阻止纯解释请求误执行处理工具 |
| `internal/server/ai/agent/chat/new_react_agent.go` | 注册组件工具 |
| `internal/server/chatServer/chat.go`、`workflow.go` | 同步/流式入口接入索引和纯解释流程 |

前端快照最多 24 个组件、24 KB；后端拒绝超过 32 KiB、页面/数据集不符或重复组件 ID 的请求。状态保留必要摘要，按白名单过滤密钥、路径和波形字段，并对错误文本里的常见路径/密钥做脱敏。当前工具读取的是**发送时的快照**，不是浏览器的实时远程控制接口。

## 后续新增组件

在组件初始化时注册定义，`read` 必须返回显式选择的小型状态，不能直接返回表单、整页文本、完整分析对象或原始数据：

```javascript
window.NeuroComponents.register({
  id: 'custom-summary',
  selector: '#custom-summary',
  title: ['自定义摘要', 'Custom summary'],
  purpose: 'Explain the local summary; displayed settings are not execution evidence.',
  read: () => ({ count: localSummary.count, status: localSummary.status })
});
```

## 验证

`npm --prefix desktop run test:components` 检查实时参数、步骤换序、选择模式不执行动作、禁用控件、图表窗口、跨页面清理、弹窗快照和敏感数据排除。Go 测试校验协议、工具只读行为和纯解释执行阻断。

自动化使用模拟模型响应验证 UI 请求和回填，真实工具通过 Go 测试执行；尚未使用用户配置的在线模型进行组件问答质量评估。
