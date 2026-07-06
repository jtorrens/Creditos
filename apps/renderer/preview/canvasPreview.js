(function (root) {
  function createCanvasPreview(dependencies = {}) {
    const {
      applyTextCapitalization = (text) => text,
      cartelaBlockGap = () => 0,
      cartelaBlockTitleGap = () => 0,
      cartelaImages = () => [],
      contentAreaRect = () => ({ x: 0, y: 0, width: 0, height: 0 }),
      creditSourceId = () => null,
      documentRef = root.document,
      explicitTextLines = (text) => String(text || '').split(/\r?\n/),
      fontStyleFromStyle = () => 'normal',
      fontWeightFromStyle = () => '400',
      getProductionSettings = () => ({ layout: {}, typography: {} }),
      imageCtor = root.Image,
      layoutForCartela = (layout) => layout,
      normalizeBoolean = (value, fallback) => value === undefined ? fallback : Boolean(value),
      normalizeLanguage = (value) => value || 'es',
      normalizeTextCapitalization = (value) => value || 'source',
      pdfPageVerticalJustify = () => 'flex-start',
      quoteFontFamily = (value) => value,
      roleNameGapForOrientation = (layout) => layout.role_name_gap,
      unitGapBefore = () => 0,
      unitRenderOptions = () => ({}),
      verticalOffset = () => 0,
      textVerticalBleedRatio = 0.35,
    } = dependencies;

    const canvasImageCache = new Map();
    let canvasMeasureContext = null;
    const canvasWrapCache = new Map();

    function drawCanvasMarginOverlay(ctx, layout, zoom = 1) {
      ctx.save();
      ctx.strokeStyle = '#ff2b2b';
      ctx.lineWidth = 1 / Math.max(0.01, Number(zoom) || 1);
      ctx.beginPath();
      ctx.moveTo(layout.page_left_margin, 0);
      ctx.lineTo(layout.page_left_margin, layout.page_height);
      ctx.moveTo(layout.page_width - layout.page_right_margin, 0);
      ctx.lineTo(layout.page_width - layout.page_right_margin, layout.page_height);
      ctx.moveTo(0, layout.page_top_margin);
      ctx.lineTo(layout.page_width, layout.page_top_margin);
      ctx.moveTo(0, layout.page_height - layout.page_bottom_margin);
      ctx.lineTo(layout.page_width, layout.page_height - layout.page_bottom_margin);
      ctx.stroke();
      ctx.restore();
    }

    async function drawCanvasPage(ctx, page, layout) {
      const effectiveLayout = layoutForCartela(layout, page && page.cartela);
      const blockGap = cartelaBlockGap(page.cartela, effectiveLayout);
      const x = Math.max(0, Number(effectiveLayout.page_left_margin) || 0);
      const y = effectiveLayout.page_top_margin;
      const width = Math.max(0, effectiveLayout.page_width - x - (Number(effectiveLayout.page_right_margin) || 0));
      const height = effectiveLayout.page_height - effectiveLayout.page_top_margin - effectiveLayout.page_bottom_margin;
      const blocks = page.blocks.filter((block) => !block.missing_source);
      const heights = blocks.map((block) => measureCanvasBlock(ctx, block, page.cartela, effectiveLayout, width));
      const titleText = page && page.cartela_physical_index === 0 ? String(page.title || '').trim() : '';
      const titleMetrics = titleText ? canvasTextMetrics('page_header', page.cartela, effectiveLayout, page.cartela.title_typography) : null;
      const titleHeight = titleMetrics ? canvasTextHeight(titleText, titleMetrics, width) : 0;
      const totalBlocksHeight = heights.reduce((total, value) => total + value, 0);
      const gaps = Math.max(0, blocks.length - 1) * blockGap;
      const totalHeight = titleHeight + (titleHeight && blocks.length ? blockGap : 0) + totalBlocksHeight + gaps;
      let cursorY = y + verticalOffset(height, totalHeight, pdfPageVerticalJustify(page)) + (Number(page.cartela.vertical_offset) || 0);

      await drawCanvasCartelaImages(ctx, page.cartela, effectiveLayout);

      if (titleText && titleMetrics) {
        drawCanvasText(ctx, titleText, x, cursorY, width, titleMetrics, 'center');
        cursorY += canvasTextHeight(titleText, titleMetrics, width) + (blocks.length ? blockGap : 0);
      }

      blocks.forEach((block, index) => {
        drawCanvasBlock(ctx, block, page.cartela, effectiveLayout, x, cursorY, width);
        cursorY += heights[index] + blockGap;
      });
    }

    async function drawCanvasCartelaImages(ctx, cartela, layout) {
      const area = contentAreaRect(layout);
      for (const image of cartelaImages(cartela)) {
        const bitmap = await loadCanvasImage(image.data_url);
        const scale = Math.max(0.01, Number(image.scale) || 1);
        const width = bitmap.naturalWidth * scale;
        const height = bitmap.naturalHeight * scale;
        const centerX = area.x + (area.width / 2) + (Number(image.offset_x) || 0);
        const centerY = area.y + (area.height / 2) + (Number(image.offset_y) || 0);
        ctx.drawImage(bitmap, centerX - (width / 2), centerY - (height / 2), width, height);
      }
    }

    function loadCanvasImage(src) {
      if (canvasImageCache.has(src)) return canvasImageCache.get(src);
      const promise = new Promise((resolve, reject) => {
        const image = new imageCtor();
        image.onload = () => resolve(image);
        image.onerror = () => {
          canvasImageCache.delete(src);
          reject(new Error('No se pudo cargar la imagen asociada.'));
        };
        image.src = src;
      });
      canvasImageCache.set(src, promise);
      return promise;
    }

    function measureCanvasBlock(ctx, block, cartela, layout, width) {
      let height = 0;
      const title = String(block.title || '').trim();
      const units = block.pages && block.pages[0] ? block.pages[0].items || [] : [];
      if (title) {
        const titleMetrics = canvasTextMetrics('block_title', cartela, layout, block.typography);
        height += canvasTextHeight(title, titleMetrics, width);
        if (units.length) height += cartelaBlockTitleGap(cartela, layout);
      }
      const columns = Math.max(1, Number(block.columns) || 1);
      const columnWidth = (width - layout.column_gap * (columns - 1)) / columns;
      const rowHeights = [];
      let previousCreditSourceId = null;
      units.forEach((unit, index) => {
        const row = Math.floor(index / columns);
        const options = unitRenderOptions(unit, previousCreditSourceId, cartela, index > 0, units[index - 1]);
        const unitHeight = measureCanvasUnit(unit, block, cartela, layout, columnWidth, options);
        rowHeights[row] = Math.max(rowHeights[row] || 0, unitHeight);
        previousCreditSourceId = creditSourceId(unit);
      });
      height += rowHeights.reduce((total, value) => total + value, 0);
      height += canvasRowGaps(units, cartela, layout, columns).reduce((total, value) => total + value, 0);
      return height;
    }

    function drawCanvasBlock(ctx, block, cartela, layout, x, y, width) {
      let cursorY = y;
      const title = String(block.title || '').trim();
      const units = block.pages && block.pages[0] ? block.pages[0].items || [] : [];
      if (title) {
        const metrics = canvasTextMetrics('block_title', cartela, layout, block.typography);
        drawCanvasText(ctx, title, x, cursorY, width, metrics, 'center');
        cursorY += canvasTextHeight(title, metrics, width) + (units.length ? cartelaBlockTitleGap(cartela, layout) : 0);
      }
      const columns = Math.max(1, Number(block.columns) || 1);
      const columnWidth = (width - layout.column_gap * (columns - 1)) / columns;
      const rowHeights = [];
      const rowGaps = canvasRowGaps(units, cartela, layout, columns);
      units.forEach((unit, index) => {
        const row = Math.floor(index / columns);
        const previousSourceId = index > 0 ? creditSourceId(units[index - 1]) : null;
        const options = unitRenderOptions(unit, previousSourceId, cartela, index > 0, units[index - 1]);
        rowHeights[row] = Math.max(rowHeights[row] || 0, measureCanvasUnit(unit, block, cartela, layout, columnWidth, options));
      });
      let previousCreditSourceId = null;
      units.forEach((unit, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;
        const unitX = x + col * (columnWidth + layout.column_gap);
        const unitY = cursorY +
          rowHeights.slice(0, row).reduce((total, value) => total + value, 0) +
          rowGaps.slice(0, row).reduce((total, value) => total + value, 0);
        const options = unitRenderOptions(unit, previousCreditSourceId, cartela, index > 0, units[index - 1]);
        drawCanvasUnit(ctx, unit, block, cartela, layout, unitX, unitY, columnWidth, options);
        previousCreditSourceId = creditSourceId(unit);
      });
    }

    function canvasRowGaps(units, cartela, layout, columns) {
      const items = units || [];
      const rowCount = Math.ceil(items.length / Math.max(1, columns));
      const gaps = Array.from({ length: Math.max(0, rowCount - 1) }, () => 0);

      for (let row = 1; row < rowCount; row += 1) {
        const firstIndex = row * columns;
        const unit = items[firstIndex];
        const previousUnit = items[firstIndex - 1];
        const options = unitRenderOptions(unit, creditSourceId(previousUnit), cartela, firstIndex > 0, previousUnit);
        gaps[row - 1] = unitGapBefore(options, layout);
      }
      return gaps;
    }

    function measureCanvasUnit(unit, block, cartela, layout, width, options = {}) {
      if (block.type === 'music_licenses' && unit.lines) {
        return (unit.lines || []).reduce((total, line, index) => {
          const metrics = canvasTextMetrics(index === 0 ? 'role' : 'name', cartela, layout, block.typography);
          return total + canvasTextHeight(line.value, metrics, width);
        }, 0);
      }
      if (options.repeatedNameRow) {
        const metrics = canvasTextMetrics('name', cartela, layout, block.typography);
        return canvasTextHeight(unit.name, metrics, width);
      }
      if (unit.kind === 'credit' || unit.kind === 'crew_credit' || unit.kind === 'cast') {
        const orientation = cartela.orientation || 'horizontal';
        const role = unit.kind === 'cast' ? unit.actor : unit.role;
        const name = unit.kind === 'cast' ? unit.character : unit.name;
        const textWidth = orientation === 'horizontal'
          ? Math.max(1, (width - layout.role_name_gap) / 2)
          : width;
        const roleHeight = String(role || '').length
          ? canvasTextHeight(role, canvasTextMetrics('role', cartela, layout, block.typography), textWidth)
          : 0;
        const nameHeight = String(name || '').length
          ? canvasTextHeight(name, canvasTextMetrics('name', cartela, layout, block.typography), textWidth)
          : 0;
        return orientation === 'vertical'
          ? roleHeight + (roleHeight && nameHeight ? roleNameGapForOrientation(layout, orientation) : 0) + nameHeight
          : Math.max(roleHeight, nameHeight, canvasTextMetrics('name', cartela, layout, block.typography).lineHeight);
      }
      const metrics = canvasTextMetrics(unit.title !== undefined ? 'block_title' : 'name', cartela, layout, block.typography);
      if (unit.text_already_transformed) metrics.textCapitalization = 'source';
      return canvasTextHeight(unit.title !== undefined ? unit.title : unit.value, metrics, width);
    }

    function drawCanvasUnit(ctx, unit, block, cartela, layout, x, y, width, options = {}) {
      const orientation = cartela.orientation || 'horizontal';
      const alignment = block.alignment || {};
      if (block.type === 'music_licenses' && unit.lines) {
        let cursorY = y;
        (unit.lines || []).forEach((line, index) => {
          const metrics = canvasTextMetrics(index === 0 ? 'role' : 'name', cartela, layout, block.typography);
          drawCanvasText(ctx, line.value || '', x, cursorY, width, metrics, alignment.text || 'center');
          cursorY += canvasTextHeight(line.value, metrics, width);
        });
        return;
      }
      if (unit.kind === 'credit' || unit.kind === 'crew_credit') {
        drawCanvasPair(ctx, options.hideRole ? '' : unit.role || '', unit.name || '', cartela, layout, x, y, width, alignment, orientation, block.typography);
        return;
      }
      if (unit.kind === 'cast') {
        drawCanvasPair(ctx, unit.actor || '', unit.character || '', cartela, layout, x, y, width, alignment, orientation, block.typography);
        return;
      }
      const metrics = canvasTextMetrics(unit.title !== undefined ? 'block_title' : 'name', cartela, layout, block.typography);
      if (unit.text_already_transformed) metrics.textCapitalization = 'source';
      drawCanvasText(ctx, unit.title || unit.value || '', x, y, width, metrics, alignment.text || (orientation === 'vertical' ? 'center' : 'left'));
    }

    function drawCanvasPair(ctx, role, name, cartela, layout, x, y, width, alignment, orientation, typography) {
      const roleMetrics = canvasTextMetrics('role', cartela, layout, typography);
      const nameMetrics = canvasTextMetrics('name', cartela, layout, typography);
      if (orientation === 'vertical') {
        if (!role) {
          drawCanvasText(ctx, name, x, y, width, nameMetrics, alignment.name || 'center');
          return;
        }
        drawCanvasText(ctx, role, x, y, width, roleMetrics, alignment.role || 'center');
        drawCanvasText(ctx, name, x, y + canvasTextHeight(role, roleMetrics, width) + roleNameGapForOrientation(layout, orientation), width, nameMetrics, alignment.name || 'center');
        return;
      }
      const halfWidth = (width - layout.role_name_gap) / 2;
      drawCanvasText(ctx, role, x, y, halfWidth, roleMetrics, alignment.role || 'right');
      drawCanvasText(ctx, name, x + halfWidth + layout.role_name_gap, y, halfWidth, nameMetrics, alignment.name || 'left');
    }

    function canvasTextMetrics(styleKey, cartela, layout, typographyOverrides = {}) {
      const settings = getProductionSettings();
      const typography = {
        ...settings.typography[styleKey],
        ...((typographyOverrides && typographyOverrides[styleKey]) || {}),
      };
      const fontSize = Math.max(1, Number(typography.font_size) || 1) * (Number(cartela.font_size_multiplier) || 1);
      return {
        color: typography.color,
        font: `${fontStyleFromStyle(typography.font_style)} ${fontWeightFromStyle(typography.font_style)} ${fontSize}px ${quoteFontFamily(typography.font_family)}`,
        fontSize,
        lineHeight: fontSize * Math.max(0.1, Number(layout.line_spacing) || settings.layout.line_spacing) * (Number(cartela.line_spacing_multiplier) || 1),
        textCapitalization: normalizeTextCapitalization(cartela && cartela.text_capitalization !== undefined ? cartela.text_capitalization : settings.text_capitalization),
        language: normalizeLanguage(settings.language),
        protectedCapitalizations: settings.protected_capitalizations,
        useProtectedCapitalization: cartela && cartela.use_protected_capitalization !== undefined
          ? normalizeBoolean(cartela.use_protected_capitalization, true)
          : settings.use_protected_capitalization,
        autoWrap: normalizeBoolean(cartela && cartela.auto_text_wrap, false),
      };
    }

    function canvasTextHeight(text, metrics, width = Infinity) {
      return canvasWrappedTextLines(text, metrics, width).length * metrics.lineHeight;
    }

    function canvasWrappedTextLines(text, metrics, width = Infinity) {
      const transformed = applyTextCapitalization(
        text,
        metrics.textCapitalization,
        metrics.language,
        metrics.protectedCapitalizations,
        metrics.useProtectedCapitalization
      );
      const sourceLines = explicitTextLines(transformed);
      if (!metrics.autoWrap || !Number.isFinite(width) || width <= 0) return sourceLines;
      const cacheKey = [metrics.font, metrics.textCapitalization, metrics.language, Math.round(width * 100) / 100, transformed].join('\u0001');
      const cached = canvasWrapCache.get(cacheKey);
      if (cached) return cached;
      if (!canvasMeasureContext) canvasMeasureContext = documentRef.createElement('canvas').getContext('2d');
      canvasMeasureContext.font = metrics.font;
      const output = [];
      const fits = (value) => canvasMeasureContext.measureText(value).width <= width;
      const pushLongWord = (word) => {
        let line = '';
        for (const character of word) {
          if (line && !fits(line + character)) {
            output.push(line);
            line = character;
          } else {
            line += character;
          }
        }
        return line;
      };
      sourceLines.forEach((sourceLine) => {
        if (!sourceLine || fits(sourceLine)) {
          output.push(sourceLine);
          return;
        }
        let current = '';
        sourceLine.trim().split(/\s+/).forEach((word) => {
          const candidate = current ? `${current} ${word}` : word;
          if (fits(candidate)) {
            current = candidate;
          } else {
            if (current) output.push(current);
            current = fits(word) ? word : pushLongWord(word);
          }
        });
        output.push(current);
      });
      const lines = output.length ? output : [''];
      if (canvasWrapCache.size >= 5000) canvasWrapCache.clear();
      canvasWrapCache.set(cacheKey, lines);
      return lines;
    }

    function drawCanvasText(ctx, text, x, y, width, metrics, align) {
      ctx.save();
      const verticalBleed = Math.ceil(Math.max(1, Number(metrics.fontSize) || 1) * textVerticalBleedRatio);
      const lines = canvasWrappedTextLines(text, metrics, width);
      const textHeight = Math.max(metrics.lineHeight, lines.length * metrics.lineHeight);
      ctx.beginPath();
      ctx.rect(x, y - verticalBleed, width, textHeight + (verticalBleed * 2));
      ctx.clip();
      ctx.font = metrics.font;
      ctx.fillStyle = metrics.color;
      ctx.textBaseline = 'top';
      ctx.textAlign = align;
      const textX = align === 'center' ? x + width / 2 : align === 'right' ? x + width : x;
      lines.forEach((line, index) => ctx.fillText(line, textX, y + index * metrics.lineHeight));
      ctx.restore();
    }

    return {
      canvasTextHeight,
      canvasTextMetrics,
      canvasWrappedTextLines,
      drawCanvasBlock,
      drawCanvasCartelaImages,
      drawCanvasMarginOverlay,
      drawCanvasPage,
      drawCanvasText,
      loadCanvasImage,
      measureCanvasBlock,
    };
  }

  root.CreditosPreviewCanvas = {
    createCanvasPreview,
  };
})(globalThis);
