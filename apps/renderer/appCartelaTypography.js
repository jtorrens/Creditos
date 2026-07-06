(function (root) {
  function createAppCartelaTypography(options = {}) {
    const documentRef = options.documentRef || root.document;
    const fieldControlRegistry = options.fieldControlRegistry;

    function renderCartelaBlockTypographyControls(cartela, overrides) {
      const wrap = documentRef.createElement('div');
      wrap.className = 'block-typography-settings';
      wrap.appendChild(options.sectionLabel('Tipografía del bloque'));

      const settings = options.getProductionSettings();
      const fontCatalog = options.getFontCatalog();

      options.blockTypographyFields.forEach(([key, label]) => {
        const base = settings.typography[key];
        const override = overrides[key] || {};
        const value = { ...base, ...override };
        const isOverride = options.hasCartelaBlockTypographyOverride(cartela, key);
        const row = fieldControlRegistry.create('typography', {
          base,
          className: 'typography-row block-typography-row',
          fontCatalog,
          getFontStyles: options.getFontStyles,
          label,
          normalizeColor: options.normalizeColor,
          onInput: (fields, meta) => options.updateSelectedCartelaBlockTypography(key, fields, { rerenderEditor: meta.field === 'font_family' }),
          onReset: () => options.resetSelectedCartelaBlockTypographyOverride(key),
          override: isOverride,
          value,
        });

        wrap.appendChild(row);
      });

      return wrap;
    }

    function renderCartelaTitleTypographyControls(cartela) {
      const wrap = documentRef.createElement('div');
      wrap.className = 'block-typography-settings';
      wrap.appendChild(options.sectionLabel('Tipografía del título de cartela'));

      const fontCatalog = options.getFontCatalog();
      const key = 'page_header';
      const label = 'Cabecera';
      const base = options.getEffectiveStyleTitleTypography(options.getStyleById(cartela && cartela.style_id)).page_header;
      const override = cartela && cartela.title_typography && cartela.title_typography[key] ? cartela.title_typography[key] : {};
      const value = { ...base, ...override };
      const isOverride = options.hasCartelaTitleTypographyOverride(cartela);
      const row = fieldControlRegistry.create('typography', {
        base,
        className: 'typography-row block-typography-row',
        fontCatalog,
        getFontStyles: options.getFontStyles,
        label,
        normalizeColor: options.normalizeColor,
        onInput: (fields, meta) => options.updateSelectedCartelaTitleTypography(fields, { rerenderEditor: meta.field === 'font_family' }),
        onReset: options.resetSelectedCartelaTitleTypographyOverride,
        override: isOverride,
        value,
      });

      wrap.appendChild(row);
      return wrap;
    }

    return {
      renderCartelaBlockTypographyControls,
      renderCartelaTitleTypographyControls,
    };
  }

  root.CreditosAppCartelaTypography = {
    createAppCartelaTypography,
  };
})(globalThis);
