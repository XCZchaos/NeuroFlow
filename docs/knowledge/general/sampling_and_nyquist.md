# GENERAL-SAMPLING-001 Nyquist 频率限制可表示的最高频率

- modality: EEG, MEG, fNIRS
- stage: sampling
- knowledge_type: constraint
- review_status: seed_reviewed

采样率为 `sfreq` 时，Nyquist 频率为 `sfreq / 2`。数字信号无法无歧义地表示高于该频率的成分，因此低通截止和目标分析频率必须低于 Nyquist。Agent 应先读取真实采样率，再校验用户要求的滤波范围。

验证：记录原采样率、Nyquist、请求截止频率和实际采用值。

来源：MNE-Python 官方 Filtering and resampling data，https://mne.tools/stable/auto_tutorials/preprocessing/30_filtering_resampling.html

# GENERAL-SAMPLING-002 降采样必须控制混叠与事件偏移

- modality: EEG, MEG, fNIRS
- stage: resampling
- knowledge_type: constraint
- review_status: seed_reviewed

降采样会减少时间点，也可能改变事件样本位置。执行前必须确保目标采样率足以覆盖目标频段，并采用抗混叠处理；事件相关任务还要同步更新事件位置。不能只验证输出数组大小。

验证：检查输出采样率、事件时间误差、频谱混叠和数据时长。

来源：MNE-Python 官方 Filtering and resampling data，https://mne.tools/stable/auto_tutorials/preprocessing/30_filtering_resampling.html
