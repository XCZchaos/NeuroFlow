# NeuroFlow

面向 EEG、MEG 与 fNIRS 的智能神经信号工作台——融合 Electron、MNE、RAG 与 ReAct Agent，帮助研究者读取数据结构、理解文件信息并生成可复核的预处理方案。

[![Release](https://img.shields.io/badge/release-v0.1-16846d)](https://github.com/XCZchaos/NeuroFlow/tree/v0.1)
[![Go](https://img.shields.io/badge/Go-1.25.5-00ADD8?logo=go)](https://go.dev/)
[![Electron](https://img.shields.io/badge/Electron-41-47848F?logo=electron)](https://www.electronjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 项目简介

NeuroFlow 是一个面向脑机接口与神经科学研究的智能代理系统。项目希望将“导入数据、检查结构、制定流程、执行分析、评估质量”组织成可解释、可复现的 Agent 工作流。

当前系统由三部分组成：

- **本地数据检查** - Electron 选择本地 EEG、MEG 或 fNIRS 文件，由 Python/MNE 只读检查文件头，获得模态、格式、通道、采样率、记录时长和标注等元数据
- **ReAct Agent** - 基于 CloudWeGo Eino 的对话 Agent，可以查询已注册数据集的可信元数据、检索知识库，并生成结构化预处理草案
- **RAG（检索增强生成）** - 使用 Ollama 生成文档向量并存入 Qdrant，为 Agent 提供神经信号处理知识

三者协同工作：**MNE** 提供可验证的数据事实，**RAG** 提供领域知识，**ReAct Agent** 根据用户问题选择工具并组织回答。

> **v0.1 能力边界：** EEG 已支持自动滤波参数、坏道检测与条件插值、平均参考、保守 ICA 伪迹筛选、处理前后质量比较和 FIF 导出；fNIRS 已支持光密度、TDDR、Beer–Lambert、滤波与 HbO/HbR 汇总。MEG 当前支持格式识别、元数据和真实波形读取，尚未实现 SSS/tSSS 等专用预处理。

## 功能特性

- **桌面工作台** - Electron 界面支持 EEG、MEG、fNIRS 模态切换、数据导入、流程编辑和 Agent 对话
- **自动格式适配** - 根据文件扩展名选择 MNE 读取器，新增格式时不需要修改整个导入流程
- **元数据读取** - 获取格式、模态、通道数、通道名称、通道类型、采样率、时长、样本数和标注数量
- **数据集上下文** - 为每次成功导入生成 `dataset_id`，Agent 可以查询对应的可信元数据
- **智能对话** - ReAct Agent 驱动的多轮对话，支持普通响应、流式响应与工具调用
- **自动预处理** - Agent 可根据用户意图调用本地 Python/MNE，对 EEG 和 fNIRS 执行真实处理
- **真实信号查看器** - 查看原始或处理后信号，支持完整时间轴移动、窗口缩放和单通道详情
- **可验证的操作反馈** - 对处理请求显示执行阶段，并通过新的 `analysis_id` 校验是否真正完成
- **可选结果保存** - 用户可以保存 FIF 与审计文件，或者只在内存中完成分析
- **中英文界面** - Electron 工作台和动态交互文案支持中文与英文切换
- **预处理草案** - 为 EEG、MEG 或 fNIRS 生成带假设、参数和人工复核提示的结构化流程
- **知识库管理** - Markdown 文档自动解析、向量化并存入 Qdrant
- **Markdown 回复** - Electron 安全显示标题、列表、表格、引用与代码块
- **本地优先** - 原始信号文件保留在原位置，不复制到项目，也不直接发送给大模型

## 技术架构

```
┌──────────────────────────────────────────────────────────────────┐
│                         NeuroFlow                                │
├──────────────────────────────────────────────────────────────────┤
│  Desktop Layer (Electron + HTML/CSS/JavaScript)                  │
│  ├── 系统文件选择器                                               │
│  ├── 数据集元数据展示                                             │
│  ├── 预处理流程编辑器                                             │
│  └── Markdown Agent 对话界面                                     │
├──────────────────────────────────────────────────────────────────┤
│  API Layer (Gin)                                                 │
│  ├── /datasets/register          - 注册并检查本地数据              │
│  ├── /datasets/:id               - 查询数据集元数据                │
│  ├── /datasets/:id/preview       - 读取短窗口真实原始波形          │
│  ├── /datasets/:id/signal        - 按通道与时间窗读取信号          │
│  ├── /datasets/:id/analyze       - 执行预处理并返回波形预览        │
│  ├── /agent/preprocessing/draft  - 生成预处理草案                  │
│  ├── /chat                       - Agent 对话                      │
│  ├── /chatStream                 - Agent 流式对话                  │
│  └── /upload                     - 知识库文档索引                  │
├──────────────────────────────────────────────────────────────────┤
│  Agent Layer (CloudWeGo Eino)                                   │
│  ├── ReAct Agent                 - 对话与工具选择                  │
│  ├── inspect_dataset             - 查询已验证元数据                │
│  ├── create_neuro_preprocessing_draft - 创建处理草案              │
│  ├── run_neuro_analysis          - 执行本地 Python EEG/fNIRS 分析  │
│  └── RAG Tool                    - 神经信号知识检索                │
├──────────────────────────────────────────────────────────────────┤
│  Analysis & Storage                                              │
│  ├── Python + MNE                - 文件读取、预处理与指标计算      │
│  ├── outputs/                    - 本地 FIF 处理结果（不提交）     │
│  ├── Qdrant                     - 向量数据库                      │
│  └── Ollama                     - Embedding 模型服务              │
└──────────────────────────────────────────────────────────────────┘
```

## 快速开始

### 前置依赖

- Windows 10/11（当前主要开发环境）
- Go 1.25+
- Python 3.9+ 与 [MNE-Python](https://mne.tools/)
- Node.js 与 npm
- [Ollama](https://ollama.com/)（用于 Embedding）
- [Qdrant](https://qdrant.tech/)（向量数据库）
- OpenAI 兼容 API（LLM 服务）

### 安装步骤

1. **克隆项目**

```bash
git clone --branch v0.1 https://github.com/XCZchaos/NeuroFlow.git
cd NeuroFlow
```

2. **安装 Python 数据读取依赖**

```bash
python -m pip install -r neuro_service/requirements.txt
```

3. **安装 Electron 依赖**

```powershell
cd desktop
npm.cmd install
cd ..
```

如果 Electron 运行时从 GitHub 下载较慢，可以使用项目提供的 Windows 安装脚本：

```powershell
powershell -ExecutionPolicy Bypass -File desktop/scripts/install.ps1
```

4. **启动 Ollama 并准备 Embedding 模型**

```bash
ollama pull nomic-embed-text
```

5. **启动 Qdrant**

确保 Qdrant gRPC 服务监听 `127.0.0.1:6334`。项目提供了 `config/qdrant.local.yaml`，也可以使用 Docker：

```bash
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

6. **创建本地配置**

Windows PowerShell：

```powershell
Copy-Item config/config_template.json config/config.json
```

Linux/macOS：

```bash
cp config/config_template.json config/config.json
```

编辑 `config/config.json`，填入自己的 API Key、模型名称和兼容 OpenAI 的 API 地址。该文件已被 `.gitignore` 忽略，不要提交真实密钥。

7. **启动 Go 后端**

```powershell
& "C:\Program Files\Go\bin\go.exe" run ./cmd
```

如果 `go` 已加入 PATH，也可以使用：

```bash
go run ./cmd
```

服务将在 `http://localhost:8819` 启动。

8. **启动 Electron 前端**

另开一个终端：

```powershell
cd desktop
npm.cmd start
```

进入“连接设置”，选择“连接 Go 后端”。导入数据后即可询问 Agent：“这个文件有多少个通道？”或“采样率是多少？”。

## 支持的数据格式

| 模态 | 格式 | 扩展名 | MNE 读取器 |
|------|------|--------|------------|
| EEG | European Data Format | `.edf` | `read_raw_edf` |
| EEG | BioSemi Data Format | `.bdf` | `read_raw_bdf` |
| EEG | General Data Format | `.gdf` | `read_raw_gdf` |
| EEG | BrainVision | `.vhdr` | `read_raw_brainvision` |
| EEG | EEGLAB | `.set` | `read_raw_eeglab` |
| EEG | Neuroscan | `.cnt` | `read_raw_cnt` |
| EEG | EGI | `.egi`、`.mff` | `read_raw_egi` |
| EEG / MEG | MNE FIF | `.fif` | `read_raw_fif` |
| MEG | KIT/Yokogawa | `.con`、`.sqd` | `read_raw_kit` |
| MEG | CTF | `.ds` 目录 | `read_raw_ctf` |
| fNIRS | SNIRF | `.snirf` | `read_raw_snirf` |

BrainVision 数据需要保留配套的 `.vmrk` 和 `.eeg` 文件；外部存储的 EEGLAB 数据需要保留对应 `.fdt` 文件。CTF `.ds` 读取器已经存在，但 Electron 目录选择入口仍待完善。

## 配置说明

### config/config.json

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
    "collection": "oncallagent"
  },
  "openai": {
    "api_key": "your-api-key",
    "model": "gpt-4o-mini",
    "api_base": "https://api.openai.com/v1"
  }
}
```

| 配置项 | 说明 |
|--------|------|
| `server.host/port` | Go HTTP 服务地址 |
| `embedder.*` | Ollama Embedding 服务配置 |
| `qdrant.*` | Qdrant 向量数据库配置 |
| `openai.*` | 兼容 OpenAI 格式的 LLM API 配置 |

## API 文档

### 健康检查

```http
GET /ping
```

**响应：**

```json
{"message": "pong"}
```

### 注册并检查数据集

```http
POST /datasets/register
Content-Type: application/json

{
  "path": "D:\\NeuroData\\subject01.gdf"
}
```

Python/MNE 会只读检查文件头，不会复制或修改原始文件。

**响应：**

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

`dataset_id` 与元数据暂存在 Go 进程内存中，后端重启后需要重新导入。

Electron 在注册成功后会调用 `GET /datasets/{dataset_id}/preview`，只读加载文件开头最多 10 秒、8 个通道，并抽稀到每通道最多约 1200 点。因此刚导入文件时“原始”标签显示的已经是真实数据；完成预处理后，“处理后”标签显示 Python/MNE 返回的真实处理结果。

聊天 Agent 调用 `run_neuro_analysis` 后，后端会按数据集保存最近一次内存结果。Electron 在流式回答结束时调用 `GET /datasets/{dataset_id}/analysis/latest`；检测到新的 `analysis_id` 后会自动切换到“处理后”并绘制真实波形。波形只在本机后端与 Electron 之间传递，不进入大模型上下文。

信号查看器通过 `GET /datasets/{dataset_id}/signal?channel=Fp1&start=30&duration=10&source=raw` 按需读取窗口。用户可以沿完整时间轴移动，在 0.5–120 秒范围缩放，并点击总览通道进入单通道视图。`source=processed` 从最近保存的 FIF 读取；选择“不保存”时仍能查看本次返回的处理后抽稀总览，但 Python 进程结束后无法按任意窗口重读完整处理结果。

### 执行真实预处理

```http
POST /datasets/{dataset_id}/analyze
Content-Type: application/json

{
  "analysis_type": "full",
  "highpass_hz": 1,
  "lowpass_hz": 40,
  "notch_hz": 50,
  "save_output": true
}
```

EEG 的 `full` 模式会执行自动参数选择、处理前质量评估、坏道检测、条件允许时的插值、工频陷波、IIR 带通、自动参考、保守 ICA 筛选和处理后质量复核。单步失败会保留上一个有效结果并降级继续，具体状态记录在 `execution_plan` 中。fNIRS 会按输入通道类型执行光密度、TDDR、Beer–Lambert 和 0.01–0.2 Hz 滤波。响应包含供 Electron 绘图的原始/处理后抽稀波形。`save_output=true` 时，完整结果与审计记录写入 `outputs/<dataset_id>/`；设为 `false` 时不会写入预处理文件。波形预览不会发送给大模型。

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

该接口返回结构化草案，不会执行真实算法。响应中的 `executable` 当前为 `false`。

### 对话

```http
POST /chat
Content-Type: application/json

{
  "question": "这个数据有多少个通道？",
  "id": "session-id"
}
```

**响应：**

```json
{"message": "该数据包含 25 个通道。"}
```

Electron 会在已导入数据时附加经过验证的元数据上下文和 `dataset_id`。

### 长期对话记忆

NeuroFlow 使用本机 `data/neuroflow.db` 保存会话、完整消息、研究目标、用户偏好和数据集绑定。该运行时数据库已被 Git 忽略。模型每次只读取最近 12 条原始消息，并读取由更早消息形成的长期摘要，避免上下文随对话无限增长。

```http
GET    /sessions
POST   /sessions
DELETE /sessions/:id
GET    /sessions/:id/messages?limit=200
PUT    /sessions/:id/dataset
GET    /sessions/:id/memory
PUT    /sessions/:id/memory
```

创建会话可以由后端生成 ID：

```json
{"title":"P300 预处理研究"}
```

结构化记忆格式：

```json
{
  "research_goal": "比较 P300 分类流程",
  "preferences": {
    "language": "zh-CN",
    "save_output": "false"
  },
  "summary": ""
}
```

聊天请求携带 `dataset_id` 时，后端会自动把数据集绑定到该会话。完整消息不会因摘要生成而删除，可以从会话消息接口恢复。

### 流式对话

```http
POST /chatStream
Content-Type: application/json

{
  "question": "请解释推荐的 EEG 预处理步骤",
  "id": "session-id"
}
```

**响应：** Server-Sent Events（SSE）

```text
event: message
data: ...

event: done
data: [DONE]
```

### 上传知识库文档

```http
POST /upload
Content-Type: multipart/form-data

file: <markdown-file>
```

该接口用于上传 Markdown 知识文档并建立向量索引，不用于上传 EEG、MEG 或 fNIRS 原始信号。

## 项目结构

```
NeuroFlow/
├── cmd/
│   └── main.go                     # Go 服务入口
├── config/
│   ├── config.json                 # 本地配置（不提交）
│   ├── config_template.json        # 安全配置模板
│   └── qdrant.local.yaml           # Qdrant 本地配置
├── desktop/                        # Electron 桌面端
│   ├── electron/                   # 主进程与安全 IPC
│   ├── renderer/                   # 页面、交互和视觉主题
│   └── scripts/                    # 安装与启动脚本
├── docs/                           # RAG 知识文档目录
├── internal/
│   ├── handler/                    # Gin HTTP 处理器
│   ├── repo/qrdant/                # Qdrant 数据访问层
│   ├── router/                     # 路由配置
│   └── server/
│       ├── ai/agent/chat/          # ReAct 对话 Agent
│       ├── ai/tools/               # 数据检查、草案与 RAG 工具
│       ├── chatServer/             # 会话与流式响应
│       ├── dataset/                # dataset_id 和元数据注册表
│       └── knowledge_index/        # 知识库索引服务
├── neuro_service/
│   ├── inspect_dataset.py          # Python/MNE 格式适配器
│   ├── preview_dataset.py          # 原始信号快速预览
│   └── analyze_dataset.py          # Python/MNE EEG/fNIRS 分析器
├── pkg/                            # 配置、日志和通用工具
├── scripts/                        # 辅助脚本
├── .gitignore
├── go.mod
└── go.sum
```

## 核心组件

### 1. Electron 工作台

桌面端负责：

- 选择本地神经信号文件
- 展示真实文件元数据
- 编辑预处理流程草案
- 与 Go Agent 对话
- 安全渲染 Markdown 回复

Electron 开启 `contextIsolation` 与沙箱，渲染页面只能调用 preload 中明确开放的 IPC 方法。

### 2. 数据格式适配器

`neuro_service/inspect_dataset.py` 将文件扩展名映射到不同 MNE 读取器：

- 使用 `preload=False`，元数据检查阶段不会装载完整大型信号
- FIF 等格式根据真实通道类型判断模态
- 未知格式返回 `UNSUPPORTED_FORMAT` 和支持列表
- 扩展新格式时主要修改适配器表

### 3. ReAct Agent

Agent 可以自主选择：

- `inspect_dataset`：查询由程序验证的数据事实
- `create_neuro_preprocessing_draft`：生成非执行型预处理草案
- `run_neuro_analysis`：根据 `dataset_id` 在本机执行 EEG/fNIRS 分析，只向模型返回汇总指标
- RAG 工具：检索知识库

系统提示词要求 Agent 区分“文件已经证明的事实”“建议的处理方案”和“已经执行的结果”。

### 4. RAG 工具

基于 Ollama 与 Qdrant：

- Markdown 文档解析与分块
- 文档向量化存储
- 语义相似度检索
- 为 Agent 提供神经信号领域知识

## 开发指南

### 添加新文件格式

在 `neuro_service/inspect_dataset.py` 的 `READERS` 中添加格式映射：

```python
READERS = {
    ".edf": ("EEG", "read_raw_edf"),
    ".fif": ("auto", "read_raw_fif"),
    ".snirf": ("fNIRS", "read_raw_snirf"),
}
```

多配套文件或需要特殊参数的格式应增加独立适配函数，并保持统一 JSON 输出结构。

### 添加新 Agent 工具

在 `internal/server/ai/tools/` 创建工具：

```go
package tools

import (
    "context"
    "github.com/cloudwego/eino/components/tool"
    "github.com/cloudwego/eino/components/tool/utils"
)

type MyToolInput struct {
    DatasetID string `json:"dataset_id" jsonschema:"description=数据集 ID"`
}

func NewMyTool() (tool.InvokableTool, error) {
    return utils.InferTool(
        "my_tool",
        "工具能力和使用条件",
        func(ctx context.Context, input MyToolInput) (string, error) {
            // 调用确定性的分析代码并返回结构化结果。
            return "result", nil
        },
    )
}
```

工具应返回可验证的结构化结果。不要让模型生成任意 Python 或 Shell 代码后直接执行。

### 扩展知识库

初始 BCI 专家知识位于 `docs/knowledge/`，按照通用规则、EEG、MEG、fNIRS 和 BCI 范式组织，内容根据 MNE、EEGLAB 和 MOABB 官方文档提炼。知识文件可包含多个原子知识点，每个一级标题会形成独立向量。知识条目记录适用模态、范式、处理阶段、限制、验证方法、来源和审核状态。

启动 Qdrant、Ollama 和 Go 后端后，可批量建立索引：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/index-knowledge.ps1
```

新增知识时应优先编写短小且可独立理解的规则，不要直接复制整篇官方文档或论文。`seed_reviewed` 表示根据官方资料整理的初始条目，正式用于自动决策前建议升级为人工确认的 `expert_reviewed`。

### 运行检查

```bash
go test ./...
python -m py_compile neuro_service/inspect_dataset.py neuro_service/preview_dataset.py neuro_service/analyze_dataset.py
```

```powershell
cd desktop
npm.cmd run check
```

## 技术栈

- **桌面端**：[Electron](https://www.electronjs.org/) + HTML + CSS + JavaScript
- **后端框架**：[Gin](https://gin-gonic.com/)
- **Agent 框架**：[CloudWeGo Eino](https://github.com/cloudwego/eino)
- **神经信号读取**：[MNE-Python](https://mne.tools/)
- **向量数据库**：[Qdrant](https://qdrant.tech/)
- **Embedding**：[Ollama](https://ollama.com/) + `nomic-embed-text`
- **LLM**：兼容 OpenAI API 的模型服务
- **主要语言**：Go、Python、JavaScript、HTML、CSS

## 当前开发状态

已实现：

- Electron 中英文神经信号工作台与流式 Agent 对话
- EEG、MEG、fNIRS 常见格式的元数据和真实波形读取
- 完整时间轴移动、窗口缩放、原始/处理后对比和单通道详情
- 数据集注册、可信元数据查询和结构化预处理草案
- EEG 自动参数、坏道检测与插值、平均参考、ICA 筛选及质量比较
- fNIRS 光密度、TDDR、Beer–Lambert、滤波和 HbO/HbR 汇总
- 可选 FIF/审计文件保存、运行记录和 Agent 操作结果校验
- RAG 知识检索以及安全 Markdown/代码块显示

待实现：

- MEG SSS/tSSS 与环境噪声处理
- 基于真实后端事件的逐步骤工具进度推送
- 更完整的自动失败重试与参数搜索策略
- 事件分段、Epoch/ERP 分析及可复现研究报告
- BIDS 数据集与 BIDS Derivatives 管理

## License

本项目使用 [MIT License](LICENSE)。
