"""Explicitly download public MNE/PhysioNet fixtures into a local cache."""
from __future__ import annotations
import argparse
from pathlib import Path
import mne

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--dataset", action="append", choices=["eegbci", "mne-sample", "fnirs"])
    args = parser.parse_args()
    requested = set(args.dataset or ["eegbci", "mne-sample", "fnirs"])
    args.root.mkdir(parents=True, exist_ok=True)
    if "eegbci" in requested:
        mne.datasets.eegbci.load_data(1, [6], path=str(args.root / "physionet-eegbci"), update_path=False)
    if "mne-sample" in requested:
        mne.datasets.sample.data_path(path=str(args.root / "mne-sample-erp"), update_path=False)
    if "fnirs" in requested:
        mne.datasets.fnirs_motor_group.data_path(path=str(args.root / "mne-fnirs-snirf"), update_path=False)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
