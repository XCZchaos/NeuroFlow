# MNE-FNIRS-001 强度数据先转换为光密度

- modality: fNIRS
- stage: optical_density
- knowledge_type: workflow
- review_status: seed_reviewed

连续波 fNIRS 的原始光强数据通常先转换为光密度，再进行头皮耦合质量检查、运动伪迹校正和血红蛋白浓度转换。Agent 必须根据当前通道类型判断数据是否已经是光密度，避免重复转换。

验证：转换前后通道类型、波长配对、有限数值比例和处理审计记录。

来源：MNE-Python 官方 Preprocessing functional near-infrared spectroscopy data 教程，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html
