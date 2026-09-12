# GENERAL-METADATA-001 预处理前必须验证关键元数据

- modality: EEG, MEG, fNIRS
- stage: metadata_validation
- knowledge_type: workflow
- review_status: seed_reviewed

自动预处理前至少应验证模态、文件格式、通道名称与类型、采样率、记录长度、已有坏道、已有滤波信息和标注数量。事件相关任务还需要事件含义与时间轴；fNIRS 需要波长和源探测器信息；空间处理需要传感器位置。

限制：缺少关键元数据时，Agent 应降级为建议或跳过依赖该信息的步骤。

来源：MNE-Python 官方 Raw API，https://mne.tools/stable/generated/mne.io.Raw.html

# GENERAL-METADATA-002 软件推断不能覆盖采集事实

- modality: EEG, MEG, fNIRS
- stage: metadata_validation
- knowledge_type: evidence_rule
- review_status: seed_reviewed

文件扩展名、通道名称模式和软件默认值只能用于候选推断，不能覆盖设备记录或文件头事实。Agent 应区分“文件已验证”“用户提供”和“算法推测”三种来源，冲突时明确报告而不是静默选择。

验证：结果字段保存证据来源、读取器和冲突状态。

来源：NeuroFlow 证据规则，结合 MNE Raw 信息模型，https://mne.tools/stable/generated/mne.io.Raw.html
