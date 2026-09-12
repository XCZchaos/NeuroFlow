# GENERAL-LEAKAGE-001 可学习预处理必须限制在训练折内

- modality: EEG
- stage: evaluation
- knowledge_type: constraint
- review_status: seed_reviewed

任何根据数据估计参数的归一化、特征选择、空间滤波、协方差估计或分类步骤，都应只在当前训练折拟合，再应用于验证或测试折。先使用全数据拟合会把测试信息泄漏到训练过程，使评估结果偏高。

验证：检查 scikit-learn Pipeline、交叉验证分组和每个步骤的 `fit` 数据范围。

来源：MOABB 官方 API and Main Concepts，https://moabb.neurotechx.com/docs/api.html

# GENERAL-LEAKAGE-002 被试和会话边界必须匹配评估目标

- modality: EEG
- stage: evaluation
- knowledge_type: constraint
- review_status: seed_reviewed

随机混合所有试次可能让同一被试或同一会话同时进入训练与测试。研究跨会话或跨被试泛化时，必须使用相应的分组评估协议。Agent 应先明确目标是 within-session、cross-session 还是 cross-subject。

验证：保存 subject、session、run 分组以及每折训练测试标识。

来源：MOABB 官方 Evaluations，https://moabb.neurotechx.com/docs/api.html
