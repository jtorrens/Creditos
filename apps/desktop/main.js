const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const appPackage = require('./package.json');
const { createAppPaths } = require('./native/appPaths');
const { createNativeDialogs } = require('./native/dialogs');
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
const movExportSessions = new Map();

async function resolveExecutable(envName, executable, extraCandidates = []) {
  if (process.env[envName]) return process.env[envName];

  const names = process.platform === 'win32'
    ? [`${executable}.exe`, executable]
    : [executable];
  const pathEntries = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
  const candidates = [
    ...pathEntries.flatMap((entry) => names.map((name) => path.join(entry, name))),
    ...extraCandidates,
  ];

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch (_error) {
      // Try the next known location.
    }
  }

  return executable;
}

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

function ensureMovExtension(filePath) {
  return path.extname(filePath).toLowerCase() === '.mov' ? filePath : `${filePath}.mov`;
}

async function resolveFfmpegPath() {
  return resolveExecutable('CREDITOS_FFMPEG', 'ffmpeg', [
    '/opt/homebrew/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
    '/usr/bin/ffmpeg',
  ]);
}

async function resolveFfprobePath() {
  return resolveExecutable('CREDITOS_FFPROBE', 'ffprobe', [
    '/opt/homebrew/bin/ffprobe',
    '/usr/local/bin/ffprobe',
    '/usr/bin/ffprobe',
  ]);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    if (options.onSpawn) options.onSpawn(child);
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      if (error.code === 'ENOENT') {
        reject(new Error('No se encontro ffmpeg. Instala ffmpeg y vuelve a exportar el MOV.'));
        return;
      }
      reject(error);
    });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error((stderr.trim() || `ffmpeg termino con codigo ${code}`).slice(-4000)));
    });
  });
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

async function writeMovFrameSequence(tempDir, bytes, frameCount, startIndex) {
  const buffer = Buffer.from(bytes);
  let frameIndex = startIndex;
  for (let repeat = 0; repeat < frameCount; repeat += 1) {
    const frameName = `frame_${String(frameIndex).padStart(8, '0')}.png`;
    await fs.writeFile(path.join(tempDir, frameName), buffer);
    frameIndex += 1;
  }
  return frameIndex;
}

const MOV_ENCODING_ARGS = {
  prores_proxy: ['-c:v', 'prores_ks', '-profile:v', '0', '-pix_fmt', 'yuv422p10le', '-vendor', 'apl0'],
  prores_lt: ['-c:v', 'prores_ks', '-profile:v', '1', '-pix_fmt', 'yuv422p10le', '-vendor', 'apl0'],
  prores_422: ['-c:v', 'prores_ks', '-profile:v', '2', '-pix_fmt', 'yuv422p10le', '-vendor', 'apl0'],
  prores_422_hq: ['-c:v', 'prores_ks', '-profile:v', '3', '-pix_fmt', 'yuv422p10le', '-vendor', 'apl0'],
  prores_4444: ['-c:v', 'prores_ks', '-profile:v', '4', '-pix_fmt', 'yuva444p10le', '-alpha_bits', '16', '-vendor', 'apl0'],
  prores_4444_xq: ['-c:v', 'prores_ks', '-profile:v', '5', '-pix_fmt', 'yuva444p10le', '-alpha_bits', '16', '-vendor', 'apl0'],
  h264_light: ['-c:v', 'libx264', '-preset', 'medium', '-b:v', '8M', '-maxrate', '10M', '-bufsize', '16M', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'],
  h264_standard: ['-c:v', 'libx264', '-preset', 'medium', '-b:v', '20M', '-maxrate', '25M', '-bufsize', '40M', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'],
  h264_high: ['-c:v', 'libx264', '-preset', 'slow', '-b:v', '40M', '-maxrate', '50M', '-bufsize', '80M', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'],
};

function normalizeMovEncodingProfile(value) {
  return Object.prototype.hasOwnProperty.call(MOV_ENCODING_ARGS, value) ? value : 'prores_4444';
}

async function finalizeMovExport(tempDir, outputPath, fps, encodingProfile = 'prores_4444', options = {}) {
  const ffmpegPath = await resolveFfmpegPath();
  const profile = normalizeMovEncodingProfile(encodingProfile);
  await runCommand(ffmpegPath, [
    '-y',
    '-framerate', String(fps),
    '-start_number', '0',
    '-i', path.join(tempDir, 'frame_%08d.png'),
    ...MOV_ENCODING_ARGS[profile],
    outputPath,
  ], options);
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

ipcMain.handle('creditos:export-mov-sequence', async (_event, payload) => {
  const pages = (payload && payload.pages) || [];
  const fps = Math.max(1, Math.round(Number(payload && payload.fps) || 25));
  const encodingProfile = normalizeMovEncodingProfile(payload && payload.encodingProfile);
  const outputPath = payload && payload.filePath ? ensureMovExtension(payload.filePath) : null;
  if (!outputPath) throw new Error('No hay ruta de salida para el MOV.');
  if (!pages.length) throw new Error('No hay páginas para exportar.');

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'creditos-mov-'));
  let frameIndex = 0;
  try {
    for (const page of pages) {
      const bytes = page && page.bytes;
      if (!bytes) continue;
      const frameCount = Math.max(1, Math.round(Number(page.frameCount) || 1));
      frameIndex = await writeMovFrameSequence(tempDir, bytes, frameCount, frameIndex);
    }

    if (!frameIndex) throw new Error('No se generaron frames para el MOV.');
    await finalizeMovExport(tempDir, outputPath, fps, encodingProfile);
    return { canceled: false, filePath: outputPath, name: path.basename(outputPath), frames: frameIndex, fps };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

ipcMain.handle('creditos:start-mov-export', async (_event, payload) => {
  const fps = Math.max(1, Math.round(Number(payload && payload.fps) || 25));
  const encodingProfile = normalizeMovEncodingProfile(payload && payload.encodingProfile);
  const outputPath = payload && payload.filePath ? ensureMovExtension(payload.filePath) : null;
  if (!outputPath) throw new Error('No hay ruta de salida para el MOV.');
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'creditos-mov-'));
  const exportId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  movExportSessions.set(exportId, { tempDir, outputPath, fps, encodingProfile, frameIndex: 0 });
  return { exportId };
});

ipcMain.handle('creditos:add-mov-frame', async (_event, payload) => {
  const session = movExportSessions.get(payload && payload.exportId);
  if (!session) throw new Error('La sesión de exportación MOV ya no existe.');
  const bytes = payload && payload.bytes;
  if (!bytes) return { frames: session.frameIndex };
  const frameCount = Math.max(1, Math.round(Number(payload && payload.frameCount) || 1));
  session.frameIndex = await writeMovFrameSequence(session.tempDir, bytes, frameCount, session.frameIndex);
  return { frames: session.frameIndex };
});

ipcMain.handle('creditos:finish-mov-export', async (_event, payload) => {
  const exportId = payload && payload.exportId;
  const session = movExportSessions.get(exportId);
  if (!session) throw new Error('La sesión de exportación MOV ya no existe.');
  session.finalizing = true;
  try {
    if (!session.frameIndex) throw new Error('No se generaron frames para el MOV.');
    await finalizeMovExport(session.tempDir, session.outputPath, session.fps, session.encodingProfile, {
      onSpawn: (child) => {
        session.ffmpegProcess = child;
        if (session.cancelRequested) child.kill('SIGTERM');
      },
    });
    return { canceled: false, filePath: session.outputPath, name: path.basename(session.outputPath), frames: session.frameIndex, fps: session.fps };
  } finally {
    movExportSessions.delete(exportId);
    await fs.rm(session.tempDir, { recursive: true, force: true });
    if (session.cancelRequested) await fs.rm(session.outputPath, { force: true });
  }
});

ipcMain.handle('creditos:cancel-mov-export', async (_event, payload) => {
  const exportId = payload && payload.exportId;
  const session = movExportSessions.get(exportId);
  if (!session) return { canceled: true };
  if (session.finalizing) {
    session.cancelRequested = true;
    if (session.ffmpegProcess) session.ffmpegProcess.kill('SIGTERM');
    return { canceled: true };
  }
  movExportSessions.delete(exportId);
  await fs.rm(session.tempDir, { recursive: true, force: true });
  return { canceled: true };
});

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
