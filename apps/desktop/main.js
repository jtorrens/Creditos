const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const appPackage = require('./package.json');
const { createAppPaths } = require('./native/appPaths');
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

function runGit(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, {
      cwd: options.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      if (error.code === 'ENOENT') {
        reject(new Error('No se encontro Git en este equipo.'));
        return;
      }
      reject(error);
    });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
        return;
      }
      const message = (stderr.trim() || stdout.trim() || `git termino con codigo ${code}`).slice(-4000);
      reject(new Error(message));
    });
  });
}

async function gitOutput(args, cwd) {
  const result = await runGit(args, { cwd });
  return result.stdout;
}

async function gitHasDiff(args, cwd) {
  try {
    await runGit(args, { cwd });
    return false;
  } catch (_error) {
    return true;
  }
}

function parseGitTimestamp(value) {
  const timestamp = Number(String(value || '').trim());
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp * 1000 : null;
}

async function gitUpstream(cwd) {
  try {
    const upstream = await gitOutput(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], cwd);
    if (upstream) return upstream;
  } catch (_error) {
    // Use the shared branch if the local branch has no upstream configured.
  }
  return 'origin/main';
}

async function databaseGitStatus(options = {}) {
  const dbPath = await persistentDatabasePath();
  const repoPath = await repositoryRootForDatabase();
  const unavailable = {
    available: false,
    dbPath,
    repoPath,
    localChanged: false,
    remoteChanged: false,
    remoteAhead: false,
    conflict: false,
    message: 'La DB no esta dentro del repositorio.',
  };

  if (!repoPath) return unavailable;

  const relativeDbPath = path.relative(repoPath, dbPath).split(path.sep).join('/');
  try {
    if (options.fetch) await runGit(['fetch', '--quiet'], { cwd: repoPath });

    const upstream = await gitUpstream(repoPath);
    const localStatus = await gitOutput(['status', '--porcelain', '--', relativeDbPath], repoPath);
    const localStat = await fs.stat(dbPath);
    const localTimestamp = localStat.mtimeMs;
    let remoteTimestamp = null;
    try {
      remoteTimestamp = parseGitTimestamp(await gitOutput(['log', '-1', '--format=%ct', upstream, '--', relativeDbPath], repoPath));
    } catch (_error) {
      remoteTimestamp = null;
    }
    let behindCount = 0;
    try {
      behindCount = Number(await gitOutput(['rev-list', '--count', `HEAD..${upstream}`], repoPath)) || 0;
    } catch (_error) {
      behindCount = 0;
    }
    const workingDiffersFromUpstream = await gitHasDiff(['diff', '--quiet', upstream, '--', relativeDbPath], repoPath);
    const localChanged = Boolean(localStatus) && workingDiffersFromUpstream;
    const upstreamHasDbChange = behindCount > 0
      ? await gitHasDiff(['diff', '--quiet', `HEAD..${upstream}`, '--', relativeDbPath], repoPath)
      : false;
    const remoteIsNewer = remoteTimestamp !== null && remoteTimestamp > localTimestamp + 1000;
    const localIsNewerOrEqual = remoteTimestamp === null || localTimestamp + 1000 >= remoteTimestamp;
    const remoteChanged = workingDiffersFromUpstream && remoteIsNewer;
    const conflict = false;
    let message = 'DB sincronizada.';
    if (remoteChanged) {
      message = 'GitHub tiene una DB mas reciente.';
    } else if (localChanged) {
      message = 'Hay cambios locales de DB pendientes de subir.';
    }

    return {
      available: true,
      dbPath,
      repoPath,
      relativeDbPath,
      upstream,
      localChanged,
      remoteChanged,
      remoteAhead: behindCount > 0,
      upstreamHasDbChange,
      localTimestamp,
      remoteTimestamp,
      localIsNewerOrEqual,
      remoteIsNewer,
      conflict,
      message,
    };
  } catch (error) {
    return {
      ...unavailable,
      available: true,
      relativeDbPath,
      message: error.message,
      error: error.message,
    };
  }
}

async function synchronizeDatabaseWithGit() {
  let status = await databaseGitStatus({ fetch: true });
  if (!status.available || !status.repoPath) {
    throw new Error(status.message || 'La DB no esta dentro del repositorio.');
  }
  if (status.conflict) {
    throw new Error('Hay cambios locales y remotos en la DB. Sincroniza desde Git para resolver el conflicto.');
  }

  if (status.remoteChanged || status.remoteAhead) {
    await runGit(['pull', '--ff-only'], { cwd: status.repoPath });
    status = await databaseGitStatus({ fetch: false });
  }

  if (status.localChanged) {
    await runGit(['add', status.relativeDbPath], { cwd: status.repoPath });
    await runGit(['commit', '-m', 'Update credits database'], { cwd: status.repoPath });
    await runGit(['push'], { cwd: status.repoPath });
  }

  return databaseGitStatus({ fetch: true });
}

async function forceDatabaseFromGitHub() {
  const status = await databaseGitStatus({ fetch: true });
  if (!status.available || !status.repoPath) {
    throw new Error(status.message || 'La DB no esta dentro del repositorio.');
  }
  await stopPythonServerAndWait();
  try {
    await runGit(['checkout', status.upstream, '--', status.relativeDbPath], { cwd: status.repoPath });
    return await databaseGitStatus({ fetch: true });
  } finally {
    await reloadMainWindowServer();
  }
}

async function forceDatabaseToGitHub() {
  const status = await databaseGitStatus({ fetch: true });
  if (!status.available || !status.repoPath) {
    throw new Error(status.message || 'La DB no esta dentro del repositorio.');
  }
  const databaseDiffersFromGitHub = await gitHasDiff(['diff', '--quiet', status.upstream, '--', status.relativeDbPath], status.repoPath);
  if (!status.localChanged && !databaseDiffersFromGitHub) return status;

  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'creditos-db-sync-'));
  const worktreePath = path.join(tempRoot, 'repo');
  const localDbCopy = path.join(tempRoot, 'local.sqlite');
  await fs.copyFile(status.dbPath, localDbCopy);
  try {
    await runGit(['worktree', 'add', '--detach', worktreePath, status.upstream], { cwd: status.repoPath });
    const worktreeDbPath = path.join(worktreePath, status.relativeDbPath);
    await fs.mkdir(path.dirname(worktreeDbPath), { recursive: true });
    await fs.copyFile(localDbCopy, worktreeDbPath);
    const hasChanges = await gitHasDiff(['diff', '--quiet', '--', status.relativeDbPath], worktreePath);
    if (hasChanges) {
      await runGit(['add', status.relativeDbPath], { cwd: worktreePath });
      await runGit(['commit', '-m', 'Update credits database'], { cwd: worktreePath });
      await runGit(['push', 'origin', 'HEAD:main'], { cwd: worktreePath });
    }
    return databaseGitStatus({ fetch: true });
  } finally {
    try {
      await runGit(['worktree', 'remove', '--force', worktreePath], { cwd: status.repoPath });
    } catch (_error) {
      await fs.rm(worktreePath, { recursive: true, force: true });
    }
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
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
  return databaseGitStatus({ fetch: true });
});

ipcMain.handle('creditos:sync-database', async () => {
  return synchronizeDatabaseWithGit();
});

ipcMain.handle('creditos:force-database-from-github', async () => {
  return forceDatabaseFromGitHub();
});

ipcMain.handle('creditos:force-database-to-github', async () => {
  return forceDatabaseToGitHub();
});

ipcMain.handle('creditos:open-xlsx', async (_event, payload) => nativeDialogs.openXlsx(payload));

ipcMain.handle('creditos:open-image', async (_event, payload) => nativeDialogs.openImage(payload));

ipcMain.handle('creditos:open-reference-video', async (_event, payload) => nativeDialogs.openReferenceVideo(payload));

ipcMain.handle('creditos:save-png', async (_event, payload) => nativeDialogs.savePng(payload));

ipcMain.handle('creditos:export-png-sequence', async (_event, payload) => {
  const pages = (payload && payload.pages) || [];
  if (!pages.length) throw new Error('No hay PNGs para exportar.');
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Elegir carpeta de salida PNG',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };

  const directory = result.filePaths[0];
  for (const page of pages) {
    await fs.writeFile(path.join(directory, page.fileName), Buffer.from(page.bytes));
  }
  return { canceled: false, directory, count: pages.length };
});

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
