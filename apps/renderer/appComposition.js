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

  function createPreviewComposition(dependencies = {}) {
    const documentRef = dependencies.documentRef || root.document;
    const domPreview = root.CreditosPreviewDom.createDomPreview({
      applyTypography: dependencies.applyTypography,
      cartelaBlockGap: dependencies.cartelaBlockGap,
      cartelaBlockTitleGap: dependencies.cartelaBlockTitleGap,
      cartelaImages: dependencies.cartelaImages,
      contentAreaRect: dependencies.contentAreaRect,
      creditSourceId: dependencies.creditSourceId,
      documentRef,
      layoutForCartela: dependencies.layoutForCartela,
      normalizeBoolean: dependencies.normalizeBoolean,
      normalizeSettings: dependencies.normalizeSettings,
      pdfPageVerticalJustify: dependencies.pdfPageVerticalJustify,
      roleNameGapForOrientation: dependencies.roleNameGapForOrientation,
      transformCartelaText: dependencies.transformCartelaText,
      unitGapBefore: dependencies.unitGapBefore,
      unitRenderOptions: dependencies.unitRenderOptions,
    });
    const canvasPreview = root.CreditosPreviewCanvas.createCanvasPreview({
      applyTextCapitalization: dependencies.applyTextCapitalization,
      cartelaBlockGap: dependencies.cartelaBlockGap,
      cartelaBlockTitleGap: dependencies.cartelaBlockTitleGap,
      cartelaImages: dependencies.cartelaImages,
      contentAreaRect: dependencies.contentAreaRect,
      creditSourceId: dependencies.creditSourceId,
      documentRef,
      explicitTextLines: dependencies.explicitTextLines,
      fontStyleFromStyle: dependencies.fontStyleFromStyle,
      fontWeightFromStyle: dependencies.fontWeightFromStyle,
      getProductionSettings: dependencies.getProductionSettings,
      layoutForCartela: dependencies.layoutForCartela,
      normalizeBoolean: dependencies.normalizeBoolean,
      normalizeLanguage: dependencies.normalizeLanguage,
      normalizeTextCapitalization: dependencies.normalizeTextCapitalization,
      pdfPageVerticalJustify: dependencies.pdfPageVerticalJustify,
      quoteFontFamily: dependencies.quoteFontFamily,
      roleNameGapForOrientation: dependencies.roleNameGapForOrientation,
      scrollClipRect: dependencies.scrollClipRect,
      scrollFullAreaItemClip: dependencies.scrollFullAreaItemClip,
      scrollItemIntersectsClip: dependencies.scrollItemIntersectsClip,
      scrollOffsetForFrame: dependencies.scrollOffsetForFrame,
      unitGapBefore: dependencies.unitGapBefore,
      unitRenderOptions: dependencies.unitRenderOptions,
      verticalOffset: dependencies.verticalOffset,
    });
    const referenceVideoPreview = root.CreditosPreviewReferenceVideo.createReferenceVideoPreview({
      documentRef,
      getCurrentFrame: dependencies.getCurrentFrame,
      getReferenceVideo: dependencies.getReferenceVideo,
      getReferenceVideoCanvasElement: dependencies.getReferenceVideoCanvasElement,
      getReferenceVideoCanvasSrc: dependencies.getReferenceVideoCanvasSrc,
      getReferenceVideoElement: dependencies.getReferenceVideoElement,
      getReferenceVideoSrc: dependencies.getReferenceVideoSrc,
      isPlaying: dependencies.isPlaying,
      normalizeReferenceVideo: dependencies.normalizeReferenceVideo,
      setReferenceVideoCanvasElement: dependencies.setReferenceVideoCanvasElement,
      setReferenceVideoCanvasSrc: dependencies.setReferenceVideoCanvasSrc,
      setReferenceVideoDuration: dependencies.setReferenceVideoDuration,
      setReferenceVideoElement: dependencies.setReferenceVideoElement,
      setReferenceVideoSrc: dependencies.setReferenceVideoSrc,
    });

    return {
      applyTextWrapStyle: domPreview.applyTextWrapStyle,
      canvasTextHeight: canvasPreview.canvasTextHeight,
      canvasTextMetrics: canvasPreview.canvasTextMetrics,
      canvasWrappedTextLines: canvasPreview.canvasWrappedTextLines,
      drawCanvasMarginOverlay: canvasPreview.drawCanvasMarginOverlay,
      drawCanvasPage: canvasPreview.drawCanvasPage,
      drawCanvasScrollFrame: canvasPreview.drawCanvasScrollFrame,
      drawReferenceVideoFrame: referenceVideoPreview.drawReferenceVideoFrame,
      makeMarginOverlay: domPreview.makeMarginOverlay,
      makePdfSheetElement: domPreview.makePdfSheetElement,
      makeReferenceVideoElement: referenceVideoPreview.makeReferenceVideoElement,
      measureCanvasBlock: canvasPreview.measureCanvasBlock,
      referenceVideoForCanvas: referenceVideoPreview.referenceVideoForCanvas,
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
      ...createPreviewComposition(options.previewDependencies || {}),
      fieldControlRegistry: createFieldControlRegistry({
        documentRef: options.documentRef,
      }),
    };
  }

  root.CreditosAppComposition = {
    createAppComposition,
  };
})(globalThis);
