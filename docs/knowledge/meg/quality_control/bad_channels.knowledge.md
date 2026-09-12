# MNE-MEG-001 Maxwell 滤波前必须标记坏道

- modality: MEG
- stage: quality_control
- software: MNE-Python
- knowledge_type: constraint
- review_status: seed_reviewed

在 Maxwell 滤波前，必须把已知坏道写入 `raw.info['bads']`，否则坏道伪迹可能传播到重建信号。可用 `find_bad_channels_maxwell()` 辅助识别 noisy 和 flat 通道，但结果仍需结合诊断图或规则复核。

验证：保存自动评分、阈值、人工或规则复核结果以及最终坏道列表。

来源：MNE-Python 官方 `maxwell_filter` 文档，https://mne.tools/stable/generated/mne.preprocessing.maxwell_filter.html

# MNE-MEG-002 自动坏道检测不能替代处理后复核

- modality: MEG
- stage: quality_control
- software: MNE-Python
- knowledge_type: limitation
- review_status: seed_reviewed

`find_bad_channels_maxwell()` 按数据分块判断 flat 和 noisy 通道，接近阈值或只在少数片段异常的通道可能不被标记。Agent 不应把未被算法标记解释为通道一定正常。

验证：展示通道评分分布、临界通道和异常时间片，并在 Maxwell 处理后再次检查信号。

来源：MNE-Python 官方 Maxwell 滤波教程，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html
