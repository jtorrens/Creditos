(function (root) {
  function createSettingsPanel(options = {}) {
    const documentRef = options.documentRef || root.document;
    const els = options.els;
    const fieldControlRegistry = options.fieldControlRegistry;

    function renderSettings() {
      const settings = options.getProductionSettings();
      els.defaultDurationInput.value = options.formatSecondsAsFrameDuration(settings.default_cartela_duration, options.currentMovieFps());
      els.defaultAutoLinesInput.value = String(settings.default_auto_page_lines);
      els.movieFpsInput.value = String(settings.movie_fps);
      renderTypographySettings(settings);
      renderLayoutSettings(settings);
    }

    function renderTypographySettings(settings) {
      els.typographySettings.innerHTML = '';
      els.typographySettings.appendChild(options.sectionLabel('Tipografia base'));
      const fontCatalog = options.getFontCatalog();

      options.typographyFields.forEach(([key, label]) => {
        const value = settings.typography[key];
        const row = fieldControlRegistry.create('typography', {
          base: { font_size: 1 },
          className: 'typography-row',
          fontCatalog,
          getFontStyles: options.getFontStyles,
          label,
          normalizeColor: options.normalizeColor,
          onInput: (fields) => options.updateTypographySetting(key, fields),
          value,
        });
        els.typographySettings.appendChild(row);
      });
    }

    function renderLayoutSettings(settings) {
      const existing = documentRef.getElementById('layoutSettings');
      if (existing) existing.remove();

      const wrap = documentRef.createElement('div');
      wrap.id = 'layoutSettings';
      wrap.className = 'layout-settings';
      wrap.appendChild(options.sectionLabel('Composición base'));
      wrap.appendChild(options.localSelectRow('Idioma', settings.language, options.languageOptions, (value) => options.updateSettings({ language: value })));
      wrap.appendChild(options.localSelectRow('Capitalización', settings.text_capitalization, options.textCapitalizationOptions, (value) => options.updateSettings({ text_capitalization: value })));
      wrap.appendChild(options.localInputRow('Capitalización protegida', settings.protected_capitalizations, (value) => options.updateSettings({ protected_capitalizations: options.normalizeProtectedCapitalizationText(value) }), { multiline: true, commitOnChange: true }));
      wrap.appendChild(options.localSelectRow('Usar capitalización protegida', options.boolSelectValue(settings.use_protected_capitalization), options.yesNoOptions, (value) => options.updateSettings({ use_protected_capitalization: options.normalizeBoolean(value, true) })));
      wrap.appendChild(settingsNumberRow('Interlineado', settings.layout.line_spacing, 0.1, null, 0.01, (value) => options.updateLayoutSetting({ line_spacing: value })));
      wrap.appendChild(settingsNumberRow('Separación entre columnas', settings.layout.column_gap, 0, null, 1, (value) => options.updateLayoutSetting({ column_gap: value })));
      wrap.appendChild(settingsNumberRow('Separación cargo/nombre', settings.layout.role_name_gap, 0, null, 1, (value) => options.updateLayoutSetting({ role_name_gap: value })));
      wrap.appendChild(settingsNumberRow('Separación de grupos del origen', settings.layout.source_group_gap, 0, null, 1, (value) => options.updateLayoutSetting({ source_group_gap: value })));
      wrap.appendChild(settingsNumberRow('Separación entre bloques', settings.layout.block_gap, 0, null, 1, (value) => options.updateLayoutSetting({ block_gap: value })));
      wrap.appendChild(settingsNumberRow('Separación título/primera fila', settings.layout.block_title_gap, 0, null, 1, (value) => options.updateLayoutSetting({ block_title_gap: value })));
      wrap.appendChild(settingsNumberRow('Margen superior de página', settings.layout.page_top_margin, 0, null, 1, (value) => options.updateLayoutSetting({ page_top_margin: value })));
      wrap.appendChild(settingsNumberRow('Margen inferior de página', settings.layout.page_bottom_margin, 0, null, 1, (value) => options.updateLayoutSetting({ page_bottom_margin: value })));
      wrap.appendChild(settingsNumberRow('Margen izquierdo de página', settings.layout.page_left_margin, 0, null, 1, (value) => options.updateLayoutSetting({ page_left_margin: value })));
      wrap.appendChild(settingsNumberRow('Margen derecho de página', settings.layout.page_right_margin, 0, null, 1, (value) => options.updateLayoutSetting({ page_right_margin: value })));
      wrap.appendChild(options.localSelectRow('Repetir nombre de bloque', options.boolSelectValue(settings.layout.repeat_block_titles), options.yesNoOptions, (value) => options.updateLayoutSetting({ repeat_block_titles: options.normalizeBoolean(value, true) })));
      wrap.appendChild(options.localSelectRow('Wrap automático de texto', options.boolSelectValue(settings.layout.auto_text_wrap), options.yesNoOptions, (value) => options.updateLayoutSetting({ auto_text_wrap: options.normalizeBoolean(value, false) })));
      wrap.appendChild(options.sectionLabel('Scroll'));
      wrap.appendChild(settingsNumberRow('Separación entre cartelas', settings.layout.scroll_page_gap, 0, null, 1, (value) => options.updateLayoutSetting({ scroll_page_gap: value })));
      wrap.appendChild(settingsNumberRow('Separación antes de última cartela', settings.layout.scroll_last_page_gap, 0, null, 1, (value) => options.updateLayoutSetting({ scroll_last_page_gap: value })));
      wrap.appendChild(settingsNumberRow('Fade superior', settings.layout.scroll_fade_up, 0, null, 1, (value) => options.updateLayoutSetting({ scroll_fade_up: value })));
      wrap.appendChild(settingsNumberRow('Fade inferior', settings.layout.scroll_fade_down, 0, null, 1, (value) => options.updateLayoutSetting({ scroll_fade_down: value })));
      els.typographySettings.after(wrap);
    }

    function settingsNumberRow(label, value, min, max, step, onInput) {
      const row = documentRef.createElement('div');
      row.className = 'field-grid';
      const labelEl = documentRef.createElement('label');
      labelEl.textContent = label;
      const input = fieldControlRegistry.create('number', {
        value,
        min,
        max,
        step,
        onInput,
      });
      row.appendChild(labelEl);
      row.appendChild(input);
      return row;
    }

    return {
      renderSettings,
    };
  }

  root.CreditosSettingsPanel = {
    createSettingsPanel,
  };
})(globalThis);
