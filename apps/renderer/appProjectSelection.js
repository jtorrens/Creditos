(function (root) {
  function createAppProjectSelection(options = {}) {
    const els = options.els;
    const state = options.state;
    const windowRef = options.windowRef || root;

    async function initializeDatabase(initOptions = {}) {
      try {
        const overview = await options.dbPost('/api/db/init', { db_path: null });
        state.databasePath = overview.db_path || 'data/creditos.db';
        applyDatabaseOverview(overview);
        options.updateDatabaseStatus();
      } catch (error) {
        if (initOptions.throwOnError) throw error;
        if (!initOptions.silent) windowRef.alert('No se pudo inicializar la base de datos: ' + error.message);
        return null;
      }
    }

    function applyDatabaseOverview(overview) {
      state.productions = overview.productions || [];
      state.episodes = overview.episodes || [];
      state.importModels = overview.import_models || state.importModels || [];
      const savedSelection = options.readSavedSelection();
      if (!state.selectedProductionId) {
        const preferredProductionId = savedSelection.productionId;
        if (preferredProductionId && state.productions.some((production) => String(production.id) === String(preferredProductionId))) {
          state.selectedProductionId = preferredProductionId;
        }
      }
      if (!state.productions.some((production) => String(production.id) === String(state.selectedProductionId))) {
        state.selectedProductionId = state.productions[0] ? state.productions[0].id : null;
      }
      const availableEpisodes = options.currentProductionEpisodes();
      if (!state.selectedEpisodeId) {
        const preferredEpisodeId = String(savedSelection.productionId) === String(state.selectedProductionId)
          ? savedSelection.episodeId
          : '';
        if (
          preferredEpisodeId &&
          availableEpisodes.some((episode) => String(episode.id) === String(preferredEpisodeId))
        ) {
          state.selectedEpisodeId = preferredEpisodeId;
        }
      }
      if (!availableEpisodes.some((episode) => String(episode.id) === String(state.selectedEpisodeId))) {
        state.selectedEpisodeId = availableEpisodes[0] ? availableEpisodes[0].id : null;
      }
      options.rememberCurrentSelection();
      options.renderProjectSelectors();
      if (state.selectedProductionId && state.selectedEpisodeId) {
        options.loadCurrentEpisode().catch((error) => console.warn(error));
      } else if (state.selectedProductionId) {
        options.loadProductionStyles().catch((error) => console.warn(error));
      }
    }

    async function selectProductionFromUi() {
      await selectProductionById(els.productionSelect.value || null);
    }

    async function selectProductionById(productionId) {
      state.selectedProductionId = productionId;
      const episodes = options.currentProductionEpisodes();
      const savedSelection = options.readSavedSelection();
      const savedEpisode = String(savedSelection.productionId) === String(productionId)
        ? episodes.find((episode) => String(episode.id) === String(savedSelection.episodeId))
        : null;
      state.selectedEpisodeId = savedEpisode ? savedEpisode.id : (episodes[0] ? episodes[0].id : null);
      options.rememberCurrentSelection();
      options.renderProjectSelectors();
      if (state.selectedProductionId && state.selectedEpisodeId) await options.loadCurrentEpisode();
      else if (state.selectedProductionId) await options.loadProductionStyles();
    }

    function toggleCreateProductionBox() {
      if (!els.productionCreateBox) return;
      els.productionCreateBox.classList.toggle('open');
      if (els.productionCreateBox.classList.contains('open')) {
        els.newProductionNameInput.focus();
        els.newProductionNameInput.select();
      }
    }

    async function selectEpisodeFromUi() {
      state.selectedEpisodeId = els.episodeSelect.value || null;
      options.rememberCurrentSelection();
      await options.loadCurrentEpisode();
    }

    return {
      applyDatabaseOverview,
      initializeDatabase,
      selectEpisodeFromUi,
      selectProductionById,
      selectProductionFromUi,
      toggleCreateProductionBox,
    };
  }

  root.CreditosAppProjectSelection = {
    createAppProjectSelection,
  };
})(globalThis);
