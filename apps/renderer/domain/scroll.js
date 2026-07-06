(function (root) {
  function createScrollDomain(dependencies = {}) {
    const {
      blockForTitleRepeat,
      canvasTextHeight,
      canvasTextMetrics,
      cartelaBlockGap,
      cartelaHasImages,
      contentAreaRect,
      getRenderedBlockUnits,
      layoutForCartela,
      measureCanvasBlock,
      pdfPageVerticalJustify,
      verticalOffset,
    } = dependencies;

    function formatScrollSpeed(value) {
      if (typeof value === 'string') return value;
      const number = Number(value);
      if (!Number.isFinite(number)) return '0';
      return number.toFixed(2).replace(/\.?0+$/, '');
    }

    function scrollItemExitOffset(item) {
      const clip = scrollClipRect(item.layout);
      return Math.max(0, (Number(item.stackTop) || 0) + Math.max(1, Number(item.height) || 1) - clip.y);
    }

    function scrollItemNormalOffset(item) {
      return Math.max(0, (Number(item.stackTop) || 0) - (Number(item.normalTop) || 0));
    }

    function scrollItemEnterOffset(item) {
      const clip = scrollClipRect(item.layout);
      return Math.max(0, (Number(item.stackTop) || 0) - (clip.y + clip.height));
    }

    function buildIntegerScrollPhase(name, startFrame, requestedFrames, startOffset, endOffset) {
      const start = Math.round(Math.max(0, Number(startOffset) || 0));
      const end = Math.round(Math.max(start, Number(endOffset) || 0));
      const distance = Math.max(0, end - start);
      const baseFrames = Math.max(0, Math.round(Number(requestedFrames) || 0));
      if (!distance) {
        return {
          name,
          startFrame: Math.max(0, Math.round(Number(startFrame) || 0)),
          frames: baseFrames,
          startOffset: start,
          endOffset: end,
          speed: 0,
          speedLabel: '0',
        };
      }
      const frames = Math.max(2, baseFrames);
      const moveFrames = Math.max(1, frames - 1);
      const averageSpeed = distance / moveFrames;
      const minStep = Math.floor(averageSpeed);
      const maxStep = Math.ceil(averageSpeed);
      return {
        name,
        startFrame: Math.max(0, Math.round(Number(startFrame) || 0)),
        frames,
        startOffset: start,
        endOffset: end,
        speed: averageSpeed,
        speedLabel: minStep === maxStep ? String(minStep) : `${minStep}-${maxStep}`,
      };
    }

    function scrollOffsetForFrame(plan, frame) {
      const safeFrame = Math.max(0, Math.round(Number(frame) || 0));
      const totalFrames = Math.max(1, Number(plan && plan.totalFrames) || 1);
      const phases = (plan && plan.phases || []).filter((phase) => Math.max(0, Number(phase.frames) || 0) > 0);
      if (!phases.length) return 0;
      const clampedFrame = Math.max(0, Math.min(totalFrames - 1, safeFrame));
      for (const phase of phases) {
        const startFrame = Math.max(0, Math.round(Number(phase.startFrame) || 0));
        const frames = Math.max(1, Math.round(Number(phase.frames) || 1));
        if (clampedFrame < startFrame) return Math.max(0, Number(phase.startOffset) || 0);
        if (clampedFrame < startFrame + frames) {
          return scrollOffsetForPhaseFrame(phase, clampedFrame - startFrame);
        }
      }
      return Math.max(0, Number(phases[phases.length - 1].endOffset) || 0);
    }

    function scrollOffsetForPhaseFrame(phase, localFrame) {
      const start = Math.round(Math.max(0, Number(phase.startOffset) || 0));
      const end = Math.round(Math.max(start, Number(phase.endOffset) || 0));
      const distance = Math.max(0, end - start);
      const frames = Math.max(1, Math.round(Number(phase.frames) || 1));
      if (!distance || frames <= 1) return start;
      const clamped = Math.max(0, Math.round(Number(localFrame) || 0));
      return Math.min(end, start + Math.round((distance * Math.min(clamped, frames - 1)) / (frames - 1)));
    }

    function scrollItemIntersectsClip(item, y, clip) {
      const top = y;
      const bottom = y + Math.max(1, Number(item.height) || 1);
      return bottom >= clip.y && top <= clip.y + clip.height;
    }

    function scrollFullAreaItemClip(item, y, clip) {
      const itemTop = Math.max(clip.y, y);
      const itemBottom = Math.min(clip.y + clip.height, y + Math.max(1, Number(item.height) || 1));
      return {
        x: clip.x,
        y: itemTop,
        width: clip.width,
        height: Math.max(0, itemBottom - itemTop),
      };
    }

    function scrollClipRect(layout) {
      return contentAreaRect(layout);
    }

    function buildScrollPlan(groups, layout, bodyFrames, segments = {}) {
      const safeSegments = {
        preCount: Math.max(0, Math.round(Number(segments.preCount) || 0)),
        preFrames: Math.max(0, Math.round(Number(segments.preFrames) || 0)),
        postCount: Math.max(0, Math.round(Number(segments.postCount) || 0)),
        postFrames: Math.max(0, Math.round(Number(segments.postFrames) || 0)),
      };
      const items = buildScrollItems(groups, layout, safeSegments);
      safeSegments.preCount = Math.max(0, Math.min(items.length, safeSegments.preCount));
      safeSegments.postCount = Math.max(0, Math.min(items.length - safeSegments.preCount, safeSegments.postCount));
      const preEndIndex = safeSegments.preCount - 1;
      const bodyStartIndex = safeSegments.preCount;
      const bodyEndIndex = items.length - safeSegments.postCount - 1;
      const lastPreItem = preEndIndex >= 0 ? items[preEndIndex] : null;
      const firstBodyItem = bodyStartIndex <= bodyEndIndex ? items[bodyStartIndex] : null;
      const lastBodyItem = bodyEndIndex >= bodyStartIndex ? items[bodyEndIndex] : lastPreItem;
      const lastPostItem = safeSegments.postCount ? items[items.length - 1] : null;
      const preEndOffset = lastPreItem ? scrollItemExitOffset(lastPreItem) : 0;
      const bodyStartOffset = firstBodyItem ? Math.max(preEndOffset, scrollItemEnterOffset(firstBodyItem)) : preEndOffset;
      const bodyEndTarget = lastBodyItem ? scrollItemExitOffset(lastBodyItem) : preEndOffset;
      const bodyEndOffset = Math.max(bodyStartOffset, bodyEndTarget);
      const postEndOffset = lastPostItem ? Math.max(bodyEndOffset, scrollItemNormalOffset(lastPostItem)) : bodyEndOffset;
      const prePhase = buildIntegerScrollPhase('pre', 0, safeSegments.preFrames, 0, preEndOffset);
      const bodyPhase = buildIntegerScrollPhase('body', prePhase.startFrame + prePhase.frames, bodyFrames, bodyStartOffset, bodyEndOffset);
      const postPhase = buildIntegerScrollPhase('post', bodyPhase.startFrame + bodyPhase.frames, safeSegments.postFrames, bodyEndOffset, postEndOffset);
      const phases = [prePhase, bodyPhase, postPhase];
      const totalFrames = Math.max(1, postPhase.startFrame + postPhase.frames);
      const bodySpeed = bodyPhase.speedLabel || bodyPhase.speed;
      return {
        items,
        distance: postEndOffset,
        totalFrames,
        speed: bodySpeed,
        bodySpeed,
        phases,
        segments: safeSegments,
      };
    }

    function buildScrollItems(groups, layout, segments = {}) {
      let stackTop = Number(layout.page_height) || 0;
      const gap = Math.max(0, Number(layout.scroll_page_gap) || 0);
      const lastGap = Math.max(0, Number(layout.scroll_last_page_gap) || 0);
      const postCount = Math.max(0, Math.min(groups.length, Math.round(Number(segments.postCount) || 0)));
      const firstPostIndex = postCount ? groups.length - postCount : -1;
      return groups.map((group, index) => {
        const item = buildScrollItem(group, layout, stackTop);
        const nextIsFirstPost = firstPostIndex >= 0 && index === firstPostIndex - 1;
        const nextGap = scrollGapAfterItem({
          item,
          gap,
          lastGap,
          isBeforeLastItem: index === groups.length - 2,
          isBeforePostroll: nextIsFirstPost,
        });
        stackTop += item.height + (index < groups.length - 1 ? nextGap : 0);
        return item;
      });
    }

    function scrollGapAfterItem({ item, gap, lastGap, isBeforeLastItem, isBeforePostroll }) {
      let nextGap = isBeforeLastItem ? Math.max(gap, lastGap) : gap;
      if (isBeforePostroll) {
        nextGap = Math.max(nextGap, scrollClipRect(item.layout).height);
      }
      return nextGap;
    }

    function buildScrollItem(group, layout, stackTop) {
      const cartela = group.cartela;
      const effectiveLayout = layoutForCartela(layout, cartela);
      const x = Math.max(0, Number(effectiveLayout.page_left_margin) || 0);
      const width = Math.max(0, effectiveLayout.page_width - x - (Number(effectiveLayout.page_right_margin) || 0));
      const blocks = scrollBlocksForPages(group.pages);
      const textBlocks = blocks.filter(scrollBlockHasVisibleText);
      const title = String(cartela && cartela.title || '').trim();
      const titleMetrics = title ? canvasTextMetrics('page_header', cartela, effectiveLayout, cartela.title_typography) : null;
      const titleHeight = titleMetrics ? canvasTextHeight(title, titleMetrics, width) : 0;
      const blockGap = cartelaBlockGap(cartela, effectiveLayout);
      const blockHeights = textBlocks.map((block) => measureCanvasBlock(null, block, cartela, effectiveLayout, width));
      const contentHeight = titleHeight + (titleHeight && textBlocks.length ? blockGap : 0) + blockHeights.reduce((sum, value) => sum + value, 0) + Math.max(0, textBlocks.length - 1) * blockGap;
      const areaHeight = effectiveLayout.page_height - effectiveLayout.page_top_margin - effectiveLayout.page_bottom_margin;
      const imageOnlyCartela = !!(cartelaHasImages(cartela) && !textBlocks.length);
      const fullAreaCartela = !!(cartela && !textBlocks.length && (cartela.manual || imageOnlyCartela));
      const minHeight = fullAreaCartela ? areaHeight : 1;
      const positioningHeight = fullAreaCartela ? areaHeight : contentHeight;
      const normalTop = effectiveLayout.page_top_margin + verticalOffset(areaHeight, positioningHeight, pdfPageVerticalJustify(group.pages[0])) + (Number(cartela.vertical_offset) || 0);
      return {
        cartela,
        layout: effectiveLayout,
        pages: group.pages,
        title,
        titleMetrics,
        blocks: textBlocks,
        blockHeights,
        blockGap,
        contentHeight,
        height: Math.max(minHeight, contentHeight),
        stackTop,
        normalTop,
        fullAreaCartela,
      };
    }

    function scrollBlocksForPages(pages) {
      const seen = new Map();
      return (pages || []).flatMap((page) => (page.blocks || [])
        .filter((block) => !block.missing_source)
        .map((block) => {
          const key = block.id || block.title || 'block';
          const index = seen.get(key) || 0;
          seen.set(key, index + 1);
          return blockForTitleRepeat(block, false, index);
        }));
    }

    function scrollBlockHasVisibleText(block) {
      if (!block || block.missing_source) return false;
      if (String(block.title || '').trim()) return true;
      const units = getRenderedBlockUnits(block);
      return units.some(scrollUnitHasVisibleText);
    }

    function scrollUnitHasVisibleText(unit) {
      if (!unit) return false;
      if (Array.isArray(unit.lines)) return unit.lines.some((line) => String(line && line.value || '').trim());
      return ['role', 'name', 'actor', 'character', 'value', 'title']
        .some((key) => String(unit[key] || '').trim());
    }

    return {
      buildScrollItem,
      buildScrollItems,
      buildScrollPlan,
      buildIntegerScrollPhase,
      formatScrollSpeed,
      scrollClipRect,
      scrollBlocksForPages,
      scrollBlockHasVisibleText,
      scrollFullAreaItemClip,
      scrollGapAfterItem,
      scrollItemEnterOffset,
      scrollItemExitOffset,
      scrollItemIntersectsClip,
      scrollItemNormalOffset,
      scrollOffsetForFrame,
      scrollOffsetForPhaseFrame,
      scrollUnitHasVisibleText,
    };
  }

  root.CreditosDomainScroll = {
    createScrollDomain,
  };
})(globalThis);
