# MNE-EEG-001 滤波必须根据分析目标评估失真

- modality: EEG, MEG
- stage: filtering
- knowledge_type: general
- review_status: seed_reviewed

滤波可以提高信噪比，也可能改变信号的时间过程和振幅。选择截止频率时必须同时考虑通带波纹、阻带衰减、过渡带、滤波器长度和时域振铃。Agent 不应把固定频段描述成所有 EEG 任务的通用最优参数。

适用条件：已知采样率、目标频段和下游分析任务。限制：ERP、慢波和连接分析尤其需要评估滤波导致的时域改变。验证：比较处理前后功率谱、目标波形和边缘区间。

来源：MNE-Python 官方 Background information on filtering，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

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

# MNE-EEG-004 坏道插值依赖正确的传感器位置

- modality: EEG, MEG
- stage: bad_channel_interpolation
- knowledge_type: constraint
- review_status: seed_reviewed

坏道插值不是单纯替换异常数值，它依赖通道类型和传感器空间信息。Agent 只有在坏道已经可靠标记且所需位置数据可用时才能自动插值；缺少坐标时应保留坏道标记并提示人工处理，不能声称插值成功。

验证：确认插值步骤状态、通道位置可用性、插值前后的坏道列表及局部波形连续性。

来源：MNE-Python 官方 Handling bad channels 教程，https://mne.tools/stable/auto_tutorials/preprocessing/15_handling_bad_channels.html

# MNE-EEG-005 EEG 参考选择必须记录原参考信息

- modality: EEG
- stage: referencing
- knowledge_type: decision
- review_status: seed_reviewed

EEG 电位是相对于参考点测量的，重新参考会改变所有 EEG 通道。Agent 在选择平均参考、指定通道参考或投影参考前，应读取原始参考说明、通道类型、坏道状态和研究目标。平均参考不是所有记录的无条件默认答案。

验证：保存原参考、目标参考、参与参考计算的通道、排除坏道以及处理后的通道均值或投影状态。

来源：MNE-Python 官方 Setting the EEG reference 教程，https://mne.tools/stable/auto_tutorials/preprocessing/55_setting_eeg_reference.html

# MNE-EEG-006 重采样必须保护频谱和事件时序

- modality: EEG, MEG
- stage: resampling
- knowledge_type: constraint
- review_status: seed_reviewed

降采样前必须避免混叠。MNE 的重采样方法包含抗混叠低通，但在连续 Raw 上重采样可能影响事件时序精度，在 Epoch 后处理又可能在每个 Epoch 边缘产生滤波效应。Agent 应结合事件精度和 Epoch 设计选择重采样位置，并同步处理事件数组。

验证：检查新采样率、Nyquist 约束、事件样本偏移以及 Epoch 边界波形。

来源：MNE-Python 官方 Filtering and resampling data 教程，https://mne.tools/stable/auto_tutorials/preprocessing/30_filtering_resampling.html
