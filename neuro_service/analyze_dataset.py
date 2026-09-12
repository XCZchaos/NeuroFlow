"""NeuroFlow 的纯 Python EEG/fNIRS 离线分析器。

实现依据公开的信号处理方法和 MNE-Python API，不加载 BSense SDK 或任何 DLL。
脚本输出紧凑 JSON，供 Go Agent 的 function call 使用；原始波形不会返回给模型。
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import mne
import numpy as np
from scipy.stats import kurtosis
from mne.filter import filter_data, notch_filter
from mne.time_frequency import psd_array_welch


READERS = {
    ".edf": "read_raw_edf", ".bdf": "read_raw_bdf", ".gdf": "read_raw_gdf",
    ".vhdr": "read_raw_brainvision", ".set": "read_raw_eeglab", ".fif": "read_raw_fif",
    ".snirf": "read_raw_snirf", ".cnt": "read_raw_cnt", ".egi": "read_raw_egi",
    ".mff": "read_raw_egi", ".con": "read_raw_kit", ".sqd": "read_raw_kit",
    ".ds": "read_raw_ctf",
}

BANDS = {"delta": (1.0, 4.0), "theta": (4.0, 8.0), "alpha": (8.0, 13.0),
         "beta": (13.0, 30.0), "gamma": (30.0, 45.0)}


def finite(value):
    """把 NumPy 数值转换为 JSON 安全的 Python 数值。"""
    value = float(value)
    return value if math.isfinite(value) else None


def json_default(value):
    """兼容 MNE/NumPy 结果中的 int32、float64 等标量类型。"""
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, np.ndarray):
        return value.tolist()
    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


def load_raw(path: Path):
    suffix = ".ds" if path.is_dir() and path.name.lower().endswith(".ds") else path.suffix.lower()
    reader_name = READERS.get(suffix)
    if not reader_name:
        raise ValueError(f"unsupported file format: {suffix or 'no extension'}")
    return getattr(mne.io, reader_name)(str(path), preload=False, verbose="ERROR")


def select_range(raw, start_seconds: float, end_seconds: float):
    sfreq = float(raw.info["sfreq"])
    start = max(0, int(round(start_seconds * sfreq)))
    stop = min(raw.n_times, int(round(end_seconds * sfreq)) if end_seconds > 0 else raw.n_times)
    if stop <= start:
        raise ValueError("end_seconds must be greater than start_seconds")
    return start, stop, sfreq


def validate_size(samples: int, channels: int, sfreq: float):
    # 限制单次内存规模。Agent 收到错误后可以自动缩短 start/end 时间范围重试。
    cells = samples * channels
    if cells > 20_000_000:
        seconds = 20_000_000 / max(1, channels * sfreq)
        raise ValueError(f"selected range is too large; use at most {seconds:.1f} seconds per call")


def robust_outlier_mask(values: np.ndarray, threshold: float = 4.0):
    """使用中位数/MAD 找离群通道；MAD 为零时不会把正常通道误报为坏道。"""
    values = np.asarray(values, dtype=float)
    median = np.median(values)
    scale = 1.4826 * np.median(np.abs(values - median))
    if not np.isfinite(scale) or scale <= np.finfo(float).eps:
        return np.zeros(values.shape, dtype=bool)
    return np.abs(values - median) / scale > threshold


def signal_quality(data: np.ndarray, sfreq: float, line_hz: float):
    """计算处理前后可比较的质量指标和 0–100 启发式分数。"""
    centered = data - np.mean(data, axis=1, keepdims=True)
    scale = np.median(np.abs(centered - np.median(centered, axis=1, keepdims=True)), axis=1, keepdims=True)
    artifact_ratio = float(np.mean(np.abs(centered) > np.maximum(6 * 1.4826 * scale, np.finfo(float).eps)))
    flat_ratio = float(np.mean(np.ptp(centered, axis=1) <= np.finfo(float).eps))
    n_fft = min(centered.shape[1], max(64, int(round(sfreq * 2))))
    psd, freqs = psd_array_welch(centered, sfreq=sfreq, fmin=1,
                                 fmax=min(sfreq / 2 - 1e-6, max(45, line_hz + 2)),
                                 n_fft=n_fft, n_per_seg=n_fft, verbose=False)
    total = np.trapz(psd, freqs, axis=1)
    line_mask = np.abs(freqs - line_hz) <= 1.0
    line_power = np.trapz(psd[:, line_mask], freqs[line_mask], axis=1) if np.count_nonzero(line_mask) > 1 else np.zeros(len(data))
    line_ratio = float(np.median(np.divide(line_power, total, out=np.zeros_like(total), where=total > 0)))
    score = float(np.clip(100 - artifact_ratio * 250 - flat_ratio * 100 - min(line_ratio, 0.2) * 250, 0, 100))
    return {"score": finite(score), "artifact_sample_ratio": finite(artifact_ratio),
            "flat_channel_ratio": finite(flat_ratio), "line_noise_ratio": finite(line_ratio)}


def choose_line_frequency(data: np.ndarray, sfreq: float, metadata_value: float | None):
    """优先信任合法元数据；否则比较 50/60 Hz 附近功率并自动选择。"""
    nyquist = sfreq / 2
    if metadata_value and 0 < metadata_value < nyquist:
        return float(metadata_value), "file metadata"
    candidates = [frequency for frequency in (50.0, 60.0) if frequency < nyquist * 0.95]
    if not candidates:
        return 0.0, "sampling rate too low for 50/60 Hz notch"
    n_fft = min(data.shape[1], max(64, int(round(sfreq * 4))))
    psd, freqs = psd_array_welch(data, sfreq=sfreq, fmin=max(1, min(candidates) - 2),
                                 fmax=min(nyquist - 1e-6, max(candidates) + 2),
                                 n_fft=n_fft, n_per_seg=n_fft, verbose=False)
    powers = []
    for frequency in candidates:
        mask = np.abs(freqs - frequency) <= 1
        powers.append(float(np.mean(psd[:, mask])) if np.any(mask) else 0.0)
    return candidates[int(np.argmax(powers))], "stronger 50/60 Hz spectral peak"


def eeg_analysis(raw, start: int, stop: int, sfreq: float, profile: str,
                 left_channel: str | None, right_channel: str | None,
                 highpass_hz: float, lowpass_hz: float, notch_hz: float):
    picks = mne.pick_types(raw.info, eeg=True, meg=False, fnirs=False, exclude=[])
    if not len(picks):
        raise ValueError("dataset has no EEG channels")
    validate_size(stop - start, len(picks), sfreq)
    raw_data = raw.get_data(picks=picks, start=start, stop=stop)
    names = [raw.ch_names[index] for index in picks]
    demeaned = raw_data - np.mean(raw_data, axis=1, keepdims=True)

    # EEG 的实际预处理链：去直流 -> 工频陷波 -> IIR 带通。IIR 对 Agent
    # 选择的短时间窗更稳定，不会像长 FIR 那样要求很长的边缘填充数据。
    nyquist = sfreq / 2.0
    effective_lowpass = min(lowpass_hz, nyquist * 0.95)
    if highpass_hz <= 0 or effective_lowpass <= highpass_hz:
        raise ValueError("EEG filter requires 0 < highpass_hz < lowpass_hz < Nyquist")
    if highpass_hz >= 8.0 or effective_lowpass <= 13.0:
        raise ValueError("EEG IAF/asymmetry analysis requires a passband that contains 8-13 Hz")
    effective_notch = notch_hz
    if effective_notch == 0:
        effective_notch = float(raw.info.get("line_freq") or 50.0)
    # 低采样率记录可能无法表示 50/60 Hz。此时跳过陷波，不能为了满足默认值
    # 使用等于或超过 Nyquist 的频率；带通与频谱指标仍可继续执行。
    if effective_notch <= 0 or effective_notch >= nyquist:
        effective_notch = None
        data = demeaned.copy()
    else:
        data = notch_filter(demeaned, Fs=sfreq, freqs=[effective_notch], method="iir", verbose=False)
    data = filter_data(data, sfreq=sfreq, l_freq=highpass_hz, h_freq=effective_lowpass,
                       method="iir", verbose=False)

    fmax = min(45.0, effective_lowpass, sfreq / 2.0 - 1e-6)
    if fmax <= 1.0:
        raise ValueError("sampling rate is too low for EEG spectral analysis")
    n_fft = min(data.shape[1], max(64, int(round(sfreq * 4))))
    psd, freqs = psd_array_welch(data, sfreq=sfreq, fmin=1.0, fmax=fmax,
                                 n_fft=n_fft, n_per_seg=n_fft, average="median", verbose=False)
    total = np.trapz(psd, freqs, axis=1)
    relative = {}
    absolute = {}
    analyzed_bands = {name: [low, min(high, fmax)] for name, (low, high) in BANDS.items() if fmax > low}
    for name, (low, high) in analyzed_bands.items():
        mask = (freqs >= low) & (freqs < min(high, fmax + 1e-9))
        power = np.trapz(psd[:, mask], freqs[mask], axis=1) if np.count_nonzero(mask) > 1 else np.zeros(len(picks))
        absolute[name] = [finite(v) for v in power]
        relative[name] = [finite(v) for v in np.divide(power, total, out=np.zeros_like(power), where=total > 0)]

    alpha_mask = (freqs >= 8.0) & (freqs <= min(13.0, fmax))
    iaf_values = []
    for channel_psd in psd:
        iaf_values.append(finite(freqs[alpha_mask][np.argmax(channel_psd[alpha_mask])]) if np.any(alpha_mask) else None)
    pair = None
    if left_channel and right_channel:
        if left_channel not in names or right_channel not in names:
            raise ValueError("requested asymmetry channels are not present in the EEG dataset")
        pair = (names.index(left_channel), names.index(right_channel))
    else:
        # 只自动选择有明确左右语义的标准 10-20 配对，绝不把任意前两个通道
        # 假设成左右半球。
        for left_name, right_name in (("Fp1", "Fp2"), ("F3", "F4"), ("C3", "C4"), ("P3", "P4"), ("O1", "O2")):
            if left_name in names and right_name in names:
                pair = (names.index(left_name), names.index(right_name))
                break
    asymmetry = None
    if pair:
        left, right = np.asarray([absolute["alpha"][pair[0]], absolute["alpha"][pair[1]]], dtype=float)
        asymmetry = finite(np.log(max(right, 1e-30)) - np.log(max(left, 1e-30)))

    result = {
        "channel_names": names,
        "preprocessing": {
            "dc_removed": True,
            "notch_hz": effective_notch,
            "bandpass_hz": [highpass_hz, effective_lowpass],
            "method": "zero-phase IIR via MNE-Python",
        },
        "frequency_bands_hz": analyzed_bands,
        "relative_band_power": relative,
        "iaf_hz": {"per_channel": iaf_values, "mean": finite(np.nanmean(iaf_values))},
        "alpha_log_power_asymmetry": {"pair": [names[pair[0]], names[pair[1]]], "right_minus_left": asymmetry} if asymmetry is not None else None,
    }
    if profile in {"quality", "full"}:
        # 质量判断读取去直流但尚未滤波的数据，避免滤波把原始饱和、平坦或
        # 高频污染隐藏掉；频谱与 IAF 则使用上面的已滤波数据。
        median = np.median(demeaned, axis=1, keepdims=True)
        mad = np.median(np.abs(demeaned - median), axis=1, keepdims=True)
        robust_z = np.abs(demeaned - median) / np.maximum(1.4826 * mad, np.finfo(float).eps)
        peak_to_peak = np.ptp(demeaned, axis=1)
        variances = np.var(demeaned, axis=1)
        variance_median = np.median(variances)
        flat = peak_to_peak <= np.finfo(float).eps
        noisy = variances > max(variance_median * 10.0, np.finfo(float).eps)
        result["quality"] = {
            "artifact_sample_ratio": finite(np.mean(robust_z > 6.0)),
            "flat_channels": [names[i] for i in np.flatnonzero(flat)],
            "high_variance_channels": [names[i] for i in np.flatnonzero(noisy)],
            "already_marked_bad_channels": list(raw.info.get("bads", [])),
            "method": "median absolute deviation threshold and channel variance screening",
        }
    # 同时返回去直流后的原始片段和预处理结果。二者只会在 main 中被抽稀后发给界面，
    # 完整数组不会进入 HTTP 响应，更不会进入大模型上下文。
    return result, demeaned, data, mne.pick_info(raw.info, picks, copy=True)


def eeg_auto_analysis(raw, start: int, stop: int, sfreq: float, profile: str,
                      left_channel: str | None, right_channel: str | None,
                      highpass_hz: float, lowpass_hz: float, notch_hz: float,
                      enabled_steps: set[str] | None = None,
                      resample_hz: float = 0.0, epoch_tmin: float = -0.2,
                      epoch_tmax: float = 0.8, baseline_start: float = -0.2,
                      baseline_end: float = 0.0, epoch_reject_uv: float = 0.0):
    """执行可审计的 EEG 自动预处理，并在单个步骤失败时安全降级。"""
    picks = mne.pick_types(raw.info, eeg=True, meg=False, fnirs=False, exclude=[])
    if not len(picks):
        raise ValueError("dataset has no EEG channels")
    validate_size(stop - start, len(picks), sfreq)
    names = [raw.ch_names[index] for index in picks]
    original = raw.get_data(picks=picks, start=start, stop=stop)
    demeaned = original - np.mean(original, axis=1, keepdims=True)
    if demeaned.shape[1] < max(32, int(sfreq)):
        raise ValueError("EEG automatic preprocessing requires at least one second of data")

    audit = []
    plan = []
    enabled = enabled_steps or {
        "bad_channel_detection", "bad_channel_interpolation", "notch_filter",
        "bandpass_filter", "reference_selection", "ica_artifact_removal",
        "resample", "epoching", "baseline", "autoreject",
    }
    def record(step, status, detail, attempt=1):
        entry = {"step": step, "status": status, "detail": detail, "attempt": attempt}
        audit.append(entry); plan.append(entry.copy())

    nyquist = sfreq / 2
    requested_high = highpass_hz if highpass_hz > 0 else 1.0
    requested_low = lowpass_hz if lowpass_hz > 0 else 45.0
    effective_high = max(0.1, requested_high)
    effective_low = min(requested_low, nyquist * 0.90)
    if effective_high >= effective_low:
        effective_high = max(0.1, min(1.0, effective_low / 4))
        record("parameter_selection", "adjusted", f"passband adjusted to {effective_high:g}-{effective_low:g} Hz for Nyquist")
    else:
        record("parameter_selection", "completed", f"passband {effective_high:g}-{effective_low:g} Hz")

    selected_notch, notch_reason = choose_line_frequency(demeaned, sfreq, notch_hz or raw.info.get("line_freq"))
    if notch_hz > 0 and notch_hz < nyquist:
        selected_notch, notch_reason = notch_hz, "requested by user"
    record("line_frequency_selection", "completed" if selected_notch else "skipped",
           f"{selected_notch:g} Hz ({notch_reason})" if selected_notch else notch_reason)

    before_quality = signal_quality(demeaned, sfreq, selected_notch or min(50, nyquist * .8))
    record("quality_assessment_before", "completed", f"score={before_quality['score']}")

    # 用户没有指定低通时，检查 30 Hz 以上功率占比。只有污染非常明显才把
    # 自动低通从 45 Hz 收紧到 30 Hz，且把这一数据驱动决策写入审计记录。
    if lowpass_hz <= 0 and nyquist > 35:
        n_fft = min(demeaned.shape[1], max(64, int(round(sfreq * 4))))
        adaptive_psd, adaptive_freqs = psd_array_welch(
            demeaned, sfreq=sfreq, fmin=1, fmax=min(45, nyquist - 1e-6),
            n_fft=n_fft, n_per_seg=n_fft, verbose=False)
        all_power = np.trapz(adaptive_psd, adaptive_freqs, axis=1)
        high_mask = adaptive_freqs >= 30
        high_power = np.trapz(adaptive_psd[:, high_mask], adaptive_freqs[high_mask], axis=1)
        high_ratio = float(np.median(np.divide(high_power, all_power, out=np.zeros_like(all_power), where=all_power > 0)))
        if high_ratio > 0.25:
            effective_low = min(effective_low, 30.0)
            record("parameter_adaptation", "adjusted", f"high-frequency power ratio {high_ratio:.3f}; low-pass reduced to {effective_low:g} Hz")
        else:
            record("parameter_adaptation", "completed", f"high-frequency power ratio {high_ratio:.3f}; retained {effective_low:g} Hz low-pass")

    peak_to_peak = np.ptp(demeaned, axis=1)
    variances = np.var(demeaned, axis=1)
    flat = peak_to_peak <= max(np.finfo(float).eps, np.median(peak_to_peak) * 1e-4)
    noisy = robust_outlier_mask(np.log10(np.maximum(variances, np.finfo(float).eps)))
    correlations = np.ones(len(picks))
    if len(picks) > 2 and np.any(np.std(demeaned, axis=1) > 0):
        correlation_matrix = np.corrcoef(demeaned)
        correlations = np.nanmedian(np.abs(correlation_matrix - np.eye(len(picks))), axis=1)
    low_correlation = correlations < 0.15
    candidates = np.flatnonzero((noisy | low_correlation) & ~flat)
    max_bad = max(1, int(math.floor(len(picks) * .20)))
    ranked = sorted(candidates, key=lambda index: (bool(flat[index]), bool(noisy[index]), -correlations[index]), reverse=True)
    # 平坦通道没有可用信号，必须全部标记；对噪声/低相关判据则限制到 20%，
    # 防止参考错误或特殊范式导致大面积误判。
    bad_indices = sorted(set(np.flatnonzero(flat).tolist() + ranked[:max_bad])) if "bad_channel_detection" in enabled else []
    bad_names = [names[index] for index in bad_indices]
    record("bad_channel_detection", "completed" if "bad_channel_detection" in enabled else "skipped", f"detected {len(bad_names)}: {', '.join(bad_names) or 'none'}" if "bad_channel_detection" in enabled else "disabled by pipeline")

    info = mne.pick_info(raw.info, picks, copy=True)
    working = mne.io.RawArray(demeaned.copy(), info, verbose=False)
    # RawArray 不会自动继承原始文件的 annotations。事件分段依赖这些标记，因此把落在
    # 当前分析时间窗中的标注平移到局部时间轴；持续时间和描述保持原样。
    window_start = start / sfreq
    window_end = stop / sfreq
    annotation_onsets, annotation_durations, annotation_descriptions = [], [], []
    for onset, duration_value, description in zip(raw.annotations.onset,
                                                  raw.annotations.duration,
                                                  raw.annotations.description):
        if onset + duration_value >= window_start and onset < window_end:
            annotation_onsets.append(max(0.0, float(onset) - window_start))
            annotation_durations.append(float(duration_value))
            annotation_descriptions.append(str(description))
    if annotation_onsets:
        working.set_annotations(mne.Annotations(annotation_onsets, annotation_durations,
                                                annotation_descriptions,
                                                orig_time=working.info.get("meas_date")))
    working.info["bads"] = bad_names
    interpolation = {"requested": bool(bad_names), "performed": False, "channels": bad_names}
    if bad_names and "bad_channel_interpolation" in enabled:
        try:
            # interpolate_bads 需要 montage/digitization；缺失坐标时保留 bad 标记并继续处理。
            working.interpolate_bads(reset_bads=True, mode="accurate", verbose=False)
            interpolation["performed"] = True
            record("bad_channel_interpolation", "completed", f"interpolated {len(bad_names)} channels")
        except Exception as error:
            interpolation["reason"] = str(error)
            record("bad_channel_interpolation", "degraded", f"retry without interpolation; kept bad-channel marks: {error}", 2)
    else:
        reason = "disabled by pipeline" if "bad_channel_interpolation" not in enabled else "no bad channels detected"
        record("bad_channel_interpolation", "skipped", reason)

    if selected_notch and "notch_filter" in enabled:
        working.notch_filter([selected_notch], method="iir", verbose=False)
        record("notch_filter", "completed", f"{selected_notch:g} Hz IIR")
    elif "notch_filter" not in enabled:
        record("notch_filter", "skipped", "disabled by pipeline")
    else:
        record("notch_filter", "skipped", "no valid line-frequency peak selected")
    if "bandpass_filter" in enabled:
        working.filter(effective_high, effective_low, method="iir", verbose=False)
        record("bandpass_filter", "completed", f"{effective_high:g}-{effective_low:g} Hz IIR")
    else:
        record("bandpass_filter", "skipped", "disabled by pipeline")

    # 平均参考适用于大多数无专用参考电极的多通道 EEG；通道太少时保持原参考。
    reference = "unchanged"
    if "reference_selection" in enabled and len(picks) - len(bad_names) >= 3:
        working.set_eeg_reference("average", projection=False, verbose=False)
        reference = "average"
        record("reference_selection", "completed", "average reference selected because at least 3 usable EEG channels are available")
    else:
        reason = "disabled by pipeline" if "reference_selection" not in enabled else "fewer than 3 usable EEG channels"
        record("reference_selection", "skipped", reason)

    ica_report = {"performed": False, "excluded_components": [], "method": "FastICA conservative automatic screening"}
    duration = working.n_times / sfreq
    usable_count = len(picks) - len(bad_names)
    if "ica_artifact_removal" in enabled and profile == "full" and duration >= 20 and usable_count >= 4 and np.any(np.var(working.get_data(), axis=1) > np.finfo(float).eps):
        try:
            n_components = min(20, usable_count - 1)
            ica = mne.preprocessing.ICA(n_components=n_components, method="fastica", random_state=97, max_iter=500)
            ica.fit(working, picks="eeg", reject_by_annotation=True, verbose=False)
            sources = ica.get_sources(working).get_data()
            component_kurtosis = np.abs(kurtosis(sources, axis=1, fisher=False, nan_policy="omit"))
            exclusions = set(np.flatnonzero(component_kurtosis > 12).tolist())
            eog_picks = mne.pick_types(raw.info, eeg=False, eog=True, meg=False, exclude=[])
            eog_scores = []
            if len(eog_picks):
                eog = raw.get_data(picks=eog_picks, start=start, stop=stop)
                for component in sources:
                    eog_scores.append(max(abs(np.corrcoef(component, channel)[0, 1]) for channel in eog))
                exclusions.update(np.flatnonzero(np.asarray(eog_scores) > 0.35).tolist())
            limit = max(1, min(3, int(math.ceil(n_components * .15))))
            chosen = sorted(exclusions, key=lambda index: component_kurtosis[index], reverse=True)[:limit]
            ica.exclude = chosen
            if chosen:
                ica.apply(working, verbose=False)
            ica_report.update({"performed": True, "component_count": n_components,
                               "excluded_components": chosen,
                               "kurtosis": [finite(value) for value in component_kurtosis],
                               "eog_correlation": [finite(value) for value in eog_scores]})
            record("ica_artifact_removal", "completed", f"excluded {len(chosen)} of {n_components} components")
        except Exception as error:
            ica_report["reason"] = str(error)
            record("ica_artifact_removal", "degraded", f"retry without ICA; retained filtered and referenced data: {error}", 2)
    else:
        reason = "disabled by pipeline" if "ica_artifact_removal" not in enabled else ("full profile required" if profile != "full" else "requires >=20 s, >=4 usable channels, and non-flat data")
        ica_report["reason"] = reason
        record("ica_artifact_removal", "skipped", reason)

    # MNE Raw.resample 同时重采样数据和 annotations。它放在滤波与 ICA 之后，避免先降采样
    # 造成混叠，也让后续 Epochs 使用更新后的采样率。目标频率不得高于原采样率。
    original_sfreq = float(working.info["sfreq"])
    if "resample" in enabled:
        target_sfreq = resample_hz if resample_hz > 0 else min(250.0, original_sfreq)
        if target_sfreq < original_sfreq:
            working.resample(target_sfreq, npad="auto", verbose=False)
            record("resample", "completed", f"{original_sfreq:g} Hz -> {target_sfreq:g} Hz using MNE Raw.resample")
        elif math.isclose(target_sfreq, original_sfreq):
            record("resample", "skipped", "target sampling rate equals the input sampling rate")
        else:
            record("resample", "skipped", "target sampling rate is above the input rate; upsampling was not performed")
    else:
        record("resample", "skipped", "disabled by pipeline")

    processed_sfreq = float(working.info["sfreq"])
    epochs = None
    epoch_report = {"performed": False, "event_count": 0, "retained_epochs": 0}
    needs_epochs = bool({"epoching", "baseline", "autoreject"}.intersection(enabled))
    if needs_epochs:
        # 基线或 Epoch 拒绝本身不能脱离 Epochs 工作；用户只启用下游步骤时自动补上
        # event segmentation，并在审计记录中留下依赖激活说明。
        if "epoching" not in enabled:
            record("epoching_dependency", "adjusted", "epoching enabled because baseline/autoreject requires Epochs")
        if epoch_tmin >= epoch_tmax:
            raise ValueError("epoch_tmin must be smaller than epoch_tmax")
        try:
            events, event_id = mne.events_from_annotations(working, verbose=False)
            event_source = "annotations"
            if not len(events):
                events = mne.find_events(working, shortest_event=1, verbose=False)
                event_id = None
                event_source = "stim channel"
        except (ValueError, RuntimeError):
            events, event_id, event_source = np.empty((0, 3), dtype=int), None, "none"
        if len(events):
            duplicate_event_count = int(len(events) - len(np.unique(events[:, 0])))
            epochs = mne.Epochs(working, events, event_id=event_id, tmin=epoch_tmin,
                                tmax=epoch_tmax, baseline=None, preload=True,
                                reject_by_annotation=True, event_repeated="merge",
                                on_missing="warn", verbose=False)
            epoch_report.update({"performed": True, "event_source": event_source,
                                 "event_count": int(len(events)),
                                 "duplicate_event_count": duplicate_event_count,
                                 "retained_epochs": int(len(epochs)),
                                 "tmin_seconds": epoch_tmin, "tmax_seconds": epoch_tmax,
                                 "event_id": event_id or {}})
            detail = f"created {len(epochs)} epochs from {len(events)} {event_source} events"
            if duplicate_event_count:
                detail += f"; merged {duplicate_event_count} events sharing sample indices"
            record("epoching", "completed", detail)
        else:
            epoch_report["reason"] = "no annotations or stim-channel events were found"
            record("epoching", "skipped", epoch_report["reason"])
    else:
        record("epoching", "skipped", "disabled by pipeline")

    if "baseline" in enabled and epochs is not None and len(epochs):
        baseline = (baseline_start, baseline_end)
        if baseline_start > baseline_end or baseline_start < epoch_tmin or baseline_end > epoch_tmax:
            raise ValueError("baseline interval must be ordered and contained within the epoch interval")
        epochs.apply_baseline(baseline, verbose=False)
        epoch_report["baseline_seconds"] = [baseline_start, baseline_end]
        record("baseline", "completed", f"MNE Epochs.apply_baseline interval [{baseline_start:g}, {baseline_end:g}] s")
    else:
        reason = "disabled by pipeline" if "baseline" not in enabled else "no usable epochs"
        record("baseline", "skipped", reason)

    if "autoreject" in enabled and epochs is not None and len(epochs):
        # 使用每个 epoch、每个 EEG 通道的峰峰值构造稳健阈值，然后交给 MNE
        # Epochs.drop_bad 执行实际拒绝。用户给定 μV 阈值时优先使用该确定值。
        peak_to_peak_epochs = np.ptp(epochs.get_data(copy=False), axis=2)
        robust_limit = np.median(peak_to_peak_epochs) + 6.0 * 1.4826 * np.median(
            np.abs(peak_to_peak_epochs - np.median(peak_to_peak_epochs)))
        reject_volts = epoch_reject_uv * 1e-6 if epoch_reject_uv > 0 else float(robust_limit)
        if not np.isfinite(reject_volts) or reject_volts <= 0:
            reject_volts = 150e-6
        before_drop = len(epochs)
        epochs.drop_bad(reject={"eeg": reject_volts}, verbose=False)
        rejected = before_drop - len(epochs)
        epoch_report.update({"rejection_threshold_uv": finite(reject_volts * 1e6),
                             "rejected_epochs": int(rejected),
                             "retained_epochs": int(len(epochs))})
        record("autoreject", "completed", f"MNE Epochs.drop_bad rejected {rejected}/{before_drop} epochs at {reject_volts * 1e6:.2f} uV")
    else:
        reason = "disabled by pipeline" if "autoreject" not in enabled else "no usable epochs"
        record("autoreject", "skipped", reason)

    processed = working.get_data()
    after_quality = signal_quality(processed, processed_sfreq,
                                   selected_notch or min(50, processed_sfreq * .4))
    delta = (after_quality["score"] or 0) - (before_quality["score"] or 0)
    record("quality_assessment_after", "completed", f"score={after_quality['score']}, change={delta:+.2f}")

    # 复用已验证的频谱指标实现，避免自动流程与分析指标使用两套定义。
    metric_result, _, _, _ = eeg_analysis(raw, start, stop, sfreq, profile,
                                           left_channel, right_channel,
                                           effective_high, effective_low, selected_notch)
    metric_result.update({
        "mode": "automatic",
        "preprocessing": {"dc_removed": True, "notch_hz": selected_notch or None,
                          "bandpass_hz": [effective_high, effective_low], "reference": reference,
                          "bad_channel_interpolation": interpolation, "ica": ica_report,
                          "resample": {"input_hz": original_sfreq, "output_hz": processed_sfreq},
                          "epochs": epoch_report},
        "quality_comparison": {"before": before_quality, "after": after_quality,
                               "score_change": finite(delta), "improved": delta >= 0},
        "execution_plan": plan,
        "audit_log": audit,
        "warnings": [entry["detail"] for entry in audit if entry["status"] == "degraded"],
    })
    return metric_result, demeaned, processed, working.info, processed_sfreq, epochs


def fnirs_analysis(raw, start: int, stop: int, sfreq: float, profile: str):
    from mne.preprocessing.nirs import (beer_lambert_law, optical_density,
                                        scalp_coupling_index,
                                        temporal_derivative_distribution_repair)

    fnirs_picks = mne.pick_types(raw.info, eeg=False, meg=False, fnirs=True, exclude=[])
    if not len(fnirs_picks):
        raise ValueError("dataset has no fNIRS channels")
    validate_size(stop - start, len(fnirs_picks), sfreq)
    segment = raw.copy().crop(tmin=start / sfreq, tmax=(stop - 1) / sfreq).load_data()
    channel_types = set(segment.get_channel_types())
    quality = None

    if "fnirs_cw_amplitude" in channel_types:
        if profile in {"quality", "full"}:
            sci = scalp_coupling_index(segment.copy())
            quality = {
                "scalp_coupling_index": [finite(v) for v in sci],
                "low_coupling_channels": [segment.ch_names[i] for i, value in enumerate(sci) if value < 0.5],
                "threshold": 0.5,
            }
        processed = optical_density(segment)
        if profile in {"quality", "full"}:
            processed = temporal_derivative_distribution_repair(processed)
        processed = beer_lambert_law(processed)
    elif channel_types.intersection({"hbo", "hbr"}):
        processed = segment.copy()
    else:
        raise ValueError(f"unsupported fNIRS channel types: {sorted(channel_types)}")

    # 0.01–0.2 Hz 是静息态/慢血流动力学分析的常用起点；调用结果明确返回该参数，
    # 研究者仍需根据范式、任务频率和设备规格确认。
    high = min(0.2, sfreq / 2.0 - 1e-6)
    if high <= 0.01:
        raise ValueError("sampling rate is too low for fNIRS filtering")
    processed.filter(0.01, high, method="iir", verbose=False)
    result = {"filter_hz": [0.01, high], "quality": quality, "chromophores": {}}
    for chromophore in ("hbo", "hbr"):
        picks = mne.pick_types(processed.info, eeg=False, meg=False, fnirs=[chromophore], exclude=[])
        if not len(picks):
            continue
        values = processed.get_data(picks=picks)
        time = np.arange(values.shape[1], dtype=float) / sfreq
        slopes = [finite(np.polyfit(time, channel, 1)[0]) if len(time) > 1 else None for channel in values]
        result["chromophores"][chromophore] = {
            "channel_names": [processed.ch_names[index] for index in picks],
            "mean": [finite(v) for v in np.mean(values, axis=1)],
            "standard_deviation": [finite(v) for v in np.std(values, axis=1)],
            "slope_per_second": slopes,
        }
    result["limitations"] = [
        "VFT metrics require explicit baseline/task event intervals and are not inferred automatically.",
        "Heart rate and HRV require a validated pulse-signal input and are not computed from low-rate Hb output.",
    ]
    return result, segment, processed


def build_preview(data: np.ndarray, names: list[str], sfreq: float, unit: str):
    """生成供 Electron 绘图的小型真实波形，不返回整段文件内容。"""
    data = np.asarray(data[:8], dtype=float)
    step = max(1, math.ceil(data.shape[1] / 1200))
    preview = data[:, ::step]
    return {
        "channel_names": names[:8],
        "sample_rate_hz": sfreq / step,
        "original_sample_rate_hz": sfreq,
        "downsample_factor": step,
        "unit": unit,
        "data": preview.tolist(),
    }


def main() -> int:
    # Windows 中文环境常把标准输出设为 GBK，而 JSON 中包含 µV/µM。
    # 强制 UTF-8，确保 Go 可以稳定解析不同系统上的分析结果。
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser()
    parser.add_argument("source")
    parser.add_argument("modality", choices=["EEG", "fNIRS"])
    parser.add_argument("profile", choices=["summary", "quality", "full"])
    parser.add_argument("--start", type=float, default=0.0)
    parser.add_argument("--end", type=float, default=0.0)
    parser.add_argument("--left-channel")
    parser.add_argument("--right-channel")
    parser.add_argument("--highpass-hz", type=float, default=1.0)
    parser.add_argument("--lowpass-hz", type=float, default=45.0)
    parser.add_argument("--notch-hz", type=float, default=0.0,
                        help="0 uses the file line frequency or 50 Hz")
    parser.add_argument("--resample-hz", type=float, default=0.0,
                        help="0 selects a safe default no higher than 250 Hz")
    parser.add_argument("--epoch-tmin", type=float, default=-0.2)
    parser.add_argument("--epoch-tmax", type=float, default=0.8)
    parser.add_argument("--baseline-start", type=float, default=-0.2)
    parser.add_argument("--baseline-end", type=float, default=0.0)
    parser.add_argument("--epoch-reject-uv", type=float, default=0.0,
                        help="0 derives a robust threshold from epoch peak-to-peak amplitudes")
    parser.add_argument("--steps", help="comma-separated executable EEG pipeline step IDs")
    parser.add_argument("--output", help="optional path for the processed FIF file")
    args = parser.parse_args()
    try:
        raw = load_raw(Path(args.source).resolve())
        start, stop, sfreq = select_range(raw, args.start, args.end)
        if args.modality == "EEG":
            selected_steps = {item.strip() for item in (args.steps or "").split(",") if item.strip()} or None
            result, raw_data, processed_data, processed_info, processed_sfreq, processed_epochs = eeg_auto_analysis(
                raw, start, stop, sfreq, args.profile, args.left_channel,
                args.right_channel, args.highpass_hz, args.lowpass_hz, args.notch_hz,
                selected_steps, args.resample_hz, args.epoch_tmin, args.epoch_tmax,
                args.baseline_start, args.baseline_end, args.epoch_reject_uv)
            preview = {
                "raw": build_preview(raw_data * 1e6, result["channel_names"], sfreq, "µV"),
                "processed": build_preview(processed_data * 1e6, result["channel_names"], processed_sfreq, "µV"),
            }
            processed_raw = mne.io.RawArray(processed_data, processed_info, verbose=False)
        else:
            result, raw_segment, processed_raw = fnirs_analysis(raw, start, stop, sfreq, args.profile)
            preview_picks = mne.pick_types(processed_raw.info, eeg=False, meg=False,
                                           fnirs=["hbo", "hbr"], exclude=[])
            preview_names = [processed_raw.ch_names[index] for index in preview_picks]
            # 原始 fNIRS 可能是光强、光密度或 Hb 浓度，单位不能一概而论；界面据实标成 a.u.。
            raw_picks = mne.pick_types(raw_segment.info, eeg=False, meg=False, fnirs=True, exclude=[])
            preview = {
                "raw": build_preview(raw_segment.get_data(picks=raw_picks),
                                     [raw_segment.ch_names[index] for index in raw_picks], sfreq, "a.u."),
                "processed": build_preview(processed_raw.get_data(picks=preview_picks) * 1e6,
                                           preview_names, sfreq, "µM"),
            }

        # 即使不落盘也明确返回 saved=false，调用方无需用 null 猜测执行结果。
        output = {"saved": False}
        if args.output:
            output_path = Path(args.output).resolve()
            output_path.parent.mkdir(parents=True, exist_ok=True)
            processed_raw.save(str(output_path), overwrite=True, verbose=False)
            output = {"saved": True, "file_name": output_path.name, "format": "FIF"}
            # 连续结果用于 Electron 的完整时间轴浏览；Epochs 另存为标准 -epo.fif，
            # 这样事件、基线设置和 drop_log 都不会在保存时丢失。
            if args.modality == "EEG" and processed_epochs is not None and len(processed_epochs):
                epochs_path = output_path.with_name(output_path.stem.replace("_raw", "") + "-epo.fif")
                processed_epochs.save(str(epochs_path), overwrite=True, verbose=False)
                output["epochs_file_name"] = epochs_path.name
        payload = {
            "ok": True, "engine": "NeuroFlow Python/MNE", "modality": args.modality,
            "analysis_type": args.profile,
            "sampling_rate_hz": processed_sfreq if args.modality == "EEG" else sfreq,
            "selection": {"start_seconds": start / sfreq, "end_seconds": stop / sfreq, "sample_count": stop - start},
            "result": result, "preview": preview, "output": output,
        }
        if args.output and args.modality == "EEG":
            # 审计报告与 FIF 同目录保存，包含参数、每步状态、降级原因和质量比较；
            # preview 数组不写入报告，避免报告文件被波形数据撑大。
            report_path = Path(args.output).resolve().with_suffix(".audit.json")
            report_payload = {key: value for key, value in payload.items() if key != "preview"}
            report_path.write_text(json.dumps(report_payload, ensure_ascii=False, indent=2,
                                              allow_nan=False, default=json_default), encoding="utf-8")
            output["audit_file_name"] = report_path.name
        print(json.dumps(payload, ensure_ascii=False, allow_nan=False, default=json_default))
        return 0
    except Exception as error:
        print(json.dumps({"ok": False, "code": "ANALYSIS_FAILED", "message": str(error)}, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
