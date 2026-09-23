"""回归测试关注确认后的真实样本，不只检查 JSON 字段是否更新。"""
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import numpy as np
from scipy.io import savemat
from structured_data import load_structured_raw
from import_review import apply_config, details, config_path
from attach_labels import audit_annotations, normalize_rows, read_rows


class ImportReviewTests(unittest.TestCase):
    def test_external_labels_accept_seconds_samples_and_become_annotations(self):
        rows = [
            {'sample': '250', 'event': 'stimulus/A', 'duration': '0.5'},
            {'sample': '500', 'event': 'response/B', 'duration': '0'},
        ]
        labels = normalize_rows(rows, sfreq=250, recording_duration=10)
        self.assertEqual([item['onset'] for item in labels], [1.0, 2.0])
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'data.csv'
            # Three seconds of samples keep both imported events inside the Raw range.
            np.savetxt(path, np.ones((750, 1)), delimiter=',', header='C3', comments='')
            config = {'sampling_rate_hz': 250, 'unit': 'uV', 'external_annotations': labels}
            with patch.dict(os.environ, NEUROFLOW_IMPORT_CONFIG=json.dumps(config)):
                raw = apply_config(load_structured_raw(path)[0], path)
            self.assertEqual(list(raw.annotations.description), ['stimulus/A', 'response/B'])
            np.testing.assert_allclose(raw.annotations.onset, [1.0, 2.0])

    def test_label_file_json_shape_and_out_of_range_validation(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'events.json'
            path.write_text(json.dumps({'events': [{'onset': 1, 'trial_type': 'left'}]}), encoding='utf-8')
            self.assertEqual(read_rows(path)[0]['trial_type'], 'left')
        with self.assertRaisesRegex(ValueError, 'outside'):
            normalize_rows([{'onset': 11, 'label': 'late'}], sfreq=250, recording_duration=10)

    def test_bids_tsv_semicolon_csv_and_chinese_headers(self):
        with tempfile.TemporaryDirectory() as folder:
            bids = Path(folder) / 'sub-01_task-test_events.tsv'
            bids.write_text('onset\tduration\ttrial_type\n0.5\t0.2\tTarget\n', encoding='utf-8')
            self.assertEqual(read_rows(bids)[0]['trial_type'], 'Target')
            exported = Path(folder) / 'labels.csv'
            exported.write_text('时间;持续时间;标签\n1.0;0.5;闭眼\n', encoding='utf-8')
            rows = read_rows(exported)
            normalized = normalize_rows(rows, sfreq=250, recording_duration=5)
            self.assertEqual(normalized[0], {'onset': 1.0, 'duration': 0.5, 'description': '闭眼'})

    def test_one_based_samples_duplicates_overlaps_and_label_variants(self):
        rows = [
            {'sample': 1, 'duration': 2, 'label': 'Target'},
            {'sample': 1, 'duration': 2, 'label': 'Target'},
            {'sample': 101, 'duration': 1, 'label': 'target'},
        ]
        normalized = normalize_rows(rows, 100, 10, sample_origin=1)
        audited, report = audit_annotations(normalized)
        self.assertEqual(audited[0]['onset'], 0)
        self.assertEqual(len(audited), 2)
        self.assertEqual(report['duplicate_count'], 1)
        self.assertEqual(report['overlap_count'], 1)
        self.assertEqual(report['inconsistent_label_groups'], [['Target', 'target']])

    def test_external_annotation_does_not_duplicate_native_annotation(self):
        import mne
        raw = mne.io.RawArray(np.zeros((1, 500)), mne.create_info(['C3'], 100, ['eeg']), verbose=False)
        raw.set_annotations(mne.Annotations([1.0], [0.2], ['Target']))
        config = {'external_annotations': [{'onset': 1.0, 'duration': 0.2, 'description': 'Target'}]}
        with patch.dict(os.environ, NEUROFLOW_IMPORT_CONFIG=json.dumps(config)):
            apply_config(raw, 'unused.csv')
        self.assertEqual(len(raw.annotations), 1)

    def test_attach_labels_script_persists_only_validated_annotations(self):
        with tempfile.TemporaryDirectory() as folder:
            signal = Path(folder) / 'signal.csv'
            times = np.arange(1000) / 250
            np.savetxt(signal, np.column_stack([times, np.sin(2 * np.pi * 10 * times)]),
                       delimiter=',', header='time,C3', comments='')
            labels = Path(folder) / 'events.tsv'
            labels.write_text('onset\tduration\ttrial_type\n1.0\t0.5\tleft_hand\n2.0\t0\tright_hand\n', encoding='utf-8')
            target = config_path(signal)
            try:
                result = subprocess.run(
                    [sys.executable, str(Path(__file__).with_name('attach_labels.py')), str(signal), str(labels)],
                    env=dict(os.environ, PYTHONIOENCODING='utf-8'), capture_output=True, encoding='utf-8')
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                payload = json.loads(result.stdout)
                self.assertEqual(payload['label_count'], 2)
                self.assertEqual(payload['record']['inspection']['annotation_count'], 2)
                self.assertEqual(payload['record']['inspection']['event_dictionary'], ['left_hand', 'right_hand'])
                saved = json.loads(target.read_text(encoding='utf-8'))['config']
                self.assertEqual(saved['label_source_name'], 'events.tsv')
                self.assertEqual(saved['external_annotations'][0]['description'], 'left_hand')
            finally:
                target.unlink(missing_ok=True)

    def test_label_edit_list_and_delete_commands(self):
        with tempfile.TemporaryDirectory() as folder:
            signal = Path(folder) / 'signal.csv'
            times = np.arange(500) / 100
            np.savetxt(signal, np.column_stack([times, np.sin(times)]), delimiter=',', header='time,C3', comments='')
            script, target = Path(__file__).with_name('attach_labels.py'), config_path(signal)
            environment = dict(os.environ, PYTHONIOENCODING='utf-8')
            try:
                request = {'label_source_name': 'edited', 'sample_origin': 0,
                           'annotations': [{'onset': 1, 'duration': .2, 'description': 'A'}]}
                replaced = subprocess.run([sys.executable, str(script), str(signal), '--replace'], input=json.dumps(request),
                                          env=environment, capture_output=True, encoding='utf-8')
                self.assertEqual(replaced.returncode, 0, replaced.stdout + replaced.stderr)
                listed = subprocess.run([sys.executable, str(script), str(signal), '--list'], env=environment,
                                        capture_output=True, encoding='utf-8')
                self.assertEqual(json.loads(listed.stdout)['annotations'][0]['description'], 'A')
                deleted = subprocess.run([sys.executable, str(script), str(signal), '--delete'], env=environment,
                                         capture_output=True, encoding='utf-8')
                self.assertEqual(deleted.returncode, 0, deleted.stdout + deleted.stderr)
                self.assertNotIn('external_annotations', json.loads(target.read_text(encoding='utf-8'))['config'])
            finally:
                target.unlink(missing_ok=True)

    def test_real_samples_units_names_types_exclusion_and_coordinates(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'data.csv'
            path.write_text('C3,C4,ECG\n10,20,30\n11,22,33\n',encoding='utf-8')
            config={'sampling_rate_hz':250,'unit':'uV','montage':'standard_1020','channels':[
                {'name':'Fp1','type':'eeg','reference':True},
                {'name':'Fp2','type':'eog'}, {'name':'ECG','type':'ecg','drop':True}]}
            with patch.dict(os.environ,NEUROFLOW_IMPORT_CONFIG=json.dumps(config)):
                raw=apply_config(load_structured_raw(path)[0],path)
                self.assertEqual(raw.ch_names,['Fp1','Fp2'])
                self.assertEqual(raw.get_channel_types(),['eeg','eog'])
                np.testing.assert_allclose(raw.get_data()[0],[10e-6,11e-6])
                self.assertIn('Fp1',raw.info['description'])
                self.assertEqual(details(raw,path)['channel_positions'][0]['name'],'Fp1')

    def test_explicit_transposed_csv_and_mat(self):
        with tempfile.TemporaryDirectory() as folder:
            for suffix in ('csv','mat'):
                path=Path(folder)/('data.'+suffix)
                matrix=np.arange(12,dtype=float).reshape(2,6)
                if suffix=='csv': np.savetxt(path,matrix,delimiter=',')
                else: savemat(path,{'data':matrix})
                config={'sampling_rate_hz':250,'unit':'uV','layout':'channels_x_samples'}
                with patch.dict(os.environ,NEUROFLOW_IMPORT_CONFIG=json.dumps(config)):
                    raw=apply_config(load_structured_raw(path)[0],path)
                    np.testing.assert_allclose(raw.get_data(),matrix*1e-6)

    def test_confirmation_persists_only_after_successful_reread(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'data.csv';path.write_text('C3,C4\n10,20\n11,22\n',encoding='utf-8')
            script=Path(__file__).with_name('review_dataset.py')
            config={'sampling_rate_hz':250,'unit':'uV'}
            target=config_path(path)
            try:
                def run(mode,c):
                    return subprocess.run([sys.executable,str(script),str(path),mode],input=json.dumps(c),capture_output=True,encoding='utf-8')
                self.assertEqual(run('preview',config).returncode,0)
                self.assertFalse(target.exists())
                result=run('commit',config);self.assertEqual(result.returncode,0,result.stdout+result.stderr)
                saved=target.read_bytes()
                invalid=dict(config,channels=[{'name':'X','type':'eeg'}])
                self.assertNotEqual(run('commit',invalid).returncode,0)
                self.assertEqual(saved,target.read_bytes())
                raw=apply_config(load_structured_raw(path)[0],path)
                self.assertEqual(raw.info['sfreq'],250)
                np.testing.assert_allclose(raw.get_data()[0],[10e-6,11e-6])
            finally:
                target.unlink(missing_ok=True)


if __name__=='__main__':unittest.main()
