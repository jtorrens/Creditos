(function (root) {
  function createAppCommands(options = {}) {
    const state = options.state;

    function updateTypographySetting(key, fields) {
      if (!options.selectedProduction()) return;
      const settings = options.getProductionSettings();
      settings.typography[key] = {
        ...settings.typography[key],
        ...fields,
      };
      options.setSelectedProductionLocalFields({ settings: options.stripProductionLayoutFromSettings(settings) });
      options.persistSelectedProductionFields({ settings: options.selectedProduction().settings }).catch((error) => console.warn(error));
      state.render = state.source ? options.buildCurrentRenderJson(state.source, state.materials, state.structure) : state.render;
      options.renderStylesPane();
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function updateLayoutSetting(fields) {
      if (!options.selectedProduction()) return;
      const settings = options.getProductionSettings();
      settings.layout = {
        ...settings.layout,
        ...fields,
      };
      options.setSelectedProductionLocalFields({ settings: options.stripProductionLayoutFromSettings(settings) });
      options.persistSelectedProductionFields({ settings: options.selectedProduction().settings }).catch((error) => console.warn(error));
      state.render = state.source ? options.buildCurrentRenderJson(state.source, state.materials, state.structure) : state.render;
      options.renderStylesPane();
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function updateSettings(fields) {
      if (!options.selectedProduction()) return;
      const settings = {
        ...options.getProductionSettings(),
        ...fields,
      };
      options.setSelectedProductionLocalFields({ settings: options.stripProductionLayoutFromSettings(settings) });
      options.persistSelectedProductionFields({ settings: options.selectedProduction().settings }).catch((error) => console.warn(error));
      if (state.source) {
        state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      }
      options.renderSettings();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    return {
      updateLayoutSetting,
      updateSettings,
      updateTypographySetting,
    };
  }

  root.CreditosAppCommands = {
    createAppCommands,
  };
})(globalThis);
