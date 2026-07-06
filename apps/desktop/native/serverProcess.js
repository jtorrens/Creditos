const http = require('http');
const net = require('net');
const { spawn } = require('child_process');

function createServerProcessManager({
  getAppChannel = () => 'production',
  getMainWindow,
  getPersistentDatabasePath,
  getRendererPath,
  getServerScriptPath,
}) {
  let serverProcess = null;

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

  function getPythonCommand() {
    if (process.env.CREDITOS_PYTHON) return process.env.CREDITOS_PYTHON;
    return process.platform === 'win32' ? 'py' : 'python3';
  }

  async function startPythonServer() {
    const port = await findFreePort();
    const scriptPath = getServerScriptPath();
    const pythonCommand = getPythonCommand();
    const dbPath = await getPersistentDatabasePath();

    serverProcess = spawn(pythonCommand, [scriptPath, String(port), '--no-open'], {
      cwd: getRendererPath(),
      env: {
        ...process.env,
        CREDITOS_APP_CHANNEL: getAppChannel(),
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
      const mainWindow = getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('creditos-server-exit', { code, signal });
      }
      serverProcess = null;
    });

    const url = `http://127.0.0.1:${port}`;
    await waitForServer(url);
    return url;
  }

  function stopPythonServer() {
    if (!serverProcess) return;
    serverProcess.kill();
    serverProcess = null;
  }

  function stopPythonServerAndWait(timeoutMs = 3000) {
    if (!serverProcess) return Promise.resolve();
    const processToStop = serverProcess;
    serverProcess = null;
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      const timer = setTimeout(() => {
        try {
          if (!processToStop.killed) processToStop.kill('SIGKILL');
        } catch (_error) {
          // The process may already be gone.
        }
        finish();
      }, timeoutMs);
      processToStop.once('exit', () => {
        clearTimeout(timer);
        finish();
      });
      try {
        processToStop.kill();
      } catch (_error) {
        clearTimeout(timer);
        finish();
      }
    });
  }

  return {
    findFreePort,
    startPythonServer,
    stopPythonServer,
    stopPythonServerAndWait,
    waitForServer,
  };
}

module.exports = { createServerProcessManager };
