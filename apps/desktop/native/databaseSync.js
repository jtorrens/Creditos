const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

function createDatabaseSync({
  getAppChannel = () => process.env.CREDITOS_APP_CHANNEL || 'production',
  getPersistentDatabasePath,
  getRepositoryRootForDatabase,
  reloadMainWindowServer,
  stopPythonServerAndWait,
}) {
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

  function appChannel() {
    return String(getAppChannel() || process.env.CREDITOS_APP_CHANNEL || 'production').toLowerCase();
  }

  async function currentBranch(cwd) {
    const branch = await gitOutput(['rev-parse', '--abbrev-ref', 'HEAD'], cwd);
    if (!branch || branch === 'HEAD') {
      throw new Error('No se pudo detectar la rama Git actual para sincronizar la DB.');
    }
    return branch;
  }

  async function configuredUpstreamOrNull(cwd) {
    try {
      const upstream = await gitOutput(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], cwd);
      if (upstream) return upstream;
    } catch (_error) {
      // A branch without upstream can still sync to origin/<current-branch>.
    }
    return null;
  }

  function splitRemoteRef(ref) {
    const [remote, ...branchParts] = String(ref || '').split('/');
    if (!remote || !branchParts.length) {
      throw new Error(`Target Git invalido para DB: ${ref || '(vacio)'}`);
    }
    return {
      branch: branchParts.join('/'),
      ref,
      remote,
    };
  }

  async function databaseSyncTarget(cwd) {
    const upstream = await configuredUpstreamOrNull(cwd);
    if (upstream) return splitRemoteRef(upstream);
    const branch = await currentBranch(cwd);
    return splitRemoteRef(`origin/${branch}`);
  }

  function assertRefactorIsolation(dbPath, target) {
    if (appChannel() !== 'refactor') return;
    if (path.basename(dbPath) !== 'creditos-refactor.db') {
      throw new Error('Creditos Refactor solo puede sincronizar la DB independiente data/creditos-refactor.db.');
    }
    if (target.branch === 'main') {
      throw new Error('Creditos Refactor no puede sincronizar la DB contra main.');
    }
  }

  async function databaseGitStatus(options = {}) {
    const dbPath = await getPersistentDatabasePath();
    const repoPath = await getRepositoryRootForDatabase();
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

      const target = await databaseSyncTarget(repoPath);
      assertRefactorIsolation(dbPath, target);
      const upstream = target.ref;
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
        appChannel: appChannel(),
        dbPath,
        repoPath,
        relativeDbPath,
        syncTarget: target.ref,
        syncTargetBranch: target.branch,
        syncTargetRemote: target.remote,
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
      await runGit(['pull', '--ff-only', status.syncTargetRemote, status.syncTargetBranch], { cwd: status.repoPath });
      status = await databaseGitStatus({ fetch: false });
    }

    if (status.localChanged) {
      await runGit(['add', status.relativeDbPath], { cwd: status.repoPath });
      await runGit(['commit', '-m', 'Update credits database'], { cwd: status.repoPath });
      await runGit(['push', status.syncTargetRemote, `HEAD:${status.syncTargetBranch}`], { cwd: status.repoPath });
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
      await runGit(['worktree', 'add', '--detach', worktreePath, status.syncTarget], { cwd: status.repoPath });
      const worktreeDbPath = path.join(worktreePath, status.relativeDbPath);
      await fs.mkdir(path.dirname(worktreeDbPath), { recursive: true });
      await fs.copyFile(localDbCopy, worktreeDbPath);
      const hasChanges = await gitHasDiff(['diff', '--quiet', '--', status.relativeDbPath], worktreePath);
      if (hasChanges) {
        await runGit(['add', status.relativeDbPath], { cwd: worktreePath });
        await runGit(['commit', '-m', 'Update credits database'], { cwd: worktreePath });
        await runGit(['push', status.syncTargetRemote, `HEAD:${status.syncTargetBranch}`], { cwd: worktreePath });
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

  return {
    databaseGitStatus,
    forceDatabaseFromGitHub,
    forceDatabaseToGitHub,
    synchronizeDatabaseWithGit,
  };
}

module.exports = { createDatabaseSync };
