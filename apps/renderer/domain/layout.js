(function (root) {
  function createLayoutDomain() {
    function numberWithFallback(value, fallback, defaultValue = 0) {
      const number = Number(value);
      if (Number.isFinite(number)) return number;
      const fallbackNumber = Number(fallback);
      if (Number.isFinite(fallbackNumber)) return fallbackNumber;
      return defaultValue;
    }

    function layoutForCartela(layout, cartela) {
      return {
        ...layout,
        line_spacing: Math.max(0.1, numberWithFallback(cartela && cartela.line_spacing, layout.line_spacing, 1)),
        column_gap: Math.max(0, numberWithFallback(cartela && cartela.column_gap, layout.column_gap, 0)),
        role_name_gap: Math.max(0, numberWithFallback(cartela && cartela.role_name_gap, layout.role_name_gap, 0)),
        source_group_gap: Math.max(0, numberWithFallback(cartela && cartela.source_group_gap, layout.source_group_gap, 0)),
        block_gap: Math.max(0, numberWithFallback(cartela && cartela.block_gap, layout.block_gap, 0)),
        block_title_gap: Math.max(0, numberWithFallback(cartela && cartela.block_title_gap, layout.block_title_gap, 0)),
        page_top_margin: Math.max(0, numberWithFallback(cartela && cartela.page_top_margin, layout.page_top_margin, 0)),
        page_bottom_margin: Math.max(0, numberWithFallback(cartela && cartela.page_bottom_margin, layout.page_bottom_margin, 0)),
        page_left_margin: Math.max(0, numberWithFallback(cartela && cartela.page_left_margin, layout.page_left_margin, 0)),
        page_right_margin: Math.max(0, numberWithFallback(cartela && cartela.page_right_margin, layout.page_right_margin, 0)),
      };
    }

    function contentAreaRect(layout) {
      return {
        x: Math.max(0, Number(layout.page_left_margin) || 0),
        y: Math.max(0, Number(layout.page_top_margin) || 0),
        width: Math.max(0, Number(layout.page_width) - (Number(layout.page_left_margin) || 0) - (Number(layout.page_right_margin) || 0)),
        height: Math.max(0, Number(layout.page_height) - (Number(layout.page_top_margin) || 0) - (Number(layout.page_bottom_margin) || 0)),
      };
    }

    function pdfPageVerticalJustify(page) {
      const align = page && page.blocks && page.blocks[0] ? page.blocks[0].vertical_align : 'top';
      if (align === 'center') return 'center';
      if (align === 'bottom') return 'flex-end';
      return 'flex-start';
    }

    function verticalOffset(availableHeight, contentHeight, justify) {
      if (justify === 'center') return Math.max(0, (availableHeight - contentHeight) / 2);
      if (justify === 'flex-end') return Math.max(0, availableHeight - contentHeight);
      return 0;
    }

    function cartelaBlockGap(_cartela, layout) {
      return Math.max(0, Number(layout && layout.block_gap) || 0);
    }

    function cartelaBlockTitleGap(_cartela, layout) {
      return Math.max(0, Number(layout && layout.block_title_gap) || 0);
    }

    function roleNameGapForOrientation(layout, orientation) {
      return orientation === 'vertical' ? Math.max(0, Number(layout && layout.role_name_gap) || 0) : 0;
    }

    return {
      cartelaBlockGap,
      cartelaBlockTitleGap,
      contentAreaRect,
      layoutForCartela,
      numberWithFallback,
      pdfPageVerticalJustify,
      roleNameGapForOrientation,
      verticalOffset,
    };
  }

  root.CreditosDomainLayout = {
    createLayoutDomain,
  };
})(globalThis);
