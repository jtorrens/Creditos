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

    function normalizeDurationInputValue(value, fps) {
      const frames = parseFrameDuration(value, fps);
      if (frames === null) return null;
      return {
        frames,
        value: formatFrameDuration(frames, fps),
      };
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

    function movieBodySourceFrames(sourceFrames, segments = {}) {
      const safeSegments = normalizeMovieSegments(segments);
      return (sourceFrames || []).slice(
        safeSegments.preCount,
        Math.max(safeSegments.preCount, (sourceFrames || []).length - safeSegments.postCount)
      );
    }

    function movieBodySourceTotal(sourceFrames, segments = {}) {
      return movieBodySourceFrames(sourceFrames, segments)
        .reduce((sum, value) => sum + Math.max(1, Number(value) || 1), 0);
    }

    function getMovieBodyTargetFramesOrSource(sourceFrames, segments = {}, targetFrames = null, useTargetFrames = false) {
      const bodyFrames = movieBodySourceFrames(sourceFrames, segments);
      const bodySourceTotal = bodyFrames.reduce((sum, value) => sum + Math.max(1, Number(value) || 1), 0);
      if (!useTargetFrames) return bodySourceTotal;
      return targetFrames === null ? bodySourceTotal : Math.max(bodyFrames.length || 1, targetFrames);
    }

    function getMovieTargetFramesOrSource(sourceFrames, segments = {}, targetFrames = null, useTargetFrames = false) {
      const safeSegments = normalizeMovieSegments(segments);
      return safeSegments.preFrames
        + getMovieBodyTargetFramesOrSource(sourceFrames, safeSegments, targetFrames, useTargetFrames)
        + safeSegments.postFrames;
    }

    function getMovieExportFrameCounts(selectedPages, groups, sourceFrames, segments = {}, targetFrames = null, useTargetFrames = false, fps = 25) {
      const safeSegments = normalizeMovieSegments(segments);
      const preFrames = distributeFrames(safeSegments.preFrames, safeSegments.preCount);
      const postFrames = distributeFrames(safeSegments.postFrames, safeSegments.postCount);
      const bodySourceFrames = movieBodySourceFrames(sourceFrames, safeSegments);
      const bodyFrames = useTargetFrames
        ? fitPageFrameCountsToTarget(bodySourceFrames, targetFrames)
        : bodySourceFrames;
      const groupFrames = [
        ...preFrames,
        ...bodyFrames,
        ...postFrames,
      ];
      const pageFrames = [];
      (groups || []).forEach((group, index) => {
        const total = groupFrames[index] || 1;
        const sourcePageFrames = (group.pages || []).map((item) => getPageFrameCount(item.page, fps));
        const fitted = fitPageFrameCountsToTarget(sourcePageFrames, total);
        (group.pages || []).forEach((item, pageIndex) => {
          if (item && item.page) pageFrames.push({ id: item.page.id, frames: fitted[pageIndex] || 1 });
        });
      });
      const byId = new Map(pageFrames.map((item) => [item.id, item.frames]));
      return (selectedPages || []).map((item) => byId.get(item.page.id) || getPageFrameCount(item.page, fps));
    }

    function exportPageSelection(pages, fromValue, toValue) {
      const selectedPages = pages || [];
      const total = selectedPages.length;
      const start = Math.max(1, Math.min(total, Number(fromValue) || 1));
      const end = Math.max(start, Math.min(total, Number(toValue) || total));
      return {
        start,
        end,
        pages: selectedPages.slice(start - 1, end),
      };
    }

    function normalizeMovieSegmentSettings(groupCount, segmentInputs = {}) {
      const count = Math.max(0, Math.round(Number(groupCount) || 0));
      const preCount = Math.max(0, Math.min(count, Math.round(Number(segmentInputs.preCount) || 0)));
      const maxPost = Math.max(0, count - preCount);
      const postCount = Math.max(0, Math.min(maxPost, Math.round(Number(segmentInputs.postCount) || 0)));
      const preFrames = Math.max(0, Math.round(Number(segmentInputs.preFrames) || 0));
      const postFrames = Math.max(0, Math.round(Number(segmentInputs.postFrames) || 0));
      return {
        preCount,
        postCount,
        preFrames: preCount ? Math.max(preCount, preFrames) : 0,
        postFrames: postCount ? Math.max(postCount, postFrames) : 0,
      };
    }

    function movieDurationFrameSummary(sourceFrames, segments = {}) {
      const safeSegments = normalizeMovieSegments(segments);
      const bodyFrames = movieBodySourceTotal(sourceFrames, safeSegments);
      return {
        bodyFrames,
        totalFrames: bodyFrames + safeSegments.preFrames + safeSegments.postFrames,
      };
    }

    function fitMovieTargetFrames(targetFrames, groupCount, segments = {}) {
      const safeSegments = normalizeMovieSegments(segments);
      const itemCount = Math.max(
        1,
        Math.max(0, Math.round(Number(groupCount) || 0)) - safeSegments.preCount - safeSegments.postCount
      );
      return Math.max(itemCount, Math.round(Number(targetFrames) || 0));
    }

    function normalizeMovieSegments(segments = {}) {
      return {
        preCount: Math.max(0, Math.round(Number(segments.preCount) || 0)),
        postCount: Math.max(0, Math.round(Number(segments.postCount) || 0)),
        preFrames: Math.max(0, Math.round(Number(segments.preFrames) || 0)),
        postFrames: Math.max(0, Math.round(Number(segments.postFrames) || 0)),
      };
    }

    function moviePageItems(pages, startPage = 1) {
      const start = Math.max(1, Math.round(Number(startPage) || 1));
      return (pages || []).map((page, index) => ({
        page,
        pageNumber: start + index,
      })).filter((candidate) => candidate.page);
    }

    function groupMoviePageItemsByCartela(items) {
      const groups = [];
      (items || []).forEach((item) => {
        const cartelaId = item.page && item.page.cartela ? item.page.cartela.id : '';
        if (!cartelaId) return;
        let group = groups[groups.length - 1];
        if (!group || !group.cartela || group.cartela.id !== cartelaId) {
          group = { cartela: item.page.cartela, pages: [] };
          groups.push(group);
        }
        group.pages.push(item);
      });
      return groups;
    }

    function groupPhysicalPagesByCartela(pages) {
      const groups = [];
      (pages || []).forEach((page) => {
        const cartelaId = page && page.cartela ? page.cartela.id : '';
        if (!cartelaId) return;
        let group = groups[groups.length - 1];
        if (!group || !group.cartela || group.cartela.id !== cartelaId) {
          group = { cartela: page.cartela, pages: [] };
          groups.push(group);
        }
        group.pages.push(page);
      });
      return groups;
    }

    function moviePageFrameCounts(items, fps) {
      return (items || []).map((item) => getPageFrameCount(item.page, fps));
    }

    function movieGroupFrameCounts(groups, fps) {
      return (groups || []).map((group) => (
        Math.max(1, (group.pages || []).reduce((sum, item) => sum + getPageFrameCount(item.page, fps), 0))
      ));
    }

    function scrollSourceFrameCounts(groups, fps) {
      return (groups || []).map((group) => {
        const duration = Math.max(0, Number(group.cartela && group.cartela.duration) || 0);
        return Math.max(1, Math.round(duration * fps) * Math.max(1, (group.pages || []).length));
      });
    }

    return {
      distributeFrames,
      exportPageSelection,
      fitPageFrameCountsToTarget,
      fitMovieTargetFrames,
      formatFrameDuration,
      formatSecondsAsFrameDuration,
      getMovieBodyTargetFramesOrSource,
      getMovieExportFrameCounts,
      getMovieTargetFramesOrSource,
      getPageFrameCount,
      groupMoviePageItemsByCartela,
      groupPhysicalPagesByCartela,
      movieGroupFrameCounts,
      moviePageFrameCounts,
      moviePageItems,
      movieBodySourceFrames,
      movieBodySourceTotal,
      movieDurationFrameSummary,
      normalizeMovieSegmentSettings,
      normalizeMovieSegments,
      normalizeDurationInputValue,
      parseFrameDuration,
      scrollSourceFrameCounts,
    };
  }

  root.CreditosDomainTimecode = {
    createTimecodeDomain,
  };
})(globalThis);
