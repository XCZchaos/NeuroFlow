# MOABB-BCI-007 SSVEP 默认频段必须覆盖刺激频率及所需谐波

- modality: EEG
- paradigm: SSVEP
- stage: filtering
- software: MOABB
- review_status: seed_reviewed

MOABB `SSVEP` 类提供单带通配置，官方 API 当前默认示例为 7–45 Hz；真正的处理范围必须覆盖实验刺激频率以及算法需要的谐波。Agent 必须先读取刺激频率列表，不能因为软件存在默认值就直接采用默认频段。

验证：确认所有目标刺激频率和选定谐波位于通带内，并比较 filter-bank 与单频带方案。

来源：MOABB 官方 `moabb.paradigms.SSVEP` API，https://moabb.neurotechx.com/docs/generated/moabb.paradigms.SSVEP.html
