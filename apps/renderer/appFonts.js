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
    const fieldControlRegistry = options.fieldControlRegistry;
    const fontOptions = options.fontOptions || DEFAULT_FONT_OPTIONS;

    function makeFontSizeControl(value, fallbackValue, onInput) {
      return fieldControlRegistry.create('number', {
        value,
        min: 1,
        step: 1,
        fallbackValue,
        onInput,
      });
    }

    function makeFontFamilyControl(value, fontCatalog, onInput) {
      const controlOptions = fontCatalog.families.map((font) => [font, font]);
      if (!fontCatalog.families.includes(value)) controlOptions.push([value, value]);
      return fieldControlRegistry.create('select', {
        value,
        className: 'text-input font-family-select',
        options: controlOptions,
        onInput,
      });
    }

    function makeFontStyleControl(fontFamily, value, postscriptName, onInput) {
      const styles = getFontStyles(fontFamily);
      const controlOptions = styles.map((fontStyle) => [
        fontStyle.style,
        fontStyle.style,
        { postscriptName: fontStyle.postscript_name || '' },
      ]);
      if (!styles.some((fontStyle) => fontStyle.style === value)) {
        controlOptions.push([value, value, { postscriptName: postscriptName || '' }]);
      }
      return fieldControlRegistry.create('select', {
        value,
        options: controlOptions,
        onInput: (_fontStyle, select) => {
          const selected = select.selectedOptions[0];
          onInput(select.value, selected ? selected.dataset.postscriptName || '' : '');
        },
      });
    }

    async function loadSystemFonts(loadOptions = {}) {
      if (!windowRef.queryLocalFonts) {
        if (!loadOptions.silent) windowRef.alert('Chrome no permite leer fuentes del sistema en este entorno. Se usara la lista basica.');
        return;
      }

      try {
        const fonts = await windowRef.queryLocalFonts();
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
      makeFontFamilyControl,
      makeFontSizeControl,
      makeFontStyleControl,
    };
  }

  root.CreditosAppFonts = {
    createAppFonts,
  };
})(globalThis);
