(function (root) {
  function createMovPlanExport(dependencies = {}) {
    const {
      buildScrollPlan,
      getMovieBodyTargetFramesOrSource,
      getMovieExportFrameCounts,
    } = dependencies;

    function buildScrollMoviePlan({
      fps = 25,
      groups = [],
      layout,
      segments = {},
      sourceFrames = [],
      targetFrames = null,
      useTargetFrames = false,
    }) {
      const bodyFrames = getMovieBodyTargetFramesOrSource(
        sourceFrames,
        segments,
        targetFrames,
        useTargetFrames
      );
      const scrollPlan = buildScrollPlan(groups, layout, bodyFrames, segments);
      const bodyPhase = scrollPlan.phases.find((phase) => phase.name === 'body');
      return {
        mode: 'scroll',
        layout,
        fps,
        videoStartFrame: bodyPhase ? bodyPhase.startFrame : Math.max(0, Number(segments.preFrames) || 0),
        totalFrames: Math.max(1, scrollPlan.totalFrames),
        scrollPlan,
      };
    }

    function buildPageMoviePlan({
      fps = 25,
      groups = [],
      layout,
      segments = {},
      selectedPages = [],
      sourceFrames = [],
      targetFrames = null,
      useTargetFrames = false,
    }) {
      const frameCounts = getMovieExportFrameCounts(
        selectedPages,
        groups,
        sourceFrames,
        segments,
        targetFrames,
        useTargetFrames,
        fps
      );
      return {
        mode: 'pages',
        layout,
        fps,
        videoStartFrame: Math.max(0, Number(segments.preFrames) || 0),
        selectedPages,
        frameCounts,
        totalFrames: frameCounts.reduce((sum, value) => sum + Math.max(1, Number(value) || 1), 0),
      };
    }

    return {
      buildPageMoviePlan,
      buildScrollMoviePlan,
    };
  }

  root.CreditosExportMovPlan = {
    createMovPlanExport,
  };
})(globalThis);
