# MNE-FNIRS-003 Beer–Lambert 输入必须是光密度

- modality: fNIRS
- stage: beer_lambert
- knowledge_type: constraint
- review_status: seed_reviewed

`beer_lambert_law` 用于把光密度转换为血红蛋白浓度，其输入应为光密度数据。部分路径长度因子 PPF 会影响浓度尺度；MNE 支持为两个波长提供不同因子。Agent 不应在不知道输入通道类型或 PPF 假设时宣称获得了绝对可靠的浓度。

验证：记录输入通道类型、波长、PPF、输出 HbO/HbR 通道及单位。

来源：MNE-Python `beer_lambert_law` 官方 API，https://mne.tools/stable/generated/mne.preprocessing.nirs.beer_lambert_law.html
