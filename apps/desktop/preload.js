const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('creditosNative', {
  openXlsx: (payload) => ipcRenderer.invoke('creditos:open-xlsx', payload),
  openJson: (payload) => ipcRenderer.invoke('creditos:open-json', payload),
  chooseDatabase: (payload) => ipcRenderer.invoke('creditos:choose-database', payload),
  saveJson: (payload) => ipcRenderer.invoke('creditos:save-json', payload),
  savePng: (payload) => ipcRenderer.invoke('creditos:save-png', payload),
  exportPngSequence: (payload) => ipcRenderer.invoke('creditos:export-png-sequence', payload),
  chooseMovPath: (payload) => ipcRenderer.invoke('creditos:choose-mov-path', payload),
  exportMovSequence: (payload) => ipcRenderer.invoke('creditos:export-mov-sequence', payload),
  chooseStyleDirectory: (payload) => ipcRenderer.invoke('creditos:choose-style-directory', payload),
  loadStyleDirectory: (payload) => ipcRenderer.invoke('creditos:load-style-directory', payload),
  saveStyleJson: (payload) => ipcRenderer.invoke('creditos:save-style-json', payload),
  confirm: (payload) => ipcRenderer.invoke('creditos:confirm', payload),
  getPreferences: () => ipcRenderer.invoke('creditos:get-preferences'),
  getAppInfo: () => ipcRenderer.invoke('creditos:get-app-info'),
  setPreference: (payload) => ipcRenderer.invoke('creditos:set-preference', payload),
  onServerExit: (callback) => {
    ipcRenderer.on('creditos-server-exit', (_event, value) => callback(value));
  },
});
