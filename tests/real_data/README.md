# Real-data regression suite

This suite runs the same `inspect_dataset.py` and `analyze_dataset.py` entrypoints used by the Go Agent. Public recordings remain outside Git. `datasets.json` defines stable expectations for channels, sampling rate, annotations, quality scores, epochs and report artifacts.

Missing recordings are skipped during ordinary development. Use `--require-all` in a release environment to make any missing fixture fail the run.

```powershell
python tests/real_data/download_public_data.py --root D:\NeuroFlowTestData
python tests/real_data/run_regression.py --data-root D:\NeuroFlowTestData
python tests/real_data/run_regression.py --data-root D:\NeuroFlowTestData --require-all
```

BCI Competition IV 2a and OpenNeuro fixtures are not downloaded automatically because their selection/license workflow should remain explicit. Put them under the data root using the IDs in `datasets.json`, or set `NEUROFLOW_BCI_IV_2A_ROOT` and `NEUROFLOW_OPENNEURO_ROOT`.
