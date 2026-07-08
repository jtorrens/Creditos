(function (root) {
  function createTypographyFieldControl(dependencies = {}) {
    const {
      documentRef = root.document,
      fieldControlRegistry,
    } = dependencies;

    function create(options = {}) {
      const value = options.value || {};
      const base = options.base || {};
      const row = documentRef.createElement('div');
      row.className = options.className || 'typography-row block-typography-row';
      if (options.override) row.classList.add('override-field');

      if (options.label) {
        const labelEl = documentRef.createElement('label');
        labelEl.textContent = options.label;
        row.appendChild(labelEl);
      }

      const sizeInput = fieldControlRegistry.create('number', {
        value: value.font_size,
        min: options.minFontSize === undefined ? 1 : options.minFontSize,
        step: options.fontSizeStep === undefined ? 1 : options.fontSizeStep,
        fallbackValue: base.font_size === undefined ? 1 : base.font_size,
        onInput: (fontSize) => onChange(options, { font_size: fontSize }, 'font_size'),
      });
      if (base.font_size !== undefined) sizeInput.placeholder = String(base.font_size);
      row.appendChild(wrapMiniField('Tamaño', sizeInput));

      const letterSpacingInput = fieldControlRegistry.create('number', {
        value: value.letter_spacing,
        step: options.letterSpacingStep === undefined ? 0.1 : options.letterSpacingStep,
        fallbackValue: base.letter_spacing === undefined ? 0 : base.letter_spacing,
        onInput: (letterSpacing) => onChange(options, { letter_spacing: letterSpacing }, 'letter_spacing'),
      });
      letterSpacingInput.title = 'Espaciado entre caracteres';
      letterSpacingInput.setAttribute('aria-label', 'Espaciado entre caracteres');
      if (base.letter_spacing !== undefined) letterSpacingInput.placeholder = String(base.letter_spacing);
      row.appendChild(wrapMiniField('Caracteres', letterSpacingInput));

      let styleSelect = null;
      const familySelect = fieldControlRegistry.create('select', {
        value: value.font_family,
        className: 'text-input font-family-select',
        options: fontFamilyOptions(options.fontCatalog, value.font_family),
        onInput: (fontFamily) => {
          const nextStyle = firstFontStyle(options, fontFamily);
          populateStyleSelect(styleSelect, options, fontFamily, nextStyle.style, nextStyle.postscript_name);
          onChange(options, {
            font_family: fontFamily,
            font_style: nextStyle.style,
            font_postscript_name: nextStyle.postscript_name,
          }, 'font_family');
        },
      });
      row.appendChild(familySelect);

      styleSelect = fieldControlRegistry.create('select', {
        value: value.font_style,
        options: fontStyleOptions(options, value.font_family, value.font_style, value.font_postscript_name),
        onInput: (_fontStyle, select) => {
          const selected = select.selectedOptions[0];
          onChange(options, {
            font_style: select.value,
            font_postscript_name: selected ? selected.dataset.postscriptName || '' : '',
          }, 'font_style');
        },
      });
      row.appendChild(styleSelect);

      const colorInput = fieldControlRegistry.create('color', {
        value: normalizeColor(options, value.color),
        onInput: (color) => onChange(options, { color }, 'color'),
      });
      row.appendChild(colorInput);

      if (options.override && options.onReset) {
        const resetButton = documentRef.createElement('button');
        resetButton.type = 'button';
        resetButton.className = 'override-reset-button';
        resetButton.textContent = '↻';
        resetButton.title = 'Restablecer';
        resetButton.setAttribute('aria-label', 'Restablecer');
        resetButton.addEventListener('click', options.onReset);
        row.appendChild(resetButton);
      }

      return row;
    }

    function fontFamilyOptions(fontCatalog = {}, value) {
      const families = Array.isArray(fontCatalog.families) ? fontCatalog.families : [];
      const controlOptions = families.map((font) => [font, font]);
      if (value && !families.includes(value)) controlOptions.push([value, value]);
      return controlOptions;
    }

    function fontStyleOptions(options, fontFamily, value, postscriptName) {
      const styles = getFontStyles(options, fontFamily);
      const controlOptions = styles.map((fontStyle) => [
        fontStyle.style,
        fontStyle.style,
        { postscriptName: fontStyle.postscript_name || '' },
      ]);
      if (value && !styles.some((fontStyle) => fontStyle.style === value)) {
        controlOptions.push([value, value, { postscriptName: postscriptName || '' }]);
      }
      return controlOptions;
    }

    function populateStyleSelect(select, options, fontFamily, value, postscriptName) {
      if (!select) return;
      select.innerHTML = '';
      fontStyleOptions(options, fontFamily, value, postscriptName).forEach(([optionValue, optionLabel, optionMeta = {}]) => {
        const option = documentRef.createElement('option');
        option.value = optionValue;
        option.textContent = optionLabel;
        if (optionMeta.postscriptName !== undefined) option.dataset.postscriptName = optionMeta.postscriptName || '';
        select.appendChild(option);
      });
      select.value = value;
    }

    function firstFontStyle(options, fontFamily) {
      return getFontStyles(options, fontFamily)[0] || { style: 'Regular', postscript_name: '' };
    }

    function getFontStyles(options, fontFamily) {
      return typeof options.getFontStyles === 'function' ? options.getFontStyles(fontFamily) : [];
    }

    function normalizeColor(options, value) {
      return typeof options.normalizeColor === 'function' ? options.normalizeColor(value) : (value || '#ffffff');
    }

    function onChange(options, fields, field) {
      (options.onInput || options.onChange || (() => {}))(fields, { field });
    }

    function wrapMiniField(label, control) {
      const wrap = documentRef.createElement('label');
      wrap.className = 'typography-mini-field';
      const labelEl = documentRef.createElement('span');
      labelEl.textContent = label;
      wrap.appendChild(labelEl);
      wrap.appendChild(control);
      return wrap;
    }

    return { create };
  }

  root.CreditosTypographyFieldControl = {
    createTypographyFieldControl,
  };
})(globalThis);
