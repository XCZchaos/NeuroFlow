# MNE-FNIRS-001 强度数据先转换为光密度

- modality: fNIRS
- stage: optical_density
- knowledge_type: workflow
- review_status: seed_reviewed

连续波 fNIRS 的原始光强数据通常先转换为光密度，再进行头皮耦合质量检查、运动伪迹校正和血红蛋白浓度转换。Agent 必须根据当前通道类型判断数据是否已经是光密度，避免重复转换。

验证：转换前后通道类型、波长配对、有限数值比例和处理审计记录。

来源：MNE-Python 官方 Preprocessing functional near-infrared spectroscopy data 教程，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# MNE-FNIRS-002 SCI 阈值是数据相关的质量判据

- modality: fNIRS
- stage: quality_control
- knowledge_type: decision
- review_status: seed_reviewed

Scalp Coupling Index 用于评估光极与头皮的耦合质量。MNE 教程示例将 SCI 小于 0.5 的通道标记为坏道，但这是示例数据中的操作，不应被 Agent 当成所有设备和任务的固定阈值。阈值应结合设备、波长、通道距离、信号分布和实验 SOP 确认。

验证：保存 SCI 分布、采用阈值、被标记通道和人工复核结论。

来源：MNE-Python 官方 fNIRS preprocessing 教程，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# MNE-FNIRS-003 Beer–Lambert 输入必须是光密度

- modality: fNIRS
- stage: beer_lambert
- knowledge_type: constraint
- review_status: seed_reviewed

`beer_lambert_law` 用于把光密度转换为血红蛋白浓度，其输入应为光密度数据。部分路径长度因子 PPF 会影响浓度尺度；MNE 支持为两个波长提供不同因子。Agent 不应在不知道输入通道类型或 PPF 假设时宣称获得了绝对可靠的浓度。

验证：记录输入通道类型、波长、PPF、输出 HbO/HbR 通道及单位。

来源：MNE-Python `beer_lambert_law` 官方 API，https://mne.tools/stable/generated/mne.preprocessing.nirs.beer_lambert_law.html

# MNE-FNIRS-004 fNIRS 滤波频段必须服从任务设计

- modality: fNIRS
- stage: filtering
- knowledge_type: decision
- review_status: seed_reviewed

fNIRS 滤波用于抑制漂移和生理噪声，但截止频率必须结合刺激周期、血流响应时间尺度、心率与呼吸成分选择。官方教程中的频段属于具体示例，不是跨实验的统一参数。Agent 应优先读取事件周期和研究目标；信息不足时给出候选范围并要求确认。

验证：比较滤波前后 PSD、目标响应幅度、事件平均波形和边缘效应。

来源：MNE-Python 官方 fNIRS preprocessing 教程，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html
