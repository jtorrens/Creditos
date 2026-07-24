(function (root) {
  function createShotManagerIntegrationPanel(options = {}) {
    const documentRef = options.documentRef || root.document;
    const windowRef = options.windowRef || root;
    const bridge = options.bridge;
    const associationApi = options.associationApi;
    const domain = options.domain;
    const els = options.els;
    const state = {
      association: null,
      associationOperation: 0,
      catalog: null,
      connectionOperation: 0,
      connected: false,
      contextKey: '',
      dirty: false,
      localEpisodeId: '',
      snapshot: null,
      snapshotOperation: 0,
    };
    let bypassSourceEpisodeGuard = false;
    let localObserver = null;
    let localRenderQueued = false;

    function localContext() {
      return {
        creditosProductionId: String(els.sourceProductionSelect.value || ''),
        creditosEpisodeId: String(els.localEpisodeSelect.value || ''),
      };
    }

    function contextKey(context = localContext()) {
      return context.creditosProductionId && context.creditosEpisodeId
        ? JSON.stringify([context.creditosProductionId, context.creditosEpisodeId])
        : '';
    }

    function setStatus(message, tone = '') {
      els.status.textContent = message;
      els.status.className = `shot-manager-status${tone ? ` ${tone}` : ''}`;
    }

    function confirmDiscardPendingChanges() {
      if (!state.dirty) return true;
      return windowRef.confirm(
        'Hay cambios en la asociación con Shot Manager sin guardar. ' +
        'Si cambias de capítulo se descartarán. ¿Quieres continuar?',
      );
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

    function renderLocalEpisodes() {
      const selectedValue = String(els.sourceEpisodeSelect.value || '');
      els.localEpisodeSelect.innerHTML = '';
      const sourceOptions = Array.from(els.sourceEpisodeSelect.options || []);
      if (!sourceOptions.length) {
        addBlankOption(els.localEpisodeSelect, 'Sin capítulos locales');
        els.localEpisodeSelect.disabled = true;
        return;
      }
      for (const sourceOption of sourceOptions) {
        const option = documentRef.createElement('option');
        option.value = String(sourceOption.value || '');
        option.textContent = sourceOption.textContent;
        els.localEpisodeSelect.appendChild(option);
      }
      els.localEpisodeSelect.value = selectedValue;
      els.localEpisodeSelect.disabled = !!els.sourceEpisodeSelect.disabled;
      state.localEpisodeId = selectedValue;
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
      els.episodeSelect.innerHTML = '';
      els.structureSelect.innerHTML = '';
      if (!state.snapshot) {
        addBlankOption(els.episodeSelect, 'Selecciona primero una producción');
        addBlankOption(els.structureSelect, 'Selecciona primero una producción');
        els.episodeSelect.disabled = true;
        els.structureSelect.disabled = true;
        els.context.textContent = '';
        return;
      }

      const isSeries = state.snapshot.production.productionType === 'SERIES';
      addBlankOption(
        els.episodeSelect,
        isSeries ? 'Selecciona un capítulo' : 'No aplica · película',
      );
      for (const episode of domain.episodeOptions(state.snapshot)) {
        const option = documentRef.createElement('option');
        option.value = episode.id;
        option.dataset.seasonId = episode.seasonId || '';
        option.textContent = episode.label;
        els.episodeSelect.appendChild(option);
      }
      els.episodeSelect.value = selected.episodeId || '';
      els.episodeSelect.disabled = !isSeries;

      addBlankOption(els.structureSelect, 'Selecciona un elemento');
      for (const entry of domain.structureEntryOptions(state.snapshot)) {
        const option = documentRef.createElement('option');
        option.value = entry.id;
        option.textContent = entry.label;
        els.structureSelect.appendChild(option);
      }
      els.structureSelect.value = selected.structureEntryId || '';
      els.structureSelect.disabled = false;
      els.context.textContent = `Raíz en este equipo: ${state.snapshot.location.rootPath}`;
    }

    function renderActions() {
      const context = localContext();
      const isSeries = state.snapshot && state.snapshot.production.productionType === 'SERIES';
      const complete = !!(
        context.creditosProductionId &&
        context.creditosEpisodeId &&
        state.connected &&
        state.snapshot &&
        els.productionSelect.value &&
        els.structureSelect.value &&
        (!isSeries || els.episodeSelect.value)
      );
      els.saveButton.disabled = !complete;
      els.deleteButton.disabled = !state.association;
    }

    function selectedSeasonId() {
      const selectedOption = els.episodeSelect.options[
        els.episodeSelect.selectedIndex
      ];
      return selectedOption && selectedOption.dataset.seasonId
        ? selectedOption.dataset.seasonId
        : null;
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
      renderActions();
      return true;
    }

    async function applyStoredAssociation(association, associationOperation) {
      if (associationOperation !== state.associationOperation) return;
      const record = domain.availableProductions(state.catalog).find(
        (candidate) => String(candidate.production.id) === String(
          association.shotManagerProductionId,
        ),
      );
      if (!record) {
        setStatus(
          'La producción asociada ya no está disponible en este equipo. La asociación no se ha modificado.',
          'warning',
        );
        renderActions();
        return;
      }
      els.productionSelect.value = association.shotManagerProductionId;
      if (!await loadSnapshot(association.shotManagerProductionId, association)) return;
      if (associationOperation !== state.associationOperation) return;
      const validation = domain.validateStoredSelection(state.snapshot, association);
      if (!validation.valid) {
        setStatus(`${validation.message} Elige el valor actual y guarda de nuevo.`, 'warning');
        renderActions();
        return;
      }
      setStatus('Asociación guardada y verificada.', 'ok');
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
        setStatus('Selecciona una producción y un capítulo de Créditos.');
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
      state.dirty = false;
      renderActions();
      if (!state.association) {
        setStatus(
          state.connected
            ? 'Este capítulo todavía no está asociado con Shot Manager.'
            : (
              loadOptions.disconnectedMessage ||
              'Sin asociación. Abre Shot Manager para crearla.'
            ),
          state.connected ? '' : (loadOptions.disconnectedTone || ''),
        );
        return;
      }
      if (!state.connected || !state.catalog) {
        setStatus(
          loadOptions.disconnectedMessage
            ? `${loadOptions.disconnectedMessage} Hay una asociación guardada sin verificar.`
            : 'Hay una asociación guardada. Abre Shot Manager para verificar su contexto.',
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
          const disconnectedMessage = status && status.error
            ? status.error.message
            : 'Shot Manager no está disponible.';
          const disconnectedTone = status && status.error &&
            status.error.code !== 'SHOT_MANAGER_NOT_RUNNING'
            ? 'error'
            : '';
          await loadLocalAssociation({
            disconnectedMessage,
            disconnectedTone,
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

    async function saveAssociation() {
      const context = localContext();
      const isSeries = state.snapshot.production.productionType === 'SERIES';
      const payload = {
        ...context,
        shotManagerProductionId: els.productionSelect.value,
        seasonId: isSeries ? selectedSeasonId() : null,
        episodeId: isSeries ? els.episodeSelect.value : null,
        structureEntryId: els.structureSelect.value,
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
      state.association = result.association;
      state.dirty = false;
      setStatus('Asociación guardada y verificada.', 'ok');
      renderActions();
    }

    async function deleteAssociation() {
      const context = localContext();
      const result = await associationApi.delete(context);
      if (!result || !result.ok) {
        setStatus(
          result && result.error ? result.error.message : 'No se pudo quitar la asociación.',
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
      setStatus('Asociación eliminada.');
    }

    function scheduleLocalSync() {
      if (localRenderQueued) return;
      localRenderQueued = true;
      windowRef.queueMicrotask(() => {
        localRenderQueued = false;
        renderLocalEpisodes();
        const nextKey = contextKey();
        if (nextKey !== state.contextKey) loadLocalAssociation();
      });
    }

    function selectLocalEpisode(episodeId) {
      const nextEpisodeId = String(episodeId || '');
      if (nextEpisodeId === state.localEpisodeId) return true;
      if (!confirmDiscardPendingChanges()) {
        els.localEpisodeSelect.value = state.localEpisodeId;
        return false;
      }
      state.dirty = false;
      state.localEpisodeId = nextEpisodeId;
      els.sourceEpisodeSelect.value = nextEpisodeId;
      bypassSourceEpisodeGuard = true;
      try {
        els.sourceEpisodeSelect.dispatchEvent(
          new windowRef.Event('change', { bubbles: true }),
        );
      } finally {
        bypassSourceEpisodeGuard = false;
      }
      scheduleLocalSync();
      return true;
    }

    function guardSourceEpisodeChange(event) {
      const nextEpisodeId = String(els.sourceEpisodeSelect.value || '');
      if (
        bypassSourceEpisodeGuard ||
        !state.localEpisodeId ||
        nextEpisodeId === state.localEpisodeId
      ) return;
      if (!confirmDiscardPendingChanges()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        els.sourceEpisodeSelect.value = state.localEpisodeId;
        windowRef.queueMicrotask(renderLocalEpisodes);
        return;
      }
      state.dirty = false;
      state.localEpisodeId = nextEpisodeId;
    }

    function bind() {
      els.localEpisodeSelect.addEventListener('change', () => {
        selectLocalEpisode(els.localEpisodeSelect.value);
      });
      els.productionSelect.addEventListener('change', async () => {
        state.dirty = true;
        await loadSnapshot(els.productionSelect.value);
        if (state.snapshot) {
          markDirty('Selecciona el capítulo y el elemento de estructura.');
        }
      });
      els.episodeSelect.addEventListener('change', () => {
        markDirty();
      });
      els.structureSelect.addEventListener('change', () => {
        markDirty();
      });
      els.saveButton.addEventListener('click', saveAssociation);
      els.deleteButton.addEventListener('click', deleteAssociation);
      els.refreshButton.addEventListener('click', refreshConnection);

      localObserver = new windowRef.MutationObserver(scheduleLocalSync);
      localObserver.observe(els.sourceProductionSelect, {
        attributes: true,
        childList: true,
        subtree: true,
      });
      localObserver.observe(els.sourceEpisodeSelect, {
        attributes: true,
        childList: true,
        subtree: true,
      });
      els.sourceEpisodeSelect.addEventListener(
        'change',
        guardSourceEpisodeChange,
        true,
      );
      els.sourceEpisodeSelect.addEventListener('change', scheduleLocalSync);
      renderLocalEpisodes();
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
      deleteAssociation,
      initialize,
      loadLocalAssociation,
      refreshConnection,
      saveAssociation,
      selectLocalEpisode,
    };
  }

  root.CreditosShotManagerIntegrationPanel = {
    createShotManagerIntegrationPanel,
  };
})(globalThis);
