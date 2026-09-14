# 可恢复的预处理任务

任务保存在 `data/neuroflow.db` 的 `agent_tasks` 表中，与会话消息使用同一 SQLite 数据库；删除会话时级联删除任务。每个会话同一时间只允许一个未完成任务，完成或取消后可建立新任务，旧任务仍留在数据库。

## 保存的内容

- 待确认字段及问题：采样率、单位、矩阵方向、通道配置、montage、事件字典，以及设备、参考和研究目标。
- 用户答案：结构化值、当前用户消息中的原话和提交时间。修正答案后审计中保留原值。
- 验证结果：MNE 重新读取的文件结构、采集配置对照结果、是否通过及失败原因。
- 执行计划：完整 `NeuroAnalysisInput`，包括 `save_output`、所选算法、时间范围和参数。
- 步骤状态：导入验证、真实分析，以及分析结果和任务事件记录。算法内部的细分步骤仍由原有 MNE 分析审计返回。

## Agent 工具与恢复顺序

新增 `manage_preprocessing_task`，操作如下：

| action | 作用 |
| --- | --- |
| start | 保存当前会话数据集的计划与问题；补充已检测到的单位、矩阵方向、事件不确定项 |
| get | 获取最新任务与 revision |
| answer | 保存当前用户明确提供的信息；清除旧验证结果 |
| validate | 重新读取候选配置，比较采集声明；不提交配置或执行分析 |
| resume | 再次验证，提交成功的导入配置，执行已保存的分析计划 |
| retry | 用户明确要求后，将失败或中断任务恢复到待验证状态 |
| cancel | 取消空闲任务；正在执行时不能通过此操作终止进程 |

除 start/get 外，操作必须携带最新 `revision`。数据库使用条件更新防止并发覆盖及重复执行。执行前先持久化运行状态；HTTP 取消后的失败结果也会尝试使用独立的短超时保存。进程重启将运行中的任务标为 interrupted，不自动重跑可能已保存文件的操作。

正常对话：用户要求处理 → Agent 保存计划并询问 → 用户补充 → Agent answer → validate → resume → 报告实际结果。用户原本已授权处理时，提示词要求验证成功后在该轮继续调用 resume，无需重复询问许可；这仍是模型驱动的工具循环，不是后台自主调度器。

答案示例：

```json
{
  "action": "answer",
  "revision": 1,
  "user_quote": "采样率250Hz，单位uV",
  "answers": {"sampling_rate_hz": 250, "unit": "uV"}
}
```

服务器核验原话确实出现在当前用户消息中，但自然语言与参数值的语义对应仍由模型提取；MNE 对时基、通道和物理约束做独立检查。设备、参考描述和研究目标作为用户声明保存，不能当作文件直接证明的事实。

## 接入位置

- `internal/server/taskstate/`：SQLite 存储、版本检查、上下文作用域、重启恢复。
- `internal/server/ai/tools/preprocessing_task.go`：工具状态机、答案与验证、执行恢复。
- `internal/server/chatServer/sqlite_memory.go`：数据库初始化和会话删除关联。
- `internal/server/chatServer/chat.go`：普通和流式聊天均注入当前任务，不依赖被压缩的历史消息。
- `internal/server/ai/agent/chat/new_react_agent.go`、`chat_template.go`：注册工具并定义询问/恢复协议。
- `internal/server/ai/tools/python_analysis.go`：有未完成任务时阻止直接工具调用绕过验证。
- `internal/handler/chat.go`、`internal/router/init.go`：`GET /sessions/:id/task` 返回最新任务；无任务时为 `{"task":null}`。

完整审计和分析结果由工具/API 按需读取，不在每一轮自动注入。问题和答案保持在上下文中，以免摘要压缩后忘记待办。

## 当前边界

本次未新增 Electron 任务面板；用户通过现有聊天提交答案，Agent 用自然语言反馈状态，前端可使用上述 GET 接口展示任务详情。真实分析复用原有结果缓存，因此原有波形预览可继续取到分析结果。

数据集注册表仍为内存存储。后端重启后任务不会丢失，但数据集 ID 失效时必须重新导入、取消旧任务并为新数据集建立计划；禁止自动把旧答案套到新句柄。尚不能为完全无法导入的文件建立此类任务。更换执行计划同样采用取消后新建，已完成任务不能重复 resume。

`save_output=false` 禁止保存预处理输出文件，但任务状态和通过验证的导入配置仍会持久化。结构确认修改的是读取配置，不覆盖原始采集数据。

## 验证

`go test ./internal/server/taskstate ./internal/server/ai/tools ./internal/server/chatServer ./internal/handler ./internal/server/ai/agent/chat`

工具集成测试使用真实 CSV/MNE，涵盖缺失答案、虚构原话、采样率冲突、答案修正、验证恢复、直接调用拦截、重复执行拦截及不保存输出。SQLite 测试覆盖重启中断恢复、答案保留、会话隔离和并发版本检查。该验证不依赖模型或 Qdrant，未替代具体模型的多轮工具调用验收。
