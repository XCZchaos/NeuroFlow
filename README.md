# NeuroFlow

面向 EEG、MEG 与 fNIRS 的智能神经信号工作台——融合 Electron、MNE、RAG 与 ReAct Agent，帮助研究者读取数据结构、理解文件信息并生成可复核的预处理方案。

[![Release](https://img.shields.io/badge/release-v0.1-16846d)](https://github.com/XCZchaos/NeuroFlow/tree/v0.1)
[![Go](https://img.shields.io/badge/Go-1.25.5-00ADD8?logo=go)](https://go.dev/)
[![Electron](https://img.shields.io/badge/Electron-41-47848F?logo=electron)](https://www.electronjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 项目简介

NeuroFlow 是一个面向脑机接口与神经科学研究的智能代理系统。项目希望将“导入数据、检查结构、制定流程、执行分析、评估质量”组织成可解释、可复现的 Agent 工作流。

当前系统由三部分组成：

- **本地数据检查** - Electron 选择本地 EEG、MEG 或 fNIRS 文件，由 Python/MNE 只读检查文件头或探测表格结构，获得模态、格式、通道、采样率、记录时长和标注等元数据
- **ReAct Agent** - 基于 CloudWeGo Eino 的对话 Agent，可以查询可信元数据、检索知识库、制定并执行处理计划；信息不足时会保存任务、询问用户并在验证后继续
- **RAG（检索增强生成）** - 使用 Ollama 生成文档向量并存入 Qdrant，为 Agent 提供神经信号处理知识

三者协同工作：**MNE** 提供可验证的数据事实，**RAG** 提供领域知识，**ReAct Agent** 根据用户问题选择工具并组织回答。

> **v0.1 能力边界：** EEG 支持确定性滤波参数搜索、坏道、参考、ICA、Epoch、ERP、Morlet 时频、折内 CSP＋LDA 解码与质量报告；MEG 支持空房 SSP、SSS/tSSS、滤波和审计；fNIRS 支持光密度、TDDR、Beer–Lambert、滤波与 HbO/HbR 汇总。SSS/tSSS 仍要求兼容的设备坐标信息，环境噪声处理要求单独导入空房 MEG 数据，解码结果默认只作为探索性折内估计。

## 功能特性

- **桌面工作台** - Electron 界面支持 EEG、MEG、fNIRS 模态切换、数据导入、流程编辑和 Agent 对话
- **自动格式适配** - 根据文件扩展名选择 MNE 读取器，新增格式时不需要修改整个导入流程
- **结构探测与确认** - 支持 CSV、TSV、MAT 和带 JSON sidecar 的二进制数据，允许确认矩阵方向、单位、采样率、事件字典及通道配置
- **通道配置编辑** - 可修改名称与类型、标记采集参考、排除无关通道、匹配 montage，并查看真实坐标或无坐标顺序图
- **元数据读取** - 获取格式、模态、通道数、通道名称、通道类型、采样率、时长、样本数和标注数量
- **数据集上下文** - 为每次成功导入生成 `dataset_id`，Agent 可以查询对应的可信元数据
- **智能对话** - ReAct Agent 驱动的多轮对话，支持普通响应、流式响应与工具调用
- **自动预处理** - Agent 可根据用户意图调用本地 Python/MNE，对 EEG 和 fNIRS 执行真实处理
- **可恢复 Agent 任务** - 将待确认字段、用户原话、验证证据、执行计划和步骤状态持久化到 SQLite
- **真实信号查看器** - 查看原始或处理后信号，支持完整时间轴移动、窗口缩放和单通道详情
- **可验证的操作反馈** - 对处理请求显示执行阶段，并通过新的 `analysis_id` 校验是否真正完成
- **可选结果保存** - 用户可以保存 FIF 与审计文件，或者只在内存中完成分析
- **中英文界面** - Electron 工作台和动态交互文案支持中文与英文切换
- **应用内使用说明** - 左侧“使用说明”提供可搜索、可离线查看的中英文操作手册和故障排查入口
- **预处理草案** - 为 EEG、MEG 或 fNIRS 生成带假设、参数和人工复核提示的结构化流程
- **知识库管理** - Markdown 文档自动解析、向量化并存入 Qdrant
- **Markdown 回复** - Electron 安全显示标题、列表、表格、引用与代码块
- **BIDS 初步支持** - 使用 `mne-bids` 识别和读取 BIDS 数据，并保留结构确认和分析入口
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
│  ├── /datasets/:id/structure     - 试读或确认导入结构              │
│  ├── /datasets/:id/analyze       - 执行预处理并返回波形预览        │
│  ├── /sessions/:id/task          - 查询持久化 Agent 任务           │
│  ├── /agent/preprocessing/draft  - 生成预处理草案                  │
│  ├── /chat                       - Agent 对话                      │
│  ├── /chatStream                 - Agent 流式对话                  │
│  └── /upload                     - 知识库文档索引                  │
├──────────────────────────────────────────────────────────────────┤
│  Agent Layer (CloudWeGo Eino)                                   │
│  ├── ReAct Agent                 - 对话与工具选择                  │
│  ├── inspect_dataset             - 查询已验证元数据                │
│  ├── validate_acquisition_config - 验证用户声明与文件事实          │
│  ├── create_neuro_preprocessing_draft - 创建处理草案              │
│  ├── run_neuro_analysis          - 执行本地 EEG/MEG/fNIRS 分析    │
│  ├── manage_preprocessing_task   - 保存、验证和恢复预处理任务      │
│  └── RAG Tool                    - 神经信号知识检索                │
├──────────────────────────────────────────────────────────────────┤
│  Analysis & Storage                                              │
│  ├── Python + MNE                - 文件读取、预处理与指标计算      │
│  ├── SQLite                     - 会话、记忆与任务状态            │
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
| EEG 表格 | CSV / TSV / 文本 | `.csv`、`.tsv`、`.txt` | Python CSV/结构探测后构造 `RawArray` |
| EEG 数组 | MATLAB | `.mat` | `scipy.io.loadmat`/结构探测后构造 `RawArray` |
| EEG 二进制 | 自定义二进制 | `.bin`、`.dat`、`.raw` | JSON sidecar + `numpy.memmap` |
| EEG / MEG / fNIRS | BIDS | BIDS 文件或根目录 | `mne-bids` |

BrainVision 数据需要保留配套的 `.vmrk` 和 `.eeg` 文件；外部存储的 EEGLAB 数据需要保留对应 `.fdt` 文件。Electron 已提供 BIDS 根目录选择和 recording 浏览入口；CTF `.ds` 仍通过数据集导入流程读取。CSV/MAT 的自动推断带有置信度，存在方向、单位或事件冲突时必须先在结构确认页面复核；自定义二进制必须提供描述形状、数据类型、采样率和通道的 JSON sidecar。

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

### Electron 打包版模型配置

打包给其他用户时不需要附带 `config/config.json` 或开发者的 API Key。用户可在 Electron“连接设置”中填写 API Base、模型名称、API Key 和最大输出 token，也可以导入包含 `openai` 对象的项目配置 JSON 或只包含模型字段的 JSON。导入文件只读取一次，API Key 随即由 Electron `safeStorage` 使用操作系统凭据保护机制加密并保存到 Electron 的 `userData` 目录；渲染页面只能读取“是否已经配置”，不能取回密钥明文。

打包产物可以在 resources 中携带 `backend/neuroflow-backend.exe` 和不含密钥的 `config/config_template.json`。Electron 检测到这两个文件且用户已经保存模型配置后，会自动启动或重启 Go 后端，并通过仅属于该子进程的环境变量注入模型配置：

- `NEUROFLOW_LLM_API_KEY`
- `NEUROFLOW_LLM_API_BASE`
- `NEUROFLOW_LLM_MODEL`
- `NEUROFLOW_LLM_MAX_TOKENS`
- `NEUROFLOW_CONFIG_FILE`

开发模式仍可使用 `config/config.json`。如果在 Electron 中修改模型设置，而后端是从外部终端用 `go run ./cmd` 启动的，需要重启这个开发后端；Electron 只会自动管理随安装包携带的后端进程。

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

分析器还会将每个真实步骤作为 SSE 推送到 `GET /datasets/{dataset_id}/analysis/events`。Electron 的“任务与执行进度”面板显示开始、候选参数、完成、降级、失败和重试次数；断线重连可依据事件序号读取最近的缓冲事件。

信号查看器通过 `GET /datasets/{dataset_id}/signal?channel=Fp1&start=30&duration=10&source=raw` 按需读取窗口。用户可以拖动完整时间轴，也可以使用 Shift＋鼠标滚轮横向移动；加号、减号以当前窗口中心缩放，并点击总览通道进入单通道视图。最大窗口为 120 秒，最小窗口按采样率限制为至少两个原始采样点，例如 250 Hz 数据可缩放到 8 ms。读取期间会合并连续操作并显示最新目标，避免慢速文件读取造成界面卡住。`source=processed` 从最近保存的 FIF 读取；选择“不保存”时仍能查看本次返回的处理后抽稀总览，但 Python 进程结束后无法按任意窗口重读完整处理结果。

### 确认数据结构

```http
PUT /datasets/{dataset_id}/structure?preview=true
Content-Type: application/json

{
  "sampling_rate_hz": 250,
  "unit": "uV",
  "layout": "samples_x_channels",
  "montage": "standard_1020",
  "channels": [
    {"name": "C3", "type": "eeg", "reference": false, "drop": false}
  ],
  "event_dictionary": {"1": "left_hand", "2": "right_hand"}
}
```

`preview=true` 只使用候选配置重新读取，不会保存；去掉该参数或设为 `false` 后，只有验证成功才会原子保存到 `data/import-configs/`。配置带源文件大小与修改时间指纹，原文件改变后必须重新确认。该过程不修改原始文件。详细行为参见 [数据结构确认说明](docs/import-structure-review.md)。

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

EEG 在未明确指定高低截止频率时使用固定候选网格，按“处理后质量－相对 RMS 改变量惩罚”选择参数；可恢复的滤波步骤最多尝试两次，第二次使用低阶 Butterworth，仍失败则回到最近有效检查点。启用 `erp`、`time_frequency` 和 `decoding` 后，会分别计算条件 ERP/GFP、受限规模 Morlet 功率以及 CSP＋LDA 分层交叉验证。所有变换都在交叉验证折内拟合，报告仍会提示跨会话或跨受试者研究需要分组切分。

MEG 请求示例：

```json
{
  "analysis_type": "full",
  "sss_mode": "tsss",
  "st_duration": 10,
  "empty_room_dataset_id": "另一个已导入的-MEG-dataset-id",
  "enabled_steps": ["environmental_noise", "maxwell_filter", "notch_filter", "bandpass_filter", "report"],
  "save_output": true
}
```

空房数据只用于估计 SSP 投影；SSS/tSSS 调用 MNE Maxwell Filter，并在设备变换或线圈信息不满足要求时明确降级，不会伪造处理结果。

### BIDS 浏览与 Derivatives

Electron 的数据管理页面可以选择 BIDS 根目录，后端只读取 `dataset_description.json` 和实体路径，不预加载全部信号：

```http
POST /bids/browse
Content-Type: application/json

{"path":"D:\\BCI-Dataset"}
```

从 BIDS 输入执行并保存 EEG/MEG 分析时，系统会在当前 `outputs/<dataset_id>/bids-derivatives/NeuroFlow/` 下写入带 `GeneratedBy` 的 derivative dataset，并保留受试者、会话、任务和 run 实体。EEG 写入 BrainVision，因此需要 `pybv`；MEG 写入 FIF。分析产物可以通过 `GET /datasets/{dataset_id}/derivatives` 查询，接口不返回任意外部文件路径。

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
GET    /sessions/:id/task
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

### 可恢复的 Agent 任务

当预处理依赖缺失的采样率、单位、矩阵方向、通道配置、montage 或事件含义时，Agent 会通过 `manage_preprocessing_task` 保存问题与完整执行计划，再向用户询问。用户回答后，Agent 记录结构化值及其原话，使用 MNE 重新读取并验证文件；验证通过才恢复原计划。

任务状态与会话一同保存在 `data/neuroflow.db`，不依赖最近消息窗口或长期摘要。每次更新带 revision，能够拦截并发覆盖和重复执行；后端在执行过程中重启时会将任务标记为 `interrupted`，不会自动重复可能已经产生文件的操作。可通过以下接口查看最新状态：

```http
GET /sessions/{session_id}/task
```

返回内容包括 `pending_fields`、`answers`、`validation`、`analysis_parameters`、`steps`、`result` 和 `audit`。失败或中断任务必须由用户明确要求重试。完整状态机参见 [可恢复任务说明](docs/resumable-preprocessing-tasks.md)。

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

下面列出仓库中的源码目录，以及程序在本地运行后可能产生的目录。标有“本地生成”的内容已被 `.gitignore` 忽略，不应提交真实数据、密钥、数据库、模型运行文件或分析结果。

```
NeuroFlow/
├── cmd/                            # Go 应用入口
├── config/                         # 配置模板与 Qdrant 本地配置
├── desktop/                        # Electron 桌面应用
│   ├── electron/                   # Electron 主进程、preload 和受控 IPC
│   ├── renderer/                   # 页面、样式、国际化及交互模块
│   └── scripts/                    # Electron 安装、启动和界面测试脚本
├── docs/                           # 项目说明与可索引专家知识
│   └── knowledge/                  # RAG 原子知识库
│       ├── general/                # 单位、采样、泄漏、质量、审计等通用规则
│       ├── eeg/                    # EEG 质控、滤波、参考、伪迹和工作流
│       ├── meg/                    # MEG 质控、Maxwell Filter、伪迹和工作流
│       ├── fnirs/                  # fNIRS 光密度、运动校正、MBLL 和滤波
│       └── bci/                    # MI、P300、SSVEP、cVEP 和评估知识
├── internal/                       # Go 私有业务代码，仅本模块内部使用
│   ├── handler/                    # Gin HTTP 请求解析和响应
│   ├── repo/qrdant/                # Qdrant 集合、写入和检索适配层
│   ├── router/                     # HTTP 路由、CORS 和服务装配
│   └── server/                     # 后端领域服务
│       ├── ai/
│       │   ├── agent/chat/         # ReAct 聊天图、提示词和上下文转换
│       │   ├── agent/knowledge_index/ # Markdown 知识索引图
│       │   ├── agent/plan_execute_replan/ # 实验性的计划-执行-重规划代码
│       │   ├── embeder/            # Ollama 文本向量客户端
│       │   └── tools/              # Agent 可调用的确定性工具
│       ├── chatServer/             # 对话服务、SQLite 消息和长期记忆
│       ├── dataset/                # 数据集注册、路径解析和波形读取
│       ├── knowledge_index/        # 上传知识文档的应用服务
│       ├── model/                  # OpenAI 兼容聊天模型初始化
│       ├── plan/                   # 原项目保留的计划服务
│       └── taskstate/              # 可恢复任务、审计和 revision 控制
├── neuro_service/                  # Python/MNE 数据读取与分析进程
├── pkg/                            # 可复用的 Go 基础包
│   ├── config/                     # JSON 配置读取与校验
│   ├── log/                        # Logrus 日志初始化
│   └── tool/                       # 通用数值转换等小工具
├── scripts/                        # 仓库级知识索引和维护脚本
├── prometheusTestServer/           # 独立的 Prometheus 指标演示服务
├── prometheus_config/              # Prometheus 抓取与告警规则
├── data/                           # SQLite 与导入确认配置（本地生成）
├── outputs/                        # FIF、Epoch、审计报告等结果（本地生成）
├── log/                            # 后端运行日志（本地生成）
├── tmp/                            # 测试截图、临时可执行文件等（本地生成）
├── .cache/                         # Go、Electron 和测试缓存（本地生成）
├── .runtime/                       # Qdrant 等服务的运行状态（本地生成）
├── .tools/                         # 本地下载的工具和安装包（本地生成）
├── uploads/                        # 通过 /upload 上传的知识副本（运行后生成）
├── go.mod / go.sum                 # Go 模块声明与依赖锁定
├── docker-compose.prometheus.yml   # Prometheus 示例编排
├── .env.example                    # 环境变量示例，不包含真实密钥
├── .gitignore                      # 禁止提交的本地文件规则
├── LICENSE                         # MIT 许可证
└── README.md                       # 项目入口文档
```

### 顶级目录说明

| 目录 | 存放内容 | 是否提交 |
|------|----------|----------|
| `cmd/` | `main.go`：创建 Qdrant、Embedding、ReAct Agent、SQLite、Gin 路由并启动 8819 端口 | 提交 |
| `config/` | `config_template.json` 是安全配置示例，`qdrant.local.yaml` 是本地 Qdrant 配置；开发者自行创建的 `config.json` 含 API Key | 模板提交，`config.json` 不提交 |
| `desktop/` | Electron 前端的主进程、页面源码、依赖清单及安装/测试脚本 | 提交；`node_modules/` 不提交 |
| `docs/` | 项目功能说明以及供 RAG 建索引的 Markdown 专家知识 | 提交 |
| `internal/` | Go 后端主体，包括 HTTP、Agent、工具、记忆、数据集和任务状态 | 提交 |
| `neuro_service/` | MNE 数据检查、结构探测、导入复核、波形预览、EEG/fNIRS 分析及 Python 测试 | 提交；`__pycache__/` 不提交 |
| `pkg/` | 与具体业务耦合较少的配置、日志和基础工具 | 提交 |
| `scripts/` | 批量索引知识库、生成原子知识及辅助集成脚本 | 提交 |
| `prometheusTestServer/` | 用来模拟指标与告警数据的独立 Go 服务，不是 NeuroFlow 主后端 | 源码和 Dockerfile 提交，编译出的 `testserver` 不提交 |
| `prometheus_config/` | Prometheus 抓取目标和告警规则，配合根目录 Compose 文件使用 | 提交 |
| `data/` | `neuroflow.db`、WAL 文件和 `import-configs/`；包含本地会话、用户偏好、任务状态和源文件导入配置 | 不提交 |
| `outputs/` | 预处理后的 FIF、Epoch、JSON/HTML 审计报告，按 `dataset_id` 分目录保存 | 不提交 |
| `log/` | Go 服务和启动脚本产生的标准输出、错误输出及应用日志 | 不提交 |
| `tmp/` | 开发测试生成的截图、临时数据和本地编译文件 | 不提交 |
| `.cache/` | Go 构建缓存、Electron 测试配置和测试结果 | 不提交 |
| `.runtime/` | Qdrant 存储等本地服务运行数据 | 不提交 |
| `.tools/` | 下载的 Qdrant、Ollama 安装包及其他大型本地工具 | 不提交 |
| `uploads/` | `/upload` 接口接收的知识文档副本；权威知识源仍应编辑在 `docs/knowledge/` | 不提交 |

### `desktop/` 中的文件

| 路径 | 用途 |
|------|------|
| `electron/main.cjs` | 创建桌面窗口、打开系统文件选择器，并限制本地文件访问范围 |
| `electron/preload.cjs` | 通过 `contextBridge` 向页面暴露最小 IPC API |
| `renderer/index.html` | 工作台页面结构 |
| `renderer/app.js` | 应用状态、数据集、流程、对话和分析结果的主要交互逻辑 |
| `renderer/i18n.js` | 中英文文本字典和动态语言切换 |
| `renderer/import-review.js` | 通道名称/类型、参考、排除、单位、矩阵方向和设备模板编辑器 |
| `renderer/channel-layout.js` | Montage 坐标图、无坐标顺序图和通道选择联动 |
| `renderer/signal-window.js` | 真实波形缓存、按窗口读取、缩放、拖动及 Shift＋滚轮控制 |
| `renderer/advanced-ui.js` | 后端步骤 SSE、持久化任务面板、BIDS 浏览器、MEG 参数和高级分析结果展示 |
| `renderer/advanced-ui.css`、`analysis-products.css` | 任务、BIDS、ERP/时频/解码结果组件样式 |
| `renderer/styles.css`、`theme.css` | 组件布局、响应式样式和视觉主题 |
| `scripts/install.ps1` | Windows 下使用镜像安装 Electron 依赖 |
| `scripts/start.cjs` | 清理可能影响 Electron 的环境变量后启动桌面端 |
| `scripts/test-import-review.cjs` | 隐藏窗口 DOM 测试，覆盖导入编辑、通道图与信号导航 |
| `package.json`、`package-lock.json` | npm 命令、Electron 版本和可复现依赖锁定 |

### `neuro_service/` 中的文件

| 文件 | 用途 |
|------|------|
| `inspect_dataset.py` | 选择 MNE/结构化/BIDS 读取器并输出统一的可信元数据与冲突报告 |
| `structured_data.py` | 探测 CSV、TSV、TXT、MAT 和自定义二进制的矩阵、通道、单位与事件结构 |
| `import_review.py` | 应用通道编辑、单位、montage 和事件映射，持久化带文件指纹的确认配置 |
| `review_dataset.py` | 对候选配置执行试读；成功后再原子提交，失败时保留旧配置 |
| `bids_support.py` | 使用 `mne-bids` 定位并读取 EEG、MEG 或 fNIRS BIDS recording |
| `preview_dataset.py` | 按通道和时间范围读取真实信号，并抽稀为 Electron 可绘制数据 |
| `analyze_dataset.py` | 调度 EEG/MEG/fNIRS MNE 流程，生成质量指标、波形、输出文件和审计记录 |
| `advanced_analysis.py` | MEG SSS/tSSS/空房 SSP、确定性参数搜索及 ERP/时频/解码分析 |
| `bids_catalog.py` | 枚举 BIDS recording 和实体，不加载完整采样数组 |
| `test_*.py` | 结构化导入、导入确认和真实分析的回归测试 |
| `requirements.txt` | Python 运行依赖及受支持版本范围 |

### `docs/knowledge/` 的组织方式

该目录只放经过整理、可追溯来源的知识条目，不放原始 EEG 文件或整本论文。一级标题会作为一个原子知识单元进入向量库。

| 目录 | 主要内容 |
|------|----------|
| `general/` | 采样与 Nyquist、信号单位、元数据验证、数据泄漏、复现、质量评价和审计要求 |
| `eeg/` | `quality_control`、`filtering`、`referencing`、`bad_channels`、`artifacts`、`epoching`、`workflows` |
| `meg/` | `quality_control`、`filtering`、`maxwell_filter`、`artifacts`、`workflows` |
| `fnirs/` | `quality_control`、`optical_density`、`motion_correction`、`beer_lambert`、`filtering`、`workflows` |
| `bci/` | `motor_imagery`、`p300`、`ssvep`、`cvep` 和 `evaluation` |

### `internal/` 的代码分层

- `handler/` 只处理 HTTP 参数、超时和响应码，实际业务下沉到 server 或工具层。
- `router/` 汇总所有 API 路由并将数据库、模型、检索器和服务注入处理器。
- `repo/qrdant/` 是现有目录名，负责 Qdrant 初始化、索引和检索；`qrdant` 的拼写是历史遗留，重命名时需同步修改 Go import 路径。
- `server/ai/agent/chat/` 组装检索、提示模板和 Eino ReAct Agent。
- `server/ai/agent/knowledge_index/` 将 Markdown 加载、切分并写入向量库。
- `server/ai/agent/plan_execute_replan/` 是原项目保留的实验性工作流，目前不等同于主聊天 Agent 的可恢复预处理任务。
- `server/ai/tools/` 放 Agent 可以选择的 function call；工具负责确定性校验或执行，不让模型直接运行任意代码。
- `server/chatServer/` 管理非流式/流式聊天、最近消息、长期摘要、偏好和会话绑定。
- `server/dataset/` 保存进程内 `dataset_id → 本地路径/元数据` 映射，并调用 Python 读取信号。
- `server/taskstate/` 把待确认字段、用户答案、验证证据、执行计划和审计状态保存到 SQLite。
- `server/model/` 根据 `config.json` 创建兼容 OpenAI API 的模型客户端。
- `server/knowledge_index/` 是 `/upload` 的应用服务；不要与 Agent 图目录 `ai/agent/knowledge_index/` 混淆。
- `server/plan/` 为上游项目保留的 `/plan` 示例服务，与 NeuroFlow 的 MNE 预处理执行链相互独立。

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
- `validate_acquisition_config`：核对用户声明、设备知识映射和文件元数据
- `create_neuro_preprocessing_draft`：生成非执行型预处理草案
- `run_neuro_analysis`：根据 `dataset_id` 在本机执行 EEG/MEG/fNIRS 分析，只向模型返回汇总指标
- `manage_preprocessing_task`：保存待确认信息、验证证据和计划，并在验证通过后恢复执行
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
python neuro_service/test_structured_data.py
python neuro_service/test_import_review.py
python -m compileall -q neuro_service
```

```powershell
cd desktop
npm.cmd run check
```

信号交互的 Electron DOM 测试位于 `desktop/scripts/test-import-review.cjs`。它使用隐藏窗口和模拟后端响应，覆盖通道选择、缓存、Shift＋滚轮、连续缩放和时间边界；真实数据分析测试另外通过 Python/MNE 执行。

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
- CSV/MAT/自定义二进制结构探测、BIDS 初步读取与导入配置确认
- 通道名称/类型/参考/排除编辑、montage 坐标与无坐标顺序图
- 完整时间轴移动、Shift＋滚轮、采样点级窗口缩放、原始/处理后对比和单通道详情
- 数据集注册、可信元数据查询和结构化预处理草案
- EEG 自动参数、坏道检测与插值、平均参考、ICA 筛选及质量比较
- EEG ERP/GFP、Morlet 时频、折内 CSP＋LDA 解码及可复现 HTML/JSON 报告
- MEG 空房 SSP、SSS/tSSS、陷波、带通和失败降级审计
- fNIRS 光密度、TDDR、Beer–Lambert、滤波和 HbO/HbR 汇总
- 可选 FIF/审计文件保存、运行记录和 Agent 操作结果校验
- SQLite 可恢复任务、用户回答证据、验证结果、步骤状态与中断保护
- 后端真实步骤 SSE、Electron 任务面板和分析结果卡片
- BIDS recording 浏览、EEG/MEG Derivatives 写入和产物查询
- RAG 知识检索以及安全 Markdown/代码块显示

待实现：

- MEG 运动补偿、自动坏传感器检测以及 Elekta 校准/串扰文件管理
- 跨会话、跨受试者分组解码与嵌套超参数评估
- fNIRS/MEG 专用高级统计图及组水平分析
- BIDS Derivatives 删除、版本比较和批量受试者队列

## License

本项目使用 [MIT License](LICENSE)。
