# NeuroFlow 原子知识元数据规范

每条知识使用一级标题，以稳定知识 ID 开头。已有条目保持兼容；新建或复核条目建议包含以下字段：

```markdown
# MNE-EEG-999 标题

- modality: EEG
- paradigm: motor_imagery
- stage: filtering
- software: MNE
- source_version: 1.10
- reviewed_at: 2026-09-14
- review_status: expert_reviewed
- applies_when: 已确认采样率和下游分析目标
- contraindications: 未确认单位或连接性分析的相位要求
```

正文应包含一个可验证结论、适用条件、限制和验证办法，并以“来源：名称，官方 URL”结尾。`source_version` 表示依据的文档/软件版本，`reviewed_at` 表示本地最后复核日期。检索相似度不能替代适用条件判断；复杂回答还需要通过 `audit_knowledge_evidence` 检查知识 ID、官方来源和逐结论覆盖率。
