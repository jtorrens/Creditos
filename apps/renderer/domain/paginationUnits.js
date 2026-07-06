(function (root) {
  function createPaginationUnitsDomain() {
    function explicitTextLines(value) {
      return String(value === undefined || value === null ? '' : value).replace(/\r\n?/g, '\n').split('\n');
    }

    function explicitTextLineCount(value) {
      return Math.max(1, explicitTextLines(value).length);
    }

    function unitRenderOptions(unit, previousCreditSourceId, cartela, hasPreviousUnit = false, previousUnit = null) {
      const sourceId = creditSourceId(unit);
      const repeatedNameRow = !!(
        cartela &&
        cartela.orientation === 'vertical' &&
        sourceId &&
        sourceId === previousCreditSourceId
      );
      return {
        hideRole: !!(sourceId && sourceId === previousCreditSourceId),
        repeatedNameRow,
        itemGapBefore: !!(
          hasPreviousUnit &&
          cartela &&
          cartela.orientation === 'vertical' &&
          !unit.text_already_transformed &&
          !repeatedNameRow
        ),
        sourceGroupBlankRows: hasPreviousUnit ? sourceBlankRowsBefore(unit, previousUnit) : 0,
      };
    }

    function sourceBlankRowsBefore(unit, previousUnit) {
      const row = sourceUnitStartRow(unit);
      const previousRow = sourceUnitEndRow(previousUnit);
      return Number.isFinite(row) && Number.isFinite(previousRow) ? Math.max(0, Math.round(row - previousRow - 1)) : 0;
    }

    function sourceUnitStartRow(unit) {
      const value = Number(unit && (unit.start_row !== undefined ? unit.start_row : unit.row));
      return Number.isFinite(value) ? value : NaN;
    }

    function sourceUnitEndRow(unit) {
      if (unit && unit.end_row !== undefined) {
        const value = Number(unit.end_row);
        if (Number.isFinite(value)) return value;
      }
      if (unit && Array.isArray(unit.lines) && unit.lines.length) {
        const value = Number(unit.lines[unit.lines.length - 1].row);
        if (Number.isFinite(value)) return value;
      }
      return sourceUnitStartRow(unit);
    }

    function sourceBlankRowCounts(units, columns) {
      const items = units || [];
      const safeColumns = Math.max(1, Number(columns) || 1);
      const rowCount = Math.ceil(items.length / safeColumns);
      const counts = Array.from({ length: Math.max(0, rowCount - 1) }, () => 0);
      for (let row = 1; row < rowCount; row += 1) {
        const firstIndex = row * safeColumns;
        counts[row - 1] = sourceBlankRowsBefore(items[firstIndex], items[firstIndex - 1]);
      }
      return counts;
    }

    function creditSourceId(unit) {
      return unit && (unit.kind === 'credit' || unit.kind === 'crew_credit') ? unit.source_item_id || null : null;
    }

    function blockForTitleRepeat(block, repeatBlockTitles, blockPageIndex) {
      if (repeatBlockTitles || !blockPageIndex || !String(block && block.title || '').trim()) return block;
      return { ...block, title: '' };
    }

    function countTitleLine(title) {
      return String(title || '').trim() ? explicitTextLineCount(title) : 0;
    }

    return {
      blockForTitleRepeat,
      countTitleLine,
      creditSourceId,
      explicitTextLineCount,
      explicitTextLines,
      sourceBlankRowCounts,
      sourceBlankRowsBefore,
      sourceUnitEndRow,
      sourceUnitStartRow,
      unitRenderOptions,
    };
  }

  root.CreditosDomainPaginationUnits = {
    createPaginationUnitsDomain,
  };
})(globalThis);
