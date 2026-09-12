# MOABB-BCI-006 运动想象频段是范式参数而非固定真理

- modality: EEG
- paradigm: motor_imagery
- stage: filtering
- software: MOABB
- review_status: seed_reviewed

MOABB 示例可使用 8–35 Hz 处理左右手运动想象，但该范围是具体范式配置，不应自动推广到所有运动想象、运动执行或想象言语数据。Agent 应结合目标节律、数据集说明、采样率和验证方案选择频段，并保留实际配置。

验证：比较候选频段的交叉验证结果，且频段选择必须在训练数据内完成。

来源：MOABB 官方 Getting Started 教程，https://moabb.neurotechx.com/docs/auto_examples/tutorials/tutorial_0_plot_getting_started.html
