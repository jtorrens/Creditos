(function (root) {
  function createCoreDomainComposition(options = {}) {
    const commonDomain = root.CreditosDomainCommon.createCommonDomain();
    const typographyDomain = root.CreditosDomainTypography.createTypographyDomain();
    const styleAnimationDomain = root.CreditosDomainStyleAnimation.createStyleAnimationDomain({
      normalizeBoolean: commonDomain.normalizeBoolean,
    });
    const settingsDomain = root.CreditosDomainSettings.createSettingsDomain({
      languageLocales: options.languageLocales,
      languageOptions: options.languageOptions,
      normalizeBoolean: commonDomain.normalizeBoolean,
      normalizeColor: commonDomain.normalizeColor,
      safeFilePart: commonDomain.safeFilePart,
      textCapitalizationOptions: options.textCapitalizationOptions,
      titleMinorWords: options.titleMinorWords,
      typographyFields: options.typographyFields,
    });
    const projectsDomain = root.CreditosDomainProjects.createProjectsDomain({
      normalizeColor: commonDomain.normalizeColor,
      normalizeSettings: settingsDomain.normalizeSettings,
    });
    const previewSettingsDomain = root.CreditosDomainPreviewSettings.createPreviewSettingsDomain({
      movEncodingProfiles: options.movEncodingProfiles,
    });
    const overridesDomain = root.CreditosDomainOverrides.createOverridesDomain({
      normalizeEditableValue: commonDomain.normalizeEditableValue,
    });
    const timecodeDomain = root.CreditosDomainTimecode.createTimecodeDomain();
    const paginationUnitsDomain = root.CreditosDomainPaginationUnits.createPaginationUnitsDomain();
    const sourceDomain = root.CreditosDomainSource.createSourceDomain({
      safeFilePart: commonDomain.safeFilePart,
    });
    const materialsDomain = root.CreditosDomainMaterials.createMaterialsDomain({
      normalizeText: commonDomain.normalizeText,
      safeFilePart: commonDomain.safeFilePart,
    });
    const renderUnitsDomain = root.CreditosDomainRenderUnits.createRenderUnitsDomain({
      normalizeText: commonDomain.normalizeText,
      resolveOverride: overridesDomain.resolveOverride,
    });
    const layoutDomain = root.CreditosDomainLayout.createLayoutDomain();

    return {
      applyProductionFields: projectsDomain.applyProductionFields,
      applyProtectedCapitalizations: settingsDomain.applyProtectedCapitalizations,
      applyTextCapitalization: settingsDomain.applyTextCapitalization,
      animatableStyleProperties: styleAnimationDomain.animatableProperties,
      blockForTitleRepeat: paginationUnitsDomain.blockForTitleRepeat,
      boolSelectValue: commonDomain.boolSelectValue,
      buildFontCatalog: typographyDomain.buildFontCatalog,
      cartelaBlockGap: layoutDomain.cartelaBlockGap,
      cartelaBlockTitleGap: layoutDomain.cartelaBlockTitleGap,
      clamp: commonDomain.clamp,
      contentAreaRect: layoutDomain.contentAreaRect,
      countTitleLine: paginationUnitsDomain.countTitleLine,
      createMaterialsFromSource: materialsDomain.createMaterialsFromSource,
      creditSourceId: paginationUnitsDomain.creditSourceId,
      currentXlsxName: sourceDomain.currentXlsxName,
      defaultImportModelIdInDomain: sourceDomain.defaultImportModelId,
      defaultLayoutForMaterial: materialsDomain.defaultLayoutForMaterial,
      defaultOrientationForMaterial: materialsDomain.defaultOrientationForMaterial,
      defaultPreviewSettings: previewSettingsDomain.defaultPreviewSettings,
      defaultSettings: settingsDomain.defaultSettings,
      directoryFromPath: commonDomain.directoryFromPath,
      encodingProfilesForCodec: previewSettingsDomain.encodingProfilesForCodec,
      escapeHtml: commonDomain.escapeHtml,
      explicitTextLines: paginationUnitsDomain.explicitTextLines,
      exportPageSelection: timecodeDomain.exportPageSelection,
      fallbackFontCatalog: typographyDomain.fallbackFontCatalog,
      findSelectedProduction: projectsDomain.findSelectedProduction,
      fitMovieTargetFrames: timecodeDomain.fitMovieTargetFrames,
      fitPreviewZoom: layoutDomain.fitPreviewZoom,
      fontStyleFromStyle: typographyDomain.fontStyleFromStyle,
      fontStylesForFamily: typographyDomain.fontStylesForFamily,
      fontWeightFromStyle: typographyDomain.fontWeightFromStyle,
      forceRenderedRoleNameColumns: renderUnitsDomain.forceRenderedRoleNameColumns,
      formatFrameDuration: timecodeDomain.formatFrameDuration,
      formatSecondsAsFrameDuration: timecodeDomain.formatSecondsAsFrameDuration,
      getExportRenderOptionsInDomain: previewSettingsDomain.getExportRenderOptions,
      getMaterialContentItems: renderUnitsDomain.getMaterialContentItems,
      getMovieBodyTargetFramesOrSource: timecodeDomain.getMovieBodyTargetFramesOrSource,
      getMovieExportFrameCounts: timecodeDomain.getMovieExportFrameCounts,
      getMovieFps: timecodeDomain.getMovieFps,
      getPageFrameCount: timecodeDomain.getPageFrameCount,
      getRenderedBlockUnits: renderUnitsDomain.getRenderedBlockUnits,
      groupMoviePageItemsByCartela: timecodeDomain.groupMoviePageItemsByCartela,
      groupMusicLicenseThemes: renderUnitsDomain.groupMusicLicenseThemes,
      groupPhysicalPagesByCartela: timecodeDomain.groupPhysicalPagesByCartela,
      importModelOptions: sourceDomain.importModelOptions,
      joinPath: commonDomain.joinPath,
      labelForImportModel: sourceDomain.labelForImportModel,
      layoutForCartela: layoutDomain.layoutForCartela,
      localeForLanguage: settingsDomain.localeForLanguage,
      movieBodySourceTotal: timecodeDomain.movieBodySourceTotal,
      movieDurationFrameSummary: timecodeDomain.movieDurationFrameSummary,
      movieGroupFrameCounts: timecodeDomain.movieGroupFrameCounts,
      moviePageItems: timecodeDomain.moviePageItems,
      mergeStyleAnimation: styleAnimationDomain.mergeStyleAnimation,
      normalizeBoolean: commonDomain.normalizeBoolean,
      normalizeColor: commonDomain.normalizeColor,
      normalizeDurationInputValueInDomain: timecodeDomain.normalizeDurationInputValue,
      normalizeEditableValue: commonDomain.normalizeEditableValue,
      normalizeLanguage: settingsDomain.normalizeLanguage,
      normalizeMovieSegmentSettings: timecodeDomain.normalizeMovieSegmentSettings,
      normalizePreviewSettings: previewSettingsDomain.normalizePreviewSettings,
      normalizeProtectedCapitalizationTerms: settingsDomain.normalizeProtectedCapitalizationTerms,
      normalizeProtectedCapitalizationText: settingsDomain.normalizeProtectedCapitalizationText,
      normalizeReferenceVideo: previewSettingsDomain.normalizeReferenceVideo,
      normalizeRenderCodec: previewSettingsDomain.normalizeRenderCodec,
      normalizeRenderProfile: previewSettingsDomain.normalizeRenderProfile,
      normalizeSettings: settingsDomain.normalizeSettings,
      normalizeStyleAnimation: styleAnimationDomain.normalizeStyleAnimation,
      normalizeSource: sourceDomain.normalizeSource,
      normalizeText: commonDomain.normalizeText,
      normalizeTextCapitalization: settingsDomain.normalizeTextCapitalization,
      numberWithFallback: layoutDomain.numberWithFallback,
      parseFrameDuration: timecodeDomain.parseFrameDuration,
      pdfPageVerticalJustify: layoutDomain.pdfPageVerticalJustify,
      productionEpisodes: projectsDomain.productionEpisodes,
      productionLayout: projectsDomain.productionLayout,
      productionSettings: projectsDomain.productionSettings,
      quoteFontFamily: typographyDomain.quoteFontFamily,
      renderMaterial: renderUnitsDomain.renderMaterial,
      renderedUnitText: renderUnitsDomain.renderedUnitText,
      renderProfileSupportsAlpha: previewSettingsDomain.renderProfileSupportsAlpha,
      resolveOverride: overridesDomain.resolveOverride,
      roleNameGapForOrientation: layoutDomain.roleNameGapForOrientation,
      safeFilePart: commonDomain.safeFilePart,
      safeStyleId: commonDomain.safeStyleId,
      scrollSourceFrameCounts: timecodeDomain.scrollSourceFrameCounts,
      selectedImportModelIdInDomain: sourceDomain.selectedImportModelId,
      selectedProductionHasStoredSettings: settingsDomain.selectedProductionHasStoredSettings,
      setOverrideInDomain: overridesDomain.setOverride,
      settingsWithProductionLayout: settingsDomain.settingsWithProductionLayout,
      serializeStyleAnimation: styleAnimationDomain.serializeStyleAnimation,
      sourceBlankRowCounts: paginationUnitsDomain.sourceBlankRowCounts,
      sourceUnitStartRow: paginationUnitsDomain.sourceUnitStartRow,
      stripProductionLayoutFromSettings: settingsDomain.stripProductionLayoutFromSettings,
      styleNameFromFileName: commonDomain.styleNameFromFileName,
      transformCartelaText: settingsDomain.transformCartelaText,
      unitRenderOptions: paginationUnitsDomain.unitRenderOptions,
      verticalOffset: layoutDomain.verticalOffset,
    };
  }

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
      fieldControlRegistry: registry,
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
    createCoreDomainComposition,
  };
})(globalThis);
