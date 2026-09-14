"""Run NeuroFlow against locally cached public neurophysiology recordings.

Large public datasets are intentionally not committed. Missing datasets are
reported as skipped; --require-all turns skips into a failing release gate.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[2]
DEFAULT_MANIFEST = Path(__file__).with_name("datasets.json")


def run_json(command: list[str]) -> dict:
    completed = subprocess.run(command, cwd=PROJECT, text=True, encoding="utf-8",
                               errors="replace", capture_output=True, timeout=1200)
    lines = [line for line in completed.stdout.splitlines() if line.strip()]
    if not lines:
        raise AssertionError(f"no JSON output (exit {completed.returncode}): {completed.stderr[-1000:]}")
    payload = json.loads(lines[-1])
    if completed.returncode or not payload.get("ok"):
        raise AssertionError(payload.get("message") or completed.stderr[-1000:])
    return payload


def locate(case: dict, data_root: Path | None) -> Path | None:
    roots = []
    configured = os.getenv(case["root_env"])
    if configured:
        roots.append(Path(configured).expanduser())
    if data_root:
        roots.extend((data_root / case["id"], data_root))
    for root in roots:
        if not root.exists():
            continue
        for pattern in case["patterns"]:
            match = next(root.glob(pattern), None)
            if match:
                return match.resolve()
    return None


def check_range(name: str, value: float, expected: dict) -> None:
    minimum, maximum = expected.get(f"{name}_min"), expected.get(f"{name}_max")
    if minimum is not None and value < minimum:
        raise AssertionError(f"{name}={value} is below {minimum}")
    if maximum is not None and value > maximum:
        raise AssertionError(f"{name}={value} is above {maximum}")


def execute(case: dict, source: Path, artifact_root: Path) -> dict:
    inspect = run_json([sys.executable, str(PROJECT / "neuro_service/inspect_dataset.py"), str(source)])
    expected = case["expect"]
    check_range("channels", float(inspect["channel_count"]), expected)
    check_range("sampling_rate", float(inspect["sampling_rate_hz"]), expected)
    check_range("annotations", float(inspect.get("annotation_count", 0)), expected)
    if expected.get("bids") and not inspect.get("structure_report", {}).get("bids"):
        raise AssertionError("input was not recognized as BIDS")

    case_output = artifact_root / case["id"]
    case_output.mkdir(parents=True, exist_ok=True)
    output = case_output / "regression_raw.fif"
    command = [sys.executable, str(PROJECT / "neuro_service/analyze_dataset.py"),
               str(source), case["modality"], case.get("profile", "quality"),
               "--end", str(case.get("max_seconds", 30)), "--output", str(output)]
    if case["modality"] == "EEG" and expected.get("epochs_min") is not None:
        # Keep the regression focused on event/epoch construction; artifact
        # rejection behavior has separate deterministic unit coverage.
        command += ["--epoch-reject-uv", str(case.get("epoch_reject_uv", 1000))]
    if case["modality"] == "MEG":
        command += ["--steps", "environmental_noise,notch_filter,bandpass_filter,report"]
    analysis = run_json(command)
    if expected.get("filter"):
        preprocessing = analysis.get("result", {}).get("preprocessing", {})
        bandpass = preprocessing.get("bandpass_hz")
        audit = analysis.get("result", {}).get("audit_log", [])
        completed = any(item.get("step") == "bandpass_filter" and item.get("status") == "completed" for item in audit)
        if not bandpass or not completed:
            raise AssertionError(f"band-pass filter was not verifiably completed: {bandpass}")
    if expected.get("quality"):
        quality = analysis.get("result", {}).get("quality_comparison", {})
        for phase in ("before", "after"):
            score = quality.get(phase, {}).get("score")
            if not isinstance(score, (int, float)) or not 0 <= score <= 100:
                raise AssertionError(f"invalid {phase} quality score: {score}")
    if expected.get("reports"):
        produced = analysis.get("output", {})
        for key in ("audit_file_name", "audit_html_file_name"):
            if not produced.get(key) or not (case_output / produced[key]).exists():
                raise AssertionError(f"missing report artifact: {key}")
    epochs = analysis.get("result", {}).get("preprocessing", {}).get("epochs", {})
    epoch_count = epochs.get("retained_epochs")
    if expected.get("epochs_min") is not None and (epoch_count is None or epoch_count < expected["epochs_min"]):
        raise AssertionError(f"epoch_count={epoch_count} is below {expected['epochs_min']}")
    return {"source": str(source), "channel_count": inspect["channel_count"],
            "sampling_rate_hz": inspect["sampling_rate_hz"],
            "annotation_count": inspect.get("annotation_count", 0),
            "epoch_count": epoch_count,
            "quality": analysis.get("result", {}).get("quality_comparison"),
            "artifacts": analysis.get("output", {})}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--data-root", type=Path)
    parser.add_argument("--dataset", action="append", help="run only this dataset ID; repeatable")
    parser.add_argument("--require-all", action="store_true")
    parser.add_argument("--output", type=Path, default=PROJECT / ".cache/real-data-regression.json")
    args = parser.parse_args()
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    selected = set(args.dataset or [])
    cases = [case for case in manifest["datasets"] if not selected or case["id"] in selected]
    artifact_root = args.output.parent / "real-data-artifacts"
    report = {"created_at": datetime.now(timezone.utc).isoformat(), "schema_version": 1,
              "passed": [], "failed": [], "skipped": []}
    for case in cases:
        source = locate(case, args.data_root)
        if source is None:
            report["skipped"].append({"id": case["id"], "reason": f"set {case['root_env']} or --data-root"})
            continue
        try:
            report["passed"].append({"id": case["id"], **execute(case, source, artifact_root)})
        except Exception as error:
            report["failed"].append({"id": case["id"], "source": str(source), "error": str(error)})
    report["ok"] = not report["failed"] and (not args.require_all or not report["skipped"])
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"ok": report["ok"], "passed": len(report["passed"]),
                      "failed": len(report["failed"]), "skipped": len(report["skipped"]),
                      "report": str(args.output)}, ensure_ascii=False))
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
