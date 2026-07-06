(function (root) {
  function createRenderUnitsDomain(dependencies = {}) {
    const {
      normalizeText,
      resolveOverride,
    } = dependencies;

    function getMaterialContentItems(material) {
      const items = material && material.items ? material.items : [];
      if (!items.length) return items;
      const first = items[0];
      if (first.kind === 'section' && normalizeText(first.title) === normalizeText(material.title)) {
        return items.slice(1);
      }
      return items;
    }

    function renderMaterial(material, ref, overrides, pageBreaks, maxAutoLines, lineAdjustments) {
      if (!material) return { missing_source: ref };
      const breaks = pageBreaks[material.id] || [];
      const pageLineAdjustments = lineAdjustments[material.id] || {};
      const rendered = {
        id: material.id,
        source_block_id: material.source_block_id,
        group: material.group,
        type: material.type,
        title: resolveOverride(overrides, material.id, 'title', material.default_title),
        titles: resolveOverride(overrides, material.id, 'titles', material.titles || [material.title]),
      };

      if (material.type === 'music_licenses') {
        rendered.themes = groupMusicLicenseThemes(getMaterialContentItems(material), overrides);
        rendered.pages = splitRenderedUnitsByBreaks(rendered.themes, breaks, (theme) => theme.lines[theme.lines.length - 1].id, maxAutoLines, countThemeLines, pageLineAdjustments);
      } else {
        rendered.items = flattenRenderedItems(getMaterialContentItems(material), overrides);
        rendered.pages = splitRenderedUnitsByBreaks(rendered.items, breaks, (item) => item.id, maxAutoLines, countItemLines, pageLineAdjustments);
      }

      rendered.pages = rendered.pages.map((page) => ({
        ...page,
        title: rendered.title,
      }));

      return rendered;
    }

    function renderedUnitText(unit) {
      if (!unit) return '';
      if (Array.isArray(unit.lines)) return unit.lines.map((line) => line.value || '').join(' ');
      if (unit.kind === 'credit' || unit.kind === 'crew_credit') return [unit.role, unit.name].filter(Boolean).join(' ');
      if (unit.kind === 'cast') return [unit.actor, unit.character].filter(Boolean).join(' ');
      return unit.value !== undefined ? unit.value : unit.title || '';
    }

    function splitRenderedUnitsByBreaks(units, breaks, idForUnit, maxAutoLines, lineCounter, pageLineAdjustments = {}) {
      const breakSet = new Set(breaks || []);
      const pages = [];
      let currentPage = { id: `block_page_${String(pages.length + 1).padStart(2, '0')}`, items: [], start_index: 0 };
      let currentLines = 0;

      units.forEach((unit, index) => {
        if (!currentPage.items.length) currentPage.start_index = index;
        const unitLines = Math.max(1, lineCounter(unit));
        currentPage.items.push(unit);
        currentLines += unitLines;
        const pageIndex = pages.length;
        const lineAdjustment = Number(pageLineAdjustments[pageIndex]) || 0;
        const lineLimit = Math.max(1, maxAutoLines + lineAdjustment);
        const shouldAutoBreak = maxAutoLines > 0 && lineLimit > 0 && currentLines >= lineLimit && index < units.length - 1;
        if (breakSet.has(idForUnit(unit)) || shouldAutoBreak) {
          currentPage.end_index = index;
          currentPage.line_count = currentLines;
          currentPage.break_after_id = idForUnit(unit);
          pages.push(currentPage);
          currentPage = { id: `block_page_${String(pages.length + 1).padStart(2, '0')}`, items: [], start_index: index + 1 };
          currentLines = 0;
        }
      });

      if (currentPage.items.length || !pages.length) {
        currentPage.end_index = currentPage.items.length ? units.length - 1 : -1;
        currentPage.line_count = currentLines;
        currentPage.break_after_id = currentPage.items.length ? idForUnit(currentPage.items[currentPage.items.length - 1]) : '';
        pages.push(currentPage);
      }

      return pages;
    }

    function countThemeLines(theme) {
      return theme.lines ? theme.lines.length : 1;
    }

    function countItemLines(item) {
      void item;
      return 1;
    }

    function flattenRenderedItems(items, overrides) {
      const flattened = [];
      items.forEach((item) => {
        if (item.kind === 'credit' || item.kind === 'crew_credit') {
          const names = item.names && item.names.length ? item.names : [{ id: `${item.id}_empty_name`, row: item.row, name: '' }];
          names.forEach((name) => {
            flattened.push({
              id: `${item.id}__${name.id}`,
              source_item_id: item.id,
              source_name_id: name.id,
              kind: item.kind,
              row: name.row || item.row,
              section: resolveOverride(overrides, item.id, 'section', item.section),
              role: resolveOverride(overrides, item.id, 'role', item.role),
              name: resolveOverride(overrides, name.id, 'name', name.name),
            });
          });
          return;
        }
        flattened.push(renderItem(item, overrides));
      });
      return flattened;
    }

    function groupMusicLicenseThemes(items, overrides) {
      const lines = items
        .filter((item) => item.kind === 'list_item')
        .map((item) => ({
          id: item.id,
          row: item.row,
          value: resolveOverride(overrides, item.id, 'value', item.value),
        }));

      const themes = [];
      let currentTheme = null;
      let previousRow = null;

      lines.forEach((line) => {
        if (!currentTheme || (previousRow !== null && line.row - previousRow > 1)) {
          currentTheme = {
            id: `theme_${line.id}`,
            title: line.value,
            start_row: line.row,
            row: line.row,
            lines: [line],
          };
          themes.push(currentTheme);
        } else {
          currentTheme.lines.push(line);
        }
        previousRow = line.row;
        currentTheme.end_row = line.row;
      });

      return themes;
    }

    function renderItem(item, overrides) {
      const base = { id: item.id, kind: item.kind, row: item.row };

      if (item.kind === 'credit' || item.kind === 'crew_credit') {
        return {
          ...base,
          section: resolveOverride(overrides, item.id, 'section', item.section),
          role: resolveOverride(overrides, item.id, 'role', item.role),
          names: (item.names || []).map((name) => ({
            id: name.id,
            row: name.row,
            name: resolveOverride(overrides, name.id, 'name', name.name),
          })),
        };
      }

      if (item.kind === 'cast') {
        return {
          ...base,
          actor: resolveOverride(overrides, item.id, 'actor', item.actor),
          character: resolveOverride(overrides, item.id, 'character', item.character),
        };
      }

      if (item.kind === 'section') {
        return { ...base, title: resolveOverride(overrides, item.id, 'title', item.title) };
      }

      if (item.kind === 'list_item' || item.kind === 'closing_line') {
        return {
          ...base,
          section: resolveOverride(overrides, item.id, 'section', item.section),
          value: resolveOverride(overrides, item.id, 'value', item.value),
        };
      }

      return { ...item, ...base };
    }

    return {
      flattenRenderedItems,
      getMaterialContentItems,
      groupMusicLicenseThemes,
      renderItem,
      renderMaterial,
      renderedUnitText,
      splitRenderedUnitsByBreaks,
    };
  }

  root.CreditosDomainRenderUnits = {
    createRenderUnitsDomain,
  };
})(globalThis);
