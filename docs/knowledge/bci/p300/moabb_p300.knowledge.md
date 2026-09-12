# MOABB-BCI-009 P300 标签必须表达 Target 和 NonTarget 语义

- modality: EEG
- paradigm: P300
- stage: epoching
- software: MOABB
- knowledge_type: constraint
- review_status: seed_reviewed

MOABB 的 P300 范式用于 Target/NonTarget 分类。导入新数据集时，Agent 必须确认原始事件可以可靠映射到这两个语义类别，不能仅按事件码大小猜测标签。

验证：输出原始事件到标准标签的映射、类别计数和被忽略事件。

来源：MOABB 官方 P300 API，https://moabb.neurotechx.com/docs/generated/moabb.paradigms.P300.html

# MOABB-BCI-010 P300 类别不平衡时优先报告 ROC-AUC

- modality: EEG
- paradigm: P300
- stage: evaluation
- software: MOABB
- knowledge_type: evaluation
- review_status: seed_reviewed

MOABB 的 P300 范式默认评分指标是 ROC-AUC。由于 Target 与 NonTarget 数量常不相等，只报告准确率可能产生误导；Agent 应报告类别分布，并使用预先确定且适合任务的指标。

限制：ROC-AUC 不是所有部署目标的唯一指标。验证：固定正类定义，在独立测试划分上同时给出样本数、ROC-AUC 和任务要求的补充指标。

来源：MOABB 官方 P300 API，https://moabb.neurotechx.com/docs/generated/moabb.paradigms.P300.html
