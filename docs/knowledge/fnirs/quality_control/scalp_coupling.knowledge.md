# MNE-FNIRS-002 SCI 阈值是数据相关的质量判据

- modality: fNIRS
- stage: quality_control
- knowledge_type: decision
- review_status: seed_reviewed

Scalp Coupling Index 用于评估光极与头皮的耦合质量。MNE 教程示例将 SCI 小于 0.5 的通道标记为坏道，但这是示例数据中的操作，不应被 Agent 当成所有设备和任务的固定阈值。阈值应结合设备、波长、通道距离、信号分布和实验 SOP 确认。

验证：保存 SCI 分布、采用阈值、被标记通道和人工复核结论。

来源：MNE-Python 官方 fNIRS preprocessing 教程，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html
