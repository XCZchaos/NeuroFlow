# EEGLAB-EEG-001 连续数据通常应在分段前滤波

- modality: EEG
- stage: filtering
- software: EEGLAB
- review_status: seed_reviewed

EEGLAB 官方教程通常建议在 Epoch 和伪迹剔除前对连续数据滤波，因为逐 Epoch 滤波会在每个分段边界引入潜在伪迹。对存在巨大尖峰的数据，可以先移除明显严重片段，避免滤波把局部伪迹扩散到邻近时间。

验证：检查 boundary 事件、滤波边缘、通道频谱以及目标频段是否保留。

来源：EEGLAB 官方 Filtering 教程，https://eeglab.org/tutorials/05_Preprocess/Filtering.html

# EEGLAB-EEG-002 过窄过渡带可能增加滤波伪迹

- modality: EEG
- stage: filtering
- software: EEGLAB
- review_status: seed_reviewed

滤波器过渡带越窄，通常需要越高阶或越长的滤波器，并可能增加振铃等时域影响。EEGLAB 建议在不侵入目标信号的前提下尽量使用较宽、较缓的过渡带。Agent 不能只记录截止频率，还应记录滤波器类型、阶数或长度、过渡带和相位方式。

验证：显示频率响应，检查频谱波纹和时域振铃。

来源：EEGLAB 官方 Filtering 教程，https://eeglab.org/tutorials/05_Preprocess/Filtering.html

# EEGLAB-EEG-003 连接和因果分析需要特殊评估滤波

- modality: EEG
- paradigm: connectivity
- stage: filtering
- software: EEGLAB
- review_status: seed_reviewed

高通和零相位滤波会改变相邻时间样本之间的依赖关系，因此连接或因果分析不能直接沿用普通 ERP、频谱任务的滤波策略。EEGLAB 文档建议这类任务考虑分段去趋势或因果滤波等替代方案，并明确相位延迟和模型假设。

限制：Agent 在不知道下游是否进行连接或因果分析时，不应自动套用标准带通。

来源：EEGLAB 官方 Filtering for connectivity analysis，https://eeglab.org/tutorials/05_Preprocess/Filtering.html
