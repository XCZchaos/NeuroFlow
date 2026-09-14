"""List BIDS recordings without loading their sample arrays."""
import json
import sys
from pathlib import Path


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    root = Path(sys.argv[1]).resolve()
    if not (root / "dataset_description.json").exists():
        raise ValueError("selected directory is not a BIDS root")
    import mne_bids
    description = json.loads((root / "dataset_description.json").read_text(encoding="utf-8-sig"))
    paths = mne_bids.find_matching_paths(root, datatypes=["eeg", "meg", "nirs"])
    rows, seen = [], set()
    for item in paths:
        if item.suffix not in {"eeg", "meg", "nirs"} or not item.fpath.exists():
            continue
        key = str(item.fpath)
        if key in seen:
            continue
        seen.add(key)
        rows.append({"path": key, "relative_path": str(item.fpath.relative_to(root)).replace("\\", "/"),
          "subject": item.subject, "session": item.session, "task": item.task, "run": item.run,
          "datatype": item.datatype, "suffix": item.suffix, "extension": item.extension})
    print(json.dumps({"ok": True, "name": description.get("Name", root.name),
                      "bids_version": description.get("BIDSVersion"), "recordings": rows}, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(json.dumps({"ok": False, "message": str(error)}, ensure_ascii=False))
        raise SystemExit(1)
