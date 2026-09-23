import unittest

import mne
import numpy as np

from sleep_staging import (
    channel_capabilities,
    choose_candidate,
    detect_k_complexes,
    detect_spindles,
)


class SleepStagingDetectorTests(unittest.TestCase):
    def test_multimodal_capabilities_follow_mne_channel_types(self):
        info = mne.create_info(
            ["C3", "LOC", "ROC", "Chin1"],
            100.0,
            ch_types=["eeg", "eog", "eog", "emg"],
        )
        raw = mne.io.RawArray(np.zeros((4, 1000)), info, verbose="ERROR")
        result = channel_capabilities(raw, np.array([0]), np.array([1, 2]), np.array([3]))
        self.assertEqual(result["mode"], "EEG+EOG+EMG")
        self.assertTrue(result["detectors"]["rapid_eye_movements"])
        self.assertTrue(result["detectors"]["chin_emg_tone"])

    def test_eeg_only_disables_eog_and_emg_detectors(self):
        info = mne.create_info(["Fp1", "Fp2"], 100.0, ch_types=["eeg", "eeg"])
        raw = mne.io.RawArray(np.zeros((2, 1000)), info, verbose="ERROR")
        result = channel_capabilities(raw, np.array([0, 1]), np.array([]), np.array([]))
        self.assertEqual(result["mode"], "EEG_ONLY")
        self.assertFalse(result["detectors"]["slow_eye_movements"])
        self.assertFalse(result["detectors"]["chin_emg_tone"])
        self.assertEqual(len(result["missing_modalities"]), 2)

    def test_spindle_burst_and_k_complex_are_detected(self):
        sfreq = 100.0
        time = np.arange(30 * int(sfreq)) / sfreq
        spindle_window = (time >= 10.0) & (time < 11.0)
        spindle = np.zeros_like(time)
        spindle[spindle_window] = 40e-6 * np.sin(2 * np.pi * 13 * time[spindle_window])
        self.assertGreaterEqual(detect_spindles(spindle[None, :], sfreq), 1)

        k_complex = -130e-6 * np.exp(-((time - 15.0) / 0.12) ** 2)
        k_complex += 90e-6 * np.exp(-((time - 15.45) / 0.18) ** 2)
        self.assertGreaterEqual(detect_k_complexes(k_complex[None, :], sfreq), 1)

    def test_n2_event_evidence_overrides_fallback(self):
        features = {
            "ratios": {"delta": 0.25, "theta": 0.30, "alpha": 0.15, "beta": 0.10},
            "peak_to_peak_uv": 100.0,
            "events": {"sleep_spindles": 1, "k_complexes": 0},
            "eye_movements": None,
            "emg": None,
        }
        stage, confidence, artifact, evidence = choose_candidate(features, None)
        self.assertEqual(stage, "N2")
        self.assertGreaterEqual(confidence, 0.66)
        self.assertFalse(artifact)
        self.assertIn("sleep-spindle candidate", evidence)


if __name__ == "__main__":
    unittest.main()
