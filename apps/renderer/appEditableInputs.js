(function (root) {
  function createAppEditableInputs(options = {}) {
    const documentRef = options.documentRef || root.document;
    const windowRef = options.windowRef || root;
    const fieldControlRegistry = options.fieldControlRegistry;
    const state = options.state;

    function inputRow(label, refId, field, fallback, rowOptions) {
      const row = documentRef.createElement('div');
      row.className = 'field-grid';
      const labelEl = documentRef.createElement('label');
      labelEl.textContent = label;
      row.appendChild(labelEl);
      row.appendChild(makeInput(refId, field, fallback, rowOptions));
      return row;
    }

    function makeInput(refId, field, fallback, inputOptions) {
      const opts = inputOptions || {};
      const current = options.resolveOverride(state.structure.overrides || {}, refId, field, fallback);
      const input = fieldControlRegistry.create('text', {
        value: Array.isArray(current) ? current.join('\n') : (current || ''),
        multiline: opts.multiline,
        rows: opts.multiline ? 1 : undefined,
        spellcheck: opts.multiline ? false : undefined,
        onInput: (rawValue, control) => {
          if (opts.multiline) resizeMultilineInput(control);
          const parsedValue = opts.parse ? opts.parse(rawValue) : rawValue;
          const parsedFallback = opts.fallback !== undefined ? opts.fallback : fallback;
          options.setEditableOverride(refId, field, parsedValue, parsedFallback);
          state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
          options.renderPreview();
        },
      });
      if (opts.multiline) windowRef.requestAnimationFrame(() => resizeMultilineInput(input));
      return input;
    }

    function makePreviewInput(refId, field, fallback, className) {
      const input = makeInput(refId, field, fallback, { multiline: true });
      input.classList.add('preview-input', className);
      configureTextWrapInput(input, options.normalizeBoolean(options.getEffectiveCartela(options.getSelectedCartela() || {}).auto_text_wrap, false));
      return input;
    }

    function makeVisualInput(refId, field, fallback, className, visualOptions = {}) {
      const input = makeInput(refId, field, fallback, { multiline: true });
      input.classList.add('visual-input', className);
      input.setAttribute('aria-label', field);
      if (visualOptions.styleKey) applyTypography(input, visualOptions.styleKey, visualOptions);
      if (visualOptions.textAlign) input.style.textAlign = visualOptions.textAlign;
      configureTextWrapInput(input, options.normalizeBoolean(visualOptions.autoWrap, false));
      windowRef.requestAnimationFrame(() => resizeMultilineInput(input));
      return input;
    }

    function configureTextWrapInput(input, autoWrap) {
      input.wrap = autoWrap ? 'soft' : 'off';
      input.style.whiteSpace = autoWrap ? 'pre-wrap' : 'pre';
      input.style.overflowWrap = autoWrap ? 'break-word' : 'normal';
    }

    function resizeMultilineInput(input) {
      if (!input || input.tagName !== 'TEXTAREA') return;
      input.style.height = 'auto';
      input.style.height = `${Math.max(input.scrollHeight, 30)}px`;
    }

    function applyTypography(element, key, typographyOptions = {}) {
      const settings = options.normalizeSettings(typographyOptions.settings || options.getProductionSettings());
      const typography = {
        ...settings.typography[key],
        ...((typographyOptions.typography && typographyOptions.typography[key]) || {}),
      };
      const scale = Number(typographyOptions.multiplier) || 1;
      const lineScale = Number(typographyOptions.lineMultiplier) || 1;
      element.style.fontFamily = typography.font_family;
      element.style.fontSize = `${Math.max(1, Number(typography.font_size) || 1) * scale}px`;
      element.style.letterSpacing = `${Number(typography.letter_spacing) || 0}px`;
      element.style.lineHeight = String(settings.layout.line_spacing * lineScale);
      element.style.fontWeight = options.fontWeightFromStyle(typography.font_style);
      element.style.fontStyle = /italic|oblique/i.test(typography.font_style || '') ? 'italic' : 'normal';
      element.style.color = typography.color;
    }

    return {
      applyTypography,
      inputRow,
      makePreviewInput,
      makeVisualInput,
    };
  }

  root.CreditosAppEditableInputs = {
    createAppEditableInputs,
  };
})(globalThis);
