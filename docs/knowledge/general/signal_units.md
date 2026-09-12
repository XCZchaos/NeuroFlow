# GENERAL-UNITS-001 参数与信号值必须携带单位

- modality: EEG, MEG, fNIRS
- stage: metadata_validation
- knowledge_type: constraint
- review_status: seed_reviewed

Agent 不应只报告无单位数值。频率使用 Hz，时间使用秒或明确的毫秒，采样率使用 Hz；EEG、MEG 和 fNIRS 的信号单位必须从读取器元数据或明确转换步骤获得。显示缩放单位不能被误当成底层存储单位。

验证：每个阈值、统计量和导出列都带单位，并记录任何缩放或单位转换。

来源：MNE-Python 官方 Raw 数据结构说明，https://mne.tools/stable/generated/mne.io.Raw.html

# GENERAL-UNITS-002 跨模态振幅阈值不能直接复用

- modality: EEG, MEG, fNIRS
- stage: quality_control
- knowledge_type: constraint
- review_status: seed_reviewed

EEG 电位、MEG 磁场/梯度以及 fNIRS 光强、光密度、HbO/HbR 使用不同物理量和尺度。同一个数值阈值不能跨通道类型复用。Agent 在坏道或振幅异常判断前必须按通道类型分组，并确认当前数据阶段和单位。

验证：质量报告按通道类型分别列出阈值、单位和异常比例。

来源：MNE-Python 官方数据结构与通道类型文档，https://mne.tools/stable/auto_tutorials/intro/20_events_from_raw.html
