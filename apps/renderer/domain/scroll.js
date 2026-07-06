(function (root) {
  function createScrollDomain(dependencies = {}) {
    const { contentAreaRect } = dependencies;

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

    return {
      buildIntegerScrollPhase,
      formatScrollSpeed,
      scrollClipRect,
      scrollFullAreaItemClip,
      scrollItemEnterOffset,
      scrollItemExitOffset,
      scrollItemIntersectsClip,
      scrollItemNormalOffset,
      scrollOffsetForFrame,
      scrollOffsetForPhaseFrame,
    };
  }

  root.CreditosDomainScroll = {
    createScrollDomain,
  };
})(globalThis);
