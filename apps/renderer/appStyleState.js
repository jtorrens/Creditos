(function (root) {
  function createAppStyleState(options = {}) {
    const state = options.state;

    function loadStyleObjects(styleObjects) {
      state.styles = (styleObjects || [])
        .map((style) => options.normalizeCartelaStyle(style, { name: style.file_name || `${style.id || 'estilo'}.json` }))
        .sort((a, b) => a.name.localeCompare(b.name));
      pruneCurrentRedundantStyleDefaults();
      pruneCurrentRedundantStyleOverrides();
      if (state.source && state.structure) {
        state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      }
      options.renderEditor();
      options.renderCartelaList();
      options.renderStylesPane();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function pruneCurrentRedundantStyleOverrides() {
      options.pruneRedundantStyleOverridesInDomain(state.structure);
    }

    function pruneCurrentRedundantStyleDefaults() {
      options.pruneRedundantStyleDefaultsInDomain(state.styles, options.getProductionSettings());
    }

    async function writeStyleFile(style) {
      const data = options.serializeCartelaStyle(style);
      await options.dbPost('/api/db/save-style', {
        production_id: state.selectedProductionId,
        data,
      });
      return { canceled: false, name: style.name };
    }

    return {
      loadStyleObjects,
      pruneCurrentRedundantStyleDefaults,
      pruneCurrentRedundantStyleOverrides,
      writeStyleFile,
    };
  }

  root.CreditosAppStyleState = {
    createAppStyleState,
  };
})(globalThis);
