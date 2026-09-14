"""Small optional mne-bids adapter shared by inspection, preview, and analysis."""
from pathlib import Path
import json


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


def write_bids_derivative(raw, source: Path, destination: Path):
    """Write an EEG/MEG derivative with source entities and GeneratedBy metadata."""
    import mne_bids
    _, source_path = load_bids_raw(source)
    datatype = source_path.datatype
    if datatype not in {"eeg", "meg"}:
        raise ValueError("BIDS derivative writing currently supports EEG and MEG")
    root = destination / "bids-derivatives" / "NeuroFlow"
    root.mkdir(parents=True, exist_ok=True)
    description = {"Name": "NeuroFlow derivatives", "BIDSVersion": "1.10.0",
                   "DatasetType": "derivative",
                   "GeneratedBy": [{"Name": "NeuroFlow", "Version": "0.1",
                                    "Description": "Auditable MNE preprocessing"}],
                   "SourceDatasets": [{"URL": str(source)}]}
    (root / "dataset_description.json").write_text(json.dumps(description, indent=2), encoding="utf-8")
    target = mne_bids.BIDSPath(subject=source_path.subject, session=source_path.session,
        task=source_path.task, acquisition=source_path.acquisition, run=source_path.run,
        processing="clean", description="preproc", datatype=datatype,
        suffix=datatype, root=root, check=False)
    output = mne_bids.write_raw_bids(raw, target, allow_preload=True, overwrite=True,
                                     format="FIF" if datatype == "meg" else "BrainVision",
                                     verbose="ERROR")
    return {"root": "bids-derivatives/NeuroFlow", "relative_recording": str(output.fpath.relative_to(root)).replace("\\", "/"),
            "datatype": datatype}
