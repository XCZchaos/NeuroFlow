# NF-MEG-001 MEG 通道类型必须区分：规则

- modality: MEG
- stage: import
- knowledge_type: 执行规则
- review_status: seed_reviewed

磁强计、梯度计、参考 MEG、刺激和辅助通道需要正确分类后才能缩放和质控。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-002 MEG 通道类型必须区分：前提

- modality: MEG
- stage: import
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“MEG 通道类型必须区分”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-003 MEG 通道类型必须区分：验证

- modality: MEG
- stage: import
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“MEG 通道类型必须区分”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-004 MEG 通道类型必须区分：审计

- modality: MEG
- stage: import
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“MEG 通道类型必须区分”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-005 设备坐标与头坐标不能混用：规则

- modality: MEG
- stage: geometry
- knowledge_type: 执行规则
- review_status: seed_reviewed

传感器设备坐标、头坐标及其变换必须明确，缺少变换时不可进行依赖头坐标的操作。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-006 设备坐标与头坐标不能混用：前提

- modality: MEG
- stage: geometry
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“设备坐标与头坐标不能混用”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-007 设备坐标与头坐标不能混用：验证

- modality: MEG
- stage: geometry
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“设备坐标与头坐标不能混用”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-008 设备坐标与头坐标不能混用：审计

- modality: MEG
- stage: geometry
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“设备坐标与头坐标不能混用”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-009 digitization 点必须检查：规则

- modality: MEG
- stage: geometry
- knowledge_type: 执行规则
- review_status: seed_reviewed

头形点、基准点和 HPI 点应检查离群与单位，错误几何会影响配准和 SSS origin。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-010 digitization 点必须检查：前提

- modality: MEG
- stage: geometry
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“digitization 点必须检查”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-011 digitization 点必须检查：验证

- modality: MEG
- stage: geometry
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“digitization 点必须检查”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-012 digitization 点必须检查：审计

- modality: MEG
- stage: geometry
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“digitization 点必须检查”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-013 磁强计和梯度计阈值应分开：规则

- modality: MEG
- stage: quality_control
- knowledge_type: 执行规则
- review_status: seed_reviewed

不同 MEG 传感器类型的物理单位和噪声尺度不同，不能共用未经换算的幅值阈值。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-014 磁强计和梯度计阈值应分开：前提

- modality: MEG
- stage: quality_control
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“磁强计和梯度计阈值应分开”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-015 磁强计和梯度计阈值应分开：验证

- modality: MEG
- stage: quality_control
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“磁强计和梯度计阈值应分开”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-016 磁强计和梯度计阈值应分开：审计

- modality: MEG
- stage: quality_control
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“磁强计和梯度计阈值应分开”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-017 平坦和噪声坏道应分开记录：规则

- modality: MEG
- stage: quality_control
- knowledge_type: 执行规则
- review_status: seed_reviewed

flat 与 noisy 通道代表不同故障证据，自动检测结果应分别保留。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-018 平坦和噪声坏道应分开记录：前提

- modality: MEG
- stage: quality_control
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“平坦和噪声坏道应分开记录”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-019 平坦和噪声坏道应分开记录：验证

- modality: MEG
- stage: quality_control
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“平坦和噪声坏道应分开记录”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-020 平坦和噪声坏道应分开记录：审计

- modality: MEG
- stage: quality_control
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“平坦和噪声坏道应分开记录”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-021 坏道自动检测需检查临界评分：规则

- modality: MEG
- stage: quality_control
- knowledge_type: 执行规则
- review_status: seed_reviewed

接近阈值或只在少数窗口异常的通道需要额外复核。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-022 坏道自动检测需检查临界评分：前提

- modality: MEG
- stage: quality_control
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“坏道自动检测需检查临界评分”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-023 坏道自动检测需检查临界评分：验证

- modality: MEG
- stage: quality_control
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“坏道自动检测需检查临界评分”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-024 坏道自动检测需检查临界评分：审计

- modality: MEG
- stage: quality_control
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“坏道自动检测需检查临界评分”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-025 空房数据必须匹配系统状态：规则

- modality: MEG
- stage: environmental_noise
- knowledge_type: 执行规则
- review_status: seed_reviewed

使用 empty-room 数据估计环境噪声时，应核对日期、设备配置、坏道和处理步骤。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-026 空房数据必须匹配系统状态：前提

- modality: MEG
- stage: environmental_noise
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“空房数据必须匹配系统状态”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-027 空房数据必须匹配系统状态：验证

- modality: MEG
- stage: environmental_noise
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“空房数据必须匹配系统状态”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-028 空房数据必须匹配系统状态：审计

- modality: MEG
- stage: environmental_noise
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“空房数据必须匹配系统状态”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-029 参考传感器处理依赖设备设计：规则

- modality: MEG
- stage: environmental_noise
- knowledge_type: 执行规则
- review_status: seed_reviewed

参考 MEG 通道不能在未知设备语义时任意删除或回归。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-030 参考传感器处理依赖设备设计：前提

- modality: MEG
- stage: environmental_noise
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“参考传感器处理依赖设备设计”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-031 参考传感器处理依赖设备设计：验证

- modality: MEG
- stage: environmental_noise
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“参考传感器处理依赖设备设计”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-032 参考传感器处理依赖设备设计：审计

- modality: MEG
- stage: environmental_noise
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“参考传感器处理依赖设备设计”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-033 MEG 电源线处理必须基于频谱：规则

- modality: MEG
- stage: filtering
- knowledge_type: 执行规则
- review_status: seed_reviewed

陷波频率及谐波应根据实际窄带峰值和采样率选择。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-MEG-034 MEG 电源线处理必须基于频谱：前提

- modality: MEG
- stage: filtering
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“MEG 电源线处理必须基于频谱”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-MEG-035 MEG 电源线处理必须基于频谱：验证

- modality: MEG
- stage: filtering
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“MEG 电源线处理必须基于频谱”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-MEG-036 MEG 电源线处理必须基于频谱：审计

- modality: MEG
- stage: filtering
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“MEG 电源线处理必须基于频谱”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-MEG-037 cHPI 信号应按分析需要处理：规则

- modality: MEG
- stage: filtering
- knowledge_type: 执行规则
- review_status: seed_reviewed

连续头位指示信号可能影响频谱或坏道检测，是否去除应结合后续步骤。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-038 cHPI 信号应按分析需要处理：前提

- modality: MEG
- stage: filtering
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“cHPI 信号应按分析需要处理”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-039 cHPI 信号应按分析需要处理：验证

- modality: MEG
- stage: filtering
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“cHPI 信号应按分析需要处理”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-040 cHPI 信号应按分析需要处理：审计

- modality: MEG
- stage: filtering
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“cHPI 信号应按分析需要处理”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-041 Maxwell 前必须设置最终坏道：规则

- modality: MEG
- stage: maxwell_filter
- knowledge_type: 执行规则
- review_status: seed_reviewed

坏道必须在 SSS 前标记，以避免伪迹扩散到重建通道。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-042 Maxwell 前必须设置最终坏道：前提

- modality: MEG
- stage: maxwell_filter
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“Maxwell 前必须设置最终坏道”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-043 Maxwell 前必须设置最终坏道：验证

- modality: MEG
- stage: maxwell_filter
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“Maxwell 前必须设置最终坏道”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-044 Maxwell 前必须设置最终坏道：审计

- modality: MEG
- stage: maxwell_filter
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“Maxwell 前必须设置最终坏道”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-045 校准文件必须匹配站点设备：规则

- modality: MEG
- stage: maxwell_filter
- knowledge_type: 执行规则
- review_status: seed_reviewed

fine-calibration 文件具有设备和站点特异性，不能跨系统随意复用。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-046 校准文件必须匹配站点设备：前提

- modality: MEG
- stage: maxwell_filter
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“校准文件必须匹配站点设备”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-047 校准文件必须匹配站点设备：验证

- modality: MEG
- stage: maxwell_filter
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“校准文件必须匹配站点设备”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-048 校准文件必须匹配站点设备：审计

- modality: MEG
- stage: maxwell_filter
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“校准文件必须匹配站点设备”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-049 cross-talk 文件必须匹配设备：规则

- modality: MEG
- stage: maxwell_filter
- knowledge_type: 执行规则
- review_status: seed_reviewed

串扰补偿文件应与采集系统匹配，缺失时必须记录。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-050 cross-talk 文件必须匹配设备：前提

- modality: MEG
- stage: maxwell_filter
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“cross-talk 文件必须匹配设备”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-051 cross-talk 文件必须匹配设备：验证

- modality: MEG
- stage: maxwell_filter
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“cross-talk 文件必须匹配设备”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-052 cross-talk 文件必须匹配设备：审计

- modality: MEG
- stage: maxwell_filter
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“cross-talk 文件必须匹配设备”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-053 SSS origin 必须合理：规则

- modality: MEG
- stage: maxwell_filter
- knowledge_type: 执行规则
- review_status: seed_reviewed

球谐展开原点应基于可靠头形拟合或显式设置，自动拟合失败时不得静默继续。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-054 SSS origin 必须合理：前提

- modality: MEG
- stage: maxwell_filter
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“SSS origin 必须合理”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-055 SSS origin 必须合理：验证

- modality: MEG
- stage: maxwell_filter
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“SSS origin 必须合理”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-056 SSS origin 必须合理：审计

- modality: MEG
- stage: maxwell_filter
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“SSS origin 必须合理”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-057 tSSS 窗口与相关阈值必须记录：规则

- modality: MEG
- stage: maxwell_filter
- knowledge_type: 执行规则
- review_status: seed_reviewed

时空 SSS 参数会改变信号分离，应作为可审计参数保存并验证。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-058 tSSS 窗口与相关阈值必须记录：前提

- modality: MEG
- stage: maxwell_filter
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“tSSS 窗口与相关阈值必须记录”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-059 tSSS 窗口与相关阈值必须记录：验证

- modality: MEG
- stage: maxwell_filter
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“tSSS 窗口与相关阈值必须记录”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-060 tSSS 窗口与相关阈值必须记录：审计

- modality: MEG
- stage: maxwell_filter
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“tSSS 窗口与相关阈值必须记录”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-061 非 Neuromag Maxwell 属实验性使用：规则

- modality: MEG
- stage: maxwell_filter
- knowledge_type: 执行规则
- review_status: seed_reviewed

对非 Neuromag 系统不能把 Maxwell 结果描述为等同经过充分验证的 Neuromag 流程。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-062 非 Neuromag Maxwell 属实验性使用：前提

- modality: MEG
- stage: maxwell_filter
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“非 Neuromag Maxwell 属实验性使用”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-063 非 Neuromag Maxwell 属实验性使用：验证

- modality: MEG
- stage: maxwell_filter
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“非 Neuromag Maxwell 属实验性使用”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-064 非 Neuromag Maxwell 属实验性使用：审计

- modality: MEG
- stage: maxwell_filter
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“非 Neuromag Maxwell 属实验性使用”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-065 运动补偿需要连续头位数据：规则

- modality: MEG
- stage: movement
- knowledge_type: 执行规则
- review_status: seed_reviewed

缺少有效 head_pos 时不能声称执行了连续运动补偿。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-066 运动补偿需要连续头位数据：前提

- modality: MEG
- stage: movement
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“运动补偿需要连续头位数据”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-067 运动补偿需要连续头位数据：验证

- modality: MEG
- stage: movement
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“运动补偿需要连续头位数据”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-068 运动补偿需要连续头位数据：审计

- modality: MEG
- stage: movement
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“运动补偿需要连续头位数据”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-069 头位轨迹需检查跳变：规则

- modality: MEG
- stage: movement
- knowledge_type: 执行规则
- review_status: seed_reviewed

补偿前必须检查头位平移、旋转、时间覆盖和不合理跳变。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-070 头位轨迹需检查跳变：前提

- modality: MEG
- stage: movement
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“头位轨迹需检查跳变”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-071 头位轨迹需检查跳变：验证

- modality: MEG
- stage: movement
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“头位轨迹需检查跳变”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-072 头位轨迹需检查跳变：审计

- modality: MEG
- stage: movement
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“头位轨迹需检查跳变”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-073 跨运行目标头位应统一：规则

- modality: MEG
- stage: movement
- knowledge_type: 执行规则
- review_status: seed_reviewed

多运行比较或拼接时应使用预先定义且兼容的 destination。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-074 跨运行目标头位应统一：前提

- modality: MEG
- stage: movement
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“跨运行目标头位应统一”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-075 跨运行目标头位应统一：验证

- modality: MEG
- stage: movement
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“跨运行目标头位应统一”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-076 跨运行目标头位应统一：审计

- modality: MEG
- stage: movement
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“跨运行目标头位应统一”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html

# NF-MEG-077 EOG 伪迹评分需要眼动证据：规则

- modality: MEG
- stage: artifacts
- knowledge_type: 执行规则
- review_status: seed_reviewed

眼动 SSP 或 ICA 成分应结合 EOG 通道、拓扑与锁时平均确认。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-078 EOG 伪迹评分需要眼动证据：前提

- modality: MEG
- stage: artifacts
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“EOG 伪迹评分需要眼动证据”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-079 EOG 伪迹评分需要眼动证据：验证

- modality: MEG
- stage: artifacts
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“EOG 伪迹评分需要眼动证据”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-080 EOG 伪迹评分需要眼动证据：审计

- modality: MEG
- stage: artifacts
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“EOG 伪迹评分需要眼动证据”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-081 ECG 伪迹评分需要心搏证据：规则

- modality: MEG
- stage: artifacts
- knowledge_type: 执行规则
- review_status: seed_reviewed

心磁伪迹成分应结合 ECG 或自动心搏事件与空间模式确认。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-082 ECG 伪迹评分需要心搏证据：前提

- modality: MEG
- stage: artifacts
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“ECG 伪迹评分需要心搏证据”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-083 ECG 伪迹评分需要心搏证据：验证

- modality: MEG
- stage: artifacts
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“ECG 伪迹评分需要心搏证据”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-084 ECG 伪迹评分需要心搏证据：审计

- modality: MEG
- stage: artifacts
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“ECG 伪迹评分需要心搏证据”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-085 肌肉伪迹需结合高频和时间定位：规则

- modality: MEG
- stage: artifacts
- knowledge_type: 执行规则
- review_status: seed_reviewed

高频功率只能作为肌肉伪迹线索，应结合空间分布和原始波形。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-086 肌肉伪迹需结合高频和时间定位：前提

- modality: MEG
- stage: artifacts
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“肌肉伪迹需结合高频和时间定位”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-087 肌肉伪迹需结合高频和时间定位：验证

- modality: MEG
- stage: artifacts
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“肌肉伪迹需结合高频和时间定位”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-088 肌肉伪迹需结合高频和时间定位：审计

- modality: MEG
- stage: artifacts
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“肌肉伪迹需结合高频和时间定位”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-089 SQUID 跳变应标记坏段：规则

- modality: MEG
- stage: artifacts
- knowledge_type: 执行规则
- review_status: seed_reviewed

传感器跳变或重置造成的不连续区间应标注，避免进入滤波和 Epoch。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-090 SQUID 跳变应标记坏段：前提

- modality: MEG
- stage: artifacts
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“SQUID 跳变应标记坏段”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-091 SQUID 跳变应标记坏段：验证

- modality: MEG
- stage: artifacts
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“SQUID 跳变应标记坏段”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-092 SQUID 跳变应标记坏段：审计

- modality: MEG
- stage: artifacts
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“SQUID 跳变应标记坏段”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-MEG-093 SSP 投影数量必须受控：规则

- modality: MEG
- stage: ssp
- knowledge_type: 执行规则
- review_status: seed_reviewed

增加投影向量会移除更多子空间，必须检查解释方差与目标响应保留。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html
