# MNE-MEG-006 心电和眼动伪迹处理必须保留成分证据

- modality: MEG
- stage: artifact_removal
- software: MNE-Python
- knowledge_type: quality_control
- review_status: seed_reviewed

MEG 的 ECG/EOG 伪迹可用 SSP 或 ICA 建模，但自动选择投影或成分后必须保存评分、拓扑图和时间序列依据。Agent 不应只因成分与辅助通道相关就无条件删除。

验证：比较处理前后 ECG/EOG 锁时平均、目标神经波形、频谱和有效数据秩。

来源：MNE-Python 官方预处理示例索引，https://mne.tools/stable/auto_examples/preprocessing/index.html
