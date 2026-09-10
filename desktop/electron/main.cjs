const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('node:path');
let mainWindow;

function createWindow() {
  const window = new BrowserWindow({
    width: 1510, height: 980, minWidth: 1000, minHeight: 720,
    title: 'NeuroFlow · 神经信号工作台', backgroundColor: '#f5f7f8',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true, nodeIntegration: false, sandbox: true
    }
  });
  mainWindow = window;
  window.once('ready-to-show', () => {
    window.show();
    if (window.isMinimized()) window.restore();
    window.focus();
  });
  window.on('closed', () => { if (mainWindow === window) mainWindow = null; });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.loadFile(path.join(__dirname, '../renderer/index.html'));
}
app.whenReady().then(() => {
  // 网页渲染层在安全模式下不能直接读取本地绝对路径。
  // 这里由 Electron 主进程打开系统文件选择框，再通过受控 IPC 返回路径。
  ipcMain.handle('neuro:select-files', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择神经信号数据', properties: ['openFile', 'multiSelections'],
      // filters 只帮助用户筛选文件，不承担最终格式验证；真正验证由 Python 适配器完成。
      filters: [
        { name: '神经信号数据', extensions: ['edf','bdf','gdf','vhdr','set','fif','snirf','nirs','cnt','egi','mff','con','sqd'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    });
    return result.canceled ? [] : result.filePaths;
  });
  createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
