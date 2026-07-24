function registerNativeIpcHandlers({
  databaseSync,
  fontAlternateAnalyzer,
  getAppInfo,
  ipcMain,
  movExportManager,
  nativeDialogs,
  queuedWritePreference,
  readPreferences,
  shotManagerClient,
}) {
  ipcMain.handle('creditos:get-app-info', async () => getAppInfo());

  ipcMain.handle('creditos:analyze-font-alternates', async (_event, payload) => {
    return fontAlternateAnalyzer.analyze(payload);
  });

  ipcMain.handle('creditos:analyze-font-alternate-inventory', async (_event, payload) => {
    return fontAlternateAnalyzer.analyzeInventory(payload);
  });

  ipcMain.handle('creditos:get-database-sync-status', async () => {
    return databaseSync.databaseGitStatus({ fetch: true });
  });

  ipcMain.handle('creditos:sync-database', async () => {
    return databaseSync.synchronizeDatabaseWithGit();
  });

  ipcMain.handle('creditos:force-database-from-github', async () => {
    return databaseSync.forceDatabaseFromGitHub();
  });

  ipcMain.handle('creditos:force-database-to-github', async () => {
    return databaseSync.forceDatabaseToGitHub();
  });

  ipcMain.handle('creditos:open-xlsx', async (_event, payload) => nativeDialogs.openXlsx(payload));

  ipcMain.handle('creditos:open-image', async (_event, payload) => nativeDialogs.openImage(payload));

  ipcMain.handle('creditos:open-reference-video', async (_event, payload) => nativeDialogs.openReferenceVideo(payload));

  ipcMain.handle('creditos:save-png', async (_event, payload) => nativeDialogs.savePng(payload));

  ipcMain.handle('creditos:export-png-sequence', async (_event, payload) => nativeDialogs.exportPngSequence(payload));

  ipcMain.handle('creditos:choose-mov-path', async (_event, payload) => nativeDialogs.chooseMovPath(payload));

  ipcMain.handle('creditos:export-mov-sequence', async (_event, payload) => movExportManager.exportSequence(payload));

  ipcMain.handle('creditos:start-mov-export', async (_event, payload) => movExportManager.start(payload));

  ipcMain.handle('creditos:add-mov-frame', async (_event, payload) => movExportManager.addFrame(payload));

  ipcMain.handle('creditos:finish-mov-export', async (_event, payload) => movExportManager.finish(payload));

  ipcMain.handle('creditos:cancel-mov-export', async (_event, payload) => movExportManager.cancel(payload));

  ipcMain.handle('creditos:import-style-json-files', async () => nativeDialogs.importStyleJsonFiles());

  ipcMain.handle('creditos:choose-style-override-action', async (_event, payload) => nativeDialogs.chooseStyleOverrideAction(payload));

  ipcMain.handle('creditos:confirm', async (_event, payload) => nativeDialogs.confirm(payload));

  ipcMain.handle('creditos:read-preferences', async () => readPreferences());

  ipcMain.handle('creditos:write-preference', async (_event, payload) => {
    return queuedWritePreference(payload && payload.key, payload ? payload.value : undefined);
  });

  ipcMain.handle('creditos:get-shot-manager-status', async () => {
    return shotManagerClient.getStatus();
  });

  ipcMain.handle('creditos:list-shot-manager-productions', async () => {
    return shotManagerClient.listProductions();
  });

  ipcMain.handle('creditos:get-shot-manager-production', async (_event, payload) => {
    return shotManagerClient.getProduction(payload && payload.productionId);
  });
}

module.exports = { registerNativeIpcHandlers };
