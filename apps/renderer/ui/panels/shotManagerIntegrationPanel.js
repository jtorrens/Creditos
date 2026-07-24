(function (root) {
  function createShotManagerIntegrationPanel(options = {}) {
    const documentRef = options.documentRef || root.document;
    const bridge = options.bridge;
    const associationApi = options.associationApi;
    const domain = options.domain;
    const els = options.els;
    const windowRef = options.windowRef || root;
    const state = {
      association: null,
      associationOperation: 0,
      catalog: null,
      connectionOperation: 0,
      connected: false,
      contextKey: '',
      dirty: false,
      snapshot: null,
      snapshotOperation: 0,
    };
    let localObserver = null;
    let localRenderQueued = false;

    function localContext() {
      return {
        creditosProductionId: String(els.sourceProductionSelect.value || ''),
      };
    }

    function localProductionType() {
      const option = els.sourceProductionSelect.options[
        els.sourceProductionSelect.selectedIndex
      ];
      return option && option.dataset.productionType
        ? option.dataset.productionType
        : '';
    }

    function contextKey(context = localContext()) {
      return context.creditosProductionId || '';
    }

    function setStatus(message, tone = '') {
      els.status.textContent = message;
      els.status.className = `shot-manager-status${tone ? ` ${tone}` : ''}`;
    }

    function markDirty(message = 'Cambios pendientes de guardar.') {
      state.dirty = true;
      setStatus(message, 'warning');
      renderActions();
    }

    function addBlankOption(select, label) {
      const option = documentRef.createElement('option');
      option.value = '';
      option.textContent = label;
      select.appendChild(option);
    }

    function renderProductionOptions(selectedId = '') {
      els.productionSelect.innerHTML = '';
      addBlankOption(els.productionSelect, 'Selecciona una producción');
      for (const record of domain.availableProductions(state.catalog)) {
        const option = documentRef.createElement('option');
        option.value = String(record.production.id);
        option.textContent = record.production.code
          ? `${record.production.code} · ${record.production.name}`
          : record.production.name;
        els.productionSelect.appendChild(option);
      }
      els.productionSelect.value = selectedId;
      els.productionSelect.disabled = !state.connected;
    }

    function renderSnapshotOptions(selected = {}) {
      els.structureSelect.innerHTML = '';
      if (!state.snapshot) {
        addBlankOption(els.structureSelect, 'Selecciona primero una producción');
        els.structureSelect.disabled = true;
        els.context.textContent = '';
        return;
      }
      addBlankOption(els.structureSelect, 'Selecciona un elemento');
      for (const entry of domain.structureEntryOptions(state.snapshot)) {
        const option = documentRef.createElement('option');
        option.value = entry.id;
        option.textContent = entry.label;
        els.structureSelect.appendChild(option);
      }
      els.structureSelect.value = selected.structureEntryId || '';
      els.structureSelect.disabled = false;
      const hierarchy = state.snapshot.production.productionType === 'SERIES'
        ? `${(state.snapshot.seasons || []).length} temporada(s) · ${(state.snapshot.episodes || []).length} capítulo(s)`
        : 'Película · contenido a nivel de producción';
      els.context.textContent = `${hierarchy} · Raíz en este equipo: ${state.snapshot.location.rootPath}`;
    }

    function typesMatch() {
      return !!(
        state.snapshot &&
        localProductionType() &&
        state.snapshot.production.productionType === localProductionType()
      );
    }

    function renderActions() {
      const remoteSelectionComplete = !!(
        state.connected &&
        state.snapshot &&
        els.productionSelect.value &&
        els.structureSelect.value
      );
      const associationComplete = !!(
        contextKey() &&
        remoteSelectionComplete &&
        typesMatch() &&
        localProductionType()
      );
      els.saveButton.disabled = !associationComplete || !state.dirty;
      els.createButton.disabled = !remoteSelectionComplete;
      els.deleteButton.disabled = !state.association;
    }

    async function loadSnapshot(productionId, selected = {}) {
      const operation = ++state.snapshotOperation;
      state.snapshot = null;
      renderSnapshotOptions();
      renderActions();
      if (!productionId) return false;
      setStatus('Leyendo la estructura de Shot Manager…');
      const result = await bridge.getShotManagerProduction({ productionId });
      if (operation !== state.snapshotOperation) return false;
      if (!result || !result.ok) {
        setStatus(
          result && result.error ? result.error.message : 'No se pudo leer la producción.',
          'error',
        );
        return false;
      }
      state.snapshot = result.data;
      renderSnapshotOptions(selected);
      if (!typesMatch()) {
        const localLabel = localProductionType() === 'FILM' ? 'película' : 'serie';
        const remoteLabel = state.snapshot.production.productionType === 'FILM'
          ? 'película'
          : 'serie';
        setStatus(
          `No puede gobernar la producción activa: Créditos es ${localLabel} y Shot Manager es ${remoteLabel}. ` +
          'Sí puedes crearla como una producción gobernada nueva.',
          'warning',
        );
      }
      renderActions();
      return true;
    }

    async function applyStoredAssociation(association, operation) {
      if (operation !== state.associationOperation) return;
      const record = domain.availableProductions(state.catalog).find(
        (candidate) => String(candidate.production.id) === String(
          association.shotManagerProductionId,
        ),
      );
      if (!record) {
        setStatus(
          'La producción asociada no está disponible en este equipo. La asociación no se ha modificado.',
          'warning',
        );
        renderActions();
        return;
      }
      els.productionSelect.value = association.shotManagerProductionId;
      if (!await loadSnapshot(association.shotManagerProductionId, association)) return;
      if (operation !== state.associationOperation) return;
      const validation = domain.validateStoredSelection(
        state.snapshot,
        association,
        localProductionType(),
      );
      if (!validation.valid) {
        setStatus(`${validation.message} Elige el valor actual y guarda de nuevo.`, 'warning');
        renderActions();
        return;
      }
      const hierarchy = domain.hierarchyComparison(state.snapshot, association);
      state.dirty = !hierarchy.inSync;
      setStatus(
        hierarchy.inSync
          ? 'Producción gobernada y jerarquía sincronizada.'
          : `${hierarchy.message} Pulsa “Sincronizar jerarquía”.`,
        hierarchy.inSync ? 'ok' : 'warning',
      );
      renderActions();
    }

    async function loadLocalAssociation(loadOptions = {}) {
      const operation = ++state.associationOperation;
      const context = localContext();
      state.dirty = false;
      state.contextKey = contextKey(context);
      state.association = null;
      state.snapshot = null;
      renderProductionOptions();
      renderSnapshotOptions();
      renderActions();
      if (!state.contextKey) {
        setStatus('Selecciona una producción de Créditos.');
        return;
      }
      const result = await associationApi.read(context);
      if (operation !== state.associationOperation) return;
      if (!result || !result.ok) {
        setStatus(
          result && result.error ? result.error.message : 'No se pudo leer la asociación local.',
          'error',
        );
        return;
      }
      state.association = result.association;
      renderActions();
      if (!state.association) {
        setStatus(
          state.connected
            ? 'Producción independiente. Puedes convertirla en gobernada o crear otra desde Shot Manager.'
            : (loadOptions.disconnectedMessage || 'Producción independiente. Abre Shot Manager para vincularla.'),
          state.connected ? '' : (loadOptions.disconnectedTone || ''),
        );
        return;
      }
      if (!state.connected || !state.catalog) {
        setStatus(
          loadOptions.disconnectedMessage
            ? `${loadOptions.disconnectedMessage} Hay una asociación guardada sin verificar.`
            : 'Hay una asociación guardada. Abre Shot Manager para verificarla.',
          'warning',
        );
        return;
      }
      await applyStoredAssociation(state.association, operation);
    }

    async function refreshConnection() {
      const operation = ++state.connectionOperation;
      state.connected = false;
      state.catalog = null;
      state.snapshot = null;
      els.refreshButton.disabled = true;
      renderProductionOptions();
      renderSnapshotOptions();
      renderActions();
      setStatus('Buscando Shot Manager…');
      try {
        const status = await bridge.getShotManagerStatus();
        if (operation !== state.connectionOperation) return;
        if (!status || !status.connected) {
          await loadLocalAssociation({
            disconnectedMessage: status && status.error
              ? status.error.message
              : 'Shot Manager no está disponible.',
            disconnectedTone: status && status.error &&
              status.error.code !== 'SHOT_MANAGER_NOT_RUNNING'
              ? 'error'
              : '',
          });
          return;
        }
        const catalogResult = await bridge.listShotManagerProductions();
        if (operation !== state.connectionOperation) return;
        if (!catalogResult || !catalogResult.ok) {
          setStatus(
            catalogResult && catalogResult.error
              ? catalogResult.error.message
              : 'No se pudieron leer las producciones de Shot Manager.',
            'error',
          );
          return;
        }
        state.connected = true;
        state.catalog = catalogResult.data;
        renderProductionOptions();
        await loadLocalAssociation();
      } finally {
        els.refreshButton.disabled = false;
      }
    }

    async function saveAssociation(confirmDestructive = false) {
      const payload = {
        ...localContext(),
        shotManagerProductionId: els.productionSelect.value,
        structureEntryId: els.structureSelect.value,
        snapshot: state.snapshot,
        confirmDestructive,
      };
      els.saveButton.disabled = true;
      const result = await associationApi.write(payload);
      if (!result || !result.ok) {
        setStatus(
          result && result.error ? result.error.message : 'No se pudo guardar la asociación.',
          'error',
        );
        renderActions();
        return;
      }
      if (result.confirmationRequired) {
        const deletions = result.plan && result.plan.contentDeletions
          ? result.plan.contentDeletions
          : [];
        const chapterList = deletions
          .map((episode) => `${episode.code} · ${episode.name}`)
          .join('\n');
        const confirmed = windowRef.confirm(
          'Shot Manager ya no contiene algunos capítulos que sí tienen datos en Créditos.\n\n' +
          `${chapterList}\n\n` +
          'Si continúas se eliminarán esos capítulos y sus documentos asociados. ' +
          'Esta acción no se puede deshacer.',
        );
        if (confirmed) await saveAssociation(true);
        else {
          setStatus('Sincronización cancelada; no se ha modificado la producción.', 'warning');
          renderActions();
        }
        return;
      }
      state.association = result.association;
      state.dirty = false;
      setStatus('Producción gobernada y jerarquía sincronizada.', 'ok');
      windowRef.dispatchEvent(new windowRef.CustomEvent(
        'creditos:shot-manager-production-updated',
        { detail: result },
      ));
      renderActions();
    }

    async function createGovernedProduction() {
      const payload = {
        shotManagerProductionId: els.productionSelect.value,
        structureEntryId: els.structureSelect.value,
        snapshot: state.snapshot,
      };
      els.createButton.disabled = true;
      const result = await associationApi.create(payload);
      if (!result || !result.ok) {
        setStatus(
          result && result.error
            ? result.error.message
            : 'No se pudo crear la producción gobernada.',
          'error',
        );
        renderActions();
        return;
      }
      setStatus('Producción gobernada creada y sincronizada.', 'ok');
      windowRef.dispatchEvent(new windowRef.CustomEvent(
        'creditos:shot-manager-production-created',
        { detail: result },
      ));
    }

    async function deleteAssociation() {
      const confirmed = windowRef.confirm(
        'La producción conservará sus temporadas, capítulos y contenido, pero Shot Manager ' +
        'dejará de gobernar su jerarquía. ¿Convertirla en independiente?',
      );
      if (!confirmed) return;
      const result = await associationApi.delete(localContext());
      if (!result || !result.ok) {
        setStatus(
          result && result.error
            ? result.error.message
            : 'No se pudo convertir la producción en independiente.',
          'error',
        );
        return;
      }
      state.association = null;
      state.dirty = false;
      state.snapshot = null;
      renderProductionOptions();
      renderSnapshotOptions();
      renderActions();
      setStatus('Producción convertida en independiente.');
      windowRef.dispatchEvent(new windowRef.CustomEvent(
        'creditos:shot-manager-production-updated',
        { detail: result },
      ));
    }

    function scheduleLocalSync() {
      if (localRenderQueued) return;
      localRenderQueued = true;
      windowRef.queueMicrotask(() => {
        localRenderQueued = false;
        const nextKey = contextKey();
        if (nextKey !== state.contextKey) loadLocalAssociation();
      });
    }

    function bind() {
      els.productionSelect.addEventListener('change', async () => {
        state.dirty = true;
        await loadSnapshot(els.productionSelect.value);
        if (state.snapshot && typesMatch()) {
          markDirty('Selecciona el elemento de estructura y guarda la asociación.');
        }
      });
      els.structureSelect.addEventListener('change', () => markDirty());
      els.saveButton.addEventListener('click', () => saveAssociation(false));
      els.createButton.addEventListener('click', createGovernedProduction);
      els.deleteButton.addEventListener('click', deleteAssociation);
      els.refreshButton.addEventListener('click', refreshConnection);
      localObserver = new windowRef.MutationObserver(scheduleLocalSync);
      localObserver.observe(els.sourceProductionSelect, {
        attributes: true,
        childList: true,
        subtree: true,
      });
      els.sourceProductionSelect.addEventListener('change', scheduleLocalSync);
    }

    async function initialize() {
      if (!bridge || !associationApi) {
        setStatus('La conexión con Shot Manager necesita la aplicación de escritorio.', 'error');
        return;
      }
      bind();
      await refreshConnection();
    }

    return {
      createGovernedProduction,
      deleteAssociation,
      initialize,
      loadLocalAssociation,
      refreshConnection,
      saveAssociation,
    };
  }

  root.CreditosShotManagerIntegrationPanel = {
    createShotManagerIntegrationPanel,
  };
})(globalThis);
