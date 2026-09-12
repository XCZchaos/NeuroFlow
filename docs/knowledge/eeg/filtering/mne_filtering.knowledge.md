# MNE-EEG-001 滤波必须根据分析目标评估失真

- modality: EEG, MEG
- stage: filtering
- knowledge_type: general
- review_status: seed_reviewed

滤波可以提高信噪比，也可能改变信号的时间过程和振幅。选择截止频率时必须同时考虑通带波纹、阻带衰减、过渡带、滤波器长度和时域振铃。Agent 不应把固定频段描述成所有 EEG 任务的通用最优参数。

适用条件：已知采样率、目标频段和下游分析任务。限制：ERP、慢波和连接分析尤其需要评估滤波导致的时域改变。验证：比较处理前后功率谱、目标波形和边缘区间。

来源：MNE-Python 官方 Background information on filtering，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# MNE-EEG-006 重采样必须保护频谱和事件时序

- modality: EEG, MEG
- stage: resampling
- knowledge_type: constraint
- review_status: seed_reviewed

降采样前必须避免混叠。MNE 的重采样方法包含抗混叠低通，但在连续 Raw 上重采样可能影响事件时序精度，在 Epoch 后处理又可能在每个 Epoch 边缘产生滤波效应。Agent 应结合事件精度和 Epoch 设计选择重采样位置，并同步处理事件数组。

验证：检查新采样率、Nyquist 约束、事件样本偏移以及 Epoch 边界波形。

来源：MNE-Python 官方 Filtering and resampling data 教程，https://mne.tools/stable/auto_tutorials/preprocessing/30_filtering_resampling.html
