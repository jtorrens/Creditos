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
const { registerNativeIpcHandlers } = require('./native/ipcHandlers');
const { createPreferenceStore } = require('./native/preferences');
const { createServerProcessManager } = require('./native/serverProcess');

const APP_DISPLAY_NAME = appPackage.productName || appPackage.name || 'Créditos Refactor';
const APP_CHANNEL = process.env.CREDITOS_APP_CHANNEL
  || (/refactor/i.test(`${APP_DISPLAY_NAME} ${appPackage.name || ''} ${appPackage.build && appPackage.build.appId || ''}`) ? 'refactor' : 'production');
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
} = createAppPaths({ app, appChannel: APP_CHANNEL, appDir: __dirname });

let mainWindow = null;
const movExportManager = createMovExportManager();

const serverProcessManager = createServerProcessManager({
  getAppChannel: () => APP_CHANNEL,
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
registerNativeIpcHandlers({
  databaseSync,
  getAppInfo: () => ({
    name: APP_DISPLAY_NAME,
    version: appPackage.version || app.getVersion(),
    platform: process.platform,
    arch: process.arch,
  }),
  ipcMain,
  movExportManager,
  nativeDialogs,
  queuedWritePreference,
  readPreferences,
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
