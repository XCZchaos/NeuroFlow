import json
import tempfile
import unittest
from pathlib import Path

import numpy as np
from scipy.io import savemat

from structured_data import load_structured_raw


class StructuredDataTest(unittest.TestCase):
    """用真实临时文件验证探测结果可被 MNE 读取，而不是只测试辅助函数。"""

    def test_csv_infers_time_channels_events_and_montage(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "recording.csv"
            rows = ["time,EEG C3-REF,C4,HEOG,event"]
            for index in range(500):
                event = 1 if index == 100 else 0
                rows.append(f"{index/250},{10*np.sin(index/20)},{8*np.cos(index/20)},0,{event}")
            path.write_text("\n".join(rows), encoding="utf-8")
            path.with_suffix(".json").write_text(json.dumps({"unit": "uV"}), encoding="utf-8")
            raw, report = load_structured_raw(path)
            self.assertEqual(raw.ch_names, ["C3", "C4", "HEOG"])
            self.assertAlmostEqual(raw.info["sfreq"], 250)
            self.assertEqual(raw.get_channel_types(), ["eeg", "eeg", "eog"])
            self.assertEqual(report["montage"], "standard_1020")
            self.assertEqual(report["event_dictionary"], ["event/1"])
            self.assertTrue(report["events_require_confirmation"])

    def test_mat_detects_channel_axis(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "recording.mat"
            savemat(path, {"data": np.ones((2, 500)), "fs": 250,
                           "ch_names": np.array(["C3", "C4"], dtype=object)})
            path.with_suffix(".json").write_text(json.dumps({"unit": "V"}), encoding="utf-8")
            raw, report = load_structured_raw(path)
            self.assertEqual(raw.get_data().shape, (2, 500))
            self.assertEqual(report["selected_array"], "data")

    def test_binary_requires_and_uses_explicit_sidecar(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "recording.bin"
            np.arange(1000, dtype="float32").reshape(500, 2).tofile(path)
            path.with_suffix(".json").write_text(json.dumps({
                "dtype": "float32", "shape": [500, 2], "layout": "samples_x_channels",
                "sampling_rate_hz": 250, "channel_names": ["C3", "C4"], "unit": "uV"
            }), encoding="utf-8")
            raw, report = load_structured_raw(path)
            self.assertEqual(raw.get_data().shape, (2, 500))
            self.assertEqual(report["confidence"], .98)


if __name__ == "__main__":
    unittest.main()
