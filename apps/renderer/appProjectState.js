(function (root) {
  function createAppProjectState(options = {}) {
    const state = options.state;
    const storageKeys = options.storageKeys || {};

    function currentProductionEpisodes(productionId = state.selectedProductionId) {
      return options.productionEpisodes(state.episodes, productionId);
    }

    function selectedProduction() {
      return options.findSelectedProduction(state.productions, state.selectedProductionId);
    }

    function getProductionLayout() {
      return options.productionLayout(selectedProduction());
    }

    function getProductionSettings() {
      return options.productionSettings(selectedProduction());
    }

    function setSelectedProductionLocalFields(fields) {
      options.applyProductionFields(selectedProduction(), fields);
    }

    async function persistSelectedProductionFields(fields) {
      if (!state.selectedProductionId) return;
      const overview = await options.dbPost('/api/db/update-production', {
        production_id: state.selectedProductionId,
        fields,
      });
      state.productions = overview.productions || state.productions;
      state.episodes = overview.episodes || state.episodes;
      options.renderProjectSelectors();
    }

    function selectedEpisode() {
      return state.episodes.find((episode) => String(episode.id) === String(state.selectedEpisodeId)) || null;
    }

    function rememberCurrentSelection() {
      if (!state.selectedProductionId) return;
      const selection = {
        productionId: state.selectedProductionId ? String(state.selectedProductionId) : '',
        episodeId: state.selectedEpisodeId ? String(state.selectedEpisodeId) : '',
      };
      options.writeLocalJsonPreference(storageKeys.lastSelection, selection);
    }

    function readSavedSelection() {
      const saved = options.readLocalJsonPreference(storageKeys.lastSelection, null);
      if (saved && (saved.productionId || saved.episodeId)) {
        return {
          productionId: saved.productionId ? String(saved.productionId) : '',
          episodeId: saved.episodeId ? String(saved.episodeId) : '',
        };
      }
      return {
        productionId: options.readLocalPreference(storageKeys.selectedProduction),
        episodeId: options.readLocalPreference(storageKeys.selectedEpisode),
      };
    }

    return {
      currentProductionEpisodes,
      getProductionLayout,
      getProductionSettings,
      persistSelectedProductionFields,
      readSavedSelection,
      rememberCurrentSelection,
      selectedEpisode,
      selectedProduction,
      setSelectedProductionLocalFields,
    };
  }

  root.CreditosAppProjectState = {
    createAppProjectState,
  };
})(globalThis);
