"""Deterministic MEG and event-related analyses used by NeuroFlow.

Every operation is bounded so an Agent cannot accidentally request an unbounded
time-frequency or cross-validation job on a large recording.
"""
from __future__ import annotations

import math
from pathlib import Path

import mne
import numpy as np


def optimize_eeg_filter(data, sfreq, requested_high, requested_low, line_hz, quality_fn, record):
    """Select one filter from a fixed grid using an explicit quality objective.

    Explicit user cutoffs are never searched. The score rewards the existing
    quality metric and penalizes RMS distortion, which prevents an arbitrarily
    narrow filter from winning merely because it suppresses more signal.
    """
    if requested_high > 0 or requested_low > 0:
        return requested_high if requested_high > 0 else 1.0, requested_low if requested_low > 0 else 45.0, []
    nyquist = sfreq / 2
    candidates, trials = [], []
    for high in (0.5, 1.0, 2.0):
        for low in (30.0, 40.0, 45.0):
            low = min(low, nyquist * .9)
            if high >= low:
                continue
            candidates.append((high, low))
    baseline_rms = max(float(np.sqrt(np.mean(data ** 2))), np.finfo(float).eps)
    for attempt, (high, low) in enumerate(candidates, 1):
        try:
            trial = mne.filter.filter_data(data, sfreq, high, low, method="iir", verbose=False)
            quality = quality_fn(trial, sfreq, line_hz)
            distortion = float(np.sqrt(np.mean((trial - data) ** 2)) / baseline_rms)
            objective = float(quality.get("score") or 0) - min(30.0, distortion * 8.0)
            trials.append({"highpass_hz": high, "lowpass_hz": low,
                           "quality_score": quality.get("score"),
                           "relative_rms_change": round(distortion, 6),
                           "objective": round(objective, 6)})
            record("filter_parameter_search", "candidate", f"{high:g}-{low:g} Hz objective={objective:.3f}", attempt)
        except Exception as error:
            trials.append({"highpass_hz": high, "lowpass_hz": low, "error": str(error)})
            record("filter_parameter_search", "failed_candidate", str(error), attempt)
    valid = [item for item in trials if "objective" in item]
    if not valid:
        raise ValueError("all deterministic filter candidates failed")
    chosen = max(valid, key=lambda item: (item["objective"], item["lowpass_hz"], -item["highpass_hz"]))
    record("filter_parameter_search", "completed",
           f"selected {chosen['highpass_hz']:g}-{chosen['lowpass_hz']:g} Hz from {len(valid)} valid candidates")
    return chosen["highpass_hz"], chosen["lowpass_hz"], trials


def analyze_epochs(epochs, enabled, record):
    """Compute ERP, Morlet power, and leakage-safe decoding summaries."""
    products = {}
    if epochs is None or not len(epochs):
        for step in ("erp", "time_frequency", "decoding"):
            if step in enabled:
                record(step, "skipped", "no retained epochs")
        return products

    if "erp" in enabled:
        conditions = {}
        for name in epochs.event_id:
            selection = epochs[name]
            if not len(selection):
                continue
            evoked = selection.average()
            gfp = np.sqrt(np.mean(evoked.data ** 2, axis=0))
            peak_index = int(np.argmax(gfp))
            step = max(1, int(math.ceil(len(evoked.times) / 200)))
            conditions[name] = {"epoch_count": len(selection),
                                "gfp_peak_time_s": float(evoked.times[peak_index]),
                                "gfp_peak_si": float(gfp[peak_index]),
                                "times_s": [float(v) for v in evoked.times[::step]],
                                "gfp_si": [float(v) for v in gfp[::step]]}
        products["erp"] = {"performed": True, "conditions": conditions,
                           "method": "MNE Evoked average and global field power"}
        record("erp", "completed", f"computed {len(conditions)} condition averages")

    if "time_frequency" in enabled:
        data = epochs.get_data(copy=False)[:60, :32]
        sfreq = float(epochs.info["sfreq"])
        duration = max(float(epochs.times[-1] - epochs.times[0]), 1 / sfreq)
        min_freq, max_freq = max(2.0, 2.0 / duration), min(40.0, sfreq * .4)
        freqs = np.geomspace(min_freq, max_freq, 16)
        n_cycles = np.minimum(freqs / 2.0, np.maximum(1.0, freqs * duration / 4.0))
        decim = max(1, int(math.ceil(data.shape[-1] / 300)))
        power = mne.time_frequency.tfr_array_morlet(data, sfreq, freqs, n_cycles=n_cycles,
                                                    output="power", decim=decim, n_jobs=1,
                                                    zero_mean=True, verbose=False)
        mean_power = power.mean(axis=(0, 1, 3))
        products["time_frequency"] = {"performed": True,
            "frequencies_hz": [float(v) for v in freqs],
            "mean_power_si2": [float(v) for v in mean_power],
            "epoch_limit": min(60, len(epochs)), "channel_limit": min(32, len(epochs.ch_names)),
            "method": "Morlet power; bounded summary, no cross-trial averaging before split"}
        record("time_frequency", "completed", f"computed {len(freqs)} frequencies on bounded epoch/channel set")

    if "decoding" in enabled:
        from mne.decoding import CSP
        from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
        from sklearn.model_selection import StratifiedKFold, cross_val_score
        from sklearn.pipeline import Pipeline
        x = epochs.get_data(copy=False)
        y = epochs.events[:, 2]
        classes, counts = np.unique(y, return_counts=True)
        folds = min(5, int(counts.min())) if len(counts) else 0
        if len(classes) < 2 or folds < 2:
            products["decoding"] = {"performed": False, "reason": "requires at least two classes and two trials per class"}
            record("decoding", "skipped", products["decoding"]["reason"])
        else:
            components = min(6, x.shape[1], max(2, x.shape[0] // folds))
            pipeline = Pipeline([("csp", CSP(n_components=components, reg="ledoit_wolf",
                                               log=True, norm_trace=False)),
                                 ("lda", LinearDiscriminantAnalysis())])
            cv = StratifiedKFold(n_splits=folds, shuffle=True, random_state=97)
            scores = cross_val_score(pipeline, x, y, cv=cv, scoring="balanced_accuracy", n_jobs=1)
            products["decoding"] = {"performed": True, "metric": "balanced_accuracy",
                "fold_scores": [float(v) for v in scores], "mean": float(scores.mean()),
                "std": float(scores.std()), "folds": folds, "classes": [int(v) for v in classes],
                "method": "CSP + LDA fitted independently inside stratified cross-validation",
                "warning": "Exploratory within-recording estimate; use group/session splits for generalization claims."}
            record("decoding", "completed", f"{folds}-fold balanced accuracy={scores.mean():.3f}")
    return products


def meg_analysis(raw, start, stop, profile, enabled, sss_mode, st_duration,
                 empty_room=None, record=lambda *args: None):
    """Apply real MNE MEG preprocessing with capability checks and audit events."""
    picks = mne.pick_types(raw.info, meg=True, eeg=False, ref_meg=True, exclude=[])
    if not len(picks):
        raise ValueError("dataset has no MEG channels")
    sfreq = float(raw.info["sfreq"])
    segment = raw.copy().crop(start / sfreq, (stop - 1) / sfreq).load_data()
    original = segment.get_data(picks=picks)
    working = segment.copy()
    audit = {"sss_mode": sss_mode, "empty_room": empty_room is not None}

    if empty_room is not None and "environmental_noise" in enabled:
        room = empty_room.copy().load_data()
        room_types = set(room.get_channel_types())
        data_types = set(working.get_channel_types())
        if not ({"mag", "grad"} & room_types & data_types):
            raise ValueError("empty-room recording has no compatible MEG sensor types")
        try:
            projs = mne.compute_proj_raw(room, duration=min(10.0, room.times[-1]),
                                        n_grad=2, n_mag=2, n_eeg=0, reject=None, verbose=False)
            if not projs:
                raise ValueError("no stable empty-room projectors could be estimated")
            working.add_proj(projs, remove_existing=False)
            working.apply_proj(verbose=False)
            audit["environmental_projectors"] = len(projs)
            record("environmental_noise", "completed", f"applied {len(projs)} SSP projectors estimated only from empty-room data")
        except Exception as error:
            audit["environmental_noise_error"] = str(error)
            record("environmental_noise", "degraded", f"empty-room SSP skipped: {error}", 2)
    else:
        record("environmental_noise", "skipped", "no empty-room dataset or step disabled")

    if sss_mode in {"sss", "tsss"} and "maxwell_filter" in enabled:
        if working.info.get("dev_head_t") is None:
            raise ValueError("SSS/tSSS requires device-to-head transform in the MEG file")
        try:
            kwargs = {"origin": "auto", "coord_frame": "head", "verbose": False}
            if sss_mode == "tsss":
                if st_duration <= 0 or st_duration >= working.times[-1]:
                    raise ValueError("tSSS st_duration must be positive and shorter than the selected recording")
                kwargs["st_duration"] = st_duration
            working = mne.preprocessing.maxwell_filter(working, **kwargs)
            record("maxwell_filter", "completed", f"MNE {sss_mode.upper()} with origin=auto" + (f", st_duration={st_duration:g}s" if sss_mode == "tsss" else ""))
        except Exception as error:
            audit["maxwell_error"] = str(error)
            record("maxwell_filter", "degraded", f"retained pre-SSS data: {error}", 2)
    else:
        record("maxwell_filter", "skipped", "mode none or step disabled")

    line = float(working.info.get("line_freq") or 50)
    nyquist = float(working.info["sfreq"]) / 2
    if "notch_filter" in enabled and 0 < line < nyquist:
        try:
            working.notch_filter([line], method="iir", verbose=False)
            record("notch_filter", "completed", f"{line:g} Hz IIR")
        except Exception as error:
            record("notch_filter", "degraded", f"continued without notch: {error}", 2)
    if "bandpass_filter" in enabled:
        checkpoint = working.copy(); low = min(40.0, nyquist * .9)
        try:
            working.filter(1.0, low, method="iir", verbose=False)
            record("bandpass_filter", "completed", f"1-{low:g} Hz IIR")
        except Exception as error:
            working = checkpoint
            try:
                working.filter(1.0, low, method="iir", iir_params={"order":2,"ftype":"butter"}, verbose=False)
                record("bandpass_filter", "completed", f"retry after {error}; order-2 Butterworth", 2)
            except Exception as retry_error:
                working=checkpoint;record("bandpass_filter","degraded",f"both attempts failed: {retry_error}",2)
    processed_picks = mne.pick_types(working.info, meg=True, eeg=False, ref_meg=True, exclude=[])
    processed = working.get_data(picks=processed_picks)
    result = {"mode": "automatic", "channel_names": [working.ch_names[i] for i in processed_picks],
              "preprocessing": audit, "sensor_types": {kind: working.get_channel_types().count(kind)
              for kind in sorted(set(working.get_channel_types()))},
              "quality": {"raw_rms_si": float(np.sqrt(np.mean(original ** 2))),
                          "processed_rms_si": float(np.sqrt(np.mean(processed ** 2)))},
              "retry_policy": {"maximum_attempts_per_recoverable_step": 2,
                               "fallback": "retain last valid checkpoint"}}
    return result, original, processed, mne.pick_info(working.info, processed_picks, copy=True), float(working.info["sfreq"]), working
