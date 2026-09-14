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


class ImportReviewTests(unittest.TestCase):
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
