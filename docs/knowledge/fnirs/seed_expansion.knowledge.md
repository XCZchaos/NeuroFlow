# NF-FNIRS-001 fNIRS 通道必须保留源探测器语义：规则

- modality: FNIRS
- stage: import
- knowledge_type: 执行规则
- review_status: seed_reviewed

导入时必须保留 source、detector、wavelength 和通道配对，不能只留下显示名称。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-002 fNIRS 通道必须保留源探测器语义：前提

- modality: FNIRS
- stage: import
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“fNIRS 通道必须保留源探测器语义”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-003 fNIRS 通道必须保留源探测器语义：验证

- modality: FNIRS
- stage: import
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“fNIRS 通道必须保留源探测器语义”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-004 fNIRS 通道必须保留源探测器语义：审计

- modality: FNIRS
- stage: import
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“fNIRS 通道必须保留源探测器语义”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-005 源探测器距离单位必须验证：规则

- modality: FNIRS
- stage: geometry
- knowledge_type: 执行规则
- review_status: seed_reviewed

计算通道距离前应确认 optode 坐标单位和头坐标系。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-006 源探测器距离单位必须验证：前提

- modality: FNIRS
- stage: geometry
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“源探测器距离单位必须验证”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-007 源探测器距离单位必须验证：验证

- modality: FNIRS
- stage: geometry
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“源探测器距离单位必须验证”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-008 源探测器距离单位必须验证：审计

- modality: FNIRS
- stage: geometry
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“源探测器距离单位必须验证”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-009 原始光强必须检查非正值：规则

- modality: FNIRS
- stage: quality_control
- knowledge_type: 执行规则
- review_status: seed_reviewed

光密度变换前应检查零值、负值、饱和和异常动态范围。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/generated/mne.preprocessing.nirs.optical_density.html

# NF-FNIRS-010 原始光强必须检查非正值：前提

- modality: FNIRS
- stage: quality_control
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“原始光强必须检查非正值”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/generated/mne.preprocessing.nirs.optical_density.html

# NF-FNIRS-011 原始光强必须检查非正值：验证

- modality: FNIRS
- stage: quality_control
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“原始光强必须检查非正值”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/generated/mne.preprocessing.nirs.optical_density.html

# NF-FNIRS-012 原始光强必须检查非正值：审计

- modality: FNIRS
- stage: quality_control
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“原始光强必须检查非正值”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/generated/mne.preprocessing.nirs.optical_density.html

# NF-FNIRS-013 SCI 应在适当数据阶段计算：规则

- modality: FNIRS
- stage: quality_control
- knowledge_type: 执行规则
- review_status: seed_reviewed

头皮耦合指标应按方法要求在配对波长数据上计算，并记录阈值。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-014 SCI 应在适当数据阶段计算：前提

- modality: FNIRS
- stage: quality_control
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“SCI 应在适当数据阶段计算”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-015 SCI 应在适当数据阶段计算：验证

- modality: FNIRS
- stage: quality_control
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“SCI 应在适当数据阶段计算”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-016 SCI 应在适当数据阶段计算：审计

- modality: FNIRS
- stage: quality_control
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“SCI 应在适当数据阶段计算”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-017 低 SCI 通道应先标记：规则

- modality: FNIRS
- stage: quality_control
- knowledge_type: 执行规则
- review_status: seed_reviewed

低耦合通道应在后续转换和统计解释前标记，而不是依靠滤波修复。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-018 低 SCI 通道应先标记：前提

- modality: FNIRS
- stage: quality_control
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“低 SCI 通道应先标记”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-019 低 SCI 通道应先标记：验证

- modality: FNIRS
- stage: quality_control
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“低 SCI 通道应先标记”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-020 低 SCI 通道应先标记：审计

- modality: FNIRS
- stage: quality_control
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“低 SCI 通道应先标记”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-021 通道距离异常需要检查几何：规则

- modality: FNIRS
- stage: quality_control
- knowledge_type: 执行规则
- review_status: seed_reviewed

过短、过长或无法计算的源探测器距离提示位置或通道元数据问题。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-022 通道距离异常需要检查几何：前提

- modality: FNIRS
- stage: quality_control
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“通道距离异常需要检查几何”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-023 通道距离异常需要检查几何：验证

- modality: FNIRS
- stage: quality_control
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“通道距离异常需要检查几何”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-024 通道距离异常需要检查几何：审计

- modality: FNIRS
- stage: quality_control
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“通道距离异常需要检查几何”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-025 光密度只能从光强表示转换：规则

- modality: FNIRS
- stage: optical_density
- knowledge_type: 执行规则
- review_status: seed_reviewed

重复对已经是 optical density 的数据执行转换会破坏数值含义。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/generated/mne.preprocessing.nirs.optical_density.html

# NF-FNIRS-026 光密度只能从光强表示转换：前提

- modality: FNIRS
- stage: optical_density
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“光密度只能从光强表示转换”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/generated/mne.preprocessing.nirs.optical_density.html

# NF-FNIRS-027 光密度只能从光强表示转换：验证

- modality: FNIRS
- stage: optical_density
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“光密度只能从光强表示转换”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/generated/mne.preprocessing.nirs.optical_density.html

# NF-FNIRS-028 光密度只能从光强表示转换：审计

- modality: FNIRS
- stage: optical_density
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“光密度只能从光强表示转换”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/generated/mne.preprocessing.nirs.optical_density.html

# NF-FNIRS-029 光密度变换前后通道配对应一致：规则

- modality: FNIRS
- stage: optical_density
- knowledge_type: 执行规则
- review_status: seed_reviewed

转换不能丢失波长和源探测器配对关系。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/generated/mne.preprocessing.nirs.optical_density.html

# NF-FNIRS-030 光密度变换前后通道配对应一致：前提

- modality: FNIRS
- stage: optical_density
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“光密度变换前后通道配对应一致”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/generated/mne.preprocessing.nirs.optical_density.html

# NF-FNIRS-031 光密度变换前后通道配对应一致：验证

- modality: FNIRS
- stage: optical_density
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“光密度变换前后通道配对应一致”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/generated/mne.preprocessing.nirs.optical_density.html

# NF-FNIRS-032 光密度变换前后通道配对应一致：审计

- modality: FNIRS
- stage: optical_density
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“光密度变换前后通道配对应一致”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/generated/mne.preprocessing.nirs.optical_density.html

# NF-FNIRS-033 TDDR 主要处理尖峰和基线跳变：规则

- modality: FNIRS
- stage: motion
- knowledge_type: 执行规则
- review_status: seed_reviewed

TDDR 可作为运动校正候选，但不能保证消除所有运动影响。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-034 TDDR 主要处理尖峰和基线跳变：前提

- modality: FNIRS
- stage: motion
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“TDDR 主要处理尖峰和基线跳变”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-035 TDDR 主要处理尖峰和基线跳变：验证

- modality: FNIRS
- stage: motion
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“TDDR 主要处理尖峰和基线跳变”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-036 TDDR 主要处理尖峰和基线跳变：审计

- modality: FNIRS
- stage: motion
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“TDDR 主要处理尖峰和基线跳变”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-037 TDDR 输入阶段必须记录：规则

- modality: FNIRS
- stage: motion
- knowledge_type: 执行规则
- review_status: seed_reviewed

调用 TDDR 时应记录输入是光密度还是其他表示，并遵循当前 API 对通道类型的要求。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-038 TDDR 输入阶段必须记录：前提

- modality: FNIRS
- stage: motion
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“TDDR 输入阶段必须记录”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-039 TDDR 输入阶段必须记录：验证

- modality: FNIRS
- stage: motion
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“TDDR 输入阶段必须记录”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-040 TDDR 输入阶段必须记录：审计

- modality: FNIRS
- stage: motion
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“TDDR 输入阶段必须记录”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-041 运动校正必须进行前后比较：规则

- modality: FNIRS
- stage: motion
- knowledge_type: 执行规则
- review_status: seed_reviewed

应在相同时间和通道上比较校正前后波形、导数异常和任务响应。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-042 运动校正必须进行前后比较：前提

- modality: FNIRS
- stage: motion
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“运动校正必须进行前后比较”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-043 运动校正必须进行前后比较：验证

- modality: FNIRS
- stage: motion
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“运动校正必须进行前后比较”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-044 运动校正必须进行前后比较：审计

- modality: FNIRS
- stage: motion
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“运动校正必须进行前后比较”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-045 严重运动区间仍可需要排除：规则

- modality: FNIRS
- stage: motion
- knowledge_type: 执行规则
- review_status: seed_reviewed

校正后仍存在不连续、饱和或大幅异常的区间应标注并在分析中排除。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-046 严重运动区间仍可需要排除：前提

- modality: FNIRS
- stage: motion
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“严重运动区间仍可需要排除”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-047 严重运动区间仍可需要排除：验证

- modality: FNIRS
- stage: motion
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“严重运动区间仍可需要排除”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-048 严重运动区间仍可需要排除：审计

- modality: FNIRS
- stage: motion
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“严重运动区间仍可需要排除”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-049 Beer-Lambert 输入必须是光密度：规则

- modality: FNIRS
- stage: beer_lambert
- knowledge_type: 执行规则
- review_status: seed_reviewed

血红蛋白浓度转换前必须确认通道表示为 optical density。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-050 Beer-Lambert 输入必须是光密度：前提

- modality: FNIRS
- stage: beer_lambert
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“Beer-Lambert 输入必须是光密度”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-051 Beer-Lambert 输入必须是光密度：验证

- modality: FNIRS
- stage: beer_lambert
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“Beer-Lambert 输入必须是光密度”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-052 Beer-Lambert 输入必须是光密度：审计

- modality: FNIRS
- stage: beer_lambert
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“Beer-Lambert 输入必须是光密度”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-053 波长信息缺失时不能完成转换：规则

- modality: FNIRS
- stage: beer_lambert
- knowledge_type: 执行规则
- review_status: seed_reviewed

没有可靠波长和配对信息时不得生成 HbO/HbR 浓度。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-054 波长信息缺失时不能完成转换：前提

- modality: FNIRS
- stage: beer_lambert
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“波长信息缺失时不能完成转换”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-055 波长信息缺失时不能完成转换：验证

- modality: FNIRS
- stage: beer_lambert
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“波长信息缺失时不能完成转换”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-056 波长信息缺失时不能完成转换：审计

- modality: FNIRS
- stage: beer_lambert
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“波长信息缺失时不能完成转换”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-057 路径长度因子必须记录：规则

- modality: FNIRS
- stage: beer_lambert
- knowledge_type: 执行规则
- review_status: seed_reviewed

partial pathlength factor 会影响浓度尺度，使用值和依据必须写入审计记录。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-058 路径长度因子必须记录：前提

- modality: FNIRS
- stage: beer_lambert
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“路径长度因子必须记录”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-059 路径长度因子必须记录：验证

- modality: FNIRS
- stage: beer_lambert
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“路径长度因子必须记录”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-060 路径长度因子必须记录：审计

- modality: FNIRS
- stage: beer_lambert
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“路径长度因子必须记录”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-061 HbO 与 HbR 通道必须成对核对：规则

- modality: FNIRS
- stage: beer_lambert
- knowledge_type: 执行规则
- review_status: seed_reviewed

转换后应检查每个测量对是否产生预期的 HbO/HbR 通道及单位。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-062 HbO 与 HbR 通道必须成对核对：前提

- modality: FNIRS
- stage: beer_lambert
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“HbO 与 HbR 通道必须成对核对”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-063 HbO 与 HbR 通道必须成对核对：验证

- modality: FNIRS
- stage: beer_lambert
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“HbO 与 HbR 通道必须成对核对”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-064 HbO 与 HbR 通道必须成对核对：审计

- modality: FNIRS
- stage: beer_lambert
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“HbO 与 HbR 通道必须成对核对”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-065 fNIRS 高通应保护任务慢变化：规则

- modality: FNIRS
- stage: filtering
- knowledge_type: 执行规则
- review_status: seed_reviewed

高通截止频率应结合任务周期，避免移除目标血流动力学趋势。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-FNIRS-066 fNIRS 高通应保护任务慢变化：前提

- modality: FNIRS
- stage: filtering
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“fNIRS 高通应保护任务慢变化”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-FNIRS-067 fNIRS 高通应保护任务慢变化：验证

- modality: FNIRS
- stage: filtering
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“fNIRS 高通应保护任务慢变化”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-FNIRS-068 fNIRS 高通应保护任务慢变化：审计

- modality: FNIRS
- stage: filtering
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“fNIRS 高通应保护任务慢变化”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-FNIRS-069 fNIRS 低通应检查生理成分影响：规则

- modality: FNIRS
- stage: filtering
- knowledge_type: 执行规则
- review_status: seed_reviewed

低通参数应根据目标响应及心跳、呼吸等成分的处理策略选择。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-FNIRS-070 fNIRS 低通应检查生理成分影响：前提

- modality: FNIRS
- stage: filtering
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“fNIRS 低通应检查生理成分影响”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-FNIRS-071 fNIRS 低通应检查生理成分影响：验证

- modality: FNIRS
- stage: filtering
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“fNIRS 低通应检查生理成分影响”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-FNIRS-072 fNIRS 低通应检查生理成分影响：审计

- modality: FNIRS
- stage: filtering
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“fNIRS 低通应检查生理成分影响”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-FNIRS-073 短记录不宜使用过长滤波器：规则

- modality: FNIRS
- stage: filtering
- knowledge_type: 执行规则
- review_status: seed_reviewed

滤波器长度相对记录过长会增加边缘和瞬态影响。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-FNIRS-074 短记录不宜使用过长滤波器：前提

- modality: FNIRS
- stage: filtering
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“短记录不宜使用过长滤波器”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-FNIRS-075 短记录不宜使用过长滤波器：验证

- modality: FNIRS
- stage: filtering
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“短记录不宜使用过长滤波器”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-FNIRS-076 短记录不宜使用过长滤波器：审计

- modality: FNIRS
- stage: filtering
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“短记录不宜使用过长滤波器”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-FNIRS-077 短距离通道必须由距离定义：规则

- modality: FNIRS
- stage: short_channels
- knowledge_type: 执行规则
- review_status: seed_reviewed

不能只按通道名称判断 short channel，应根据可靠源探测器距离和实验设置识别。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-078 短距离通道必须由距离定义：前提

- modality: FNIRS
- stage: short_channels
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“短距离通道必须由距离定义”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-079 短距离通道必须由距离定义：验证

- modality: FNIRS
- stage: short_channels
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“短距离通道必须由距离定义”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-080 短距离通道必须由距离定义：审计

- modality: FNIRS
- stage: short_channels
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“短距离通道必须由距离定义”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-081 短通道回归必须限制在训练或模型内：规则

- modality: FNIRS
- stage: short_channels
- knowledge_type: 执行规则
- review_status: seed_reviewed

用于预测评估时，短通道回归参数不得利用测试标签或跨越评估边界拟合。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-FNIRS-082 短通道回归必须限制在训练或模型内：前提

- modality: FNIRS
- stage: short_channels
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“短通道回归必须限制在训练或模型内”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-FNIRS-083 短通道回归必须限制在训练或模型内：验证

- modality: FNIRS
- stage: short_channels
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“短通道回归必须限制在训练或模型内”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-FNIRS-084 短通道回归必须限制在训练或模型内：审计

- modality: FNIRS
- stage: short_channels
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“短通道回归必须限制在训练或模型内”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-FNIRS-085 fNIRS Epoch 时间窗应覆盖延迟响应：规则

- modality: FNIRS
- stage: epoching
- knowledge_type: 执行规则
- review_status: seed_reviewed

分段窗口需依据任务设计和血流动力学延迟选择，不能直接复用 EEG 短窗口。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/generated/mne.Epochs.html

# NF-FNIRS-086 fNIRS Epoch 时间窗应覆盖延迟响应：前提

- modality: FNIRS
- stage: epoching
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“fNIRS Epoch 时间窗应覆盖延迟响应”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/generated/mne.Epochs.html

# NF-FNIRS-087 fNIRS Epoch 时间窗应覆盖延迟响应：验证

- modality: FNIRS
- stage: epoching
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“fNIRS Epoch 时间窗应覆盖延迟响应”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/generated/mne.Epochs.html

# NF-FNIRS-088 fNIRS Epoch 时间窗应覆盖延迟响应：审计

- modality: FNIRS
- stage: epoching
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“fNIRS Epoch 时间窗应覆盖延迟响应”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/generated/mne.Epochs.html

# NF-FNIRS-089 每步必须检查 fNIRS 数据表示：规则

- modality: FNIRS
- stage: workflow
- knowledge_type: 执行规则
- review_status: seed_reviewed

自动流程要在光强、光密度和血红蛋白阶段间进行类型和单位断言。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-090 每步必须检查 fNIRS 数据表示：前提

- modality: FNIRS
- stage: workflow
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“每步必须检查 fNIRS 数据表示”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-091 每步必须检查 fNIRS 数据表示：验证

- modality: FNIRS
- stage: workflow
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“每步必须检查 fNIRS 数据表示”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# NF-FNIRS-092 每步必须检查 fNIRS 数据表示：审计

- modality: FNIRS
- stage: workflow
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“每步必须检查 fNIRS 数据表示”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html
