# NF-EEG-001 导入后核对 EEG 通道类型：规则

- modality: EEG
- stage: import
- knowledge_type: 执行规则
- review_status: seed_reviewed

读取文件后必须确认 EEG、EOG、ECG、刺激和杂项通道分类，再选择处理对象。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-002 导入后核对 EEG 通道类型：前提

- modality: EEG
- stage: import
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“导入后核对 EEG 通道类型”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-003 导入后核对 EEG 通道类型：验证

- modality: EEG
- stage: import
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“导入后核对 EEG 通道类型”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-004 导入后核对 EEG 通道类型：审计

- modality: EEG
- stage: import
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“导入后核对 EEG 通道类型”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-005 插值前必须有有效电极位置：规则

- modality: EEG
- stage: montage
- knowledge_type: 执行规则
- review_status: seed_reviewed

没有可信电极位置时不能声称完成空间插值，应请求蒙太奇或保留坏道。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-006 插值前必须有有效电极位置：前提

- modality: EEG
- stage: montage
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“插值前必须有有效电极位置”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-007 插值前必须有有效电极位置：验证

- modality: EEG
- stage: montage
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“插值前必须有有效电极位置”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-008 插值前必须有有效电极位置：审计

- modality: EEG
- stage: montage
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“插值前必须有有效电极位置”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-009 标准蒙太奇匹配必须处理命名差异：规则

- modality: EEG
- stage: montage
- knowledge_type: 执行规则
- review_status: seed_reviewed

应用标准蒙太奇前必须处理大小写、别名和缺失电极，不能按通道顺序强行匹配。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-010 标准蒙太奇匹配必须处理命名差异：前提

- modality: EEG
- stage: montage
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“标准蒙太奇匹配必须处理命名差异”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-011 标准蒙太奇匹配必须处理命名差异：验证

- modality: EEG
- stage: montage
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“标准蒙太奇匹配必须处理命名差异”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-012 标准蒙太奇匹配必须处理命名差异：审计

- modality: EEG
- stage: montage
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“标准蒙太奇匹配必须处理命名差异”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-013 平坦通道需要按持续时间判断：规则

- modality: EEG
- stage: quality_control
- knowledge_type: 执行规则
- review_status: seed_reviewed

短暂低振幅与持续平坦含义不同，坏道判断应结合窗口长度和占比。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-014 平坦通道需要按持续时间判断：前提

- modality: EEG
- stage: quality_control
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“平坦通道需要按持续时间判断”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-015 平坦通道需要按持续时间判断：验证

- modality: EEG
- stage: quality_control
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“平坦通道需要按持续时间判断”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-016 平坦通道需要按持续时间判断：审计

- modality: EEG
- stage: quality_control
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“平坦通道需要按持续时间判断”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-017 高噪声通道需要多证据确认：规则

- modality: EEG
- stage: quality_control
- knowledge_type: 执行规则
- review_status: seed_reviewed

高方差通道应结合频谱、邻近通道相关和时间定位确认，避免删除真实局部活动。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-018 高噪声通道需要多证据确认：前提

- modality: EEG
- stage: quality_control
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“高噪声通道需要多证据确认”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-019 高噪声通道需要多证据确认：验证

- modality: EEG
- stage: quality_control
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“高噪声通道需要多证据确认”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-020 高噪声通道需要多证据确认：审计

- modality: EEG
- stage: quality_control
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“高噪声通道需要多证据确认”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-021 高通滤波可能改变慢成分：规则

- modality: EEG
- stage: filtering
- knowledge_type: 执行规则
- review_status: seed_reviewed

提高高通截止频率可能扭曲慢波和 ERP，参数必须由目标成分决定。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-EEG-022 高通滤波可能改变慢成分：前提

- modality: EEG
- stage: filtering
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“高通滤波可能改变慢成分”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-EEG-023 高通滤波可能改变慢成分：验证

- modality: EEG
- stage: filtering
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“高通滤波可能改变慢成分”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-EEG-024 高通滤波可能改变慢成分：审计

- modality: EEG
- stage: filtering
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“高通滤波可能改变慢成分”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-EEG-025 低通滤波必须保护目标频带：规则

- modality: EEG
- stage: filtering
- knowledge_type: 执行规则
- review_status: seed_reviewed

低通截止频率必须覆盖研究目标频率，并检查过渡带和衰减。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-EEG-026 低通滤波必须保护目标频带：前提

- modality: EEG
- stage: filtering
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“低通滤波必须保护目标频带”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-EEG-027 低通滤波必须保护目标频带：验证

- modality: EEG
- stage: filtering
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“低通滤波必须保护目标频带”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-EEG-028 低通滤波必须保护目标频带：审计

- modality: EEG
- stage: filtering
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“低通滤波必须保护目标频带”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-EEG-029 陷波仅用于明确窄带干扰：规则

- modality: EEG
- stage: filtering
- knowledge_type: 执行规则
- review_status: seed_reviewed

只有观察到电源线或明确窄带峰值时才应选择陷波及其谐波。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-EEG-030 陷波仅用于明确窄带干扰：前提

- modality: EEG
- stage: filtering
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“陷波仅用于明确窄带干扰”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-EEG-031 陷波仅用于明确窄带干扰：验证

- modality: EEG
- stage: filtering
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“陷波仅用于明确窄带干扰”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-EEG-032 陷波仅用于明确窄带干扰：审计

- modality: EEG
- stage: filtering
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“陷波仅用于明确窄带干扰”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-EEG-033 零相位滤波不适合在线因果声明：规则

- modality: EEG
- stage: filtering
- knowledge_type: 执行规则
- review_status: seed_reviewed

双向零相位滤波会使用未来样本，离线结果不能直接代表实时因果延迟。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-EEG-034 零相位滤波不适合在线因果声明：前提

- modality: EEG
- stage: filtering
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“零相位滤波不适合在线因果声明”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-EEG-035 零相位滤波不适合在线因果声明：验证

- modality: EEG
- stage: filtering
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“零相位滤波不适合在线因果声明”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-EEG-036 零相位滤波不适合在线因果声明：审计

- modality: EEG
- stage: filtering
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“零相位滤波不适合在线因果声明”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-EEG-037 滤波边缘必须标记或排除：规则

- modality: EEG
- stage: filtering
- knowledge_type: 执行规则
- review_status: seed_reviewed

记录边界、拼接点和短片段附近的滤波瞬态应检查并从关键分析中排除。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-EEG-038 滤波边缘必须标记或排除：前提

- modality: EEG
- stage: filtering
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“滤波边缘必须标记或排除”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-EEG-039 滤波边缘必须标记或排除：验证

- modality: EEG
- stage: filtering
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“滤波边缘必须标记或排除”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-EEG-040 滤波边缘必须标记或排除：审计

- modality: EEG
- stage: filtering
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“滤波边缘必须标记或排除”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-EEG-041 连续数据重采样要同步事件：规则

- modality: EEG
- stage: resampling
- knowledge_type: 执行规则
- review_status: seed_reviewed

Raw 重采样时必须同步更新事件位置并量化事件时间误差。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-042 连续数据重采样要同步事件：前提

- modality: EEG
- stage: resampling
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“连续数据重采样要同步事件”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-043 连续数据重采样要同步事件：验证

- modality: EEG
- stage: resampling
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“连续数据重采样要同步事件”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-044 连续数据重采样要同步事件：审计

- modality: EEG
- stage: resampling
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“连续数据重采样要同步事件”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-045 平均参考要求足够空间覆盖：规则

- modality: EEG
- stage: referencing
- knowledge_type: 执行规则
- review_status: seed_reviewed

平均参考的解释依赖电极覆盖；稀疏或偏侧布局时不能默认采用。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-046 平均参考要求足够空间覆盖：前提

- modality: EEG
- stage: referencing
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“平均参考要求足够空间覆盖”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-047 平均参考要求足够空间覆盖：验证

- modality: EEG
- stage: referencing
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“平均参考要求足够空间覆盖”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-048 平均参考要求足够空间覆盖：审计

- modality: EEG
- stage: referencing
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“平均参考要求足够空间覆盖”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-049 参考通道坏信号会传播：规则

- modality: EEG
- stage: referencing
- knowledge_type: 执行规则
- review_status: seed_reviewed

选择单电极或双乳突参考前必须检查参考通道质量。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-050 参考通道坏信号会传播：前提

- modality: EEG
- stage: referencing
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“参考通道坏信号会传播”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-051 参考通道坏信号会传播：验证

- modality: EEG
- stage: referencing
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“参考通道坏信号会传播”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-052 参考通道坏信号会传播：审计

- modality: EEG
- stage: referencing
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“参考通道坏信号会传播”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-053 参考变换会改变数据秩：规则

- modality: EEG
- stage: referencing
- knowledge_type: 执行规则
- review_status: seed_reviewed

平均参考或投影参考会影响秩和后续协方差估计，必须记录。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-054 参考变换会改变数据秩：前提

- modality: EEG
- stage: referencing
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“参考变换会改变数据秩”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-055 参考变换会改变数据秩：验证

- modality: EEG
- stage: referencing
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“参考变换会改变数据秩”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-056 参考变换会改变数据秩：审计

- modality: EEG
- stage: referencing
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“参考变换会改变数据秩”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-057 坏道插值应在位置可靠时执行：规则

- modality: EEG
- stage: bad_channels
- knowledge_type: 执行规则
- review_status: seed_reviewed

插值依赖邻近传感器几何；位置缺失或坏道过多时应停止或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-058 坏道插值应在位置可靠时执行：前提

- modality: EEG
- stage: bad_channels
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“坏道插值应在位置可靠时执行”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-059 坏道插值应在位置可靠时执行：验证

- modality: EEG
- stage: bad_channels
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“坏道插值应在位置可靠时执行”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-060 坏道插值应在位置可靠时执行：审计

- modality: EEG
- stage: bad_channels
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“坏道插值应在位置可靠时执行”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-061 插值不能掩盖过多坏道：规则

- modality: EEG
- stage: bad_channels
- knowledge_type: 执行规则
- review_status: seed_reviewed

当坏道比例或空间聚集超过预设标准时，应报告该记录质量不足，而不是全部插值。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-062 插值不能掩盖过多坏道：前提

- modality: EEG
- stage: bad_channels
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“插值不能掩盖过多坏道”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-063 插值不能掩盖过多坏道：验证

- modality: EEG
- stage: bad_channels
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“插值不能掩盖过多坏道”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-064 插值不能掩盖过多坏道：审计

- modality: EEG
- stage: bad_channels
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“插值不能掩盖过多坏道”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-065 ICA 前必须评估数据秩：规则

- modality: EEG
- stage: artifacts
- knowledge_type: 执行规则
- review_status: seed_reviewed

ICA 成分数必须与有效数据秩兼容，参考和插值造成的秩变化要计入。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-066 ICA 前必须评估数据秩：前提

- modality: EEG
- stage: artifacts
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“ICA 前必须评估数据秩”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-067 ICA 前必须评估数据秩：验证

- modality: EEG
- stage: artifacts
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“ICA 前必须评估数据秩”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-068 ICA 前必须评估数据秩：审计

- modality: EEG
- stage: artifacts
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“ICA 前必须评估数据秩”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-069 ICA 拟合数据应避免极端污染：规则

- modality: EEG
- stage: artifacts
- knowledge_type: 执行规则
- review_status: seed_reviewed

长时极端伪迹会主导 ICA，拟合前应排除明确坏段并保留选择记录。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-070 ICA 拟合数据应避免极端污染：前提

- modality: EEG
- stage: artifacts
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“ICA 拟合数据应避免极端污染”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-071 ICA 拟合数据应避免极端污染：验证

- modality: EEG
- stage: artifacts
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“ICA 拟合数据应避免极端污染”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-072 ICA 拟合数据应避免极端污染：审计

- modality: EEG
- stage: artifacts
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“ICA 拟合数据应避免极端污染”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-073 ICA 成分删除需要可解释证据：规则

- modality: EEG
- stage: artifacts
- knowledge_type: 执行规则
- review_status: seed_reviewed

删除眼动、心电或肌电成分应结合拓扑、时间序列、频谱和辅助通道评分。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-074 ICA 成分删除需要可解释证据：前提

- modality: EEG
- stage: artifacts
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“ICA 成分删除需要可解释证据”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-075 ICA 成分删除需要可解释证据：验证

- modality: EEG
- stage: artifacts
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“ICA 成分删除需要可解释证据”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-076 ICA 成分删除需要可解释证据：审计

- modality: EEG
- stage: artifacts
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“ICA 成分删除需要可解释证据”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-EEG-077 事件重复必须显式处理：规则

- modality: EEG
- stage: epoching
- knowledge_type: 执行规则
- review_status: seed_reviewed

同一样本出现重复事件时必须选择报错、合并或丢弃策略并记录。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/generated/mne.Epochs.html

# NF-EEG-078 事件重复必须显式处理：前提

- modality: EEG
- stage: epoching
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“事件重复必须显式处理”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/generated/mne.Epochs.html

# NF-EEG-079 事件重复必须显式处理：验证

- modality: EEG
- stage: epoching
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“事件重复必须显式处理”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/generated/mne.Epochs.html

# NF-EEG-080 事件重复必须显式处理：审计

- modality: EEG
- stage: epoching
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“事件重复必须显式处理”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/generated/mne.Epochs.html
