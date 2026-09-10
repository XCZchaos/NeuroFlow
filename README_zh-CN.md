<p align="center"><img src="docs/assets/logo.svg" width="760" alt="NeuroFlow Logo"></p>

<p align="center"><strong>面向 EEG、MEG、fNIRS 以及未来 EEG/EMG 多模态分析流程的智能神经生理信号工作台。</strong></p>
<p align="center"><a href="README.md">English</a> · <strong>简体中文</strong></p>
<p align="center">
<img src="https://img.shields.io/badge/Go-1.25+-00ADD8?logo=go&logoColor=white" alt="Go">
<img src="https://img.shields.io/badge/Eino-Agent_Framework-5B5BD6" alt="Eino">
<img src="https://img.shields.io/badge/Python-MNE-3776AB?logo=python&logoColor=white" alt="MNE">
<img src="https://img.shields.io/badge/Electron-Desktop-47848F?logo=electron&logoColor=white" alt="Electron">
<img src="https://img.shields.io/badge/Qdrant-Vector_DB-DC244C" alt="Qdrant">
<img src="https://img.shields.io/github/license/XCZchaos/NeuroFlow" alt="License">
</p>

## 项目简介

**NeuroFlow** 是一个面向神经生理信号研究的 Agent 工作台，目标是把 **数据导入 → 元数据检查 → 分析规划 → 工具执行 → 质量评估 → 报告生成** 组织成可解释、可复现的智能分析流程。

当前系统由三部分构成：使用 **Python + MNE** 进行可信的本地数据检查；使用 **Go + Gin + CloudWeGo Eino** 构建 ReAct Agent；使用 **Ollama Embedding + Qdrant** 构建 RAG 神经信号知识层。

> **当前状态：** 已实现数据检查、dataset_id 上下文、RAG、Tool Calling、SSE 对话以及结构化预处理草案。自动执行完整预处理和 EEG/EMG 算法分析仍在路线图中。

## 界面预览

<p align="center"><img src="docs/assets/ui-preview.svg" width="100%" alt="NeuroFlow 界面预览"></p>

> 该图依据当前 Electron renderer 源码重建，用于展示现有界面布局，并非伪装成真实运行截图。待运行环境支持截图后可直接替换为真实软件截图。

## 系统架构

<p align="center"><img src="docs/assets/architecture.svg" width="100%" alt="NeuroFlow 系统架构"></p>

NeuroFlow 的核心原则是让大模型负责“理解与调度”，而不是直接计算生理信号：

```text
LLM / Agent = 理解 + 规划 + 工具选择 + 结果解释
Signal Tool = 检查 + 计算 + 预处理 + 验证 + 推理
```

## 当前能力

| 能力 | 状态 | 说明 |
|---|---|---|
| 本地数据检查 | ✅ | 格式、通道、采样率、时长、标注、模态 |
| Dataset Agent 上下文 | ✅ | 通过 `dataset_id` 查询可信元数据 |
| ReAct Tool Calling | ✅ | Eino Agent 自主选择已注册工具 |
| RAG 知识检索 | ✅ | Ollama Embedding + Qdrant |
| 结构化预处理草案 | ✅ | 生成可人工复核的处理方案 |
| SSE 流式对话 | ✅ | 桌面端流式接收 Agent 回复 |
| EEG 预处理执行 | 🚧 | 滤波、参考、伪迹、坏道 |
| EMG 分析工具 | 🚧 | RMS、MAV、MDF、MPF、激活和疲劳 |
| EEG/EMG 多模态 Agent | 🚧 | 同步、融合、跨模态分析 |
| 自动分析报告 | 🚧 | 指标、图表、溯源和自然语言总结 |

## 技术栈

| 层级 | 技术 |
|---|---|
| 桌面端 | Electron、HTML、CSS、JavaScript |
| 后端 | Go、Gin |
| Agent | CloudWeGo Eino、ReAct、Tool Calling |
| 神经信号读取 | Python、MNE-Python |
| RAG | Qdrant、Ollama、Markdown 分块 |
| LLM | OpenAI-compatible API |
| 流式输出 | SSE |
| 协议 | MCP 相关依赖 |

## 支持的数据格式

| 模态 | 格式 | 扩展名 |
|---|---|---|
| EEG | EDF / BDF / GDF | `.edf` `.bdf` `.gdf` |
| EEG | BrainVision / EEGLAB | `.vhdr` `.set` |
| EEG | Neuroscan / EGI | `.cnt` `.egi` `.mff` |
| EEG / MEG | MNE FIF | `.fif` |
| MEG | KIT / Yokogawa | `.con` `.sqd` |
| MEG | CTF | `.ds` |
| fNIRS | SNIRF | `.snirf` |

## 快速开始

```bash
git clone https://github.com/XCZchaos/NeuroFlow.git
cd NeuroFlow
python -m pip install -r neuro_service/requirements.txt
```

安装桌面端依赖：

```powershell
cd desktop
npm.cmd install
cd ..
```

准备 Embedding 与 Qdrant：

```bash
ollama pull nomic-embed-text
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

创建配置并启动 Go 后端：

```powershell
Copy-Item config/config_template.json config/config.json
go run ./cmd
```

另开终端启动 Electron：

```powershell
cd desktop
npm.cmd start
```

## 核心 API

```http
GET  /ping
POST /datasets/register
GET  /datasets/{dataset_id}
POST /agent/preprocessing/draft
POST /chat
POST /chatStream
POST /upload
```

## 项目结构

```text
NeuroFlow/
├── cmd/                    # Go 服务入口
├── config/                 # 配置模板
├── desktop/                # Electron 桌面端
├── docs/assets/            # README 视觉素材
├── internal/               # Handler、Router、Agent、Tools、RAG
├── neuro_service/          # Python/MNE 数据适配器
├── pkg/                    # Go 通用工具
└── scripts/                # 辅助脚本
```

## 设计原则

1. **可信数据优先。** 文件元数据必须来自确定性读取器，而不是大模型猜测。
2. **算法工具负责计算。** 大模型不直接承担科学数值计算。
3. **结果可溯源。** 已观察事实、推荐步骤和真正执行结果需要明确区分。
4. **原始数据本地优先。** 未经明确选择不上传原始神经生理信号。
5. **保留人工复核。** 科研预处理流程在执行前应可检查和调整。

## Roadmap

- [x] MNE 元数据检查
- [x] Dataset Registry 与 Agent 上下文
- [x] ReAct Agent + RAG
- [x] SSE 流式输出
- [ ] EEG 信号质量与预处理 Tools
- [ ] PSD / Band Power / 时频分析
- [ ] EMG 预处理、RMS / MAV / MDF / MPF
- [ ] Quality Agent、EEG Agent、EMG Agent、Supervisor
- [ ] EEG–EMG 同步与多模态融合
- [ ] Plan–Execute–Replan
- [ ] 深度学习推理 Tool
- [ ] BIDS 数据集支持
- [ ] 可复现图表和自动分析报告

## 参与项目

欢迎通过 Issue 交流脑机接口比赛、科研合作、开源模块、信号处理算法和 Agent Workflow。

## License

见 [LICENSE](LICENSE)。

## 免责声明

NeuroFlow 是科研与工程项目，**不是医疗器械**，不得用于临床诊断或治疗决策。
