# MNE-EEG-007 分段前必须验证事件编码的语义

- modality: EEG
- paradigm: ERP, P300, motor imagery, SSVEP, cVEP
- stage: epoching
- software: MNE-Python
- knowledge_type: constraint
- review_status: seed_reviewed

创建 Epoch 前，应将事件码或注释名称映射为实验条件，并核对各类事件的数量和时间位置。`event_id` 只选择事件，不能证明标签语义正确；未知语义时，Agent 应暂停自动分段并报告缺失信息。

适用条件：事件相关分析。限制：连续静息态数据可以没有事件。验证：输出事件映射、每类计数、最早和最晚事件时间，并抽查原始标注。

来源：MNE-Python 官方 `mne.Epochs` 文档，https://mne.tools/stable/generated/mne.Epochs.html

# MNE-EEG-008 Epoch 时间窗必须由范式和目标成分决定

- modality: EEG
- paradigm: ERP, P300, motor imagery, SSVEP, cVEP
- stage: epoching
- software: MNE-Python
- knowledge_type: decision
- review_status: seed_reviewed

`tmin` 和 `tmax` 应覆盖目标神经反应及所需基线，并避免越过相邻试次或记录边界。软件默认值只能作为实现信息，Agent 不应在缺少范式时自动宣称某个时间窗最优。

验证：报告窗口长度、事件间隔冲突数、越界 Epoch 数和最终保留数。

来源：MNE-Python 官方 `mne.Epochs` 文档，https://mne.tools/stable/generated/mne.Epochs.html

# MNE-EEG-009 基线校正参数必须显式记录

- modality: EEG
- paradigm: ERP, P300
- stage: epoching
- software: MNE-Python
- knowledge_type: audit
- review_status: seed_reviewed

基线校正会用指定区间的统计量调整每个 Epoch。它与高通滤波和去趋势不是同一操作；Agent 必须记录基线区间或明确记录未使用基线校正。

限制：基线区间若包含刺激反应或伪迹会引入偏差。验证：检查区间位于 Epoch 内，比较校正前后的基线均值，并保留参数日志。

来源：MNE-Python 官方 `mne.Epochs` 文档，https://mne.tools/stable/generated/mne.Epochs.html

# MNE-EEG-010 分段时应处理 bad 注释重叠

- modality: EEG
- paradigm: event-related
- stage: epoching
- software: MNE-Python
- knowledge_type: quality_control
- review_status: seed_reviewed

当 `reject_by_annotation=True` 时，与描述以 `bad` 开头的时间段重叠的 Epoch 会被拒绝。Agent 应保留这一行为或明确说明为何关闭，不能静默纳入已知污染区间。

验证：报告因注释被删除的 Epoch 数量、原因分布和 `drop_log` 摘要。

来源：MNE-Python 官方 `mne.Epochs` 文档，https://mne.tools/stable/generated/mne.Epochs.html
