const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const bundledFfmpegPath = require('ffmpeg-static');

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

function ensureMovExtension(filePath) {
  return path.extname(filePath).toLowerCase() === '.mov' ? filePath : `${filePath}.mov`;
}

function normalizeMovEncodingProfile(value) {
  return Object.prototype.hasOwnProperty.call(MOV_ENCODING_ARGS, value) ? value : 'prores_4444';
}

async function resolveExecutable(envName, executable, extraCandidates = []) {
  if (process.env[envName]) return process.env[envName];

  const names = process.platform === 'win32'
    ? [`${executable}.exe`, executable]
    : [executable];
  const pathEntries = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
  const candidates = [
    ...extraCandidates,
    ...pathEntries.flatMap((entry) => names.map((name) => path.join(entry, name))),
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

async function resolveFfmpegPath() {
  const executablePath = bundledFfmpegPath
    ? bundledFfmpegPath.replace(`${path.sep}app.asar${path.sep}`, `${path.sep}app.asar.unpacked${path.sep}`)
    : null;
  return resolveExecutable('CREDITOS_FFMPEG', 'ffmpeg', [executablePath].filter(Boolean));
}

async function resolveFfprobePath() {
  return resolveExecutable('CREDITOS_FFPROBE', 'ffprobe');
}

function runFfmpeg(command, args, options = {}) {
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

async function finalizeMovExport(tempDir, outputPath, fps, encodingProfile = 'prores_4444', options = {}) {
  const ffmpegPath = await resolveFfmpegPath();
  const profile = normalizeMovEncodingProfile(encodingProfile);
  await runFfmpeg(ffmpegPath, [
    options.preventOverwrite ? '-n' : '-y',
    '-framerate', String(fps),
    '-start_number', '0',
    '-i', path.join(tempDir, 'frame_%08d.png'),
    ...MOV_ENCODING_ARGS[profile],
    outputPath,
  ], options);
}

function createMovExportManager() {
  const sessions = new Map();

  async function exportSequence(payload) {
    const pages = (payload && payload.pages) || [];
    const fps = Math.max(1, Math.round(Number(payload && payload.fps) || 25));
    const encodingProfile = normalizeMovEncodingProfile(payload && payload.encodingProfile);
    const outputPath = payload && payload.filePath ? ensureMovExtension(payload.filePath) : null;
    const preventOverwrite = payload && payload.preventOverwrite === true;
    if (!outputPath) throw new Error('No hay ruta de salida para el MOV.');
    if (!pages.length) throw new Error('No hay páginas para exportar.');
    if (preventOverwrite) await assertOutputAvailable(outputPath);

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
      await finalizeMovExport(tempDir, outputPath, fps, encodingProfile, {
        preventOverwrite,
      });
      return { canceled: false, filePath: outputPath, name: path.basename(outputPath), frames: frameIndex, fps };
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }

  async function start(payload) {
    const fps = Math.max(1, Math.round(Number(payload && payload.fps) || 25));
    const encodingProfile = normalizeMovEncodingProfile(payload && payload.encodingProfile);
    const outputPath = payload && payload.filePath ? ensureMovExtension(payload.filePath) : null;
    const preventOverwrite = payload && payload.preventOverwrite === true;
    if (!outputPath) throw new Error('No hay ruta de salida para el MOV.');
    if (preventOverwrite) await assertOutputAvailable(outputPath);
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'creditos-mov-'));
    const exportId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessions.set(exportId, {
      tempDir,
      outputPath,
      fps,
      encodingProfile,
      preventOverwrite,
      frameIndex: 0,
    });
    return { exportId };
  }

  async function addFrame(payload) {
    const session = sessions.get(payload && payload.exportId);
    if (!session) throw new Error('La sesión de exportación MOV ya no existe.');
    const bytes = payload && payload.bytes;
    if (!bytes) return { frames: session.frameIndex };
    const frameCount = Math.max(1, Math.round(Number(payload && payload.frameCount) || 1));
    session.frameIndex = await writeMovFrameSequence(session.tempDir, bytes, frameCount, session.frameIndex);
    return { frames: session.frameIndex };
  }

  async function finish(payload) {
    const exportId = payload && payload.exportId;
    const session = sessions.get(exportId);
    if (!session) throw new Error('La sesión de exportación MOV ya no existe.');
    session.finalizing = true;
    try {
      if (!session.frameIndex) throw new Error('No se generaron frames para el MOV.');
      if (session.preventOverwrite) {
        await assertOutputAvailable(session.outputPath);
      }
      await finalizeMovExport(session.tempDir, session.outputPath, session.fps, session.encodingProfile, {
        preventOverwrite: session.preventOverwrite,
        onSpawn: (child) => {
          session.ffmpegProcess = child;
          if (session.cancelRequested) child.kill('SIGTERM');
        },
      });
      return { canceled: false, filePath: session.outputPath, name: path.basename(session.outputPath), frames: session.frameIndex, fps: session.fps };
    } finally {
      sessions.delete(exportId);
      await fs.rm(session.tempDir, { recursive: true, force: true });
      if (session.cancelRequested) await fs.rm(session.outputPath, { force: true });
    }
  }

  async function cancel(payload) {
    const exportId = payload && payload.exportId;
    const session = sessions.get(exportId);
    if (!session) return { canceled: true };
    if (session.finalizing) {
      session.cancelRequested = true;
      if (session.ffmpegProcess) session.ffmpegProcess.kill('SIGTERM');
      return { canceled: true };
    }
    sessions.delete(exportId);
    await fs.rm(session.tempDir, { recursive: true, force: true });
    return { canceled: true };
  }

  return {
    addFrame,
    cancel,
    exportSequence,
    finish,
    start,
  };
}

async function assertOutputAvailable(outputPath) {
  let parent;
  try {
    parent = await fs.lstat(path.dirname(outputPath));
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      throw new Error(
        'La carpeta oficial no existe. Actualiza la estructura en disco desde Shot Manager.',
      );
    }
    throw error;
  }
  if (!parent.isDirectory() || parent.isSymbolicLink()) {
    throw new Error('La carpeta oficial de salida no es una carpeta segura.');
  }
  try {
    await fs.lstat(outputPath);
  } catch (error) {
    if (error && error.code === 'ENOENT') return;
    throw error;
  }
  throw new Error(
    'La versión oficial ya existe. Vuelve a exportar para resolver la siguiente versión.',
  );
}

module.exports = {
  createMovExportManager,
  assertOutputAvailable,
  ensureMovExtension,
  normalizeMovEncodingProfile,
  resolveFfmpegPath,
  resolveFfprobePath,
};
