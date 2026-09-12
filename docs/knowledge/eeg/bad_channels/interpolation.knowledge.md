# MNE-EEG-004 坏道插值依赖正确的传感器位置

- modality: EEG, MEG
- stage: bad_channel_interpolation
- knowledge_type: constraint
- review_status: seed_reviewed

坏道插值不是单纯替换异常数值，它依赖通道类型和传感器空间信息。Agent 只有在坏道已经可靠标记且所需位置数据可用时才能自动插值；缺少坐标时应保留坏道标记并提示人工处理，不能声称插值成功。

验证：确认插值步骤状态、通道位置可用性、插值前后的坏道列表及局部波形连续性。

来源：MNE-Python 官方 Handling bad channels 教程，https://mne.tools/stable/auto_tutorials/preprocessing/15_handling_bad_channels.html
