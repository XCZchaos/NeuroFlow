"""Read-only NeuroKit2 EEG diagnostics for the Agent tool.

MNE remains responsible for reading the registered file and selecting EEG channels.
NeuroKit2 receives only a bounded time window; no preprocessing file is written.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import numpy as np

from analyze_dataset import load_raw, select_range, validate_size


def finite(value):
    number = float(value)
    return number if math.isfinite(number) else None


def analyze(path: Path, method: str, start_seconds: float, end_seconds: float,
            channels=None) -> dict:
    # 懒加载使主 MNE 流程不依赖 NeuroKit2；未安装时只影响这个独立工具。
    try:
        import neurokit2 as nk
    except ImportError as exc:
        raise RuntimeError("NeuroKit2 未安装；请运行 python -m pip install -r neuro_service/requirements.txt") from exc

    raw = load_raw(path)
    try:
        eeg_names = [name for name, kind in zip(raw.ch_names, raw.get_channel_types()) if kind == "eeg"]
        if not eeg_names:
            raise ValueError("文件没有可分析的 EEG 通道")
        if channels:
            missing = sorted(set(channels) - set(eeg_names))
            if missing:
                raise ValueError(f"所选通道不是 EEG 通道: {missing}")
            eeg_names = list(dict.fromkeys(channels))
        if len(eeg_names) < 2 and method in {"bad_channels", "gfp"}:
            raise ValueError(f"{method} 至少需要两个 EEG 通道")
        if method == "bad_channels" and len(eeg_names) < 4:
            raise ValueError("NeuroKit2 跨通道坏道检测至少需要 4 个 EEG 通道；少通道数据请结合原始波形人工检查")

        start, stop, sfreq = select_range(raw, start_seconds, end_seconds)
        validate_size(stop - start, len(eeg_names), sfreq)
        if stop - start < max(100, int(sfreq * 2)):
            raise ValueError("分析窗口至少需要 2 秒且不少于 100 个采样点")
        # copy/crop 不修改注册的原始数据；pick 只保留 EEG，避免把 EOG/刺激通道混入指标。
        window = raw.copy().crop(tmin=start / sfreq, tmax=(stop - 1) / sfreq).pick(eeg_names)
        data = window.get_data()
        if not np.isfinite(data).all():
            raise ValueError("分析窗口含 NaN 或无穷值，请先修复数据结构")

        common = {"ok": True, "library": "NeuroKit2", "method": method,
                  "channels": eeg_names, "channel_count": len(eeg_names),
                  "sampling_rate_hz": sfreq, "start_seconds": start / sfreq,
                  "end_seconds": stop / sfreq, "saved": False}
        if method == "bad_channels":
            bads, details = nk.eeg_badchannels(window, show=False)
            metrics = json.loads(details.head(64).to_json(orient="records"))
            return {**common, "bad_channels": [str(name) for name in bads],
                    "bad_channel_count": len(bads),
                    "interpretation": "候选坏道；尚未插值或修改原始文件",
                    "channel_metrics": metrics, "truncated": len(details) > 64}
        if method == "band_power":
            # NeuroKit2 的默认 Gamma 上限为 80 Hz；低采样率数据只请求 Nyquist 以下的频带。
            bands = [("Delta", 4), ("Theta", 8), ("Alpha", 13),
                     ("Beta", 30), ("Gamma", 80)]
            available = [name for name, upper in bands if upper < sfreq / 2]
            if not available:
                raise ValueError("采样率过低，Nyquist 频率不足以计算 Delta 频带")
            power = nk.eeg_power(window, frequency_band=available)
            rows = json.loads(power.head(64).to_json(orient="records"))
            return {**common, "frequency_bands": available,
                    "band_power_by_channel": rows, "truncated": len(power) > 64}
        if method == "gfp":
            # GFP 是跨电极的场强诊断值；这里返回摘要，避免把整段波形塞进模型上下文。
            gfp = np.asarray(nk.eeg_gfp(data, method="l2"), dtype=float)
            return {**common, "gfp_mean": finite(np.mean(gfp)),
                    "gfp_median": finite(np.median(gfp)),
                    "gfp_p95": finite(np.percentile(gfp, 95)),
                    "unit": "V", "sample_count": int(gfp.size)}
        raise ValueError(f"不支持的 NeuroKit2 方法: {method}")
    finally:
        raw.close()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("path", type=Path)
    parser.add_argument("method", choices=["bad_channels", "band_power", "gfp"])
    parser.add_argument("--start", type=float, default=0)
    parser.add_argument("--end", type=float, default=0)
    parser.add_argument("--channels", default="", help="JSON string array of EEG channel names")
    args = parser.parse_args()
    try:
        channels = json.loads(args.channels) if args.channels else None
        if channels is not None and (not isinstance(channels, list) or not all(isinstance(c, str) for c in channels)):
            raise ValueError("channels 必须是通道名称字符串数组")
        print(json.dumps(analyze(args.path, args.method, args.start, args.end, channels),
                         ensure_ascii=False, allow_nan=False))
        return 0
    except Exception as exc:
        print(json.dumps({"ok": False, "message": str(exc)}, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    sys.exit(main())
