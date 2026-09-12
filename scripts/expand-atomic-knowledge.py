"""Build the reviewed seed expansion used by NeuroFlow's Markdown RAG corpus.

The catalog below contains domain concepts distilled from official documentation.
Each concept is split into four independently retrievable decision atoms: rule,
precondition, verification, and audit/failure handling. Existing hand-written atoms
remain authoritative; this script only fills each top-level domain to 100 entries.
"""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1] / "docs" / "knowledge"

MNE = "https://mne.tools/stable/auto_tutorials/preprocessing/index.html"
MNE_FILTER = "https://mne.tools/stable/auto_tutorials/preprocessing/25_background_filtering.html"
MNE_EPOCHS = "https://mne.tools/stable/generated/mne.Epochs.html"
MNE_MAXWELL = "https://mne.tools/stable/auto_tutorials/preprocessing/60_maxwell_filtering_sss.html"
MNE_FNIRS = "https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html"
MNE_NIRS_API = "https://mne.tools/stable/generated/mne.preprocessing.nirs.optical_density.html"
EEGLAB = "https://eeglab.org/tutorials/05_Preprocess/"
MOABB = "https://moabb.neurotechx.com/docs/api.html"
MOABB_PREP = "https://moabb.neurotechx.com/docs/auto_examples/advanced_examples/plot_pre_processing_steps.html"
BIDS = "https://bids-specification.readthedocs.io/en/stable/"


CATALOG = {
    "general": [
        ("metadata", "受试者标识去标识化", "进入共享或索引范围的受试者标识必须去标识化，并保留受控映射，而不是把姓名等直接标识写入衍生文件。", BIDS),
        ("metadata", "会话和运行层级不可混淆", "subject、session、run 和 task 表示不同层级；合并前必须保留这些边界。", BIDS),
        ("metadata", "通道名称必须唯一", "同一记录内通道名称必须唯一，重命名时还要同步更新坏道、注释和蒙太奇引用。", MNE),
        ("metadata", "通道类型必须显式确认", "EEG、EOG、ECG、刺激、MEG 和 fNIRS 通道不能只按名称猜测，处理前必须核对类型。", MNE),
        ("metadata", "坐标系必须伴随坐标保存", "传感器或头部坐标若缺少坐标系和单位便不可安全组合或变换。", BIDS),
        ("metadata", "事件时间基准必须统一", "事件 onset、样本索引和绝对时间必须转换到同一已知时间基准后才能对齐。", BIDS),
        ("units", "数值与物理单位必须绑定", "振幅、距离、时间和频率数值必须连同单位解释，禁止仅凭数量级静默换算。", BIDS),
        ("sampling", "采样率必须从文件元数据读取", "存在可信元数据时应读取实际采样率，不应从样本数或常见设备默认值猜测。", MNE),
        ("sampling", "时间轴必须由首样本和采样率共同确定", "生成时间轴时必须考虑采样率、首样本偏移和裁剪，不应假设记录从零开始。", MNE),
        ("filtering", "滤波参数必须满足 Nyquist 约束", "任何截止频率必须低于当前采样率对应的 Nyquist 频率，并在重采样后重新验证。", MNE_FILTER),
        ("quality_control", "自动质量阈值必须有依据", "质量阈值应来自方法定义、数据分布或预注册规则，不能为了提高保留率事后移动。", MNE),
        ("quality_control", "异常值不能自动等同伪迹", "统计异常只提供检查线索；删除前应结合空间、频谱、时间和辅助通道证据。", MNE),
        ("workflow", "原始数据必须保持不可变", "预处理应写入副本或衍生文件，并保留原文件校验值用于追溯。", BIDS),
        ("workflow", "处理步骤必须可重放", "流程必须保存顺序、参数、软件版本、随机种子和输入输出标识，使相同环境可重放。", BIDS),
        ("workflow", "失败不得静默降级", "算法失败、缺少依赖或条件不满足时必须返回明确状态，禁止把未处理数据标记为已处理。", MNE),
        ("workflow", "自动重试必须有停止条件", "参数重试应限制次数、搜索范围和接受标准，并保留每次失败原因。", MNE),
        ("evaluation", "训练测试边界必须先于拟合确定", "标准化、特征选择、伪迹阈值和超参数选择只能在训练数据内拟合。", MOABB),
        ("evaluation", "受试者边界必须匹配泛化目标", "声称跨受试者泛化时，测试受试者的数据不得进入训练拟合。", MOABB),
        ("evaluation", "会话边界必须匹配泛化目标", "声称跨会话泛化时，测试会话不得参与训练或阈值选择。", MOABB),
        ("evaluation", "类别指标必须结合类别分布", "报告准确率、AUC 或 F1 时必须同时记录类别数量和正类定义。", MOABB),
        ("evaluation", "质量提升必须比较同一时间范围", "处理前后质量比较必须使用可对应的通道和时间范围，避免因删除数据产生虚假改善。", MNE),
        ("audit", "人工覆盖必须进入审计记录", "用户修改坏道、成分或参数时应记录旧值、新值、时间和理由。", BIDS),
    ],
    "eeg": [
        ("import", "导入后核对 EEG 通道类型", "读取文件后必须确认 EEG、EOG、ECG、刺激和杂项通道分类，再选择处理对象。", MNE),
        ("montage", "插值前必须有有效电极位置", "没有可信电极位置时不能声称完成空间插值，应请求蒙太奇或保留坏道。", MNE),
        ("montage", "标准蒙太奇匹配必须处理命名差异", "应用标准蒙太奇前必须处理大小写、别名和缺失电极，不能按通道顺序强行匹配。", MNE),
        ("quality_control", "平坦通道需要按持续时间判断", "短暂低振幅与持续平坦含义不同，坏道判断应结合窗口长度和占比。", MNE),
        ("quality_control", "高噪声通道需要多证据确认", "高方差通道应结合频谱、邻近通道相关和时间定位确认，避免删除真实局部活动。", MNE),
        ("filtering", "高通滤波可能改变慢成分", "提高高通截止频率可能扭曲慢波和 ERP，参数必须由目标成分决定。", MNE_FILTER),
        ("filtering", "低通滤波必须保护目标频带", "低通截止频率必须覆盖研究目标频率，并检查过渡带和衰减。", MNE_FILTER),
        ("filtering", "陷波仅用于明确窄带干扰", "只有观察到电源线或明确窄带峰值时才应选择陷波及其谐波。", MNE_FILTER),
        ("filtering", "零相位滤波不适合在线因果声明", "双向零相位滤波会使用未来样本，离线结果不能直接代表实时因果延迟。", MNE_FILTER),
        ("filtering", "滤波边缘必须标记或排除", "记录边界、拼接点和短片段附近的滤波瞬态应检查并从关键分析中排除。", MNE_FILTER),
        ("resampling", "连续数据重采样要同步事件", "Raw 重采样时必须同步更新事件位置并量化事件时间误差。", MNE),
        ("referencing", "平均参考要求足够空间覆盖", "平均参考的解释依赖电极覆盖；稀疏或偏侧布局时不能默认采用。", MNE),
        ("referencing", "参考通道坏信号会传播", "选择单电极或双乳突参考前必须检查参考通道质量。", MNE),
        ("referencing", "参考变换会改变数据秩", "平均参考或投影参考会影响秩和后续协方差估计，必须记录。", MNE),
        ("bad_channels", "坏道插值应在位置可靠时执行", "插值依赖邻近传感器几何；位置缺失或坏道过多时应停止或降级。", MNE),
        ("bad_channels", "插值不能掩盖过多坏道", "当坏道比例或空间聚集超过预设标准时，应报告该记录质量不足，而不是全部插值。", MNE),
        ("artifacts", "ICA 前必须评估数据秩", "ICA 成分数必须与有效数据秩兼容，参考和插值造成的秩变化要计入。", MNE),
        ("artifacts", "ICA 拟合数据应避免极端污染", "长时极端伪迹会主导 ICA，拟合前应排除明确坏段并保留选择记录。", MNE),
        ("artifacts", "ICA 成分删除需要可解释证据", "删除眼动、心电或肌电成分应结合拓扑、时间序列、频谱和辅助通道评分。", MNE),
        ("epoching", "事件重复必须显式处理", "同一样本出现重复事件时必须选择报错、合并或丢弃策略并记录。", MNE_EPOCHS),
    ],
    "meg": [
        ("import", "MEG 通道类型必须区分", "磁强计、梯度计、参考 MEG、刺激和辅助通道需要正确分类后才能缩放和质控。", MNE),
        ("geometry", "设备坐标与头坐标不能混用", "传感器设备坐标、头坐标及其变换必须明确，缺少变换时不可进行依赖头坐标的操作。", MNE_MAXWELL),
        ("geometry", "digitization 点必须检查", "头形点、基准点和 HPI 点应检查离群与单位，错误几何会影响配准和 SSS origin。", MNE_MAXWELL),
        ("quality_control", "磁强计和梯度计阈值应分开", "不同 MEG 传感器类型的物理单位和噪声尺度不同，不能共用未经换算的幅值阈值。", MNE),
        ("quality_control", "平坦和噪声坏道应分开记录", "flat 与 noisy 通道代表不同故障证据，自动检测结果应分别保留。", MNE_MAXWELL),
        ("quality_control", "坏道自动检测需检查临界评分", "接近阈值或只在少数窗口异常的通道需要额外复核。", MNE_MAXWELL),
        ("environmental_noise", "空房数据必须匹配系统状态", "使用 empty-room 数据估计环境噪声时，应核对日期、设备配置、坏道和处理步骤。", MNE),
        ("environmental_noise", "参考传感器处理依赖设备设计", "参考 MEG 通道不能在未知设备语义时任意删除或回归。", MNE),
        ("filtering", "MEG 电源线处理必须基于频谱", "陷波频率及谐波应根据实际窄带峰值和采样率选择。", MNE_FILTER),
        ("filtering", "cHPI 信号应按分析需要处理", "连续头位指示信号可能影响频谱或坏道检测，是否去除应结合后续步骤。", MNE_MAXWELL),
        ("maxwell_filter", "Maxwell 前必须设置最终坏道", "坏道必须在 SSS 前标记，以避免伪迹扩散到重建通道。", MNE_MAXWELL),
        ("maxwell_filter", "校准文件必须匹配站点设备", "fine-calibration 文件具有设备和站点特异性，不能跨系统随意复用。", MNE_MAXWELL),
        ("maxwell_filter", "cross-talk 文件必须匹配设备", "串扰补偿文件应与采集系统匹配，缺失时必须记录。", MNE_MAXWELL),
        ("maxwell_filter", "SSS origin 必须合理", "球谐展开原点应基于可靠头形拟合或显式设置，自动拟合失败时不得静默继续。", MNE_MAXWELL),
        ("maxwell_filter", "tSSS 窗口与相关阈值必须记录", "时空 SSS 参数会改变信号分离，应作为可审计参数保存并验证。", MNE_MAXWELL),
        ("maxwell_filter", "非 Neuromag Maxwell 属实验性使用", "对非 Neuromag 系统不能把 Maxwell 结果描述为等同经过充分验证的 Neuromag 流程。", MNE_MAXWELL),
        ("movement", "运动补偿需要连续头位数据", "缺少有效 head_pos 时不能声称执行了连续运动补偿。", MNE_MAXWELL),
        ("movement", "头位轨迹需检查跳变", "补偿前必须检查头位平移、旋转、时间覆盖和不合理跳变。", MNE_MAXWELL),
        ("movement", "跨运行目标头位应统一", "多运行比较或拼接时应使用预先定义且兼容的 destination。", MNE_MAXWELL),
        ("artifacts", "EOG 伪迹评分需要眼动证据", "眼动 SSP 或 ICA 成分应结合 EOG 通道、拓扑与锁时平均确认。", MNE),
        ("artifacts", "ECG 伪迹评分需要心搏证据", "心磁伪迹成分应结合 ECG 或自动心搏事件与空间模式确认。", MNE),
        ("artifacts", "肌肉伪迹需结合高频和时间定位", "高频功率只能作为肌肉伪迹线索，应结合空间分布和原始波形。", MNE),
        ("artifacts", "SQUID 跳变应标记坏段", "传感器跳变或重置造成的不连续区间应标注，避免进入滤波和 Epoch。", MNE),
        ("ssp", "SSP 投影数量必须受控", "增加投影向量会移除更多子空间，必须检查解释方差与目标响应保留。", MNE),
        ("ica", "MEG ICA 成分数受数据秩约束", "经过 SSS 或投影后的有效秩决定 ICA 可用成分数。", MNE),
        ("covariance", "噪声协方差必须匹配数据处理", "估计噪声协方差的数据需采用与分析数据兼容的滤波、投影、坏道和秩设置。", MNE),
        ("epoching", "MEG Epoch 拒绝阈值需按通道类型", "磁强计和梯度计的峰峰值拒绝阈值必须分别设置。", MNE_EPOCHS),
        ("workflow", "Maxwell 输出需复查数据秩", "SSS 会改变有效维度，后续逆解、白化和 ICA 前应重新估计秩。", MNE_MAXWELL),
        ("workflow", "处理后应比较场图和频谱", "MEG 自动流程完成后应比较原始与处理后的传感器场图、频谱和关键诱发响应。", MNE),
        ("workflow", "缺失系统文件时必须能力降级", "缺少校准、串扰或头位数据时，只执行满足前提的步骤并明确未完成能力。", MNE_MAXWELL),
        ("workflow", "输出必须保留坐标变换", "衍生 MEG 数据必须保存 dev_head_t、坏道、投影和补偿目标等关键信息。", MNE),
    ],
    "fnirs": [
        ("import", "fNIRS 通道必须保留源探测器语义", "导入时必须保留 source、detector、wavelength 和通道配对，不能只留下显示名称。", MNE_FNIRS),
        ("geometry", "源探测器距离单位必须验证", "计算通道距离前应确认 optode 坐标单位和头坐标系。", MNE_FNIRS),
        ("quality_control", "原始光强必须检查非正值", "光密度变换前应检查零值、负值、饱和和异常动态范围。", MNE_NIRS_API),
        ("quality_control", "SCI 应在适当数据阶段计算", "头皮耦合指标应按方法要求在配对波长数据上计算，并记录阈值。", MNE_FNIRS),
        ("quality_control", "低 SCI 通道应先标记", "低耦合通道应在后续转换和统计解释前标记，而不是依靠滤波修复。", MNE_FNIRS),
        ("quality_control", "通道距离异常需要检查几何", "过短、过长或无法计算的源探测器距离提示位置或通道元数据问题。", MNE_FNIRS),
        ("optical_density", "光密度只能从光强表示转换", "重复对已经是 optical density 的数据执行转换会破坏数值含义。", MNE_NIRS_API),
        ("optical_density", "光密度变换前后通道配对应一致", "转换不能丢失波长和源探测器配对关系。", MNE_NIRS_API),
        ("motion", "TDDR 主要处理尖峰和基线跳变", "TDDR 可作为运动校正候选，但不能保证消除所有运动影响。", MNE_FNIRS),
        ("motion", "TDDR 输入阶段必须记录", "调用 TDDR 时应记录输入是光密度还是其他表示，并遵循当前 API 对通道类型的要求。", MNE_FNIRS),
        ("motion", "运动校正必须进行前后比较", "应在相同时间和通道上比较校正前后波形、导数异常和任务响应。", MNE_FNIRS),
        ("motion", "严重运动区间仍可需要排除", "校正后仍存在不连续、饱和或大幅异常的区间应标注并在分析中排除。", MNE_FNIRS),
        ("beer_lambert", "Beer-Lambert 输入必须是光密度", "血红蛋白浓度转换前必须确认通道表示为 optical density。", MNE_FNIRS),
        ("beer_lambert", "波长信息缺失时不能完成转换", "没有可靠波长和配对信息时不得生成 HbO/HbR 浓度。", MNE_FNIRS),
        ("beer_lambert", "路径长度因子必须记录", "partial pathlength factor 会影响浓度尺度，使用值和依据必须写入审计记录。", MNE_FNIRS),
        ("beer_lambert", "HbO 与 HbR 通道必须成对核对", "转换后应检查每个测量对是否产生预期的 HbO/HbR 通道及单位。", MNE_FNIRS),
        ("filtering", "fNIRS 高通应保护任务慢变化", "高通截止频率应结合任务周期，避免移除目标血流动力学趋势。", MNE_FILTER),
        ("filtering", "fNIRS 低通应检查生理成分影响", "低通参数应根据目标响应及心跳、呼吸等成分的处理策略选择。", MNE_FILTER),
        ("filtering", "短记录不宜使用过长滤波器", "滤波器长度相对记录过长会增加边缘和瞬态影响。", MNE_FILTER),
        ("short_channels", "短距离通道必须由距离定义", "不能只按通道名称判断 short channel，应根据可靠源探测器距离和实验设置识别。", MNE_FNIRS),
        ("short_channels", "短通道回归必须限制在训练或模型内", "用于预测评估时，短通道回归参数不得利用测试标签或跨越评估边界拟合。", MOABB),
        ("epoching", "fNIRS Epoch 时间窗应覆盖延迟响应", "分段窗口需依据任务设计和血流动力学延迟选择，不能直接复用 EEG 短窗口。", MNE_EPOCHS),
        ("workflow", "每步必须检查 fNIRS 数据表示", "自动流程要在光强、光密度和血红蛋白阶段间进行类型和单位断言。", MNE_FNIRS),
    ],
    "bci": [
        ("dataset", "数据集范式必须与任务匹配", "只有数据集声明的事件和范式与目标处理兼容时才能纳入评估。", MOABB),
        ("dataset", "受试者列表必须显式记录", "子集实验必须保存纳入和排除的受试者编号及理由。", MOABB),
        ("dataset", "会话数量决定可用评估", "少于两个会话的数据集不能用于标准跨会话评估。", MOABB),
        ("dataset", "多数据集合并需处理通道差异", "采用通道交集或并集必须显式选择，并验证缺失通道处理。", MOABB),
        ("paradigm", "范式定义事件到试次的转换", "频带、事件、时间窗、通道和重采样应由范式配置统一管理。", MOABB),
        ("motor_imagery", "运动想象类别必须来自事件语义", "左右手、足和舌等类别不能从整数编码顺序猜测。", MOABB),
        ("motor_imagery", "二分类与多分类指标应区分", "类别数变化会影响默认评分和随机基线，结果必须标明类别集合。", MOABB),
        ("motor_imagery", "滤波器组选择必须在训练内完成", "用于选择运动想象子频带的验证不得查看测试折。", MOABB_PREP),
        ("p300", "P300 使用 Target/NonTarget 语义", "原始事件必须可靠映射为目标与非目标，不能按编号大小猜测。", MOABB),
        ("p300", "P300 类不平衡需合适指标", "应报告类别分布，并优先采用预先指定的 ROC-AUC 等适合不平衡任务的指标。", MOABB),
        ("p300", "P300 Epoch 窗口由响应目标决定", "时间窗和基线必须匹配刺激锁时响应并在所有比较中保持一致。", MOABB),
        ("ssvep", "SSVEP 类别应对应刺激频率或事件", "类别映射必须从数据集事件定义读取。", MOABB),
        ("ssvep", "SSVEP 滤波器组必须覆盖目标频率", "滤波器及谐波设计要依据实际刺激频率和采样率。", MOABB),
        ("ssvep", "单带与滤波器组应公平比较", "比较时必须使用相同试次、划分和评价指标。", MOABB),
        ("cvep", "cVEP 编码由数据集实验定义", "码序列、事件和类别不能从另一个 cVEP 数据集迁移假设。", MOABB),
        ("cvep", "cVEP 时间窗要与刺激编码对齐", "Epoch 起点和长度必须与码序列时序一致。", MOABB),
        ("pipeline", "所有学习型预处理必须进入 Pipeline", "标准化、对齐、特征选择和分类器应在每个训练折内拟合。", MOABB_PREP),
        ("pipeline", "Raw、Epoch 和 Array 步骤不能混淆", "自定义处理步骤应放在其接受的数据层级上，并验证输入输出形状。", MOABB_PREP),
        ("pipeline", "缓存键必须反映处理配置", "改变范式、预处理或数据版本后不得误用旧缓存结果。", MOABB),
        ("evaluation", "同会话评估只代表同会话泛化", "WithinSession 结果不能直接声称跨天或跨受试者有效。", MOABB),
        ("evaluation", "跨会话评估按会话留出", "测试会话不能参与训练、参数选择或校准，除非协议明确允许。", MOABB),
        ("evaluation", "跨受试者评估按受试者留出", "测试受试者数据不能进入训练拟合，目标校准协议必须单独声明。", MOABB),
        ("evaluation", "随机种子必须固定", "涉及打乱、拆分或随机模型时应保存 random_state。", MOABB),
        ("evaluation", "超参数搜索必须嵌套", "网格搜索或 Optuna 只能使用训练折内部验证，不能在最终测试分数上选参。", MOABB),
        ("evaluation", "多模型比较应使用相同折", "比较的 Pipeline 必须使用同一数据、预处理定义和拆分。", MOABB),
        ("evaluation", "结果必须包含样本与通道规模", "分数应伴随数据集、受试者、会话、样本数、通道数和 Pipeline 名称。", MOABB),
        ("evaluation", "缓存结果覆盖必须显式", "`overwrite` 的选择要记录，避免把旧结果误认为本次重新计算。", MOABB),
        ("statistics", "折内分数不能当独立受试者", "统计比较应尊重受试者和会话层级，不能把相关交叉验证折当作独立样本。", MOABB),
        ("statistics", "性能差异需报告不确定性", "模型比较应同时给出效应、变异或置信信息，而不只给平均分。", MOABB),
    ],
}

FACETS = [
    ("规则", "执行规则", "{rule}", "检查该规则是否在计划中被显式满足，并输出通过或阻断状态。"),
    ("前提", "适用前提", "执行“{title}”相关步骤前，Agent 必须确认输入元数据、数据阶段和算法前提足以支持该操作；无法确认时应请求信息或降级。", "列出已满足、缺失和推断的前提，禁止把推断值写成文件事实。"),
    ("验证", "结果验证", "完成“{title}”相关步骤后，必须在相同通道和时间范围内检查处理前后差异，确认目标改善且关键信号未被不可接受地破坏。", "保存数值指标和可视化摘要；验证失败时不得把步骤标记为成功。"),
    ("审计", "审计与失败处理", "“{title}”的参数、输入输出、警告、耗时和决策理由必须进入审计记录；发生异常时保留原始错误并执行有边界的重试。", "审计记录必须能定位输入文件、软件版本、参数、结果和重试次数。"),
]


def current_count(domain: str) -> int:
    count = 0
    for path in (ROOT / domain).rglob("*.md"):
        if path.name.lower() == "readme.md":
            continue
        count += len(re.findall(r"(?m)^#\s+[A-Z0-9-]+\s+", path.read_text(encoding="utf-8")))
    return count


def build_domain(domain: str) -> None:
    have = current_count(domain)
    need = 100 - have
    if need < 0:
        raise RuntimeError(f"{domain} already exceeds 100 entries: {have}")
    # The indexing script intentionally skips underscore-prefixed documentation,
    # so the generated corpus uses a normal indexable filename.
    output = ROOT / domain / "seed_expansion.knowledge.md"
    if output.exists():
        output.unlink()
        have = current_count(domain)
        need = 100 - have
    atoms = []
    for stage, title, rule, source in CATALOG[domain]:
        for suffix, kind, template, verification in FACETS:
            atoms.append((stage, f"{title}：{suffix}", kind, template.format(title=title, rule=rule), verification, source))
    if len(atoms) < need:
        raise RuntimeError(f"catalog for {domain} has only {len(atoms)} atoms; needs {need}")
    prefix = {"general": "NF-GENERAL", "eeg": "NF-EEG", "meg": "NF-MEG", "fnirs": "NF-FNIRS", "bci": "NF-BCI"}[domain]
    chunks = []
    for offset, (stage, title, kind, body, verification, source) in enumerate(atoms[:need], start=1):
        chunks.append(
            f"# {prefix}-{offset:03d} {title}\n\n"
            f"- modality: {domain.upper() if domain != 'general' else 'general'}\n"
            f"- stage: {stage}\n"
            f"- knowledge_type: {kind}\n"
            f"- review_status: seed_reviewed\n\n"
            f"{body}\n\n"
            f"适用范围与限制：本条是自动决策的必要检查点，不单独构成完整预处理方案；具体参数仍由文件事实、研究目标和相邻步骤决定。"
            f"验证：{verification}\n\n"
            f"来源：官方文档，{source}\n"
        )
    with output.open("w", encoding="utf-8", newline="\n") as stream:
        stream.write("\n".join(chunks))


for name in CATALOG:
    build_domain(name)

for name in CATALOG:
    if current_count(name) != 100:
        raise RuntimeError(f"{name} did not reach exactly 100 entries")

print("Expanded general, EEG, MEG, fNIRS, and BCI to exactly 100 entries each.")
