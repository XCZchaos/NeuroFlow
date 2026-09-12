# GENERAL-QUALITY-001 质量结论必须比较处理前后

- modality: EEG, MEG, fNIRS
- stage: quality_control
- knowledge_type: requirement
- review_status: seed_reviewed

“流程执行成功”不等于“信号质量改善”。自动处理应计算处理前后可比较的指标，例如异常振幅比例、平坦通道、工频或高频噪声、保留数据比例和目标信号保持情况。质量下降时应报告而不是仅返回成功状态。

验证：相同通道集合、时间范围和指标定义下进行 before/after 比较。

来源：MNE-Python 官方 Quality control reports，https://mne.tools/stable/auto_tutorials/preprocessing/14_quality_control_report.html

# GENERAL-QUALITY-002 自动指标必须保留人工查看入口

- modality: EEG, MEG, fNIRS
- stage: quality_control
- knowledge_type: requirement
- review_status: seed_reviewed

单一质量分数不能覆盖全部伪迹和科学目标。Agent 应提供坏道、异常时间段、PSD、代表性波形和处理步骤状态，使研究者能够检查自动结论；不确定或边界案例应标记为需要人工复核。

来源：MNE-Python 官方 preprocessing 与 QC 教程，https://mne.tools/stable/auto_tutorials/preprocessing/index.html
