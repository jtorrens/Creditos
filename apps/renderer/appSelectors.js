(function (root) {
  function createAppSelectors(options = {}) {
    const state = options.state;

    function getStyleById(styleId) {
      if (!styleId) return null;
      return state.styles.find((style) => style.id === styleId) || null;
    }

    function getSelectedCartela() {
      return state.structure && state.structure.cartelas
        ? state.structure.cartelas.find((cartela) => cartela.id === state.selectedCartelaId)
        : null;
    }

    function getEffectiveStyleCartela(style) {
      return options.getEffectiveStyleCartelaWithSettings(style, options.getProductionSettings());
    }

    function getEffectiveStyleTitleTypography(style) {
      return options.getEffectiveStyleTitleTypographyWithSettings(style, options.getProductionSettings());
    }

    function getEffectiveCartelaTitleTypography(cartela) {
      const style = getStyleById(cartela && cartela.style_id);
      return options.getEffectiveCartelaTitleTypographyWithSettings(cartela, style, options.getProductionSettings());
    }

    function baseStyleCartelaFromSettings() {
      return options.baseStyleCartelaFromSettingsWithSettings(options.getProductionSettings());
    }

    function getEffectiveStyleBlock(style) {
      return options.getEffectiveStyleBlockWithSettings(style, options.getProductionSettings());
    }

    function getEffectiveCartela(cartela) {
      const style = getStyleById(cartela && cartela.style_id);
      return {
        ...(style ? getEffectiveStyleCartela(style) : baseStyleCartelaFromSettings()),
        ...(cartela || {}),
      };
    }

    function getCartelaStyleBlock(cartela) {
      const style = getStyleById(cartela && cartela.style_id);
      return style ? getEffectiveStyleBlock(style) : null;
    }

    function getRenderLayout() {
      return options.settingsWithProductionLayout(options.getProductionSettings(), options.getProductionLayout()).layout;
    }

    return {
      baseStyleCartelaFromSettings,
      getCartelaStyleBlock,
      getEffectiveCartela,
      getEffectiveCartelaTitleTypography,
      getEffectiveStyleBlock,
      getEffectiveStyleCartela,
      getEffectiveStyleTitleTypography,
      getRenderLayout,
      getSelectedCartela,
      getStyleById,
    };
  }

  root.CreditosAppSelectors = {
    createAppSelectors,
  };
})(globalThis);
