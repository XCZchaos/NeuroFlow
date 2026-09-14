"""候选配置重新读源文件，成功后原子保存配置；失败不改变已确认版本。"""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from import_review import config_path


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    path = Path(sys.argv[1]).resolve()
    config = json.load(sys.stdin)
    config['confirmed'] = sys.argv[2] == 'commit'
    env = dict(os.environ, NEUROFLOW_IMPORT_CONFIG=json.dumps(config), PYTHONIOENCODING='utf-8')
    run = subprocess.run([sys.executable, str(Path(__file__).with_name('inspect_dataset.py')), str(path)], env=env, capture_output=True, encoding='utf-8')
    if run.returncode:
        print(run.stdout or json.dumps({'ok':False,'message':run.stderr}))
        return 1
    result = json.loads(run.stdout)
    if config['confirmed']:
        if result.get('structure_conflicts'):
            print(json.dumps({'ok':False,'message':'; '.join(result['structure_conflicts'])}))
            return 1
        target = config_path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        stat = path.stat()
        payload = {'fingerprint':[stat.st_size, stat.st_mtime_ns], 'config':config}
        fd, name = tempfile.mkstemp(dir=target.parent, suffix='.tmp')
        try:
            with os.fdopen(fd, 'w', encoding='utf-8') as stream:
                json.dump(payload, stream, ensure_ascii=False)
            os.replace(name, target)
        finally:
            if os.path.exists(name): os.unlink(name)
    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(json.dumps({'ok':False,'message':str(exc)}))
        raise SystemExit(1)
