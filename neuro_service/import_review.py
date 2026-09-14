"""导入配置与实际 Raw 共用的验证层。仅保存配置，绝不重写原始采集文件。"""
import hashlib
import json
import os
from pathlib import Path

import mne
import numpy as np


def config_path(path):
    key = hashlib.sha256(os.path.normcase(str(Path(path).resolve())).encode()).hexdigest()
    return Path(__file__).resolve().parent.parent / 'data' / 'import-configs' / (key + '.json')


def get_config(path):
    # 候选配置通过环境变量传给子进程；预览不会覆盖已经确认的版本。
    candidate = os.environ.get('NEUROFLOW_IMPORT_CONFIG')
    if candidate is not None:
        return json.loads(candidate)
    target = config_path(path)
    if not target.exists():
        return {}
    saved = json.loads(target.read_text(encoding='utf-8'))
    stat = Path(path).stat()
    if saved.get('fingerprint') != [stat.st_size, stat.st_mtime_ns]:
        raise ValueError('Source file changed; review import configuration again')
    return saved['config']


def apply_config(raw, path):
    """所有入口都调用本函数。采样率修改表示纠正时基，不执行重采样。"""
    config = get_config(path)
    channels = config.get('channels') or []
    if channels:
        if len(channels) != len(raw.ch_names):
            raise ValueError('Channel configuration does not match matrix axis; preview layout first')
        names = [str(c['name']).strip() for c in channels]
        if any(not n for n in names) or len(set(names)) != len(names):
            raise ValueError('Channel names must be nonempty and unique')
        raw.rename_channels(dict(zip(raw.ch_names, names)))
        raw.set_channel_types({c['name'].strip(): c['type'] for c in channels}, verbose=False)
        drops = [c['name'].strip() for c in channels if c.get('drop')]
        refs = [c['name'].strip() for c in channels if c.get('reference')]
        if set(drops) & set(refs):
            raise ValueError('A reference channel cannot also be excluded')
        if len(drops) == len(names):
            raise ValueError('At least one channel must be retained')
        raw.drop_channels(drops)
    rate = config.get('sampling_rate_hz')
    if rate and abs(float(rate) - raw.info['sfreq']) > 1e-9:
        # 标准格式的采样率来自文件头，不能丢弃传感器/投影等元数据重建 Info。
        # 表格格式在创建 RawArray 前已使用确认的采样率。
        raise ValueError('Sampling rate conflicts with the source header/time column; use resampling for standard files')
    montage = config.get('montage')
    if montage:
        raw.set_montage(mne.channels.make_standard_montage(montage), on_missing='warn', verbose=False)
    # 标记的是采集参考信息；不在导入时偷偷执行重参考。
    refs = [c['name'].strip() for c in channels if c.get('reference')]
    raw.info['description'] = json.dumps({'acquisition_reference_channels': refs}) if refs else raw.info.get('description')
    dictionary = config.get('event_dictionary')
    if isinstance(dictionary, dict):
        raw.annotations.rename(dictionary)
    return raw


def details(raw, path):
    config = get_config(path)
    positions, ranges = [], []
    # 振幅范围来自原始采样点（首 10 秒），不去均值、不抽稀，单位明确为 SI。
    data = raw.get_data(start=0, stop=min(raw.n_times, int(raw.info['sfreq'] * 10)))
    for index, (name, kind) in enumerate(zip(raw.ch_names, raw.get_channel_types())):
        values = data[index]
        ranges.append({'name': name, 'type': kind, 'min': float(values.min()), 'max': float(values.max()), 'peak_to_peak': float(np.ptp(values)), 'unit': 'V' if kind in {'eeg','eog','ecg','emg'} else 'SI'})
        xyz = raw.info['chs'][index]['loc'][:3]
        if np.all(np.isfinite(xyz)) and np.linalg.norm(xyz) > 0:
            positions.append({'name': name, 'x': float(xyz[0]), 'y': float(xyz[1]), 'z': float(xyz[2])})
    return {'channel_types': raw.get_channel_types(), 'channel_positions': positions,
            'reference_channels': [c['name'] for c in config.get('channels',[]) if c.get('reference')],
            'excluded_channels': [c['name'] for c in config.get('channels',[]) if c.get('drop')],
            'amplitude_ranges': ranges, 'amplitude_window_seconds': data.shape[1] / raw.info['sfreq'],
            'import_config': config, 'confirmed_by_user': bool(config.get('confirmed'))}
