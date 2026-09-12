# MOABB-BCI-011 cVEP 事件类别必须来自数据集定义

- modality: EEG
- paradigm: cVEP
- stage: epoching
- software: MOABB
- knowledge_type: constraint
- review_status: seed_reviewed

cVEP 的刺激编码和事件类别由具体数据集与实验设计决定。Agent 应读取数据集事件定义后再配置 `events` 和类别数量，不能把某个数据集的编码方案当成通用规则。

验证：检查事件集合、每类试次数、刺激周期与 Epoch 边界是否一致。

来源：MOABB 官方 API 与主要概念，https://moabb.neurotechx.com/docs/api.html

# MOABB-BCI-012 单频带和滤波器组是可比较的 cVEP 配置

- modality: EEG
- paradigm: cVEP
- stage: filtering
- software: MOABB
- knowledge_type: decision
- review_status: seed_reviewed

MOABB 分别提供 `CVEP` 单带通范式和 `FilterBankCVEP` 滤波器组范式。Agent 应把二者作为候选配置，根据训练数据内的验证结果选择，不能假设滤波器组必然更好。

验证：保持相同数据划分和评价指标比较候选配置，并把参数选择限制在训练折内。

来源：MOABB 官方 API 与主要概念，https://moabb.neurotechx.com/docs/api.html

# MOABB-BCI-013 cVEP 评估必须按目标泛化层级分组

- modality: EEG
- paradigm: cVEP
- stage: evaluation
- software: MOABB
- knowledge_type: evaluation
- review_status: seed_reviewed

评估应根据目标明确选择同会话、跨会话或跨受试者划分。属于同一受试者或会话的相关样本不得跨越不允许的训练测试边界，所有特征选择和调参必须只使用训练部分。

验证：输出每折 subject、session 和 trial 分组，检查交集为空，并固定随机种子。

来源：MOABB 官方 Evaluations 文档，https://moabb.neurotechx.com/docs/api.html#evaluations
