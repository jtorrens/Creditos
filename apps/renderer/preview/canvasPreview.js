(function (root) {
  function createCanvasPreview(dependencies = {}) {
    const {
      applyTextCapitalization = (text) => text,
      applyTextSubstitutions = (text) => text,
      animationFadeAlpha = () => 1,
      animationFadeRevealState = () => null,
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
      fontWeightFromTypography = null,
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
      typographyWithResolvedRowAnimation = (_cartela, typography) => typography,
      typographyFontFamilyCss = (_category, typography) => quoteFontFamily(typography.font_family),
    } = dependencies;

    const canvasImageCache = new Map();
    let canvasMeasureContext = null;
    const canvasWrapCache = new Map();

    function clearCanvasTextCaches() {
      canvasWrapCache.clear();
    }

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
      const animationFrame = renderOptions && renderOptions.animationFrame ? renderOptions.animationFrame : null;
      const effectiveLayout = layoutForCartela(layout, page && page.cartela);
      const blockGap = cartelaBlockGap(page.cartela, effectiveLayout);
      const x = Math.max(0, Number(effectiveLayout.page_left_margin) || 0);
      const y = effectiveLayout.page_top_margin;
      const width = Math.max(0, effectiveLayout.page_width - x - (Number(effectiveLayout.page_right_margin) || 0));
      const height = effectiveLayout.page_height - effectiveLayout.page_top_margin - effectiveLayout.page_bottom_margin;
      const blocks = page.blocks.filter((block) => !block.missing_source);
      const rowPlan = canvasPageRowPlan(page, blocks);
      const rowCartela = (rowIndex) => animationFrame ? cartelaWithResolvedRowAnimation(page.cartela, animationFrame, {
        rowCount: rowPlan.rowCount,
        rowIndex,
      }) : page.cartela;
      const rowTypography = (rowIndex, typography) => animationFrame ? typographyWithResolvedRowAnimation(rowCartela(rowIndex), typography, animationFrame, {
        rowCount: rowPlan.rowCount,
        rowIndex,
      }) : typography;
      const rowFadeAlpha = (rowIndex) => animationFrame ? animationFadeAlpha(rowCartela(rowIndex), animationFrame, {
        fadeScope: 'row',
        rowCount: rowPlan.rowCount,
        rowIndex,
      }) : 1;
      const heights = blocks.map((block, index) => measureCanvasBlock(ctx, block, page.cartela, effectiveLayout, width, {
        rowFadeAlpha,
        rowCartela,
        rowTypography,
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

      const fullFrameFadeAlpha = animationFrame ? animationFadeAlpha(page.cartela, animationFrame, {
        fadeScope: 'fullFrame',
        rowCount: 1,
        rowIndex: 0,
      }) : 1;
      const frameReveal = animationFrame ? animationFadeRevealState(page.cartela, animationFrame, {
        fadeScope: 'frame',
        rowCount: 1,
        rowIndex: 0,
      }) : null;
      const target = frameReveal && clampAlpha(frameReveal.progress) < 1
        ? createCanvasLayer(effectiveLayout.page_width, effectiveLayout.page_height)
        : null;
      const targetCtx = target ? target.ctx : ctx;
      targetCtx.save();
      targetCtx.globalAlpha *= clampAlpha(fullFrameFadeAlpha);
      try {
        await drawCanvasCartelaImages(targetCtx, page.cartela, effectiveLayout);

        if (titleText && titleMetrics) {
          drawWithAlpha(targetCtx, rowFadeAlpha(0), () => drawCanvasText(targetCtx, titleText, x, cursorY, width, titleMetrics, 'center'));
          cursorY += canvasTextHeight(titleText, titleMetrics, width) + (blocks.length ? blockGap : 0);
        }

        blocks.forEach((block, index) => {
          drawCanvasBlock(targetCtx, block, page.cartela, effectiveLayout, x, cursorY, width, {
            rowFadeAlpha,
            rowCartela,
            rowTypography,
            startRowIndex: rowPlan.blockStartRows[index],
          });
          cursorY += heights[index] + blockGap;
        });
      } finally {
        targetCtx.restore();
      }
      if (target) {
        const revealRect = revealMaskRect(effectiveLayout, frameReveal);
        targetCtx.save();
        targetCtx.globalCompositeOperation = 'destination-in';
        targetCtx.globalAlpha = 1;
        applyRevealMask(targetCtx, revealRect, frameReveal.direction, frameReveal.progress, frameReveal.featherPx, frameReveal.phase);
        targetCtx.restore();
        ctx.drawImage(target.canvas, 0, 0, effectiveLayout.page_width, effectiveLayout.page_height);
      }
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
        nextRow += canvasBlockRowCount(block, page && page.cartela);
      });
      return {
        blockStartRows,
        rowCount: Math.max(1, nextRow),
      };
    }

    function canvasBlockRowCount(block, cartela) {
      const units = block && block.pages && block.pages[0] ? block.pages[0].items || [] : [];
      return (String(block && block.title || '').trim() ? 1 : 0) + canvasBlockCascadeRows(block, cartela).rowCount;
    }

    function canvasBlockCascadeRows(block, cartela) {
      const units = block && block.pages && block.pages[0] ? block.pages[0].items || [] : [];
      const columns = Math.max(1, Number(block && block.columns) || 1);
      const rowCount = Math.ceil(units.length / columns);
      const rowStarts = [];
      let nextRow = 0;
      for (let row = 0; row < rowCount; row += 1) {
        rowStarts[row] = nextRow;
        let span = 1;
        for (let col = 0; col < columns; col += 1) {
          const index = row * columns + col;
          if (index >= units.length) break;
          const previousUnit = index > 0 ? units[index - 1] : null;
          const options = unitRenderOptions(units[index], creditSourceId(previousUnit), cartela, index > 0, previousUnit);
          span = Math.max(span, canvasUnitCascadeSpan(units[index], cartela, options));
        }
        nextRow += span;
      }
      return {
        rowCount: nextRow,
        rowStarts,
      };
    }

    function canvasUnitCascadeSpan(unit, cartela, options = {}) {
      if (!unit || !cartela || cartela.orientation !== 'vertical') return 1;
      if (options.repeatedNameRow) return 1;
      if (unit.kind === 'credit' || unit.kind === 'crew_credit') {
        const role = options.hideRole ? '' : unit.role;
        return String(role || '').trim() && String(unit.name || '').trim() ? 2 : 1;
      }
      if (unit.kind === 'cast') {
        return String(unit.actor || '').trim() && String(unit.character || '').trim() ? 2 : 1;
      }
      return 1;
    }

    function canvasUnitNameCascadeOffset(unit, cartela, options = {}) {
      return canvasUnitCascadeSpan(unit, cartela, options) > 1 ? 1 : 0;
    }

    function canvasUnitRowAnimation(rowContext, cartela, layout, typography, unit, options, rowIndex) {
      const nameRowIndex = rowIndex + canvasUnitNameCascadeOffset(unit, cartela, options);
      const roleCartela = rowContext.rowCartela ? rowContext.rowCartela(rowIndex) : cartela;
      const nameCartela = rowContext.rowCartela ? rowContext.rowCartela(nameRowIndex) : roleCartela;
      return {
        roleAlpha: rowContext.rowFadeAlpha ? rowContext.rowFadeAlpha(rowIndex) : 1,
        nameAlpha: rowContext.rowFadeAlpha ? rowContext.rowFadeAlpha(nameRowIndex) : 1,
        roleCartela,
        nameCartela,
        roleLayout: layoutForCartela(layout, roleCartela),
        nameLayout: layoutForCartela(layout, nameCartela),
        roleTypography: rowContext.rowTypography ? rowContext.rowTypography(rowIndex, typography) : typography,
        nameTypography: rowContext.rowTypography ? rowContext.rowTypography(nameRowIndex, typography) : typography,
      };
    }

    function canvasUnitHasPair(unit) {
      return unit && (unit.kind === 'credit' || unit.kind === 'crew_credit' || unit.kind === 'cast');
    }

    function measureCanvasBlock(ctx, block, cartela, layout, width, rowContext = {}) {
      let height = 0;
      const title = String(block.title || '').trim();
      const units = block.pages && block.pages[0] ? block.pages[0].items || [] : [];
      const titleRows = title ? 1 : 0;
      if (title) {
        const titleRowIndex = rowContext.startRowIndex || 0;
        const titleCartela = rowContext.rowCartela ? rowContext.rowCartela(titleRowIndex) : cartela;
        const titleLayout = layoutForCartela(layout, titleCartela);
        const titleTypography = rowContext.rowTypography ? rowContext.rowTypography(titleRowIndex, block.typography) : block.typography;
        const titleMetrics = canvasTextMetrics('block_title', titleCartela, titleLayout, titleTypography);
        height += canvasTextHeight(title, titleMetrics, width);
        if (units.length) height += cartelaBlockTitleGap(titleCartela, titleLayout);
      }
      const columns = Math.max(1, Number(block.columns) || 1);
      const cascadeRows = canvasBlockCascadeRows(block, cartela);
      const rowHeights = [];
      let previousCreditSourceId = null;
      units.forEach((unit, index) => {
        const layoutRow = Math.floor(index / columns);
        const options = unitRenderOptions(unit, previousCreditSourceId, cartela, index > 0, units[index - 1]);
        const rowIndex = (rowContext.startRowIndex || 0) + titleRows + (cascadeRows.rowStarts[layoutRow] || 0);
        const rowAnimation = canvasUnitRowAnimation(rowContext, cartela, layout, block.typography, unit, options, rowIndex);
        const rowCartela = rowAnimation.roleCartela;
        const rowLayout = rowAnimation.roleLayout;
        const rowTypography = rowAnimation.roleTypography;
        const columnWidth = (width - rowLayout.column_gap * (columns - 1)) / columns;
        const unitHeight = measureCanvasUnit(unit, block, rowCartela, rowLayout, columnWidth, {
          ...options,
          rowAnimation,
        }, rowTypography);
        rowHeights[layoutRow] = Math.max(rowHeights[layoutRow] || 0, unitHeight);
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
        const titleRowIndex = rowContext.startRowIndex || 0;
        const titleCartela = rowContext.rowCartela ? rowContext.rowCartela(titleRowIndex) : cartela;
        const titleLayout = layoutForCartela(layout, titleCartela);
        const titleTypography = rowContext.rowTypography ? rowContext.rowTypography(titleRowIndex, block.typography) : block.typography;
        const metrics = canvasTextMetrics('block_title', titleCartela, titleLayout, titleTypography);
        drawWithAlpha(ctx, rowContext.rowFadeAlpha ? rowContext.rowFadeAlpha(titleRowIndex) : 1, () => drawCanvasText(ctx, title, x, cursorY, width, metrics, 'center'));
        cursorY += canvasTextHeight(title, metrics, width) + (units.length ? cartelaBlockTitleGap(titleCartela, titleLayout) : 0);
      }
      const columns = Math.max(1, Number(block.columns) || 1);
      const cascadeRows = canvasBlockCascadeRows(block, cartela);
      const rowHeights = [];
      const rowGaps = canvasRowGaps(units, cartela, layout, columns);
      units.forEach((unit, index) => {
        const layoutRow = Math.floor(index / columns);
        const previousSourceId = index > 0 ? creditSourceId(units[index - 1]) : null;
        const options = unitRenderOptions(unit, previousSourceId, cartela, index > 0, units[index - 1]);
        const rowIndex = (rowContext.startRowIndex || 0) + titleRows + (cascadeRows.rowStarts[layoutRow] || 0);
        const rowAnimation = canvasUnitRowAnimation(rowContext, cartela, layout, block.typography, unit, options, rowIndex);
        const rowCartela = rowAnimation.roleCartela;
        const rowLayout = rowAnimation.roleLayout;
        const rowTypography = rowAnimation.roleTypography;
        const columnWidth = (width - rowLayout.column_gap * (columns - 1)) / columns;
        rowHeights[layoutRow] = Math.max(rowHeights[layoutRow] || 0, measureCanvasUnit(unit, block, rowCartela, rowLayout, columnWidth, {
          ...options,
          rowAnimation,
        }, rowTypography));
      });
      let previousCreditSourceId = null;
      units.forEach((unit, index) => {
        const layoutRow = Math.floor(index / columns);
        const col = index % columns;
        const rowIndex = (rowContext.startRowIndex || 0) + titleRows + (cascadeRows.rowStarts[layoutRow] || 0);
        const options = unitRenderOptions(unit, previousCreditSourceId, cartela, index > 0, units[index - 1]);
        const rowAnimation = canvasUnitRowAnimation(rowContext, cartela, layout, block.typography, unit, options, rowIndex);
        const rowCartela = rowAnimation.roleCartela;
        const rowLayout = rowAnimation.roleLayout;
        const rowTypography = rowAnimation.roleTypography;
        const columnWidth = (width - rowLayout.column_gap * (columns - 1)) / columns;
        const unitX = x + col * (columnWidth + rowLayout.column_gap);
        const unitY = cursorY +
          rowHeights.slice(0, layoutRow).reduce((total, value) => total + value, 0) +
          rowGaps.slice(0, layoutRow).reduce((total, value) => total + value, 0);
        const unitOptions = {
          ...options,
          rowAnimation,
        };
        if (canvasUnitHasPair(unit)) {
          drawCanvasUnit(ctx, unit, block, rowCartela, rowLayout, unitX, unitY, columnWidth, unitOptions, rowTypography);
        } else {
          drawWithAlpha(ctx, rowAnimation.roleAlpha, () => {
            drawCanvasUnit(ctx, unit, block, rowCartela, rowLayout, unitX, unitY, columnWidth, unitOptions, rowTypography);
          });
        }
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

    function measureCanvasUnit(unit, block, cartela, layout, width, options = {}, typography = block.typography) {
      if (block.type === 'music_licenses' && unit.lines) {
        return (unit.lines || []).reduce((total, line, index) => {
          const metrics = canvasTextMetrics(index === 0 ? 'role' : 'name', cartela, layout, typography);
          return total + canvasTextHeight(line.value, metrics, width);
        }, 0);
      }
      if (options.repeatedNameRow) {
        const metrics = canvasTextMetrics('name', cartela, layout, typography);
        return canvasTextHeight(unit.name, metrics, width);
      }
      if (unit.kind === 'credit' || unit.kind === 'crew_credit' || unit.kind === 'cast') {
        const orientation = cartela.orientation || 'horizontal';
        const role = unit.kind === 'cast' ? unit.actor : unit.role;
        const name = unit.kind === 'cast' ? unit.character : unit.name;
        const rowAnimation = options.rowAnimation || null;
        const roleCartela = rowAnimation && rowAnimation.roleCartela ? rowAnimation.roleCartela : cartela;
        const nameCartela = rowAnimation && rowAnimation.nameCartela ? rowAnimation.nameCartela : roleCartela;
        const roleLayout = rowAnimation && rowAnimation.roleLayout ? rowAnimation.roleLayout : layout;
        const nameLayout = rowAnimation && rowAnimation.nameLayout ? rowAnimation.nameLayout : roleLayout;
        const roleTypography = rowAnimation && rowAnimation.roleTypography ? rowAnimation.roleTypography : typography;
        const nameTypography = rowAnimation && rowAnimation.nameTypography ? rowAnimation.nameTypography : roleTypography;
        const textWidth = orientation === 'horizontal'
          ? Math.max(1, (width - roleLayout.role_name_gap) / 2)
          : width;
        const roleHeight = String(role || '').length
          ? canvasTextHeight(role, canvasTextMetrics('role', roleCartela, roleLayout, roleTypography), textWidth)
          : 0;
        const nameHeight = String(name || '').length
          ? canvasTextHeight(name, canvasTextMetrics('name', nameCartela, nameLayout, nameTypography), textWidth)
          : 0;
        return orientation === 'vertical'
          ? roleHeight + (roleHeight && nameHeight ? roleNameGapForOrientation(nameLayout, orientation) : 0) + nameHeight
          : Math.max(roleHeight, nameHeight, canvasTextMetrics('name', nameCartela, nameLayout, nameTypography).lineHeight);
      }
      const metrics = canvasTextMetrics(unit.title !== undefined ? 'block_title' : 'name', cartela, layout, typography);
      if (unit.text_already_transformed) metrics.textCapitalization = 'source';
      return canvasTextHeight(unit.title !== undefined ? unit.title : unit.value, metrics, width);
    }

    function drawCanvasUnit(ctx, unit, block, cartela, layout, x, y, width, options = {}, typography = block.typography) {
      const orientation = cartela.orientation || 'horizontal';
      const alignment = block.alignment || {};
      if (block.type === 'music_licenses' && unit.lines) {
        let cursorY = y;
        (unit.lines || []).forEach((line, index) => {
          const metrics = canvasTextMetrics(index === 0 ? 'role' : 'name', cartela, layout, typography);
          drawCanvasText(ctx, line.value || '', x, cursorY, width, metrics, alignment.text || 'center');
          cursorY += canvasTextHeight(line.value, metrics, width);
        });
        return;
      }
      if (unit.kind === 'credit' || unit.kind === 'crew_credit') {
        drawCanvasPair(ctx, options.hideRole ? '' : unit.role || '', unit.name || '', cartela, layout, x, y, width, alignment, orientation, typography, options.rowAnimation);
        return;
      }
      if (unit.kind === 'cast') {
        drawCanvasPair(ctx, unit.actor || '', unit.character || '', cartela, layout, x, y, width, alignment, orientation, typography, options.rowAnimation);
        return;
      }
      const metrics = canvasTextMetrics(unit.title !== undefined ? 'block_title' : 'name', cartela, layout, typography);
      if (unit.text_already_transformed) metrics.textCapitalization = 'source';
      drawCanvasText(ctx, unit.title || unit.value || '', x, y, width, metrics, alignment.text || (orientation === 'vertical' ? 'center' : 'left'));
    }

    function drawCanvasPair(ctx, role, name, cartela, layout, x, y, width, alignment, orientation, typography, rowAnimation = null) {
      const roleCartela = rowAnimation && rowAnimation.roleCartela ? rowAnimation.roleCartela : cartela;
      const nameCartela = rowAnimation && rowAnimation.nameCartela ? rowAnimation.nameCartela : roleCartela;
      const roleLayout = rowAnimation && rowAnimation.roleLayout ? rowAnimation.roleLayout : layout;
      const nameLayout = rowAnimation && rowAnimation.nameLayout ? rowAnimation.nameLayout : roleLayout;
      const roleTypography = rowAnimation && rowAnimation.roleTypography ? rowAnimation.roleTypography : typography;
      const nameTypography = rowAnimation && rowAnimation.nameTypography ? rowAnimation.nameTypography : roleTypography;
      const roleAlpha = rowAnimation ? rowAnimation.roleAlpha : 1;
      const nameAlpha = rowAnimation ? rowAnimation.nameAlpha : 1;
      const roleMetrics = canvasTextMetrics('role', roleCartela, roleLayout, roleTypography);
      const nameMetrics = canvasTextMetrics('name', nameCartela, nameLayout, nameTypography);
      if (orientation === 'vertical') {
        if (!role) {
          drawWithAlpha(ctx, nameAlpha, () => drawCanvasText(ctx, name, x, y, width, nameMetrics, alignment.name || 'center'));
          return;
        }
        drawWithAlpha(ctx, roleAlpha, () => drawCanvasText(ctx, role, x, y, width, roleMetrics, alignment.role || 'center'));
        drawWithAlpha(ctx, nameAlpha, () => drawCanvasText(ctx, name, x, y + canvasTextHeight(role, roleMetrics, width) + roleNameGapForOrientation(nameLayout, orientation), width, nameMetrics, alignment.name || 'center'));
        return;
      }
      const halfWidth = (width - roleLayout.role_name_gap) / 2;
      const roleHeight = canvasTextHeight(role, roleMetrics, halfWidth);
      const nameHeight = canvasTextHeight(name, nameMetrics, halfWidth);
      const nameY = y + Math.max(0, roleHeight - nameHeight);
      drawWithAlpha(ctx, roleAlpha, () => drawCanvasText(ctx, role, x, y, halfWidth, roleMetrics, alignment.role || 'right'));
      drawWithAlpha(ctx, nameAlpha, () => drawCanvasText(ctx, name, x + halfWidth + roleLayout.role_name_gap, nameY, halfWidth, nameMetrics, alignment.name || 'left'));
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
        font: `${fontStyleFromStyle(typography.font_style)} ${typeof fontWeightFromTypography === 'function' ? fontWeightFromTypography(typography) : fontWeightFromStyle(typography.font_style)} ${fontSize}px ${typographyFontFamilyCss(styleKey, typography, settings)}`,
        fontSize,
        letterSpacing,
        lineHeight: fontSize * Math.max(0.1, Number(layout.line_spacing) || settings.layout.line_spacing) * (Number(cartela.line_spacing_multiplier) || 1),
        textCapitalization: normalizeTextCapitalization(
          typography.text_capitalization !== undefined
            ? typography.text_capitalization
            : cartela && cartela.text_capitalization !== undefined
              ? cartela.text_capitalization
              : settings.text_capitalization
        ),
        language: normalizeLanguage(settings.language),
        protectedCapitalizations: settings.protected_capitalizations,
        textSubstitutions: settings.text_substitutions || [],
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
      const substituted = applyTextSubstitutions(text, metrics.textSubstitutions || []);
      const transformed = applyTextCapitalization(
        substituted,
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

    function drawWithAlpha(ctx, alpha, draw) {
      const normalized = clampAlpha(alpha);
      if (normalized <= 0) return;
      ctx.save();
      ctx.globalAlpha *= normalized;
      draw();
      ctx.restore();
    }

    function applyRevealMask(ctx, rect, direction, progress, featherPx, phase) {
      const normalizedProgress = clampAlpha(progress);
      const dir = direction || 'topToBottom';
      const vertical = dir === 'topToBottom' || dir === 'bottomToTop';
      const start = vertical ? revealRangeY(rect) : revealRangeX(rect);
      const length = Math.max(1, vertical ? revealRangeHeight(rect) : revealRangeWidth(rect));
      const feather = Math.min(length, Math.max(0, Number(featherPx) || 0));
      let edge = start;
      let visibleSide = 'before';
      if (phase === 'out') {
        const hiddenProgress = 1 - normalizedProgress;
        if (dir === 'bottomToTop') {
          edge = start + length - length * hiddenProgress;
          visibleSide = 'before';
        } else if (dir === 'rightToLeft') {
          edge = start + length - length * hiddenProgress;
          visibleSide = 'before';
        } else {
          edge = start + length * hiddenProgress;
          visibleSide = 'after';
        }
      } else if (dir === 'bottomToTop' || dir === 'rightToLeft') {
        edge = start + length - length * normalizedProgress;
        visibleSide = 'after';
      } else {
        edge = start + length * normalizedProgress;
        visibleSide = 'before';
      }
      drawRevealGradientMask(ctx, rect, vertical, visibleSide, edge, feather);
    }

    function drawRevealGradientMask(ctx, rect, vertical, visibleSide, edge, feather) {
      const rangeStart = vertical ? revealRangeY(rect) : revealRangeX(rect);
      const length = Math.max(1, vertical ? revealRangeHeight(rect) : revealRangeWidth(rect));
      const gradient = vertical
        ? ctx.createLinearGradient(0, rangeStart, 0, rangeStart + length)
        : ctx.createLinearGradient(rangeStart, 0, rangeStart + length, 0);
      if (!feather) {
        const stop = clampAlpha((edge - rangeStart) / length);
        if (visibleSide === 'before') {
          gradient.addColorStop(0, 'rgba(0,0,0,1)');
          gradient.addColorStop(stop, 'rgba(0,0,0,1)');
          gradient.addColorStop(stop, 'rgba(0,0,0,0)');
          gradient.addColorStop(1, 'rgba(0,0,0,0)');
        } else {
          gradient.addColorStop(0, 'rgba(0,0,0,0)');
          gradient.addColorStop(stop, 'rgba(0,0,0,0)');
          gradient.addColorStop(stop, 'rgba(0,0,0,1)');
          gradient.addColorStop(1, 'rgba(0,0,0,1)');
        }
      } else if (visibleSide === 'before') {
        const featherStart = clampAlpha((edge - feather - rangeStart) / length);
        const featherEnd = clampAlpha((edge - rangeStart) / length);
        gradient.addColorStop(0, 'rgba(0,0,0,1)');
        gradient.addColorStop(featherStart, 'rgba(0,0,0,1)');
        gradient.addColorStop(featherEnd, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
      } else {
        const featherStart = clampAlpha((edge - rangeStart) / length);
        const featherEnd = clampAlpha((edge + feather - rangeStart) / length);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(featherStart, 'rgba(0,0,0,0)');
        gradient.addColorStop(featherEnd, 'rgba(0,0,0,1)');
        gradient.addColorStop(1, 'rgba(0,0,0,1)');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    }

    function revealMaskRect(layout, reveal = {}) {
      const area = contentAreaRect(layout);
      const maskWidth = Math.max(0, Number(area.width) || 0);
      const maskHeight = Math.max(0, Number(area.height) || 0);
      const maskRect = maskWidth > 0 && maskHeight > 0
        ? {
          height: maskHeight,
          width: maskWidth,
          x: Number(area.x) || 0,
          y: Number(area.y) || 0,
        }
        : {
          height: Math.max(1, Number(layout.page_height) || 1),
          width: Math.max(1, Number(layout.page_width) || 1),
          x: 0,
          y: 0,
        };
      if (reveal.bounds === 'visibleFrame') {
        return maskRect;
      }
      return {
        ...maskRect,
        rangeHeight: Math.max(1, Number(layout.page_height) || 1),
        rangeWidth: Math.max(1, Number(layout.page_width) || 1),
        rangeX: 0,
        rangeY: 0,
      };
    }

    function revealRangeX(rect) {
      return Number(rect.rangeX !== undefined ? rect.rangeX : rect.x) || 0;
    }

    function revealRangeY(rect) {
      return Number(rect.rangeY !== undefined ? rect.rangeY : rect.y) || 0;
    }

    function revealRangeWidth(rect) {
      return Math.max(1, Number(rect.rangeWidth !== undefined ? rect.rangeWidth : rect.width) || 1);
    }

    function revealRangeHeight(rect) {
      return Math.max(1, Number(rect.rangeHeight !== undefined ? rect.rangeHeight : rect.height) || 1);
    }

    function createCanvasLayer(width, height) {
      const canvas = documentRef.createElement('canvas');
      canvas.width = Math.max(1, Math.ceil(Number(width) || 1));
      canvas.height = Math.max(1, Math.ceil(Number(height) || 1));
      return {
        canvas,
        ctx: canvas.getContext('2d'),
      };
    }

    function clampAlpha(value) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return 1;
      return Math.max(0, Math.min(1, numeric));
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
      clearCanvasTextCaches,
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
