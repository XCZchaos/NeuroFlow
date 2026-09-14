"""Small optional mne-bids adapter shared by inspection, preview, and analysis."""
from pathlib import Path


def is_bids_path(path: Path) -> bool:
    if path.is_dir():
        return (path / "dataset_description.json").exists()
    return any(part.startswith("sub-") for part in path.parts) and "_" in path.stem


def load_bids_raw(path: Path):
    try:
        import mne_bids
    except ImportError as exc:
        raise ValueError("BIDS data requires mne-bids; run: pip install -r neuro_service/requirements.txt") from exc
    if path.is_dir():
        matches = mne_bids.find_matching_paths(path, datatypes=["eeg", "meg", "nirs"])
        readable = [item for item in matches if item.suffix in {"eeg", "meg", "nirs"}]
        if not readable:
            raise ValueError("BIDS directory contains no readable EEG, MEG, or NIRS recording")
        bids_path = readable[0]
    else:
        bids_path = mne_bids.get_bids_path_from_fname(path)
    raw = mne_bids.read_raw_bids(bids_path=bids_path, verbose="ERROR")
    return raw, bids_path
