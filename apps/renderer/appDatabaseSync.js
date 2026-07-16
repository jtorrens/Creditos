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
      const codeLabel = codeStatusLabel(status);
      const schemaLabel = databaseSchemaStatusLabel(status);
      const userDataLabel = databaseUserDataStatusLabel(status);
      els.databaseStatus.textContent = [
        `DB: ${pathText}`,
        `Rama: ${targetText}`,
        `Datos DB: ${userDataLabel}`,
        `Esquema DB: ${schemaLabel}`,
        `Codigo: ${codeLabel}`,
      ].join('\n');
      els.databaseStatus.classList.toggle('db-sync-error', statusKind === 'error' || statusKind === 'unavailable');
      els.databaseStatus.classList.toggle('db-sync-warning', statusKind === 'remote');
      els.databaseStatus.classList.toggle('db-sync-pending', statusKind === 'local');
      els.databaseStatus.classList.toggle('db-sync-ok', statusKind === 'synced');
      els.databaseStatus.title = status
        ? [status.message, status.codeMessage].filter(Boolean).join('\n')
        : pathText;
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

    function codeStatusLabel(status) {
      if (!status || status.error || status.available === false) return 'sin estado';
      const behindCount = Number(status.branchBehindCount) || 0;
      if (status.remoteCodeChanged) {
        return `desactualizado (${behindCount} commit${behindCount === 1 ? '' : 's'} remoto${behindCount === 1 ? '' : 's'})`;
      }
      if (status.remoteOnlyDatabaseChanges) {
        return `actualizado (el desfase remoto solo contiene DB)`;
      }
      return 'actualizado';
    }

    function databaseSchemaStatusLabel(status) {
      if (!status || !status.databaseComparisonAvailable) return 'sin comparacion';
      const localVersion = Number(status.localSchemaVersion) || 0;
      const remoteVersion = Number(status.remoteSchemaVersion) || 0;
      if (status.databaseSchemaMatches) return `v${localVersion}, sincronizado`;
      if (status.schemaStatusKind === 'remote') return `GitHub v${remoteVersion}; local v${localVersion}`;
      return `local v${localVersion}; GitHub v${remoteVersion}`;
    }

    function databaseUserDataStatusLabel(status) {
      if (!status || !status.databaseComparisonAvailable) {
        const statusKind = status && status.statusKind ? status.statusKind : databaseStatusKind(status);
        return databaseStatusLabel(status, statusKind);
      }
      if (status.databaseUserDataMatches) return 'sincronizados';
      return status.userDataStatusKind === 'remote'
        ? 'GitHub contiene cambios pendientes de bajar'
        : 'cambios locales pendientes de subir';
    }

    async function refreshDatabaseSyncStatus(refreshOptions = {}) {
      const native = nativeBridge();
      setDatabaseSyncActionsDisabled(true);
      if (!native || !native.getDatabaseSyncStatus) {
        if (refreshOptions.throwOnError) throw new Error('La comprobación con Git no está disponible.');
        return null;
      }
      try {
        state.databaseSyncStatus = await native.getDatabaseSyncStatus();
      } catch (error) {
        state.databaseSyncStatus = { message: error.message, error: error.message };
        updateDatabaseStatus();
        if (refreshOptions.throwOnError) throw error;
      }
      updateDatabaseStatus();
      const statusKind = databaseStatusKind(state.databaseSyncStatus);
      setDatabaseSyncActionsDisabled(statusKind === 'error' || statusKind === 'unavailable');
      if (refreshOptions.throwOnError && (statusKind === 'error' || statusKind === 'unavailable')) {
        throw new Error(state.databaseSyncStatus && (state.databaseSyncStatus.message || state.databaseSyncStatus.error) || 'No se pudo comparar la base de datos con Git.');
      }
      return state.databaseSyncStatus;
    }

    function setDatabaseSyncActionsDisabled(disabled) {
      if (els.downloadDatabaseBtn) els.downloadDatabaseBtn.disabled = !!disabled;
      if (els.uploadDatabaseBtn) els.uploadDatabaseBtn.disabled = !!disabled;
    }

    function openDatabaseSyncModal(title, message) {
      const overlay = documentRef.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
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
      let isClosed = false;
      const closed = new Promise((resolve) => {
        resolveClosed = resolve;
      });

      function close() {
        if (isClosed) return;
        isClosed = true;
        overlay.remove();
        resolveClosed();
      }

      function finish(resultTitle, resultMessage, resultKind, finishOptions = {}) {
        titleEl.textContent = resultTitle;
        messageEl.textContent = resultMessage;
        modal.classList.toggle('db-sync-modal-error', resultKind === 'error');
        modal.classList.toggle('db-sync-modal-ok', resultKind === 'ok');
        modal.classList.toggle('db-sync-modal-warning', resultKind === 'warning');
        progress.remove();
        actions.innerHTML = '';
        const acceptButton = documentRef.createElement('button');
        acceptButton.type = 'button';
        acceptButton.textContent = finishOptions.acceptLabel || 'Aceptar';
        acceptButton.className = 'primary';
        acceptButton.addEventListener('click', close);
        actions.appendChild(acceptButton);
        acceptButton.focus();
      }

      return {
        close,
        closed,
        finish,
        setPhase(phaseMessage) {
          messageEl.textContent = phaseMessage;
        },
      };
    }

    async function initializeDatabaseWithSyncCheck() {
      setDatabaseSyncActionsDisabled(true);
      const modal = openDatabaseSyncModal(
        'Comprobando base de datos',
        'Abriendo la base de datos local de Créditos Refactor...'
      );
      try {
        await initializeDatabase({ silent: true, throwOnError: true });
        modal.setPhase('Comparando los datos, el esquema y el código con origin/main...');
        const status = await refreshDatabaseSyncStatus({ throwOnError: true });
        const statusKind = databaseStatusKind(status);
        if (statusKind === 'remote') {
          modal.finish(
            'GitHub tiene una DB más reciente',
            'Hay cambios de datos en origin/main que todavía no están en este equipo. Antes de seguir editando, usa «Bajar de GitHub» en Producciones. La base de datos local no se ha modificado.',
            'warning',
            { acceptLabel: 'Entendido' }
          );
          await modal.closed;
          return status;
        }
        modal.setPhase(statusKind === 'local'
          ? 'Base de datos lista. Hay cambios locales pendientes de subir.'
          : 'Base de datos local y GitHub están sincronizadas.');
        await waitForStartupResult();
        modal.close();
        return status;
      } catch (error) {
        setDatabaseSyncActionsDisabled(true);
        modal.finish(
          'No se pudo comprobar la base de datos',
          `${error.message}\n\nPuedes continuar para revisar el detalle en Producciones, pero no uses las acciones de sincronización hasta resolverlo.`,
          'error',
          { acceptLabel: 'Continuar' }
        );
        await modal.closed;
        return state.databaseSyncStatus;
      }
    }

    function waitForStartupResult() {
      return new Promise((resolve) => windowRef.setTimeout(resolve, 450));
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
      const codeLabel = codeStatusLabel(status);
      const schemaLabel = databaseSchemaStatusLabel(status);
      const userDataLabel = databaseUserDataStatusLabel(status);
      const targetText = status && status.syncTarget ? status.syncTarget : 'sin rama Git';
      const pathText = state.databasePath ? state.databasePath : 'data/creditos-refactor.db';
      const result = await native.confirm({
        title: isDownload ? 'Bajar DB de GitHub' : 'Subir DB a GitHub',
        message: isDownload
          ? `Esto reemplazara la base de datos local por la version de GitHub.\n\nDB: ${pathText}\nRama: ${targetText}\nDatos DB: ${userDataLabel}\nEsquema DB: ${schemaLabel}\nCodigo: ${codeLabel}`
          : `Esto validara la DB local y la subira a GitHub.\n\nDB: ${pathText}\nRama: ${targetText}\nDatos DB: ${userDataLabel}\nEsquema DB: ${schemaLabel}\nCodigo: ${codeLabel}`,
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
      initializeDatabaseWithSyncCheck,
      refreshDatabaseSyncStatus,
      syncDatabaseManually,
      updateDatabaseStatus,
    };
  }

  root.CreditosAppDatabaseSync = {
    createAppDatabaseSync,
  };
})(globalThis);
