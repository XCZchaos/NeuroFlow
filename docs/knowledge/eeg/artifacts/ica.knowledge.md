# MNE-EEG-002 ICA 拟合前应控制低频漂移

- modality: EEG, MEG
- stage: ICA
- knowledge_type: algorithm
- review_status: seed_reviewed

MNE 官方 ICA 文档指出 ICA 对低频漂移敏感，拟合 ICA 的数据通常应先高通；文档给出的典型参考截止频率为 1 Hz。这个数值是 ICA 拟合数据的常见参考，不代表最终分析数据必须使用相同高通。Agent 应记录 ICA 拟合副本与最终应用数据的滤波差异。

适用条件：准备在 Raw 或 Epochs 上拟合 ICA。验证：检查 ICA 收敛状态、成分拓扑、时序和伪迹通道相关性。

来源：MNE-Python `mne.preprocessing.ICA` 官方 API，https://mne.tools/stable/generated/mne.preprocessing.ICA.html

# MNE-EEG-003 ICA 维数必须考虑数据秩

- modality: EEG
- stage: ICA
- knowledge_type: constraint
- review_status: seed_reviewed

平均参考和坏道插值会降低数据有效秩。MNE 建议对秩亏数据相应减少 ICA 维数，例如平均参考通常减少一个自由度，每个独立插值通道可能进一步降低秩。Agent 在执行 ICA 前应估计数据秩，而不是始终将成分数设置为通道数。

限制：实际秩还会受投影、通道相关性和其他处理影响。验证：记录估计秩、ICA 成分数、收敛状态与被排除成分。

来源：MNE-Python `mne.preprocessing.ICA` 官方 API，https://mne.tools/stable/generated/mne.preprocessing.ICA.html

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
