# 即时回答与 Agent 深度分析

两种模式复用同一个模型、ReAct Agent 和工具权限，差异由应用工作流实现。它们不是供应商原生推理开关，不修改 temperature、最大输出 token 或 reasoning_effort。

| 策略 | 即时回答 | 深度分析 |
| --- | --- | --- |
| 简单事实/非专业组件解释 | 可以跳过自动知识检索，文件事实仍需工具确认 | 同样允许轻量路径 |
| 其他问题的前置检索 | 主问题一轮，TopK=3 | 主问题与约束两轮，各 TopK=5 |
| 初始证据上限 | 3 条 | 去重后 8 条 |
| ReAct 图步骤预算 | 12 | 30 |
| 最终检查 | 现有执行、保存、质量声明和本地引用目录检查 | 再核对引用是否在本轮实际获取的文档中 |
| 回答风格 | 结论优先，不固定句数 | 证据、参数理由、风险限制、未解决项和验证办法 |

图步骤不是工具调用次数：模型节点和工具节点都会计数。一个工具内部运行多个 Python 算法，不按算法数计入图预算。超限返回 `AGENT_STEP_LIMIT`，不会自动重试执行或切换模式。

## 执行顺序

1. Electron 同时传入 `response_mode`、纯用户提问 `user_query` 和包含页面上下文的 `question`。后端只在原话与正文末尾一致时用它做意图路由；不用于授权。
2. `mode_retrieval.go` 用保守规则选择轻量或检索路径。复合问题、专业约束和不能确定的情况保留检索。
3. 非简单请求按模式执行一轮或两轮检索；每轮超时 15 秒。去重并限制单文档 4000 字符，向模型明确说明失败、空结果或截断。
4. 将实际文档及检索状态加入 prompt，ReAct 在预算内根据结果选择工具。自动检索次数是初始策略，不禁止必要的后续补检索。
5. 流式输出草稿，最终确定性核验；深度模式额外检查知识 ID 的本轮出处。需要纠正时沿用 `replace` 事件，持久化最终答案。

## 修改入口

- `internal/server/ai/toolinput/response_mode.go`：模式策略和请求级上下文。
- `internal/server/ai/agent/chat/mode_retrieval.go`：轻量路由、检索、预算和状态事件。
- `internal/server/ai/agent/chat/graph.go`：外层证据准备节点。
- `internal/server/ai/agent/chat/new_react_agent.go`：每次请求独立设置 Eino 运行预算。
- `internal/server/ai/toolinput/knowledge_trace.go`、`internal/server/ai/tools/rag.go`：记录自动和主动检索的实际知识 ID。
- `internal/server/chatServer/workflow.go`：深度出处核验，复用原有执行事实校验。
- `desktop/renderer/app.js`、`agent-stream.js`、`i18n.js`：模式描述、原始问题和真实策略事件。

## 边界

关键词路由不是完整意图理解；误走轻量路径时，Agent 仍有检索工具可用。两轮检索与来源核验也不证明证据充分或所有科学结论正确，仍需检查适用条件和实际分析结果。知识服务失败允许对话解释故障，但模型不能宣称取得了未获取的证据。跳过单次请求的 RAG 不代表后端启动可以省略配置中的依赖服务。

测试使用模拟检索器和本机模拟模型，覆盖 0/1/2 轮路由、去重与截断、取消与失败、实际 Eino 图预算差异、深度引用核验和 Electron 流式交互；不使用真实 API Key 或在线模型额度。
