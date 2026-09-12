# EEGLAB-EEG-001 连续数据通常应在分段前滤波

- modality: EEG
- stage: filtering
- software: EEGLAB
- review_status: seed_reviewed

EEGLAB 官方教程通常建议在 Epoch 和伪迹剔除前对连续数据滤波，因为逐 Epoch 滤波会在每个分段边界引入潜在伪迹。对存在巨大尖峰的数据，可以先移除明显严重片段，避免滤波把局部伪迹扩散到邻近时间。

验证：检查 boundary 事件、滤波边缘、通道频谱以及目标频段是否保留。

来源：EEGLAB 官方 Filtering 教程，https://eeglab.org/tutorials/05_Preprocess/Filtering.html

# EEGLAB-EEG-002 过窄过渡带可能增加滤波伪迹

- modality: EEG
- stage: filtering
- software: EEGLAB
- review_status: seed_reviewed

滤波器过渡带越窄，通常需要越高阶或越长的滤波器，并可能增加振铃等时域影响。EEGLAB 建议在不侵入目标信号的前提下尽量使用较宽、较缓的过渡带。Agent 不能只记录截止频率，还应记录滤波器类型、阶数或长度、过渡带和相位方式。

验证：显示频率响应，检查频谱波纹和时域振铃。

来源：EEGLAB 官方 Filtering 教程，https://eeglab.org/tutorials/05_Preprocess/Filtering.html

# EEGLAB-EEG-003 连接和因果分析需要特殊评估滤波

- modality: EEG
- paradigm: connectivity
- stage: filtering
- software: EEGLAB
- review_status: seed_reviewed

高通和零相位滤波会改变相邻时间样本之间的依赖关系，因此连接或因果分析不能直接沿用普通 ERP、频谱任务的滤波策略。EEGLAB 文档建议这类任务考虑分段去趋势或因果滤波等替代方案，并明确相位延迟和模型假设。

限制：Agent 在不知道下游是否进行连接或因果分析时，不应自动套用标准带通。

来源：EEGLAB 官方 Filtering for connectivity analysis，https://eeglab.org/tutorials/05_Preprocess/Filtering.html

# EEGLAB-EEG-004 坏道应在平均参考前处理

- modality: EEG
- stage: referencing
- software: EEGLAB
- review_status: seed_reviewed

异常通道会污染平均参考。EEGLAB 关于重参考的说明指出，PREP 会迭代移除偏差过大的通道并重新计算参考；如果已经用 clean_rawdata 处理坏道，则不必重复相同步骤。Agent 在平均参考前应先确认坏道状态和参与参考的通道集合。

验证：记录参考前坏道、参考通道集合以及参考后通道分布。

来源：EEGLAB 官方 Re-referencing 教程，https://eeglab.org/tutorials/05_Preprocess/rereferencing.html

# EEGLAB-EEG-005 Huber 均值参考不应在 ICA 前使用

- modality: EEG
- stage: referencing, ICA
- software: EEGLAB
- review_status: seed_reviewed

EEGLAB 文档明确提醒，Huber 均值属于非线性稳健参考，会违反 ICA 的线性假设，因此最好在 ICA 之后应用。Agent 如果计划执行 ICA，不应先使用 Huber 均值参考；需要稳健参考时应记录处理顺序和选择理由。

验证：检查 ICA 前处理历史中不存在非线性参考步骤。

来源：EEGLAB 官方 Re-referencing 教程，https://eeglab.org/tutorials/05_Preprocess/rereferencing.html

# EEGLAB-EEG-006 ICA 需要足够且相对干净的数据

- modality: EEG
- stage: ICA
- software: EEGLAB
- review_status: seed_reviewed

ICA 在拥有较多、基本同分布且相对干净的数据时表现更好。严重而非重复性的运动、通道爆发和电极跳变会消耗分解自由度；眨眼等重复伪迹可以保留给 ICA 分离。数据不足时，减少 PCA/ICA 维数可能比强行估计完整通道数成分更可靠。

验证：记录用于拟合的有效时长、通道数、数据秩、剔除片段和收敛结果。

来源：EEGLAB 官方 Run ICA 教程，https://eeglab.org/tutorials/06_RejectArtifacts/RunICA.html

# EEGLAB-EEG-007 自动 ICA 标签不能替代人工证据检查

- modality: EEG
- stage: artifact_correction
- software: EEGLAB
- review_status: seed_reviewed

ICLabel 为脑、眼、肌肉、心脏、工频、通道噪声等类别提供概率估计。概率是辅助证据，不应只凭类别标签自动删除边界不清的成分。Agent 应联合类别概率、头皮图、时序、频谱以及 EOG/ECG 相关性，并保守处理不确定成分。

验证：保存每个被排除成分的证据、阈值和处理前后质量比较。

来源：EEGLAB 官方 Run ICA 教程，https://eeglab.org/tutorials/06_RejectArtifacts/RunICA.html

# EEGLAB-EEG-008 Clean Rawdata 可能同时改变通道和时间段

- modality: EEG
- stage: artifact_rejection
- software: EEGLAB
- review_status: seed_reviewed

EEGLAB 的 Clean Rawdata/ASR 工作流可以识别坏道和坏时间段，并包含多个顺序执行的步骤。默认设置或示例阈值不能在缺少记录的情况下直接迁移到所有数据。Agent 必须分别报告被删除的通道、时间比例、ASR 参数和重建范围。

验证：比较处理前后数据长度、通道集合、振幅分布和下游任务性能。

来源：EEGLAB 官方 Clean Rawdata 教程，https://eeglab.org/tutorials/06_RejectArtifacts/cleanrawdata.html
