# MNE-EEG-011 自动流程必须保留原始数据并创建处理副本

- modality: EEG
- stage: workflow
- software: MNE-Python
- knowledge_type: reproducibility
- review_status: seed_reviewed

自动预处理应把不可变原始文件作为输入证据，在内存副本或新的衍生文件上操作。每个输出必须能追溯到输入文件、参数、软件版本和处理步骤。

验证：比较原文件哈希，确认输出路径不同，并检查审计记录包含完整步骤。

来源：MNE-Python 官方预处理教程索引，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# MNE-EEG-012 工作流顺序必须由数据和任务约束驱动

- modality: EEG
- stage: workflow
- software: MNE-Python, EEGLAB
- knowledge_type: decision
- review_status: seed_reviewed

Agent 应先验证元数据和信号质量，再生成包含滤波、坏道、参考、伪迹处理和分段的候选计划。步骤顺序并非对所有任务固定；例如 ICA、参考和插值的相互位置应根据算法假设明确选择并记录。

验证：执行前输出计划和理由，执行后比较处理前后质量指标，并对失败步骤保留错误与重试参数。

来源：MNE-Python 官方预处理教程索引，https://mne.tools/stable/auto_tutorials/preprocessing/index.html
