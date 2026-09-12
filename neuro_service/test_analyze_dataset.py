"""针对 EEG MNE 执行链的轻量集成测试。"""

import unittest

import mne
import numpy as np

from analyze_dataset import eeg_auto_analysis


class EEGPipelineTest(unittest.TestCase):
    def test_resample_epoch_baseline_and_rejection(self):
        """四个新增步骤必须实际改变 MNE 对象并留下可审计结果。"""
        sfreq = 500.0
        times = np.arange(int(sfreq * 8)) / sfreq
        data = np.vstack([
            10e-6 * np.sin(2 * np.pi * (8 + index) * times)
            for index in range(4)
        ])
        # 在第二个事件附近加入明显伪迹，验证 Epochs.drop_bad 会实际拒绝该段。
        data[0, int(2.95 * sfreq):int(3.05 * sfreq)] += 500e-6
        info = mne.create_info(["F3", "F4", "C3", "C4"], sfreq, "eeg")
        raw = mne.io.RawArray(data, info, verbose=False)
        raw.set_annotations(mne.Annotations([1.0, 3.0, 5.0], [0, 0, 0], ["stim", "stim", "stim"]))

        result, _, processed, processed_info, processed_sfreq, epochs = eeg_auto_analysis(
            raw, 0, raw.n_times, sfreq, "full", None, None,
            1.0, 40.0, 0.0,
            {"resample", "epoching", "baseline", "autoreject"},
            250.0, -0.2, 0.8, -0.2, 0.0, 100.0,
        )

        self.assertEqual(processed_sfreq, 250.0)
        self.assertEqual(processed.shape, (processed_info["nchan"], 2000))
        self.assertIsNotNone(epochs)
        report = result["preprocessing"]["epochs"]
        self.assertTrue(report["performed"])
        self.assertEqual(report["event_count"], 3)
        self.assertGreaterEqual(report["rejected_epochs"], 1)
        self.assertEqual(report["baseline_seconds"], [-0.2, 0.0])
        baseline_samples = (epochs.times >= -0.2) & (epochs.times <= 0.0)
        np.testing.assert_allclose(
            epochs.get_data(copy=False)[:, :, baseline_samples].mean(axis=2), 0.0, atol=1e-12
        )


if __name__ == "__main__":
    unittest.main()
