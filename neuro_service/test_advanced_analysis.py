import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path

import mne
import numpy as np

from advanced_analysis import analyze_epochs, meg_analysis, optimize_eeg_filter
from analyze_dataset import signal_quality
from bids_support import load_bids_raw, write_bids_derivative


class AdvancedAnalysisTest(unittest.TestCase):
    def test_filter_search_and_epoch_products(self):
        sfreq = 100.0
        times = np.arange(4000) / sfreq
        data = np.vstack([1e-5 * np.sin(2*np.pi*10*times), 8e-6*np.sin(2*np.pi*12*times)])
        audit = []
        record = lambda step, status, detail, attempt=1: audit.append((step, status, attempt))
        high, low, trials = optimize_eeg_filter(data, sfreq, 0, 0, 0, signal_quality, record)
        self.assertIn(high, {0.5, 1.0, 2.0}); self.assertTrue(high < low); self.assertGreater(len(trials), 1)
        info = mne.create_info(["C3", "C4"], sfreq, "eeg")
        raw = mne.io.RawArray(data, info, verbose=False)
        events = np.array([[200+i*300, 0, 1+i % 2] for i in range(10)])
        epochs = mne.Epochs(raw, events, {"left":1,"right":2}, -.1, .5,
                            baseline=(None, 0), preload=True, verbose=False)
        products = analyze_epochs(epochs, {"erp","time_frequency","decoding"}, record)
        self.assertTrue(products["erp"]["performed"])
        self.assertEqual(len(products["time_frequency"]["frequencies_hz"]), 16)
        self.assertTrue(products["decoding"]["performed"])

    def test_meg_filter_and_sss_capability_guard(self):
        sfreq=200.0; info=mne.create_info(["MEG001","MEG002"],sfreq,["mag","mag"])
        raw=mne.io.RawArray(np.random.default_rng(97).normal(scale=1e-12,size=(2,2000)),info,verbose=False)
        audit=[]; record=lambda *item:audit.append(item)
        result, before, after, _, _, _ = meg_analysis(raw,0,2000,"full",{"notch_filter","bandpass_filter"},"none",10,record=record)
        self.assertEqual(before.shape,after.shape); self.assertEqual(result["sensor_types"]["mag"],2)
        with patch("mne.preprocessing.maxwell_filter", side_effect=lambda instance, **kwargs: instance.copy()) as mocked:
            meg_analysis(raw,0,2000,"full",{"maxwell_filter"},"tsss",2,record=record)
            self.assertEqual(mocked.call_args.kwargs["st_duration"],2)
        empty=mne.io.RawArray(np.zeros((1,2000)),mne.create_info(["Cz"],sfreq,"eeg"),verbose=False)
        with self.assertRaisesRegex(ValueError,"compatible MEG"):
            meg_analysis(raw,0,2000,"full",{"environmental_noise"},"none",2,empty_room=empty,record=record)

    def test_bids_derivative_round_trip(self):
        try:
            import mne_bids
            import pybv
        except ImportError:
            self.skipTest("mne-bids/pybv unavailable")
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)/"source"; out=Path(folder)/"out"
            info=mne.create_info(["C3","C4"],100,"eeg")
            raw=mne.io.RawArray(np.zeros((2,500)),info,verbose=False)
            bids=mne_bids.BIDSPath(subject="01",task="test",datatype="eeg",suffix="eeg",root=root)
            mne_bids.write_raw_bids(raw,bids,allow_preload=True,format="BrainVision",overwrite=True,verbose=False)
            loaded,_=load_bids_raw(root)
            result=write_bids_derivative(loaded.load_data(),root,out)
            self.assertTrue((out/result["root"]/result["relative_recording"]).exists())
            description=out/result["root"]/"dataset_description.json"
            self.assertIn('"DatasetType": "derivative"',description.read_text())


if __name__ == "__main__": unittest.main()
