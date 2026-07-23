(function (root) {
  function createAppStyleEditor(options = {}) {
    const documentRef = options.documentRef || root.document;
    const fieldControlRegistry = options.fieldControlRegistry;

    function renderStyleEditor(style) {
      const wrap = documentRef.createElement('div');
      const cards = [
        {
          id: 'general',
          title: 'General',
          summary: 'Orientación, columnas y duración',
          icon: 'G',
          status: () => cardStatus({
            override: hasAnyStyleCartelaOverride(style, ['duration']),
          }),
          render: (panel) => panel.appendChild(renderStyleGeneralControls(style)),
        },
        {
          id: 'pagina',
          title: 'Página',
          summary: 'Márgenes y posición de la cartela',
          icon: '□',
          status: () => cardStatus({
            override: hasAnyStyleCartelaOverride(style, ['page_top_margin', 'page_bottom_margin', 'page_left_margin', 'page_right_margin']),
            animation: hasAnyAnimatedProperty(style, ['vertical_offset', 'page_top_margin', 'page_bottom_margin', 'page_left_margin', 'page_right_margin']),
          }),
          render: (panel) => panel.appendChild(renderStylePageControls(style)),
        },
        {
          id: 'texto',
          title: 'Párrafo',
          summary: 'Interlineado, wrap y protección',
          icon: '¶',
          status: () => cardStatus({
            override: hasAnyStyleCartelaOverride(style, ['line_spacing', 'repeat_block_titles', 'auto_text_wrap', 'use_protected_capitalization']),
            animation: hasAnyAnimatedProperty(style, ['line_spacing']),
          }),
          render: (panel) => panel.appendChild(renderStyleTextControls(style)),
        },
        {
          id: 'espaciado',
          title: 'Espaciado',
          summary: 'Separaciones entre columnas, filas y bloques',
          icon: '↔',
          status: () => cardStatus({
            override: hasAnyStyleCartelaOverride(style, ['column_gap', 'role_name_gap', 'source_group_gap', 'block_gap', 'block_title_gap']),
            animation: hasAnyAnimatedProperty(style, ['column_gap', 'role_name_gap', 'source_group_gap', 'block_gap', 'block_title_gap']),
          }),
          render: (panel) => panel.appendChild(renderStyleSpacingControls(style)),
        },
        {
          id: 'bloque',
          title: 'Bloque',
          summary: 'Columnas, concatenación y alineaciones',
          icon: '▦',
          status: () => cardStatus({
            override: hasAnyStyleBlockOverride(style, ['columns', 'show_block_title', 'concatenate_rows', 'force_role_name_columns', 'vertical_align'])
              || hasAnyStyleBlockAlignmentOverride(style, ['role', 'name', 'text']),
          }),
          render: (panel) => panel.appendChild(renderStyleBlockControls(style)),
        },
        {
          id: 'cabecera',
          title: 'Cabecera',
          summary: 'Tipografía del título de cartela',
          icon: 'H',
          status: () => cardStatus({
            override: options.hasStyleTitleTypographyOverride(style),
          }),
          render: (panel) => panel.appendChild(renderStyleTitleTypographyControls(style, { includeTitle: false })),
        },
        {
          id: 'tipografia',
          title: 'Tipografía de bloque',
          summary: 'Título de bloque, cargo y nombre',
          icon: 'Aa',
          status: () => cardStatus({
            override: options.blockTypographyFields.some(([key]) => options.hasStyleTypographyOverride(style, key)),
            animation: hasAnyAnimatedProperty(style, typographyAnimationKeys()),
          }),
          render: (panel) => panel.appendChild(renderStyleTypographyControls(style, { includeTitle: false })),
        },
        {
          id: 'animacion',
          title: 'Animación',
          summary: 'Entrada, salida, movimiento y fade',
          icon: '▶',
          status: () => cardStatus({
            animation: hasAnimationSettings(style.animation),
          }),
          render: (panel) => {
            if (options.renderStyleAnimationControls) panel.appendChild(options.renderStyleAnimationControls(style, { includeTitle: false }));
          },
        },
      ];

      if (options.renderAccordionGroup) {
        wrap.appendChild(options.renderAccordionGroup('style-editor', cards, { initialOpenId: 'general' }));
        return wrap;
      }

      cards.forEach((card) => {
        wrap.appendChild(options.sectionLabel(card.title));
        card.render(wrap);
      });
      return wrap;
    }

    function renderStyleGeneralControls(style) {
      const wrap = documentRef.createElement('div');
      const cartela = options.getEffectiveStyleCartela(style);
      wrap.appendChild(options.localSelectRow('Orientación', cartela.orientation, [
        ['horizontal', 'Horizontal'],
        ['vertical', 'Vertical'],
      ], (value) => options.updateEditableStyleCartela(style, { orientation: value })));
      wrap.appendChild(options.localNumberRow('Columnas', cartela.columns, 1, 6, (value) => options.updateEditableStyleCartela(style, { columns: value })));
      wrap.appendChild(options.localDurationRow('Duración por página', cartela.duration, (value) => options.updateEditableStyleCartela(style, { duration: value }), { override: options.hasStyleCartelaOverride(style, 'duration'), reset: () => options.resetEditableStyleCartelaOverride(style, 'duration') }));
      return wrap;
    }

    function renderStylePageControls(style) {
      const wrap = documentRef.createElement('div');
      const cartela = options.getEffectiveStyleCartela(style);
      wrap.appendChild(options.localNumberRow('Desplazamiento vertical', cartela.vertical_offset, null, null, (value) => options.updateEditableStyleCartela(style, { vertical_offset: value }), 1, animationMeta(style, 'vertical_offset')));
      wrap.appendChild(options.localNumberRow('Margen superior', cartela.page_top_margin, 0, null, (value) => options.updateEditableStyleCartela(style, { page_top_margin: value }), 1, animationMeta(style, 'page_top_margin', { override: options.hasStyleCartelaOverride(style, 'page_top_margin'), reset: () => options.resetEditableStyleCartelaOverride(style, 'page_top_margin') })));
      wrap.appendChild(options.localNumberRow('Margen inferior', cartela.page_bottom_margin, 0, null, (value) => options.updateEditableStyleCartela(style, { page_bottom_margin: value }), 1, animationMeta(style, 'page_bottom_margin', { override: options.hasStyleCartelaOverride(style, 'page_bottom_margin'), reset: () => options.resetEditableStyleCartelaOverride(style, 'page_bottom_margin') })));
      wrap.appendChild(options.localNumberRow('Margen izquierdo', cartela.page_left_margin, 0, null, (value) => options.updateEditableStyleCartela(style, { page_left_margin: value }), 1, animationMeta(style, 'page_left_margin', { override: options.hasStyleCartelaOverride(style, 'page_left_margin'), reset: () => options.resetEditableStyleCartelaOverride(style, 'page_left_margin') })));
      wrap.appendChild(options.localNumberRow('Margen derecho', cartela.page_right_margin, 0, null, (value) => options.updateEditableStyleCartela(style, { page_right_margin: value }), 1, animationMeta(style, 'page_right_margin', { override: options.hasStyleCartelaOverride(style, 'page_right_margin'), reset: () => options.resetEditableStyleCartelaOverride(style, 'page_right_margin') })));
      return wrap;
    }

    function renderStyleTextControls(style) {
      const wrap = documentRef.createElement('div');
      const cartela = options.getEffectiveStyleCartela(style);
      wrap.appendChild(options.localNumberRow('Interlineado', cartela.line_spacing, 0.1, null, (value) => options.updateEditableStyleCartela(style, { line_spacing: value }), 0.01, animationMeta(style, 'line_spacing', { override: options.hasStyleCartelaOverride(style, 'line_spacing'), reset: () => options.resetEditableStyleCartelaOverride(style, 'line_spacing') })));
      wrap.appendChild(options.localSelectRow('Repetir nombre de bloque', options.boolSelectValue(cartela.repeat_block_titles), options.yesNoOptions, (value) => options.updateEditableStyleCartela(style, { repeat_block_titles: options.normalizeBoolean(value, true) }), { override: options.hasStyleCartelaOverride(style, 'repeat_block_titles'), reset: () => options.resetEditableStyleCartelaOverride(style, 'repeat_block_titles') }));
      wrap.appendChild(options.localSelectRow('Wrap automático de texto', options.boolSelectValue(cartela.auto_text_wrap), options.yesNoOptions, (value) => options.updateEditableStyleCartela(style, { auto_text_wrap: options.normalizeBoolean(value, false) }), { override: options.hasStyleCartelaOverride(style, 'auto_text_wrap'), reset: () => options.resetEditableStyleCartelaOverride(style, 'auto_text_wrap') }));
      wrap.appendChild(options.localSelectRow('Usar capitalización protegida', options.boolSelectValue(cartela.use_protected_capitalization), options.yesNoOptions, (value) => options.updateEditableStyleCartela(style, { use_protected_capitalization: options.normalizeBoolean(value, true) }), { override: options.hasStyleCartelaOverride(style, 'use_protected_capitalization'), reset: () => options.resetEditableStyleCartelaOverride(style, 'use_protected_capitalization') }));
      return wrap;
    }

    function renderStyleSpacingControls(style) {
      const wrap = documentRef.createElement('div');
      const cartela = options.getEffectiveStyleCartela(style);
      wrap.appendChild(options.localNumberRow('Separación entre columnas', cartela.column_gap, 0, null, (value) => options.updateEditableStyleCartela(style, { column_gap: value }), 1, animationMeta(style, 'column_gap', { override: options.hasStyleCartelaOverride(style, 'column_gap'), reset: () => options.resetEditableStyleCartelaOverride(style, 'column_gap') })));
      wrap.appendChild(options.localNumberRow('Separación cargo/nombre', cartela.role_name_gap, 0, null, (value) => options.updateEditableStyleCartela(style, { role_name_gap: value }), 1, animationMeta(style, 'role_name_gap', { override: options.hasStyleCartelaOverride(style, 'role_name_gap'), reset: () => options.resetEditableStyleCartelaOverride(style, 'role_name_gap') })));
      wrap.appendChild(options.localNumberRow('Separación de grupos del origen', cartela.source_group_gap, 0, null, (value) => options.updateEditableStyleCartela(style, { source_group_gap: value }), 1, animationMeta(style, 'source_group_gap', { override: options.hasStyleCartelaOverride(style, 'source_group_gap'), reset: () => options.resetEditableStyleCartelaOverride(style, 'source_group_gap') })));
      wrap.appendChild(options.localNumberRow('Separación entre bloques', cartela.block_gap, 0, null, (value) => options.updateEditableStyleCartela(style, { block_gap: value }), 1, animationMeta(style, 'block_gap', { override: options.hasStyleCartelaOverride(style, 'block_gap'), reset: () => options.resetEditableStyleCartelaOverride(style, 'block_gap') })));
      wrap.appendChild(options.localNumberRow('Separación título/primera fila', cartela.block_title_gap, 0, null, (value) => options.updateEditableStyleCartela(style, { block_title_gap: value }), 1, animationMeta(style, 'block_title_gap', { override: options.hasStyleCartelaOverride(style, 'block_title_gap'), reset: () => options.resetEditableStyleCartelaOverride(style, 'block_title_gap') })));
      return wrap;
    }

    function renderStyleBlockControls(style) {
      const wrap = documentRef.createElement('div');
      const block = options.getEffectiveStyleBlock(style);
      const alignment = block.alignment || {};
      const alignmentOptions = [['left', 'Izquierda'], ['center', 'Centro'], ['right', 'Derecha']];
      wrap.appendChild(options.localSelectRow('Mostrar título de bloque', options.boolSelectValue(block.show_block_title), options.yesNoOptions, (value) => options.updateEditableStyleBlock(style, { show_block_title: options.normalizeBoolean(value, true) }), { override: !!(style.block && style.block.show_block_title !== undefined), reset: () => options.resetEditableStyleBlockOverride(style, 'show_block_title') }));
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
      return wrap;
    }

    function renderStyleTypographyControls(style, controlOptions = {}) {
      const wrap = documentRef.createElement('div');
      wrap.className = 'block-typography-settings';
      if (controlOptions.includeTitle !== false) wrap.appendChild(options.sectionLabel('Tipografía'));
      const settings = options.getProductionSettings();
      const block = options.getEffectiveStyleBlock(style);
      const typography = block.typography || {};
      const fontCatalog = options.getFontCatalog();

      options.blockTypographyFields.forEach(([key, label]) => {
        const base = settings.typography[key];
        const override = style && style.block && style.block.typography && style.block.typography[key] ? style.block.typography[key] : {};
        const value = { ...base, ...((typography && typography[key]) || {}) };
        const isOverride = options.hasStyleTypographyOverride(style, key);
        const row = fieldControlRegistry.create('typography', {
          base,
          className: 'typography-row block-typography-row',
          fontCatalog,
          getFontStyles: options.getFontStyles,
          label,
          normalizeColor: options.normalizeColor,
          animationMetaForField: (field, currentValue) => animationMetaForTypographyField(style, key, field, currentValue),
          hasOverrideForField: (field) => typographyFieldHasOverride(override, field),
          onInput: (fields) => options.updateEditableStyleTypography(style, key, fields),
          onResetField: (fields) => options.resetEditableStyleTypographyFieldOverride(style, key, fields),
          onReset: () => options.resetEditableStyleTypographyOverride(style, key),
          override: isOverride,
          value,
        });
        wrap.appendChild(row);
      });
      return wrap;
    }

    function animationMeta(style, key, meta = {}) {
      return options.styleAnimationRowMeta ? options.styleAnimationRowMeta(style, key, meta) : meta;
    }

    function animationMetaForTypographyField(style, typographyKey, field, currentValue) {
      const key = typographyAnimationKey(typographyKey, field);
      if (!key) return {};
      return animationMeta(style, key, { animationDefaultValue: currentValue });
    }

    function typographyAnimationKey(typographyKey, field) {
      if (field !== 'font_size' && field !== 'letter_spacing') return '';
      if (typographyKey !== 'block_title' && typographyKey !== 'role' && typographyKey !== 'name') return '';
      return `typography.${typographyKey}.${field}`;
    }

    function typographyAnimationKeys() {
      return ['block_title', 'role', 'name'].flatMap((typographyKey) => [
        typographyAnimationKey(typographyKey, 'font_size'),
        typographyAnimationKey(typographyKey, 'letter_spacing'),
      ]);
    }

    function cardStatus(status = {}) {
      return {
        override: !!status.override,
        animation: !!status.animation,
      };
    }

    function hasAnyStyleCartelaOverride(style, keys) {
      return keys.some((key) => options.hasStyleCartelaOverride(style, key));
    }

    function hasAnyStyleBlockOverride(style, keys) {
      return keys.some((key) => !!(style && style.block && Object.prototype.hasOwnProperty.call(style.block, key)));
    }

    function hasAnyStyleBlockAlignmentOverride(style, keys) {
      return keys.some((key) => !!(style && style.block && style.block.alignment && Object.prototype.hasOwnProperty.call(style.block.alignment, key)));
    }

    function hasAnyAnimatedProperty(subject, keys) {
      const properties = subject && subject.animation && subject.animation.properties ? subject.animation.properties : {};
      return keys.some((key) => properties[key] && properties[key].animate);
    }

    function hasAnimationSettings(animation) {
      const normalized = options.normalizeStyleAnimation ? options.normalizeStyleAnimation(animation || {}) : (animation || {});
      if (!normalized || typeof normalized !== 'object') return false;
      if (normalized.enabled) return true;
      const properties = normalized.properties && typeof normalized.properties === 'object' ? normalized.properties : {};
      if (Object.keys(properties).some((key) => properties[key] && properties[key].animate)) return true;
      return phaseHasFade(normalized.in) || phaseHasFade(normalized.out);
    }

    function phaseHasFade(phase = {}) {
      return Number(phase.fadeDurationFrames) > 0 || Number(phase.fadeDurationMs) > 0;
    }

    function renderStyleTitleTypographyControls(style, controlOptions = {}) {
      const wrap = documentRef.createElement('div');
      wrap.className = 'block-typography-settings';
      if (controlOptions.includeTitle !== false) wrap.appendChild(options.sectionLabel('Tipografía del título de cartela'));
      const base = options.getProductionSettings().typography.page_header;
      const override = style && style.title_typography && style.title_typography.page_header ? style.title_typography.page_header : {};
      const value = options.getEffectiveStyleTitleTypography(style).page_header;
      const fontCatalog = options.getFontCatalog();
      const row = fieldControlRegistry.create('typography', {
        base,
        className: 'typography-row block-typography-row',
        fontCatalog,
        getFontStyles: options.getFontStyles,
        label: 'Cabecera',
        normalizeColor: options.normalizeColor,
        hasOverrideForField: (field) => typographyFieldHasOverride(override, field),
        onInput: (fields) => options.updateEditableStyleTitleTypography(style, fields),
        onResetField: (fields) => options.resetEditableStyleTitleTypographyFieldOverride(style, fields),
        onReset: () => options.resetEditableStyleTitleTypographyOverride(style),
        override: options.hasStyleTitleTypographyOverride(style),
        value,
      });
      wrap.appendChild(row);
      return wrap;
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
      renderStyleEditor,
    };
  }

  root.CreditosAppStyleEditor = {
    createAppStyleEditor,
  };
})(globalThis);
