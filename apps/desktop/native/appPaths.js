const fs = require('fs/promises');
const path = require('path');

function createAppPaths({ app, appChannel = 'production', appDir }) {
  function databaseFileName() {
    return appChannel === 'refactor' ? 'creditos-refactor.db' : 'creditos.db';
  }

  function repoRoot() {
    if (app.isPackaged) {
      return process.resourcesPath;
    }
    return path.resolve(appDir, '..', '..');
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
      if (root) return path.join(root, 'data', databaseFileName());
    }

    return path.join(app.getPath('userData'), 'data', databaseFileName());
  }

  async function repositoryRootForDatabase() {
    const dbPath = await persistentDatabasePath();
    return findRepositoryRoot(path.dirname(dbPath));
  }

  function rendererPath() {
    return app.isPackaged
      ? path.join(process.resourcesPath, 'renderer')
      : path.join(repoRoot(), 'apps', 'renderer');
  }

  function serverScriptPath() {
    return path.join(rendererPath(), 'server.py');
  }

  return {
    findRepositoryRoot,
    databaseFileName,
    persistentDatabasePath,
    rendererPath,
    repoRoot,
    repositoryRootForDatabase,
    serverScriptPath,
  };
}

module.exports = { createAppPaths };
