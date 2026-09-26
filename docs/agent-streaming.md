# Agent 流式回复与执行过程

Electron 的执行面板显示实际收到的后端事件：加载上下文、等待模型、工具开始与结束、Python/MNE 步骤、最终核验。面板计时只表示经过的时间，不会自动将某个步骤标记为完成，也不代表模型内部思维链。

## 为什么之前会整段输出

`internal/server/chatServer/chat.go` 对需要核验的请求曾先缓存全部正文，核验后一次发送；前端步骤则由定时器推进。现在 `/chatStream` 按收到的正文增量立即发送，草稿标为待核验。核验需要纠正时，用替换事件更新整条回答，SQLite 保存核验后的版本。

## SSE 协议

| 事件 | 数据 | 前端行为 |
| --- | --- | --- |
| `message` | 文本增量 | 追加正文，按动画帧合并 Markdown 渲染 |
| `status` | JSON：`kind=phase/tool/step`，阶段或调用 ID、名称、状态、耗时 | 更新执行面板 |
| `replace` | 完整核验后文本 | 替换草稿，避免重复回答 |
| `heartbeat` | `alive=true` | 重置空闲超时，不增加执行步骤 |
| `error` | 错误代码及说明 | 保留已收到文字，标记失败 |
| `done` | `[DONE]` | 本轮完成且会话已保存 |

正文、状态、替换和完成事件通过同一个有序通道发送。每 10 秒发送心跳，Electron 连续 120 秒没有收到事件才按空闲超时处理；用户也可以主动停止。未收到 `done` 的断流视为中断，而不是成功。

## 代码入口

- `internal/server/ai/toolinput/stream.go`：请求级事件上下文和发送机制。
- `internal/server/ai/tools/workspace.go`：所有已注册工具的真实开始/结束事件，识别 `ok:false` 业务失败；不转发工具参数或结果正文。
- `internal/server/ai/tools/python_analysis.go`：转发 Python 结构化步骤，不转发原始 stderr。
- `internal/server/chatServer/chat.go`：正文转发和最终核验替换。
- `internal/handler/chat.go`：HTTP SSE、刷新、心跳与连接取消。
- `desktop/renderer/agent-stream.js`：执行面板与跨分片 SSE 解析。
- `desktop/renderer/app.js`：对话、流式 Markdown、核验替换和停止交互。

## 验证与边界

后端测试覆盖首块在 EOF 前送达、核验替换、保存结果一致、工具开始事件和业务失败、HTTP 实时刷新。`cd desktop; npm run test:stream` 在隐藏 Electron 窗口测试分片 UTF-8/CRLF、实时正文、状态面板、替换、异常和停止。

模型服务本身如果只返回一大块内容，本地无法将其变成真实的上游 token 流。ReAct 工具轮次中尚未产生最终正文时，界面会显示真实工具进度或等待状态。这个面板不是对模型隐藏推理的展示，也不额外生成模拟思考文本。执行面板目前保留在当前界面对话中，重新打开历史会话时只恢复已持久化的最终消息。

更新后需要重启 Go 后端并重新打开 Electron，两个端才能使用新事件协议。

## “流式失败”的具体原因

流式错误不一定是网络断开。例如模型服务返回 HTTP 402 时，可能是试用额度耗尽或计费尚未就绪。后端现在将同步和流式调用的这类失败统一分类，Electron 按错误码显示中英文原因与处理建议：

| 错误码 | 含义与处理 |
| --- | --- |
| `MODEL_QUOTA_EXHAUSTED` | 模型额度或计费问题；检查服务商控制台，或换用有效配置 |
| `MODEL_AUTH_FAILED` / `MODEL_ACCESS_DENIED` | 检查密钥、服务地址与目标模型权限 |
| `MODEL_RATE_LIMITED` | 请求限流；稍后再试并检查并发限制 |
| `MODEL_NOT_FOUND` / `MODEL_REQUEST_REJECTED` | 检查模型名、API 地址与参数兼容性 |
| `MODEL_UNAVAILABLE` / `AGENT_TIMEOUT` | 服务暂时不可用或等待超时；先查看已有工具记录 |
| `AGENT_STEP_LIMIT` | 本轮图步骤预算用尽；深度模式会建议拆分任务，而非再次切换到深度模式 |

错误事件保留已有正文和工具记录，不自动重放整轮处理，也不推断已执行工具没有产生结果。只返回预设错误说明与可选 `upstream_status`，不向界面转发可能包含密钥的供应商原始报错。
