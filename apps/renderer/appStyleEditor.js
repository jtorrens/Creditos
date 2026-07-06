(function (root) {
  function createAppStyleEditor(options = {}) {
    const documentRef = options.documentRef || root.document;
    const fieldControlRegistry = options.fieldControlRegistry;

    function renderStyleEditor(style) {
      const wrap = documentRef.createElement('div');
      wrap.appendChild(options.sectionLabel('Cartela'));
      const cartela = options.getEffectiveStyleCartela(style);
      wrap.appendChild(options.localSelectRow('Orientación', cartela.orientation, [
        ['horizontal', 'Horizontal'],
        ['vertical', 'Vertical'],
      ], (value) => options.updateEditableStyleCartela(style, { orientation: value })));
      wrap.appendChild(options.localNumberRow('Columnas', cartela.columns, 1, 6, (value) => options.updateEditableStyleCartela(style, { columns: value })));
      wrap.appendChild(options.localNumberRow('Desplazamiento vertical', cartela.vertical_offset, null, null, (value) => options.updateEditableStyleCartela(style, { vertical_offset: value })));
      wrap.appendChild(options.localDurationRow('Duración por página', cartela.duration, (value) => options.updateEditableStyleCartela(style, { duration: value }), { override: options.hasStyleCartelaOverride(style, 'duration'), reset: () => options.resetEditableStyleCartelaOverride(style, 'duration') }));
      wrap.appendChild(options.localNumberRow('Interlineado', cartela.line_spacing, 0.1, null, (value) => options.updateEditableStyleCartela(style, { line_spacing: value }), 0.01, { override: options.hasStyleCartelaOverride(style, 'line_spacing'), reset: () => options.resetEditableStyleCartelaOverride(style, 'line_spacing') }));
      wrap.appendChild(options.localNumberRow('Separación entre columnas', cartela.column_gap, 0, null, (value) => options.updateEditableStyleCartela(style, { column_gap: value }), 1, { override: options.hasStyleCartelaOverride(style, 'column_gap'), reset: () => options.resetEditableStyleCartelaOverride(style, 'column_gap') }));
      wrap.appendChild(options.localNumberRow('Separación cargo/nombre', cartela.role_name_gap, 0, null, (value) => options.updateEditableStyleCartela(style, { role_name_gap: value }), 1, { override: options.hasStyleCartelaOverride(style, 'role_name_gap'), reset: () => options.resetEditableStyleCartelaOverride(style, 'role_name_gap') }));
      wrap.appendChild(options.localNumberRow('Separación de grupos del origen', cartela.source_group_gap, 0, null, (value) => options.updateEditableStyleCartela(style, { source_group_gap: value }), 1, { override: options.hasStyleCartelaOverride(style, 'source_group_gap'), reset: () => options.resetEditableStyleCartelaOverride(style, 'source_group_gap') }));
      wrap.appendChild(options.localNumberRow('Separación entre bloques', cartela.block_gap, 0, null, (value) => options.updateEditableStyleCartela(style, { block_gap: value }), 1, { override: options.hasStyleCartelaOverride(style, 'block_gap'), reset: () => options.resetEditableStyleCartelaOverride(style, 'block_gap') }));
      wrap.appendChild(options.localNumberRow('Separación título/primera fila', cartela.block_title_gap, 0, null, (value) => options.updateEditableStyleCartela(style, { block_title_gap: value }), 1, { override: options.hasStyleCartelaOverride(style, 'block_title_gap'), reset: () => options.resetEditableStyleCartelaOverride(style, 'block_title_gap') }));
      wrap.appendChild(options.localNumberRow('Margen superior', cartela.page_top_margin, 0, null, (value) => options.updateEditableStyleCartela(style, { page_top_margin: value }), 1, { override: options.hasStyleCartelaOverride(style, 'page_top_margin'), reset: () => options.resetEditableStyleCartelaOverride(style, 'page_top_margin') }));
      wrap.appendChild(options.localNumberRow('Margen inferior', cartela.page_bottom_margin, 0, null, (value) => options.updateEditableStyleCartela(style, { page_bottom_margin: value }), 1, { override: options.hasStyleCartelaOverride(style, 'page_bottom_margin'), reset: () => options.resetEditableStyleCartelaOverride(style, 'page_bottom_margin') }));
      wrap.appendChild(options.localNumberRow('Margen izquierdo', cartela.page_left_margin, 0, null, (value) => options.updateEditableStyleCartela(style, { page_left_margin: value }), 1, { override: options.hasStyleCartelaOverride(style, 'page_left_margin'), reset: () => options.resetEditableStyleCartelaOverride(style, 'page_left_margin') }));
      wrap.appendChild(options.localNumberRow('Margen derecho', cartela.page_right_margin, 0, null, (value) => options.updateEditableStyleCartela(style, { page_right_margin: value }), 1, { override: options.hasStyleCartelaOverride(style, 'page_right_margin'), reset: () => options.resetEditableStyleCartelaOverride(style, 'page_right_margin') }));
      wrap.appendChild(options.localSelectRow('Repetir nombre de bloque', options.boolSelectValue(cartela.repeat_block_titles), options.yesNoOptions, (value) => options.updateEditableStyleCartela(style, { repeat_block_titles: options.normalizeBoolean(value, true) }), { override: options.hasStyleCartelaOverride(style, 'repeat_block_titles'), reset: () => options.resetEditableStyleCartelaOverride(style, 'repeat_block_titles') }));
      wrap.appendChild(options.localSelectRow('Ajuste automático de texto', options.boolSelectValue(cartela.auto_text_wrap), options.yesNoOptions, (value) => options.updateEditableStyleCartela(style, { auto_text_wrap: options.normalizeBoolean(value, false) }), { override: options.hasStyleCartelaOverride(style, 'auto_text_wrap'), reset: () => options.resetEditableStyleCartelaOverride(style, 'auto_text_wrap') }));
      wrap.appendChild(options.localSelectRow('Capitalización', cartela.text_capitalization, options.textCapitalizationOptions, (value) => options.updateEditableStyleCartela(style, { text_capitalization: value }), { override: options.hasStyleCartelaOverride(style, 'text_capitalization'), reset: () => options.resetEditableStyleCartelaOverride(style, 'text_capitalization') }));
      wrap.appendChild(options.localSelectRow('Usar capitalización protegida', options.boolSelectValue(cartela.use_protected_capitalization), options.yesNoOptions, (value) => options.updateEditableStyleCartela(style, { use_protected_capitalization: options.normalizeBoolean(value, true) }), { override: options.hasStyleCartelaOverride(style, 'use_protected_capitalization'), reset: () => options.resetEditableStyleCartelaOverride(style, 'use_protected_capitalization') }));
      wrap.appendChild(renderStyleTitleTypographyControls(style));

      wrap.appendChild(options.sectionLabel('Bloque'));
      const block = options.getEffectiveStyleBlock(style);
      const alignment = block.alignment || {};
      const alignmentOptions = [['left', 'Izquierda'], ['center', 'Centro'], ['right', 'Derecha']];
      wrap.appendChild(options.localNumberRow('Columnas del bloque', block.columns, 1, 6, (value) => options.updateEditableStyleBlock(style, { columns: value })));
      wrap.appendChild(options.localSelectRow('Concatenar filas', options.boolSelectValue(block.concatenate_rows), options.yesNoOptions, (value) => options.updateEditableStyleBlock(style, { concatenate_rows: options.normalizeBoolean(value, false) }), { override: !!(style.block && style.block.concatenate_rows !== undefined), reset: () => options.resetEditableStyleBlockOverride(style, 'concatenate_rows') }));
      wrap.appendChild(options.localSelectRow('Forzar estructura cargo/nombre', options.boolSelectValue(block.force_role_name_columns), options.yesNoOptions, (value) => options.updateEditableStyleBlock(style, { force_role_name_columns: options.normalizeBoolean(value, false) }), { override: !!(style.block && style.block.force_role_name_columns !== undefined), reset: () => options.resetEditableStyleBlockOverride(style, 'force_role_name_columns') }));
      wrap.appendChild(options.localSelectRow('Alineación cargo', alignment.role || 'right', alignmentOptions, (value) => options.updateEditableStyleBlockAlignment(style, 'role', value)));
      wrap.appendChild(options.localSelectRow('Alineación nombre', alignment.name || 'left', alignmentOptions, (value) => options.updateEditableStyleBlockAlignment(style, 'name', value)));
      wrap.appendChild(options.localSelectRow('Alineación texto', alignment.text || 'center', alignmentOptions, (value) => options.updateEditableStyleBlockAlignment(style, 'text', value)));
      wrap.appendChild(options.localSelectRow('Alineación vertical', block.vertical_align, [
        ['top', 'Arriba'],
        ['center', 'Centrado'],
        ['bottom', 'Abajo'],
      ], (value) => options.updateEditableStyleBlock(style, { vertical_align: value })));
      wrap.appendChild(renderStyleTypographyControls(style));
      return wrap;
    }

    function renderStyleTypographyControls(style) {
      const wrap = documentRef.createElement('div');
      wrap.className = 'block-typography-settings';
      wrap.appendChild(options.sectionLabel('Tipografía'));
      const settings = options.getProductionSettings();
      const block = options.getEffectiveStyleBlock(style);
      const typography = block.typography || {};
      const fontCatalog = options.getFontCatalog();

      options.blockTypographyFields.forEach(([key, label]) => {
        const base = settings.typography[key];
        const value = { ...base, ...((typography && typography[key]) || {}) };
        const isOverride = options.hasStyleTypographyOverride(style, key);
        const row = fieldControlRegistry.create('typography', {
          base,
          className: 'typography-row block-typography-row',
          fontCatalog,
          getFontStyles: options.getFontStyles,
          label,
          normalizeColor: options.normalizeColor,
          onInput: (fields) => options.updateEditableStyleTypography(style, key, fields),
          onReset: () => options.resetEditableStyleTypographyOverride(style, key),
          override: isOverride,
          value,
        });
        wrap.appendChild(row);
      });
      return wrap;
    }

    function renderStyleTitleTypographyControls(style) {
      const wrap = documentRef.createElement('div');
      wrap.className = 'block-typography-settings';
      wrap.appendChild(options.sectionLabel('Tipografía del título de cartela'));
      const base = options.getProductionSettings().typography.page_header;
      const value = options.getEffectiveStyleTitleTypography(style).page_header;
      const fontCatalog = options.getFontCatalog();
      const row = fieldControlRegistry.create('typography', {
        base,
        className: 'typography-row block-typography-row',
        fontCatalog,
        getFontStyles: options.getFontStyles,
        label: 'Cabecera',
        normalizeColor: options.normalizeColor,
        onInput: (fields) => options.updateEditableStyleTitleTypography(style, fields),
        onReset: () => options.resetEditableStyleTitleTypographyOverride(style),
        override: options.hasStyleTitleTypographyOverride(style),
        value,
      });
      wrap.appendChild(row);
      return wrap;
    }

    return {
      renderStyleEditor,
    };
  }

  root.CreditosAppStyleEditor = {
    createAppStyleEditor,
  };
})(globalThis);
