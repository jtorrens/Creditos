const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const appPackage = require('./package.json');
const { createAppPaths } = require('./native/appPaths');
const { createDatabaseSync } = require('./native/databaseSync');
const { createNativeDialogs } = require('./native/dialogs');
const {
  createMovExportManager,
  ensureMovExtension,
  normalizeMovEncodingProfile,
} = require('./native/movExport');
const { createPreferenceStore } = require('./native/preferences');
const { createServerProcessManager } = require('./native/serverProcess');

const APP_DISPLAY_NAME = appPackage.productName || appPackage.name || 'Créditos Refactor';
const {
  readWindowState,
  readPreferences,
  queuedWritePreference,
  writeWindowState,
} = createPreferenceStore({ getUserDataPath: () => app.getPath('userData') });
const {
  persistentDatabasePath,
  rendererPath,
  repoRoot,
  repositoryRootForDatabase,
  serverScriptPath,
} = createAppPaths({ app, appDir: __dirname });

let mainWindow = null;
const movExportManager = createMovExportManager();

const serverProcessManager = createServerProcessManager({
  getMainWindow: () => mainWindow,
  getPersistentDatabasePath: persistentDatabasePath,
  getRendererPath: rendererPath,
  getServerScriptPath: serverScriptPath,
});
const {
  startPythonServer,
  stopPythonServer,
  stopPythonServerAndWait,
} = serverProcessManager;
const nativeDialogs = createNativeDialogs({
  dialog,
  ensureMovExtension,
  getMainWindow: () => mainWindow,
  normalizeMovEncodingProfile,
});
const databaseSync = createDatabaseSync({
  getPersistentDatabasePath: persistentDatabasePath,
  getRepositoryRootForDatabase: repositoryRootForDatabase,
  reloadMainWindowServer,
  stopPythonServerAndWait,
});

async function createMainWindow() {
  const serverUrl = await startPythonServer();
  const windowState = await readWindowState();
  mainWindow = new BrowserWindow({
    width: Number(windowState.width) || 1440,
    height: Number(windowState.height) || 960,
    x: Number.isFinite(Number(windowState.x)) ? Number(windowState.x) : undefined,
    y: Number.isFinite(Number(windowState.y)) ? Number(windowState.y) : undefined,
    minWidth: 1100,
    minHeight: 720,
    title: APP_DISPLAY_NAME,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  if (windowState.isMaximized) mainWindow.maximize();
  mainWindow.on('close', () => {
    writeWindowState(mainWindow);
  });

  await mainWindow.loadURL(serverUrl);
}

async function reloadMainWindowServer() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const serverUrl = await startPythonServer();
  await mainWindow.loadURL(serverUrl);
}

ipcMain.handle('creditos:get-app-info', async () => {
  return {
    name: APP_DISPLAY_NAME,
    version: appPackage.version || app.getVersion(),
    platform: process.platform,
    arch: process.arch,
  };
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

app.whenReady().then(() => {
  createMainWindow().catch((error) => {
    dialog.showErrorBox(`No se pudo arrancar ${APP_DISPLAY_NAME}`, error.message);
    app.quit();
  });
});

app.on('window-all-closed', () => {
  stopPythonServer();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', stopPythonServer);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow().catch((error) => dialog.showErrorBox(`No se pudo abrir ${APP_DISPLAY_NAME}`, error.message));
  }
});
