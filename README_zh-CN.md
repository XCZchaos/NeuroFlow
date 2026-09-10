# NeuroFlow

<p align="center">
  面向 EEG、MEG 与 fNIRS 的智能神经信号工作台
</p>

<p align="center">
  <a href="README.md">English</a> · <strong>简体中文</strong>
</p>

## 项目简介

**NeuroFlow** 是一个面向脑机接口与神经科学研究的智能 Agent 工作台，尝试将传统神经信号分析中的“数据导入、结构检查、流程规划、知识检索与结果解释”组织成一个可追踪、可复核、可扩展的智能工作流。

项目当前以 **Go + CloudWeGo Eino** 作为 Agent 与服务编排核心，使用 **Python + MNE** 读取并验证神经信号元数据，结合 **Qdrant + Ollama Embedding** 构建 RAG 知识库，并通过 OpenAI 兼容模型提供自然语言交互能力。

NeuroFlow 的基本原则是：**让大模型负责理解、规划、工具选择与解释，让确定性程序负责真实数据读取和数值计算。**

> **当前状态**：现阶段已经能够读取受支持文件的可信元数据、注册数据集上下文、进行 ReAct 工具调用、检索知识库并生成结构化预处理草案。滤波、ICA、坏道插值、SSS/tSSS、运动校正、Beer–Lambert 转换等真实神经信号处理流程尚未接入自动执行链路，因此当前生成的预处理流程属于“可复核草案”，而不是已经执行完成的分析结果。

## 核心能力

- **神经信号数据检查**：通过 Python/MNE 只读检查 EEG、MEG、fNIRS 文件头和元数据，不修改原始数据。
- **数据集上下文管理**：为导入数据生成 `dataset_id`，使 Agent 能够查询经过程序验证的数据事实。
- **ReAct Agent**：基于 CloudWeGo Eino 构建对话 Agent，根据用户问题自主选择数据检查、流程规划和 RAG 工具。
- **结构化预处理草案**：根据模态、分析目标、采样率和工频等信息生成带参数、假设与人工复核提示的处理建议。
- **RAG 知识增强**：Markdown 文档经过切分、Embedding 后写入 Qdrant，为 Agent 提供神经信号领域知识。
- **流式对话**：提供 SSE 流式响应接口，便于桌面端或 Web 前端展示 Agent 的连续输出。
- **本地优先**：原始神经信号文件保留在本地路径，不作为知识库文件上传，也不会直接发送给大模型。
- **可扩展 Tool 层**：后续可继续接入 EEG/EMG 特征提取、质量检测、深度学习推理和多模态融合算法。

## 系统架构

```text
┌──────────────────────────────────────────────────────────────┐
│                         NeuroFlow                            │
├──────────────────────────────────────────────────────────────┤
│ Client / Desktop                                             │
│  ├─ 数据选择与元数据展示                                      │
│  ├─ 预处理流程交互                                            │
│  └─ Agent 对话与 Markdown 展示                                │
├──────────────────────────────────────────────────────────────┤
│ Go API Layer — Gin                                          │
│  ├─ /datasets/register                                      │
│  ├─ /datasets/:id                                           │
│  ├─ /agent/preprocessing/draft                              │
│  ├─ /chat                                                   │
│  ├─ /chatStream                                             │
│  └─ /upload                                                 │
├──────────────────────────────────────────────────────────────┤
│ Agent Layer — CloudWeGo Eino                                │
│  ├─ ReAct Agent                                             │
│  ├─ inspect_dataset Tool                                    │
│  ├─ create_neuro_preprocessing_draft Tool                   │
│  └─ RAG Tool                                                │
├──────────────────────────────────────────────────────────────┤
│ Analysis & Knowledge                                        │
│  ├─ Python + MNE        神经信号格式适配与元数据读取           │
│  ├─ Qdrant             向量数据库                            │
│  ├─ Ollama             Embedding 服务                        │
│  └─ OpenAI-compatible LLM                                   │
└──────────────────────────────────────────────────────────────┘
```

## 技术栈

| 层级 | 技术 |
|---|---|
| Backend | Go 1.25+, Gin |
| Agent | CloudWeGo Eino, ReAct, Tool Calling |
| LLM | OpenAI-compatible API |
| RAG | Eino Retriever, Qdrant |
| Embedding | Ollama, `nomic-embed-text` |
| Neuro Signal I/O | Python 3.9+, MNE-Python |
| Protocol / Integration | HTTP, SSE, MCP |
| Client | Electron / Web client integration |
| Languages | Go, Python, JavaScript, HTML, CSS |

## 支持的数据格式

当前的数据检查器基于 MNE-Python，并根据文件扩展名选择对应读取器。

| 模态 | 格式 | 扩展名 | MNE 读取器 |
|---|---|---|---|
| EEG | European Data Format | `.edf` | `read_raw_edf` |
| EEG | BioSemi Data Format | `.bdf` | `read_raw_bdf` |
| EEG | General Data Format | `.gdf` | `read_raw_gdf` |
| EEG | BrainVision | `.vhdr` | `read_raw_brainvision` |
| EEG | EEGLAB | `.set` | `read_raw_eeglab` |
| EEG | Neuroscan | `.cnt` | `read_raw_cnt` |
| EEG | EGI | `.egi`, `.mff` | `read_raw_egi` |
| EEG / MEG | MNE FIF | `.fif` | `read_raw_fif` |
| MEG | KIT/Yokogawa | `.con`, `.sqd` | `read_raw_kit` |
| MEG | CTF | `.ds` | `read_raw_ctf` |
| fNIRS | SNIRF | `.snirf` | `read_raw_snirf` |

> BrainVision 数据需要保留对应的 `.vmrk` 和 `.eeg` 文件；外部存储的 EEGLAB 数据需要保留对应 `.fdt` 文件。CTF `.ds` 的读取适配已经预留，但客户端目录选择能力仍需要进一步完善。

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/XCZchaos/NeuroFlow.git
cd NeuroFlow
```

### 2. 安装 Python 依赖

```bash
python -m pip install -r neuro_service/requirements.txt
```

### 3. 准备 Ollama Embedding 模型

```bash
ollama pull nomic-embed-text
```

### 4. 启动 Qdrant

确保 Qdrant gRPC 服务监听 `127.0.0.1:6334`。也可以使用 Docker：

```bash
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

### 5. 创建本地配置

Windows PowerShell：

```powershell
Copy-Item config/config_template.json config/config.json
```

Linux / macOS：

```bash
cp config/config_template.json config/config.json
```

然后编辑 `config/config.json`，填写自己的模型、API Key 和 API Base。真实密钥不要提交到 GitHub。

示例：

```json
{
  "server": {"host": "localhost", "port": 8819},
  "embedder": {
    "host": "127.0.0.1",
    "port": 11434,
    "model": "nomic-embed-text",
    "dimension": 384
  },
  "qdrant": {
    "host": "127.0.0.1",
    "port": 6334,
    "collection": "neuroflow"
  },
  "openai": {
    "api_key": "your-api-key",
    "model": "your-model",
    "api_base": "https://api.openai.com/v1"
  }
}
```

### 6. 启动 Go 后端

```bash
go run ./cmd
```

默认服务地址：

```text
http://localhost:8819
```

## API 示例

### 健康检查

```http
GET /ping
```

```json
{"message":"pong"}
```

### 注册并检查数据集

```http
POST /datasets/register
Content-Type: application/json

{
  "path": "D:\\NeuroData\\subject01.gdf"
}
```

返回示例：

```json
{
  "dataset_id": "d752ed72-41cd-450b-94c2-67eb852a8e94",
  "inspection": {
    "ok": true,
    "format": "GDF",
    "modality": "EEG",
    "sampling_rate_hz": 250,
    "channel_count": 25,
    "duration_seconds": 2748
  }
}
```

### 查询数据集元数据

```http
GET /datasets/{dataset_id}
```

当前 `dataset_id` 和元数据保存在 Go 进程内存中，服务重启后需要重新注册。

### 生成预处理草案

```http
POST /agent/preprocessing/draft
Content-Type: application/json

{
  "modality": "EEG",
  "goal": "静息态频谱分析",
  "sampling_rate": 250,
  "line_frequency": 50
}
```

该接口生成结构化建议，不执行真实预处理算法。

### Agent 对话

```http
POST /chat
Content-Type: application/json

{
  "question": "这个数据有多少个通道？",
  "id": "session-id"
}
```

### 流式对话

```http
POST /chatStream
Content-Type: application/json

{
  "question": "请解释推荐的 EEG 预处理步骤",
  "id": "session-id"
}
```

响应采用 Server-Sent Events（SSE）。

### 索引知识文档

```http
POST /upload
Content-Type: multipart/form-data

file: <markdown-file>
```

该接口用于知识库 Markdown 文档索引，不用于上传 EEG、MEG 或 fNIRS 原始数据。

## 项目结构

```text
NeuroFlow/
├── cmd/                            # Go 服务入口
├── config/                         # 本地配置模板与 Qdrant 配置
├── desktop/                        # 客户端相关文件
├── internal/
│   ├── handler/                    # Gin HTTP handlers
│   ├── repo/qrdant/                # Qdrant 数据访问层
│   ├── router/                     # API 路由
│   └── server/
│       ├── ai/agent/chat/          # Eino ReAct Agent
│       ├── ai/tools/               # Agent Tools
│       ├── chatServer/             # 会话与流式响应
│       ├── dataset/                # 数据集上下文注册
│       └── knowledge_index/        # RAG 索引服务
├── neuro_service/                  # Python/MNE 神经信号适配器
├── pkg/                            # 配置、日志与通用工具
├── prometheusTestServer/           # Prometheus 测试服务
├── prometheus_config/              # Prometheus 配置
├── scripts/                        # 辅助脚本
├── go.mod
└── go.sum
```

## 设计原则

### 1. 可信数据优先

Agent 不应凭语言模型推测采样率、通道数、时长或文件格式。此类事实必须来自 `inspect_dataset` 等确定性工具。

### 2. LLM 不直接执行神经信号数值计算

滤波、PSD、时频分析、RMS、MDF、模型推理等能力应实现为独立 Tool 或算法服务，由 Agent 负责选择和调度。

### 3. 区分“建议”和“已经执行”

在真实算法执行链路完成之前，系统必须明确区分预处理建议、知识解释与真实计算结果。

### 4. 原始数据本地优先

神经信号通常体积较大且可能包含敏感信息。NeuroFlow 默认只向 Agent 暴露必要的结构化元数据，不直接把整段原始信号发送给 LLM。

## 开发与扩展

### 添加新的数据格式

在 `neuro_service/inspect_dataset.py` 中扩展读取器映射，并保持统一的 JSON 输出结构。

### 添加新的 Agent Tool

推荐将 EEG/EMG/MEG/fNIRS 的确定性算法能力封装为 Eino Tool，例如：

```text
inspect_dataset
check_signal_quality
calculate_psd
calculate_bandpower
calculate_emg_rms
calculate_emg_mdf
run_model_inference
```

Tool 应返回结构化、可验证的结果，而不是让 LLM 自行生成并执行任意 Python 或 Shell 代码。

### 扩展知识库

可将算法说明、设备文档、实验规范、论文笔记等 Markdown 内容写入知识库，用 RAG 为 Agent 提供领域依据。

## Roadmap

- [x] Go + Gin API 服务
- [x] CloudWeGo Eino ReAct Agent
- [x] 数据集注册与可信元数据查询
- [x] MNE-Python 多格式数据检查
- [x] Qdrant + Ollama RAG 基础链路
- [x] SSE 流式对话
- [ ] EEG 信号质量检测 Tools
- [ ] EEG 预处理真实执行链路
- [ ] EMG 数据支持与特征分析 Tools
- [ ] PSD / Band Power / 时频分析 Tools
- [ ] 多模态 EEG/EMG Agent 工作流
- [ ] 深度学习模型推理 Tool
- [ ] Supervisor / Multi-Agent 编排
- [ ] 分析结果验证与自动报告
- [ ] 完整桌面端交互与可视化

## 适用场景

NeuroFlow 目前更适合作为：

- 神经信号智能分析 Agent 的工程实验平台
- EEG/MEG/fNIRS 数据检查与预处理规划工具
- Eino + RAG + Tool Calling 的生物信号 Agent 示例项目
- 后续 EEG/EMG 多模态智能分析系统的基础框架

目前不应将其作为临床诊断工具使用。

## License

本项目使用仓库中的 `LICENSE` 文件所声明的开源许可证。

## Contributing

欢迎通过 Issue 或 Pull Request 提交：

- 新的数据格式适配器
- EEG/EMG/MEG/fNIRS 分析 Tool
- RAG 知识库改进
- Agent Workflow / Multi-Agent 设计
- Bug 修复与文档完善

---

如果你对 **BCI、神经工程、生理信号处理、Agent 系统或多模态智能分析** 感兴趣，欢迎参与 NeuroFlow。