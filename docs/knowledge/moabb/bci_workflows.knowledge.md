# MOABB-BCI-001 数据集必须与范式兼容

- modality: EEG
- stage: dataset_selection
- software: MOABB
- review_status: seed_reviewed

MOABB 将数据集和范式分开管理，但只有兼容的数据集才能由对应范式处理。例如运动想象数据不应被当作 P300 数据处理。Agent 在制定流程前必须确认数据集声明的 paradigm、事件标签和用户研究目标一致。

验证：检查 `dataset.paradigm`、范式兼容数据集列表、事件集合与类别映射。

来源：MOABB 官方 Simple Motor Imagery 教程，https://moabb.neurotechx.com/docs/auto_examples/tutorials/tutorial_1_simple_example_motor_imagery.html

# MOABB-BCI-002 Paradigm 定义从连续信号到试次的转换

- modality: EEG
- stage: epoching
- software: MOABB
- review_status: seed_reviewed

MOABB 的 Paradigm 定义事件选择、Epoch 时间窗、滤波、通道和重采样等步骤，把连续数据转换成可供解码器使用的试次数组与标签。因此预处理参数不是脱离范式独立决定的；运动想象、P300、SSVEP 和 c-VEP 应使用各自的事件与时间结构。

验证：记录 paradigm 类、事件映射、tmin/tmax、滤波频段、通道和重采样设置。

来源：MOABB 官方 API and Main Concepts，https://moabb.neurotechx.com/docs/api.html

# MOABB-BCI-003 评估协议决定模型可以看到哪些数据

- modality: EEG
- stage: evaluation
- software: MOABB
- review_status: seed_reviewed

Within-session、cross-session 和 cross-subject 评估回答不同的泛化问题。Agent 不能只报告准确率而不说明数据划分；尤其跨被试评估必须明确目标被试数据是否参与训练或适配，以防止数据泄漏和夸大泛化能力。

验证：记录评估类、分组字段、折数、随机种子、目标域可见范围和最终指标。

来源：MOABB 官方 API and Main Concepts，https://moabb.neurotechx.com/docs/api.html

# MOABB-BCI-004 Pipeline 必须包含全部可学习处理步骤

- modality: EEG
- stage: evaluation
- software: MOABB, scikit-learn
- review_status: seed_reviewed

MOABB 的 Pipeline 表达从输入试次到预测的完整算法链。任何根据数据估计参数的缩放、特征选择、空间滤波或分类步骤，都应在每个训练折内部拟合，不能先在全数据上拟合再交叉验证。

验证：检查 Pipeline 结构、每折拟合范围、缓存键和测试集是否参与参数估计。

来源：MOABB 官方 API and Main Concepts，https://moabb.neurotechx.com/docs/api.html

# MOABB-BCI-005 统一预处理有助于公平比较

- modality: EEG
- stage: benchmarking
- software: MOABB
- review_status: seed_reviewed

预处理选择会改变解码性能和算法排名。比较多个模型或数据集时，应尽量固定范式和预处理链，只改变被比较的算法部分。若为某个数据集定制预处理，必须单独披露，否则结果可能混合算法差异与预处理差异。

验证：保存每个实验的统一 pipeline、数据集版本、范式参数和差异清单。

来源：MOABB 官方 Playing with the pre-processing steps，https://moabb.neurotechx.com/docs/auto_examples/advanced_examples/plot_pre_processing_steps.html

# MOABB-BCI-006 运动想象频段是范式参数而非固定真理

- modality: EEG
- paradigm: motor_imagery
- stage: filtering
- software: MOABB
- review_status: seed_reviewed

MOABB 示例可使用 8–35 Hz 处理左右手运动想象，但该范围是具体范式配置，不应自动推广到所有运动想象、运动执行或想象言语数据。Agent 应结合目标节律、数据集说明、采样率和验证方案选择频段，并保留实际配置。

验证：比较候选频段的交叉验证结果，且频段选择必须在训练数据内完成。

来源：MOABB 官方 Getting Started 教程，https://moabb.neurotechx.com/docs/auto_examples/tutorials/tutorial_0_plot_getting_started.html

# MOABB-BCI-007 SSVEP 默认频段必须覆盖刺激频率及所需谐波

- modality: EEG
- paradigm: SSVEP
- stage: filtering
- software: MOABB
- review_status: seed_reviewed

MOABB `SSVEP` 类提供单带通配置，官方 API 当前默认示例为 7–45 Hz；真正的处理范围必须覆盖实验刺激频率以及算法需要的谐波。Agent 必须先读取刺激频率列表，不能因为软件存在默认值就直接采用默认频段。

验证：确认所有目标刺激频率和选定谐波位于通带内，并比较 filter-bank 与单频带方案。

来源：MOABB 官方 `moabb.paradigms.SSVEP` API，https://moabb.neurotechx.com/docs/generated/moabb.paradigms.SSVEP.html

# MOABB-BCI-008 可复现实验必须保存上下文

- modality: EEG
- stage: reproducibility
- software: MOABB
- review_status: seed_reviewed

可复现 BCI 基准不仅需要保存最终分数，还需要保存数据集、被试、会话、范式、Pipeline、评估方式、指标、随机种子、软件版本和缓存配置。Agent 输出结果时应关联这些上下文，避免把不同协议下的分数直接比较。

验证：确认运行记录能够重建数据选择、预处理、训练和评估流程。

来源：MOABB 官方主页与 Benchmark API，https://moabb.neurotechx.com/ ，https://moabb.neurotechx.com/docs/generated/moabb.benchmark.html
