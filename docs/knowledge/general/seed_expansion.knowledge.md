# NF-GENERAL-001 受试者标识去标识化：规则

- modality: general
- stage: metadata
- knowledge_type: 执行规则
- review_status: seed_reviewed

进入共享或索引范围的受试者标识必须去标识化，并保留受控映射，而不是把姓名等直接标识写入衍生文件。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-002 受试者标识去标识化：前提

- modality: general
- stage: metadata
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“受试者标识去标识化”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-003 受试者标识去标识化：验证

- modality: general
- stage: metadata
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“受试者标识去标识化”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-004 受试者标识去标识化：审计

- modality: general
- stage: metadata
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“受试者标识去标识化”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-005 会话和运行层级不可混淆：规则

- modality: general
- stage: metadata
- knowledge_type: 执行规则
- review_status: seed_reviewed

subject、session、run 和 task 表示不同层级；合并前必须保留这些边界。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-006 会话和运行层级不可混淆：前提

- modality: general
- stage: metadata
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“会话和运行层级不可混淆”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-007 会话和运行层级不可混淆：验证

- modality: general
- stage: metadata
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“会话和运行层级不可混淆”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-008 会话和运行层级不可混淆：审计

- modality: general
- stage: metadata
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“会话和运行层级不可混淆”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-009 通道名称必须唯一：规则

- modality: general
- stage: metadata
- knowledge_type: 执行规则
- review_status: seed_reviewed

同一记录内通道名称必须唯一，重命名时还要同步更新坏道、注释和蒙太奇引用。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-010 通道名称必须唯一：前提

- modality: general
- stage: metadata
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“通道名称必须唯一”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-011 通道名称必须唯一：验证

- modality: general
- stage: metadata
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“通道名称必须唯一”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-012 通道名称必须唯一：审计

- modality: general
- stage: metadata
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“通道名称必须唯一”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-013 通道类型必须显式确认：规则

- modality: general
- stage: metadata
- knowledge_type: 执行规则
- review_status: seed_reviewed

EEG、EOG、ECG、刺激、MEG 和 fNIRS 通道不能只按名称猜测，处理前必须核对类型。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-014 通道类型必须显式确认：前提

- modality: general
- stage: metadata
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“通道类型必须显式确认”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-015 通道类型必须显式确认：验证

- modality: general
- stage: metadata
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“通道类型必须显式确认”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-016 通道类型必须显式确认：审计

- modality: general
- stage: metadata
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“通道类型必须显式确认”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-017 坐标系必须伴随坐标保存：规则

- modality: general
- stage: metadata
- knowledge_type: 执行规则
- review_status: seed_reviewed

传感器或头部坐标若缺少坐标系和单位便不可安全组合或变换。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-018 坐标系必须伴随坐标保存：前提

- modality: general
- stage: metadata
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“坐标系必须伴随坐标保存”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-019 坐标系必须伴随坐标保存：验证

- modality: general
- stage: metadata
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“坐标系必须伴随坐标保存”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-020 坐标系必须伴随坐标保存：审计

- modality: general
- stage: metadata
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“坐标系必须伴随坐标保存”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-021 事件时间基准必须统一：规则

- modality: general
- stage: metadata
- knowledge_type: 执行规则
- review_status: seed_reviewed

事件 onset、样本索引和绝对时间必须转换到同一已知时间基准后才能对齐。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-022 事件时间基准必须统一：前提

- modality: general
- stage: metadata
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“事件时间基准必须统一”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-023 事件时间基准必须统一：验证

- modality: general
- stage: metadata
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“事件时间基准必须统一”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-024 事件时间基准必须统一：审计

- modality: general
- stage: metadata
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“事件时间基准必须统一”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-025 数值与物理单位必须绑定：规则

- modality: general
- stage: units
- knowledge_type: 执行规则
- review_status: seed_reviewed

振幅、距离、时间和频率数值必须连同单位解释，禁止仅凭数量级静默换算。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-026 数值与物理单位必须绑定：前提

- modality: general
- stage: units
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“数值与物理单位必须绑定”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-027 数值与物理单位必须绑定：验证

- modality: general
- stage: units
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“数值与物理单位必须绑定”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-028 数值与物理单位必须绑定：审计

- modality: general
- stage: units
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“数值与物理单位必须绑定”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-029 采样率必须从文件元数据读取：规则

- modality: general
- stage: sampling
- knowledge_type: 执行规则
- review_status: seed_reviewed

存在可信元数据时应读取实际采样率，不应从样本数或常见设备默认值猜测。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-030 采样率必须从文件元数据读取：前提

- modality: general
- stage: sampling
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“采样率必须从文件元数据读取”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-031 采样率必须从文件元数据读取：验证

- modality: general
- stage: sampling
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“采样率必须从文件元数据读取”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-032 采样率必须从文件元数据读取：审计

- modality: general
- stage: sampling
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“采样率必须从文件元数据读取”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-033 时间轴必须由首样本和采样率共同确定：规则

- modality: general
- stage: sampling
- knowledge_type: 执行规则
- review_status: seed_reviewed

生成时间轴时必须考虑采样率、首样本偏移和裁剪，不应假设记录从零开始。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-034 时间轴必须由首样本和采样率共同确定：前提

- modality: general
- stage: sampling
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“时间轴必须由首样本和采样率共同确定”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-035 时间轴必须由首样本和采样率共同确定：验证

- modality: general
- stage: sampling
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“时间轴必须由首样本和采样率共同确定”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-036 时间轴必须由首样本和采样率共同确定：审计

- modality: general
- stage: sampling
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“时间轴必须由首样本和采样率共同确定”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-037 滤波参数必须满足 Nyquist 约束：规则

- modality: general
- stage: filtering
- knowledge_type: 执行规则
- review_status: seed_reviewed

任何截止频率必须低于当前采样率对应的 Nyquist 频率，并在重采样后重新验证。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-GENERAL-038 滤波参数必须满足 Nyquist 约束：前提

- modality: general
- stage: filtering
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“滤波参数必须满足 Nyquist 约束”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-GENERAL-039 滤波参数必须满足 Nyquist 约束：验证

- modality: general
- stage: filtering
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“滤波参数必须满足 Nyquist 约束”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-GENERAL-040 滤波参数必须满足 Nyquist 约束：审计

- modality: general
- stage: filtering
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“滤波参数必须满足 Nyquist 约束”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html

# NF-GENERAL-041 自动质量阈值必须有依据：规则

- modality: general
- stage: quality_control
- knowledge_type: 执行规则
- review_status: seed_reviewed

质量阈值应来自方法定义、数据分布或预注册规则，不能为了提高保留率事后移动。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-042 自动质量阈值必须有依据：前提

- modality: general
- stage: quality_control
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“自动质量阈值必须有依据”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-043 自动质量阈值必须有依据：验证

- modality: general
- stage: quality_control
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“自动质量阈值必须有依据”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-044 自动质量阈值必须有依据：审计

- modality: general
- stage: quality_control
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“自动质量阈值必须有依据”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-045 异常值不能自动等同伪迹：规则

- modality: general
- stage: quality_control
- knowledge_type: 执行规则
- review_status: seed_reviewed

统计异常只提供检查线索；删除前应结合空间、频谱、时间和辅助通道证据。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-046 异常值不能自动等同伪迹：前提

- modality: general
- stage: quality_control
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“异常值不能自动等同伪迹”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-047 异常值不能自动等同伪迹：验证

- modality: general
- stage: quality_control
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“异常值不能自动等同伪迹”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-048 异常值不能自动等同伪迹：审计

- modality: general
- stage: quality_control
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“异常值不能自动等同伪迹”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-049 原始数据必须保持不可变：规则

- modality: general
- stage: workflow
- knowledge_type: 执行规则
- review_status: seed_reviewed

预处理应写入副本或衍生文件，并保留原文件校验值用于追溯。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-050 原始数据必须保持不可变：前提

- modality: general
- stage: workflow
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“原始数据必须保持不可变”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-051 原始数据必须保持不可变：验证

- modality: general
- stage: workflow
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“原始数据必须保持不可变”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-052 原始数据必须保持不可变：审计

- modality: general
- stage: workflow
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“原始数据必须保持不可变”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-053 处理步骤必须可重放：规则

- modality: general
- stage: workflow
- knowledge_type: 执行规则
- review_status: seed_reviewed

流程必须保存顺序、参数、软件版本、随机种子和输入输出标识，使相同环境可重放。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-054 处理步骤必须可重放：前提

- modality: general
- stage: workflow
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“处理步骤必须可重放”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-055 处理步骤必须可重放：验证

- modality: general
- stage: workflow
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“处理步骤必须可重放”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-056 处理步骤必须可重放：审计

- modality: general
- stage: workflow
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“处理步骤必须可重放”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-057 失败不得静默降级：规则

- modality: general
- stage: workflow
- knowledge_type: 执行规则
- review_status: seed_reviewed

算法失败、缺少依赖或条件不满足时必须返回明确状态，禁止把未处理数据标记为已处理。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-058 失败不得静默降级：前提

- modality: general
- stage: workflow
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“失败不得静默降级”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-059 失败不得静默降级：验证

- modality: general
- stage: workflow
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“失败不得静默降级”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-060 失败不得静默降级：审计

- modality: general
- stage: workflow
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“失败不得静默降级”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-061 自动重试必须有停止条件：规则

- modality: general
- stage: workflow
- knowledge_type: 执行规则
- review_status: seed_reviewed

参数重试应限制次数、搜索范围和接受标准，并保留每次失败原因。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-062 自动重试必须有停止条件：前提

- modality: general
- stage: workflow
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“自动重试必须有停止条件”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-063 自动重试必须有停止条件：验证

- modality: general
- stage: workflow
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“自动重试必须有停止条件”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-064 自动重试必须有停止条件：审计

- modality: general
- stage: workflow
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“自动重试必须有停止条件”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-065 训练测试边界必须先于拟合确定：规则

- modality: general
- stage: evaluation
- knowledge_type: 执行规则
- review_status: seed_reviewed

标准化、特征选择、伪迹阈值和超参数选择只能在训练数据内拟合。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-GENERAL-066 训练测试边界必须先于拟合确定：前提

- modality: general
- stage: evaluation
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“训练测试边界必须先于拟合确定”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-GENERAL-067 训练测试边界必须先于拟合确定：验证

- modality: general
- stage: evaluation
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“训练测试边界必须先于拟合确定”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-GENERAL-068 训练测试边界必须先于拟合确定：审计

- modality: general
- stage: evaluation
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“训练测试边界必须先于拟合确定”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-GENERAL-069 受试者边界必须匹配泛化目标：规则

- modality: general
- stage: evaluation
- knowledge_type: 执行规则
- review_status: seed_reviewed

声称跨受试者泛化时，测试受试者的数据不得进入训练拟合。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-GENERAL-070 受试者边界必须匹配泛化目标：前提

- modality: general
- stage: evaluation
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“受试者边界必须匹配泛化目标”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-GENERAL-071 受试者边界必须匹配泛化目标：验证

- modality: general
- stage: evaluation
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“受试者边界必须匹配泛化目标”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-GENERAL-072 受试者边界必须匹配泛化目标：审计

- modality: general
- stage: evaluation
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“受试者边界必须匹配泛化目标”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-GENERAL-073 会话边界必须匹配泛化目标：规则

- modality: general
- stage: evaluation
- knowledge_type: 执行规则
- review_status: seed_reviewed

声称跨会话泛化时，测试会话不得参与训练或阈值选择。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-GENERAL-074 会话边界必须匹配泛化目标：前提

- modality: general
- stage: evaluation
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“会话边界必须匹配泛化目标”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-GENERAL-075 会话边界必须匹配泛化目标：验证

- modality: general
- stage: evaluation
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“会话边界必须匹配泛化目标”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-GENERAL-076 会话边界必须匹配泛化目标：审计

- modality: general
- stage: evaluation
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“会话边界必须匹配泛化目标”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-GENERAL-077 类别指标必须结合类别分布：规则

- modality: general
- stage: evaluation
- knowledge_type: 执行规则
- review_status: seed_reviewed

报告准确率、AUC 或 F1 时必须同时记录类别数量和正类定义。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-GENERAL-078 类别指标必须结合类别分布：前提

- modality: general
- stage: evaluation
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“类别指标必须结合类别分布”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-GENERAL-079 类别指标必须结合类别分布：验证

- modality: general
- stage: evaluation
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“类别指标必须结合类别分布”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-GENERAL-080 类别指标必须结合类别分布：审计

- modality: general
- stage: evaluation
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“类别指标必须结合类别分布”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://moabb.neurotechx.com/docs/api.html

# NF-GENERAL-081 质量提升必须比较同一时间范围：规则

- modality: general
- stage: evaluation
- knowledge_type: 执行规则
- review_status: seed_reviewed

处理前后质量比较必须使用可对应的通道和时间范围，避免因删除数据产生虚假改善。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-082 质量提升必须比较同一时间范围：前提

- modality: general
- stage: evaluation
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“质量提升必须比较同一时间范围”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-083 质量提升必须比较同一时间范围：验证

- modality: general
- stage: evaluation
- knowledge_type: 结果验证
- review_status: seed_reviewed

完成“质量提升必须比较同一时间范围”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-084 质量提升必须比较同一时间范围：审计

- modality: general
- stage: evaluation
- knowledge_type: 审计与失败处理
- review_status: seed_reviewed

“质量提升必须比较同一时间范围”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。

来源：官方文档，https://mne.tools/stable/auto_tutorials/preprocessing/index.html

# NF-GENERAL-085 人工覆盖必须进入审计记录：规则

- modality: general
- stage: audit
- knowledge_type: 执行规则
- review_status: seed_reviewed

用户修改坏道、成分或参数时应记录旧值、新值、时间和理由。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：检查该规则是否在计划中被显式满足，并输出通过或阻断状态。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/

# NF-GENERAL-086 人工覆盖必须进入审计记录：前提

- modality: general
- stage: audit
- knowledge_type: 适用前提
- review_status: seed_reviewed

执行“人工覆盖必须进入审计记录”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。

适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。验证：列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。

来源：官方文档，https://bids-specification.readthedocs.io/en/stable/
