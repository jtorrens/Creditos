const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('creditosNative', {
  openXlsx: (payload) => ipcRenderer.invoke('creditos:open-xlsx', payload),
  savePng: (payload) => ipcRenderer.invoke('creditos:save-png', payload),
  exportPngSequence: (payload) => ipcRenderer.invoke('creditos:export-png-sequence', payload),
  chooseMovPath: (payload) => ipcRenderer.invoke('creditos:choose-mov-path', payload),
  exportMovSequence: (payload) => ipcRenderer.invoke('creditos:export-mov-sequence', payload),
  confirm: (payload) => ipcRenderer.invoke('creditos:confirm', payload),
  getAppInfo: () => ipcRenderer.invoke('creditos:get-app-info'),
  onServerExit: (callback) => {
    ipcRenderer.on('creditos-server-exit', (_event, value) => callback(value));
  },
});
