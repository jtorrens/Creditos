(function (root) {
  function createExportComposition(dependencies = {}) {
    const frameSequenceExport = root.CreditosExportFrameSequence.createFrameSequenceExport({
      onCancelAvailable: dependencies.onCancelAvailable,
      onEncoding: dependencies.onEncoding,
      throwIfCancelled: dependencies.throwIfCancelled,
      wait: dependencies.wait,
    });
    const movPlanExport = root.CreditosExportMovPlan.createMovPlanExport({
      buildScrollPlan: dependencies.buildScrollPlan,
      getMovieBodyTargetFramesOrSource: dependencies.getMovieBodyTargetFramesOrSource,
      getMovieExportFrameCounts: dependencies.getMovieExportFrameCounts,
    });

    return {
      buildPageMoviePlan: movPlanExport.buildPageMoviePlan,
      buildScrollMoviePlan: movPlanExport.buildScrollMoviePlan,
      exportMovFramesIncrementally: frameSequenceExport.exportMovFramesIncrementally,
      writeAnimatedFrames: frameSequenceExport.writeAnimatedFrames,
      writeRepeatedFrames: frameSequenceExport.writeRepeatedFrames,
    };
  }

  function createFieldControlRegistry(options = {}) {
    const documentRef = options.documentRef || root.document;
    const registry = root.CreditosFieldControlRegistry.createFieldControlRegistry();
    registry.register('text', root.CreditosTextFieldControl.createTextFieldControl({
      documentRef,
    }));
    registry.register('number', root.CreditosNumberFieldControl.createNumberFieldControl({
      documentRef,
    }));
    registry.register('color', root.CreditosColorFieldControl.createColorFieldControl({
      documentRef,
    }));
    registry.register('duration', root.CreditosDurationFieldControl.createDurationFieldControl({
      documentRef,
    }));
    registry.register('select', root.CreditosSelectFieldControl.createSelectFieldControl({
      documentRef,
    }));
    registry.register('checkbox', root.CreditosCheckboxFieldControl.createCheckboxFieldControl({
      documentRef,
    }));
    registry.register('typography', root.CreditosTypographyFieldControl.createTypographyFieldControl({
      documentRef,
    }));
    return registry;
  }

  function createAppComposition(options = {}) {
    return {
      ...createExportComposition(options.exportDependencies || {}),
      fieldControlRegistry: createFieldControlRegistry({
        documentRef: options.documentRef,
      }),
    };
  }

  root.CreditosAppComposition = {
    createAppComposition,
  };
})(globalThis);
