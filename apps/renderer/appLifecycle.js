(function (root) {
  function createAppLifecycle(options = {}) {
    const documentRef = options.documentRef || root.document;
    const windowRef = options.windowRef || root;
    const state = options.state;
    const els = options.els;

    function renderVisiblePanelPreviews() {
      windowRef.requestAnimationFrame(() => {
        if (state.activeTab === 'styles') options.renderStylePreview(options.getStyleById(state.selectedStyleId));
        if (state.activeTab === 'structure') options.renderCartelaPreview();
        if (state.activeTab === 'pdf') options.renderPdfPreview();
      });
    }

    function rebuild(rebuildOptions = {}) {
      if (rebuildOptions.selectionOnly) {
        options.renderCartelaList();
        options.renderCartelaPreview({ deferred: true });
        windowRef.requestAnimationFrame(() => options.renderEditor({ renderPreview: false }));
        return;
      }
      if (state.source && state.structure) {
        state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      }

      renderMeta();
      options.renderSettings();
      options.renderCartelaList();
      options.renderEditor();
      renderPreview();
      options.renderCartelaPreview();
      refreshPdfIfActive();
    }

    function renderMeta() {
      if (!state.source) {
        const production = options.selectedProduction();
        const episode = options.selectedEpisode();
        els.sourceMeta.textContent = production && episode
          ? `${production.name} · ${episode.name} · asocia un archivo de créditos para empezar.`
          : 'Crea o selecciona una producción y un episodio para empezar.';
        options.updateXlsxStatus();
        return;
      }

      const sheet = state.source.sheet || 'sin hoja';
      els.sourceMeta.textContent = `${sheet} · ${state.materials.length} bloques de diseño · ${state.source.meta.loaded_file || ''}`;
      options.updateXlsxStatus();
    }

    async function setActiveTab(tabName) {
      const previousTabName = state.activeTab;
      let nextTabName = tabName;
      if (!documentRef.getElementById(`${nextTabName}Pane`)) nextTabName = 'settings';
      state.activeTab = nextTabName;
      els.tabButtons.forEach((button) => button.classList.toggle('active', button.dataset.tab === nextTabName));
      els.tabPanes.forEach((pane) => pane.classList.toggle('active', pane.id === `${nextTabName}Pane`));
      if (nextTabName === 'styles') {
        options.renderStylesPane();
        windowRef.requestAnimationFrame(() => options.renderStylePreview(options.getStyleById(state.selectedStyleId)));
      }
      if (nextTabName === 'structure') {
        options.renderCartelaPreview();
        windowRef.requestAnimationFrame(options.renderCartelaPreview);
      }
      if (nextTabName === 'pdf') options.renderPdfPreview();
      if (previousTabName === 'parserLab' && nextTabName !== 'parserLab') {
        try {
          const parserLab = windowRef.CreditosParserLabUi && windowRef.CreditosParserLabUi.instance;
          if (parserLab && parserLab.flushPendingBlockEdit) await parserLab.flushPendingBlockEdit();
          if (options.reloadCurrentEpisode) await options.reloadCurrentEpisode();
        } catch (error) {
          windowRef.alert(`No se pudo sincronizar la revisión actual del Parser.\n\n${error.message}`);
        }
      }
    }

    function renderPreview() {
      if (!state.source && !state.structure && !state.render) {
        if (els.jsonPreview) els.jsonPreview.value = '';
        return;
      }
      if (els.jsonPreview) {
        els.jsonPreview.value = JSON.stringify(state.preview === 'structure' ? getStructureJsonForOutput() : state.render, null, 2);
      }
      options.scheduleAutosave();
    }

    function getStructureJsonForOutput() {
      return options.structureJsonForOutput(state.structure, state.materials);
    }

    function refreshPdfIfActive() {
      if (state.activeTab === 'pdf') options.renderPdfPreview();
    }

    return {
      getStructureJsonForOutput,
      rebuild,
      refreshPdfIfActive,
      renderMeta,
      renderPreview,
      renderVisiblePanelPreviews,
      setActiveTab,
    };
  }

  root.CreditosAppLifecycle = {
    createAppLifecycle,
  };
})(globalThis);
