const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('fs/promises');
const http = require('http');
const net = require('net');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const appPackage = require('./package.json');

let mainWindow = null;
let serverProcess = null;
let preferenceWriteQueue = Promise.resolve();
const movExportSessions = new Map();

function windowStatePath() {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function preferencesPath() {
  return path.join(app.getPath('userData'), 'preferences.json');
}

async function readWindowState() {
  try {
    const data = await fs.readFile(windowStatePath(), 'utf8');
    return JSON.parse(data);
  } catch (_error) {
    return {};
  }
}

async function readPreferences() {
  try {
    const data = await fs.readFile(preferencesPath(), 'utf8');
    return JSON.parse(data);
  } catch (_error) {
    return {};
  }
}

async function writePreference(key, value) {
  if (!key) return {};
  const preferences = await readPreferences();
  preferences[key] = value;
  await fs.mkdir(path.dirname(preferencesPath()), { recursive: true });
  await fs.writeFile(preferencesPath(), JSON.stringify(preferences, null, 2));
  return preferences;
}

function queuedWritePreference(key, value) {
  preferenceWriteQueue = preferenceWriteQueue
    .catch(() => ({}))
    .then(() => writePreference(key, value));
  return preferenceWriteQueue;
}

async function writeWindowState(window) {
  if (!window || window.isDestroyed()) return;
  const bounds = window.getBounds();
  const state = {
    ...bounds,
    isMaximized: window.isMaximized(),
  };
  try {
    await fs.writeFile(windowStatePath(), JSON.stringify(state, null, 2));
  } catch (error) {
    console.warn('No se pudo guardar el tamano de ventana:', error.message);
  }
}

function repoRoot() {
  if (app.isPackaged) {
    return process.resourcesPath;
  }
  return path.resolve(__dirname, '..', '..');
}

async function findRepositoryRoot(startPath) {
  let current = path.resolve(startPath);
  while (true) {
    try {
      await fs.access(path.join(current, 'AGENTS.md'));
      await fs.access(path.join(current, 'apps', 'renderer', 'server.py'));
      return current;
    } catch (_error) {
      const parent = path.dirname(current);
      if (parent === current) return null;
      current = parent;
    }
  }
}

async function persistentDatabasePath() {
  if (process.env.CREDITOS_DB_PATH) return process.env.CREDITOS_DB_PATH;

  const searchStarts = app.isPackaged
    ? [process.resourcesPath, path.dirname(process.execPath)]
    : [repoRoot()];
  for (const start of searchStarts) {
    const root = await findRepositoryRoot(start);
    if (root) return path.join(root, 'data', 'creditos.db');
  }

  return path.join(app.getPath('userData'), 'data', 'creditos.db');
}

function rendererPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'renderer')
    : path.join(repoRoot(), 'apps', 'renderer');
}

function serverScriptPath() {
  return path.join(rendererPath(), 'server.py');
}

function getPythonCommand() {
  if (process.env.CREDITOS_PYTHON) return process.env.CREDITOS_PYTHON;
  return process.platform === 'win32' ? 'py' : 'python3';
}

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

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

function waitForServer(url, timeoutMs = 10000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });
      request.on('error', (error) => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(error);
          return;
        }
        setTimeout(check, 150);
      });
      request.setTimeout(1000, () => request.destroy());
    };
    check();
  });
}

async function startPythonServer() {
  const port = await findFreePort();
  const scriptPath = serverScriptPath();
  const pythonCommand = getPythonCommand();
  const dbPath = await persistentDatabasePath();

  serverProcess = spawn(pythonCommand, [scriptPath, String(port), '--no-open'], {
    cwd: rendererPath(),
    env: {
      ...process.env,
      CREDITOS_DB_PATH: dbPath,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProcess.stdout.on('data', (chunk) => {
    console.log(`[creditos-server] ${chunk.toString().trim()}`);
  });
  serverProcess.stderr.on('data', (chunk) => {
    console.error(`[creditos-server] ${chunk.toString().trim()}`);
  });
  serverProcess.on('exit', (code, signal) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('creditos-server-exit', { code, signal });
    }
    serverProcess = null;
  });

  const url = `http://127.0.0.1:${port}`;
  await waitForServer(url);
  return url;
}

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
    title: 'Créditos',
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

function stopPythonServer() {
  if (!serverProcess) return;
  serverProcess.kill();
  serverProcess = null;
}

function pngFilters() {
  return [{ name: 'PNG', extensions: ['png'] }];
}

function imageFilters() {
  return [{ name: 'Imagen', extensions: ['png', 'jpg', 'jpeg'] }];
}

function referenceVideoFilters() {
  return [{ name: 'Video', extensions: ['mov', 'mp4', 'm4v', 'webm'] }];
}

function jsonFilters() {
  return [{ name: 'JSON', extensions: ['json'] }];
}

function movFilters() {
  return [{ name: 'QuickTime Movie', extensions: ['mov'] }];
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

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
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

async function finalizeMovExport(tempDir, outputPath, fps) {
  const ffmpegPath = await resolveFfmpegPath();
  await runCommand(ffmpegPath, [
    '-y',
    '-framerate', String(fps),
    '-start_number', '0',
    '-i', path.join(tempDir, 'frame_%08d.png'),
    '-c:v', 'prores_ks',
    '-profile:v', '4',
    '-pix_fmt', 'yuva444p10le',
    '-alpha_bits', '16',
    '-vendor', 'apl0',
    outputPath,
  ]);
}

ipcMain.handle('creditos:get-app-info', async () => {
  return {
    name: appPackage.productName || appPackage.name || 'Créditos',
    version: appPackage.version || app.getVersion(),
    platform: process.platform,
    arch: process.arch,
  };
});

ipcMain.handle('creditos:open-xlsx', async (_event, payload) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Abrir XLSX',
    defaultPath: payload && payload.defaultPath ? payload.defaultPath : undefined,
    properties: ['openFile'],
    filters: [{ name: 'Excel', extensions: ['xlsx'] }],
  });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  const filePath = result.filePaths[0];
  const bytes = await fs.readFile(filePath);
  return { canceled: false, filePath, name: path.basename(filePath), base64: bytes.toString('base64') };
});

ipcMain.handle('creditos:open-image', async (_event, payload) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Asociar imagen',
    defaultPath: payload && payload.defaultPath ? payload.defaultPath : undefined,
    properties: ['openFile'],
    filters: imageFilters(),
  });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  const filePath = result.filePaths[0];
  const bytes = await fs.readFile(filePath);
  const extension = path.extname(filePath).toLowerCase();
  const mime = extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' : 'image/png';
  return { canceled: false, filePath, name: path.basename(filePath), mime, base64: bytes.toString('base64') };
});

ipcMain.handle('creditos:open-reference-video', async (_event, payload) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Asociar video de referencia',
    defaultPath: payload && payload.defaultPath ? payload.defaultPath : undefined,
    properties: ['openFile'],
    filters: referenceVideoFilters(),
  });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  const filePath = result.filePaths[0];
  return { canceled: false, filePath, name: path.basename(filePath) };
});

ipcMain.handle('creditos:save-png', async (_event, payload) => {
  const bytes = payload && payload.bytes;
  if (!bytes) throw new Error('No hay PNG para guardar.');
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Guardar PNG',
    defaultPath: payload.fileName || 'creditos.png',
    filters: pngFilters(),
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  await fs.writeFile(result.filePath, Buffer.from(bytes));
  return { canceled: false, filePath: result.filePath, name: path.basename(result.filePath) };
});

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

ipcMain.handle('creditos:choose-mov-path', async (_event, payload) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Exportar MOV ProRes 4444',
    defaultPath: payload && payload.defaultPath ? payload.defaultPath : 'creditos.mov',
    filters: movFilters(),
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  const filePath = ensureMovExtension(result.filePath);
  return { canceled: false, filePath, name: path.basename(filePath) };
});

ipcMain.handle('creditos:export-mov-sequence', async (_event, payload) => {
  const pages = (payload && payload.pages) || [];
  const fps = Math.max(1, Math.round(Number(payload && payload.fps) || 25));
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
    await finalizeMovExport(tempDir, outputPath, fps);
    return { canceled: false, filePath: outputPath, name: path.basename(outputPath), frames: frameIndex, fps };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

ipcMain.handle('creditos:start-mov-export', async (_event, payload) => {
  const fps = Math.max(1, Math.round(Number(payload && payload.fps) || 25));
  const outputPath = payload && payload.filePath ? ensureMovExtension(payload.filePath) : null;
  if (!outputPath) throw new Error('No hay ruta de salida para el MOV.');
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'creditos-mov-'));
  const exportId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  movExportSessions.set(exportId, { tempDir, outputPath, fps, frameIndex: 0 });
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
  movExportSessions.delete(exportId);
  try {
    if (!session.frameIndex) throw new Error('No se generaron frames para el MOV.');
    await finalizeMovExport(session.tempDir, session.outputPath, session.fps);
    return { canceled: false, filePath: session.outputPath, name: path.basename(session.outputPath), frames: session.frameIndex, fps: session.fps };
  } finally {
    await fs.rm(session.tempDir, { recursive: true, force: true });
  }
});

ipcMain.handle('creditos:cancel-mov-export', async (_event, payload) => {
  const exportId = payload && payload.exportId;
  const session = movExportSessions.get(exportId);
  if (!session) return { canceled: true };
  movExportSessions.delete(exportId);
  await fs.rm(session.tempDir, { recursive: true, force: true });
  return { canceled: true };
});

ipcMain.handle('creditos:import-style-json-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Importar estilos JSON',
    properties: ['openFile', 'multiSelections'],
    filters: jsonFilters(),
  });
  if (result.canceled || !result.filePaths.length) return { canceled: true };
  const styles = [];
  for (const filePath of result.filePaths) {
    styles.push({
      filePath,
      name: path.basename(filePath),
      text: await fs.readFile(filePath, 'utf8'),
    });
  }
  return { canceled: false, styles };
});

ipcMain.handle('creditos:choose-style-override-action', async (_event, payload) => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Cancelar', 'Descartar overrides', 'Conservar overrides'],
    defaultId: 1,
    cancelId: 0,
    title: 'Cambiar estilo',
    message: payload && payload.message
      ? payload.message
      : 'Esta cartela tiene overrides. ¿Quieres conservarlos o usar exactamente los valores del nuevo estilo?',
    detail: 'Si descartas overrides, la cartela quedará limpia y se verá con los valores del estilo seleccionado.',
  });
  if (result.response === 2) return { action: 'keep' };
  if (result.response === 1) return { action: 'discard' };
  return { action: 'cancel' };
});

ipcMain.handle('creditos:confirm', async (_event, payload) => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Cancelar', payload && payload.confirmLabel ? payload.confirmLabel : 'Aceptar'],
    defaultId: 1,
    cancelId: 0,
    title: payload && payload.title ? payload.title : 'Confirmar',
    message: payload && payload.message ? payload.message : 'Confirmar accion',
  });
  return { confirmed: result.response === 1 };
});

ipcMain.handle('creditos:read-preferences', async () => readPreferences());

ipcMain.handle('creditos:write-preference', async (_event, payload) => {
  return queuedWritePreference(payload && payload.key, payload ? payload.value : undefined);
});

app.whenReady().then(() => {
  createMainWindow().catch((error) => {
    dialog.showErrorBox('No se pudo arrancar Créditos', error.message);
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
    createMainWindow().catch((error) => dialog.showErrorBox('No se pudo abrir Créditos', error.message));
  }
});
