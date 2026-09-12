"""神经信号文件元数据检查器。

这个脚本只读取文件头和元数据，不加载整段信号，也不执行滤波、ICA 等预处理。
Go 后端把文件路径作为唯一参数传入；脚本始终在标准输出中返回一段 JSON，
这样 Go 不需要理解每一种科研文件格式。
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

# 格式适配器表：扩展名 ->（预期模态，MNE 读取函数名）。
# 扩展新格式时通常只需在这里增加一项，而不用修改 Electron、Go 接口或 Agent。
# "auto" 表示一个格式可能装载不同模态，例如 FIF 既可能存 EEG，也可能存 MEG，
# 所以打开文件后还会根据真实通道类型判断模态。
READERS = {
    ".edf": ("EEG", "read_raw_edf"), ".bdf": ("EEG", "read_raw_bdf"),
    ".gdf": ("EEG", "read_raw_gdf"), ".vhdr": ("EEG", "read_raw_brainvision"),
    ".set": ("EEG", "read_raw_eeglab"), ".fif": ("auto", "read_raw_fif"),
    ".snirf": ("fNIRS", "read_raw_snirf"),
    ".cnt": ("EEG", "read_raw_cnt"), ".egi": ("EEG", "read_raw_egi"),
    ".mff": ("EEG", "read_raw_egi"), ".con": ("MEG", "read_raw_kit"),
    ".sqd": ("MEG", "read_raw_kit"), ".ds": ("MEG", "read_raw_ctf"),
}

def fail(code: str, message: str, **extra):
    """用统一 JSON 结构报告错误，便于前端显示可理解的失败原因。"""
    print(json.dumps({"ok": False, "code": code, "message": message, **extra}, ensure_ascii=False))
    return 1

def infer_modality(raw, hint: str) -> str:
    """优先根据实际通道类型判断模态，扩展名提示仅作为最后的回退。"""
    types = set(raw.get_channel_types())
    if types.intersection({"fnirs_cw_amplitude", "hbo", "hbr"}): return "fNIRS"
    if types.intersection({"mag", "grad"}): return "MEG"
    if "eeg" in types: return "EEG"
    return hint if hint != "auto" else "unknown"

def main() -> int:
    # CTF 的 .ds 数据是目录，其余常见格式通常是文件。
    if len(sys.argv) != 2: return fail("INVALID_ARGUMENT", "需要一个数据文件或数据目录路径")
    path = Path(sys.argv[1]).expanduser().resolve()
    if not path.exists(): return fail("FILE_NOT_FOUND", "文件不存在")
    suffix = ".ds" if path.is_dir() and path.name.lower().endswith(".ds") else path.suffix.lower()
    # 先探测格式，再动态取得对应读取器；未知格式会返回支持列表，不会误读。
    adapter = READERS.get(suffix)
    if adapter is None:
        return fail("UNSUPPORTED_FORMAT", f"暂不支持 {suffix or '无扩展名'} 格式",
                    detected_extension=suffix, supported_extensions=sorted(READERS))
    try:
        import mne
    except ImportError:
        return fail("DEPENDENCY_MISSING", "Python 环境未安装 mne")
    hint, reader_name = adapter
    reader = getattr(mne.io, reader_name, None)
    if reader is None: return fail("READER_UNAVAILABLE", f"当前 MNE 版本没有读取器 {reader_name}")
    try:
        # preload=False 很关键：这里只读文件头，导入大型 MEG/EEG 文件时不会把
        # 全部波形装入内存。真正计算质量指标时再由后续分析工具按需读取数据。
        raw = reader(str(path), preload=False, verbose="ERROR")
        sfreq = float(raw.info["sfreq"])
        types = raw.get_channel_types()
        counts = {kind: types.count(kind) for kind in sorted(set(types))}
        annotations = getattr(raw, "annotations", None)
        size = path.stat().st_size if path.is_file() else None
        # 这里只输出能由文件直接证明的事实。bad_channels 是文件中原本标记的坏道，
        # 并不代表系统已经运行了自动坏道检测。
        print(json.dumps({
            "ok": True, "format": suffix.lstrip(".").upper(),
            "reader": f"mne.io.{reader_name}", "modality": infer_modality(raw, hint),
            "sampling_rate_hz": sfreq, "channel_count": len(raw.ch_names),
            "channel_names": list(raw.ch_names), "channel_type_counts": counts,
            "duration_seconds": float(raw.n_times / sfreq) if sfreq else 0.0,
            "sample_count": int(raw.n_times), "bad_channels": list(raw.info.get("bads", [])),
            "line_frequency_hz": raw.info.get("line_freq"),
            "annotation_count": len(annotations) if annotations is not None else 0,
            "source_name": path.name, "source_size_bytes": size,
        }, ensure_ascii=False, allow_nan=False))
        return 0
    except Exception as exc:
        return fail("READ_FAILED", str(exc), reader=f"mne.io.{reader_name}")

if __name__ == "__main__": raise SystemExit(main())
