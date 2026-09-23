"""Deterministic physiological checks; these do not establish clinical validity."""
import tempfile
import unittest
from pathlib import Path

import numpy as np
import pandas as pd

from ppg_analysis import run


class PPGTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = Path(self.temp.name) / "pulse.csv"
        self.rate = 100
        times = np.arange(3000) / self.rate
        # 72 bpm with a drifting baseline: verifies real cleaning and timing.
        pulse = np.sin(2 * np.pi * 1.2 * times) + .25 * np.sin(2 * np.pi * 2.4 * times)
        pd.DataFrame({"time": times, "PPG": pulse + 2 * np.sin(2 * np.pi * .1 * times)}).to_csv(self.path, index=False)
        self.options = {"path": str(self.path), "channel": "PPG", "time_column": "time", "duration_seconds": 30}

    def tearDown(self):
        self.temp.cleanup()

    def test_real_cleaning_and_peaks_preserve_source(self):
        before = self.path.read_bytes()
        data = run(self.options)
        self.assertAlmostEqual(data["mean_bpm"], 72, delta=2)
        self.assertTrue(30 <= data["peak_count"] <= 38)
        self.assertLess(np.std(data["waveform"]["cleaned"]), np.std(data["waveform"]["raw"]))
        self.assertEqual(before, self.path.read_bytes())
        self.assertFalse(data["saved"])
        self.assertTrue(all(abs(p["sample"] / self.rate - p["time"]) < 1e-8 for p in data["peaks"]))

    def test_rate_conflict_and_irregular_time_rejected(self):
        with self.assertRaisesRegex(ValueError, "conflicts"):
            run({**self.options, "sampling_rate_hz": 250})
        frame = pd.read_csv(self.path)
        frame.loc[1000:, "time"] += .5
        frame.to_csv(self.path, index=False)
        with self.assertRaisesRegex(ValueError, "Irregular"):
            run(self.options)

    def test_milliseconds_and_offset(self):
        frame = pd.read_csv(self.path)
        frame["time"] *= 1000
        frame.to_csv(self.path, index=False)
        data = run({**self.options, "time_unit": "ms", "start_seconds": 10, "duration_seconds": 20})
        self.assertAlmostEqual(data["sampling_rate_hz"], 100)
        self.assertTrue(all(p["time"] >= 10 and p["sample"] >= 1000 for p in data["peaks"]))

    def test_missing_rate_channel_nan_and_flat(self):
        for config, message in [({"time_column": ""}, "sampling rate"), ({"channel": "time"}, "PPG signal")]:
            with self.assertRaisesRegex(ValueError, message):
                run({**self.options, **config})
        frame = pd.read_csv(self.path)
        frame["PPG"] = 1
        frame.to_csv(self.path, index=False)
        with self.assertRaisesRegex(ValueError, "Flat signal"):
            run(self.options)
        frame.loc[5, "PPG"] = np.nan
        frame.to_csv(self.path, index=False)
        with self.assertRaisesRegex(ValueError, "missing"):
            run(self.options)

    def test_inspection_does_not_invent_sampling_rate(self):
        data = run({"path": str(self.path), "operation": "inspect"})
        self.assertIsNone(data["sampling_rate_hz"])
        self.assertEqual(data["channels"], ["time", "PPG"])

    def test_mne_native_rate_and_channel(self):
        import mne
        path = Path(self.temp.name) / "pulse_raw.fif"
        values = pd.read_csv(self.path)["PPG"].to_numpy()
        raw = mne.io.RawArray(values[None, :], mne.create_info(["Pleth"], 100, ["misc"]), verbose=False)
        raw.save(path, overwrite=True, verbose=False)
        data = run({"path": str(path), "channel": "Pleth", "sampling_rate_hz": 250, "duration_seconds": 30})
        self.assertEqual(data["sampling_rate_hz"], 100)
        self.assertAlmostEqual(data["mean_bpm"], 72, delta=2)


if __name__ == "__main__":
    unittest.main()
