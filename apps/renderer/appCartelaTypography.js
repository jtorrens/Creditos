(function (root) {
  function createAppCartelaTypography(options = {}) {
    const documentRef = options.documentRef || root.document;
    const fieldControlRegistry = options.fieldControlRegistry;

    function renderCartelaBlockTypographyControls(cartela, overrides, controlOptions = {}) {
      const wrap = documentRef.createElement('div');
      wrap.className = 'block-typography-settings';
      if (controlOptions.includeTitle !== false) wrap.appendChild(options.sectionLabel('Tipografía del bloque'));

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
          animationMetaForField: (field, currentValue) => animationMetaForTypographyField(cartela, key, field, currentValue),
          hasOverrideForField: (field) => typographyFieldHasOverride(override, field),
          onInput: (fields, meta) => options.updateSelectedCartelaBlockTypography(key, fields, { rerenderEditor: meta.field === 'font_family' }),
          onResetField: (fields) => options.resetSelectedCartelaBlockTypographyFieldOverride(key, fields),
          onReset: () => options.resetSelectedCartelaBlockTypographyOverride(key),
          override: isOverride,
          value,
        });

        wrap.appendChild(row);
      });

      return wrap;
    }

    function renderCartelaTitleTypographyControls(cartela, controlOptions = {}) {
      const wrap = documentRef.createElement('div');
      wrap.className = 'block-typography-settings';
      if (controlOptions.includeTitle !== false) wrap.appendChild(options.sectionLabel('Tipografía del título de cartela'));

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
        hasOverrideForField: (field) => typographyFieldHasOverride(override, field),
        onInput: (fields, meta) => options.updateSelectedCartelaTitleTypography(fields, { rerenderEditor: meta.field === 'font_family' }),
        onResetField: (fields) => options.resetSelectedCartelaTitleTypographyFieldOverride(fields),
        onReset: options.resetSelectedCartelaTitleTypographyOverride,
        override: isOverride,
        value,
      });

      wrap.appendChild(row);
      return wrap;
    }

    function animationMetaForTypographyField(cartela, typographyKey, field, currentValue) {
      const key = typographyAnimationKey(typographyKey, field);
      if (!key || typeof options.cartelaAnimationRowMeta !== 'function') return {};
      return options.cartelaAnimationRowMeta(cartela, key, { animationDefaultValue: currentValue });
    }

    function typographyAnimationKey(typographyKey, field) {
      if (field !== 'font_size' && field !== 'letter_spacing') return '';
      if (typographyKey !== 'block_title' && typographyKey !== 'role' && typographyKey !== 'name') return '';
      return `typography.${typographyKey}.${field}`;
    }

    function typographyFieldHasOverride(override = {}, field) {
      return fieldsForTypographyField(field).some((key) => Object.prototype.hasOwnProperty.call(override, key));
    }

    function fieldsForTypographyField(field) {
      if (field === 'font_family') return ['font_family', 'font_style', 'font_postscript_name'];
      if (field === 'font_weight') return ['font_weight', 'font_style', 'font_postscript_name'];
      return [field];
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
