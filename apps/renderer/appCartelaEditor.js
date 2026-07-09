(function (root) {
  function createAppCartelaEditor(options = {}) {
    const documentRef = options.documentRef || root.document;
    const windowRef = options.windowRef || root;
    const fieldControlRegistry = options.fieldControlRegistry;
    const state = options.state;

    function renderCartelaFields(cartela) {
      const wrap = documentRef.createElement('div');
      const cards = [
        {
          id: 'cartela',
          title: 'Cartela',
          render: (panel) => panel.appendChild(renderCartelaBaseControls(cartela)),
        },
        {
          id: 'animacion',
          title: 'Animación',
          render: (panel) => {
            if (options.renderCartelaAnimationControls) panel.appendChild(options.renderCartelaAnimationControls(cartela, { includeTitle: false }));
          },
        },
        {
          id: 'titulo',
          title: 'Título de cartela',
          render: (panel) => panel.appendChild(options.renderCartelaTitleTypographyControls(cartela, { includeTitle: false })),
        },
        {
          id: 'bloque',
          title: 'Bloque',
          render: (panel) => panel.appendChild(renderCartelaBlockStyleControls(cartela, { includeTypography: false })),
        },
        {
          id: 'tipografia',
          title: 'Tipografía',
          render: (panel) => {
            const value = options.getEffectiveCartelaBlockStyle(cartela);
            panel.appendChild(options.renderCartelaBlockTypographyControls(cartela, value.typography || {}, { includeTitle: false }));
          },
        },
      ];

      if (state.cartelaQuickFilterEnabled) {
        wrap.appendChild(renderFilteredCartelaCards(cartela, cards));
        return wrap;
      }

      if (options.renderAccordionGroup) {
        wrap.appendChild(options.renderAccordionGroup(`cartela-editor:${cartela.id || 'selected'}`, cards, { initialOpenId: 'cartela' }));
        return wrap;
      }

      cards.forEach((card) => {
        wrap.appendChild(options.sectionLabel(card.title));
        card.render(wrap);
      });
      return wrap;
    }

    function renderFilteredCartelaCards(cartela, cards) {
      const includeAnimation = typeof options.previewAnimationEnabled === 'function' ? options.previewAnimationEnabled() : true;
      const selectedRows = [];
      cards.forEach((card) => {
        const panel = documentRef.createElement('div');
        card.render(panel);
        matchingFilterRows(panel, includeAnimation).forEach((row) => selectedRows.push(row));
      });

      const content = documentRef.createElement('div');
      content.className = 'cartela-filter-card-content';
      if (!selectedRows.length) {
        const empty = documentRef.createElement('div');
        empty.className = 'empty-inline-state';
        empty.textContent = includeAnimation
          ? 'Sin overrides ni propiedades animadas.'
          : 'Sin overrides.';
        content.appendChild(empty);
      } else {
        selectedRows.forEach((row) => content.appendChild(row));
      }

      const filteredCard = {
        id: 'cartela-filtered-changes',
        title: includeAnimation ? 'Overrides / animación' : 'Overrides',
        render: (panel) => panel.appendChild(content),
      };
      if (options.renderAccordionGroup) {
        return options.renderAccordionGroup(`cartela-editor-filter:${cartela.id || 'selected'}`, [filteredCard], { initialOpenId: filteredCard.id });
      }
      const fallback = documentRef.createElement('div');
      fallback.appendChild(options.sectionLabel(filteredCard.title));
      fallback.appendChild(content);
      return fallback;
    }

    function matchingFilterRows(panel, includeAnimation) {
      const candidates = Array.from(panel.querySelectorAll('.field-grid, .typography-control-group'));
      return candidates.filter((candidate) => {
        if (!rowMatchesFilter(candidate, includeAnimation)) return false;
        return !candidates.some((other) => other !== candidate && other.contains(candidate) && rowMatchesFilter(other, includeAnimation));
      });
    }

    function rowMatchesFilter(row, includeAnimation) {
      if (row.classList.contains('override-field') || row.querySelector('.override-control')) return true;
      return !!(includeAnimation && row.classList.contains('field-grid') && row.querySelector('.keyframe-toggle.active'));
    }

    function renderCartelaBaseControls(cartela) {
      const wrap = documentRef.createElement('div');
      const effectiveCartela = options.getEffectiveCartela(cartela);
      wrap.appendChild(options.localCheckboxRow('Incluir en salida', cartela.enabled !== false, (value) => options.updateSelectedCartela({ enabled: value })));
      wrap.appendChild(renderCartelaStyleControls(cartela));
      if (cartela.manual) wrap.appendChild(manualCartelaActionsRow());
      if (cartela.manual) {
        wrap.appendChild(options.localInputRow('Nombre de cartela', cartela.manual_name || '', (value) => options.updateSelectedCartela({ manual_name: value }), { commitOnChange: true }));
      }
      wrap.appendChild(options.localInputRow('Título de cartela', cartela.title || '', (value) => options.updateSelectedCartela({ title: value }), { commitOnChange: true }));
      wrap.appendChild(options.localSelectRow('Orientación', effectiveCartela.orientation || 'horizontal', [
        ['horizontal', 'Horizontal'],
        ['vertical', 'Vertical'],
      ], (value) => options.updateSelectedCartela({ orientation: value }), { override: options.hasCartelaOverride(cartela, 'orientation'), reset: () => options.resetSelectedCartelaOverride('orientation') }));
      wrap.appendChild(options.localNumberRow('Columnas', Number(effectiveCartela.columns) || 1, 1, 6, (value) => options.updateSelectedCartela({ columns: value }), 1, { override: options.hasCartelaOverride(cartela, 'columns'), reset: () => options.resetSelectedCartelaOverride('columns') }));
      wrap.appendChild(options.localNumberRow('Desplazamiento vertical', Number(effectiveCartela.vertical_offset) || 0, null, null, (value) => options.updateSelectedCartela({ vertical_offset: value }), 1, animationMeta(cartela, 'vertical_offset', { override: options.hasCartelaOverride(cartela, 'vertical_offset'), reset: () => options.resetSelectedCartelaOverride('vertical_offset') })));
      wrap.appendChild(options.localDurationRow('Duración por página', Number(effectiveCartela.duration) || 0, (value) => options.updateSelectedCartela({ duration: value }), { override: options.hasCartelaOverride(cartela, 'duration'), reset: () => options.resetSelectedCartelaOverride('duration') }));
      wrap.appendChild(options.localNumberRow('Interlineado', Number(effectiveCartela.line_spacing) || 1.12, 0.1, null, (value) => options.updateSelectedCartela({ line_spacing: value }), 0.01, animationMeta(cartela, 'line_spacing', { override: options.hasCartelaOverride(cartela, 'line_spacing'), reset: () => options.resetSelectedCartelaOverride('line_spacing') })));
      wrap.appendChild(options.localNumberRow('Separación entre columnas', Number(effectiveCartela.column_gap) || 0, 0, null, (value) => options.updateSelectedCartela({ column_gap: value }), 1, animationMeta(cartela, 'column_gap', { override: options.hasCartelaOverride(cartela, 'column_gap'), reset: () => options.resetSelectedCartelaOverride('column_gap') })));
      wrap.appendChild(options.localNumberRow('Separación cargo/nombre', Number(effectiveCartela.role_name_gap) || 0, 0, null, (value) => options.updateSelectedCartela({ role_name_gap: value }), 1, animationMeta(cartela, 'role_name_gap', { override: options.hasCartelaOverride(cartela, 'role_name_gap'), reset: () => options.resetSelectedCartelaOverride('role_name_gap') })));
      wrap.appendChild(options.localNumberRow('Separación de grupos del origen', Number(effectiveCartela.source_group_gap) || 0, 0, null, (value) => options.updateSelectedCartela({ source_group_gap: value }), 1, animationMeta(cartela, 'source_group_gap', { override: options.hasCartelaOverride(cartela, 'source_group_gap'), reset: () => options.resetSelectedCartelaOverride('source_group_gap') })));
      wrap.appendChild(options.localNumberRow('Separación entre bloques', Number(effectiveCartela.block_gap) || 0, 0, null, (value) => options.updateSelectedCartela({ block_gap: value }), 1, animationMeta(cartela, 'block_gap', { override: options.hasCartelaOverride(cartela, 'block_gap'), reset: () => options.resetSelectedCartelaOverride('block_gap') })));
      wrap.appendChild(options.localNumberRow('Separación título/primera fila', Number(effectiveCartela.block_title_gap) || 0, 0, null, (value) => options.updateSelectedCartela({ block_title_gap: value }), 1, animationMeta(cartela, 'block_title_gap', { override: options.hasCartelaOverride(cartela, 'block_title_gap'), reset: () => options.resetSelectedCartelaOverride('block_title_gap') })));
      wrap.appendChild(options.localNumberRow('Margen superior', Number(effectiveCartela.page_top_margin) || 0, 0, null, (value) => options.updateSelectedCartela({ page_top_margin: value }), 1, animationMeta(cartela, 'page_top_margin', { override: options.hasCartelaOverride(cartela, 'page_top_margin'), reset: () => options.resetSelectedCartelaOverride('page_top_margin') })));
      wrap.appendChild(options.localNumberRow('Margen inferior', Number(effectiveCartela.page_bottom_margin) || 0, 0, null, (value) => options.updateSelectedCartela({ page_bottom_margin: value }), 1, animationMeta(cartela, 'page_bottom_margin', { override: options.hasCartelaOverride(cartela, 'page_bottom_margin'), reset: () => options.resetSelectedCartelaOverride('page_bottom_margin') })));
      wrap.appendChild(options.localNumberRow('Margen izquierdo', Number(effectiveCartela.page_left_margin) || 0, 0, null, (value) => options.updateSelectedCartela({ page_left_margin: value }), 1, animationMeta(cartela, 'page_left_margin', { override: options.hasCartelaOverride(cartela, 'page_left_margin'), reset: () => options.resetSelectedCartelaOverride('page_left_margin') })));
      wrap.appendChild(options.localNumberRow('Margen derecho', Number(effectiveCartela.page_right_margin) || 0, 0, null, (value) => options.updateSelectedCartela({ page_right_margin: value }), 1, animationMeta(cartela, 'page_right_margin', { override: options.hasCartelaOverride(cartela, 'page_right_margin'), reset: () => options.resetSelectedCartelaOverride('page_right_margin') })));
      wrap.appendChild(options.localSelectRow('Repetir nombre de bloque', options.boolSelectValue(effectiveCartela.repeat_block_titles), options.yesNoOptions, (value) => options.updateSelectedCartela({ repeat_block_titles: options.normalizeBoolean(value, true) }), { override: options.hasCartelaOverride(cartela, 'repeat_block_titles'), reset: () => options.resetSelectedCartelaOverride('repeat_block_titles') }));
      wrap.appendChild(options.localSelectRow('Ajuste automático de texto', options.boolSelectValue(effectiveCartela.auto_text_wrap), options.yesNoOptions, (value) => options.updateSelectedCartela({ auto_text_wrap: options.normalizeBoolean(value, false) }), { override: options.hasCartelaOverride(cartela, 'auto_text_wrap'), reset: () => options.resetSelectedCartelaOverride('auto_text_wrap') }));
      wrap.appendChild(options.localSelectRow('Capitalización', effectiveCartela.text_capitalization || 'source', options.textCapitalizationOptions, (value) => options.updateSelectedCartela({ text_capitalization: value }), { override: options.hasCartelaOverride(cartela, 'text_capitalization'), reset: () => options.resetSelectedCartelaOverride('text_capitalization') }));
      wrap.appendChild(options.localSelectRow('Usar capitalización protegida', options.boolSelectValue(effectiveCartela.use_protected_capitalization), options.yesNoOptions, (value) => options.updateSelectedCartela({ use_protected_capitalization: options.normalizeBoolean(value, true) }), { override: options.hasCartelaOverride(cartela, 'use_protected_capitalization'), reset: () => options.resetSelectedCartelaOverride('use_protected_capitalization') }));
      wrap.appendChild(options.renderCartelaImageControls(cartela));
      wrap.appendChild(options.localInputRow('Notas', cartela.notes || '', (value) => options.updateSelectedCartela({ notes: value }), { multiline: true }));
      return wrap;
    }

    function manualCartelaActionsRow() {
      const row = documentRef.createElement('div');
      row.className = 'field-grid';
      const label = documentRef.createElement('label');
      label.textContent = 'Cartela manual';
      const actions = documentRef.createElement('div');
      actions.className = 'source-controls';
      const deleteButton = documentRef.createElement('button');
      deleteButton.type = 'button';
      deleteButton.textContent = 'Eliminar cartela';
      deleteButton.addEventListener('click', options.deleteSelectedManualCartela);
      actions.appendChild(deleteButton);
      row.appendChild(label);
      row.appendChild(actions);
      return row;
    }

    function animationMeta(cartela, key, meta = {}) {
      return options.cartelaAnimationRowMeta ? options.cartelaAnimationRowMeta(cartela, key, meta) : meta;
    }

    function renderCartelaStyleControls(cartela) {
      const wrap = documentRef.createElement('div');
      wrap.className = 'source-controls';
      const select = fieldControlRegistry.create('select', {
        value: cartela.style_id || '',
        options: [
          ['', 'Sin estilo'],
          ...state.styles.map((style) => [style.id, style.name]),
        ],
        onInput: async (nextStyleId) => {
          const previousStyleId = cartela.style_id || '';
          if (nextStyleId === previousStyleId) return;
          const action = await chooseCartelaStyleChangeAction(cartela, previousStyleId, nextStyleId);
          if (action === 'cancel') {
            select.value = previousStyleId;
            return;
          }
          cartela.style_id = nextStyleId;
          if (action === 'discard') options.clearCartelaStyleOverrides(cartela);
          state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
          options.renderCartelaList();
          options.renderEditor();
          options.renderPreview();
          options.refreshPdfIfActive();
        },
      });

      wrap.appendChild(select);
      return wrap;
    }

    async function chooseCartelaStyleChangeAction(cartela, previousStyleId, nextStyleId) {
      if (!previousStyleId || !options.hasCartelaStyleOverrides(cartela)) return 'discard';
      const previousStyle = options.getStyleById(previousStyleId);
      const nextStyle = options.getStyleById(nextStyleId);
      const message = `La cartela tiene overrides sobre "${previousStyle ? previousStyle.name : 'el estilo actual'}". ¿Qué quieres hacer al cambiar a "${nextStyle ? nextStyle.name : 'Sin estilo'}"?`;
      const native = options.nativeBridge();
      if (native && native.chooseStyleOverrideAction) {
        const result = await native.chooseStyleOverrideAction({ message });
        return result && result.action ? result.action : 'cancel';
      }
      const response = windowRef.prompt(`${message}\n\nEscribe C para conservar, D para descartar o X para cancelar.`, 'D');
      if (/^c/i.test(response || '')) return 'keep';
      if (/^d/i.test(response || '')) return 'discard';
      return 'cancel';
    }

    function renderCartelaBlockStyleControls(cartela, controlOptions = {}) {
      const wrap = documentRef.createElement('div');
      const value = options.getEffectiveCartelaBlockStyle(cartela);
      const alignment = value.alignment || {};
      const alignmentOptions = [
        ['left', 'Izquierda'],
        ['center', 'Centro'],
        ['right', 'Derecha'],
      ];
      wrap.appendChild(options.localNumberRow('Columnas del bloque', Number(value.columns) || 1, 1, 6, (next) => options.updateSelectedCartelaBlockStyle({ columns: next }), 1, { override: !!(cartela.block_style && cartela.block_style.columns !== undefined), reset: () => options.resetSelectedCartelaBlockOverride('columns') }));
      wrap.appendChild(options.localSelectRow('Concatenar filas', options.boolSelectValue(value.concatenate_rows), options.yesNoOptions, (next) => options.updateSelectedCartelaBlockStyle({ concatenate_rows: options.normalizeBoolean(next, false) }), { override: !!(cartela.block_style && cartela.block_style.concatenate_rows !== undefined), reset: () => options.resetSelectedCartelaBlockOverride('concatenate_rows') }));
      wrap.appendChild(options.localSelectRow('Forzar estructura cargo/nombre', options.boolSelectValue(value.force_role_name_columns), options.yesNoOptions, (next) => options.updateSelectedCartelaBlockStyle({ force_role_name_columns: options.normalizeBoolean(next, false) }), { override: !!(cartela.block_style && cartela.block_style.force_role_name_columns !== undefined), reset: () => options.resetSelectedCartelaBlockOverride('force_role_name_columns') }));
      wrap.appendChild(options.localSelectRow('Alineación cargo', alignment.role || 'right', alignmentOptions, (next) => options.updateSelectedCartelaBlockAlignment('role', next), { override: options.hasCartelaBlockAlignmentOverride(cartela, 'role'), reset: () => options.resetSelectedCartelaBlockAlignmentOverride('role') }));
      wrap.appendChild(options.localSelectRow('Alineación nombre', alignment.name || 'left', alignmentOptions, (next) => options.updateSelectedCartelaBlockAlignment('name', next), { override: options.hasCartelaBlockAlignmentOverride(cartela, 'name'), reset: () => options.resetSelectedCartelaBlockAlignmentOverride('name') }));
      wrap.appendChild(options.localSelectRow('Alineación texto', alignment.text || 'center', alignmentOptions, (next) => options.updateSelectedCartelaBlockAlignment('text', next), { override: options.hasCartelaBlockAlignmentOverride(cartela, 'text'), reset: () => options.resetSelectedCartelaBlockAlignmentOverride('text') }));
      wrap.appendChild(options.localSelectRow('Alineación vertical del bloque', value.vertical_align || 'top', [
        ['top', 'Arriba'],
        ['center', 'Centrado'],
        ['bottom', 'Abajo'],
      ], (next) => options.updateSelectedCartelaBlockStyle({ vertical_align: next }), { override: !!(cartela.block_style && cartela.block_style.vertical_align !== undefined), reset: () => options.resetSelectedCartelaBlockOverride('vertical_align') }));
      if (controlOptions.includeTypography !== false) wrap.appendChild(options.renderCartelaBlockTypographyControls(cartela, value.typography || {}));
      return wrap;
    }

    function renderSourceRefControls(cartela) {
      const wrap = documentRef.createElement('div');
      wrap.className = 'source-controls';

      const select = fieldControlRegistry.create('select', {
        value: state.materials[0] ? state.materials[0].id : '',
        options: state.materials.map((material) => [
          material.id,
          `${material.group || '-'} · ${material.title || material.id}`,
        ]),
      });

      const addButton = documentRef.createElement('button');
      addButton.type = 'button';
      addButton.textContent = 'Añadir bloque';
      addButton.addEventListener('click', () => {
        options.moveMaterialToCartela(state.structure, select.value, cartela);
        options.rebuild();
      });

      wrap.appendChild(select);
      wrap.appendChild(addButton);
      return wrap;
    }

    return {
      renderCartelaFields,
      renderSourceRefControls,
    };
  }

  root.CreditosAppCartelaEditor = {
    createAppCartelaEditor,
  };
})(globalThis);
