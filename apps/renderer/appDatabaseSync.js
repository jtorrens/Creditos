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
      const targetText = status && status.syncTarget ? status.syncTarget : 'sin rama Git';
      const statusKind = status && status.statusKind ? status.statusKind : databaseStatusKind(status);
      const statusLabel = databaseStatusLabel(status, statusKind);
      els.databaseStatus.textContent = [
        `DB: ${pathText}`,
        `Rama: ${targetText}`,
        `Estado: ${statusLabel}`,
      ].join('\n');
      els.databaseStatus.classList.toggle('db-sync-error', statusKind === 'error' || statusKind === 'unavailable');
      els.databaseStatus.classList.toggle('db-sync-warning', statusKind === 'remote');
      els.databaseStatus.classList.toggle('db-sync-pending', statusKind === 'local');
      els.databaseStatus.classList.toggle('db-sync-ok', statusKind === 'synced');
      els.databaseStatus.title = status && status.message ? status.message : pathText;
    }

    function databaseStatusKind(status) {
      if (!status) return 'unavailable';
      if (status.error || status.available === false) return 'error';
      if (status.remoteIsNewer || status.remoteChanged || status.remoteAhead) return 'remote';
      if (status.localChanged) return 'local';
      if (status.available) return 'synced';
      return 'unavailable';
    }

    function databaseStatusLabel(status, statusKind) {
      if (!status) return 'sin estado';
      if (statusKind === 'error') return `error - ${status.message || status.error || 'revisar Git'}`;
      if (statusKind === 'unavailable') return status.message || 'no disponible';
      if (statusKind === 'remote') return 'remota mas reciente';
      if (statusKind === 'local') return 'local pendiente de subir';
      if (statusKind === 'synced') return 'sincronizada';
      return status.message || 'sin estado';
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
      if (native.getDatabaseSyncStatus) {
        state.databaseSyncStatus = await native.getDatabaseSyncStatus();
        updateDatabaseStatus();
        if (state.databaseSyncStatus && state.databaseSyncStatus.error) {
          throw new Error(state.databaseSyncStatus.error);
        }
      }
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
      if (native.getDatabaseSyncStatus) {
        try {
          state.databaseSyncStatus = await native.getDatabaseSyncStatus();
          updateDatabaseStatus();
        } catch (_error) {
          // applyDatabaseSyncAction will surface the actionable error after confirmation.
        }
      }
      const status = state.databaseSyncStatus;
      const statusKind = status && status.statusKind ? status.statusKind : databaseStatusKind(status);
      const statusLabel = databaseStatusLabel(status, statusKind);
      const targetText = status && status.syncTarget ? status.syncTarget : 'sin rama Git';
      const pathText = state.databasePath ? state.databasePath : 'data/creditos-refactor.db';
      const result = await native.confirm({
        title: isDownload ? 'Bajar DB de GitHub' : 'Subir DB a GitHub',
        message: isDownload
          ? `Esto reemplazara la base de datos local por la version de GitHub.\n\nDB: ${pathText}\nRama: ${targetText}\nEstado: ${statusLabel}`
          : `Esto validara la DB local y la subira a GitHub.\n\nDB: ${pathText}\nRama: ${targetText}\nEstado: ${statusLabel}`,
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
