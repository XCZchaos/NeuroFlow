# 数据结构确认与设备导入模板

导入数据后，在数据集卡片下点击“编辑并试读”。修改配置后先点击“重新读取并预览”，检查实际采样率、样本数、振幅范围与电极图，再点击“验证并确认”。

## 编辑范围

- 名称和类型按原始通道顺序一一对应。名称必须非空且唯一；类型由 MNE 校验。
- “采集参考”保存参考电极信息，不会在导入阶段执行重参考。
- “排除”从后续 Raw 对象中去掉通道，不删除源文件；不能同时标记参考和排除，也不能排除全部通道。
- CSV/MAT 可显式指定行列方向。更换方向会清空通道编辑表，先试读再编辑新通道。
- 行为通道的 CSV 支持纯数值矩阵或每行第一列为通道名。包含时间/事件行的此类 CSV 需要先明确拆分，不能猜测为脑电通道。
- 电压单位 V/mV/µV 在结构化文件构造 RawArray 前转换。标准 EDF/FIF 等由 MNE 读取器转换为 SI，编辑器不重复缩放。
- 表格采样率用于构造时间轴，不是重采样；标准文件头或时间列与手填采样率冲突时拒绝确认。
- 振幅表是前最多 10 秒原始采样点的最小值、最大值与峰峰值，未去均值，不代表全记录的范围。
- 电极图投影 MNE 中可用的真实或标准 montage 坐标；没有坐标的通道不虚构位置。这是电极位置图，不是电位 topomap。
- 事件字典对象将原标签映射到新标签；列表只作事件说明。

## 保存与一致性

确认通过后配置保存到 `data/import-configs/`，不保存新的预处理波形。文件按规范化源路径的 SHA-256 定位，记录源文件大小和修改时间；源文件变化时要求重新确认。后端重启重新导入相同文件时复用配置。

`inspect_dataset.py`、`preview_dataset.py` 与 `analyze_dataset.py` 共同调用 `import_review.apply_config`；试读和确认都实际重新读取源文件。失败不会覆盖旧配置，确认后旧的“最新分析结果”缓存失效。参考通道保存在结构报告和 Raw description 中。

设备模板保存在当前 Electron 用户配置的 localStorage 中，可按名称保存和应用；模板不自动确认新文件。模板保存通道顺序、类型、排除和参考标记、单位、方向、采样率与 montage；事件字典不复制到其他实验。

## 验证

```powershell
python neuro_service/test_import_review.py
python neuro_service/test_structured_data.py
go test ./internal/server/dataset ./internal/handler ./internal/server/ai/tools
```

Electron DOM 测试：`desktop/scripts/test-import-review.cjs`，使用独立 `.cache` 用户配置、隐藏窗口和模拟网络响应。

使用的 MNE API：`Raw.rename_channels`、`Raw.set_channel_types`、`Raw.drop_channels`、`Raw.set_montage`，参见 [MNE Raw 文档](https://mne.tools/stable/generated/mne.io.Raw.html)。
