(function (root) {
  function createTimecodeDomain() {
    function getPageFrameCount(page, fps) {
      const duration = Math.max(0, Number(page && page.cartela && page.cartela.duration) || 0);
      return Math.max(1, Math.round(duration * fps));
    }

    function formatFrameDuration(totalFrames, fps) {
      const safeFps = Math.max(1, Math.round(Number(fps) || 25));
      const frames = Math.max(0, Math.round(Number(totalFrames) || 0));
      const minutes = Math.floor(frames / (safeFps * 60));
      const seconds = Math.floor((frames % (safeFps * 60)) / safeFps);
      const frame = frames % safeFps;
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(frame).padStart(2, '0')}`;
    }

    function formatSecondsAsFrameDuration(secondsValue, fps) {
      const safeFps = Math.max(1, Math.round(Number(fps) || 25));
      return formatFrameDuration(Math.round(Math.max(0, Number(secondsValue) || 0) * safeFps), safeFps);
    }

    function parseFrameDuration(value, fps) {
      const safeFps = Math.max(1, Math.round(Number(fps) || 25));
      const raw = String(value || '').trim();
      if (!raw) return null;
      let minutes = 0;
      let seconds = 0;
      let frames = 0;
      if (raw.includes(':')) {
        const parts = raw.split(':');
        if (parts.length > 3 || parts.some((part) => !/^\d+$/.test(part))) return null;
        const padded = ['0', '0', '0'].slice(parts.length).concat(parts);
        minutes = Number(padded[0]);
        seconds = Number(padded[1]);
        frames = Number(padded[2]);
      } else {
        if (!/^\d+$/.test(raw)) return null;
        const ff = raw.slice(-2);
        const ss = raw.slice(-4, -2);
        const mm = raw.slice(0, -4);
        minutes = Number(mm || 0);
        seconds = Number(ss || 0);
        frames = Number(ff || 0);
      }
      if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || !Number.isFinite(frames)) return null;
      return (minutes * 60 * safeFps) + (seconds * safeFps) + frames;
    }

    function distributeFrames(totalFrames, itemCount) {
      const count = Math.max(0, Math.round(Number(itemCount) || 0));
      if (!count) return [];
      const safeTotal = Math.max(count, Math.round(Number(totalFrames) || count));
      const base = Math.floor(safeTotal / count);
      const frames = Array.from({ length: count }, () => Math.max(1, base));
      frames[count - 1] += safeTotal - frames.reduce((sum, value) => sum + value, 0);
      return frames;
    }

    function fitPageFrameCountsToTarget(sourceFrames, targetFrames) {
      if (!sourceFrames.length) return [];
      const minimumTotal = sourceFrames.length;
      const safeTarget = Math.max(minimumTotal, Math.round(Number(targetFrames) || minimumTotal));
      const sourceTotal = sourceFrames.reduce((sum, value) => sum + Math.max(1, Number(value) || 1), 0);
      const scale = safeTarget / Math.max(1, sourceTotal);
      const frames = sourceFrames.map((value) => Math.max(1, Math.round(Math.max(1, Number(value) || 1) * scale)));
      const lastIndex = frames.length - 1;
      frames[lastIndex] += safeTarget - frames.reduce((sum, value) => sum + value, 0);
      if (frames[lastIndex] < 1) {
        let deficit = 1 - frames[lastIndex];
        frames[lastIndex] = 1;
        for (let index = frames.length - 2; index >= 0 && deficit > 0; index -= 1) {
          const reducible = Math.max(0, frames[index] - 1);
          const reduction = Math.min(deficit, reducible);
          frames[index] -= reduction;
          deficit -= reduction;
        }
      }
      frames[lastIndex] += safeTarget - frames.reduce((sum, value) => sum + value, 0);
      return frames.map((value) => Math.max(1, Math.round(value)));
    }

    return {
      distributeFrames,
      fitPageFrameCountsToTarget,
      formatFrameDuration,
      formatSecondsAsFrameDuration,
      getPageFrameCount,
      parseFrameDuration,
    };
  }

  root.CreditosDomainTimecode = {
    createTimecodeDomain,
  };
})(globalThis);
