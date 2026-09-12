# NeuroFlow 初始 BCI 专家知识库

本目录保存经过提炼的原子知识，而不是官方文档全文。每个 `.knowledge.md` 文件可以包含多个知识点，但每个知识点必须以一个一级标题 `#` 开始；当前索引器会把每个一级标题切成独立向量。

每条知识至少包含：稳定 ID、模态、范式、处理阶段、知识结论、适用条件、限制或风险、验证方法、官方来源和审核状态。`review_status: seed_reviewed` 表示它是根据官方资料整理的初始知识，仍建议由领域研究者复核后升级为 `expert_reviewed`。

批量写入 Qdrant：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/index-knowledge.ps1
```

知识更新原则：一个知识点只表达一个核心决策；软件默认值只能作为实现事实，不能自动当作适用于所有研究的参数建议；修改知识后应重新执行索引脚本。
