(function (root) {
  function createTypographyFieldControl(dependencies = {}) {
    const {
      documentRef = root.document,
      fieldControlRegistry,
    } = dependencies;

    function create(options = {}) {
      const value = options.value || {};
      const base = options.base || {};
      const group = documentRef.createElement('div');
      group.className = normalizeGroupClassName(options.className);
      if (options.override) group.classList.add('override-field');

      const fontRow = typographyRow(options.label || 'Tipografía');
      const fontControls = documentRef.createElement('div');
      fontControls.className = 'typography-font-controls';

      const sizeInput = fieldControlRegistry.create('number', {
        value: value.font_size,
        min: options.minFontSize === undefined ? 1 : options.minFontSize,
        step: options.fontSizeStep === undefined ? 1 : options.fontSizeStep,
        fallbackValue: base.font_size === undefined ? 1 : base.font_size,
        onInput: (fontSize) => onChange(options, { font_size: fontSize }, 'font_size'),
      });
      if (base.font_size !== undefined) sizeInput.placeholder = String(base.font_size);

      const letterSpacingInput = fieldControlRegistry.create('number', {
        value: value.letter_spacing,
        step: options.letterSpacingStep === undefined ? 0.1 : options.letterSpacingStep,
        fallbackValue: base.letter_spacing === undefined ? 0 : base.letter_spacing,
        onInput: (letterSpacing) => onChange(options, { letter_spacing: letterSpacing }, 'letter_spacing'),
      });
      letterSpacingInput.title = 'Espaciado entre caracteres';
      letterSpacingInput.setAttribute('aria-label', 'Espaciado entre caracteres');
      if (base.letter_spacing !== undefined) letterSpacingInput.placeholder = String(base.letter_spacing);

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
      fontControls.appendChild(familySelect);

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
      fontControls.appendChild(styleSelect);

      const colorInput = fieldControlRegistry.create('color', {
        value: normalizeColor(options, value.color),
        onInput: (color) => onChange(options, { color }, 'color'),
      });
      fontControls.appendChild(colorInput);

      if (options.override && options.onReset) {
        const resetButton = documentRef.createElement('button');
        resetButton.type = 'button';
        resetButton.className = 'override-reset-button';
        resetButton.textContent = '↻';
        resetButton.title = 'Restablecer';
        resetButton.setAttribute('aria-label', 'Restablecer');
        resetButton.addEventListener('click', options.onReset);
        fontControls.appendChild(resetButton);
      }

      fontRow.appendChild(fontControls);
      group.appendChild(fontRow);
      group.appendChild(typographyNumberRow('Tamaño', sizeInput, metaForField(options, 'font_size', value.font_size)));
      group.appendChild(typographyNumberRow('Spacing', letterSpacingInput, metaForField(options, 'letter_spacing', value.letter_spacing)));
      return group;
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

    function normalizeGroupClassName(className) {
      if (!className) return 'typography-control-group block-typography-control-group';
      return String(className)
        .replace(/\btypography-row\b/g, 'typography-control-group')
        .replace(/\bblock-typography-row\b/g, 'block-typography-control-group')
        .trim();
    }

    function typographyRow(label) {
      const row = documentRef.createElement('div');
      row.className = 'field-grid typography-sub-row';
      const labelEl = documentRef.createElement('span');
      labelEl.className = 'typography-sub-label';
      labelEl.textContent = label;
      row.appendChild(labelEl);
      return row;
    }

    function typographyNumberRow(label, control, meta = {}) {
      const row = typographyRow(label);
      row.appendChild(wrapNumberControl(control, meta));
      return row;
    }

    function wrapNumberControl(control, meta = {}) {
      if (!meta.beforeControl && !meta.afterControl) return control;
      const wrap = documentRef.createElement('div');
      wrap.className = 'field-control-inline';
      if (meta.beforeControl) wrap.appendChild(meta.beforeControl);
      wrap.appendChild(control);
      if (meta.afterControl) wrap.appendChild(meta.afterControl);
      return wrap;
    }

    function metaForField(options, field, value) {
      if (typeof options.animationMetaForField !== 'function') return {};
      return options.animationMetaForField(field, value) || {};
    }

    return { create };
  }

  root.CreditosTypographyFieldControl = {
    createTypographyFieldControl,
  };
})(globalThis);
