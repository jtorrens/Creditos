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

      const heading = documentRef.createElement('div');
      heading.className = 'typography-group-heading';
      heading.textContent = options.label || 'Tipografía';
      group.appendChild(heading);

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

      const currentWeight = normalizeFontWeight(value.font_weight, value.font_style);
      const familySelect = fieldControlRegistry.create('select', {
        value: value.font_family,
        className: 'text-input font-family-select',
        options: fontFamilyOptions(options.fontCatalog, value.font_family),
        onInput: (fontFamily) => {
          const nextStyle = closestFontStyle(options, fontFamily, currentWeight, value.font_style);
          onChange(options, {
            font_family: fontFamily,
            font_weight: currentWeight,
            font_style: nextStyle.style,
            font_postscript_name: nextStyle.postscript_name,
          }, 'font_family');
        },
      });
      group.appendChild(typographyControlRow('Familia', familySelect, options, 'font_family'));

      const weightSelect = fieldControlRegistry.create('select', {
        value: currentWeight,
        className: 'text-input compact-select font-weight-select',
        options: fontWeightOptions(value.font_weight),
        onInput: (fontWeight) => {
          const resolvedWeight = normalizeFontWeight(fontWeight, value.font_style);
          const nextStyle = closestFontStyle(options, value.font_family, resolvedWeight, value.font_style);
          onChange(options, {
            font_weight: resolvedWeight,
            font_style: nextStyle.style,
            font_postscript_name: nextStyle.postscript_name,
          }, 'font_weight');
        },
      });
      group.appendChild(typographyControlRow('Peso', weightSelect, options, 'font_weight'));

      const colorInput = fieldControlRegistry.create('color', {
        value: normalizeColor(options, value.color),
        onInput: (color) => onChange(options, { color }, 'color'),
      });
      group.appendChild(typographyControlRow('Color', colorInput, options, 'color'));
      group.appendChild(typographyNumberRow('Tamaño', sizeInput, metaWithReset(options, 'font_size', value.font_size)));
      group.appendChild(typographyNumberRow('Spacing', letterSpacingInput, metaWithReset(options, 'letter_spacing', value.letter_spacing)));
      return group;
    }

    function fontFamilyOptions(fontCatalog = {}, value) {
      const families = Array.isArray(fontCatalog.families) ? fontCatalog.families : [];
      const controlOptions = families.map((font) => [font, font]);
      if (value && !families.includes(value)) controlOptions.push([value, value]);
      return controlOptions;
    }

    function fontWeightOptions(value) {
      const weights = [200, 300, 400, 500, 600, 700, 800, 900];
      const normalizedValue = normalizeFontWeight(value, 400);
      const controlOptions = weights.map((weight) => [weight, String(weight)]);
      if (!weights.includes(normalizedValue)) controlOptions.push([normalizedValue, String(normalizedValue)]);
      return controlOptions;
    }

    function closestFontStyle(options, fontFamily, weight, currentStyle) {
      const styles = getFontStyles(options, fontFamily);
      const targetWeight = normalizeFontWeight(weight, currentStyle);
      const targetItalic = /italic|oblique/i.test(currentStyle || '');
      const samePosture = styles.filter((fontStyle) => /italic|oblique/i.test(fontStyle.style || '') === targetItalic);
      const candidates = samePosture.length ? samePosture : styles;
      return candidates
        .slice()
        .sort((a, b) => {
          const weightScore = Math.abs(fontWeightFromStyle(a.style) - targetWeight) - Math.abs(fontWeightFromStyle(b.style) - targetWeight);
          if (weightScore !== 0) return weightScore;
          const aRegular = /regular|book|normal/i.test(a.style || '') ? 0 : 1;
          const bRegular = /regular|book|normal/i.test(b.style || '') ? 0 : 1;
          return aRegular - bRegular;
        })[0] || { style: 'Regular', postscript_name: '' };
    }

    function getFontStyles(options, fontFamily) {
      return typeof options.getFontStyles === 'function' ? options.getFontStyles(fontFamily) : [];
    }

    function normalizeFontWeight(value, fallback = 400) {
      const numeric = Number(value);
      const hasValue = value !== undefined && value !== null && value !== '';
      const fallbackNumeric = Number.isFinite(Number(fallback)) ? Number(fallback) : fontWeightFromStyle(fallback);
      const valueWeight = hasValue && !(Number.isFinite(numeric) && numeric > 0) ? fontWeightFromStyle(value) : NaN;
      const resolved = Number.isFinite(numeric) && numeric > 0 ? numeric : (Number.isFinite(valueWeight) ? valueWeight : fallbackNumeric);
      return [200, 300, 400, 500, 600, 700, 800, 900].reduce((closest, option) => (
        Math.abs(option - resolved) < Math.abs(closest - resolved) ? option : closest
      ), 200);
    }

    function fontWeightFromStyle(style) {
      const numeric = Number(style);
      if (Number.isFinite(numeric) && numeric > 0) return normalizeFontWeight(numeric);
      const value = String(style || '');
      if (/thin|extra\s*light|ultra\s*light/i.test(value)) return 200;
      if (/light/i.test(value)) return 300;
      if (/medium/i.test(value)) return 500;
      if (/semi\s*bold|demi\s*bold/i.test(value)) return 600;
      if (/extra\s*bold|ultra\s*bold/i.test(value)) return 800;
      if (/black|heavy/i.test(value)) return 900;
      if (/bold/i.test(value)) return 700;
      return 400;
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
      if (meta.hasFieldOverride) row.classList.add('has-field-override');
      row.appendChild(wrapNumberControl(control, meta));
      return row;
    }

    function typographyControlRow(label, control, options, field) {
      const row = typographyRow(label);
      if (fieldHasOverride(options, field)) row.classList.add('has-field-override');
      const wrap = documentRef.createElement('div');
      wrap.className = 'field-control-inline typography-control-inline';
      wrap.appendChild(control);
      const resetButton = resetButtonForField(options, field);
      if (resetButton) wrap.appendChild(resetButton);
      row.appendChild(wrap);
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

    function metaWithReset(options, field, value) {
      const meta = metaForField(options, field, value);
      const hasFieldOverride = fieldHasOverride(options, field);
      const resetButton = resetButtonForField(options, field);
      if (!resetButton) return { ...meta, hasFieldOverride };
      return {
        ...meta,
        hasFieldOverride,
        afterControl: appendInlineControl(meta.afterControl, resetButton),
      };
    }

    function appendInlineControl(current, next) {
      if (!current) return next;
      const wrap = documentRef.createElement('div');
      wrap.className = 'field-control-inline';
      wrap.appendChild(current);
      wrap.appendChild(next);
      return wrap;
    }

    function metaForField(options, field, value) {
      if (typeof options.animationMetaForField !== 'function') return {};
      return options.animationMetaForField(field, value) || {};
    }

    function resetButtonForField(options, field) {
      if (!options.onResetField || !fieldHasOverride(options, field)) return null;
      const resetButton = documentRef.createElement('button');
      resetButton.type = 'button';
      resetButton.className = 'override-reset-button';
      resetButton.textContent = '↻';
      resetButton.title = 'Restablecer';
      resetButton.setAttribute('aria-label', 'Restablecer');
      resetButton.addEventListener('click', () => runResetAction(resetButton, () => options.onResetField(fieldsForReset(field), field)));
      return resetButton;
    }

    function runResetAction(trigger, action) {
      const busyAction = root.CreditosBusyAction;
      if (busyAction && typeof busyAction.run === 'function') {
        return busyAction.run({ trigger, action, documentRef, windowRef: root });
      }
      return action();
    }

    function fieldHasOverride(options, field) {
      if (typeof options.hasOverrideForField === 'function') return !!options.hasOverrideForField(field);
      return !!options.override;
    }

    function fieldsForReset(field) {
      if (field === 'font_family') return ['font_family', 'font_style', 'font_postscript_name'];
      if (field === 'font_weight') return ['font_weight', 'font_style', 'font_postscript_name'];
      return [field];
    }

    return { create };
  }

  root.CreditosTypographyFieldControl = {
    createTypographyFieldControl,
  };
})(globalThis);
