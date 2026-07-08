(function (root) {
  function createCanvasPreview(dependencies = {}) {
    const {
      applyTextCapitalization = (text) => text,
      cartelaBlockGap = () => 0,
      cartelaBlockTitleGap = () => 0,
      cartelaImages = () => [],
      cartelaWithResolvedRowAnimation = (cartela) => cartela,
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
      scrollClipRect = () => ({ x: 0, y: 0, width: 0, height: 0 }),
      scrollFullAreaItemClip = (_item, _y, clip) => clip,
      scrollItemIntersectsClip = () => true,
      scrollOffsetForFrame = () => 0,
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

    async function drawCanvasPage(ctx, page, layout, renderOptions = {}) {
      const effectiveLayout = layoutForCartela(layout, page && page.cartela);
      const blockGap = cartelaBlockGap(page.cartela, effectiveLayout);
      const x = Math.max(0, Number(effectiveLayout.page_left_margin) || 0);
      const y = effectiveLayout.page_top_margin;
      const width = Math.max(0, effectiveLayout.page_width - x - (Number(effectiveLayout.page_right_margin) || 0));
      const height = effectiveLayout.page_height - effectiveLayout.page_top_margin - effectiveLayout.page_bottom_margin;
      const blocks = page.blocks.filter((block) => !block.missing_source);
      const rowPlan = canvasPageRowPlan(page, blocks);
      const rowCartela = (rowIndex) => cartelaWithResolvedRowAnimation(page.cartela, renderOptions.animationFrame, {
        rowCount: rowPlan.rowCount,
        rowIndex,
      });
      const heights = blocks.map((block, index) => measureCanvasBlock(ctx, block, page.cartela, effectiveLayout, width, {
        rowCartela,
        startRowIndex: rowPlan.blockStartRows[index],
      }));
      const titleText = page && page.cartela_physical_index === 0 ? String(page.title || '').trim() : '';
      const titleCartela = titleText ? rowCartela(0) : page.cartela;
      const titleMetrics = titleText ? canvasTextMetrics('page_header', titleCartela, effectiveLayout, page.cartela.title_typography) : null;
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
        drawCanvasBlock(ctx, block, page.cartela, effectiveLayout, x, cursorY, width, {
          rowCartela,
          startRowIndex: rowPlan.blockStartRows[index],
        });
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

    async function drawCanvasScrollFrame(ctx, plan, frame, layout) {
      const offset = scrollOffsetForFrame(plan, frame);
      for (const item of plan.items) {
        const y = Math.round(item.stackTop - offset);
        const clip = scrollClipRect(item.layout);
        if (!scrollItemIntersectsClip(item, y, clip)) continue;
        const itemClip = item.fullAreaCartela ? scrollFullAreaItemClip(item, y, clip) : clip;
        if (itemClip.height <= 0) continue;
        ctx.save();
        ctx.beginPath();
        ctx.rect(itemClip.x, itemClip.y, itemClip.width, itemClip.height);
        ctx.clip();
        await drawCanvasScrollItem(ctx, item, y);
        ctx.restore();
      }
      drawCanvasScrollFade(ctx, layout);
    }

    function drawCanvasScrollFade(ctx, layout) {
      const clip = scrollClipRect(layout);
      const fadeUp = Math.min(clip.height, Math.max(0, Number(layout.scroll_fade_up) || 0));
      const fadeDown = Math.min(clip.height, Math.max(0, Number(layout.scroll_fade_down) || 0));
      if (!fadeUp && !fadeDown) return;
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      if (fadeUp) {
        const gradient = ctx.createLinearGradient(0, clip.y, 0, clip.y + fadeUp);
        gradient.addColorStop(0, 'rgba(0,0,0,1)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(clip.x, clip.y, clip.width, fadeUp);
      }
      if (fadeDown) {
        const gradient = ctx.createLinearGradient(0, clip.y + clip.height - fadeDown, 0, clip.y + clip.height);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(clip.x, clip.y + clip.height - fadeDown, clip.width, fadeDown);
      }
      ctx.restore();
    }

    async function drawCanvasScrollItem(ctx, item, y) {
      const layout = item.layout;
      const cartela = item.cartela;
      const x = Math.max(0, Number(layout.page_left_margin) || 0);
      const width = Math.max(0, layout.page_width - x - (Number(layout.page_right_margin) || 0));
      await drawCanvasScrollCartelaImages(ctx, item, y);
      let cursorY = y;
      if (item.title && item.titleMetrics) {
        drawCanvasText(ctx, item.title, x, cursorY, width, item.titleMetrics, 'center');
        cursorY += canvasTextHeight(item.title, item.titleMetrics, width) + (item.blocks.length ? item.blockGap : 0);
      }
      item.blocks.forEach((block, index) => {
        drawCanvasBlock(ctx, block, cartela, layout, x, cursorY, width);
        cursorY += item.blockHeights[index] + item.blockGap;
      });
    }

    async function drawCanvasScrollCartelaImages(ctx, item, itemY) {
      const area = contentAreaRect(item.layout);
      for (const image of cartelaImages(item.cartela)) {
        const bitmap = await loadCanvasImage(image.data_url);
        const scale = Math.max(0.01, Number(image.scale) || 1);
        const width = bitmap.naturalWidth * scale;
        const height = bitmap.naturalHeight * scale;
        const centerX = area.x + (area.width / 2) + (Number(image.offset_x) || 0);
        const centerY = item.fullAreaCartela
          ? itemY + (Math.max(1, Number(item.height) || 1) / 2) + (Number(image.offset_y) || 0)
          : itemY + ((area.y + (area.height / 2) + (Number(image.offset_y) || 0)) - item.normalTop);
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

    function canvasPageRowPlan(page, blocks) {
      const titleRows = page && page.cartela_physical_index === 0 && String(page.title || '').trim() ? 1 : 0;
      let nextRow = titleRows;
      const blockStartRows = [];
      (blocks || []).forEach((block) => {
        blockStartRows.push(nextRow);
        nextRow += canvasBlockRowCount(block);
      });
      return {
        blockStartRows,
        rowCount: Math.max(1, nextRow),
      };
    }

    function canvasBlockRowCount(block) {
      const units = block && block.pages && block.pages[0] ? block.pages[0].items || [] : [];
      const columns = Math.max(1, Number(block && block.columns) || 1);
      return (String(block && block.title || '').trim() ? 1 : 0) + Math.max(0, Math.ceil(units.length / columns));
    }

    function measureCanvasBlock(ctx, block, cartela, layout, width, rowContext = {}) {
      let height = 0;
      const title = String(block.title || '').trim();
      const units = block.pages && block.pages[0] ? block.pages[0].items || [] : [];
      const titleRows = title ? 1 : 0;
      if (title) {
        const titleCartela = rowContext.rowCartela ? rowContext.rowCartela(rowContext.startRowIndex || 0) : cartela;
        const titleLayout = layoutForCartela(layout, titleCartela);
        const titleMetrics = canvasTextMetrics('block_title', titleCartela, titleLayout, block.typography);
        height += canvasTextHeight(title, titleMetrics, width);
        if (units.length) height += cartelaBlockTitleGap(titleCartela, titleLayout);
      }
      const columns = Math.max(1, Number(block.columns) || 1);
      const rowHeights = [];
      let previousCreditSourceId = null;
      units.forEach((unit, index) => {
        const row = Math.floor(index / columns);
        const options = unitRenderOptions(unit, previousCreditSourceId, cartela, index > 0, units[index - 1]);
        const rowCartela = rowContext.rowCartela ? rowContext.rowCartela((rowContext.startRowIndex || 0) + titleRows + row) : cartela;
        const rowLayout = layoutForCartela(layout, rowCartela);
        const columnWidth = (width - rowLayout.column_gap * (columns - 1)) / columns;
        const unitHeight = measureCanvasUnit(unit, block, rowCartela, rowLayout, columnWidth, options);
        rowHeights[row] = Math.max(rowHeights[row] || 0, unitHeight);
        previousCreditSourceId = creditSourceId(unit);
      });
      height += rowHeights.reduce((total, value) => total + value, 0);
      height += canvasRowGaps(units, cartela, layout, columns).reduce((total, value) => total + value, 0);
      return height;
    }

    function drawCanvasBlock(ctx, block, cartela, layout, x, y, width, rowContext = {}) {
      let cursorY = y;
      const title = String(block.title || '').trim();
      const units = block.pages && block.pages[0] ? block.pages[0].items || [] : [];
      const titleRows = title ? 1 : 0;
      if (title) {
        const titleCartela = rowContext.rowCartela ? rowContext.rowCartela(rowContext.startRowIndex || 0) : cartela;
        const titleLayout = layoutForCartela(layout, titleCartela);
        const metrics = canvasTextMetrics('block_title', titleCartela, titleLayout, block.typography);
        drawCanvasText(ctx, title, x, cursorY, width, metrics, 'center');
        cursorY += canvasTextHeight(title, metrics, width) + (units.length ? cartelaBlockTitleGap(titleCartela, titleLayout) : 0);
      }
      const columns = Math.max(1, Number(block.columns) || 1);
      const rowHeights = [];
      const rowGaps = canvasRowGaps(units, cartela, layout, columns);
      units.forEach((unit, index) => {
        const row = Math.floor(index / columns);
        const previousSourceId = index > 0 ? creditSourceId(units[index - 1]) : null;
        const options = unitRenderOptions(unit, previousSourceId, cartela, index > 0, units[index - 1]);
        const rowCartela = rowContext.rowCartela ? rowContext.rowCartela((rowContext.startRowIndex || 0) + titleRows + row) : cartela;
        const rowLayout = layoutForCartela(layout, rowCartela);
        const columnWidth = (width - rowLayout.column_gap * (columns - 1)) / columns;
        rowHeights[row] = Math.max(rowHeights[row] || 0, measureCanvasUnit(unit, block, rowCartela, rowLayout, columnWidth, options));
      });
      let previousCreditSourceId = null;
      units.forEach((unit, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;
        const rowCartela = rowContext.rowCartela ? rowContext.rowCartela((rowContext.startRowIndex || 0) + titleRows + row) : cartela;
        const rowLayout = layoutForCartela(layout, rowCartela);
        const columnWidth = (width - rowLayout.column_gap * (columns - 1)) / columns;
        const unitX = x + col * (columnWidth + rowLayout.column_gap);
        const unitY = cursorY +
          rowHeights.slice(0, row).reduce((total, value) => total + value, 0) +
          rowGaps.slice(0, row).reduce((total, value) => total + value, 0);
        const options = unitRenderOptions(unit, previousCreditSourceId, cartela, index > 0, units[index - 1]);
        drawCanvasUnit(ctx, unit, block, rowCartela, rowLayout, unitX, unitY, columnWidth, options);
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
      const letterSpacing = Number(typography.letter_spacing) || 0;
      return {
        color: typography.color,
        font: `${fontStyleFromStyle(typography.font_style)} ${fontWeightFromStyle(typography.font_style)} ${fontSize}px ${quoteFontFamily(typography.font_family)}`,
        fontSize,
        letterSpacing,
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
      const cacheKey = [metrics.font, metrics.letterSpacing, metrics.textCapitalization, metrics.language, Math.round(width * 100) / 100, transformed].join('\u0001');
      const cached = canvasWrapCache.get(cacheKey);
      if (cached) return cached;
      if (!canvasMeasureContext) canvasMeasureContext = documentRef.createElement('canvas').getContext('2d');
      canvasMeasureContext.font = metrics.font;
      const measureLine = (value) => canvasTextWidth(canvasMeasureContext, value, metrics);
      const output = [];
      const fits = (value) => measureLine(value) <= width;
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
      lines.forEach((line, index) => drawCanvasTextLine(ctx, line, textX, y + index * metrics.lineHeight, metrics, align));
      ctx.restore();
    }

    function canvasTextWidth(ctx, text, metrics) {
      const value = String(text || '');
      const spacing = Number(metrics.letterSpacing) || 0;
      if (!value || !spacing) return ctx.measureText(value).width;
      return Math.max(0, ctx.measureText(value).width + Math.max(0, Array.from(value).length - 1) * spacing);
    }

    function drawCanvasTextLine(ctx, line, x, y, metrics, align) {
      const value = String(line || '');
      const spacing = Number(metrics.letterSpacing) || 0;
      if (!value || !spacing) {
        ctx.fillText(value, x, y);
        return;
      }
      const characters = Array.from(value);
      const width = canvasTextWidth(ctx, value, metrics);
      let cursorX = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x;
      const previousAlign = ctx.textAlign;
      ctx.textAlign = 'left';
      characters.forEach((character, index) => {
        ctx.fillText(character, cursorX, y);
        cursorX += ctx.measureText(character).width + (index < characters.length - 1 ? spacing : 0);
      });
      ctx.textAlign = previousAlign;
    }

    return {
      canvasTextHeight,
      canvasTextMetrics,
      canvasWrappedTextLines,
      drawCanvasBlock,
      drawCanvasCartelaImages,
      drawCanvasMarginOverlay,
      drawCanvasPage,
      drawCanvasScrollFrame,
      drawCanvasText,
      loadCanvasImage,
      measureCanvasBlock,
    };
  }

  root.CreditosPreviewCanvas = {
    createCanvasPreview,
  };
})(globalThis);
