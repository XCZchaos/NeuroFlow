# MNE-FNIRS-007 fNIRS 流程必须跟踪数据表示阶段

- modality: fNIRS
- stage: workflow
- software: MNE-Python
- knowledge_type: constraint
- review_status: seed_reviewed

fNIRS 数据可能依次处于原始光强、光密度和血红蛋白浓度表示。Agent 每一步都必须检查当前通道类型和单位，避免重复转换或把只接受特定表示的算法用在错误阶段。

验证：在审计记录中保存每步输入输出的通道类型、单位、通道数与数值范围。

来源：MNE-Python 官方 fNIRS 预处理教程，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html

# MNE-FNIRS-008 fNIRS 自动流程应先做耦合质量判断

- modality: fNIRS
- stage: workflow
- software: MNE-Python
- knowledge_type: decision
- review_status: seed_reviewed

在转换和统计分析前，应评估光源—探测器通道的头皮耦合质量并标记不可靠通道。运动校正、Beer-Lambert 转换和滤波不能替代对低质量测量的识别。

验证：保存 SCI 或所用质量指标、阈值依据、坏道列表以及处理前后通道数量。

来源：MNE-Python 官方 fNIRS 预处理教程，https://mne.tools/stable/auto_tutorials/preprocessing/70_fnirs_processing.html
