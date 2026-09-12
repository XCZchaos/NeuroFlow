# NF-BCI-001 数据集范式必须与任务匹配：规则

- modality: BCI
- stage: dataset
- knowledge_type: 执行规则
- review_status: seed_reviewed

只有数据集声明的事件和范式与目标处理兼容时才能纳入评估。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-002 数据集范式必须与任务匹配：前提

- modality: BCI
- stage: dataset
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“数据集范式必须与任务匹配”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-003 数据集范式必须与任务匹配：验证

- modality: BCI
- stage: dataset
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“数据集范式必须与任务匹配”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-004 数据集范式必须与任务匹配：审计

- modality: BCI
- stage: dataset
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“数据集范式必须与任务匹配”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-005 受试者列表必须显式记录：规则

- modality: BCI
- stage: dataset
- knowledge_type: 执行规则
- review_status: seed_reviewed

子集实验必须保存纳入和排除的受试者编号及理由。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-006 受试者列表必须显式记录：前提

- modality: BCI
- stage: dataset
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“受试者列表必须显式记录”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-007 受试者列表必须显式记录：验证

- modality: BCI
- stage: dataset
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“受试者列表必须显式记录”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-008 受试者列表必须显式记录：审计

- modality: BCI
- stage: dataset
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“受试者列表必须显式记录”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-009 会话数量决定可用评估：规则

- modality: BCI
- stage: dataset
- knowledge_type: 执行规则
- review_status: seed_reviewed

少于两个会话的数据集不能用于标准跨会话评估。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-010 会话数量决定可用评估：前提

- modality: BCI
- stage: dataset
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“会话数量决定可用评估”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-011 会话数量决定可用评估：验证

- modality: BCI
- stage: dataset
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“会话数量决定可用评估”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-012 会话数量决定可用评估：审计

- modality: BCI
- stage: dataset
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“会话数量决定可用评估”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-013 多数据集合并需处理通道差异：规则

- modality: BCI
- stage: dataset
- knowledge_type: 执行规则
- review_status: seed_reviewed

采用通道交集或并集必须显式选择，并验证缺失通道处理。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-014 多数据集合并需处理通道差异：前提

- modality: BCI
- stage: dataset
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“多数据集合并需处理通道差异”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-015 多数据集合并需处理通道差异：验证

- modality: BCI
- stage: dataset
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“多数据集合并需处理通道差异”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-016 多数据集合并需处理通道差异：审计

- modality: BCI
- stage: dataset
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“多数据集合并需处理通道差异”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-017 范式定义事件到试次的转换：规则

- modality: BCI
- stage: paradigm
- knowledge_type: 执行规则
- review_status: seed_reviewed

频带、事件、时间窗、通道和重采样应由范式配置统一管理。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-018 范式定义事件到试次的转换：前提

- modality: BCI
- stage: paradigm
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“范式定义事件到试次的转换”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-019 范式定义事件到试次的转换：验证

- modality: BCI
- stage: paradigm
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“范式定义事件到试次的转换”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-020 范式定义事件到试次的转换：审计

- modality: BCI
- stage: paradigm
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“范式定义事件到试次的转换”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-021 运动想象类别必须来自事件语义：规则

- modality: BCI
- stage: motor_imagery
- knowledge_type: 执行规则
- review_status: seed_reviewed

左右手、足和舌等类别不能从整数编码顺序猜测。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-022 运动想象类别必须来自事件语义：前提

- modality: BCI
- stage: motor_imagery
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“运动想象类别必须来自事件语义”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-023 运动想象类别必须来自事件语义：验证

- modality: BCI
- stage: motor_imagery
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“运动想象类别必须来自事件语义”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-024 运动想象类别必须来自事件语义：审计

- modality: BCI
- stage: motor_imagery
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“运动想象类别必须来自事件语义”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-025 二分类与多分类指标应区分：规则

- modality: BCI
- stage: motor_imagery
- knowledge_type: 执行规则
- review_status: seed_reviewed

类别数变化会影响默认评分和随机基线，结果必须标明类别集合。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-026 二分类与多分类指标应区分：前提

- modality: BCI
- stage: motor_imagery
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“二分类与多分类指标应区分”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-027 二分类与多分类指标应区分：验证

- modality: BCI
- stage: motor_imagery
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“二分类与多分类指标应区分”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-028 二分类与多分类指标应区分：审计

- modality: BCI
- stage: motor_imagery
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“二分类与多分类指标应区分”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-029 滤波器组选择必须在训练内完成：规则

- modality: BCI
- stage: motor_imagery
- knowledge_type: 执行规则
- review_status: seed_reviewed

用于选择运动想象子频带的验证不得查看测试折。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/auto_examples/advanced_examples/plot_pre_processing_steps.html

# NF-BCI-030 滤波器组选择必须在训练内完成：前提

- modality: BCI
- stage: motor_imagery
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“滤波器组选择必须在训练内完成”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/auto_examples/advanced_examples/plot_pre_processing_steps.html

# NF-BCI-031 滤波器组选择必须在训练内完成：验证

- modality: BCI
- stage: motor_imagery
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“滤波器组选择必须在训练内完成”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/auto_examples/advanced_examples/plot_pre_processing_steps.html

# NF-BCI-032 滤波器组选择必须在训练内完成：审计

- modality: BCI
- stage: motor_imagery
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“滤波器组选择必须在训练内完成”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/auto_examples/advanced_examples/plot_pre_processing_steps.html

# NF-BCI-033 P300 使用 Target/NonTarget 语义：规则

- modality: BCI
- stage: p300
- knowledge_type: 执行规则
- review_status: seed_reviewed

原始事件必须可靠映射为目标与非目标，不能按编号大小猜测。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-034 P300 使用 Target/NonTarget 语义：前提

- modality: BCI
- stage: p300
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“P300 使用 Target/NonTarget 语义”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-035 P300 使用 Target/NonTarget 语义：验证

- modality: BCI
- stage: p300
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“P300 使用 Target/NonTarget 语义”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-036 P300 使用 Target/NonTarget 语义：审计

- modality: BCI
- stage: p300
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“P300 使用 Target/NonTarget 语义”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-037 P300 类不平衡需合适指标：规则

- modality: BCI
- stage: p300
- knowledge_type: 执行规则
- review_status: seed_reviewed

应报告类别分布，并优先采用预先指定的 ROC-AUC 等适合不平衡任务的指标。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-038 P300 类不平衡需合适指标：前提

- modality: BCI
- stage: p300
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“P300 类不平衡需合适指标”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-039 P300 类不平衡需合适指标：验证

- modality: BCI
- stage: p300
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“P300 类不平衡需合适指标”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-040 P300 类不平衡需合适指标：审计

- modality: BCI
- stage: p300
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“P300 类不平衡需合适指标”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-041 P300 Epoch 窗口由响应目标决定：规则

- modality: BCI
- stage: p300
- knowledge_type: 执行规则
- review_status: seed_reviewed

时间窗和基线必须匹配刺激锁时响应并在所有比较中保持一致。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-042 P300 Epoch 窗口由响应目标决定：前提

- modality: BCI
- stage: p300
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“P300 Epoch 窗口由响应目标决定”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-043 P300 Epoch 窗口由响应目标决定：验证

- modality: BCI
- stage: p300
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“P300 Epoch 窗口由响应目标决定”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-044 P300 Epoch 窗口由响应目标决定：审计

- modality: BCI
- stage: p300
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“P300 Epoch 窗口由响应目标决定”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-045 SSVEP 类别应对应刺激频率或事件：规则

- modality: BCI
- stage: ssvep
- knowledge_type: 执行规则
- review_status: seed_reviewed

类别映射必须从数据集事件定义读取。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-046 SSVEP 类别应对应刺激频率或事件：前提

- modality: BCI
- stage: ssvep
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“SSVEP 类别应对应刺激频率或事件”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-047 SSVEP 类别应对应刺激频率或事件：验证

- modality: BCI
- stage: ssvep
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“SSVEP 类别应对应刺激频率或事件”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-048 SSVEP 类别应对应刺激频率或事件：审计

- modality: BCI
- stage: ssvep
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“SSVEP 类别应对应刺激频率或事件”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-049 SSVEP 滤波器组必须覆盖目标频率：规则

- modality: BCI
- stage: ssvep
- knowledge_type: 执行规则
- review_status: seed_reviewed

滤波器及谐波设计要依据实际刺激频率和采样率。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-050 SSVEP 滤波器组必须覆盖目标频率：前提

- modality: BCI
- stage: ssvep
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“SSVEP 滤波器组必须覆盖目标频率”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-051 SSVEP 滤波器组必须覆盖目标频率：验证

- modality: BCI
- stage: ssvep
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“SSVEP 滤波器组必须覆盖目标频率”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-052 SSVEP 滤波器组必须覆盖目标频率：审计

- modality: BCI
- stage: ssvep
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“SSVEP 滤波器组必须覆盖目标频率”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-053 单带与滤波器组应公平比较：规则

- modality: BCI
- stage: ssvep
- knowledge_type: 执行规则
- review_status: seed_reviewed

比较时必须使用相同试次、划分和评价指标。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-054 单带与滤波器组应公平比较：前提

- modality: BCI
- stage: ssvep
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“单带与滤波器组应公平比较”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-055 单带与滤波器组应公平比较：验证

- modality: BCI
- stage: ssvep
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“单带与滤波器组应公平比较”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-056 单带与滤波器组应公平比较：审计

- modality: BCI
- stage: ssvep
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“单带与滤波器组应公平比较”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-057 cVEP 编码由数据集实验定义：规则

- modality: BCI
- stage: cvep
- knowledge_type: 执行规则
- review_status: seed_reviewed

码序列、事件和类别不能从另一个 cVEP 数据集迁移假设。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-058 cVEP 编码由数据集实验定义：前提

- modality: BCI
- stage: cvep
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“cVEP 编码由数据集实验定义”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-059 cVEP 编码由数据集实验定义：验证

- modality: BCI
- stage: cvep
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“cVEP 编码由数据集实验定义”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-060 cVEP 编码由数据集实验定义：审计

- modality: BCI
- stage: cvep
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“cVEP 编码由数据集实验定义”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-061 cVEP 时间窗要与刺激编码对齐：规则

- modality: BCI
- stage: cvep
- knowledge_type: 执行规则
- review_status: seed_reviewed

Epoch 起点和长度必须与码序列时序一致。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-062 cVEP 时间窗要与刺激编码对齐：前提

- modality: BCI
- stage: cvep
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“cVEP 时间窗要与刺激编码对齐”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-063 cVEP 时间窗要与刺激编码对齐：验证

- modality: BCI
- stage: cvep
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“cVEP 时间窗要与刺激编码对齐”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-064 cVEP 时间窗要与刺激编码对齐：审计

- modality: BCI
- stage: cvep
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“cVEP 时间窗要与刺激编码对齐”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-065 所有学习型预处理必须进入 Pipeline：规则

- modality: BCI
- stage: pipeline
- knowledge_type: 执行规则
- review_status: seed_reviewed

标准化、对齐、特征选择和分类器应在每个训练折内拟合。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/auto_examples/advanced_examples/plot_pre_processing_steps.html

# NF-BCI-066 所有学习型预处理必须进入 Pipeline：前提

- modality: BCI
- stage: pipeline
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“所有学习型预处理必须进入 Pipeline”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/auto_examples/advanced_examples/plot_pre_processing_steps.html

# NF-BCI-067 所有学习型预处理必须进入 Pipeline：验证

- modality: BCI
- stage: pipeline
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“所有学习型预处理必须进入 Pipeline”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/auto_examples/advanced_examples/plot_pre_processing_steps.html

# NF-BCI-068 所有学习型预处理必须进入 Pipeline：审计

- modality: BCI
- stage: pipeline
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“所有学习型预处理必须进入 Pipeline”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/auto_examples/advanced_examples/plot_pre_processing_steps.html

# NF-BCI-069 Raw、Epoch 和 Array 步骤不能混淆：规则

- modality: BCI
- stage: pipeline
- knowledge_type: 执行规则
- review_status: seed_reviewed

自定义处理步骤应放在其接受的数据层级上，并验证输入输出形状。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/auto_examples/advanced_examples/plot_pre_processing_steps.html

# NF-BCI-070 Raw、Epoch 和 Array 步骤不能混淆：前提

- modality: BCI
- stage: pipeline
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“Raw、Epoch 和 Array 步骤不能混淆”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/auto_examples/advanced_examples/plot_pre_processing_steps.html

# NF-BCI-071 Raw、Epoch 和 Array 步骤不能混淆：验证

- modality: BCI
- stage: pipeline
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“Raw、Epoch 和 Array 步骤不能混淆”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/auto_examples/advanced_examples/plot_pre_processing_steps.html

# NF-BCI-072 Raw、Epoch 和 Array 步骤不能混淆：审计

- modality: BCI
- stage: pipeline
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“Raw、Epoch 和 Array 步骤不能混淆”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/auto_examples/advanced_examples/plot_pre_processing_steps.html

# NF-BCI-073 缓存键必须反映处理配置：规则

- modality: BCI
- stage: pipeline
- knowledge_type: 执行规则
- review_status: seed_reviewed

改变范式、预处理或数据版本后不得误用旧缓存结果。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-074 缓存键必须反映处理配置：前提

- modality: BCI
- stage: pipeline
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“缓存键必须反映处理配置”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-075 缓存键必须反映处理配置：验证

- modality: BCI
- stage: pipeline
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“缓存键必须反映处理配置”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-076 缓存键必须反映处理配置：审计

- modality: BCI
- stage: pipeline
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“缓存键必须反映处理配置”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-077 同会话评估只代表同会话泛化：规则

- modality: BCI
- stage: evaluation
- knowledge_type: 执行规则
- review_status: seed_reviewed

WithinSession 结果不能直接声称跨天或跨受试者有效。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-078 同会话评估只代表同会话泛化：前提

- modality: BCI
- stage: evaluation
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“同会话评估只代表同会话泛化”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-079 同会话评估只代表同会话泛化：验证

- modality: BCI
- stage: evaluation
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“同会话评估只代表同会话泛化”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-080 同会话评估只代表同会话泛化：审计

- modality: BCI
- stage: evaluation
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“同会话评估只代表同会话泛化”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-081 跨会话评估按会话留出：规则

- modality: BCI
- stage: evaluation
- knowledge_type: 执行规则
- review_status: seed_reviewed

测试会话不能参与训练、参数选择或校准，除非协议明确允许。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-082 跨会话评估按会话留出：前提

- modality: BCI
- stage: evaluation
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“跨会话评估按会话留出”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-083 跨会话评估按会话留出：验证

- modality: BCI
- stage: evaluation
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“跨会话评估按会话留出”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-084 跨会话评估按会话留出：审计

- modality: BCI
- stage: evaluation
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“跨会话评估按会话留出”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-085 跨受试者评估按受试者留出：规则

- modality: BCI
- stage: evaluation
- knowledge_type: 执行规则
- review_status: seed_reviewed

测试受试者数据不能进入训练拟合，目标校准协议必须单独声明。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-086 跨受试者评估按受试者留出：前提

- modality: BCI
- stage: evaluation
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“跨受试者评估按受试者留出”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-BCI-087 跨受试者评估按受试者留出：验证

- modality: BCI
- stage: evaluation
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“跨受试者评估按受试者留出”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html
