const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('creditosNative', {
  openXlsx: (payload) => ipcRenderer.invoke('creditos:open-xlsx', payload),
  openImage: (payload) => ipcRenderer.invoke('creditos:open-image', payload),
  openReferenceVideo: (payload) => ipcRenderer.invoke('creditos:open-reference-video', payload),
  savePng: (payload) => ipcRenderer.invoke('creditos:save-png', payload),
  exportPngSequence: (payload) => ipcRenderer.invoke('creditos:export-png-sequence', payload),
  chooseMovPath: (payload) => ipcRenderer.invoke('creditos:choose-mov-path', payload),
  exportMovSequence: (payload) => ipcRenderer.invoke('creditos:export-mov-sequence', payload),
  startMovExport: (payload) => ipcRenderer.invoke('creditos:start-mov-export', payload),
  addMovFrame: (payload) => ipcRenderer.invoke('creditos:add-mov-frame', payload),
  finishMovExport: (payload) => ipcRenderer.invoke('creditos:finish-mov-export', payload),
  cancelMovExport: (payload) => ipcRenderer.invoke('creditos:cancel-mov-export', payload),
  importStyleJsonFiles: (payload) => ipcRenderer.invoke('creditos:import-style-json-files', payload),
  chooseStyleOverrideAction: (payload) => ipcRenderer.invoke('creditos:choose-style-override-action', payload),
  confirm: (payload) => ipcRenderer.invoke('creditos:confirm', payload),
  getAppInfo: () => ipcRenderer.invoke('creditos:get-app-info'),
  analyzeFontAlternates: (payload) => ipcRenderer.invoke('creditos:analyze-font-alternates', payload),
  analyzeFontAlternateInventory: (payload) => ipcRenderer.invoke('creditos:analyze-font-alternate-inventory', payload),
  getDatabaseSyncStatus: () => ipcRenderer.invoke('creditos:get-database-sync-status'),
  syncDatabase: () => ipcRenderer.invoke('creditos:sync-database'),
  forceDatabaseFromGitHub: () => ipcRenderer.invoke('creditos:force-database-from-github'),
  forceDatabaseToGitHub: () => ipcRenderer.invoke('creditos:force-database-to-github'),
  readPreferences: () => ipcRenderer.invoke('creditos:read-preferences'),
  writePreference: (payload) => ipcRenderer.invoke('creditos:write-preference', payload),
  getShotManagerStatus: () => ipcRenderer.invoke('creditos:get-shot-manager-status'),
  listShotManagerProductions: () => ipcRenderer.invoke('creditos:list-shot-manager-productions'),
  getShotManagerProduction: (payload) => ipcRenderer.invoke('creditos:get-shot-manager-production', payload),
  resolveShotManagerOutput: (payload) => ipcRenderer.invoke('creditos:resolve-shot-manager-output', payload),
  onServerExit: (callback) => {
    ipcRenderer.on('creditos-server-exit', (_event, value) => callback(value));
  },
});
