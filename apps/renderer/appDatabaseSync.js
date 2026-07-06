(function (root) {
  function createAppDatabaseSync(options = {}) {
    const els = options.els;
    const state = options.state;
    const nativeBridge = options.nativeBridge;
    const initializeDatabase = options.initializeDatabase;
    const windowRef = options.windowRef || root;

    function updateDatabaseStatus() {
      if (!els.databaseStatus) return;
      const status = state.databaseSyncStatus;
      const pathText = state.databasePath ? state.databasePath : 'data/creditos-refactor.db';
      let suffix = '';
      if (status && status.remoteIsNewer) suffix = ' · GitHub tiene una DB mas reciente';
      else if (status && status.localChanged) suffix = ' · DB local pendiente de subir';
      else if (status && status.available) suffix = ' · sincronizada';
      const targetText = status && status.syncTarget ? ` · rama ${status.syncTarget}` : '';
      els.databaseStatus.textContent = `${pathText}${targetText}${suffix}`;
      els.databaseStatus.classList.toggle('db-sync-warning', Boolean(status && status.remoteIsNewer));
      els.databaseStatus.classList.toggle('db-sync-ok', Boolean(status && !status.remoteIsNewer));
      els.databaseStatus.title = status && status.message ? `${status.message}${targetText}` : pathText;
    }

    async function refreshDatabaseSyncStatus() {
      const native = nativeBridge();
      if (!native || !native.getDatabaseSyncStatus) return;
      try {
        state.databaseSyncStatus = await native.getDatabaseSyncStatus();
      } catch (error) {
        state.databaseSyncStatus = { message: error.message, error: error.message };
      }
      updateDatabaseStatus();
    }

    async function applyDatabaseSyncAction(action) {
      const native = nativeBridge();
      if (!native) throw new Error('La sincronizacion solo esta disponible desde la app de escritorio.');
      if (action === 'download') {
        if (!native.forceDatabaseFromGitHub) throw new Error('No esta disponible la actualizacion desde GitHub.');
        state.databaseSyncStatus = await native.forceDatabaseFromGitHub();
      } else if (action === 'upload') {
        if (!native.forceDatabaseToGitHub) throw new Error('No esta disponible la subida de DB local.');
        state.databaseSyncStatus = await native.forceDatabaseToGitHub();
      } else {
        if (!native.syncDatabase) throw new Error('No esta disponible la sincronizacion de DB.');
        state.databaseSyncStatus = await native.syncDatabase();
      }
      updateDatabaseStatus();
      await initializeDatabase({ silent: true });
      await refreshDatabaseSyncStatus();
    }

    async function syncDatabaseManually(action) {
      const native = nativeBridge();
      if (!native || !native.confirm) {
        windowRef.alert('La sincronizacion solo esta disponible desde la app de escritorio.');
        return;
      }
      const isDownload = action === 'download';
      const result = await native.confirm({
        title: isDownload ? 'Bajar DB de GitHub' : 'Subir DB a GitHub',
        message: isDownload
          ? 'Esto reemplazara la base de datos local por la version de GitHub.'
          : 'Esto subira la base de datos local a GitHub y reemplazara la version remota.',
        confirmLabel: isDownload ? 'Bajar de GitHub' : 'Subir a GitHub',
      });
      if (!result || !result.confirmed) return;
      try {
        await applyDatabaseSyncAction(action);
      } catch (error) {
        windowRef.alert('No se pudo sincronizar la DB: ' + error.message);
        await refreshDatabaseSyncStatus();
      }
    }

    return {
      applyDatabaseSyncAction,
      refreshDatabaseSyncStatus,
      syncDatabaseManually,
      updateDatabaseStatus,
    };
  }

  root.CreditosAppDatabaseSync = {
    createAppDatabaseSync,
  };
})(globalThis);
