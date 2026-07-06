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

    function addEmptyCartela() {
      if (!state.structure) return;
      const cartela = options.insertManualCartela(state.structure.cartelas, state.selectedCartelaId);
      if (!cartela) return;
      state.selectedCartelaId = cartela.id;
      options.rebuild();
    }

    function deleteSelectedManualCartela() {
      if (!state.structure || !Array.isArray(state.structure.cartelas)) return;
      const cartela = options.getSelectedCartela();
      if (!cartela || !cartela.manual) return;
      const confirmed = options.windowRef.confirm('Eliminar esta cartela manual?');
      if (!confirmed) return;
      const result = options.deleteManualCartela(state.structure.cartelas, cartela.id);
      if (!result.deleted) return;
      state.selectedCartelaId = result.nextCartelaId;
      options.rebuild();
    }

    function moveSelectedCartelaVisualOrder(cartelaId, delta) {
      if (!state.structure || !Array.isArray(state.structure.cartelas)) return;
      if (!options.moveCartelaVisualOrderInStructure(state.structure.cartelas, cartelaId, delta)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderCartelaList();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function updateSelectedCartela(fields) {
      const cartela = options.getSelectedCartela();
      if (!options.updateCartelaInStructure(cartela, fields)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderCartelaList();
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function resetSelectedCartelaOverride(key) {
      const cartela = options.getSelectedCartela();
      if (!options.resetCartelaOverrideInStructure(cartela, key)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderCartelaList();
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function updateSelectedCartelaBlockStyle(fields) {
      const cartela = options.getSelectedCartela();
      if (!options.updateCartelaBlockStyleInDomain(cartela, fields)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function resetSelectedCartelaBlockOverride(key) {
      const cartela = options.getSelectedCartela();
      if (!options.resetCartelaBlockOverrideInDomain(cartela, key)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function updateSelectedCartelaBlockAlignment(key, value) {
      const cartela = options.getSelectedCartela();
      if (!options.updateCartelaBlockAlignmentInDomain(cartela, key, value)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function resetSelectedCartelaBlockAlignmentOverride(key) {
      const cartela = options.getSelectedCartela();
      if (!options.resetCartelaBlockAlignmentOverrideInDomain(cartela, key)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function resetSelectedCartelaBlockTypographyOverride(key) {
      const cartela = options.getSelectedCartela();
      if (!options.resetCartelaBlockTypographyOverrideInDomain(cartela, key)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function updateSelectedCartelaBlockTypography(key, fields, commandOptions = {}) {
      const cartela = options.getSelectedCartela();
      if (!options.updateCartelaBlockTypographyInDomain(cartela, key, fields)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
      if (commandOptions.rerenderEditor) options.renderEditor();
    }

    function resetSelectedCartelaTitleTypographyOverride() {
      const cartela = options.getSelectedCartela();
      if (!options.resetCartelaTitleTypographyOverrideInDomain(cartela)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderEditor();
      options.renderPreview();
      options.renderCartelaPreview();
      options.refreshPdfIfActive();
    }

    function updateSelectedCartelaTitleTypography(fields, commandOptions = {}) {
      const cartela = options.getSelectedCartela();
      if (!cartela) return;
      const base = options.getEffectiveStyleTitleTypography(options.getStyleById(cartela.style_id)).page_header;
      if (!options.updateCartelaTitleTypographyInDomain(cartela, fields, base)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderCartelaList();
      options.renderPreview();
      options.renderCartelaPreview();
      options.refreshPdfIfActive();
      if (commandOptions.rerenderEditor) options.renderEditor();
    }

    function updateSelectedBlockAlignment(ref, fields) {
      const cartela = options.getSelectedCartela();
      const page = options.findPageWithRef(cartela, ref);
      if (!options.updateSourceRefAlignment(page, ref, fields)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function updateSelectedBlockVerticalAlign(ref, value) {
      const cartela = options.getSelectedCartela();
      const page = options.findPageWithRef(cartela, ref);
      if (!options.updateSourceRefVerticalAlign(page, ref, value)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function updateSelectedBlockTypography(ref, key, fields, commandOptions = {}) {
      const cartela = options.getSelectedCartela();
      const page = options.findPageWithRef(cartela, ref);
      if (!options.updateSourceRefTypography(page, ref, key, fields)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      if (commandOptions.rerenderEditor) options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function resetSelectedBlockTypography(ref) {
      const cartela = options.getSelectedCartela();
      const page = options.findPageWithRef(cartela, ref);
      if (!options.resetSourceRefTypography(page, ref)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function updateSelectedBlockColumns(ref, columns) {
      const cartela = options.getSelectedCartela();
      const page = options.findPageWithRef(cartela, ref);
      if (!options.updateSourceRefColumns(page, ref, columns)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    return {
      addEmptyCartela,
      deleteSelectedManualCartela,
      moveSelectedCartelaVisualOrder,
      resetSelectedBlockTypography,
      resetSelectedCartelaBlockAlignmentOverride,
      resetSelectedCartelaBlockOverride,
      resetSelectedCartelaBlockTypographyOverride,
      resetSelectedCartelaTitleTypographyOverride,
      resetSelectedCartelaOverride,
      updateSelectedBlockAlignment,
      updateSelectedBlockColumns,
      updateSelectedBlockTypography,
      updateSelectedBlockVerticalAlign,
      updateSelectedCartelaBlockAlignment,
      updateSelectedCartelaBlockStyle,
      updateSelectedCartelaBlockTypography,
      updateSelectedCartelaTitleTypography,
      updateLayoutSetting,
      updateSelectedCartela,
      updateSettings,
      updateTypographySetting,
    };
  }

  root.CreditosAppCommands = {
    createAppCommands,
  };
})(globalThis);
