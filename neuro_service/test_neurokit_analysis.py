"""Small synthetic integration test for the independent NeuroKit2 Agent tool."""
import importlib.util
import tempfile
import unittest
from pathlib import Path

import mne
import numpy as np

from neurokit_analysis import analyze


@unittest.skipUnless(importlib.util.find_spec("neurokit2"), "install NeuroKit2 to run this integration test")
class NeuroKitAnalysisTests(unittest.TestCase):
    def test_eeg_diagnostics_do_not_save_or_modify_source(self):
        sfreq = 250
        time = np.arange(sfreq * 12) / sfreq
        rng = np.random.default_rng(7)
        data = np.array([
            12e-6 * np.sin(2 * np.pi * (8 + index) * time)
            + rng.normal(0, 1e-6, len(time))
            for index in range(6)
        ])
        info = mne.create_info([f"EEG{index + 1}" for index in range(6)], sfreq, "eeg")
        raw = mne.io.RawArray(data, info, verbose="ERROR")
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "synthetic_raw.fif"
            raw.save(path, overwrite=True, verbose="ERROR")
            original_size = path.stat().st_size
            for method in ("band_power", "gfp", "bad_channels"):
                result = analyze(path, method, 0, 10)
                self.assertTrue(result["ok"])
                self.assertEqual(result["method"], method)
                self.assertEqual(result["channel_count"], 6)
                self.assertFalse(result["saved"])
            self.assertEqual(path.stat().st_size, original_size)
            self.assertEqual(list(Path(directory).iterdir()), [path])


if __name__ == "__main__":
    unittest.main()
