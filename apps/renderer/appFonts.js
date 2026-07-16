(function (root) {
  const DEFAULT_FONT_OPTIONS = [
    'Arial',
    'Helvetica',
    'Georgia',
    'Times New Roman',
    'Courier New',
    'Verdana',
    'Trebuchet MS',
  ];

  function createAppFonts(options = {}) {
    const state = options.state;
    const windowRef = options.windowRef || root;
    const fontOptions = options.fontOptions || DEFAULT_FONT_OPTIONS;

    async function loadSystemFonts(loadOptions = {}) {
      if (!windowRef.queryLocalFonts) {
        if (!loadOptions.silent) windowRef.alert('Chrome no permite leer fuentes del sistema en este entorno. Se usara la lista basica.');
        return;
      }

      try {
        const fonts = await windowRef.queryLocalFonts();
        if (typeof options.setFontSources === 'function') options.setFontSources(fonts);
        state.fontCatalog = options.buildFontCatalog(fonts);
        options.renderProjectSelectors();
        options.renderSettings();
        options.renderEditor();
        options.renderPreview();
        options.refreshPdfIfActive();
      } catch (error) {
        if (!loadOptions.silent && error.name !== 'AbortError') {
          windowRef.alert('No se pudieron cargar las fuentes del sistema: ' + error.message);
        }
      }
    }

    function getFontCatalog() {
      if (state.fontCatalog) return state.fontCatalog;
      return options.fallbackFontCatalog(fontOptions);
    }

    function getFontStyles(family) {
      return options.fontStylesForFamily(getFontCatalog(), family);
    }

    return {
      getFontCatalog,
      getFontStyles,
      loadSystemFonts,
    };
  }

  root.CreditosAppFonts = {
    createAppFonts,
  };
})(globalThis);
