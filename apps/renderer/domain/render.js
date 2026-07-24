(function (root) {
  function createRenderDomain(dependencies = {}) {
    const {
      applyTextCapitalization = (text) => text,
      applyTextSubstitutions = (text) => text,
      buildPhysicalPages = () => [],
      canvasTextMetrics = () => ({}),
      canvasWrappedTextLines = (text) => [String(text || '')],
      cartelaHasRenderableRefs = () => false,
      cartelaImages = () => [],
      forceRenderedRoleNameColumns = () => {},
      getEffectiveCartela = (cartela) => cartela || {},
      getEffectiveCartelaAnimation = () => ({}),
      getEffectiveCartelaBlockStyle = () => ({}),
      getEffectiveCartelaTitleTypography = () => ({}),
      getSourceRefAlignment = () => ({}),
      getSourceRefColumns = () => 1,
      getSourceRefTypography = () => ({}),
      getSourceRefVerticalAlign = () => 'top',
      getVisualCartelas = (cartelas) => cartelas || [],
      getRenderedBlockUnits = () => [],
      layoutForCartela = (layout) => layout || {},
      normalizeBoolean = (value, fallback) => value === undefined ? fallback : Boolean(value),
      normalizeTextCapitalization = (value) => value || 'source',
      normalizeSettings = (settings) => settings || {},
      renderMaterial = () => ({ pages: [] }),
      renderedUnitText = (unit) => unit && unit.value || '',
      resolveOverride = (overrides, refId, field, fallback) => fallback,
      serializeStyleAnimation = () => undefined,
      settingsWithProductionLayout = (settings, productionLayout) => ({ layout: productionLayout || settings.layout || {} }),
      sourceUnitStartRow = (unit) => Number(unit && (unit.start_row !== undefined ? unit.start_row : unit.row)),
    } = dependencies;

    function buildRenderJson(source, materials, structure, options = {}) {
      const productionSettings = options.productionSettings || {};
      const productionLayout = options.productionLayout || {};
      const safeStructure = structure || {};
      const materialById = new Map((materials || []).map((material) => [material.id, material]));
      const overrides = safeStructure.overrides || {};

      const render = {
        schema: 'credits_render_json',
        version: 9,
        source_sheet: source && source.sheet || '',
        settings: {
          language: productionSettings.language,
          text_capitalization: productionSettings.text_capitalization,
          protected_capitalizations: productionSettings.protected_capitalizations,
          text_substitutions: productionSettings.text_substitutions,
          use_protected_capitalization: productionSettings.use_protected_capitalization,
          typography: productionSettings.typography,
          glyph_alternates: productionSettings.glyph_alternates,
          layout: settingsWithProductionLayout(productionSettings, productionLayout).layout,
        },
        cartelas: getVisualCartelas(safeStructure.cartelas || [])
          .filter((cartela) => cartela.enabled !== false)
          .filter((cartela) => cartelaHasRenderableRefs(cartela, materialById))
          .map((cartela, cartelaIndex) => {
            const effectiveCartela = getEffectiveCartela(cartela);
            const animation = serializeStyleAnimation(getEffectiveCartelaAnimation(cartela));
            return {
              id: cartela.id,
              style_id: cartela.style_id || '',
              manual: !!cartela.manual,
              cartela_number: cartelaIndex + 1,
              label: cartela.title || '',
              title: cartela.title || '',
              type: cartela.type,
              orientation: effectiveCartela.orientation || 'horizontal',
              columns: Number(effectiveCartela.columns) || 1,
              font_size_multiplier: 1,
              line_spacing_multiplier: 1,
              vertical_offset: Number(effectiveCartela.vertical_offset) || 0,
              duration: Number(effectiveCartela.duration) || 0,
              text_capitalization: normalizeTextCapitalization(effectiveCartela.text_capitalization),
              use_protected_capitalization: normalizeBoolean(effectiveCartela.use_protected_capitalization, true),
              auto_text_wrap: normalizeBoolean(effectiveCartela.auto_text_wrap, false),
              ...(animation ? { animation } : {}),
              images: cartelaImages(cartela),
              title_typography: getEffectiveCartelaTitleTypography(cartela),
              line_spacing: Math.max(0.1, Number(effectiveCartela.line_spacing) || 1.12),
              column_gap: Math.max(0, Number(effectiveCartela.column_gap) || 0),
              role_name_gap: Math.max(0, Number(effectiveCartela.role_name_gap) || 0),
              block_gap: Math.max(0, Number(effectiveCartela.block_gap) || 0),
              block_title_gap: Math.max(0, Number(effectiveCartela.block_title_gap) || 0),
              page_top_margin: Math.max(0, Number(effectiveCartela.page_top_margin) || 0),
              page_bottom_margin: Math.max(0, Number(effectiveCartela.page_bottom_margin) || 0),
              page_left_margin: Math.max(0, Number(effectiveCartela.page_left_margin) || 0),
              page_right_margin: Math.max(0, Number(effectiveCartela.page_right_margin) || 0),
              pages: (cartela.pages || []).map((page, pageIndex) => ({
                id: page.id,
                page_number: pageIndex + 1,
                title: resolveOverride(overrides, page.id, 'title', page.title || ''),
                blocks: (page.source_refs || []).map((ref) => {
                  const material = materialById.get(ref);
                  const lineAdjustments = safeStructure.page_line_adjustments || {};
                  const block = renderMaterial(material, ref, overrides, safeStructure.page_breaks || {}, 0, lineAdjustments);
                  block.columns = getSourceRefColumns(page, ref, cartela);
                  block.alignment = getSourceRefAlignment(page, ref, material, effectiveCartela, cartela);
                  block.vertical_align = getSourceRefVerticalAlign(page, ref, cartela);
                  block.typography = getSourceRefTypography(page, ref, cartela);
                  const effectiveBlockStyle = getEffectiveCartelaBlockStyle(cartela);
                  block.show_block_title = effectiveBlockStyle.show_block_title !== false;
                  if (!block.show_block_title) block.title = '';
                  block.force_role_name_columns = effectiveBlockStyle.force_role_name_columns;
                  if (block.force_role_name_columns) forceRenderedRoleNameColumns(block);
                  block.concatenate_rows = effectiveBlockStyle.concatenate_rows;
                  if (block.concatenate_rows) concatenateRenderedBlockRows(block, effectiveCartela, productionSettings, productionLayout);
                  return block;
                }),
              })),
            };
          }),
      };
      render.physical_pages = buildPhysicalPages(render.cartelas, overrides, {
        settings: productionSettings,
        pageLineAdjustments: safeStructure.page_line_adjustments,
      }).map((page, index) => ({
        id: page.id,
        page_number: index + 1,
        title: page.title || '',
        line_count: page.line_count || 0,
        line_limit: page.line_limit || 0,
        cartela_id: page.cartela.id,
        cartela_page_id: page.cartela_page.id,
        blocks: page.blocks,
      }));
      return render;
    }

    function concatenateRenderedBlockRows(block, cartela, settings, productionLayout = {}) {
      const units = getRenderedBlockUnits(block);
      const values = units.map(renderedUnitText).filter((value) => String(value || '').trim());
      if (!values.length) return block;
      const sourceText = values.join(' ');
      const normalizedSettings = normalizeSettings(settings || {});
      const substitutedText = applyTextSubstitutions(sourceText, normalizedSettings.text_substitutions || []);
      const transformedText = applyTextCapitalization(
        substitutedText,
        block && block.typography && block.typography.name && block.typography.name.text_capitalization !== undefined
          ? block.typography.name.text_capitalization
          : cartela && cartela.text_capitalization,
        normalizedSettings.language,
        normalizedSettings.protected_capitalizations,
        cartela && cartela.use_protected_capitalization !== undefined
          ? cartela.use_protected_capitalization
          : normalizedSettings.use_protected_capitalization
      );
      const layout = layoutForCartela(settingsWithProductionLayout(normalizedSettings, productionLayout).layout, cartela);
      const columns = Math.max(1, Number(block.columns) || 1);
      const contentWidth = Math.max(1, layout.page_width - layout.page_left_margin - layout.page_right_margin);
      const columnWidth = Math.max(1, (contentWidth - layout.column_gap * (columns - 1)) / columns);
      const metrics = {
        ...canvasTextMetrics('name', cartela, layout, block.typography),
        textCapitalization: 'source',
      };
      const lines = canvasWrappedTextLines(transformedText, metrics, columnWidth);
      const firstRow = sourceUnitStartRow(units[0]);
      block.pages = [{
        id: 'block_page_01',
        items: lines.map((value, index) => ({
          id: `${block.id}_concatenated_${String(index + 1).padStart(3, '0')}`,
          kind: 'concatenated_line',
          row: Number.isFinite(firstRow) ? firstRow : 0,
          value,
          text_already_transformed: true,
        })),
        start_index: 0,
        end_index: Math.max(0, lines.length - 1),
        line_count: lines.length,
      }];
      return block;
    }

    return {
      buildRenderJson,
      concatenateRenderedBlockRows,
    };
  }

  root.CreditosDomainRender = {
    createRenderDomain,
  };
})(globalThis);
