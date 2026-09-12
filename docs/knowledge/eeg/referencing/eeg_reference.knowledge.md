# MNE-EEG-005 EEG 参考选择必须记录原参考信息

- modality: EEG
- stage: referencing
- knowledge_type: decision
- review_status: seed_reviewed

EEG 电位是相对于参考点测量的，重新参考会改变所有 EEG 通道。Agent 在选择平均参考、指定通道参考或投影参考前，应读取原始参考说明、通道类型、坏道状态和研究目标。平均参考不是所有记录的无条件默认答案。

验证：保存原参考、目标参考、参与参考计算的通道、排除坏道以及处理后的通道均值或投影状态。

来源：MNE-Python 官方 Setting the EEG reference 教程，https://mne.tools/stable/auto_tutorials/preprocessing/55_setting_eeg_reference.html

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
