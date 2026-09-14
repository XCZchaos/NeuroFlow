"""Small offline end-to-end test for the real-data regression harness itself."""
from __future__ import annotations
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import mne
import numpy as np

PROJECT = Path(__file__).resolve().parents[2]


class RegressionHarnessTest(unittest.TestCase):
    def test_fif_fixture_checks_metadata_filter_quality_epochs_and_reports(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            sfreq = 100.0
            time = np.arange(1200) / sfreq
            data = np.vstack([8e-6 * np.sin(2 * np.pi * frequency * time) for frequency in (8, 10, 12, 14)])
            raw = mne.io.RawArray(data, mne.create_info(["F3", "F4", "C3", "C4"], sfreq, "eeg"), verbose=False)
            raw.set_annotations(mne.Annotations([2, 5, 8], [0, 0, 0], ["left", "right", "left"]))
            source = root / "fixture_raw.fif"
            raw.save(source, overwrite=True, verbose=False)
            manifest = {"schema_version": 1, "datasets": [{"id": "fixture", "modality": "EEG",
                "root_env": "NEUROFLOW_TEST_FIXTURE", "patterns": ["fixture_raw.fif"],
                "profile": "full", "max_seconds": 10, "expect": {"channels_min": 4,
                "channels_max": 4, "sampling_rate_min": 99, "sampling_rate_max": 101,
                "annotations_min": 3, "epochs_min": 1, "filter": True, "quality": True, "reports": True}}]}
            manifest_path = root / "manifest.json"
            manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
            report_path = root / "report.json"
            completed = subprocess.run([sys.executable, str(Path(__file__).with_name("run_regression.py")),
                "--manifest", str(manifest_path), "--data-root", str(root), "--require-all",
                "--output", str(report_path)], cwd=PROJECT, capture_output=True, text=True, timeout=180)
            report = json.loads(report_path.read_text(encoding="utf-8"))
            self.assertEqual(completed.returncode, 0, completed.stdout + completed.stderr + json.dumps(report, ensure_ascii=False))
            self.assertTrue(report["ok"])
            self.assertEqual(len(report["passed"]), 1)
            self.assertGreaterEqual(report["passed"][0]["epoch_count"], 1)


if __name__ == "__main__":
    unittest.main()
