"""Validate an external event/label file and bind it to one signal file."""
from __future__ import annotations

import csv
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

from import_review import config_path, get_config


# These aliases cover BIDS events.tsv, MNE-style annotation tables, common
# experiment exports, and a small set of Chinese headers. They describe meaning,
# rather than a device-specific fixed template, so new datasets are not locked
# to one acquisition system.
ONSET_NAMES = ("onset", "onset_seconds", "time", "time_seconds", "start", "timestamp", "开始时间", "时间")
SAMPLE_NAMES = ("sample", "sample_index", "latency", "采样点", "样本序号")
DURATION_NAMES = ("duration", "duration_seconds", "length", "持续时间", "时长")
LABEL_NAMES = ("label", "event", "event_type", "trial_type", "description", "value", "stage", "sleep_stage", "标签", "事件", "阶段")


def first_key(row, candidates):
    lowered = {str(key).strip().lower(): key for key in row}
    return next((lowered[name] for name in candidates if name in lowered), None)


def normalize_rows(rows, sfreq, recording_duration, sample_origin=0):
    if sfreq <= 0 or recording_duration <= 0:
        raise ValueError("signal metadata must contain a positive sampling rate and duration")
    annotations = []
    for number, row in enumerate(rows, 2):
        onset_key, sample_key = first_key(row, ONSET_NAMES), first_key(row, SAMPLE_NAMES)
        label_key, duration_key = first_key(row, LABEL_NAMES), first_key(row, DURATION_NAMES)
        if label_key is None or (onset_key is None and sample_key is None):
            raise ValueError("label file requires label/event/trial_type and onset/time or sample columns")
        description = str(row.get(label_key, "")).strip()
        if not description:
            continue
        onset = float(row[onset_key]) if onset_key is not None else (float(row[sample_key]) - sample_origin) / sfreq
        duration = float(row.get(duration_key) or 0.0) if duration_key is not None else 0.0
        if onset < 0 or duration < 0 or onset > recording_duration or onset + duration > recording_duration + 1e-6:
            raise ValueError(f"label row {number} falls outside the recording duration")
        annotations.append({"onset": onset, "duration": duration, "description": description})
    if not annotations:
        raise ValueError("label file contains no usable annotations")
    annotations.sort(key=lambda item: item["onset"])
    return annotations


def audit_annotations(annotations):
    """Remove exact duplicates and report overlaps or inconsistent label spelling."""
    unique, seen, duplicate_count = [], set(), 0
    for item in annotations:
        key = (round(item["onset"], 9), round(item["duration"], 9), item["description"])
        if key in seen:
            duplicate_count += 1
            continue
        seen.add(key)
        unique.append(item)
    overlap_count = 0
    active_end = -1.0
    for item in unique:
        if item["duration"] > 0 and item["onset"] < active_end - 1e-9:
            overlap_count += 1
        active_end = max(active_end, item["onset"] + item["duration"])
    variants = {}
    for item in unique:
        variants.setdefault(item["description"].casefold(), set()).add(item["description"])
    inconsistent = [sorted(values) for values in variants.values() if len(values) > 1]
    warnings = []
    if duplicate_count:
        warnings.append(f"removed {duplicate_count} exact duplicate annotations")
    if overlap_count:
        warnings.append(f"found {overlap_count} overlapping annotation intervals; retained for review")
    if inconsistent:
        warnings.append("labels differ only by letter case: " + "; ".join(" / ".join(group) for group in inconsistent))
    return unique, {"duplicate_count": duplicate_count, "overlap_count": overlap_count,
                    "inconsistent_label_groups": inconsistent, "warnings": warnings}


def read_rows(path):
    if path.suffix.lower() == ".json":
        document = json.loads(path.read_text(encoding="utf-8-sig"))
        rows = document.get("annotations", document.get("events", document)) if isinstance(document, dict) else document
        if not isinstance(rows, list) or not all(isinstance(row, dict) for row in rows):
            raise ValueError("JSON labels must be an array, or an object containing annotations/events")
        return rows
    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        # CSV exports often use comma, semicolon, or tab delimiters. Sniff a
        # bounded prefix and keep the extension-based delimiter as a fallback.
        sample = stream.read(8192)
        stream.seek(0)
        fallback = "\t" if path.suffix.lower() == ".tsv" else ","
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",;\t")
            delimiter = dialect.delimiter
        except csv.Error:
            delimiter = fallback
        return list(csv.DictReader(stream, delimiter=delimiter))


def inspect(signal_path, config=None):
    inspect_script = Path(__file__).with_name("inspect_dataset.py")
    env = dict(os.environ, PYTHONIOENCODING="utf-8")
    if config is not None:
        env["NEUROFLOW_IMPORT_CONFIG"] = json.dumps(config)
    result = subprocess.run([sys.executable, str(inspect_script), str(signal_path)], env=env,
                            capture_output=True, text=True, encoding="utf-8")
    if result.returncode:
        raise ValueError(result.stdout or result.stderr)
    return json.loads(result.stdout)


def save_config(signal_path, config):
    target = config_path(signal_path)
    target.parent.mkdir(parents=True, exist_ok=True)
    stat = signal_path.stat()
    payload = {"fingerprint": [stat.st_size, stat.st_mtime_ns], "config": config}
    fd, temporary = tempfile.mkstemp(dir=target.parent, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump(payload, stream, ensure_ascii=False)
        os.replace(temporary, target)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def main():
    signal_path, operation = Path(sys.argv[1]).resolve(), sys.argv[2]
    config = dict(get_config(signal_path))
    if operation == "--list":
        print(json.dumps({"ok": True, "label_source_name": config.get("label_source_name", ""),
                          "sample_origin": config.get("label_sample_origin", 0),
                          "annotations": config.get("external_annotations", []),
                          "validation_report": config.get("label_validation_report", {})}, ensure_ascii=False))
        return
    if operation == "--delete":
        for key in ("external_annotations", "label_source_name", "label_sample_origin", "label_validation_report"):
            config.pop(key, None)
        result = inspect(signal_path, config)
        save_config(signal_path, config)
        print(json.dumps({"ok": True, "label_source_name": "", "label_count": 0,
                          "validation_report": {}, "record": {"inspection": result}}, ensure_ascii=False))
        return

    base = inspect(signal_path)
    sfreq, duration = float(base["sampling_rate_hz"]), float(base["duration_seconds"])
    if operation == "--replace":
        request = json.load(sys.stdin)
        rows = request.get("annotations", [])
        source_name = str(request.get("label_source_name") or "edited-labels")
        sample_origin = int(request.get("sample_origin", 0))
    else:
        label_path = Path(operation).resolve()
        if label_path.suffix.lower() not in {".csv", ".tsv", ".json"}:
            raise ValueError("labels currently support CSV, TSV, and JSON")
        rows, source_name = read_rows(label_path), label_path.name
        sample_origin = int(sys.argv[3]) if len(sys.argv) > 3 else 0
    if sample_origin not in {0, 1}:
        raise ValueError("sample_origin must be 0 or 1")
    annotations = normalize_rows(rows, sfreq, duration, sample_origin)
    annotations, report = audit_annotations(annotations)
    # Inspect once without the candidate labels to obtain authoritative rate and
    # duration. The normalized annotations are then validated against them.
    # Replacing labels must not silently confirm an unresolved channel layout,
    # unit, matrix orientation, or sampling-rate conflict.
    config.update({"external_annotations": annotations, "label_source_name": source_name,
                   "label_sample_origin": sample_origin, "label_validation_report": report})
    result = inspect(signal_path, config)
    save_config(signal_path, config)
    print(json.dumps({"ok": True, "label_source_name": source_name, "label_count": len(annotations),
                      "sample_origin": sample_origin, "annotations": annotations,
                      "validation_report": report, "record": {"inspection": result}}, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(json.dumps({"ok": False, "message": str(error)}, ensure_ascii=False))
        raise SystemExit(1)
