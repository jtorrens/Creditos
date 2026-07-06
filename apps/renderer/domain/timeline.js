(function (root) {
  function createTimelineDomain(dependencies = {}) {
    const {
      scrollOffsetForFrame,
    } = dependencies;

    function pageForAnimationFrame(plan, frame) {
      let remaining = Math.max(0, Math.round(Number(frame) || 0));
      for (let index = 0; index < plan.selectedPages.length; index += 1) {
        const frameCount = Math.max(1, Number(plan.frameCounts[index]) || 1);
        if (remaining < frameCount) return plan.selectedPages[index].page;
        remaining -= frameCount;
      }
      return plan.selectedPages.length ? plan.selectedPages[plan.selectedPages.length - 1].page : null;
    }

    function pageIndexForAnimationFrame(plan, frame, pages = []) {
      if (!plan) return null;
      if (plan.mode === 'pages') {
        let remaining = Math.max(0, Math.round(Number(frame) || 0));
        for (let index = 0; index < plan.selectedPages.length; index += 1) {
          const frameCount = Math.max(1, Number(plan.frameCounts[index]) || 1);
          if (remaining < frameCount) return pageIndexById(pages, plan.selectedPages[index].page && plan.selectedPages[index].page.id);
          remaining -= frameCount;
        }
        const last = plan.selectedPages[plan.selectedPages.length - 1];
        return pageIndexById(pages, last && last.page && last.page.id);
      }
      return dominantScrollPageIndex(plan, frame, pages);
    }

    function pageIndexById(pages, pageId) {
      if (!pageId) return null;
      const index = (pages || []).findIndex((page) => page.id === pageId);
      return index >= 0 ? index : null;
    }

    function frameForPdfPageIndex(plan, pageIndex, pages = []) {
      if (!plan) return 0;
      const page = (pages || [])[Math.max(0, Math.min((pages || []).length - 1, pageIndex))];
      if (!page) return 0;
      if (plan.mode === 'pages') {
        let frame = 0;
        for (let index = 0; index < plan.selectedPages.length; index += 1) {
          if (plan.selectedPages[index].page && plan.selectedPages[index].page.id === page.id) return frame;
          frame += Math.max(1, Number(plan.frameCounts[index]) || 1);
        }
        return Math.max(0, Math.min(plan.totalFrames - 1, frame));
      }
      return frameForScrollPage(plan, page);
    }

    function dominantScrollPageIndex(plan, frame, pages = []) {
      const page = dominantScrollPage(plan, frame);
      return page ? pageIndexById(pages, page.id) : null;
    }

    function dominantScrollPage(plan, frame) {
      if (!plan || plan.mode !== 'scroll') return null;
      const offset = scrollOffsetForFrame(plan.scrollPlan, frame);
      const viewportCenter = (plan.layout.page_top_margin + (plan.layout.page_height - plan.layout.page_bottom_margin)) / 2;
      let best = null;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (const item of plan.scrollPlan.items) {
        const itemY = Math.round(item.stackTop - offset);
        for (const page of item.pages || []) {
          const center = itemY + scrollPageLocalCenter(item, page);
          const distance = Math.abs(center - viewportCenter);
          if (distance < bestDistance) {
            bestDistance = distance;
            best = page;
          }
        }
      }
      return best;
    }

    function frameForScrollPage(plan, page) {
      if (!plan || plan.mode !== 'scroll' || !page) return 0;
      const item = (plan.scrollPlan.items || []).find((candidate) => (candidate.pages || []).some((itemPage) => itemPage.id === page.id));
      if (!item) return 0;
      const viewportCenter = (plan.layout.page_top_margin + (plan.layout.page_height - plan.layout.page_bottom_margin)) / 2;
      const localCenter = scrollPageLocalCenter(item, page);
      const targetOffset = item.stackTop + localCenter - viewportCenter;
      return frameForScrollOffset(plan.scrollPlan, targetOffset);
    }

    function frameForScrollOffset(plan, targetOffset) {
      if (!plan) return 0;
      const totalFrames = Math.max(1, Number(plan.totalFrames) || 1);
      const offset = Math.max(0, Number(targetOffset) || 0);
      const phases = (plan.phases || []).filter((phase) => Math.max(0, Number(phase.frames) || 0) > 0);
      if (!phases.length) return 0;
      for (const phase of phases) {
        const start = Math.max(0, Number(phase.startOffset) || 0);
        const end = Math.max(0, Number(phase.endOffset) || 0);
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        if (offset < min || offset > max) continue;
        const frames = Math.max(1, Math.round(Number(phase.frames) || 1));
        if (frames <= 1 || start === end) return Math.max(0, Math.min(totalFrames - 1, Math.round(Number(phase.startFrame) || 0)));
        const localFrame = Math.round((Math.max(0, offset - start) * (frames - 1)) / Math.max(1, end - start));
        return Math.max(0, Math.min(totalFrames - 1, Math.round(Number(phase.startFrame) || 0) + localFrame));
      }
      const first = phases[0];
      const last = phases[phases.length - 1];
      if (offset <= Math.min(first.startOffset, first.endOffset)) return Math.max(0, Math.round(Number(first.startFrame) || 0));
      return totalFrames - 1;
    }

    function scrollPageLocalCenter(item, page) {
      const pages = item.pages || [];
      const index = Math.max(0, pages.findIndex((candidate) => candidate.id === page.id));
      if (pages.length <= 1) return Math.max(1, Number(item.height) || 1) / 2;
      const height = Math.max(1, Number(item.height) || 1);
      const segment = height / pages.length;
      return (index * segment) + (segment / 2);
    }

    function videoTimeForPage(plan, page, pages = []) {
      if (!plan || !page) return null;
      const pageIndex = pageIndexById(pages, page.id);
      const frame = frameForPdfPageIndex(plan, pageIndex, pages);
      const videoStartFrame = Math.max(0, Number(plan.videoStartFrame) || 0);
      if (frame < videoStartFrame) return null;
      return (frame - videoStartFrame) / Math.max(1, Number(plan.fps) || 25);
    }

    return {
      dominantScrollPage,
      dominantScrollPageIndex,
      frameForPdfPageIndex,
      frameForScrollOffset,
      frameForScrollPage,
      pageForAnimationFrame,
      pageIndexById,
      pageIndexForAnimationFrame,
      scrollPageLocalCenter,
      videoTimeForPage,
    };
  }

  root.CreditosDomainTimeline = {
    createTimelineDomain,
  };
})(globalThis);
