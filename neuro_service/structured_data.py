"""把表格、MAT 和带 sidecar 的二进制神经信号转换为 MNE Raw。

推断结果始终携带置信度和待确认项。无法可靠确定采样率或数组布局时直接报错，
避免用猜测的数据结构执行科研预处理。
"""
from __future__ import annotations

import csv
import json
import re
from pathlib import Path

import mne
import numpy as np
from scipy.io import loadmat
from import_review import get_config


STRUCTURED_EXTENSIONS = {".csv", ".tsv", ".txt", ".mat", ".bin", ".dat", ".raw"}
TIME_NAMES = {"time", "times", "timestamp", "timestamps", "time_s", "seconds", "sec"}
EVENT_NAMES = {"event", "events", "trigger", "triggers", "marker", "markers", "stim", "status"}
META_KEYS = {"sfreq", "fs", "sampling_rate", "sampling_rate_hz", "samplerate"}


def _sidecar(path: Path) -> dict:
    candidates = [path.with_suffix(path.suffix + ".json"), path.with_suffix(".json")]
    for candidate in candidates:
        if candidate.exists() and candidate != path:
            # utf-8-sig 同时兼容 Windows 工具写入的 BOM 和普通 UTF-8 JSON。
            value = json.loads(candidate.read_text(encoding="utf-8-sig"))
            if not isinstance(value, dict):
                raise ValueError(f"sidecar must contain a JSON object: {candidate.name}")
            value["_sidecar_name"] = candidate.name
            return value
    return {}


def _float(value, default=0.0) -> float:
    try:
        return float(np.asarray(value).squeeze())
    except (TypeError, ValueError):
        return default


def _clean_name(value: object, index: int) -> str:
    name = str(value).strip() or f"CH{index + 1}"
    return re.sub(r"\s+", " ", name)


def _canonical_eeg_name(name: str) -> str:
    """保守移除常见导出前后缀；不能识别的设备名称保持不变。"""
    value = re.sub(r"^(EEG|CHAN(?:NEL)?)\s*[-_:]?\s*", "", name, flags=re.I)
    value = re.sub(r"\s*[-_]?(REF|LE|RE)$", "", value, flags=re.I)
    standard = {item.lower(): item for item in mne.channels.make_standard_montage("standard_1020").ch_names}
    return standard.get(value.lower(), name)


def _channel_type(name: str, modality: str) -> str:
    upper = name.upper()
    if re.search(r"(^|[-_ ])EOG|HEOG|VEOG", upper):
        return "eog"
    if "ECG" in upper or "EKG" in upper:
        return "ecg"
    if "EMG" in upper:
        return "emg"
    if upper in {"STI", "STIM", "STATUS", "TRIGGER"}:
        return "stim"
    return "eeg" if modality == "EEG" else "misc"


def _unit_scale(unit: str, data: np.ndarray, modality: str) -> tuple[float, str, float, list[str]]:
    normalized = unit.strip().lower().replace("μ", "u").replace("µ", "u")
    known = {"v": (1.0, "V"), "uv": (1e-6, "uV"), "mv": (1e-3, "mV")}
    if normalized in known:
        scale, label = known[normalized]
        return scale, label, 1.0, []
    if modality != "EEG":
        return 1.0, unit or "a.u.", 0.4, ["非 EEG 表格单位未确认"]
    amplitude = float(np.nanmedian(np.ptp(data, axis=1))) if data.size else 0.0
    if amplitude > 0.5:
        return 1e-6, "uV", 0.55, ["未声明单位；根据数值范围暂按微伏解释，需要人工确认"]
    return 1.0, "V", 0.65, ["未声明单位；根据数值范围暂按伏解释，需要人工确认"]


def _build_raw(data: np.ndarray, sfreq: float, names: list[str], modality: str,
               unit: str, events: list[tuple[float, str]], report: dict, sidecar: dict):
    if sfreq <= 0:
        raise ValueError("sampling rate is missing; provide a time column or sidecar sampling_rate_hz")
    if data.ndim != 2 or min(data.shape) == 0:
        raise ValueError("signal array must be a non-empty 2D matrix")
    if not np.all(np.isfinite(data)):
        bad = int(np.size(data) - np.count_nonzero(np.isfinite(data)))
        report["warnings"].append(f"检测到 {bad} 个缺失/无穷值，使用通道中位数填补")
        for index in range(data.shape[0]):
            fill = np.nanmedian(data[index])
            data[index] = np.nan_to_num(data[index], nan=fill if np.isfinite(fill) else 0.0)
    names = [_clean_name(name, index) for index, name in enumerate(names)]
    mapping = {name: _canonical_eeg_name(name) for name in names} if modality == "EEG" else {name: name for name in names}
    normalized_names = [mapping[name] for name in names]
    if len(set(normalized_names)) != len(normalized_names):
        report["conflicts"].append("通道名称标准化后发生重名，已保留原始名称")
        normalized_names, mapping = names, {name: name for name in names}
    types = [_channel_type(name, modality) for name in normalized_names]
    # sidecar 可覆盖自动类型，既支持与通道同序的列表，也支持 {通道名: 类型} 映射。
    declared_types = sidecar.get("channel_types")
    if isinstance(declared_types, list):
        if len(declared_types) != len(types):
            report["conflicts"].append("sidecar channel_types count does not match channels")
        else:
            types = [str(value).lower() for value in declared_types]
    elif isinstance(declared_types, dict):
        types = [str(declared_types.get(original, declared_types.get(normalized, inferred))).lower()
                 for original, normalized, inferred in zip(names, normalized_names, types)]
    scale, resolved_unit, unit_confidence, warnings = _unit_scale(unit, data, modality)
    report["warnings"].extend(warnings)
    eeg_mask = np.asarray([kind in {"eeg", "eog", "ecg", "emg"} for kind in types])
    data = data.astype(float, copy=True)
    data[eeg_mask] *= scale
    if np.any(eeg_mask) and float(np.nanmedian(np.ptp(data[eeg_mask], axis=1))) > .01:
        report["conflicts"].append("EEG amplitude exceeds 10 mV after unit conversion; verify unit and gain")
    info = mne.create_info(normalized_names, sfreq, types)
    raw = mne.io.RawArray(data, info, verbose=False)
    montage_name = None
    if "eeg" in types:
        montage = mne.channels.make_standard_montage("standard_1020")
        matched = [name for name, kind in zip(normalized_names, types) if kind == "eeg" and name in montage.ch_names]
        if matched:
            raw.set_montage(montage, on_missing="ignore", verbose=False)
            montage_name = "standard_1020"
        if len(matched) < sum(kind == "eeg" for kind in types):
            report["warnings"].append("部分 EEG 通道无法匹配 standard_1020，插值前需确认坐标")
    if events:
        raw.set_annotations(mne.Annotations([item[0] for item in events], [0.0] * len(events),
                                            [item[1] for item in events]))
    report.update({"channel_name_mapping": mapping, "channel_types": types,
                   "montage": montage_name, "unit": resolved_unit,
                   "unit_confidence": unit_confidence,
                   "event_dictionary": sidecar.get("event_dictionary") or sorted(set(description for _, description in events)),
                   "events_require_confirmation": bool(events) and not bool(sidecar.get("events_confirmed", False))})
    return raw


def _read_table(path: Path, sidecar: dict):
    sample = path.read_text(encoding=sidecar.get("encoding", "utf-8-sig"), errors="replace")[:8192]
    delimiter = sidecar.get("delimiter")
    if not delimiter:
        if path.suffix.lower() == ".tsv":
            delimiter = "\t"
        else:
            try:
                delimiter = csv.Sniffer().sniff(sample, delimiters=",;\t").delimiter
            except csv.Error:
                delimiter = ","
    with path.open(encoding=sidecar.get("encoding", "utf-8-sig"), errors="replace") as stream:
        rows = list(csv.reader(stream, delimiter=delimiter))
    rows = [row for row in rows if any(cell.strip() for cell in row)]
    if len(rows) < 2:
        raise ValueError("table does not contain enough rows")
    if sidecar.get('layout') == 'channels_x_samples':
        # 每一行可为纯数值，或以通道名开头；不将标注/时间行猜成信号。
        try:
            float(rows[0][0])
            labelled = False
        except ValueError:
            labelled = True
        names = [row[0].strip() if labelled else f'CH{i+1}' for i,row in enumerate(rows)]
        if any(name.lower() in TIME_NAMES | EVENT_NAMES for name in names):
            raise ValueError('Remove time/event rows before importing a channel-major CSV')
        data = np.asarray([[float(cell) for cell in (row[1:] if labelled else row)] for row in rows])
        return data, _float(sidecar.get('sampling_rate_hz')), names, [], {'adapter':'csv_table','confidence':.9,'layout':'channels_x_samples','warnings':[],'conflicts':[]}
    try:
        [float(cell) for cell in rows[0]]
        has_header = False
    except ValueError:
        has_header = True
    headers = [_clean_name(value, index) for index, value in enumerate(rows[0])] if has_header else [f"CH{i + 1}" for i in range(len(rows[0]))]
    values = rows[1:] if has_header else rows
    width = len(headers)
    matrix = np.asarray([[float(cell) if cell.strip() else np.nan for cell in row[:width]] for row in values], dtype=float)
    lowered = [name.lower() for name in headers]
    time_index = next((i for i, name in enumerate(lowered) if name in TIME_NAMES), None)
    event_index = next((i for i, name in enumerate(lowered) if name in EVENT_NAMES), None)
    sfreq = _float(sidecar.get("sampling_rate_hz") or sidecar.get("sfreq"))
    if time_index is not None:
        differences = np.diff(matrix[:, time_index])
        differences = differences[np.isfinite(differences) & (differences > 0)]
        if len(differences):
            inferred = 1.0 / float(np.median(differences))
            if sfreq and abs(sfreq - inferred) > max(0.01, sfreq * .01):
                raise ValueError(f"sidecar sampling rate {sfreq:g} conflicts with time column {inferred:g}")
            sfreq = inferred
    excluded = {index for index in (time_index, event_index) if index is not None}
    channel_indices = [index for index in range(width) if index not in excluded]
    names = sidecar.get("channel_names") or [headers[index] for index in channel_indices]
    if len(names) != len(channel_indices):
        raise ValueError("sidecar channel_names count does not match table signal columns")
    events = []
    if event_index is not None:
        previous = 0.0
        for row, code in enumerate(matrix[:, event_index]):
            if np.isfinite(code) and code != 0 and code != previous:
                onset = float(matrix[row, time_index]) if time_index is not None else row / sfreq
                events.append((onset, f"event/{code:g}"))
            previous = code
    report = {"adapter": "csv_table", "confidence": .9 if time_index is not None else .72,
              "layout": "samples_x_channels", "warnings": [], "conflicts": [],
              "inference": ["列为通道，行为采样点", "采样率来自时间列" if time_index is not None else "采样率来自 sidecar"]}
    return matrix[:, channel_indices].T, sfreq, list(names), events, report


def _mat_value(content: dict, keys: set[str]):
    for key, value in content.items():
        if key.lower() in keys:
            return value
    return None


def _read_mat(path: Path, sidecar: dict):
    content = loadmat(path, simplify_cells=True)
    candidates = [(key, value) for key, value in content.items()
                  if not key.startswith("__") and isinstance(value, np.ndarray)
                  and np.issubdtype(value.dtype, np.number) and value.ndim == 2 and min(value.shape) >= 1]
    if not candidates:
        raise ValueError("MAT file has no numeric 2D signal array")
    preferred = {"data": 5, "eeg": 5, "signal": 5, "signals": 5, "x": 2}
    key, array = max(candidates, key=lambda item: (preferred.get(item[0].lower(), 0), item[1].size))
    names_value = sidecar.get("channel_names")
    if names_value is None:
        names_value = _mat_value(content, {"ch_names", "channel_names", "channels", "labels"})
    names = [str(value) for value in np.atleast_1d(names_value).tolist()] if names_value is not None else []
    if sidecar.get('layout') in {'channels_x_samples', 'samples_x_channels'}:
        layout = sidecar['layout']
        data = array if layout == 'channels_x_samples' else array.T
        if len(names) != data.shape[0]:
            names = []
    elif names and array.shape[0] == len(names):
        data, layout = array, "channels_x_samples"
    elif names and array.shape[1] == len(names):
        data, layout = array.T, "samples_x_channels"
    elif array.shape[0] <= array.shape[1] and array.shape[0] <= 512:
        data, layout = array, "channels_x_samples_inferred"
    elif array.shape[1] <= 512:
        data, layout = array.T, "samples_x_channels_inferred"
    else:
        raise ValueError("cannot infer MAT channel axis; provide sidecar channel_names")
    if not names:
        names = [f"CH{index + 1}" for index in range(data.shape[0])]
    sfreq_value = sidecar.get("sampling_rate_hz")
    if sfreq_value is None:
        sfreq_value = _mat_value(content, META_KEYS)
    sfreq = _float(sfreq_value)
    event_samples = _mat_value(content, {"event_samples", "events", "event_positions", "latencies"})
    event_codes = _mat_value(content, {"event_codes", "event_types", "event_labels"})
    events = []
    if event_samples is not None and sfreq > 0:
        samples = np.atleast_1d(event_samples).astype(float).ravel()
        codes = np.atleast_1d(event_codes).ravel() if event_codes is not None else np.ones(len(samples), dtype=int)
        for index, sample_index in enumerate(samples):
            if np.isfinite(sample_index):
                events.append((float(sample_index) / sfreq, f"event/{codes[min(index, len(codes)-1)]}"))
    report = {"adapter": "scipy.io.loadmat", "confidence": .92 if names_value is not None else .68,
              "layout": layout, "selected_array": key, "warnings": [], "conflicts": [],
              "inference": [f"selected numeric array {key}", f"layout {layout}"]}
    return np.asarray(data, dtype=float), sfreq, names, events, report


def _read_binary(path: Path, sidecar: dict):
    required = [key for key in ("dtype", "shape", "sampling_rate_hz") if key not in sidecar]
    if required:
        raise ValueError(f"custom binary requires JSON sidecar fields: {', '.join(required)}")
    shape = tuple(int(value) for value in sidecar["shape"])
    if len(shape) != 2 or min(shape) <= 0:
        raise ValueError("binary sidecar shape must contain two positive dimensions")
    array = np.memmap(path, dtype=np.dtype(sidecar["dtype"]), mode="r",
                      offset=int(sidecar.get("offset_bytes", 0)), shape=shape,
                      order=sidecar.get("order", "C"))
    layout = sidecar.get("layout", "samples_x_channels")
    data = np.asarray(array.T if layout == "samples_x_channels" else array, dtype=float)
    names = sidecar.get("channel_names") or [f"CH{index + 1}" for index in range(data.shape[0])]
    if len(names) != data.shape[0]:
        raise ValueError("binary sidecar channel_names count does not match shape/layout")
    report = {"adapter": "numpy.memmap+json_sidecar", "confidence": .98,
              "layout": layout, "sidecar": sidecar.get("_sidecar_name"),
              "warnings": [], "conflicts": [], "inference": ["结构来自显式 JSON sidecar"]}
    return data, float(sidecar["sampling_rate_hz"]), list(names), [], report


def load_structured_raw(path: Path):
    """返回 (Raw, 结构报告)。"""
    sidecar = _sidecar(path)
    # 明确的导入配置优先于启发式推断，单位在 RawArray 构造前转换一次。
    config = get_config(path)
    for key in ('layout', 'unit', 'sampling_rate_hz'):
        if config.get(key):
            sidecar[key] = config[key]
    suffix = path.suffix.lower()
    if suffix in {".csv", ".tsv", ".txt"}:
        data, sfreq, names, events, report = _read_table(path, sidecar)
    elif suffix == ".mat":
        data, sfreq, names, events, report = _read_mat(path, sidecar)
    elif suffix in {".bin", ".dat", ".raw"}:
        data, sfreq, names, events, report = _read_binary(path, sidecar)
    else:
        raise ValueError(f"not a structured-data extension: {suffix}")
    modality = str(sidecar.get("modality", "EEG")).strip()
    if modality.lower() != "eeg":
        raise ValueError("generic structured import currently requires modality=EEG; use a standard MNE format for MEG/fNIRS")
    raw = _build_raw(data, sfreq, names, "EEG", str(sidecar.get("unit", "")), events, report, sidecar)
    report["modality"] = "EEG"
    report["requires_confirmation"] = bool(report["warnings"] or report["conflicts"] or report["events_require_confirmation"])
    report["confidence"] = round(min(report["confidence"], report["unit_confidence"] if not sidecar.get("unit") else 1.0), 3)
    return raw, report
