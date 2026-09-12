# GENERAL-AUDIT-001 请求参数和实际参数必须同时保存

- modality: EEG, MEG, fNIRS
- stage: audit
- knowledge_type: requirement
- review_status: seed_reviewed

Agent 可能因为 Nyquist、数据长度或质量约束调整用户参数。审计记录必须同时保存请求值、实际值、调整原因和证据，不能只保留最终参数。未经执行的建议不得写成已完成步骤。

验证：每个自动调整都能追溯到规则、数据事实或人工确认。

来源：NeuroFlow 可验证执行规则；方法基础参考 MNE preprocessing，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# GENERAL-AUDIT-002 步骤状态必须区分完成、跳过、降级和失败

- modality: EEG, MEG, fNIRS
- stage: audit
- knowledge_type: requirement
- review_status: seed_reviewed

执行计划中的步骤至少应区分 `completed`、`skipped`、`degraded` 和 `failed`。只有 `completed` 可以描述为成功执行；`degraded` 必须说明替代路径，`skipped` 必须说明缺失条件，`failed` 必须保留错误信息和最后有效结果。

验证：最终自然语言回答与机器审计记录逐项一致。

来源：NeuroFlow Agent 执行与证据规则。
