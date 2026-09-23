const { app, BrowserWindow, dialog, ipcMain, safeStorage, shell } = require('electron');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { probeModelCapabilities } = require('./model-capabilities.cjs');
let mainWindow;
let backendProcess;

function modelConfigPath() { return path.join(app.getPath('userData'), 'model-config.bin'); }
function readModelConfig() {
  const target=modelConfigPath();if(!fs.existsSync(target))return null;
  if(!safeStorage.isEncryptionAvailable())throw new Error('Operating-system credential encryption is unavailable');
  return JSON.parse(safeStorage.decryptString(fs.readFileSync(target)));
}
function saveModelConfig(value) {
  if(!safeStorage.isEncryptionAvailable())throw new Error('Operating-system credential encryption is unavailable');
  const previous=readModelConfig()||{},base=String(value.api_base||'').trim(),model=String(value.model||'').trim();
  let parsed;try{parsed=new URL(base);}catch{throw new Error('API Base must be a valid URL');}
  if(!['http:','https:'].includes(parsed.protocol))throw new Error('API Base must use HTTP or HTTPS');
  if(!model)throw new Error('Model name is required');
  const apiKey=String(value.api_key||'').trim()||previous.api_key;
  if(!apiKey)throw new Error('API Key is required');
  const requestedTemperature=Number(value.temperature),temperature=Number.isFinite(requestedTemperature)?Math.max(0,Math.min(2,requestedTemperature)):Number(previous.temperature??1);
  const allowedProviders=new Set(['openai','deepseek','openai-compatible']),provider=allowedProviders.has(value.provider)?value.provider:'openai-compatible';
  const sameEndpoint=previous.api_base===base.replace(/\/$/,'')&&previous.model===model&&previous.provider===provider;
  const capabilities=value.capabilities&&typeof value.capabilities==='object'?{
    detected:Boolean(value.capabilities.detected),availability:Boolean(value.capabilities.availability),temperature:Boolean(value.capabilities.temperature),stream:Boolean(value.capabilities.stream),tool_calling:Boolean(value.capabilities.tool_calling),structured_output:Boolean(value.capabilities.structured_output),tested_at:String(value.capabilities.tested_at||''),details:Object.fromEntries(Object.entries(value.capabilities.details||{}).map(([key,detail])=>[key,String(detail).slice(0,500)]))
  }:(Object.prototype.hasOwnProperty.call(value,'capabilities')?null:(sameEndpoint?previous.capabilities||null:null));
  const config={provider,api_base:base.replace(/\/$/,''),model,api_key:apiKey,max_tokens:Math.max(128,Math.min(32768,Number(value.max_tokens)||4096)),temperature,capabilities};
  fs.mkdirSync(path.dirname(modelConfigPath()),{recursive:true});fs.writeFileSync(modelConfigPath(),safeStorage.encryptString(JSON.stringify(config)),{mode:0o600});return config;
}
function publicModelConfig(config) { return config?{provider:config.provider,api_base:config.api_base,model:config.model,max_tokens:config.max_tokens,temperature:Number(config.temperature??1),capabilities:config.capabilities||null,has_api_key:Boolean(config.api_key)}:{provider:'openai-compatible',api_base:'https://api.openai.com/v1',model:'gpt-5',max_tokens:4096,temperature:1,capabilities:null,has_api_key:false}; }

async function testModelConfig(value){const previous=readModelConfig()||{},candidate={...previous,...value,api_key:String(value.api_key||'').trim()||previous.api_key};return probeModelCapabilities(candidate);}
function bundledBackendPath(){
  const name=process.platform==='win32'?'neuroflow-backend.exe':'neuroflow-backend';
  return [path.join(process.resourcesPath,'backend',name),path.join(process.resourcesPath,name),path.resolve(__dirname,'..','backend',name)].find(fs.existsSync);
}
function startBundledBackend(){
  const executable=bundledBackendPath(),config=readModelConfig();if(!executable||!config)return false;
  const template=path.join(process.resourcesPath,'config','config_template.json');if(!fs.existsSync(template))return false;
  if(backendProcess){backendProcess.kill();backendProcess=null;}
  backendProcess=spawn(executable,[],{cwd:path.dirname(executable),windowsHide:true,env:{...process.env,
    NEUROFLOW_CONFIG_FILE:template,NEUROFLOW_LLM_API_KEY:config.api_key,NEUROFLOW_LLM_API_BASE:config.api_base,
    NEUROFLOW_LLM_MODEL:config.model,NEUROFLOW_LLM_PROVIDER:config.provider,NEUROFLOW_LLM_MAX_TOKENS:String(config.max_tokens),NEUROFLOW_LLM_TEMPERATURE:String(config.temperature??1),
    NEUROFLOW_LLM_CAPABILITIES_DETECTED:String(Boolean(config.capabilities?.detected)),NEUROFLOW_LLM_SUPPORTS_TEMPERATURE:String(Boolean(config.capabilities?.temperature))}});
  backendProcess.on('exit',()=>{backendProcess=null;});return true;
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1510, height: 980, minWidth: 1000, minHeight: 720,
    title: `NeuroFlow v${require('../package.json').version.replace(/\.0$/, '')} · 神经信号工作台`, backgroundColor: '#f5f7f8',
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
  ipcMain.handle('neuro:model-config-load',()=>publicModelConfig(readModelConfig()));
  ipcMain.handle('neuro:model-config-save',(_event,value)=>{const saved=saveModelConfig(value||{});return {...publicModelConfig(saved),backend_restarted:startBundledBackend()};});
  ipcMain.handle('neuro:model-config-test',async(_event,value)=>testModelConfig(value||{}));
  ipcMain.handle('neuro:model-config-import',async()=>{
    const result=await dialog.showOpenDialog(mainWindow,{title:'Import LLM configuration',properties:['openFile'],filters:[{name:'JSON',extensions:['json']}]});
    if(result.canceled)return null;
    const document=JSON.parse(fs.readFileSync(result.filePaths[0],'utf8')),value=document.openai||document;
    const saved=saveModelConfig(value);return {...publicModelConfig(saved),backend_restarted:startBundledBackend()};
  });
  // 网页渲染层在安全模式下不能直接读取本地绝对路径。
  // 这里由 Electron 主进程打开系统文件选择框，再通过受控 IPC 返回路径。
  ipcMain.handle('neuro:select-files', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择神经信号数据', properties: ['openFile', 'multiSelections'],
      // filters 只帮助用户筛选文件，不承担最终格式验证；真正验证由 Python 适配器完成。
      filters: [
        { name: '神经信号数据', extensions: ['edf','bdf','gdf','vhdr','set','fif','snirf','nirs','cnt','egi','mff','con','sqd','csv','tsv','txt','mat','bin','dat','raw'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    });
    return result.canceled ? [] : result.filePaths;
  });
  ipcMain.handle('neuro:select-label-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择配套标签文件', properties: ['openFile'],
      filters: [
        { name: '事件或阶段标签', extensions: ['csv', 'tsv', 'json'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    });
    return result.canceled ? null : result.filePaths[0];
  });
  ipcMain.handle('neuro:select-bids-root', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择 BIDS 数据集根目录', properties: ['openDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
  });
  // 只允许定位项目 outputs 目录内由分析器生成的结果，拒绝任意绝对路径和目录穿越。
  ipcMain.handle('neuro:show-output', async (_event, relativePath) => {
    const projectRoot = path.resolve(__dirname, '..', '..');
    const outputRoot = path.resolve(projectRoot, 'outputs');
    const target = path.resolve(projectRoot, String(relativePath || ''));
    if (!(target === outputRoot || target.startsWith(`${outputRoot}${path.sep}`)) || !fs.existsSync(target)) {
      throw new Error('输出文件不存在或路径无效');
    }
    shell.showItemInFolder(target);
    return true;
  });
  createWindow();
  startBundledBackend();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
app.on('window-all-closed', () => { if(backendProcess)backendProcess.kill();if (process.platform !== 'darwin') app.quit(); });
