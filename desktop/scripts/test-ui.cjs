const { spawn } = require('node:child_process');
const path = require('node:path');

// IDE terminals may force Electron into Node compatibility mode. UI regression
// tests need a real hidden BrowserWindow, so remove that inherited flag.
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
const electron = require('electron');
const script = process.argv[2] === 'help' ? 'test-help.cjs' : process.argv[2] === 'models' ? 'test-model-settings.cjs' : process.argv[2] === 'lifecycle' ? 'test-agent-lifecycle.cjs' : process.argv[2] === 'stream' ? 'test-agent-stream.cjs' : process.argv[2] === 'components' ? 'test-components.cjs' : process.argv[2] === 'pages' ? 'test-workspace-pages.cjs' : process.argv[2] === 'ppg' ? 'test-ppg.cjs' : 'test-import-review.cjs';
const child = spawn(electron, [path.join(__dirname, script)], {
  env, stdio: 'inherit', windowsHide: true
});
child.on('error', error => { console.error(error); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
