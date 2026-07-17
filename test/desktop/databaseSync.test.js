const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { createDatabaseSync } = require('../../apps/desktop/native/databaseSync');

function createChild(pid) {
  const child = new EventEmitter();
  child.pid = pid;
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = () => true;
  return child;
}

function createGitSimulator({ fetchDelayMs }) {
  let nextPid = 10_000;
  const calls = [];

  function spawnProcess(command, args, options) {
    const child = createChild(nextPid++);
    calls.push({ args, command, options });
    let code = 0;
    let delayMs = 0;
    let stderr = '';
    let stdout = '';

    if (command === 'git') {
      if (args[0] === 'fetch') delayMs = fetchDelayMs;
      if (args[0] === 'rev-parse' && args.includes('@{u}')) stdout = 'origin/main\n';
      if (args[0] === 'log') stdout = '1\n';
      if (args[0] === 'rev-list') stdout = '0\n';
      if (args[0] === 'show') stdout = 'not a sqlite database';
    } else {
      stdout = 'ok\n';
    }

    setTimeout(() => {
      if (stdout) child.stdout.emit('data', Buffer.from(stdout));
      if (stderr) child.stderr.emit('data', Buffer.from(stderr));
      child.emit('exit', code, null);
      child.emit('close', code, null);
    }, delayMs);
    return child;
  }

  return { calls, spawnProcess };
}

test('databaseGitStatus cancela un fetch remoto que supera el tiempo máximo', async () => {
  const child = createChild(20_001);
  const terminations = [];
  let spawnOptions = null;
  const sync = createDatabaseSync({
    getPersistentDatabasePath: async () => '/repo/data/creditos.db',
    getRepositoryRootForDatabase: async () => '/repo',
    remoteStatusTimeoutMs: 10,
    reloadMainWindowServer: async () => {},
    spawnProcess: (_command, _args, options) => {
      spawnOptions = options;
      return child;
    },
    stopPythonServerAndWait: async () => {},
    terminateGitProcess: (processToStop, signal) => {
      terminations.push({ processToStop, signal });
      if (signal === 'SIGTERM') {
        setImmediate(() => processToStop.emit('close', null, signal));
      }
    },
  });

  const status = await sync.databaseGitStatus({ fetch: true });

  assert.equal(status.statusKind, 'error');
  assert.equal(status.errorCode, 'GIT_REMOTE_TIMEOUT');
  assert.match(status.error, /GitHub no respondió en 1 segundo/);
  assert.match(status.error, /continuar usando la base de datos local/);
  assert.equal(spawnOptions.detached, process.platform !== 'win32');
  assert.deepEqual(terminations.map((item) => item.signal), ['SIGTERM']);
  assert.equal(terminations[0].processToStop, child);
});

test('la bajada explícita conserva el fetch sin límite de la comprobación de arranque', async () => {
  const repoPath = await fs.mkdtemp(path.join(os.tmpdir(), 'creditos-sync-test-'));
  const dbPath = path.join(repoPath, 'data', 'creditos.db');
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  await fs.writeFile(dbPath, 'local database');
  const simulator = createGitSimulator({ fetchDelayMs: 30 });
  const terminations = [];
  let reloadCount = 0;
  let stopCount = 0;

  try {
    const sync = createDatabaseSync({
      getPersistentDatabasePath: async () => dbPath,
      getRepositoryRootForDatabase: async () => repoPath,
      remoteStatusTimeoutMs: 5,
      reloadMainWindowServer: async () => { reloadCount += 1; },
      spawnProcess: simulator.spawnProcess,
      stopPythonServerAndWait: async () => { stopCount += 1; },
      terminateGitProcess: (_child, signal) => { terminations.push(signal); },
    });

    const status = await sync.forceDatabaseFromGitHub();

    assert.equal(status.statusKind, 'synced');
    assert.equal(stopCount, 1);
    assert.equal(reloadCount, 1);
    assert.deepEqual(terminations, []);
    const fetchCalls = simulator.calls.filter((call) => call.command === 'git' && call.args[0] === 'fetch');
    assert.equal(fetchCalls.length, 2);
    assert.ok(fetchCalls.every((call) => call.options.detached === false));
  } finally {
    await fs.rm(repoPath, { recursive: true, force: true });
  }
});
