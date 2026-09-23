"""Auditable 30-second sleep-stage candidates built on MNE signals.

The detectors below cover several AASM-relevant observations, but they do not
constitute a clinically validated AASM scorer. Every result remains a candidate
that must be reviewed against the displayed waveform by a trained person.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import mne
import numpy as np
from scipy.signal import butter, find_peaks, hilbert, sosfiltfilt, welch

from analyze_dataset import load_raw
from import_review import apply_config


STAGES = ("W", "N1", "N2", "N3", "REM")


def band_power(frequencies, spectrum, low, high):
    mask = (frequencies >= low) & (frequencies < high)
    return float(np.mean(spectrum[..., mask])) if np.any(mask) else 0.0


def robust_scale(values):
    """Return median and a MAD-derived standard-deviation estimate."""
    values = np.asarray(values, dtype=float)
    median = float(np.nanmedian(values))
    scale = float(1.4826 * np.nanmedian(np.abs(values - median)))
    return median, max(scale, np.finfo(float).eps)


def filtered(values, sfreq, low=None, high=None, order=4):
    """Apply a zero-phase Butterworth filter while respecting Nyquist."""
    values = np.nan_to_num(np.asarray(values, dtype=float), copy=True)
    nyquist = sfreq / 2.0
    if low is not None and high is not None:
        high = min(high, nyquist * 0.95)
        if low >= high:
            return values
        sos = butter(order, [low, high], btype="bandpass", fs=sfreq, output="sos")
    elif high is not None:
        high = min(high, nyquist * 0.95)
        sos = butter(order, high, btype="lowpass", fs=sfreq, output="sos")
    else:
        low = min(low, nyquist * 0.95)
        sos = butter(order, low, btype="highpass", fs=sfreq, output="sos")
    try:
        return sosfiltfilt(sos, values, axis=-1)
    except ValueError:  # Very short final fragments cannot satisfy filter padding.
        return values


def count_runs(mask, sfreq, minimum_seconds, maximum_seconds=None):
    """Count contiguous True regions with physiologically plausible duration."""
    padded = np.pad(np.asarray(mask, dtype=np.int8), (1, 1))
    edges = np.flatnonzero(np.diff(padded))
    durations = (edges[1::2] - edges[::2]) / sfreq
    keep = durations >= minimum_seconds
    if maximum_seconds is not None:
        keep &= durations <= maximum_seconds
    return int(np.sum(keep))


def detect_spindles(eeg_v, sfreq):
    """Detect 11–16 Hz envelope bursts lasting 0.5–2 seconds."""
    sigma = filtered(eeg_v, sfreq, 11.0, 16.0)
    envelope = np.abs(hilbert(sigma, axis=-1))
    median, scale = robust_scale(envelope)
    # A mostly quiet synthetic or real channel can have MAD near machine
    # precision. The percentile floor prevents tiny filter tails from becoming
    # one long false event around an otherwise valid sigma burst.
    threshold = max(median + 2.5 * scale, float(np.nanpercentile(envelope, 99)) * 0.35)
    return sum(count_runs(channel > threshold, sfreq, 0.5, 2.0) for channel in envelope)


def detect_k_complexes(eeg_v, sfreq):
    """Detect large negative-to-positive slow deflections compatible with K complexes."""
    slow_uv = np.nanmedian(filtered(eeg_v, sfreq, 0.3, 4.0), axis=0) * 1e6
    negative, properties = find_peaks(-slow_uv, prominence=40.0, distance=max(1, int(0.5 * sfreq)))
    count = 0
    for peak, prominence in zip(negative, properties.get("prominences", [])):
        stop = min(len(slow_uv), peak + max(2, int(1.0 * sfreq)))
        positive = float(np.max(slow_uv[peak:stop])) if stop > peak else slow_uv[peak]
        # AASM morphology still requires visual review; amplitude and timing here
        # provide a reproducible candidate detector rather than a final decision.
        if prominence >= 40.0 and positive - slow_uv[peak] >= 75.0:
            count += 1
    return count


def detect_eye_movements(eog_v, sfreq):
    """Return slow and rapid eye-movement candidate counts from typed EOG channels."""
    if not len(eog_v):
        return None
    # Opposite-polarity left/right EOG improves ocular contrast. With one EOG,
    # use that channel but expose the reduced channel count in capabilities.
    ocular = eog_v[0] - eog_v[1] if len(eog_v) >= 2 else eog_v[0]
    ocular_uv = ocular * 1e6
    slow = filtered(ocular_uv, sfreq, 0.1, 1.0)
    slow_median, slow_scale = robust_scale(slow)
    slow_peaks, _ = find_peaks(np.abs(slow - slow_median), prominence=max(20.0, 3.0 * slow_scale), distance=max(1, int(1.0 * sfreq)))
    rapid = filtered(ocular_uv, sfreq, 0.5, 5.0)
    rapid_median, rapid_scale = robust_scale(rapid)
    rapid_peaks, _ = find_peaks(np.abs(rapid - rapid_median), prominence=max(15.0, 3.5 * rapid_scale), distance=max(1, int(0.25 * sfreq)))
    return {"slow_eye_movements": int(len(slow_peaks)), "rapid_eye_movements": int(len(rapid_peaks))}


def emg_features(emg_v, sfreq):
    """Measure chin-EMG tone and short high-frequency activation bursts."""
    if not len(emg_v):
        return None
    signal = filtered(emg_v, sfreq, 10.0, min(45.0, sfreq * 0.45))
    rms_uv = float(np.sqrt(np.nanmean(signal**2)) * 1e6)
    envelope_uv = np.sqrt(np.nanmean(signal**2, axis=0)) * 1e6
    median, scale = robust_scale(envelope_uv)
    bursts = count_runs(envelope_uv > median + 3.0 * scale, sfreq, 0.1, 5.0)
    return {"chin_emg_rms_uv": rms_uv, "chin_emg_bursts": bursts}


def detect_arousals(eeg_v, sfreq, emg_info=None):
    """Detect 3–15 s alpha/beta activation candidates, optionally supported by EMG."""
    activation = np.abs(hilbert(filtered(eeg_v, sfreq, 8.0, min(30.0, sfreq * 0.45)), axis=-1))
    envelope = np.nanmedian(activation, axis=0)
    median, scale = robust_scale(envelope)
    eeg_bursts = count_runs(envelope > median + 2.5 * scale, sfreq, 3.0, 15.0)
    emg_support = bool(emg_info and emg_info["chin_emg_bursts"] > 0)
    return {"micro_arousal_candidates": eeg_bursts, "emg_activation_support": emg_support}


def channel_capabilities(raw, eeg, eog, emg):
    """Describe which detectors can run and flag likely mistyped EOG/EMG names."""
    typed = set(eeg.tolist() + eog.tolist() + emg.tolist())
    untyped = []
    for index, name in enumerate(raw.ch_names):
        if index in typed:
            continue
        if re.search(r"(?:^|[-_ ])(?:EOG|LOC|ROC|LEOG|REOG|EMG|CHIN|MENTALIS|SUBMENTAL)(?:$|[-_ ])", name, re.I):
            untyped.append(name)
    available = {
        "spectral_bands": bool(len(eeg)), "sleep_spindles": bool(len(eeg)),
        "k_complexes": bool(len(eeg)), "micro_arousals": bool(len(eeg)),
        "slow_eye_movements": bool(len(eog)), "rapid_eye_movements": bool(len(eog)),
        "chin_emg_tone": bool(len(emg)),
    }
    missing = []
    if not len(eog):
        missing.append("EOG")
    if not len(emg):
        missing.append("EMG")
    return {
        "mode": "EEG+EOG+EMG" if len(eog) and len(emg) else "EEG+EOG" if len(eog) else "EEG+EMG" if len(emg) else "EEG_ONLY",
        "channels": {"eeg": [raw.ch_names[i] for i in eeg], "eog": [raw.ch_names[i] for i in eog], "emg": [raw.ch_names[i] for i in emg]},
        "detectors": available, "missing_modalities": missing, "untyped_channel_candidates": untyped,
    }


def choose_candidate(features, emg_baseline):
    """Combine spectral and event evidence into one conservative candidate."""
    ratios, events = features["ratios"], features["events"]
    artifact = not np.isfinite(features["peak_to_peak_uv"]) or features["peak_to_peak_uv"] > 500
    if artifact:
        return "W", 0.25, True, ["amplitude artifact threshold exceeded"]
    if ratios["delta"] >= 0.50:
        return "N3", min(0.92, 0.62 + ratios["delta"] / 3), False, ["high delta relative power"]
    if events["sleep_spindles"] > 0 or events["k_complexes"] > 0:
        evidence = []
        if events["sleep_spindles"]:
            evidence.append("sleep-spindle candidate")
        if events["k_complexes"]:
            evidence.append("K-complex candidate")
        return "N2", min(0.88, 0.66 + 0.04 * len(evidence)), False, evidence
    eye, emg = features["eye_movements"], features["emg"]
    low_emg = bool(emg and emg_baseline and emg["chin_emg_rms_uv"] <= emg_baseline * 0.75)
    if eye and eye["rapid_eye_movements"] > 0 and low_emg and ratios["alpha"] < 0.20:
        return "REM", 0.78, False, ["rapid-eye-movement candidate", "reduced chin EMG tone"]
    if ratios["alpha"] >= 0.25 or ratios["beta"] >= 0.22:
        return "W", 0.65, False, ["high alpha/beta relative power"]
    if eye and eye["slow_eye_movements"] > 0 and ratios["theta"] >= 0.25:
        return "N1", 0.64, False, ["slow-eye-movement candidate", "theta-dominant EEG"]
    if ratios["theta"] >= 0.36 and ratios["alpha"] < 0.20:
        return "N1", 0.54, False, ["theta-dominant EEG without EOG confirmation"]
    return "N2", 0.48, False, ["fallback candidate; no defining N2 event detected"]


def stage_recording(path):
    raw = apply_config(load_raw(path), path)
    sfreq = float(raw.info["sfreq"])
    eeg = np.asarray(mne.pick_types(raw.info, eeg=True, meg=False, exclude=[]))
    eog = np.asarray(mne.pick_types(raw.info, eeg=False, eog=True, meg=False, exclude=[]))
    emg = np.asarray(mne.pick_types(raw.info, eeg=False, eog=False, emg=True, meg=False, exclude=[]))
    if not len(eeg):
        raise ValueError("sleep staging requires at least one typed EEG channel")
    capabilities = channel_capabilities(raw, eeg, eog, emg)

    epoch_size = max(1, int(round(30 * sfreq)))
    epoch_count = int(np.ceil(raw.n_times / epoch_size))
    extracted = []
    for index in range(epoch_count):
        start, stop = index * epoch_size, min(raw.n_times, (index + 1) * epoch_size)
        eeg_data = np.nan_to_num(raw.get_data(picks=eeg, start=start, stop=stop))
        if eeg_data.shape[1] < max(2, int(sfreq * 5)):
            continue
        eog_data = raw.get_data(picks=eog, start=start, stop=stop) if len(eog) else np.empty((0, eeg_data.shape[1]))
        emg_data = raw.get_data(picks=emg, start=start, stop=stop) if len(emg) else np.empty((0, eeg_data.shape[1]))
        frequencies, spectrum = welch(eeg_data, fs=sfreq, nperseg=min(eeg_data.shape[1], max(64, int(sfreq * 4))), axis=-1)
        total = max(1e-20, band_power(frequencies, spectrum, 0.5, min(30, sfreq / 2)))
        bands = {"delta": (0.5, 4), "theta": (4, 8), "alpha": (8, 13), "beta": (13, 30)}
        ratios = {name: band_power(frequencies, spectrum, *limits) / total for name, limits in bands.items()}
        emg_info = emg_features(emg_data, sfreq)
        extracted.append({
            "epoch": index + 1, "onset_seconds": start / sfreq, "duration_seconds": (stop - start) / sfreq,
            "ratios": ratios, "peak_to_peak_uv": float(np.nanpercentile(np.ptp(eeg_data, axis=1) * 1e6, 75)),
            "eye_movements": detect_eye_movements(eog_data, sfreq), "emg": emg_info,
            "events": {
                "sleep_spindles": detect_spindles(eeg_data, sfreq),
                "k_complexes": detect_k_complexes(eeg_data, sfreq),
                **detect_arousals(eeg_data, sfreq, emg_info),
            },
        })

    emg_values = [item["emg"]["chin_emg_rms_uv"] for item in extracted if item["emg"]]
    emg_baseline = float(np.nanmedian(emg_values)) if emg_values else None
    epochs = []
    for item in extracted:
        stage, confidence, artifact, evidence = choose_candidate(item, emg_baseline)
        epochs.append({
            "epoch": item["epoch"], "onset_seconds": item["onset_seconds"], "duration_seconds": item["duration_seconds"],
            "stage": stage, "confidence": round(confidence, 3), "artifact": artifact, "evidence": evidence,
            "features": {
                **{key: round(value, 5) for key, value in item["ratios"].items()},
                "peak_to_peak_uv": round(item["peak_to_peak_uv"], 2),
                "eye_movements": item["eye_movements"], "chin_emg": item["emg"], "events": item["events"],
            },
        })

    return {
        "ok": True, "engine": "MNE + auditable multimodal sleep-event rules", "epoch_seconds": 30,
        "review_required": True,
        "limitations": ["not a clinically validated AASM scorer", "all detected events and stages require waveform review"],
        "channel_support": {"eeg": len(eeg), "eog": len(eog), "emg": len(emg)},
        "capabilities": capabilities,
        "counts": {stage: sum(item["stage"] == stage for item in epochs) for stage in STAGES},
        "event_counts": {
            "sleep_spindles": sum(item["features"]["events"]["sleep_spindles"] for item in epochs),
            "k_complexes": sum(item["features"]["events"]["k_complexes"] for item in epochs),
            "micro_arousal_candidates": sum(item["features"]["events"]["micro_arousal_candidates"] for item in epochs),
            "slow_eye_movements": sum((item["features"]["eye_movements"] or {}).get("slow_eye_movements", 0) for item in epochs),
            "rapid_eye_movements": sum((item["features"]["eye_movements"] or {}).get("rapid_eye_movements", 0) for item in epochs),
            "chin_emg_bursts": sum((item["features"]["chin_emg"] or {}).get("chin_emg_bursts", 0) for item in epochs),
        },
        "epochs": epochs,
    }


def main():
    try:
        print(json.dumps(stage_recording(Path(sys.argv[1]).resolve()), ensure_ascii=False, allow_nan=False))
        return 0
    except Exception as error:
        print(json.dumps({"ok": False, "message": str(error)}, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
