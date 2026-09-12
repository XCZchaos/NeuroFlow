# EEGLAB-EEG-008 Clean Rawdata 可能同时改变通道和时间段

- modality: EEG
- stage: artifact_rejection
- software: EEGLAB
- review_status: seed_reviewed

EEGLAB 的 Clean Rawdata/ASR 工作流可以识别坏道和坏时间段，并包含多个顺序执行的步骤。默认设置或示例阈值不能在缺少记录的情况下直接迁移到所有数据。Agent 必须分别报告被删除的通道、时间比例、ASR 参数和重建范围。

验证：比较处理前后数据长度、通道集合、振幅分布和下游任务性能。

来源：EEGLAB 官方 Clean Rawdata 教程，https://eeglab.org/tutorials/06_RejectArtifacts/cleanrawdata.html
