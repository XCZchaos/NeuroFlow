# MNE-MEG-003 Maxwell 滤波参数依赖采集系统信息

- modality: MEG
- stage: maxwell_filter
- software: MNE-Python
- knowledge_type: constraint
- review_status: seed_reviewed

对 Elekta/MEGIN 数据，若可用，应提供设备和站点对应的 fine calibration 与 cross-talk 文件。它们不能从其他设备任意复用；缺失时 Agent 应在报告中标明。

限制：MNE 官方将非 Neuromag 系统的 Maxwell 处理视为实验性支持。验证：核对文件与设备、记录坐标系、origin、阶数和输出数据秩。

来源：MNE-Python 官方 Maxwell 滤波教程，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# MNE-MEG-004 运动补偿必须有可用的头位轨迹

- modality: MEG
- stage: movement_compensation
- software: MNE-Python
- knowledge_type: constraint
- review_status: seed_reviewed

连续头动补偿需要随时间变化的头位信息传给 `head_pos`。没有 cHPI 派生或外部提供的有效头位轨迹时，Agent 不能声称已经完成运动补偿。

验证：绘制平移和旋转头位轨迹，检查时间覆盖范围，并记录目标 `destination` 坐标变换。

来源：MNE-Python 官方运动补偿示例，https://mne.tools/stable/auto_examples/preprocessing/movement_compensation.html

# MNE-MEG-005 跨运行比较应统一目标头坐标

- modality: MEG
- stage: maxwell_filter
- software: MNE-Python
- knowledge_type: decision
- review_status: seed_reviewed

需要拼接或比较多个运行时，可把数据变换到共同的 `destination` 头位置，但目标必须与研究设计和所有运行的坐标信息兼容。Agent 应记录每个运行的原始与目标 `dev_head_t`。

验证：检查坐标变换、传感器覆盖和变换前后头位距离，禁止在坐标信息不完整时静默统一。

来源：MNE-Python 官方 `maxwell_filter` 文档，https://mne.tools/stable/generated/mne.preprocessing.maxwell_filter.html
