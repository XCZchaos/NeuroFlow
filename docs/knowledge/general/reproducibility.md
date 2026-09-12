# GENERAL-REPRO-001 运行记录必须足以重建处理流程

- modality: EEG, MEG, fNIRS
- stage: reproducibility
- knowledge_type: requirement
- review_status: seed_reviewed

可复现记录至少包含输入文件标识、软件与依赖版本、随机种子、步骤顺序、请求参数、实际参数、被跳过或降级的步骤、输出文件和完成时间。只保存最终波形不足以复现分析。

验证：在没有原对话文本的情况下，审计记录仍能重建同一工具调用和参数。

来源：MOABB 官方 Benchmark API，https://moabb.neurotechx.com/docs/generated/moabb.benchmark.html

# GENERAL-REPRO-002 随机算法必须固定并记录种子

- modality: EEG, MEG, fNIRS
- stage: reproducibility
- knowledge_type: requirement
- review_status: seed_reviewed

ICA、交叉验证拆分和部分机器学习算法包含随机过程。Agent 应在可配置时设置随机种子并写入审计记录；仍可能受软件版本、数值库和硬件影响的步骤应标注其复现边界。

验证：在相同环境和输入上重复运行并比较关键结果。

来源：MOABB 官方 `setup_seed` 与评估接口，https://moabb.neurotechx.com/docs/api.html
