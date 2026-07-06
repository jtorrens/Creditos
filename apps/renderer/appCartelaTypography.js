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
        const row = documentRef.createElement('div');
        row.className = 'typography-row block-typography-row' + (isOverride ? ' override-field' : '');

        const labelEl = documentRef.createElement('label');
        labelEl.textContent = label;
        row.appendChild(labelEl);

        const sizeInput = options.makeFontSizeControl(value.font_size, base.font_size, (fontSize) => options.updateSelectedCartelaBlockTypography(key, { font_size: fontSize }));
        sizeInput.placeholder = String(base.font_size);
        row.appendChild(sizeInput);

        const fontSelect = options.makeFontFamilyControl(value.font_family, fontCatalog, (fontFamily) => {
          const nextStyle = options.getFontStyles(fontFamily)[0] || { style: 'Regular', postscript_name: '' };
          options.updateSelectedCartelaBlockTypography(key, {
            font_family: fontFamily,
            font_style: nextStyle.style,
            font_postscript_name: nextStyle.postscript_name,
          }, { rerenderEditor: true });
        });
        row.appendChild(fontSelect);

        const styleSelect = options.makeFontStyleControl(value.font_family, value.font_style, value.font_postscript_name, (fontStyle, postscriptName) => {
          options.updateSelectedCartelaBlockTypography(key, {
            font_style: fontStyle,
            font_postscript_name: postscriptName,
          });
        });
        row.appendChild(styleSelect);

        const colorInput = fieldControlRegistry.create('color', {
          value: options.normalizeColor(value.color),
          onInput: (color) => options.updateSelectedCartelaBlockTypography(key, { color }),
        });
        row.appendChild(colorInput);

        if (isOverride) {
          const resetButton = documentRef.createElement('button');
          resetButton.type = 'button';
          resetButton.textContent = 'Restablecer';
          resetButton.addEventListener('click', () => options.resetSelectedCartelaBlockTypographyOverride(key));
          row.appendChild(resetButton);
        }

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
      const row = documentRef.createElement('div');
      row.className = 'typography-row block-typography-row' + (isOverride ? ' override-field' : '');

      const labelEl = documentRef.createElement('label');
      labelEl.textContent = label;
      row.appendChild(labelEl);

      const sizeInput = options.makeFontSizeControl(value.font_size, base.font_size, (fontSize) => options.updateSelectedCartelaTitleTypography({ font_size: fontSize }));
      sizeInput.placeholder = String(base.font_size);
      row.appendChild(sizeInput);

      const fontSelect = options.makeFontFamilyControl(value.font_family, fontCatalog, (fontFamily) => {
        const nextStyle = options.getFontStyles(fontFamily)[0] || { style: 'Regular', postscript_name: '' };
        options.updateSelectedCartelaTitleTypography({
          font_family: fontFamily,
          font_style: nextStyle.style,
          font_postscript_name: nextStyle.postscript_name,
        }, { rerenderEditor: true });
      });
      row.appendChild(fontSelect);

      const styleSelect = options.makeFontStyleControl(value.font_family, value.font_style, value.font_postscript_name, (fontStyle, postscriptName) => {
        options.updateSelectedCartelaTitleTypography({
          font_style: fontStyle,
          font_postscript_name: postscriptName,
        });
      });
      row.appendChild(styleSelect);

      const colorInput = fieldControlRegistry.create('color', {
        value: options.normalizeColor(value.color),
        onInput: (color) => options.updateSelectedCartelaTitleTypography({ color }),
      });
      row.appendChild(colorInput);

      if (isOverride) {
        const resetButton = documentRef.createElement('button');
        resetButton.type = 'button';
        resetButton.textContent = 'Restablecer';
        resetButton.addEventListener('click', options.resetSelectedCartelaTitleTypographyOverride);
        row.appendChild(resetButton);
      }

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
