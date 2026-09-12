# MNE-FNIRS-004 fNIRS 滤波频段必须服从任务设计

- modality: fNIRS
- stage: filtering
- knowledge_type: decision
- review_status: seed_reviewed

fNIRS 滤波用于抑制漂移和生理噪声，但截止频率必须结合刺激周期、血流响应时间尺度、心率与呼吸成分选择。官方教程中的频段属于具体示例，不是跨实验的统一参数。Agent 应优先读取事件周期和研究目标；信息不足时给出候选范围并要求确认。

验证：比较滤波前后 PSD、目标响应幅度、事件平均波形和边缘效应。

来源：MNE-Python 官方 fNIRS preprocessing 教程，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html
