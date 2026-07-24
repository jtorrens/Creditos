(function (root) {
  function createAppAutosave(options = {}) {
    const state = options.state;
    const windowRef = options.windowRef || root;

    function setAutosaveStatus(message) {
      void message;
    }

    function scheduleAutosave() {
      if (state.isLoadingEpisode || !state.databasePath || !options.hasSelectedContentScope() || !state.structure) {
        return;
      }
      setAutosaveStatus('Guardando...');
      windowRef.clearTimeout(state.autosaveTimer);
      state.autosaveTimer = windowRef.setTimeout(() => {
        persistCurrentEpisode().catch((error) => {
          console.error(error);
          setAutosaveStatus('Error al guardar');
        });
      }, 500);
    }

    async function persistCurrentEpisode() {
      if (!state.databasePath || !options.hasSelectedContentScope() || !state.structure) return;
      const base = {
        production_id: state.selectedProductionId,
        episode_id: state.selectedEpisodeId,
        import_model_id: options.currentImportModelId(),
      };
      if (state.source) {
        await options.dbPost('/api/db/save-document', { ...base, kind: 'source', data: state.source });
      }
      await options.dbPost('/api/db/save-document', { ...base, kind: 'structure', data: options.getStructureJsonForOutput() });
      if (state.render) {
        await options.dbPost('/api/db/save-document', { ...base, kind: 'render', data: state.render });
      }
      setAutosaveStatus(`Autoguardado ${new Date().toLocaleTimeString()}`);
    }

    async function flushCurrentEpisode() {
      windowRef.clearTimeout(state.autosaveTimer);
      state.autosaveTimer = null;
      await persistCurrentEpisode();
    }

    function scheduleStyleAutosave(styleId) {
      if (!state.databasePath || !state.selectedProductionId || !styleId) return;
      const style = options.getStyleById(styleId);
      if (!style) return;
      windowRef.clearTimeout(state.autosaveStyleTimers.get(styleId));
      state.autosaveStyleTimers.set(styleId, windowRef.setTimeout(() => {
        options.writeStyleFile(style)
          .then(() => setAutosaveStatus(`Estilo autoguardado ${new Date().toLocaleTimeString()}`))
          .catch((error) => {
            console.error(error);
            setAutosaveStatus('Error al guardar estilo');
          });
      }, 500));
    }

    return {
      flushCurrentEpisode,
      persistCurrentEpisode,
      scheduleAutosave,
      scheduleStyleAutosave,
      setAutosaveStatus,
    };
  }

  root.CreditosAppAutosave = {
    createAppAutosave,
  };
})(globalThis);
