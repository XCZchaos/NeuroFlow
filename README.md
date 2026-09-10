# NeuroFlow

<p align="center">
  An intelligent neurophysiological signal workbench for EEG, MEG, and fNIRS
</p>

<p align="center">
  <strong>English</strong> · <a href="README_zh-CN.md">简体中文</a>
</p>

## Overview

**NeuroFlow** is an intelligent Agent workbench for brain-computer interface and neuroscience research. It aims to turn common neurophysiological signal workflows—data import, structure inspection, preprocessing planning, knowledge retrieval, and result interpretation—into a traceable, reviewable, and extensible Agent workflow.

The project currently uses **Go + CloudWeGo Eino** for Agent orchestration and backend services, **Python + MNE** for deterministic neurophysiological metadata inspection, **Qdrant + Ollama embeddings** for retrieval-augmented generation, and an OpenAI-compatible model service for natural-language interaction.

The core design principle is simple: **LLMs should understand, plan, select tools, and explain results; deterministic programs should read data and perform numerical computation.**

> **Current status:** NeuroFlow can inspect supported files, register trusted dataset metadata, invoke tools through a ReAct Agent, retrieve knowledge from a RAG pipeline, and generate structured preprocessing drafts. Real preprocessing operations such as filtering, ICA, bad-channel interpolation, SSS/tSSS, motion correction, and Beer–Lambert conversion are not yet connected to the automatic execution chain. Generated preprocessing workflows are therefore reviewable plans rather than claims that signal processing has already been executed.

## Key Features

- **Neurophysiological data inspection** — Python/MNE reads supported EEG, MEG, and fNIRS metadata in read-only mode without modifying the source files.
- **Dataset context management** — each successfully imported dataset receives a `dataset_id`, allowing the Agent to query program-verified facts instead of guessing them.
- **ReAct Agent** — built with CloudWeGo Eino and capable of selecting dataset inspection, workflow-planning, and RAG tools based on the user request.
- **Structured preprocessing drafts** — generate reviewable preprocessing suggestions from modality, task goal, sampling rate, line frequency, and other metadata.
- **RAG knowledge layer** — Markdown documents are chunked, embedded, and stored in Qdrant for domain-aware retrieval.
- **Streaming interaction** — SSE endpoints support progressive Agent responses for desktop or web clients.
- **Local-first data handling** — raw neurophysiological files stay at their original local path and are not uploaded to the knowledge base or directly sent to the LLM.
- **Extensible Tool layer** — the architecture is prepared for EEG/EMG quality assessment, feature extraction, deep-learning inference, and multimodal analysis tools.

## Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                         NeuroFlow                            │
├──────────────────────────────────────────────────────────────┤
│ Client / Desktop                                             │
│  ├─ Data selection and metadata display                     │
│  ├─ Preprocessing workflow interaction                      │
│  └─ Agent chat and Markdown rendering                       │
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
│  ├─ Python + MNE        signal format adapter / inspection  │
│  ├─ Qdrant             vector database                      │
│  ├─ Ollama             embedding service                    │
│  └─ OpenAI-compatible LLM                                   │
└──────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technologies |
|---|---|
| Backend | Go 1.25+, Gin |
| Agent | CloudWeGo Eino, ReAct, Tool Calling |
| LLM | OpenAI-compatible API |
| RAG | Eino Retriever, Qdrant |
| Embeddings | Ollama, `nomic-embed-text` |
| Neuro Signal I/O | Python 3.9+, MNE-Python |
| Protocol / Integration | HTTP, SSE, MCP |
| Client | Electron / Web client integration |
| Languages | Go, Python, JavaScript, HTML, CSS |

## Supported Data Formats

The current inspection service is based on MNE-Python and selects a reader according to the file extension.

| Modality | Format | Extension | MNE Reader |
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

> BrainVision datasets must keep their companion `.vmrk` and `.eeg` files. Externally stored EEGLAB datasets must keep their corresponding `.fdt` files. A CTF `.ds` reader adapter is reserved, while client-side directory selection still needs further work.

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/XCZchaos/NeuroFlow.git
cd NeuroFlow
```

### 2. Install Python dependencies

```bash
python -m pip install -r neuro_service/requirements.txt
```

### 3. Prepare the Ollama embedding model

```bash
ollama pull nomic-embed-text
```

### 4. Start Qdrant

Make sure the Qdrant gRPC service is available at `127.0.0.1:6334`. You can also run it with Docker:

```bash
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

### 5. Create a local configuration

Windows PowerShell:

```powershell
Copy-Item config/config_template.json config/config.json
```

Linux / macOS:

```bash
cp config/config_template.json config/config.json
```

Edit `config/config.json` and provide your own model name, API key, and OpenAI-compatible API base. Do not commit real credentials.

Example:

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

### 6. Start the Go backend

```bash
go run ./cmd
```

Default service address:

```text
http://localhost:8819
```

## API Examples

### Health Check

```http
GET /ping
```

```json
{"message":"pong"}
```

### Register and Inspect a Dataset

```http
POST /datasets/register
Content-Type: application/json

{
  "path": "D:\\NeuroData\\subject01.gdf"
}
```

Example response:

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

### Query Dataset Metadata

```http
GET /datasets/{dataset_id}
```

At the moment, dataset metadata is stored in the Go process memory. Datasets must therefore be registered again after a backend restart.

### Generate a Preprocessing Draft

```http
POST /agent/preprocessing/draft
Content-Type: application/json

{
  "modality": "EEG",
  "goal": "resting-state spectral analysis",
  "sampling_rate": 250,
  "line_frequency": 50
}
```

This endpoint returns a structured proposal and does not execute the preprocessing operations.

### Agent Chat

```http
POST /chat
Content-Type: application/json

{
  "question": "How many channels are in this dataset?",
  "id": "session-id"
}
```

### Streaming Chat

```http
POST /chatStream
Content-Type: application/json

{
  "question": "Explain the recommended EEG preprocessing steps",
  "id": "session-id"
}
```

The response is delivered through Server-Sent Events (SSE).

### Index Knowledge Documents

```http
POST /upload
Content-Type: multipart/form-data

file: <markdown-file>
```

This endpoint indexes Markdown knowledge documents. It is not intended for uploading raw EEG, MEG, or fNIRS recordings.

## Repository Structure

```text
NeuroFlow/
├── cmd/                            # Go service entry point
├── config/                         # Local configuration templates
├── desktop/                        # Client-related files
├── internal/
│   ├── handler/                    # Gin HTTP handlers
│   ├── repo/qrdant/                # Qdrant repository layer
│   ├── router/                     # API routing
│   └── server/
│       ├── ai/agent/chat/          # Eino ReAct Agent
│       ├── ai/tools/               # Agent tools
│       ├── chatServer/             # Sessions and streaming responses
│       ├── dataset/                # Dataset context registry
│       └── knowledge_index/        # RAG indexing service
├── neuro_service/                  # Python/MNE signal adapter
├── pkg/                            # Config, logging, utilities
├── prometheusTestServer/           # Prometheus test service
├── prometheus_config/              # Prometheus configuration
├── scripts/                        # Helper scripts
├── go.mod
└── go.sum
```

## Design Principles

### 1. Trusted Data First

The Agent should never infer sampling rate, channel count, duration, or file format from language-model priors. These facts must come from deterministic tools such as `inspect_dataset`.

### 2. LLMs Do Not Perform Numerical Signal Processing

Filtering, PSD, time-frequency analysis, RMS, MDF, model inference, and similar operations should be implemented as independent tools or algorithm services. The Agent should select, parameterize, and orchestrate them.

### 3. Suggestions Must Be Distinguished from Executed Results

Until a real algorithm execution chain is connected, NeuroFlow explicitly separates preprocessing recommendations, knowledge explanations, and verified computation results.

### 4. Local-First Raw Data Handling

Neurophysiological recordings can be large and potentially sensitive. NeuroFlow exposes only the structured metadata required by the Agent rather than sending entire raw recordings to an LLM by default.

## Extending NeuroFlow

### Add a New Data Format

Extend the reader mapping in `neuro_service/inspect_dataset.py` and keep the returned JSON schema consistent.

### Add a New Agent Tool

Deterministic EEG/EMG/MEG/fNIRS capabilities should be exposed as Eino tools. Future examples include:

```text
inspect_dataset
check_signal_quality
calculate_psd
calculate_bandpower
calculate_emg_rms
calculate_emg_mdf
run_model_inference
```

Tools should return structured and verifiable outputs. The LLM should not generate and execute arbitrary Python or shell code as part of the normal analysis path.

### Extend the Knowledge Base

Algorithm notes, device documentation, experimental protocols, literature notes, and other Markdown resources can be indexed so the RAG layer can provide domain evidence to the Agent.

## Roadmap

- [x] Go + Gin API service
- [x] CloudWeGo Eino ReAct Agent
- [x] Dataset registration and trusted metadata querying
- [x] MNE-Python multi-format inspection
- [x] Qdrant + Ollama RAG foundation
- [x] SSE streaming chat
- [ ] EEG signal-quality assessment tools
- [ ] Executable EEG preprocessing pipeline
- [ ] EMG support and feature-analysis tools
- [ ] PSD / band-power / time-frequency tools
- [ ] Multimodal EEG/EMG Agent workflow
- [ ] Deep-learning inference tools
- [ ] Supervisor / Multi-Agent orchestration
- [ ] Result validation and automated reports
- [ ] Complete desktop interaction and visualization

## Intended Use

NeuroFlow is currently best suited as:

- an engineering playground for neurophysiological signal Agents,
- an EEG/MEG/fNIRS inspection and preprocessing-planning tool,
- an example of Eino + RAG + Tool Calling for biosignal applications,
- a foundation for future multimodal EEG/EMG intelligent analysis workflows.

NeuroFlow is **not a clinical diagnostic tool**.

## Contributing

Issues and pull requests are welcome, especially for:

- new neurophysiological data adapters,
- EEG/EMG/MEG/fNIRS analysis tools,
- RAG and knowledge-base improvements,
- Agent workflow and Multi-Agent designs,
- bug fixes and documentation improvements.

## License

See the repository `LICENSE` file for licensing information.

---

If you are interested in **BCI, neuroengineering, biosignal processing, Agent systems, or multimodal intelligent analysis**, contributions and collaborations are welcome.