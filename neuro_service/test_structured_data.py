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

    def test_multisection_csv_separates_interleaved_eeg_stream(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "wearable.csv"
            rows = [
                "ID,DEVICE TYPE,EEG CHANNELS,EEG SAMPLING RATE,FNIRS CHANNELS,EEG EFFECTIVE SAMPLING RATE",
                "1,BioMulti Lite,2,250,8,256.64",
                "TIMESTAMP,EEG.PKN,EEG.FP1,EEG.FP2,FNIRS.S1D1.735,ACCEL.X,MARKER,IS_LOSS",
                "1788191606340,13,10,20,,,,0",
                "1788191606342,,,,100,1,,0",
                "1788191606344,13,11,21,,,,0",
                "1788191606348,13,12,22,,,left,0",
            ]
            path.write_text("\n".join(rows), encoding="utf-8")
            raw, report = load_structured_raw(path)
            self.assertEqual(raw.ch_names, ["Fp1", "Fp2"])
            self.assertEqual(raw.get_data().shape, (2, 3))
            self.assertAlmostEqual(raw.info["sfreq"], 250)
            self.assertEqual(report["adapter"], "multisection_csv")
            self.assertEqual(report["detected_streams"], ["EEG", "fNIRS", "motion"])
            self.assertEqual(report["selected_stream"], "EEG")
            self.assertEqual(report["event_dictionary"], ["event/left"])

    def test_large_unlabelled_values_offer_nanovolt_preview_for_confirmation(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "device.csv"
            path.write_text("time,Fp1,Fp2\n0,374000,18000\n0.004,250000,80000\n", encoding="utf-8")
            raw, report = load_structured_raw(path)
            self.assertEqual(report["unit"], "nV")
            self.assertLess(report["unit_confidence"], .5)
            self.assertTrue(report["requires_confirmation"])
            self.assertAlmostEqual(raw.get_data()[0, 0], 374000e-9)

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
