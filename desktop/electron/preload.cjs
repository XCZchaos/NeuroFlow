const { contextBridge, ipcRenderer } = require('electron');
// preload 是渲染页面与 Electron 主进程之间的最小安全桥梁。
// 页面只能调用这里明确暴露的方法，不能直接使用 Node.js 或任意访问文件系统。
contextBridge.exposeInMainWorld('desktop', Object.freeze({
  platform: process.platform,
  selectFiles: () => ipcRenderer.invoke('neuro:select-files'),
  selectBIDSRoot: () => ipcRenderer.invoke('neuro:select-bids-root'),
  loadModelConfig: () => ipcRenderer.invoke('neuro:model-config-load'),
  saveModelConfig: value => ipcRenderer.invoke('neuro:model-config-save', value),
  importModelConfig: () => ipcRenderer.invoke('neuro:model-config-import'),
  showOutput: relativePath => ipcRenderer.invoke('neuro:show-output', relativePath)
}));
