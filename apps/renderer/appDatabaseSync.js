(function (root) {
  function createAppDatabaseSync(options = {}) {
    const els = options.els;
    const state = options.state;
    const nativeBridge = options.nativeBridge;
    const initializeDatabase = options.initializeDatabase;
    const documentRef = options.documentRef || root.document;
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

    function openDatabaseSyncModal(title, message) {
      const overlay = documentRef.createElement('div');
      overlay.className = 'modal-overlay';
      const modal = documentRef.createElement('div');
      modal.className = 'app-modal db-sync-modal';
      const titleEl = documentRef.createElement('h2');
      titleEl.textContent = title;
      const messageEl = documentRef.createElement('p');
      messageEl.textContent = message;
      const progress = documentRef.createElement('progress');
      progress.className = 'db-sync-progress';
      progress.removeAttribute('value');
      const actions = documentRef.createElement('div');
      actions.className = 'modal-actions';

      modal.appendChild(titleEl);
      modal.appendChild(messageEl);
      modal.appendChild(progress);
      modal.appendChild(actions);
      overlay.appendChild(modal);
      documentRef.body.appendChild(overlay);

      let resolveClosed = null;
      const closed = new Promise((resolve) => {
        resolveClosed = resolve;
      });

      function finish(resultTitle, resultMessage, resultKind) {
        titleEl.textContent = resultTitle;
        messageEl.textContent = resultMessage;
        modal.classList.toggle('db-sync-modal-error', resultKind === 'error');
        modal.classList.toggle('db-sync-modal-ok', resultKind === 'ok');
        progress.remove();
        actions.innerHTML = '';
        const acceptButton = documentRef.createElement('button');
        acceptButton.type = 'button';
        acceptButton.textContent = 'Aceptar';
        acceptButton.className = 'primary';
        acceptButton.addEventListener('click', () => {
          overlay.remove();
          resolveClosed();
        });
        actions.appendChild(acceptButton);
        acceptButton.focus();
      }

      return {
        closed,
        finish,
        setPhase(phaseMessage) {
          messageEl.textContent = phaseMessage;
        },
      };
    }

    async function applyDatabaseSyncAction(action, actionOptions = {}) {
      const native = nativeBridge();
      if (!native) throw new Error('La sincronizacion solo esta disponible desde la app de escritorio.');
      const setPhase = actionOptions.setPhase || (() => {});
      if (native.getDatabaseSyncStatus) {
        setPhase('Revisando estado Git de la base de datos...');
        state.databaseSyncStatus = await native.getDatabaseSyncStatus();
        updateDatabaseStatus();
        if (state.databaseSyncStatus && state.databaseSyncStatus.error) {
          throw new Error(state.databaseSyncStatus.error);
        }
      }
      if (action === 'download') {
        if (!native.forceDatabaseFromGitHub) throw new Error('No esta disponible la actualizacion desde GitHub.');
        setPhase('Creando backup, bajando snapshot y validando SQLite...');
        state.databaseSyncStatus = await native.forceDatabaseFromGitHub();
      } else if (action === 'upload') {
        if (!native.forceDatabaseToGitHub) throw new Error('No esta disponible la subida de DB local.');
        setPhase('Validando SQLite, preparando snapshot y subiendo a GitHub...');
        state.databaseSyncStatus = await native.forceDatabaseToGitHub();
      } else {
        if (!native.syncDatabase) throw new Error('No esta disponible la sincronizacion de DB.');
        state.databaseSyncStatus = await native.syncDatabase();
      }
      const actionStatus = state.databaseSyncStatus;
      updateDatabaseStatus();
      setPhase('Recargando base de datos local...');
      await initializeDatabase({ silent: true });
      await refreshDatabaseSyncStatus();
      return actionStatus;
    }

    function successMessageForAction(action, status) {
      const targetText = status && status.syncTarget ? status.syncTarget : 'la rama configurada';
      if (action === 'download') {
        const backupText = status && status.backupPath ? `\n\nBackup local: ${status.backupPath}` : '';
        return `La base de datos se ha bajado y validado correctamente desde ${targetText}.${backupText}`;
      }
      if (action === 'upload') {
        return `La base de datos local se ha validado y subido correctamente a ${targetText}.`;
      }
      return 'La sincronizacion de base de datos ha terminado correctamente.';
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
      const modal = openDatabaseSyncModal(
        isDownload ? 'Bajando DB de GitHub' : 'Subiendo DB a GitHub',
        isDownload
          ? 'Preparando backup y descarga de la base de datos...'
          : 'Preparando validacion y subida de la base de datos...'
      );
      try {
        const actionStatus = await applyDatabaseSyncAction(action, { setPhase: (message) => modal.setPhase(message) });
        modal.finish(
          isDownload ? 'DB bajada correctamente' : 'DB subida correctamente',
          successMessageForAction(action, actionStatus),
          'ok'
        );
        await modal.closed;
      } catch (error) {
        modal.finish(
          isDownload ? 'No se pudo bajar la DB' : 'No se pudo subir la DB',
          error.message,
          'error'
        );
        await modal.closed;
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
