# MNE-MEG-007 MEG 自动流程必须先判定系统能力

- modality: MEG
- stage: workflow
- software: MNE-Python
- knowledge_type: decision
- review_status: seed_reviewed

Agent 在规划 MEG 流程前应识别设备类型、传感器种类、坐标与 digitization、参考传感器、cHPI、校准和 cross-talk 文件。只有满足相应前提时，才能加入 Maxwell、运动补偿或相关重建步骤。

验证：执行前输出能力检查表；缺少必要信息时降级为可支持步骤并明确未执行项。

来源：MNE-Python 官方 Maxwell 滤波教程，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html
