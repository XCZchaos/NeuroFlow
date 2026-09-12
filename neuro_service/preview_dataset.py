"""读取短时间真实波形供 Electron 预览，不执行任何预处理。"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import mne
import numpy as np

READERS = {
    ".edf": "read_raw_edf", ".bdf": "read_raw_bdf", ".gdf": "read_raw_gdf",
    ".vhdr": "read_raw_brainvision", ".set": "read_raw_eeglab", ".fif": "read_raw_fif",
    ".snirf": "read_raw_snirf", ".cnt": "read_raw_cnt", ".egi": "read_raw_egi",
    ".mff": "read_raw_egi", ".con": "read_raw_kit", ".sqd": "read_raw_kit", ".ds": "read_raw_ctf",
}


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    try:
        path = Path(sys.argv[1]).resolve()
        modality = sys.argv[2]
        duration = min(120.0, max(0.5, float(sys.argv[3]) if len(sys.argv) > 3 else 10.0))
        start_seconds = max(0.0, float(sys.argv[4]) if len(sys.argv) > 4 else 0.0)
        requested_channel = sys.argv[5] if len(sys.argv) > 5 and sys.argv[5] else None
        suffix = ".ds" if path.is_dir() and path.name.lower().endswith(".ds") else path.suffix.lower()
        reader = READERS.get(suffix)
        if not reader:
            raise ValueError(f"unsupported file format: {suffix}")
        raw = getattr(mne.io, reader)(str(path), preload=False, verbose="ERROR")
        if modality == "EEG":
            picks = mne.pick_types(raw.info, eeg=True, meg=False, fnirs=False, exclude=[])
            scale, unit = 1e6, "µV"
        elif modality == "MEG":
            picks = mne.pick_types(raw.info, eeg=False, meg=True, fnirs=False, exclude=[])
            scale, unit = 1.0, "SI"
        elif modality == "fNIRS":
            picks = mne.pick_types(raw.info, eeg=False, meg=False, fnirs=True, exclude=[])
            scale, unit = 1.0, "a.u."
        else:
            raise ValueError(f"unsupported modality: {modality}")
        if not len(picks):
            raise ValueError(f"dataset has no {modality} channels")
        available_names = [raw.ch_names[index] for index in picks]
        if requested_channel:
            if requested_channel not in available_names:
                raise ValueError(f"channel does not exist: {requested_channel}")
            picks = np.asarray([raw.ch_names.index(requested_channel)], dtype=int)
        else:
            picks = picks[:8]
        sfreq = float(raw.info["sfreq"])
        start = min(max(0, int(round(start_seconds * sfreq))), max(0, raw.n_times - 1))
        stop = min(raw.n_times, start + max(1, int(round(duration * sfreq))))
        data = raw.get_data(picks=picks, start=start, stop=stop) * scale
        # 仅为屏幕纵向居中去除每个通道在这个窗口内的常量偏置，不做滤波。
        data = data - np.mean(data, axis=1, keepdims=True)
        step = max(1, math.ceil((stop - start) / 2400))
        data = data[:, ::step]
        print(json.dumps({
            "ok": True, "kind": "raw", "real": True,
            "channel_names": [raw.ch_names[index] for index in picks],
            "available_channel_names": available_names,
            "sample_rate_hz": sfreq / step, "original_sample_rate_hz": sfreq,
            "downsample_factor": step, "start_seconds": start / sfreq,
            "end_seconds": stop / sfreq, "unit": unit, "data": data.tolist(),
        }, ensure_ascii=False, allow_nan=False))
        return 0
    except Exception as error:
        print(json.dumps({"ok": False, "code": "PREVIEW_FAILED", "message": str(error)}, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
