(function (root) {
  function createPaginationDomain(dependencies = {}) {
    const {
      blockForTitleRepeat,
      canvasTextMetrics,
      canvasWrappedTextLines,
      cartelaBlockGap,
      cartelaHasImages,
      countTitleLine,
      creditSourceId,
      getEffectiveCartela,
      getRenderLayout,
      getRenderedBlockUnits,
      layoutForCartela,
      normalizeSettings,
      sourceBlankRowCounts,
      unitRenderOptions,
    } = dependencies;

    function buildPhysicalPages(cartelas, overrides = {}, options = {}) {
      void overrides;
      const physicalPages = [];
      const settings = normalizeSettings(options.settings || {});
      const defaultLines = Math.max(1, Number(settings.default_auto_page_lines) || 1);
      const pageLineAdjustments = options.pageLineAdjustments || {};
      const physicalAdjustments = pageLineAdjustments.__physical || {};

      cartelas.forEach((cartela) => {
        const repeatBlockTitles = repeatBlockTitlesForCartela(cartela);
        let cartelaPhysicalIndex = 0;
        (cartela.pages || []).forEach((cartelaPage) => {
          const blocks = cartelaPage.blocks || [];
          const blockPageIndexes = new Map();
          let pageIndex = 0;
          let currentPage = null;

          const startPage = () => {
            const currentPageIndex = pageIndex;
            const currentCartelaPhysicalIndex = cartelaPhysicalIndex;
            const physicalPageId = `${cartela.id}_${cartelaPage.id}_physical_${String(currentPageIndex + 1).padStart(2, '0')}`;
            const title = currentCartelaPhysicalIndex === 0 ? String(cartela.title || '').trim() : '';
            const lineLimit = Math.max(1, defaultLines + (Number(physicalAdjustments[physicalPageId]) || 0));
            currentPage = {
              id: physicalPageId,
              page_index: currentPageIndex,
              cartela_physical_index: currentCartelaPhysicalIndex,
              title,
              line_count: countTitleLine(title),
              line_limit: lineLimit,
              cartela,
              cartela_page: cartelaPage,
              blocks: [],
            };
            pageIndex += 1;
            cartelaPhysicalIndex += 1;
          };

          const pageHasBlocks = () => currentPage && currentPage.blocks.length > 0;
          const finishPage = () => {
            if (currentPage && (currentPage.blocks.length || String(currentPage.title || '').trim() || cartelaHasImages(currentPage.cartela) || (currentPage.cartela && currentPage.cartela.manual))) {
              physicalPages.push(currentPage);
            }
            currentPage = null;
          };
          const nextBlockPageIndex = (block) => {
            const current = blockPageIndexes.get(block.id) || 0;
            blockPageIndexes.set(block.id, current + 1);
            return current;
          };
          const ensureBlockOnPage = (block) => {
            const lastBlock = currentPage.blocks[currentPage.blocks.length - 1];
            if (lastBlock && lastBlock.id === block.id) return lastBlock;
            const blockPageIndex = nextBlockPageIndex(block);
            const displayBlock = blockForTitleRepeat(block, repeatBlockTitles, blockPageIndex);
            const physicalBlock = {
              ...displayBlock,
              block_page_index: blockPageIndex,
              pages: [{
                id: `block_page_${String(blockPageIndex + 1).padStart(2, '0')}`,
                items: [],
                start_index: 0,
                line_count: 0,
              }],
            };
            currentPage.blocks.push(physicalBlock);
            return physicalBlock;
          };
          const addUnitToPage = (block, unit, unitIndex) => {
            if (!currentPage) startPage();
            let physicalBlock = currentPage.blocks[currentPage.blocks.length - 1];
            const candidateBlockPageIndex = physicalBlock && physicalBlock.id === block.id
              ? Number(physicalBlock.block_page_index) || 0
              : blockPageIndexes.get(block.id) || 0;
            const candidateBlock = blockForTitleRepeat(block, repeatBlockTitles, candidateBlockPageIndex);
            const existingItems = physicalBlock && physicalBlock.id === block.id && physicalBlock.pages[0]
              ? physicalBlock.pages[0].items
              : [];
            const existingBlockLines = physicalBlock && physicalBlock.id === block.id && physicalBlock.pages[0]
              ? Number(physicalBlock.pages[0].line_count) || 0
              : 0;
            const candidateBlockLines = countBlockVisualLines(candidateBlock, cartela, existingItems.concat(unit));
            const addedLines = candidateBlockLines - existingBlockLines;
            if (pageHasBlocks() && currentPage.line_count + addedLines > currentPage.line_limit) {
              finishPage();
              startPage();
              physicalBlock = null;
            }

            physicalBlock = ensureBlockOnPage(block);
            const page = physicalBlock.pages[0];
            const previousBlockLines = Number(page.line_count) || 0;
            if (!page.items.length) {
              page.start_index = unitIndex;
            }
            const forcePageBreakAfter = unit.__force_page_break_after;
            const cleanUnit = { ...unit };
            delete cleanUnit.__force_page_break_after;
            page.items.push(cleanUnit);
            page.end_index = unitIndex;
            page.break_after_id = cleanUnit.id || '';
            page.line_count = countBlockVisualLines(block, cartela, page.items);
            currentPage.line_count += page.line_count - previousBlockLines;
            if (forcePageBreakAfter) finishPage();
          };

          if (!blocks.length) {
            if (cartela.manual || String(cartela.title || '').trim() || cartelaHasImages(cartela)) {
              startPage();
              finishPage();
            }
            return;
          }

          blocks.forEach((block) => {
            if (block.missing_source) {
              addUnitToPage(block, { id: `${block.id}_missing`, kind: 'missing_source' }, 0);
              return;
            }
            const units = getRenderedBlockUnits(block);
            if (!units.length && String(block.title || '').trim()) {
              if (!currentPage) startPage();
              const blockPageIndex = blockPageIndexes.get(block.id) || 0;
              const displayBlock = blockForTitleRepeat(block, repeatBlockTitles, blockPageIndex);
              const titleLines = countTitleLine(displayBlock.title);
              if (!titleLines) return;
              if (pageHasBlocks() && currentPage.line_count + titleLines > currentPage.line_limit) {
                finishPage();
                startPage();
              }
              const physicalBlock = ensureBlockOnPage(block);
              const page = physicalBlock.pages[0];
              const previousBlockLines = Number(page.line_count) || 0;
              page.line_count = countTitleLine(physicalBlock.title);
              currentPage.line_count += page.line_count - previousBlockLines;
              return;
            }
            units.forEach((unit, unitIndex) => addUnitToPage(block, unit, unitIndex));
          });

          finishPage();
        });
      });
      return physicalPages;
    }

    function countBlockVisualLines(block, cartela, units) {
      const items = units || [];
      const columns = Math.max(1, Number(block.columns) || 1);
      const layout = layoutForCartela(getRenderLayout(), cartela);
      const contentWidth = Math.max(1, layout.page_width - layout.page_left_margin - layout.page_right_margin);
      const columnWidth = Math.max(1, (contentWidth - layout.column_gap * (columns - 1)) / columns);
      const rowHeights = [];
      let previousCreditSourceId = null;
      items.forEach((unit, index) => {
        const row = Math.floor(index / columns);
        const options = {
          ...unitRenderOptions(unit, previousCreditSourceId, cartela, index > 0, items[index - 1]),
          layout,
          wrapWidth: columnWidth,
        };
        rowHeights[row] = Math.max(rowHeights[row] || 0, countRenderedUnitLines(unit, block, cartela, options));
        previousCreditSourceId = creditSourceId(unit);
      });
      const sourceGapLines = Number(cartela && cartela.source_group_gap) > 0
        ? sourceBlankRowCounts(items, columns).reduce((total, value) => total + value, 0)
        : 0;
      const titleLines = String(block.title || '').trim()
        ? paginationTextLines(block.title, canvasTextMetrics('block_title', cartela, layout, block.typography), contentWidth).length
        : 0;
      return titleLines + rowHeights.reduce((total, value) => total + value, 0) + sourceGapLines;
    }

    function countRenderedUnitLines(unit, block, cartela, options = {}) {
      if (!unit) return 1;
      const layout = options.layout || layoutForCartela(getRenderLayout(), cartela);
      const width = Math.max(1, Number(options.wrapWidth) || 1);
      const lineCount = (value, styleKey) => paginationTextLines(
        value,
        unit.text_already_transformed
          ? { ...canvasTextMetrics(styleKey, cartela, layout, block.typography), textCapitalization: 'source' }
          : canvasTextMetrics(styleKey, cartela, layout, block.typography),
        width
      ).length;
      if (unit.lines) return Math.max(1, unit.lines.reduce((total, line, index) => total + lineCount(line.value, index === 0 ? 'role' : 'name'), 0));
      if (options.repeatedNameRow) return lineCount(unit.name, 'name');
      if (unit.kind === 'credit' || unit.kind === 'crew_credit' || unit.kind === 'cast') {
        const role = unit.kind === 'cast' ? unit.actor : unit.role;
        const name = unit.kind === 'cast' ? unit.character : unit.name;
        const pairWidth = cartela && cartela.orientation === 'horizontal'
          ? Math.max(1, (width - layout.role_name_gap) / 2)
          : width;
        const pairLineCount = (value, styleKey) => paginationTextLines(
          value,
          canvasTextMetrics(styleKey, cartela, layout, block.typography),
          pairWidth
        ).length;
        const roleLines = String(role || '').length ? pairLineCount(role, 'role') : 0;
        const nameLines = String(name || '').length ? pairLineCount(name, 'name') : 0;
        return cartela && cartela.orientation === 'vertical'
          ? Math.max(1, roleLines + nameLines)
          : Math.max(1, roleLines, nameLines);
      }
      return lineCount(unit.title !== undefined ? unit.title : unit.value, unit.title !== undefined ? 'block_title' : 'name');
    }

    function paginationTextLines(value, metrics, width) {
      return canvasWrappedTextLines(value, { ...metrics, autoWrap: false }, width);
    }

    function unitGapBefore(options, layout) {
      return (options && options.itemGapBefore ? cartelaBlockGap(null, layout) : 0)
        + Math.max(0, Number(options && options.sourceGroupBlankRows) || 0)
          * Math.max(0, Number(layout.source_group_gap) || 0);
    }

    function repeatBlockTitlesForCartela(cartela) {
      return getEffectiveCartela(cartela).repeat_block_titles !== false;
    }

    function getPdfLineStatus(page, defaultLineCount, pageLineAdjustments = {}) {
      const defaultLines = Number(defaultLineCount) || 1;
      const adjustment = Number(
        pageLineAdjustments &&
        pageLineAdjustments.__physical &&
        pageLineAdjustments.__physical[page && page.id]
      ) || 0;
      return `${defaultLines}/${Math.max(1, defaultLines + adjustment)}`;
    }

    function adjustPdfPageLineAdjustment(pageLineAdjustments, pageId, defaultLineCount, delta) {
      const adjustments = pageLineAdjustments || {};
      adjustments.__physical = adjustments.__physical || {};
      const current = Number(adjustments.__physical[pageId]) || 0;
      const defaultLines = Number(defaultLineCount) || 1;
      const next = Math.max(1 - defaultLines, current + delta);
      if (next === 0) {
        delete adjustments.__physical[pageId];
      } else {
        adjustments.__physical[pageId] = next;
      }
      return adjustments;
    }

    return {
      adjustPdfPageLineAdjustment,
      buildPhysicalPages,
      countBlockVisualLines,
      countRenderedUnitLines,
      getPdfLineStatus,
      repeatBlockTitlesForCartela,
      unitGapBefore,
    };
  }

  root.CreditosDomainPagination = {
    createPaginationDomain,
  };
})(globalThis);
