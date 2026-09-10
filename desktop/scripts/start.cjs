const { spawn } = require('node:child_process');
const path = require('node:path');

// Some terminal hosts export this flag for their own Electron runtime.
// It must not leak into our desktop process, or Electron runs as plain Node.js.
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
let electron;
try {
  electron = require('electron');
} catch (error) {
  console.error('Electron is not installed. Run npm install, or on Windows: powershell -File scripts/install.ps1');
  process.exit(1);
}
const child = spawn(electron, [path.resolve(__dirname, '..'), ...process.argv.slice(2)], {
  env, stdio: 'inherit', windowsHide: false
});
child.on('error', error => { console.error(`Unable to start Electron: ${error.message}`); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
