(function (root) {
  function createRenderDomain(dependencies = {}) {
    const {
      applyTextCapitalization = (text) => text,
      canvasTextMetrics = () => ({}),
      canvasWrappedTextLines = (text) => [String(text || '')],
      getRenderedBlockUnits = () => [],
      layoutForCartela = (layout) => layout || {},
      normalizeSettings = (settings) => settings || {},
      renderedUnitText = (unit) => unit && unit.value || '',
      settingsWithProductionLayout = (settings, productionLayout) => ({ layout: productionLayout || settings.layout || {} }),
      sourceUnitStartRow = (unit) => Number(unit && (unit.start_row !== undefined ? unit.start_row : unit.row)),
    } = dependencies;

    function concatenateRenderedBlockRows(block, cartela, settings, productionLayout = {}) {
      const units = getRenderedBlockUnits(block);
      const values = units.map(renderedUnitText).filter((value) => String(value || '').trim());
      if (!values.length) return block;
      const sourceText = values.join(' ');
      const normalizedSettings = normalizeSettings(settings || {});
      const transformedText = applyTextCapitalization(
        sourceText,
        cartela && cartela.text_capitalization,
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
      concatenateRenderedBlockRows,
    };
  }

  root.CreditosDomainRender = {
    createRenderDomain,
  };
})(globalThis);
