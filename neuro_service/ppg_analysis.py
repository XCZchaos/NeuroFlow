"""PPG workspace: explicit channel/time configuration, read-only local processing.

CSV amplitudes remain in their original units: they must never pass through the
EEG microvolt conversion. No raw or cleaned recording is saved implicitly.
"""
from __future__ import annotations

import contextlib
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd


def read_source(options):
    path = Path(options.get("path", ""))
    if not path.is_file():
        raise ValueError("File does not exist / 文件不存在")
    if path.stat().st_size > 256 * 1024 * 1024:
        raise ValueError("PPG workspace limit: 256 MB per file / 文件超过 256 MB")
    if path.suffix.lower() in {".csv", ".tsv", ".txt"}:
        # Delimiter detection supports comma, tab and semicolon exports. A header
        # is mandatory; arbitrary device-specific binary/compound CSV is rejected.
        for encoding in ("utf-8-sig", "gb18030"):
            try:
                frame = pd.read_csv(path, sep=None, engine="python", encoding=encoding)
                break
            except UnicodeDecodeError:
                continue
        else:
            raise ValueError("Unsupported text encoding / 无法识别文本编码")
        if frame.empty or len(frame.columns) > 256 or len(frame) > 5_000_000:
            raise ValueError("Empty or oversized table / 表格为空或过大")
        names = [str(c) for c in frame.columns]
        if all(_is_number(c) for c in names):
            raise ValueError("CSV requires column headers / CSV 第一行必须为列名")
        numeric = frame.apply(pd.to_numeric, errors="coerce")
        names = [str(c) for c in numeric if numeric[c].notna().any()]
        if not names:
            raise ValueError("No numeric signal columns / 没有数值信号列")
        return numeric[names], None, "source units / 原始单位"
    # MNE readers preserve native metadata; only the selected channel is loaded
    # below, and its sampling frequency cannot be silently overwritten.
    if path.suffix.lower() not in {".edf", ".bdf", ".fif", ".gdf"}:
        raise ValueError("Supported: CSV / TSV / TXT / EDF / BDF / FIF / GDF")
    from analyze_dataset import load_raw
    return load_raw(path), "mne", "MNE native units / MNE 原生单位"


def _is_number(value):
    try:
        float(value)
        return True
    except ValueError:
        return False


def run(options):
    source, kind, unit = read_source(options)
    try:
        names = list(source.ch_names if kind else source.columns)
        count = int(source.n_times if kind else len(source))
        time_name = options.get("time_column", "")
        rate = float(source.info["sfreq"]) if kind else float(options.get("sampling_rate_hz") or 0)
        inferred = None
        if not kind and time_name:
            if time_name not in names:
                raise ValueError("Time column not found / 找不到时间列")
            times = source[time_name].to_numpy(float)
            time_unit = options.get("time_unit", "s")
            if time_unit not in {"s", "ms"}:
                raise ValueError("Time unit must be s or ms")
            times = times / (1000 if time_unit == "ms" else 1)
            steps = np.diff(times)
            if not np.isfinite(times).all() or not len(steps) or np.any(steps <= 0):
                raise ValueError("Time must be finite and strictly increasing / 时间列须严格递增且无缺失")
            median = float(np.median(steps))
            # Fixed-rate filters must not treat missing packets as contiguous data.
            if np.max(np.abs(steps - median)) > median * .1:
                raise ValueError("Irregular timestamps: resample explicitly first / 时间间隔不均匀，请先重采样")
            inferred = 1 / median
            if rate and abs(rate - inferred) / inferred > .02:
                raise ValueError("Sampling rate conflicts with timestamps / 采样率与时间列冲突")
            rate = rate or inferred
        meta = {"ok": True, "channels": names, "samples": count,
                "sampling_rate_hz": rate or None, "inferred_rate_hz": inferred,
                "duration_seconds": count / rate if rate else None, "unit": unit,
                "file_name": Path(options["path"]).name}
        if options.get("operation") == "inspect":
            return meta
        if not np.isfinite(rate) or not 25 <= rate <= 10000:
            raise ValueError("Confirm sampling rate (25–10000 Hz) / 请确认采样率（25–10000 Hz）")
        channel = options.get("channel", "")
        if channel not in names or channel == time_name:
            raise ValueError("Select a PPG signal column, not time / 请选择 PPG 信号列而非时间列")
        start, duration = float(options.get("start_seconds", 0)), float(options.get("duration_seconds", 60))
        if not np.isfinite([start, duration]).all() or start < 0 or not 10 <= duration <= 600:
            raise ValueError("Analysis window: start ≥ 0, duration 10–600 s / 时间范围无效")
        first, last = round(start * rate), min(count, round((start + duration) * rate))
        if last - first < rate * 10 or last - first > 2_000_000:
            raise ValueError("Window requires ≥ 10 s and ≤ 2 million samples / 有效窗口至少 10 秒，最多 200 万点")
        data = source.get_data(picks=[channel], start=first, stop=last)[0] if kind else source[channel].to_numpy(float)[first:last]
        if not np.isfinite(data).all():
            raise ValueError("Signal contains missing/non-numeric values / 信号有缺失或非数值，请先修复")
        if np.ptp(data) <= np.finfo(float).eps:
            raise ValueError("Flat signal: no detectable pulse / 平坦信号，无法检测脉搏")
        import neurokit2 as nk
        # elgendi is NeuroKit2's PPG-specific 0.5–8 Hz cleaning + peak detector.
        # Polarity is explicit because optical sensor exports can be inverted.
        work = -data if options.get("invert", False) else data.copy()
        cleaned = nk.ppg_clean(work, sampling_rate=rate, method="elgendi")
        peaks = np.asarray(nk.ppg_findpeaks(cleaned, sampling_rate=rate, method="elgendi")["PPG_Peaks"], dtype=int)
        intervals = np.diff(peaks) / rate
        bpm = 60 / intervals if len(intervals) else np.array([])
        warnings = []
        if len(peaks) < 3:
            warnings.append("Too few peaks; heart rate unavailable / 脉搏峰太少，无法可靠估计心率")
        if len(bpm) and np.any((bpm < 30) | (bpm > 220)):
            warnings.append("Implausible intervals: review motion and peak detection / 存在异常间期，请检查体动和漏检/误检")
        # Min/max envelope keeps narrow pulses visible. Retain exact peak indices
        # as well; display decimation never feeds the physiological calculations.
        indices = set(peaks.tolist())
        for chunk in np.array_split(np.arange(len(data)), min(3000, len(data))):
            indices.update((int(chunk[0]), int(chunk[-1]), int(chunk[np.argmin(work[chunk])]),
                            int(chunk[np.argmax(work[chunk])]), int(chunk[np.argmin(cleaned[chunk])]),
                            int(chunk[np.argmax(cleaned[chunk])])))
        indices = np.array(sorted(indices), dtype=int)
        return {**meta, "library": f"NeuroKit2 {nk.__version__}", "method": "elgendi",
                "channel": channel, "invert": bool(options.get("invert")), "saved": False,
                "start_seconds": first / rate, "end_seconds": last / rate,
                "mean_bpm": float(np.mean(bpm)) if len(peaks) >= 3 else None,
                "peak_count": len(peaks), "warnings": warnings,
                "waveform": {"time": ((indices + first) / rate).tolist(),
                             "raw": work[indices].tolist(), "cleaned": cleaned[indices].tolist()},
                "peaks": [{"sample": int(p + first), "time": float((p + first) / rate),
                           "amplitude": float(cleaned[p])} for p in peaks],
                "heart_rate": {"time": ((peaks[1:] + first) / rate).tolist(), "bpm": bpm.tolist()},
                "parameters": {"sampling_rate_hz": rate, "time_column": time_name,
                               "time_unit": options.get("time_unit", "s"), "bandpass_hz": [0.5, 8]}}
    finally:
        if kind:
            source.close()


if __name__ == "__main__":
    try:
        # Keep stdout machine-readable even if a third-party reader logs output.
        with contextlib.redirect_stdout(sys.stderr):
            result = run(json.load(sys.stdin))
        print(json.dumps(result, ensure_ascii=False, allow_nan=False))
    except Exception as exc:
        print(json.dumps({"ok": False, "message": str(exc)}, ensure_ascii=False))
        sys.exit(1)
