console.log('preload loaded');
// preload.js: Electron Preload Script
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveAsFile: (content) => ipcRenderer.invoke('dialog:saveAsFile', content),
  saveFile: (filePath, content) => ipcRenderer.invoke('dialog:saveFile', { filePath, content }),
  on: (channel, callback) => ipcRenderer.on(channel, callback), // メッセージリスナー
});
