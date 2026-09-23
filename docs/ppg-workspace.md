# PPG 信号处理工作台

启动 Go 后端与 Electron，在左侧选择 **PPG 信号处理**。本页使用本地 Python/NeuroKit2，不需要调用大模型，也不会自动修改源文件。

## 输入与结构确认

- 文本表格：CSV、TSV、TXT，首行必须是列名；可读取逗号、制表符和分号分隔的数值列。支持 UTF-8 与 GB18030。
- 生理记录：EDF、BDF、FIF、GDF，通过 MNE 读取文件采样率与指定通道。
- 单个文件不超过 256 MB；复杂设备混合 CSV、MAT 与自定义二进制尚未接入本页面的专用读取器。
- 本页独立选择文件，尚未与数据管理的 dataset_id、长期会话或批处理队列绑定。

例如 100 Hz 的 CSV：

```csv
time,PPG
0.00,1240
0.01,1258
0.02,1291
```

点击“选择记录”或输入路径后点击“检查文件”。明确选择 PPG 信号列，时间列选择 `time`，单位选择秒。没有时间列时，填写设备的真实采样率。文本表格不采用 EEG 的微伏换算。

时间列必须有限、严格递增，所有采样间隔相对中位间隔偏差不超过 10%；填写的采样率与时间估计值偏差不能超过 2%。这是当前读取器的校验容差，不是采集设备精度指标。存在丢包或不规则采样时先修复或明确重采样；程序不会静默补点。

## 运行与查看

1. 选择分析起点与 10–600 秒的窗口，采样率支持 25–10000 Hz，单次最多 200 万点。
2. 点击“运行 PPG 分析”。NeuroKit2 `ppg_clean(method="elgendi")` 完成 0.5–8 Hz 清洗，`ppg_findpeaks(method="elgendi")` 识别候选峰。
3. 对比输入信号与清洗信号。光学传感器输出若上下倒置，可反转极性后重新运行。
4. 检查峰点是否对应真实脉搏。逐搏心率为 `60 / 相邻峰间隔（秒）`，平均心率为逐搏心率的算术均值。
5. 使用左右按钮、时间滑块、Shift＋滚轮浏览**已分析窗口**，使用放大/缩小查看细节。要看其他记录区间，修改分析起点后重新运行。

所有计算使用原采样点；显示通过保留极值与峰点抽稀。两条波形分别缩放，不能仅凭屏幕高度判断清洗前后幅值变化。修改参数会清除过期结果；处理失败会显示错误。记录存在运动伪迹、脉搏漏检或误检时，心率也可能错误。

## 输出与边界

- JSON 包含来源文件名、分析参数、NeuroKit2 版本、已分析范围、显示波形、峰点、逐搏心率和警告。
- CSV 包含每个峰的原始记录零起点 sample、相对记录起点时间和清洗后幅值。
- 不自动保存清洗后的完整文件。只有点击导出才保存结果；页面刷新后需重新读取分析。
- 不提供 SpO₂、临床诊断或经过临床验证的信号质量评分，也不把 PPG 脉率变异当作 ECG HRV。
- 页面按钮调用 `POST /ppg/inspect`、`POST /ppg/analyze`。也可在右侧全局 Agent 中说“按页面当前参数分析 PPG”：本机通过 `POST /ppg/prepare` 固定所选配置，Agent 的 `run_ppg_analysis(action=inspect/analyze)` 使用该配置读取或分析；回答结束后 Electron 获取 `GET /ppg/:id/latest` 并更新波形与心率。
- PPG 工具使用页面已经选择的通道、采样率与时间窗口，不接受模型指定的文件路径或任意代码。要调整处理参数，先修改页面再发起请求。工具只把摘要交给模型，完整波形留在本机。
- 临时 PPG Agent 上下文保存在内存中，最多 128 个，1 小时过期；后端重启后重新准备上下文。源文件大小或修改时间变化时拒绝复用旧配置。PPG 尚未绑定通用数据集注册表。

## 实现与验证

| 位置 | 作用 |
| --- | --- |
| `desktop/renderer/ppg-view.js`、`ppg-view.css` | 独立页面、双语说明、配置、画图、导航、结果导出 |
| `internal/handler/ppg.go` | 请求大小限制、Python 调用、超时/取消、错误反馈 |
| `internal/server/ppg/service.go` | 页面与 Agent 共用的执行服务、临时配置快照、文件变化检查、本地结果缓存 |
| `internal/server/ai/tools/ppg.go` | PPG function call，使用请求绑定的 PPG 配置，返回有界摘要 |
| `neuro_service/ppg_analysis.py` | 格式读取、参数校验、实际信号运算 |
| `neuro_service/test_ppg_analysis.py` | 已知 72 bpm 信号、采样率冲突、缺失数据、MNE 通道等测试 |
| `internal/handler/ppg_test.go` | HTTP → Python → JSON 端到端测试 |
| `desktop/scripts/test-ppg.cjs` | Electron 页面导航、参数、结果、缩放、语言与错误状态测试 |

运行测试：在 `neuro_service` 执行 `python -m unittest test_ppg_analysis`，项目根目录执行 `go test ./internal/handler` 与 `npm --prefix desktop run test:ppg`。这些测试使用确定性合成信号和临时 FIF，尚不能替代真实设备数据验证。
