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
      renderSettingsCards(settings);
    }

    function renderSettingsCards(settings) {
      els.typographySettings.innerHTML = '';
      const existing = documentRef.getElementById('layoutSettings');
      if (existing) existing.remove();
      const cards = [
        {
          id: 'texto',
          title: 'Párrafo',
          summary: 'Idioma, capitalización y sustituciones',
          icon: '¶',
          render: (panel) => panel.appendChild(renderTextSettings(settings)),
        },
        {
          id: 'pagina',
          title: 'Página',
          summary: 'Márgenes generales de la composición',
          icon: '□',
          render: (panel) => panel.appendChild(renderPageSettings(settings)),
        },
        {
          id: 'espaciado',
          title: 'Espaciado',
          summary: 'Interlineado, separaciones y wrap',
          icon: '↔',
          render: (panel) => panel.appendChild(renderSpacingSettings(settings)),
        },
        {
          id: 'tipografia',
          title: 'Tipografía',
          summary: 'Familia base y estilos de texto',
          icon: 'Aa',
          render: (panel) => panel.appendChild(renderTypographySettings(settings)),
        },
        {
          id: 'scroll',
          title: 'Scroll',
          summary: 'Separación entre cartelas y fades',
          icon: '⇅',
          render: (panel) => panel.appendChild(renderScrollSettings(settings)),
        },
      ];

      if (options.renderAccordionGroup) {
        els.typographySettings.appendChild(options.renderAccordionGroup('production-settings', cards, { initialOpenId: 'texto' }));
        return;
      }

      cards.forEach((card) => {
        els.typographySettings.appendChild(options.sectionLabel(card.title));
        card.render(els.typographySettings);
      });
    }

    function renderTypographySettings(settings) {
      const wrap = documentRef.createElement('div');
      const fontCatalog = options.getFontCatalog();
      const baseFamily = productionBaseTypographyFamily(settings);
      wrap.appendChild(options.localSelectRow('Familia base', baseFamily, baseFontFamilyOptions(fontCatalog, settings, baseFamily), (value) => {
        if (value === '__mixed__') return;
        options.updateBaseTypographyFamily(value);
      }));

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
        if (typeof options.renderGlyphAlternates === 'function') {
          row.appendChild(options.renderGlyphAlternates(key, value));
        }
        wrap.appendChild(row);
      });
      return wrap;
    }

    function productionBaseTypographyFamily(settings) {
      const families = options.typographyFields
        .map(([key]) => settings && settings.typography && settings.typography[key] && settings.typography[key].font_family)
        .filter(Boolean);
      if (!families.length) return '';
      return families.every((family) => family === families[0]) ? families[0] : '__mixed__';
    }

    function baseFontFamilyOptions(fontCatalog, settings, value) {
      const families = Array.isArray(fontCatalog && fontCatalog.families) ? fontCatalog.families : [];
      const controlOptions = families.map((family) => [family, family]);
      if (value === '__mixed__') controlOptions.unshift(['__mixed__', 'Varias']);
      options.typographyFields.forEach(([key]) => {
        const family = settings && settings.typography && settings.typography[key] && settings.typography[key].font_family;
        if (family && family !== '__mixed__' && !controlOptions.some(([optionValue]) => optionValue === family)) {
          controlOptions.push([family, family]);
        }
      });
      return controlOptions;
    }

    function renderTextSettings(settings) {
      const wrap = documentRef.createElement('div');
      wrap.appendChild(options.localSelectRow('Idioma', settings.language, options.languageOptions, (value) => options.updateSettings({ language: value })));
      wrap.appendChild(options.localSelectRow('Capitalización', settings.text_capitalization, options.textCapitalizationOptions, (value) => options.updateSettings({ text_capitalization: value })));
      wrap.appendChild(options.localInputRow('Capitalización protegida', settings.protected_capitalizations, (value) => options.updateSettings({ protected_capitalizations: options.normalizeProtectedCapitalizationText(value) }), { multiline: true, commitOnChange: true }));
      wrap.appendChild(options.localSelectRow('Usar capitalización protegida', options.boolSelectValue(settings.use_protected_capitalization), options.yesNoOptions, (value) => options.updateSettings({ use_protected_capitalization: options.normalizeBoolean(value, true) })));
      wrap.appendChild(renderTextSubstitutions(settings));
      return wrap;
    }

    function renderPageSettings(settings) {
      const wrap = documentRef.createElement('div');
      wrap.appendChild(settingsNumberRow('Margen superior de página', settings.layout.page_top_margin, 0, null, 1, (value) => options.updateLayoutSetting({ page_top_margin: value })));
      wrap.appendChild(settingsNumberRow('Margen inferior de página', settings.layout.page_bottom_margin, 0, null, 1, (value) => options.updateLayoutSetting({ page_bottom_margin: value })));
      wrap.appendChild(settingsNumberRow('Margen izquierdo de página', settings.layout.page_left_margin, 0, null, 1, (value) => options.updateLayoutSetting({ page_left_margin: value })));
      wrap.appendChild(settingsNumberRow('Margen derecho de página', settings.layout.page_right_margin, 0, null, 1, (value) => options.updateLayoutSetting({ page_right_margin: value })));
      return wrap;
    }

    function renderSpacingSettings(settings) {
      const wrap = documentRef.createElement('div');
      wrap.appendChild(settingsNumberRow('Interlineado', settings.layout.line_spacing, 0.1, null, 0.01, (value) => options.updateLayoutSetting({ line_spacing: value })));
      wrap.appendChild(settingsNumberRow('Separación entre columnas', settings.layout.column_gap, 0, null, 1, (value) => options.updateLayoutSetting({ column_gap: value })));
      wrap.appendChild(settingsNumberRow('Separación cargo/nombre', settings.layout.role_name_gap, 0, null, 1, (value) => options.updateLayoutSetting({ role_name_gap: value })));
      wrap.appendChild(settingsNumberRow('Separación de grupos del origen', settings.layout.source_group_gap, 0, null, 1, (value) => options.updateLayoutSetting({ source_group_gap: value })));
      wrap.appendChild(settingsNumberRow('Separación entre bloques', settings.layout.block_gap, 0, null, 1, (value) => options.updateLayoutSetting({ block_gap: value })));
      wrap.appendChild(settingsNumberRow('Separación título/primera fila', settings.layout.block_title_gap, 0, null, 1, (value) => options.updateLayoutSetting({ block_title_gap: value })));
      wrap.appendChild(options.localSelectRow('Repetir nombre de bloque', options.boolSelectValue(settings.layout.repeat_block_titles), options.yesNoOptions, (value) => options.updateLayoutSetting({ repeat_block_titles: options.normalizeBoolean(value, true) })));
      wrap.appendChild(options.localSelectRow('Wrap automático de texto', options.boolSelectValue(settings.layout.auto_text_wrap), options.yesNoOptions, (value) => options.updateLayoutSetting({ auto_text_wrap: options.normalizeBoolean(value, false) })));
      return wrap;
    }

    function renderScrollSettings(settings) {
      const wrap = documentRef.createElement('div');
      wrap.appendChild(settingsNumberRow('Separación entre cartelas', settings.layout.scroll_page_gap, 0, null, 1, (value) => options.updateLayoutSetting({ scroll_page_gap: value })));
      wrap.appendChild(settingsNumberRow('Separación antes de última cartela', settings.layout.scroll_last_page_gap, 0, null, 1, (value) => options.updateLayoutSetting({ scroll_last_page_gap: value })));
      wrap.appendChild(settingsNumberRow('Fade superior', settings.layout.scroll_fade_up, 0, null, 1, (value) => options.updateLayoutSetting({ scroll_fade_up: value })));
      wrap.appendChild(settingsNumberRow('Fade inferior', settings.layout.scroll_fade_down, 0, null, 1, (value) => options.updateLayoutSetting({ scroll_fade_down: value })));
      return wrap;
    }

    function renderTextSubstitutions(settings) {
      const section = documentRef.createElement('div');
      section.className = 'text-substitutions';
      section.appendChild(options.sectionLabel('Sustituciones de texto'));

      const rules = options.normalizeTextSubstitutions(settings.text_substitutions);
      const table = documentRef.createElement('div');
      table.className = 'text-substitution-table';
      table.innerHTML = '<div>Activo</div><div>Buscar</div><div>Reemplazar por</div><div></div>';
      rules.forEach((rule, index) => {
        const enabled = fieldControlRegistry.create('checkbox', {
          activeLabel: '',
          className: 'text-substitution-check',
          inactiveLabel: '',
          value: rule.enabled,
          onInput: (value) => updateTextSubstitution(rules, index, { enabled: value }),
        });
        table.appendChild(enabled);
        table.appendChild(textSubstitutionInput(rule.from, 'Buscar', (value) => updateTextSubstitution(rules, index, { from: value })));
        table.appendChild(textSubstitutionInput(rule.to, 'Reemplazar por', (value) => updateTextSubstitution(rules, index, { to: value })));
        const remove = documentRef.createElement('button');
        remove.type = 'button';
        remove.className = 'text-substitution-remove';
        remove.textContent = 'x';
        remove.title = 'Eliminar sustitución';
        remove.setAttribute('aria-label', 'Eliminar sustitución');
        remove.addEventListener('click', () => {
          options.updateSettings({ text_substitutions: rules.filter((_, ruleIndex) => ruleIndex !== index) });
        });
        table.appendChild(remove);
      });
      section.appendChild(table);

      const add = documentRef.createElement('button');
      add.type = 'button';
      add.className = 'wide-action';
      add.textContent = '+ Sustitución';
      add.addEventListener('click', () => {
        options.updateSettings({
          text_substitutions: rules.concat({
            id: `custom_${Date.now()}`,
            from: '',
            to: '',
            enabled: true,
          }),
        });
      });
      section.appendChild(add);
      return section;
    }

    function textSubstitutionInput(value, label, onInput) {
      return fieldControlRegistry.create('text', {
        ariaLabel: label,
        commitOnChange: true,
        value,
        onInput,
      });
    }

    function updateTextSubstitution(rules, index, fields) {
      options.updateSettings({
        text_substitutions: rules.map((rule, ruleIndex) => (
          ruleIndex === index ? { ...rule, ...fields } : rule
        )),
      });
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
