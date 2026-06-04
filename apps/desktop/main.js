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

function repoRoot() {
  if (app.isPackaged) {
    return process.resourcesPath;
  }
  return path.resolve(__dirname, '..', '..');
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

  serverProcess = spawn(pythonCommand, [scriptPath, String(port), '--no-open'], {
    cwd: rendererPath(),
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
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    title: 'Créditos',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  await mainWindow.loadURL(serverUrl);
}

function stopPythonServer() {
  if (!serverProcess) return;
  serverProcess.kill();
  serverProcess = null;
}

function jsonFilters() {
  return [{ name: 'JSON', extensions: ['json'] }];
}

function pngFilters() {
  return [{ name: 'PNG', extensions: ['png'] }];
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

async function readStyleFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const styles = [];
  for (const entry of entries) {
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== '.json') continue;
    const filePath = path.join(directory, entry.name);
    const text = await fs.readFile(filePath, 'utf8');
    styles.push({ filePath, name: entry.name, text });
  }
  return styles;
}

function preferencesPath() {
  return path.join(app.getPath('userData'), 'preferences.json');
}

async function readPreferences() {
  try {
    return JSON.parse(await fs.readFile(preferencesPath(), 'utf8'));
  } catch (_error) {
    return {};
  }
}

async function writePreferences(preferences) {
  await fs.mkdir(path.dirname(preferencesPath()), { recursive: true });
  await fs.writeFile(preferencesPath(), JSON.stringify(preferences, null, 2), 'utf8');
}

ipcMain.handle('creditos:get-preferences', async () => {
  return await readPreferences();
});

ipcMain.handle('creditos:get-app-info', async () => {
  return {
    name: appPackage.productName || appPackage.name || 'Créditos',
    version: appPackage.version || app.getVersion(),
    platform: process.platform,
    arch: process.arch,
  };
});

ipcMain.handle('creditos:set-preference', async (_event, payload) => {
  const key = payload && payload.key;
  if (!key) return { ok: false };
  const preferences = await readPreferences();
  preferences[key] = payload.value || '';
  await writePreferences(preferences);
  return { ok: true };
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

ipcMain.handle('creditos:open-json', async (_event, payload) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Abrir estructura de créditos',
    defaultPath: payload && payload.defaultPath ? payload.defaultPath : undefined,
    properties: ['openFile'],
    filters: jsonFilters(),
  });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  const filePath = result.filePaths[0];
  const text = await fs.readFile(filePath, 'utf8');
  return { canceled: false, filePath, name: path.basename(filePath), text };
});

ipcMain.handle('creditos:save-json', async (_event, payload) => {
  const data = payload && payload.data;
  if (!data) throw new Error('No hay datos JSON para guardar.');

  let filePath = payload.filePath;
  if (payload.forceSaveAs || !filePath) {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: payload.title || 'Guardar JSON',
      defaultPath: payload.defaultPath || payload.suggestedName || 'creditos.json',
      filters: jsonFilters(),
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    filePath = result.filePath;
  }

  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
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
      const buffer = Buffer.from(bytes);
      for (let repeat = 0; repeat < frameCount; repeat += 1) {
        const frameName = `frame_${String(frameIndex).padStart(8, '0')}.png`;
        await fs.writeFile(path.join(tempDir, frameName), buffer);
        frameIndex += 1;
      }
    }

    if (!frameIndex) throw new Error('No se generaron frames para el MOV.');
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
    return { canceled: false, filePath: outputPath, name: path.basename(outputPath), frames: frameIndex, fps };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

ipcMain.handle('creditos:choose-style-directory', async (_event, payload) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Elegir carpeta de estilos',
    defaultPath: payload && payload.defaultPath ? payload.defaultPath : undefined,
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  const directory = result.filePaths[0];
  const styles = await readStyleFiles(directory);
  return { canceled: false, directory, name: path.basename(directory), styles };
});

ipcMain.handle('creditos:load-style-directory', async (_event, payload) => {
  const directory = payload && payload.directory;
  if (!directory) return { canceled: true };
  const styles = await readStyleFiles(directory);
  return { canceled: false, directory, name: path.basename(directory), styles };
});

ipcMain.handle('creditos:save-style-json', async (_event, payload) => {
  const directory = payload && payload.directory;
  const data = payload && payload.data;
  const fileName = payload && payload.fileName;
  let filePath = payload && payload.filePath
    ? payload.filePath
    : directory && fileName
      ? path.join(directory, fileName)
      : null;
  if (payload && payload.forceSaveAs) {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: payload && payload.forceSaveAs ? 'Guardar como nuevo estilo' : 'Actualizar estilo',
      defaultPath: filePath || fileName || 'estilo.json',
      filters: jsonFilters(),
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    filePath = result.filePath;
  }
  if (!filePath || !data) throw new Error('No hay ruta o datos de estilo para guardar.');
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  return { canceled: false, filePath, name: path.basename(filePath) };
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
