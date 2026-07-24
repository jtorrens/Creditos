(function (root) {
  function createAppEpisodeLoader(options = {}) {
    const state = options.state;
    const windowRef = options.windowRef || root;

    async function loadProductionStyles() {
      if (!state.databasePath || !state.selectedProductionId) return;
      const result = await options.dbPost('/api/db/load-styles', { production_id: state.selectedProductionId });
      options.loadStyleObjects(result.styles || []);
    }

    async function loadCurrentEpisode() {
      if (!state.databasePath || !state.selectedProductionId || !state.selectedEpisodeId) {
        return;
      }
      state.isLoadingEpisode = true;
      try {
        const result = await options.dbPost('/api/db/load-episode', {
          production_id: state.selectedProductionId,
          episode_id: state.selectedEpisodeId,
          import_model_id: options.currentImportModelId(),
        });
        if (result.structure && result.structure.settings && !options.selectedProductionHasStoredSettings(options.selectedProduction())) {
          options.setSelectedProductionLocalFields({ settings: options.stripProductionLayoutFromSettings(result.structure.settings) });
          options.persistSelectedProductionFields({ settings: options.selectedProduction().settings }).catch((error) => console.warn(error));
        }
        options.loadStyleObjects(result.styles || []);
        state.referenceVideo = options.normalizeReferenceVideo(result.reference);
        state.referenceVideoDuration = null;
        let sourceBreaksChanged = false;
        if (result.source) {
          state.source = options.normalizeSource(result.source, result.source.meta && result.source.meta.loaded_file);
          state.materials = options.createMaterialsFromSource(state.source);
          const storedStructure = result.structure ? options.migrateStructure(result.structure) : null;
          const addedBlockGroups = new Set(
            result.source_refresh && Array.isArray(result.source_refresh.added_block_groups)
              ? result.source_refresh.added_block_groups
              : []
          );
          const detachedMaterialIds = state.materials
            .filter((material) => addedBlockGroups.has(String(material.group || '')))
            .map((material) => material.id);
          state.structure = options.createStructureFromSource(
            state.source,
            state.materials,
            storedStructure,
            { detached_material_ids: detachedMaterialIds }
          );
          sourceBreaksChanged = !!storedStructure && JSON.stringify(storedStructure.page_breaks || {})
            !== JSON.stringify(state.structure.page_breaks || {});
          const sourceRefreshed = result.source_refresh && result.source_refresh.status === 'refreshed';
          state.render = sourceRefreshed || sourceBreaksChanged
            ? options.buildCurrentRenderJson(state.source, state.materials, state.structure)
            : result.render || options.buildCurrentRenderJson(state.source, state.materials, state.structure);
          state.selectedCartelaId = state.structure.cartelas[0] ? state.structure.cartelas[0].id : null;
          options.applyPreviewSettingsToUi(state.structure.preview_settings);
          state.pngPreviewZoomMode = 'auto';
          state.pngPreviewZoom = null;
        } else {
          state.source = null;
          state.materials = [];
          state.structure = null;
          state.render = null;
          state.selectedCartelaId = null;
          options.applyPreviewSettingsToUi(options.defaultPreviewSettings());
          state.pngPreviewZoomMode = 'auto';
          state.pngPreviewZoom = null;
        }
        options.updateXlsxStatus();
        options.updateReferenceVideoStatus();
        options.rebuild();
        if (
          result.source
          && (
            (result.source_refresh && result.source_refresh.status === 'refreshed')
            || sourceBreaksChanged
          )
        ) {
          await options.persistCurrentEpisode();
        }
        if (result.source_refresh && result.source_refresh.status === 'failed') {
          windowRef.alert(
            'No se pudo actualizar el origen con la revisión actual del modelo. ' +
            'Se mantiene la última versión válida.\n\n' +
            result.source_refresh.error
          );
        }
      } finally {
        state.isLoadingEpisode = false;
      }
    }

    return {
      loadCurrentEpisode,
      loadProductionStyles,
    };
  }

  root.CreditosAppEpisodeLoader = {
    createAppEpisodeLoader,
  };
})(globalThis);
