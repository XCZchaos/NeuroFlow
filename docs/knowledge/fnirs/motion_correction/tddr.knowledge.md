# MNE-FNIRS-005 TDDR 用于修复基线跳变和尖峰运动伪迹

- modality: fNIRS
- stage: motion_correction
- software: MNE-Python
- knowledge_type: method
- review_status: seed_reviewed

TDDR 基于时间导数分布修复信号中的基线跳变和尖峰伪迹，在 MNE 中不要求用户提供算法参数。Agent 可把它作为运动校正候选，但不能据此宣称所有运动污染均已消除。

验证：比较处理前后时间序列、导数异常值和任务相关响应，并记录被调用的数据阶段。

来源：MNE-Python 官方 TDDR API，https://mne.tools/stable/generated/mne.preprocessing.nirs.temporal_derivative_distribution_repair.html

# MNE-FNIRS-006 运动校正后仍需重新执行质量评估

- modality: fNIRS
- stage: motion_correction
- software: MNE-Python
- knowledge_type: quality_control
- review_status: seed_reviewed

运动校正是变换数据，不等于质量合格。Agent 应在校正前后对相同通道和时间范围计算质量指标，并标记仍有阶跃、尖峰、饱和或低耦合证据的通道。

验证：生成处理前后叠加波形、通道质量表和保留/排除理由。

来源：MNE-Python 官方 fNIRS 预处理教程，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html
