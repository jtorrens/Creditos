(function () {
  const state = {
    source: null,
    referenceVideo: null,
    materials: [],
    structure: null,
    render: null,
    selectedCartelaId: null,
    preview: 'structure',
    activeTab: 'settings',
    databasePath: null,
    databaseSyncStatus: null,
    productions: [],
    episodes: [],
    importModels: [],
    selectedProductionId: null,
    selectedEpisodeId: null,
    selectedStyleId: null,
    styles: [],
    preferences: {},
    fontCatalog: null,
    pdfPageIndex: 0,
    pngPreviewZoom: null,
    pngPreviewZoomMode: 'auto',
    showMarginOverlay: false,
    showPanelMarginOverlay: false,
    showPreviewReferenceVideo: false,
    showCartelaReferenceVideo: false,
    exportIncludeBackground: false,
    exportIncludeVideo: false,
    exportIncludeMargins: false,
    movExportProgress: null,
    isLoadingEpisode: false,
    autosaveTimer: null,
    autosaveStyleTimers: new Map(),
    lastPreviewRangeTotal: 0,
    previewAnimation: {
      frame: 0,
      playing: false,
      raf: null,
      startedAt: 0,
      startFrame: 0,
    },
    referenceVideoElement: null,
    referenceVideoSrc: '',
    referenceVideoCanvasElement: null,
    referenceVideoCanvasSrc: '',
    referenceVideoDuration: null,
  };

  const els = {
    openXlsxBtn: document.getElementById('openXlsxBtn'),
    openReferenceVideoBtn: document.getElementById('openReferenceVideoBtn'),
    clearReferenceVideoBtn: document.getElementById('clearReferenceVideoBtn'),
    newCartelaBtn: document.getElementById('newCartelaBtn'),
    xlsxInput: document.getElementById('xlsxInput'),
    databaseStatus: document.getElementById('databaseStatus'),
    downloadDatabaseBtn: document.getElementById('downloadDatabaseBtn'),
    uploadDatabaseBtn: document.getElementById('uploadDatabaseBtn'),
    productionSelect: document.getElementById('productionSelect'),
    productionList: document.getElementById('productionList'),
    showCreateProductionBtn: document.getElementById('showCreateProductionBtn'),
    duplicateProductionBtn: document.getElementById('duplicateProductionBtn'),
    deleteProductionBtn: document.getElementById('deleteProductionBtn'),
    productionCreateBox: document.getElementById('productionCreateBox'),
    productionPageWidthInput: document.getElementById('productionPageWidthInput'),
    productionPageHeightInput: document.getElementById('productionPageHeightInput'),
    productionPreviewBackgroundInput: document.getElementById('productionPreviewBackgroundInput'),
    productionImportModelSelect: document.getElementById('productionImportModelSelect'),
    episodeSelect: document.getElementById('episodeSelect'),
    newProductionNameInput: document.getElementById('newProductionNameInput'),
    newProductionEpisodeCountInput: document.getElementById('newProductionEpisodeCountInput'),
    createProductionBtn: document.getElementById('createProductionBtn'),
    createStyleBtn: document.getElementById('createStyleBtn'),
    duplicateStyleBtn: document.getElementById('duplicateStyleBtn'),
    deleteStyleBtn: document.getElementById('deleteStyleBtn'),
    styleCount: document.getElementById('styleCount'),
    styleList: document.getElementById('styleList'),
    styleEditorTitle: document.getElementById('styleEditorTitle'),
    styleEditorMeta: document.getElementById('styleEditorMeta'),
    styleEditorBody: document.getElementById('styleEditorBody'),
    stylePreview: document.getElementById('stylePreview'),
    toggleStyleMarginsBtn: document.getElementById('toggleStyleMarginsBtn'),
    xlsxFileStatus: document.getElementById('xlsxFileStatus'),
    referenceVideoStatus: document.getElementById('referenceVideoStatus'),
    copyEpisodeStylesBtn: document.getElementById('copyEpisodeStylesBtn'),
    sourceMeta: document.getElementById('sourceMeta'),
    appVersion: document.getElementById('appVersion'),
    blockCount: document.getElementById('blockCount'),
    blockList: document.getElementById('blockList'),
    editorTitle: document.getElementById('editorTitle'),
    editorKind: document.getElementById('editorKind'),
    editorBody: document.getElementById('editorBody'),
    cartelaPreview: document.getElementById('cartelaPreview'),
    toggleCartelaMarginsBtn: document.getElementById('toggleCartelaMarginsBtn'),
    jsonPreview: document.getElementById('jsonPreview'),
    pdfPreview: document.getElementById('pdfPreview'),
    defaultDurationInput: document.getElementById('defaultDurationInput'),
    defaultAutoLinesInput: document.getElementById('defaultAutoLinesInput'),
    movieFpsInput: document.getElementById('movieFpsInput'),
    typographySettings: document.getElementById('typographySettings'),
    tabButtons: Array.from(document.querySelectorAll('.app-tabs button')),
    tabPanes: Array.from(document.querySelectorAll('.tab-pane')),
    structureTab: document.getElementById('structureTab'),
    renderTab: document.getElementById('renderTab'),
    pdfFirstPageBtn: document.getElementById('pdfFirstPageBtn'),
    pdfPrevPageBtn: document.getElementById('pdfPrevPageBtn'),
    pdfNextPageBtn: document.getElementById('pdfNextPageBtn'),
    pdfLastPageBtn: document.getElementById('pdfLastPageBtn'),
    pdfMinusLinesBtn: document.getElementById('pdfMinusLinesBtn'),
    pdfPlusLinesBtn: document.getElementById('pdfPlusLinesBtn'),
    pdfPageNumberInput: document.getElementById('pdfPageNumberInput'),
    pdfTotalPages: document.getElementById('pdfTotalPages'),
    pdfBaseNameInput: document.getElementById('pdfBaseNameInput'),
    exportFromPageInput: document.getElementById('exportFromPageInput'),
    exportToPageInput: document.getElementById('exportToPageInput'),
    movieModeSelect: document.getElementById('movieModeSelect'),
    movieCodecSelect: document.getElementById('movieCodecSelect'),
    movieEncodingProfileSelect: document.getElementById('movieEncodingProfileSelect'),
    movieRangeDurationInput: document.getElementById('movieRangeDurationInput'),
    movieTargetDurationInput: document.getElementById('movieTargetDurationInput'),
    referenceVideoDurationInput: document.getElementById('referenceVideoDurationInput'),
    moviePrerollCountInput: document.getElementById('moviePrerollCountInput'),
    moviePrerollDurationInput: document.getElementById('moviePrerollDurationInput'),
    moviePostrollCountInput: document.getElementById('moviePostrollCountInput'),
    moviePostrollDurationInput: document.getElementById('moviePostrollDurationInput'),
    pdfLineStatus: document.getElementById('pdfLineStatus'),
    pdfVerticalOffsetInput: document.getElementById('pdfVerticalOffsetInput'),
    pngZoomOutBtn: document.getElementById('pngZoomOutBtn'),
    pngZoomInBtn: document.getElementById('pngZoomInBtn'),
    pngZoomStatus: document.getElementById('pngZoomStatus'),
    previewStartBtn: document.getElementById('previewStartBtn'),
    previewPlayBtn: document.getElementById('previewPlayBtn'),
    previewFrameInput: document.getElementById('previewFrameInput'),
    previewFrameStatus: document.getElementById('previewFrameStatus'),
    toggleMarginsBtn: document.getElementById('toggleMarginsBtn'),
    showPreviewReferenceVideoInput: document.getElementById('showPreviewReferenceVideoInput'),
    showCartelaReferenceVideoInput: document.getElementById('showCartelaReferenceVideoInput'),
    exportIncludeBackgroundInput: document.getElementById('exportIncludeBackgroundInput'),
    exportIncludeVideoInput: document.getElementById('exportIncludeVideoInput'),
    exportIncludeMarginsInput: document.getElementById('exportIncludeMarginsInput'),
    exportCurrentPdfBtn: document.getElementById('exportCurrentPdfBtn'),
    exportAllPdfBtn: document.getElementById('exportAllPdfBtn'),
    exportMovBtn: document.getElementById('exportMovBtn'),
  };

  const TYPOGRAPHY_FIELDS = [
    ['page_header', 'Cabecera'],
    ['block_title', 'Título del bloque'],
    ['role', 'Cargo'],
    ['name', 'Nombre'],
  ];
  const BLOCK_TYPOGRAPHY_FIELDS = TYPOGRAPHY_FIELDS.filter(([key]) => key !== 'page_header');
  const STYLE_CARTELA_FIELDS = ['orientation', 'columns', 'vertical_offset', 'duration', 'line_spacing', 'column_gap', 'role_name_gap', 'source_group_gap', 'block_gap', 'block_title_gap', 'page_top_margin', 'page_bottom_margin', 'page_left_margin', 'page_right_margin', 'repeat_block_titles', 'auto_text_wrap', 'text_capitalization', 'use_protected_capitalization'];
  const LANGUAGE_OPTIONS = [
    ['es', 'Español'],
    ['en', 'English'],
  ];
  const TEXT_CAPITALIZATION_OPTIONS = [
    ['source', 'Origen'],
    ['uppercase', 'Mayúsculas'],
    ['lowercase', 'Minúsculas'],
    ['title', 'Capitalizado cada palabra'],
    ['title_editorial', 'Capitalizado editorial'],
  ];
  const YES_NO_OPTIONS = [
    ['true', 'Sí'],
    ['false', 'No'],
  ];
  const MOV_ENCODING_PROFILES = {
    prores: [
      ['prores_proxy', 'Proxy'],
      ['prores_lt', 'LT'],
      ['prores_422', '422'],
      ['prores_422_hq', '422 HQ'],
      ['prores_4444', '4444'],
      ['prores_4444_xq', '4444 XQ'],
    ],
    h264: [
      ['h264_light', 'Ligero · 8 Mb/s'],
      ['h264_standard', 'Estándar · 20 Mb/s'],
      ['h264_high', 'Alta · 40 Mb/s'],
    ],
  };
  const LANGUAGE_LOCALES = {
    es: 'es-ES',
    en: 'en-US',
  };
  const TITLE_MINOR_WORDS = {
    es: new Set(['a', 'al', 'ante', 'bajo', 'con', 'contra', 'de', 'del', 'desde', 'durante', 'e', 'el', 'en', 'entre', 'hacia', 'hasta', 'la', 'las', 'lo', 'los', 'o', 'para', 'por', 'segun', 'según', 'sin', 'sobre', 'tras', 'u', 'un', 'una', 'unas', 'unos', 'y']),
    en: new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'nor', 'of', 'on', 'or', 'per', 'the', 'to', 'via', 'vs', 'with']),
  };
  const STORAGE_KEYS = {
    xlsxDir: 'creditos:lastDir:xlsx',
    referenceVideoDir: 'creditos:lastDir:referenceVideo',
    imageDir: 'creditos:lastDir:image',
    renderDir: 'creditos:lastDir:render',
    stylesPanels: 'creditos:panels:styles',
    cartelasPanels: 'creditos:panels:cartelas',
    selectedProduction: 'creditos:selectedProduction',
    selectedEpisode: 'creditos:selectedEpisode',
    lastSelection: 'creditos:lastSelection',
  };
  const appApi = globalThis.CreditosAppApi.createAppApi({
    host: window,
    getDatabasePath: () => state.databasePath,
  });
  const {
    dbPost,
    nativeBridge,
    writeNativePreference,
  } = appApi;
  const appDatabaseSync = globalThis.CreditosAppDatabaseSync.createAppDatabaseSync({
    els,
    initializeDatabase,
    nativeBridge,
    state,
    windowRef: window,
  });
  const {
    refreshDatabaseSyncStatus,
    syncDatabaseManually,
    updateDatabaseStatus,
  } = appDatabaseSync;
  const appFileOutput = globalThis.CreditosAppFileOutput.createAppFileOutput({
    documentRef: document,
    nativeBridge,
    windowRef: window,
  });
  const {
    blobToBytes,
    downloadBlob,
    saveBlobAs,
    wait,
    writeBlobToDirectory,
  } = appFileOutput;
  const coreDomainComposition = globalThis.CreditosAppComposition.createCoreDomainComposition({
    languageLocales: LANGUAGE_LOCALES,
    languageOptions: LANGUAGE_OPTIONS,
    movEncodingProfiles: MOV_ENCODING_PROFILES,
    textCapitalizationOptions: TEXT_CAPITALIZATION_OPTIONS,
    titleMinorWords: TITLE_MINOR_WORDS,
    typographyFields: TYPOGRAPHY_FIELDS,
  });
  const {
    applyProductionFields,
    applyProtectedCapitalizations,
    applyTextCapitalization,
    blockForTitleRepeat,
    boolSelectValue,
    buildFontCatalog,
    cartelaBlockGap,
    cartelaBlockTitleGap,
    clamp,
    contentAreaRect,
    countTitleLine,
    createMaterialsFromSource,
    creditSourceId,
    currentXlsxName,
    defaultImportModelIdInDomain,
    defaultLayoutForMaterial,
    defaultOrientationForMaterial,
    defaultPreviewSettings,
    defaultSettings,
    directoryFromPath,
    encodingProfilesForCodec,
    escapeHtml,
    explicitTextLines,
    exportPageSelection,
    fallbackFontCatalog,
    findSelectedProduction,
    fitMovieTargetFrames,
    fitPreviewZoom,
    fontStyleFromStyle,
    fontStylesForFamily,
    fontWeightFromStyle,
    forceRenderedRoleNameColumns,
    formatFrameDuration,
    formatSecondsAsFrameDuration,
    getExportRenderOptionsInDomain,
    getMaterialContentItems,
    getMovieBodyTargetFramesOrSource,
    getMovieExportFrameCounts,
    getMovieFps,
    getPageFrameCount,
    getRenderedBlockUnits,
    groupMoviePageItemsByCartela,
    groupMusicLicenseThemes,
    groupPhysicalPagesByCartela,
    importModelOptions,
    joinPath,
    labelForImportModel,
    layoutForCartela,
    localeForLanguage,
    movieBodySourceTotal,
    movieDurationFrameSummary,
    movieGroupFrameCounts,
    moviePageItems,
    normalizeBoolean,
    normalizeColor,
    normalizeDurationInputValueInDomain,
    normalizeEditableValue,
    normalizeLanguage,
    normalizeMovieSegmentSettings,
    normalizePreviewSettings,
    normalizeProtectedCapitalizationTerms,
    normalizeProtectedCapitalizationText,
    normalizeReferenceVideo,
    normalizeRenderCodec,
    normalizeRenderProfile,
    normalizeSettings,
    normalizeSource,
    normalizeText,
    normalizeTextCapitalization,
    numberWithFallback,
    parseFrameDuration,
    pdfPageVerticalJustify,
    productionEpisodes,
    productionLayout,
    productionSettings,
    quoteFontFamily,
    renderMaterial,
    renderedUnitText,
    renderProfileSupportsAlpha,
    resolveOverride,
    roleNameGapForOrientation,
    safeFilePart,
    safeStyleId,
    scrollSourceFrameCounts,
    selectedImportModelIdInDomain,
    selectedProductionHasStoredSettings,
    setOverrideInDomain,
    settingsWithProductionLayout,
    sourceBlankRowCounts,
    sourceUnitStartRow,
    stripProductionLayoutFromSettings,
    styleNameFromFileName,
    transformCartelaText,
    unitRenderOptions,
    verticalOffset,
  } = coreDomainComposition;
  const appPreferences = globalThis.CreditosAppPreferences.createAppPreferences({
    clamp,
    directoryFromPath,
    documentRef: document,
    renderVisiblePanelPreviews,
    state,
    storageKeys: STORAGE_KEYS,
    windowRef: window,
    writeNativePreference,
  });
  const {
    readLocalJsonPreference,
    readLocalPreference,
    rememberFileDirectory,
    setupResizablePanels,
    writeLocalJsonPreference,
  } = appPreferences;
  const appProjectState = globalThis.CreditosAppProjectState.createAppProjectState({
    applyProductionFields,
    dbPost,
    findSelectedProduction,
    productionEpisodes,
    productionLayout,
    productionSettings,
    readLocalJsonPreference,
    readLocalPreference,
    renderProjectSelectors,
    state,
    storageKeys: STORAGE_KEYS,
    writeLocalJsonPreference,
  });
  const {
    currentProductionEpisodes,
    getProductionLayout,
    getProductionSettings,
    persistSelectedProductionFields,
    readSavedSelection,
    rememberCurrentSelection,
    selectedEpisode,
    selectedProduction,
    setSelectedProductionLocalFields,
  } = appProjectState;
  const appAutosave = globalThis.CreditosAppAutosave.createAppAutosave({
    dbPost,
    getStructureJsonForOutput,
    getStyleById,
    state,
    windowRef: window,
    writeStyleFile,
  });
  const {
    persistCurrentEpisode,
    scheduleAutosave,
    scheduleStyleAutosave,
  } = appAutosave;
  const appReferenceVideo = globalThis.CreditosAppReferenceVideo.createAppReferenceVideo({
    currentMovieFps,
    dbPost,
    els,
    formatSecondsAsFrameDuration,
    nativeBridge,
    normalizeReferenceVideo,
    readLocalPreference,
    referenceVideoForCanvas,
    refreshPdfIfActive,
    rememberFileDirectory,
    renderPreview,
    state,
    storageKeys: STORAGE_KEYS,
    windowRef: window,
  });
  const {
    associateReferenceVideo,
    clearReferenceVideo,
    loadReferenceVideoDuration,
    updateReferenceVideoDurationField,
    updateReferenceVideoStatus,
  } = appReferenceVideo;
  const appPreviewSettings = globalThis.CreditosAppPreviewSettings.createAppPreviewSettings({
    documentRef: document,
    els,
    encodingProfilesForCodec,
    getMovieMode,
    normalizePreviewSettings,
    normalizeRenderCodec,
    normalizeRenderProfile,
    renderProfileSupportsAlpha,
    scheduleAutosave,
    state,
  });
  const {
    applyPreviewSettingsToUi,
    currentPreviewSettingsFromUi,
    ensureBackgroundForEncodingProfile,
    renderMovieEncodingProfiles,
    savePreviewSettingsFromUi,
    selectedRenderCodec,
    selectedRenderProfile,
  } = appPreviewSettings;
  const appBootstrap = globalThis.CreditosAppBootstrap.createAppBootstrap({
    appApi,
    els,
    initializeDatabase,
    loadSystemFonts,
    nativeBridge,
    refreshDatabaseSyncStatus,
    renderProjectSelectors,
    setupResizablePanels,
    state,
  });
  const {
    initializeAppInfo,
    initializeAppPreferences,
  } = appBootstrap;
  const styleDomain = globalThis.CreditosDomainStyles.createStyleDomain({
    baseStyleCartela: baseStyleCartelaFromSettings,
    blockTypographyFields: BLOCK_TYPOGRAPHY_FIELDS,
    effectiveStyleBlockForStyle: getEffectiveStyleBlock,
    effectiveStyleCartelaForStyle: getEffectiveStyleCartela,
    effectiveStyleTitleTypographyForStyle: getEffectiveStyleTitleTypography,
    findPageWithRef: (cartela, ref) => findPageWithRef(cartela, ref),
    getCartelaRefs: (cartela) => getCartelaRefs(cartela),
    getCartelaStyleBlock,
    getStyleById,
    normalizeBoolean,
    normalizeColor,
    normalizeTextCapitalization,
    safeStyleId,
    styleCartelaFields: STYLE_CARTELA_FIELDS,
  });
  const {
    applyBlockStyleToCartelaRefs,
    applyExplicitCartelaOverridesFromSource,
    baseStyleCartelaFromSettings: baseStyleCartelaFromSettingsWithSettings,
    clearCartelaStyleOverrides,
    ensureCartelaSourceRefSettings,
    getEffectiveCartelaBlockStyle,
    getEffectiveCartelaTitleTypography: getEffectiveCartelaTitleTypographyWithSettings,
    getEffectiveStyleBlock: getEffectiveStyleBlockWithSettings,
    getEffectiveStyleCartela: getEffectiveStyleCartelaWithSettings,
    getEffectiveStyleTitleTypography: getEffectiveStyleTitleTypographyWithSettings,
    getSourceRefAlignment,
    getSourceRefColumns,
    getSourceRefTypography,
    getSourceRefVerticalAlign,
    hasCartelaBlockAlignmentOverride,
    hasCartelaBlockTypographyOverride,
    hasCartelaOverride,
    hasCartelaStyleOverrides,
    hasCartelaTitleTypographyOverride,
    hasStyleCartelaOverride,
    hasStyleTitleTypographyOverride,
    hasStyleTypographyOverride,
    makeSampleStyleRender,
    normalizeCartelaStyle,
    normalizeTitleTypographyOverrides,
    normalizeTypographyOverrides,
    normalizeVerticalAlign,
    pruneRedundantStyleDefaults: pruneRedundantStyleDefaultsInDomain,
    pruneRedundantStyleOverrides: pruneRedundantStyleOverridesInDomain,
    resetCartelaBlockAlignmentOverride: resetCartelaBlockAlignmentOverrideInDomain,
    resetCartelaBlockOverride: resetCartelaBlockOverrideInDomain,
    resetCartelaBlockTypographyOverride: resetCartelaBlockTypographyOverrideInDomain,
    resetCartelaTitleTypographyOverride: resetCartelaTitleTypographyOverrideInDomain,
    resetSourceRefTypography,
    resetStyleBlockAlignmentOverride: resetStyleBlockAlignmentOverrideInDomain,
    resetStyleBlockOverride: resetStyleBlockOverrideInDomain,
    resetStyleCartelaOverride: resetStyleCartelaOverrideInDomain,
    resetStyleTitleTypographyOverride: resetStyleTitleTypographyOverrideInDomain,
    resetStyleTypographyOverride: resetStyleTypographyOverrideInDomain,
    sanitizeStyleCartelaOverrides,
    sanitizeStyleBlockOverrides,
    serializeCartelaStyle,
    sourceRefIsLocked,
    uniqueStyleId,
    updateCartelaBlockAlignment: updateCartelaBlockAlignmentInDomain,
    updateCartelaBlockStyle: updateCartelaBlockStyleInDomain,
    updateCartelaBlockTypography: updateCartelaBlockTypographyInDomain,
    updateCartelaTitleTypography: updateCartelaTitleTypographyInDomain,
    updateSourceRefAlignment,
    updateSourceRefColumns,
    updateSourceRefTypography,
    updateSourceRefVerticalAlign,
    updateStyleBlock: updateStyleBlockInDomain,
    updateStyleBlockAlignment: updateStyleBlockAlignmentInDomain,
    updateStyleCartela: updateStyleCartelaInDomain,
    updateStyleTitleTypography: updateStyleTitleTypographyInDomain,
    updateStyleTypography: updateStyleTypographyInDomain,
  } = styleDomain;
  const structureDomain = globalThis.CreditosDomainStructure.createStructureDomain({
    defaultLayoutForMaterial,
    defaultOrientationForMaterial,
    getMaterialContentItems,
    groupMusicLicenseThemes,
    normalizePreviewSettings,
    normalizeTypographyOverrides,
    normalizeVerticalAlign,
  });
  const {
    applyLockedMaterials,
    cartelaHasImages,
    cartelaHasRenderableRefs,
    cartelaImages,
    createStructureFromSource: createStructureFromSourceWithSettings,
    deleteManualCartela,
    enforceUniqueMaterialRefs,
    ensureCartelaOrders,
    findPageWithRef,
    getCartelaDisplayName,
    getCartelaRefs,
    getVisualCartelas,
    insertManualCartela,
    migrateStructure,
    moveMaterialToCartela,
    moveCartelaVisualOrder: moveCartelaVisualOrderInStructure,
    normalizeFrozenMaterial,
    normalizeVisualOrders,
    resetCartelaOverride: resetCartelaOverrideInStructure,
    structureJsonForOutput,
    updateCartela: updateCartelaInStructure,
    uniqueCartelaImageId,
  } = structureDomain;
  const appSourceImport = globalThis.CreditosAppSourceImport.createAppSourceImport({
    applyLockedMaterials,
    createMaterialsFromSource,
    createStructureFromSource,
    dbPost,
    els,
    getStructureJsonForOutput,
    nativeBridge,
    normalizeSource,
    readLocalPreference,
    rebuild,
    rememberFileDirectory,
    renderMeta,
    selectedImportModelIdInDomain,
    selectedProduction,
    state,
    storageKeys: STORAGE_KEYS,
    updateXlsxStatus,
    windowRef: window,
  });
  const {
    loadXlsxFile,
    openXlsxFile,
  } = appSourceImport;
  const scrollDomain = globalThis.CreditosDomainScroll.createScrollDomain({
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
  });
  const {
    buildScrollPlan,
    formatScrollSpeed,
    scrollClipRect,
    scrollFullAreaItemClip,
    scrollItemIntersectsClip,
    scrollOffsetForFrame,
  } = scrollDomain;
  const paginationDomain = globalThis.CreditosDomainPagination.createPaginationDomain({
    blockForTitleRepeat,
    canvasTextMetrics,
    canvasWrappedTextLines,
    cartelaBlockGap,
    cartelaHasImages,
    countTitleLine,
    creditSourceId,
    getEffectiveCartela,
    getRenderLayout,
    getRenderedBlockUnits,
    layoutForCartela,
    normalizeSettings,
    sourceBlankRowCounts,
    unitRenderOptions,
  });
  const {
    adjustPdfPageLineAdjustment,
    buildPhysicalPages,
    getPdfLineStatus,
    repeatBlockTitlesForCartela,
    unitGapBefore,
  } = paginationDomain;
  const renderDomain = globalThis.CreditosDomainRender.createRenderDomain({
    applyTextCapitalization,
    buildPhysicalPages,
    canvasTextMetrics,
    canvasWrappedTextLines,
    cartelaHasRenderableRefs,
    cartelaImages,
    forceRenderedRoleNameColumns,
    getEffectiveCartela,
    getEffectiveCartelaBlockStyle,
    getEffectiveCartelaTitleTypography,
    getSourceRefAlignment,
    getSourceRefColumns,
    getSourceRefTypography,
    getSourceRefVerticalAlign,
    getVisualCartelas,
    getRenderedBlockUnits,
    layoutForCartela,
    normalizeBoolean,
    normalizeSettings,
    normalizeTextCapitalization,
    renderMaterial,
    renderedUnitText,
    resolveOverride,
    settingsWithProductionLayout,
    sourceUnitStartRow,
  });
  const {
    buildRenderJson: buildRenderJsonInDomain,
  } = renderDomain;
  const timelineDomain = globalThis.CreditosDomainTimeline.createTimelineDomain({
    scrollOffsetForFrame,
  });
  const {
    frameForPdfPageIndex,
    pageForAnimationFrame,
    pageIndexForAnimationFrame,
    videoTimeForPage,
  } = timelineDomain;
  const appComposition = globalThis.CreditosAppComposition.createAppComposition({
    documentRef: document,
    exportDependencies: {
      buildScrollPlan,
      getMovieBodyTargetFramesOrSource,
      getMovieExportFrameCounts,
      onCancelAvailable: (cancelHandler) => {
        if (state.movExportProgress) state.movExportProgress.setCancelHandler(cancelHandler);
      },
      onEncoding: () => {
        if (state.movExportProgress) state.movExportProgress.setPhase('Codificando MOV...');
      },
      throwIfCancelled: throwIfMovExportCancelled,
      wait,
    },
    previewDependencies: {
      applyTextCapitalization,
      applyTypography,
      cartelaBlockGap,
      cartelaBlockTitleGap,
      cartelaImages,
      contentAreaRect,
      creditSourceId,
      explicitTextLines,
      fontStyleFromStyle,
      fontWeightFromStyle,
      getCurrentFrame: () => state.previewAnimation.frame,
      getProductionSettings,
      getReferenceVideo: () => state.referenceVideo,
      getReferenceVideoCanvasElement: () => state.referenceVideoCanvasElement,
      getReferenceVideoCanvasSrc: () => state.referenceVideoCanvasSrc,
      getReferenceVideoElement: () => state.referenceVideoElement,
      getReferenceVideoSrc: () => state.referenceVideoSrc,
      isPlaying: () => state.previewAnimation.playing,
      layoutForCartela,
      normalizeBoolean,
      normalizeLanguage,
      normalizeReferenceVideo,
      normalizeSettings,
      normalizeTextCapitalization,
      pdfPageVerticalJustify,
      quoteFontFamily,
      roleNameGapForOrientation,
      scrollClipRect,
      scrollFullAreaItemClip,
      scrollItemIntersectsClip,
      scrollOffsetForFrame,
      setReferenceVideoCanvasElement: (videoEl) => {
        state.referenceVideoCanvasElement = videoEl;
      },
      setReferenceVideoCanvasSrc: (src) => {
        state.referenceVideoCanvasSrc = src;
      },
      setReferenceVideoDuration: (duration) => {
        state.referenceVideoDuration = duration;
        updateReferenceVideoDurationField();
      },
      setReferenceVideoElement: (videoEl) => {
        state.referenceVideoElement = videoEl;
      },
      setReferenceVideoSrc: (src) => {
        state.referenceVideoSrc = src;
      },
      transformCartelaText,
      unitGapBefore,
      unitRenderOptions,
      verticalOffset,
    },
  });
  const {
    applyTextWrapStyle: applyTextWrapStyleInPreview,
    buildPageMoviePlan,
    buildScrollMoviePlan,
    canvasTextHeight: canvasTextHeightInPreview,
    canvasTextMetrics: canvasTextMetricsInPreview,
    canvasWrappedTextLines: canvasWrappedTextLinesInPreview,
    drawCanvasMarginOverlay: drawCanvasMarginOverlayInPreview,
    drawCanvasPage: drawCanvasPageInPreview,
    drawCanvasScrollFrame: drawCanvasScrollFrameInPreview,
    drawReferenceVideoFrame: drawReferenceVideoFrameInPreview,
    exportMovFramesIncrementally,
    fieldControlRegistry,
    makeMarginOverlay: makeMarginOverlayInPreview,
    makePdfSheetElement: makePdfSheetElementInPreview,
    makeReferenceVideoElement: makeReferenceVideoElementInPreview,
    measureCanvasBlock: measureCanvasBlockInPreview,
    referenceVideoForCanvas: referenceVideoForCanvasInPreview,
    writeAnimatedFrames,
    writeRepeatedFrames,
  } = appComposition;

  const appFonts = globalThis.CreditosAppFonts.createAppFonts({
    buildFontCatalog,
    fallbackFontCatalog,
    fieldControlRegistry,
    fontStylesForFamily,
    refreshPdfIfActive,
    renderEditor,
    renderPreview,
    renderProjectSelectors,
    renderSettings,
    state,
    windowRef: window,
  });
  const {
    getFontCatalog,
    getFontStyles,
    makeFontFamilyControl,
    makeFontSizeControl,
    makeFontStyleControl,
  } = appFonts;
  const appFormRows = globalThis.CreditosAppFormRows.createAppFormRows({
    currentMovieFps,
    documentRef: document,
    fieldControlRegistry,
    formatFrameDuration,
    formatSecondsAsFrameDuration,
    parseFrameDuration,
    renderEditor,
    windowRef: window,
  });
  const {
    localCheckboxRow,
    localDurationRow,
    localInputRow,
    localNumberRow,
    localSelectRow,
  } = appFormRows;
  const appPreviewRender = globalThis.CreditosAppPreviewRender.createAppPreviewRender({
    fitPreviewZoom,
    getPngPreviewZoom: () => state.pngPreviewZoom,
    getProductionSettings,
    makeMarginOverlayInPreview,
    makePdfSheetElementInPreview,
  });
  const {
    makeMarginOverlay: makeMarginOverlayFromPreviewRender,
    makePdfSheetElement: makePdfSheetElementFromPreviewRender,
    previewZoomForContainer: previewZoomForContainerFromPreviewRender,
  } = appPreviewRender;
  const settingsPanel = globalThis.CreditosSettingsPanel.createSettingsPanel({
    boolSelectValue,
    currentMovieFps,
    documentRef: document,
    els,
    fieldControlRegistry,
    formatSecondsAsFrameDuration,
    getFontCatalog,
    getFontStyles,
    getProductionSettings,
    languageOptions: LANGUAGE_OPTIONS,
    localInputRow,
    localSelectRow,
    makeFontFamilyControl,
    makeFontSizeControl,
    makeFontStyleControl,
    normalizeBoolean,
    normalizeColor,
    normalizeProtectedCapitalizationText,
    sectionLabel,
    textCapitalizationOptions: TEXT_CAPITALIZATION_OPTIONS,
    typographyFields: TYPOGRAPHY_FIELDS,
    updateLayoutSetting,
    updateSettings,
    updateTypographySetting,
    yesNoOptions: YES_NO_OPTIONS,
  });
  const appCommands = globalThis.CreditosAppCommands.createAppCommands({
    applyDatabaseOverview,
    buildCurrentRenderJson,
    clearCartelaStyleOverrides,
    currentProductionEpisodes,
    dbPost,
    deleteManualCartela,
    findPageWithRef,
    getEffectiveStyleTitleTypography,
    getSelectedCartela,
    getStyleById,
    getProductionSettings,
    insertManualCartela,
    moveCartelaVisualOrderInStructure,
    nativeBridge,
    persistSelectedProductionFields,
    pruneCurrentRedundantStyleDefaults,
    refreshPdfIfActive,
    rebuild,
    renderCartelaList,
    renderCartelaPreview,
    renderEditor,
    renderPreview,
    renderProjectSelectors,
    renderSettings,
    renderStylesPane,
    resetCartelaBlockAlignmentOverrideInDomain,
    resetCartelaBlockOverrideInDomain,
    resetCartelaBlockTypographyOverrideInDomain,
    resetCartelaOverrideInStructure,
    resetCartelaTitleTypographyOverrideInDomain,
    resetSourceRefTypography,
    resetStyleBlockAlignmentOverrideInDomain,
    resetStyleBlockOverrideInDomain,
    resetStyleCartelaOverrideInDomain,
    resetStyleTitleTypographyOverrideInDomain,
    resetStyleTypographyOverrideInDomain,
    normalizeTitleTypographyOverrides,
    safeStyleId,
    sanitizeStyleBlockOverrides,
    sanitizeStyleCartelaOverrides,
    scheduleStyleAutosave,
    selectedProduction,
    setSelectedProductionLocalFields,
    state,
    stripProductionLayoutFromSettings,
    updateCartelaBlockAlignmentInDomain,
    updateCartelaBlockStyleInDomain,
    updateCartelaBlockTypographyInDomain,
    updateCartelaInStructure,
    updateCartelaTitleTypographyInDomain,
    updateSourceRefAlignment,
    updateSourceRefColumns,
    updateSourceRefTypography,
    updateSourceRefVerticalAlign,
    updateStyleBlockAlignmentInDomain,
    updateStyleBlockInDomain,
    updateStyleCartelaInDomain,
    updateStyleTitleTypographyInDomain,
    updateStyleTypographyInDomain,
    uniqueStyleId,
    windowRef: window,
    writeStyleFile,
  });
  const projectPanel = globalThis.CreditosProjectPanel.createProjectPanel({
    currentProductionEpisodes,
    currentXlsxName,
    documentRef: document,
    els,
    fieldControlRegistry,
    getProductionLayout,
    importModelOptions,
    labelForImportModel,
    normalizeColor,
    selectProductionById,
    selectedProduction,
    state,
    updateDatabaseStatus,
    updateProductionEpisodeCount,
    updateProductionName,
    updateReferenceVideoStatus,
  });
  const cartelaListPanel = globalThis.CreditosCartelaListPanel.createCartelaListPanel({
    documentRef: document,
    els,
    escapeHtml,
    getCartelaDisplayName,
    getCartelaRefs,
    getEffectiveCartela,
    getStyleById,
    getVisualCartelas,
    moveSelectedCartelaVisualOrder,
    selectCartela: (cartelaId) => {
      state.selectedCartelaId = cartelaId;
      rebuild();
    },
    selectedEpisode,
    state,
  });
  const cartelaPreviewPanel = globalThis.CreditosCartelaPreviewPanel.createCartelaPreviewPanel({
    documentRef: document,
    els,
    getCurrentPhysicalPages,
    getPreviewAnimationPlan,
    getRenderLayout,
    getSelectedCartela,
    layoutForCartela,
    makeMarginOverlay,
    makePdfSheetElement,
    makeReferenceVideoElement,
    previewZoomForContainer,
    state,
    updatePanelMarginButtons,
  });
  const stylesPanel = globalThis.CreditosStylesPanel.createStylesPanel({
    buildPhysicalPages,
    documentRef: document,
    els,
    fieldControlRegistry,
    getProductionSettings,
    getRenderLayout,
    getStyleById,
    layoutForCartela,
    makeMarginOverlay,
    makePdfSheetElement,
    makeSampleStyleRender,
    previewZoomForContainer,
    renderStyleEditor,
    selectedProduction,
    state,
    updatePanelMarginButtons,
    updateStyleName,
  });
  const appCartelaImages = globalThis.CreditosAppCartelaImages.createAppCartelaImages({
    cartelaImages,
    getSelectedCartela,
    nativeBridge,
    readLocalPreference,
    rememberFileDirectory,
    storageKeys: STORAGE_KEYS,
    uniqueCartelaImageId,
    updateSelectedCartela,
    windowRef: window,
  });
  const {
    associateCartelaImage,
    removeCartelaImage,
    updateCartelaImage,
  } = appCartelaImages;
  let currentPhysicalPagesCache = { render: null, pages: [] };
  let previewPlanCache = { render: null, key: '', plan: null };

  globalThis.CreditosUiBindings.bindAppUi({
    els,
    state,
    windowRef: window,
    actions: {
      addEmptyCartela,
      adjustCurrentPdfPageLines,
      associateReferenceVideo,
      changePdfPage,
      clearReferenceVideo,
      copyStylesFromEpisodeFlow,
      createProductionFromUi,
      createStyleFromUi,
      currentMovieFps,
      deleteSelectedProduction,
      deleteSelectedStyle,
      duplicateSelectedProduction,
      duplicateSelectedStyle,
      ensureBackgroundForEncodingProfile,
      exportMov,
      exportPngPages,
      formatFrameDuration,
      formatSecondsAsFrameDuration,
      getMovieMode,
      getProductionSettings,
      goToPdfPage,
      loadXlsxFile,
      normalizeDurationInputElement,
      openXlsxFile,
      renderCartelaPreview,
      renderMovieEncodingProfiles,
      renderPdfPreview,
      renderVisiblePanelPreviews,
      savePreviewSettingsFromUi,
      seekPreviewAnimation,
      selectEpisodeFromUi,
      selectProductionFromUi,
      setActiveTab,
      setPreview,
      syncDatabaseManually,
      toggleCreateProductionBox,
      toggleMarginOverlay,
      togglePanelMarginOverlay,
      togglePreviewAnimation,
      updateCurrentPdfCartela,
      updateMovieDurationFields,
      updateMovieSegmentInputs,
      updatePdfBaseName,
      updatePngPreviewZoom,
      updateProductionImportModelFromUi,
      updateProductionLayoutFromUi,
      updateSettings,
      validateMovieTargetDuration,
    },
  });
  initializeAppInfo();
  initializeAppPreferences();

  async function initializeDatabase(options = {}) {
    try {
      const overview = await dbPost('/api/db/init', { db_path: null });
      state.databasePath = overview.db_path || 'data/creditos-refactor.db';
      applyDatabaseOverview(overview);
      updateDatabaseStatus();
    } catch (error) {
      if (!options.silent) window.alert('No se pudo inicializar la base de datos: ' + error.message);
    }
  }

  function applyDatabaseOverview(overview) {
    state.productions = overview.productions || [];
    state.episodes = overview.episodes || [];
    state.importModels = overview.import_models || state.importModels || [];
    const savedSelection = readSavedSelection();
    if (!state.selectedProductionId) {
      const preferredProductionId = savedSelection.productionId;
      if (preferredProductionId && state.productions.some((production) => String(production.id) === String(preferredProductionId))) {
        state.selectedProductionId = preferredProductionId;
      }
    }
    if (!state.productions.some((production) => String(production.id) === String(state.selectedProductionId))) {
      state.selectedProductionId = state.productions[0] ? state.productions[0].id : null;
    }
    const availableEpisodes = currentProductionEpisodes();
    if (!state.selectedEpisodeId) {
      const preferredEpisodeId = String(savedSelection.productionId) === String(state.selectedProductionId)
        ? savedSelection.episodeId
        : '';
      if (
        preferredEpisodeId &&
        availableEpisodes.some((episode) => String(episode.id) === String(preferredEpisodeId))
      ) {
        state.selectedEpisodeId = preferredEpisodeId;
      }
    }
    if (!availableEpisodes.some((episode) => String(episode.id) === String(state.selectedEpisodeId))) {
      state.selectedEpisodeId = availableEpisodes[0] ? availableEpisodes[0].id : null;
    }
    rememberCurrentSelection();
    renderProjectSelectors();
    if (state.selectedProductionId && state.selectedEpisodeId) {
      loadCurrentEpisode().catch((error) => console.warn(error));
    } else if (state.selectedProductionId) {
      loadProductionStyles().catch((error) => console.warn(error));
    }
  }

  function renderProjectSelectors() {
    return projectPanel.renderProjectSelectors();
  }

  function renderProductionList() {
    return projectPanel.renderProductionList();
  }

  function updateXlsxStatus() {
    return projectPanel.updateXlsxStatus();
  }

  async function selectProductionFromUi() {
    await selectProductionById(els.productionSelect.value || null);
  }

  async function selectProductionById(productionId) {
    state.selectedProductionId = productionId;
    const episodes = currentProductionEpisodes();
    const savedSelection = readSavedSelection();
    const savedEpisode = String(savedSelection.productionId) === String(productionId)
      ? episodes.find((episode) => String(episode.id) === String(savedSelection.episodeId))
      : null;
    state.selectedEpisodeId = savedEpisode ? savedEpisode.id : (episodes[0] ? episodes[0].id : null);
    rememberCurrentSelection();
    renderProjectSelectors();
    if (state.selectedProductionId && state.selectedEpisodeId) await loadCurrentEpisode();
    else if (state.selectedProductionId) await loadProductionStyles();
  }

  function toggleCreateProductionBox() {
    if (!els.productionCreateBox) return;
    els.productionCreateBox.classList.toggle('open');
    if (els.productionCreateBox.classList.contains('open')) {
      els.newProductionNameInput.focus();
      els.newProductionNameInput.select();
    }
  }

  async function selectEpisodeFromUi() {
    state.selectedEpisodeId = els.episodeSelect.value || null;
    rememberCurrentSelection();
    await loadCurrentEpisode();
  }

  async function copyStylesFromEpisodeFlow() {
    if (!state.databasePath || !state.selectedProductionId || !state.selectedEpisodeId || !state.structure) {
      window.alert('Selecciona una producción y un capítulo antes de copiar estilos.');
      return;
    }
    const candidates = currentProductionEpisodes().filter((episode) => String(episode.id) !== String(state.selectedEpisodeId));
    if (!candidates.length) {
      window.alert('No hay otros capítulos en esta producción.');
      return;
    }
    const sourceEpisodeId = await showEpisodeStyleSourceModal(candidates);
    if (!sourceEpisodeId) return;
    const sourceEpisode = candidates.find((episode) => String(episode.id) === String(sourceEpisodeId));
    const native = nativeBridge();
    const message = `Asignar a este capítulo los estilos usados en "${sourceEpisode ? sourceEpisode.name : 'otro capítulo'}"? Se copiará la asignación de estilo y solo los overrides explícitos de cartelas con el mismo ID.`;
    let confirmed = false;
    if (native && native.confirm) {
      const result = await native.confirm({ title: 'Asignar estilos', message, confirmLabel: 'Asignar estilos' });
      confirmed = !!(result && result.confirmed);
    } else {
      confirmed = window.confirm(message);
    }
    if (!confirmed) return;

    try {
      const result = await dbPost('/api/db/load-episode', {
        production_id: state.selectedProductionId,
        episode_id: sourceEpisodeId,
      });
      const sourceRawById = new Map(((result.structure && result.structure.cartelas) || []).map((cartela) => [cartela.id, cartela]));
      const sourceStructure = migrateStructure(result.structure);
      const sourceById = new Map((sourceStructure && sourceStructure.cartelas ? sourceStructure.cartelas : []).map((cartela) => [cartela.id, cartela]));
      let assigned = 0;
      (state.structure.cartelas || []).forEach((cartela) => {
        const sourceCartela = sourceById.get(cartela.id);
        if (!sourceCartela) return;
        applyExplicitCartelaOverridesFromSource(cartela, sourceCartela, sourceRawById.get(cartela.id) || sourceCartela);
        assigned += 1;
      });
      state.render = buildCurrentRenderJson(state.source, state.materials, state.structure);
      renderCartelaList();
      renderEditor();
      renderPreview();
      refreshPdfIfActive();
      scheduleAutosave();
      window.alert(`Estilos asignados en ${assigned} cartela${assigned === 1 ? '' : 's'}.`);
    } catch (error) {
      window.alert('No se pudieron asignar los estilos: ' + error.message);
    }
  }

  function showEpisodeStyleSourceModal(episodes) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      const modal = document.createElement('div');
      modal.className = 'app-modal';
      const title = document.createElement('h2');
      title.textContent = 'Asignar estilos de otro capítulo';
      const text = document.createElement('p');
      text.textContent = 'Elige el capítulo origen. Se copiará la asignación de estilo y solo los overrides explícitos de cartelas con el mismo ID.';
      const select = fieldControlRegistry.create('select', {
        className: 'text-input',
        options: episodes.map((episode) => ({
          value: episode.id,
          label: episode.name || `Capítulo ${episode.episode_number || episode.id}`,
        })),
      });
      const actions = document.createElement('div');
      actions.className = 'modal-actions';
      const cancelButton = document.createElement('button');
      cancelButton.type = 'button';
      cancelButton.textContent = 'Cancelar';
      const applyButton = document.createElement('button');
      applyButton.type = 'button';
      applyButton.className = 'primary';
      applyButton.textContent = 'Continuar';
      const close = (value) => {
        overlay.remove();
        resolve(value);
      };
      cancelButton.addEventListener('click', () => close(null));
      applyButton.addEventListener('click', () => close(select.value));
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) close(null);
      });
      actions.appendChild(cancelButton);
      actions.appendChild(applyButton);
      modal.appendChild(title);
      modal.appendChild(text);
      modal.appendChild(select);
      modal.appendChild(actions);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      select.focus();
    });
  }

  async function createProductionFromUi() {
    if (!state.databasePath) {
      window.alert('La base de datos todavía se está inicializando.');
      return;
    }
    const name = els.newProductionNameInput.value.trim();
    const episodeCount = Math.max(1, Math.round(Number(els.newProductionEpisodeCountInput.value) || 1));
    if (!name) {
      window.alert('Escribe el nombre de la producción.');
      return;
    }
    try {
      const overview = await dbPost('/api/db/create-production', {
        name,
        episode_count: episodeCount,
        page_width: 1920,
        page_height: 1080,
        preview_background: '#ffffff',
        import_model_id: defaultImportModelIdInDomain(state.importModels),
      });
      state.selectedProductionId = overview.production_id;
      state.selectedEpisodeId = null;
      els.newProductionNameInput.value = '';
      if (els.productionCreateBox) els.productionCreateBox.classList.remove('open');
      applyDatabaseOverview(overview);
    } catch (error) {
      window.alert('No se pudo crear la producción: ' + error.message);
    }
  }

  async function duplicateSelectedProduction() {
    return appCommands.duplicateSelectedProduction();
  }

  async function deleteSelectedProduction() {
    return appCommands.deleteSelectedProduction();
  }

  async function updateProductionLayoutFromUi() {
    if (!state.selectedProductionId) return;
    const fields = {
      page_width: Math.max(1, Number(els.productionPageWidthInput.value) || 1920),
      page_height: Math.max(1, Number(els.productionPageHeightInput.value) || 1080),
      preview_background: normalizeColor(els.productionPreviewBackgroundInput.value || '#ffffff'),
    };
    setSelectedProductionLocalFields(fields);
    try {
      await persistSelectedProductionFields(fields);
      if (state.source && state.structure) {
        state.render = buildCurrentRenderJson(state.source, state.materials, state.structure);
        renderSettings();
        renderEditor();
        renderStylesPane();
        renderPreview();
        refreshPdfIfActive();
      }
    } catch (error) {
      window.alert('No se pudo actualizar el formato de producción: ' + error.message);
    }
  }

  async function updateProductionImportModelFromUi() {
    if (!state.selectedProductionId || !els.productionImportModelSelect) return;
    const fields = {
      import_model_id: els.productionImportModelSelect.value || defaultImportModelIdInDomain(state.importModels),
    };
    setSelectedProductionLocalFields(fields);
    renderProductionList();
    try {
      await persistSelectedProductionFields(fields);
    } catch (error) {
      window.alert('No se pudo actualizar el modelo de importación: ' + error.message);
      await initializeDatabase({ silent: true });
    }
  }

  async function updateProductionName(productionId, name) {
    return appCommands.updateProductionName(productionId, name);
  }

  async function updateProductionEpisodeCount(productionId, value) {
    return appCommands.updateProductionEpisodeCount(productionId, value);
  }

  async function loadProductionStyles() {
    if (!state.databasePath || !state.selectedProductionId) return;
    const result = await dbPost('/api/db/load-styles', { production_id: state.selectedProductionId });
    loadStyleObjects(result.styles || []);
  }

  async function loadCurrentEpisode() {
    if (!state.databasePath || !state.selectedProductionId || !state.selectedEpisodeId) {
      return;
    }
    state.isLoadingEpisode = true;
    try {
      const result = await dbPost('/api/db/load-episode', {
        production_id: state.selectedProductionId,
        episode_id: state.selectedEpisodeId,
      });
      if (result.structure && result.structure.settings && !selectedProductionHasStoredSettings(selectedProduction())) {
        setSelectedProductionLocalFields({ settings: stripProductionLayoutFromSettings(result.structure.settings) });
        persistSelectedProductionFields({ settings: selectedProduction().settings }).catch((error) => console.warn(error));
      }
      loadStyleObjects(result.styles || []);
      state.referenceVideo = normalizeReferenceVideo(result.reference);
      state.referenceVideoDuration = null;
      if (result.source) {
        state.source = normalizeSource(result.source, result.source.meta && result.source.meta.loaded_file);
        state.materials = createMaterialsFromSource(state.source);
        state.structure = result.structure
          ? createStructureFromSource(state.source, state.materials, migrateStructure(result.structure))
          : createStructureFromSource(state.source, state.materials, null);
        state.render = result.render || buildCurrentRenderJson(state.source, state.materials, state.structure);
        state.selectedCartelaId = state.structure.cartelas[0] ? state.structure.cartelas[0].id : null;
        applyPreviewSettingsToUi(state.structure.preview_settings);
        state.pngPreviewZoomMode = 'auto';
        state.pngPreviewZoom = null;
      } else {
        state.source = null;
        state.materials = [];
        state.structure = null;
        state.render = null;
        state.selectedCartelaId = null;
        applyPreviewSettingsToUi(defaultPreviewSettings());
        state.pngPreviewZoomMode = 'auto';
        state.pngPreviewZoom = null;
      }
      updateXlsxStatus();
      updateReferenceVideoStatus();
      rebuild();
    } finally {
      state.isLoadingEpisode = false;
    }
  }

  function renderVisiblePanelPreviews() {
    window.requestAnimationFrame(() => {
      if (state.activeTab === 'styles') renderStylePreview(getStyleById(state.selectedStyleId));
      if (state.activeTab === 'structure') renderCartelaPreview();
      if (state.activeTab === 'pdf') renderPdfPreview();
    });
  }

  function createStructureFromSource(source, materials, previousStructure) {
    return createStructureFromSourceWithSettings(source, materials, previousStructure, getProductionSettings());
  }

  function buildCurrentRenderJson(source, materials, structure) {
    return buildRenderJsonInDomain(source, materials, structure, {
      productionSettings: getProductionSettings(),
      productionLayout: getProductionLayout(),
    });
  }

  function rebuild() {
    if (state.source && state.structure) {
      state.render = buildCurrentRenderJson(state.source, state.materials, state.structure);
    }

    renderMeta();
    renderSettings();
    renderCartelaList();
    renderEditor();
    renderPreview();
    renderCartelaPreview();
    refreshPdfIfActive();
  }

  function renderMeta() {
    if (!state.source) {
      const production = selectedProduction();
      const episode = selectedEpisode();
      els.sourceMeta.textContent = production && episode
        ? `${production.name} · ${episode.name} · asocia un archivo de créditos para empezar.`
        : 'Crea o selecciona una producción y un episodio para empezar.';
      updateXlsxStatus();
      return;
    }

    const sheet = state.source.sheet || 'sin hoja';
    els.sourceMeta.textContent = `${sheet} · ${state.materials.length} bloques de diseño · ${state.source.meta.loaded_file || ''}`;
    updateXlsxStatus();
  }

  function setActiveTab(tabName) {
    if (!document.getElementById(`${tabName}Pane`)) tabName = 'settings';
    state.activeTab = tabName;
    els.tabButtons.forEach((button) => button.classList.toggle('active', button.dataset.tab === tabName));
    els.tabPanes.forEach((pane) => pane.classList.toggle('active', pane.id === `${tabName}Pane`));
    if (tabName === 'styles') {
      renderStylesPane();
      window.requestAnimationFrame(() => renderStylePreview(getStyleById(state.selectedStyleId)));
    }
    if (tabName === 'structure') {
      renderCartelaPreview();
      window.requestAnimationFrame(renderCartelaPreview);
    }
    if (tabName === 'pdf') renderPdfPreview();
  }

  function renderSettings() {
    return settingsPanel.renderSettings();
  }

  async function loadSystemFonts(options = {}) {
    return appFonts.loadSystemFonts(options);
  }

  function loadStyleObjects(styleObjects) {
    state.styles = (styleObjects || [])
      .map((style) => normalizeCartelaStyle(style, { name: style.file_name || `${style.id || 'estilo'}.json` }))
      .sort((a, b) => a.name.localeCompare(b.name));
    pruneCurrentRedundantStyleDefaults();
    pruneCurrentRedundantStyleOverrides();
    if (state.source && state.structure) {
      state.render = buildCurrentRenderJson(state.source, state.materials, state.structure);
    }
    renderEditor();
    renderCartelaList();
    renderStylesPane();
    renderPreview();
    refreshPdfIfActive();
  }

  function getEffectiveStyleCartela(style) {
    return getEffectiveStyleCartelaWithSettings(style, getProductionSettings());
  }

  function getEffectiveStyleTitleTypography(style) {
    return getEffectiveStyleTitleTypographyWithSettings(style, getProductionSettings());
  }

  function getEffectiveCartelaTitleTypography(cartela) {
    const style = getStyleById(cartela && cartela.style_id);
    return getEffectiveCartelaTitleTypographyWithSettings(cartela, style, getProductionSettings());
  }

  function baseStyleCartelaFromSettings() {
    return baseStyleCartelaFromSettingsWithSettings(getProductionSettings());
  }

  function getEffectiveStyleBlock(style) {
    return getEffectiveStyleBlockWithSettings(style, getProductionSettings());
  }

  function getStyleById(styleId) {
    if (!styleId) return null;
    return state.styles.find((style) => style.id === styleId) || null;
  }

  function updateTypographySetting(key, fields) {
    return appCommands.updateTypographySetting(key, fields);
  }

  function updateLayoutSetting(fields) {
    return appCommands.updateLayoutSetting(fields);
  }

  function updateSettings(fields) {
    return appCommands.updateSettings(fields);
  }

  function renderCartelaList() {
    return cartelaListPanel.renderCartelaList();
  }

  function renderStylesPane() {
    return stylesPanel.renderStylesPane();
  }

  function renderStylePreview(style) {
    return stylesPanel.renderStylePreview(style);
  }

  function renderCartelaPreview() {
    return cartelaPreviewPanel.renderCartelaPreview();
  }

  function updateStyleName(style, name) {
    return appCommands.updateStyleName(style, name);
  }

  function renderStyleEditor(style) {
    const wrap = document.createElement('div');
    wrap.appendChild(sectionLabel('Cartela'));
    const cartela = getEffectiveStyleCartela(style);
    wrap.appendChild(localSelectRow('Orientación', cartela.orientation, [
      ['horizontal', 'Horizontal'],
      ['vertical', 'Vertical'],
    ], (value) => updateEditableStyleCartela(style, { orientation: value })));
    wrap.appendChild(localNumberRow('Columnas', cartela.columns, 1, 6, (value) => updateEditableStyleCartela(style, { columns: value })));
    wrap.appendChild(localNumberRow('Desplazamiento vertical', cartela.vertical_offset, null, null, (value) => updateEditableStyleCartela(style, { vertical_offset: value })));
    wrap.appendChild(localDurationRow('Duración por página', cartela.duration, (value) => updateEditableStyleCartela(style, { duration: value }), { override: hasStyleCartelaOverride(style, 'duration'), reset: () => resetEditableStyleCartelaOverride(style, 'duration') }));
    wrap.appendChild(localNumberRow('Interlineado', cartela.line_spacing, 0.1, null, (value) => updateEditableStyleCartela(style, { line_spacing: value }), 0.01, { override: hasStyleCartelaOverride(style, 'line_spacing'), reset: () => resetEditableStyleCartelaOverride(style, 'line_spacing') }));
    wrap.appendChild(localNumberRow('Separación entre columnas', cartela.column_gap, 0, null, (value) => updateEditableStyleCartela(style, { column_gap: value }), 1, { override: hasStyleCartelaOverride(style, 'column_gap'), reset: () => resetEditableStyleCartelaOverride(style, 'column_gap') }));
    wrap.appendChild(localNumberRow('Separación cargo/nombre', cartela.role_name_gap, 0, null, (value) => updateEditableStyleCartela(style, { role_name_gap: value }), 1, { override: hasStyleCartelaOverride(style, 'role_name_gap'), reset: () => resetEditableStyleCartelaOverride(style, 'role_name_gap') }));
    wrap.appendChild(localNumberRow('Separación de grupos del origen', cartela.source_group_gap, 0, null, (value) => updateEditableStyleCartela(style, { source_group_gap: value }), 1, { override: hasStyleCartelaOverride(style, 'source_group_gap'), reset: () => resetEditableStyleCartelaOverride(style, 'source_group_gap') }));
    wrap.appendChild(localNumberRow('Separación entre bloques', cartela.block_gap, 0, null, (value) => updateEditableStyleCartela(style, { block_gap: value }), 1, { override: hasStyleCartelaOverride(style, 'block_gap'), reset: () => resetEditableStyleCartelaOverride(style, 'block_gap') }));
    wrap.appendChild(localNumberRow('Separación título/primera fila', cartela.block_title_gap, 0, null, (value) => updateEditableStyleCartela(style, { block_title_gap: value }), 1, { override: hasStyleCartelaOverride(style, 'block_title_gap'), reset: () => resetEditableStyleCartelaOverride(style, 'block_title_gap') }));
    wrap.appendChild(localNumberRow('Margen superior', cartela.page_top_margin, 0, null, (value) => updateEditableStyleCartela(style, { page_top_margin: value }), 1, { override: hasStyleCartelaOverride(style, 'page_top_margin'), reset: () => resetEditableStyleCartelaOverride(style, 'page_top_margin') }));
    wrap.appendChild(localNumberRow('Margen inferior', cartela.page_bottom_margin, 0, null, (value) => updateEditableStyleCartela(style, { page_bottom_margin: value }), 1, { override: hasStyleCartelaOverride(style, 'page_bottom_margin'), reset: () => resetEditableStyleCartelaOverride(style, 'page_bottom_margin') }));
    wrap.appendChild(localNumberRow('Margen izquierdo', cartela.page_left_margin, 0, null, (value) => updateEditableStyleCartela(style, { page_left_margin: value }), 1, { override: hasStyleCartelaOverride(style, 'page_left_margin'), reset: () => resetEditableStyleCartelaOverride(style, 'page_left_margin') }));
    wrap.appendChild(localNumberRow('Margen derecho', cartela.page_right_margin, 0, null, (value) => updateEditableStyleCartela(style, { page_right_margin: value }), 1, { override: hasStyleCartelaOverride(style, 'page_right_margin'), reset: () => resetEditableStyleCartelaOverride(style, 'page_right_margin') }));
    wrap.appendChild(localSelectRow('Repetir nombre de bloque', boolSelectValue(cartela.repeat_block_titles), YES_NO_OPTIONS, (value) => updateEditableStyleCartela(style, { repeat_block_titles: normalizeBoolean(value, true) }), { override: hasStyleCartelaOverride(style, 'repeat_block_titles'), reset: () => resetEditableStyleCartelaOverride(style, 'repeat_block_titles') }));
    wrap.appendChild(localSelectRow('Ajuste automático de texto', boolSelectValue(cartela.auto_text_wrap), YES_NO_OPTIONS, (value) => updateEditableStyleCartela(style, { auto_text_wrap: normalizeBoolean(value, false) }), { override: hasStyleCartelaOverride(style, 'auto_text_wrap'), reset: () => resetEditableStyleCartelaOverride(style, 'auto_text_wrap') }));
    wrap.appendChild(localSelectRow('Capitalización', cartela.text_capitalization, TEXT_CAPITALIZATION_OPTIONS, (value) => updateEditableStyleCartela(style, { text_capitalization: value }), { override: hasStyleCartelaOverride(style, 'text_capitalization'), reset: () => resetEditableStyleCartelaOverride(style, 'text_capitalization') }));
    wrap.appendChild(localSelectRow('Usar capitalización protegida', boolSelectValue(cartela.use_protected_capitalization), YES_NO_OPTIONS, (value) => updateEditableStyleCartela(style, { use_protected_capitalization: normalizeBoolean(value, true) }), { override: hasStyleCartelaOverride(style, 'use_protected_capitalization'), reset: () => resetEditableStyleCartelaOverride(style, 'use_protected_capitalization') }));
    wrap.appendChild(renderStyleTitleTypographyControls(style));

    wrap.appendChild(sectionLabel('Bloque'));
    const block = getEffectiveStyleBlock(style);
    const alignment = block.alignment || {};
    const options = [['left', 'Izquierda'], ['center', 'Centro'], ['right', 'Derecha']];
    wrap.appendChild(localNumberRow('Columnas del bloque', block.columns, 1, 6, (value) => updateEditableStyleBlock(style, { columns: value })));
    wrap.appendChild(localSelectRow('Concatenar filas', boolSelectValue(block.concatenate_rows), YES_NO_OPTIONS, (value) => updateEditableStyleBlock(style, { concatenate_rows: normalizeBoolean(value, false) }), { override: !!(style.block && style.block.concatenate_rows !== undefined), reset: () => resetEditableStyleBlockOverride(style, 'concatenate_rows') }));
    wrap.appendChild(localSelectRow('Forzar estructura cargo/nombre', boolSelectValue(block.force_role_name_columns), YES_NO_OPTIONS, (value) => updateEditableStyleBlock(style, { force_role_name_columns: normalizeBoolean(value, false) }), { override: !!(style.block && style.block.force_role_name_columns !== undefined), reset: () => resetEditableStyleBlockOverride(style, 'force_role_name_columns') }));
    wrap.appendChild(localSelectRow('Alineación cargo', alignment.role || 'right', options, (value) => updateEditableStyleBlockAlignment(style, 'role', value)));
    wrap.appendChild(localSelectRow('Alineación nombre', alignment.name || 'left', options, (value) => updateEditableStyleBlockAlignment(style, 'name', value)));
    wrap.appendChild(localSelectRow('Alineación texto', alignment.text || 'center', options, (value) => updateEditableStyleBlockAlignment(style, 'text', value)));
    wrap.appendChild(localSelectRow('Alineación vertical', block.vertical_align, [
      ['top', 'Arriba'],
      ['center', 'Centrado'],
      ['bottom', 'Abajo'],
    ], (value) => updateEditableStyleBlock(style, { vertical_align: value })));
    wrap.appendChild(renderStyleTypographyControls(style));
    return wrap;
  }

  function updateEditableStyleCartela(style, fields) {
    return appCommands.updateEditableStyleCartela(style, fields);
  }

  function resetEditableStyleCartelaOverride(style, key) {
    return appCommands.resetEditableStyleCartelaOverride(style, key);
  }

  function updateEditableStyleBlock(style, fields) {
    return appCommands.updateEditableStyleBlock(style, fields);
  }

  function updateEditableStyleBlockAlignment(style, key, value) {
    return appCommands.updateEditableStyleBlockAlignment(style, key, value);
  }

  function resetEditableStyleBlockOverride(style, key) {
    return appCommands.resetEditableStyleBlockOverride(style, key);
  }

  function resetEditableStyleBlockAlignmentOverride(style, key) {
    return appCommands.resetEditableStyleBlockAlignmentOverride(style, key);
  }

  function updateStyleAfterOverrideChange(style) {
    return appCommands.updateStyleAfterOverrideChange(style);
  }

  function renderStyleTypographyControls(style) {
    const wrap = document.createElement('div');
    wrap.className = 'block-typography-settings';
    wrap.appendChild(sectionLabel('Tipografía'));
    const settings = getProductionSettings();
    const block = getEffectiveStyleBlock(style);
    const typography = block.typography || {};
    const fontCatalog = getFontCatalog();

    BLOCK_TYPOGRAPHY_FIELDS.forEach(([key, label]) => {
      const base = settings.typography[key];
      const value = { ...base, ...((typography && typography[key]) || {}) };
      const isOverride = hasStyleTypographyOverride(style, key);
      const row = document.createElement('div');
      row.className = 'typography-row block-typography-row' + (isOverride ? ' override-field' : '');
      const labelEl = document.createElement('label');
      labelEl.textContent = label;
      row.appendChild(labelEl);
      const sizeInput = makeFontSizeControl(value.font_size, base.font_size, (fontSize) => updateEditableStyleTypography(style, key, { font_size: fontSize }));
      row.appendChild(sizeInput);

      const fontSelect = makeFontFamilyControl(value.font_family, fontCatalog, (fontFamily) => {
        const nextStyle = getFontStyles(fontFamily)[0] || { style: 'Regular', postscript_name: '' };
        updateEditableStyleTypography(style, key, {
          font_family: fontFamily,
          font_style: nextStyle.style,
          font_postscript_name: nextStyle.postscript_name,
        });
      });
      row.appendChild(fontSelect);

      const styleSelect = makeFontStyleControl(value.font_family, value.font_style, value.font_postscript_name, (fontStyle, postscriptName) => {
        updateEditableStyleTypography(style, key, {
          font_style: fontStyle,
          font_postscript_name: postscriptName,
        });
      });
      row.appendChild(styleSelect);

      const colorInput = fieldControlRegistry.create('color', {
        value: normalizeColor(value.color),
        onInput: (color) => updateEditableStyleTypography(style, key, { color }),
      });
      row.appendChild(colorInput);
      if (isOverride) {
        const resetButton = document.createElement('button');
        resetButton.type = 'button';
        resetButton.textContent = 'Restablecer';
        resetButton.addEventListener('click', () => resetEditableStyleTypographyOverride(style, key));
        row.appendChild(resetButton);
      }
      wrap.appendChild(row);
    });
    return wrap;
  }

  function renderStyleTitleTypographyControls(style) {
    const wrap = document.createElement('div');
    wrap.className = 'block-typography-settings';
    wrap.appendChild(sectionLabel('Tipografía del título de cartela'));
    const base = getProductionSettings().typography.page_header;
    const value = getEffectiveStyleTitleTypography(style).page_header;
    const fontCatalog = getFontCatalog();
    const row = document.createElement('div');
    row.className = 'typography-row block-typography-row' + (hasStyleTitleTypographyOverride(style) ? ' override-field' : '');
    const label = document.createElement('label');
    label.textContent = 'Cabecera';
    row.appendChild(label);

    const sizeInput = makeFontSizeControl(value.font_size, base.font_size, (fontSize) => updateEditableStyleTitleTypography(style, { font_size: fontSize }));
    row.appendChild(sizeInput);

    const fontSelect = makeFontFamilyControl(value.font_family, fontCatalog, (fontFamily) => {
      const nextStyle = getFontStyles(fontFamily)[0] || { style: 'Regular', postscript_name: '' };
      updateEditableStyleTitleTypography(style, {
        font_family: fontFamily,
        font_style: nextStyle.style,
        font_postscript_name: nextStyle.postscript_name,
      });
    });
    row.appendChild(fontSelect);

    const styleSelect = makeFontStyleControl(value.font_family, value.font_style, value.font_postscript_name, (fontStyle, postscriptName) => {
      updateEditableStyleTitleTypography(style, {
        font_style: fontStyle,
        font_postscript_name: postscriptName,
      });
    });
    row.appendChild(styleSelect);

    const colorInput = fieldControlRegistry.create('color', {
      value: normalizeColor(value.color),
      onInput: (color) => updateEditableStyleTitleTypography(style, { color }),
    });
    row.appendChild(colorInput);

    if (hasStyleTitleTypographyOverride(style)) {
      const resetButton = document.createElement('button');
      resetButton.type = 'button';
      resetButton.textContent = 'Restablecer';
      resetButton.addEventListener('click', () => resetEditableStyleTitleTypographyOverride(style));
      row.appendChild(resetButton);
    }
    wrap.appendChild(row);
    return wrap;
  }

  function updateEditableStyleTitleTypography(style, fields) {
    return appCommands.updateEditableStyleTitleTypography(style, fields);
  }

  function resetEditableStyleTitleTypographyOverride(style) {
    return appCommands.resetEditableStyleTitleTypographyOverride(style);
  }

  function updateEditableStyleTypography(style, key, fields) {
    return appCommands.updateEditableStyleTypography(style, key, fields);
  }

  function resetEditableStyleTypographyOverride(style, key) {
    return appCommands.resetEditableStyleTypographyOverride(style, key);
  }

  async function createStyleFromUi() {
    return appCommands.createStyleFromUi();
  }

  async function duplicateSelectedStyle() {
    return appCommands.duplicateSelectedStyle();
  }

  async function deleteSelectedStyle() {
    return appCommands.deleteSelectedStyle();
  }

  function renderEditor() {
    if (!state.source || !state.selectedCartelaId) {
      els.editorTitle.textContent = 'Sin cartela seleccionada';
      els.editorKind.textContent = '';
      els.editorBody.className = 'editor-body empty-state';
      els.editorBody.textContent = 'Asocia un archivo de créditos y selecciona una cartela.';
      renderCartelaPreview();
      return;
    }

    const cartela = getSelectedCartela();
    if (!cartela) return;

    els.editorTitle.textContent = getCartelaDisplayName(cartela, state.materials);
    els.editorKind.innerHTML = `<span class="tag cards">${escapeHtml(cartela.type || 'cartela')}</span>`;
    els.editorBody.className = 'editor-body preview-mode';
    els.editorBody.innerHTML = '';
    els.editorBody.appendChild(renderCartelaFields(cartela));
    els.editorBody.appendChild(sectionLabel('Bloques en esta cartela'));
    els.editorBody.appendChild(renderSourceRefControls(cartela));

    const materialsGrid = document.createElement('div');
    materialsGrid.className = 'cartela-materials-grid';
    materialsGrid.style.gridTemplateColumns = `repeat(${Math.max(1, Number(getEffectiveCartela(cartela).columns) || 1)}, minmax(0, 1fr))`;
    getCartelaRefs(cartela).forEach((ref) => {
      const material = state.materials.find((candidate) => candidate.id === ref);
      materialsGrid.appendChild(renderMaterialEditor(material, ref));
    });
    els.editorBody.appendChild(materialsGrid);
    renderCartelaPreview();
  }

  function renderCartelaFields(cartela) {
    const wrap = document.createElement('div');
    const effectiveCartela = getEffectiveCartela(cartela);
    wrap.appendChild(sectionLabel('Cartela'));
    wrap.appendChild(localCheckboxRow('Incluir en salida', cartela.enabled !== false, (value) => updateSelectedCartela({ enabled: value })));
    wrap.appendChild(renderCartelaStyleControls(cartela));
    if (cartela.manual) wrap.appendChild(manualCartelaActionsRow());
    if (cartela.manual) wrap.appendChild(localInputRow('Nombre de cartela', cartela.manual_name || '', (value) => updateSelectedCartela({ manual_name: value }), { commitOnChange: true }));
    wrap.appendChild(localInputRow('Título de cartela', cartela.title || '', (value) => updateSelectedCartela({ title: value }), { commitOnChange: true }));
    wrap.appendChild(localSelectRow('Orientación', effectiveCartela.orientation || 'horizontal', [
      ['horizontal', 'Horizontal'],
      ['vertical', 'Vertical'],
    ], (value) => updateSelectedCartela({ orientation: value }), { override: hasCartelaOverride(cartela, 'orientation'), reset: () => resetSelectedCartelaOverride('orientation') }));
    wrap.appendChild(localNumberRow('Columnas', Number(effectiveCartela.columns) || 1, 1, 6, (value) => updateSelectedCartela({ columns: value }), 1, { override: hasCartelaOverride(cartela, 'columns'), reset: () => resetSelectedCartelaOverride('columns') }));
    wrap.appendChild(localNumberRow('Desplazamiento vertical', Number(effectiveCartela.vertical_offset) || 0, null, null, (value) => updateSelectedCartela({ vertical_offset: value }), 1, { override: hasCartelaOverride(cartela, 'vertical_offset'), reset: () => resetSelectedCartelaOverride('vertical_offset') }));
    wrap.appendChild(localDurationRow('Duración por página', Number(effectiveCartela.duration) || 0, (value) => updateSelectedCartela({ duration: value }), { override: hasCartelaOverride(cartela, 'duration'), reset: () => resetSelectedCartelaOverride('duration') }));
    wrap.appendChild(localNumberRow('Interlineado', Number(effectiveCartela.line_spacing) || 1.12, 0.1, null, (value) => updateSelectedCartela({ line_spacing: value }), 0.01, { override: hasCartelaOverride(cartela, 'line_spacing'), reset: () => resetSelectedCartelaOverride('line_spacing') }));
    wrap.appendChild(localNumberRow('Separación entre columnas', Number(effectiveCartela.column_gap) || 0, 0, null, (value) => updateSelectedCartela({ column_gap: value }), 1, { override: hasCartelaOverride(cartela, 'column_gap'), reset: () => resetSelectedCartelaOverride('column_gap') }));
    wrap.appendChild(localNumberRow('Separación cargo/nombre', Number(effectiveCartela.role_name_gap) || 0, 0, null, (value) => updateSelectedCartela({ role_name_gap: value }), 1, { override: hasCartelaOverride(cartela, 'role_name_gap'), reset: () => resetSelectedCartelaOverride('role_name_gap') }));
    wrap.appendChild(localNumberRow('Separación de grupos del origen', Number(effectiveCartela.source_group_gap) || 0, 0, null, (value) => updateSelectedCartela({ source_group_gap: value }), 1, { override: hasCartelaOverride(cartela, 'source_group_gap'), reset: () => resetSelectedCartelaOverride('source_group_gap') }));
    wrap.appendChild(localNumberRow('Separación entre bloques', Number(effectiveCartela.block_gap) || 0, 0, null, (value) => updateSelectedCartela({ block_gap: value }), 1, { override: hasCartelaOverride(cartela, 'block_gap'), reset: () => resetSelectedCartelaOverride('block_gap') }));
    wrap.appendChild(localNumberRow('Separación título/primera fila', Number(effectiveCartela.block_title_gap) || 0, 0, null, (value) => updateSelectedCartela({ block_title_gap: value }), 1, { override: hasCartelaOverride(cartela, 'block_title_gap'), reset: () => resetSelectedCartelaOverride('block_title_gap') }));
    wrap.appendChild(localNumberRow('Margen superior', Number(effectiveCartela.page_top_margin) || 0, 0, null, (value) => updateSelectedCartela({ page_top_margin: value }), 1, { override: hasCartelaOverride(cartela, 'page_top_margin'), reset: () => resetSelectedCartelaOverride('page_top_margin') }));
    wrap.appendChild(localNumberRow('Margen inferior', Number(effectiveCartela.page_bottom_margin) || 0, 0, null, (value) => updateSelectedCartela({ page_bottom_margin: value }), 1, { override: hasCartelaOverride(cartela, 'page_bottom_margin'), reset: () => resetSelectedCartelaOverride('page_bottom_margin') }));
    wrap.appendChild(localNumberRow('Margen izquierdo', Number(effectiveCartela.page_left_margin) || 0, 0, null, (value) => updateSelectedCartela({ page_left_margin: value }), 1, { override: hasCartelaOverride(cartela, 'page_left_margin'), reset: () => resetSelectedCartelaOverride('page_left_margin') }));
    wrap.appendChild(localNumberRow('Margen derecho', Number(effectiveCartela.page_right_margin) || 0, 0, null, (value) => updateSelectedCartela({ page_right_margin: value }), 1, { override: hasCartelaOverride(cartela, 'page_right_margin'), reset: () => resetSelectedCartelaOverride('page_right_margin') }));
    wrap.appendChild(localSelectRow('Repetir nombre de bloque', boolSelectValue(effectiveCartela.repeat_block_titles), YES_NO_OPTIONS, (value) => updateSelectedCartela({ repeat_block_titles: normalizeBoolean(value, true) }), { override: hasCartelaOverride(cartela, 'repeat_block_titles'), reset: () => resetSelectedCartelaOverride('repeat_block_titles') }));
    wrap.appendChild(localSelectRow('Ajuste automático de texto', boolSelectValue(effectiveCartela.auto_text_wrap), YES_NO_OPTIONS, (value) => updateSelectedCartela({ auto_text_wrap: normalizeBoolean(value, false) }), { override: hasCartelaOverride(cartela, 'auto_text_wrap'), reset: () => resetSelectedCartelaOverride('auto_text_wrap') }));
    wrap.appendChild(localSelectRow('Capitalización', effectiveCartela.text_capitalization || 'source', TEXT_CAPITALIZATION_OPTIONS, (value) => updateSelectedCartela({ text_capitalization: value }), { override: hasCartelaOverride(cartela, 'text_capitalization'), reset: () => resetSelectedCartelaOverride('text_capitalization') }));
    wrap.appendChild(localSelectRow('Usar capitalización protegida', boolSelectValue(effectiveCartela.use_protected_capitalization), YES_NO_OPTIONS, (value) => updateSelectedCartela({ use_protected_capitalization: normalizeBoolean(value, true) }), { override: hasCartelaOverride(cartela, 'use_protected_capitalization'), reset: () => resetSelectedCartelaOverride('use_protected_capitalization') }));
    wrap.appendChild(renderCartelaImageControls(cartela));
    wrap.appendChild(renderCartelaTitleTypographyControls(cartela));
    wrap.appendChild(renderCartelaBlockStyleControls(cartela));
    wrap.appendChild(localInputRow('Notas', cartela.notes || '', (value) => updateSelectedCartela({ notes: value }), { multiline: true }));
    return wrap;
  }

  function manualCartelaActionsRow() {
    const row = document.createElement('div');
    row.className = 'field-grid';
    const label = document.createElement('label');
    label.textContent = 'Cartela manual';
    const actions = document.createElement('div');
    actions.className = 'source-controls';
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Eliminar cartela';
    deleteButton.addEventListener('click', deleteSelectedManualCartela);
    actions.appendChild(deleteButton);
    row.appendChild(label);
    row.appendChild(actions);
    return row;
  }

  function renderCartelaImageControls(cartela) {
    const wrap = document.createElement('div');
    wrap.className = 'cartela-image-controls';
    wrap.appendChild(sectionLabel('Imágenes asociadas'));

    const actions = document.createElement('div');
    actions.className = 'cartela-image-actions';
    const attachButton = document.createElement('button');
    attachButton.type = 'button';
    attachButton.textContent = 'Añadir imagen';
    attachButton.addEventListener('click', associateCartelaImage);
    actions.appendChild(attachButton);
    wrap.appendChild(actions);

    const images = cartelaImages(cartela);
    if (!images.length) {
      const empty = document.createElement('div');
      empty.className = 'cartela-images-empty';
      empty.textContent = 'Sin imágenes asociadas';
      wrap.appendChild(empty);
      return wrap;
    }

    const tableWrap = document.createElement('div');
    tableWrap.className = 'cartela-images-table-wrap';
    const table = document.createElement('table');
    table.className = 'cartela-images-table';
    const head = document.createElement('thead');
    head.innerHTML = '<tr><th>Archivo</th><th>Escala</th><th>Offset X</th><th>Offset Y</th><th></th></tr>';
    table.appendChild(head);
    const body = document.createElement('tbody');
    images.forEach((image) => {
      const row = document.createElement('tr');
      const fileCell = document.createElement('td');
      const fileName = document.createElement('span');
      fileName.className = 'image-file-name';
      fileName.textContent = image.file_path || image.name || 'Imagen asociada';
      fileName.title = image.file_path || image.name || '';
      fileCell.appendChild(fileName);
      row.appendChild(fileCell);
      row.appendChild(cartelaImageNumberCell(image, 'scale', 0.01, 0.01));
      row.appendChild(cartelaImageNumberCell(image, 'offset_x', null, 1));
      row.appendChild(cartelaImageNumberCell(image, 'offset_y', null, 1));
      const actionsCell = document.createElement('td');
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'compact-action';
      removeButton.textContent = 'Eliminar';
      removeButton.addEventListener('click', () => removeCartelaImage(image.id));
      actionsCell.appendChild(removeButton);
      row.appendChild(actionsCell);
      body.appendChild(row);
    });
    table.appendChild(body);
    tableWrap.appendChild(table);
    wrap.appendChild(tableWrap);

    return wrap;
  }

  function cartelaImageNumberCell(image, field, min, step) {
    const cell = document.createElement('td');
    const fallbackValue = field === 'scale' ? 1 : 0;
    const input = fieldControlRegistry.create('number', {
      value: Number(image[field]) || fallbackValue,
      min,
      step,
      fallbackValue,
      onInput: (value) => updateCartelaImage(image.id, { [field]: value }),
    });
    cell.appendChild(input);
    return cell;
  }

  function renderCartelaStyleControls(cartela) {
    const wrap = document.createElement('div');
    wrap.className = 'source-controls';
    const select = fieldControlRegistry.create('select', {
      value: cartela.style_id || '',
      options: [
        ['', 'Sin estilo'],
        ...state.styles.map((style) => [style.id, style.name]),
      ],
      onInput: async (nextStyleId) => {
        const previousStyleId = cartela.style_id || '';
        if (nextStyleId === previousStyleId) return;
        const action = await chooseCartelaStyleChangeAction(cartela, previousStyleId, nextStyleId);
        if (action === 'cancel') {
          select.value = previousStyleId;
          return;
        }
        cartela.style_id = nextStyleId;
        if (action === 'discard') clearCartelaStyleOverrides(cartela);
        state.render = buildCurrentRenderJson(state.source, state.materials, state.structure);
        renderCartelaList();
        renderEditor();
        renderPreview();
        refreshPdfIfActive();
      },
    });

    wrap.appendChild(select);
    return wrap;
  }

  async function chooseCartelaStyleChangeAction(cartela, previousStyleId, nextStyleId) {
    if (!previousStyleId || !hasCartelaStyleOverrides(cartela)) return 'discard';
    const previousStyle = getStyleById(previousStyleId);
    const nextStyle = getStyleById(nextStyleId);
    const message = `La cartela tiene overrides sobre "${previousStyle ? previousStyle.name : 'el estilo actual'}". ¿Qué quieres hacer al cambiar a "${nextStyle ? nextStyle.name : 'Sin estilo'}"?`;
    const native = nativeBridge();
    if (native && native.chooseStyleOverrideAction) {
      const result = await native.chooseStyleOverrideAction({ message });
      return result && result.action ? result.action : 'cancel';
    }
    const response = window.prompt(`${message}\n\nEscribe C para conservar, D para descartar o X para cancelar.`, 'D');
    if (/^c/i.test(response || '')) return 'keep';
    if (/^d/i.test(response || '')) return 'discard';
    return 'cancel';
  }

  function renderCartelaBlockStyleControls(cartela) {
    const wrap = document.createElement('div');
    wrap.appendChild(sectionLabel('Formato del bloque'));
    const value = getEffectiveCartelaBlockStyle(cartela);
    const alignment = value.alignment || {};
    const options = [
      ['left', 'Izquierda'],
      ['center', 'Centro'],
      ['right', 'Derecha'],
    ];
    wrap.appendChild(localNumberRow('Columnas del bloque', Number(value.columns) || 1, 1, 6, (next) => updateSelectedCartelaBlockStyle({ columns: next }), 1, { override: !!(cartela.block_style && cartela.block_style.columns !== undefined), reset: () => resetSelectedCartelaBlockOverride('columns') }));
    wrap.appendChild(localSelectRow('Concatenar filas', boolSelectValue(value.concatenate_rows), YES_NO_OPTIONS, (next) => updateSelectedCartelaBlockStyle({ concatenate_rows: normalizeBoolean(next, false) }), { override: !!(cartela.block_style && cartela.block_style.concatenate_rows !== undefined), reset: () => resetSelectedCartelaBlockOverride('concatenate_rows') }));
    wrap.appendChild(localSelectRow('Forzar estructura cargo/nombre', boolSelectValue(value.force_role_name_columns), YES_NO_OPTIONS, (next) => updateSelectedCartelaBlockStyle({ force_role_name_columns: normalizeBoolean(next, false) }), { override: !!(cartela.block_style && cartela.block_style.force_role_name_columns !== undefined), reset: () => resetSelectedCartelaBlockOverride('force_role_name_columns') }));
    wrap.appendChild(localSelectRow('Alineación cargo', alignment.role || 'right', options, (next) => updateSelectedCartelaBlockAlignment('role', next), { override: hasCartelaBlockAlignmentOverride(cartela, 'role'), reset: () => resetSelectedCartelaBlockAlignmentOverride('role') }));
    wrap.appendChild(localSelectRow('Alineación nombre', alignment.name || 'left', options, (next) => updateSelectedCartelaBlockAlignment('name', next), { override: hasCartelaBlockAlignmentOverride(cartela, 'name'), reset: () => resetSelectedCartelaBlockAlignmentOverride('name') }));
    wrap.appendChild(localSelectRow('Alineación texto', alignment.text || 'center', options, (next) => updateSelectedCartelaBlockAlignment('text', next), { override: hasCartelaBlockAlignmentOverride(cartela, 'text'), reset: () => resetSelectedCartelaBlockAlignmentOverride('text') }));
    wrap.appendChild(localSelectRow('Alineación vertical del bloque', value.vertical_align || 'top', [
      ['top', 'Arriba'],
      ['center', 'Centrado'],
      ['bottom', 'Abajo'],
    ], (next) => updateSelectedCartelaBlockStyle({ vertical_align: next }), { override: !!(cartela.block_style && cartela.block_style.vertical_align !== undefined), reset: () => resetSelectedCartelaBlockOverride('vertical_align') }));
    wrap.appendChild(renderCartelaBlockTypographyControls(cartela, value.typography || {}));
    return wrap;
  }

  function renderSourceRefControls(cartela) {
    const wrap = document.createElement('div');
    wrap.className = 'source-controls';

    const select = fieldControlRegistry.create('select', {
      value: state.materials[0] ? state.materials[0].id : '',
      options: state.materials.map((material) => [
        material.id,
        `${material.group || '-'} · ${material.title || material.id}`,
      ]),
    });

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.textContent = 'Añadir bloque';
    addButton.addEventListener('click', () => {
      moveMaterialToCartela(state.structure, select.value, cartela);
      rebuild();
    });

    wrap.appendChild(select);
    wrap.appendChild(addButton);
    return wrap;
  }

  function renderMaterialEditor(material, ref) {
    const wrap = document.createElement('div');
    wrap.className = 'material-panel';

    if (!material) {
      wrap.innerHTML = `<div class="material-header"><strong>Fuente no encontrada</strong><span>${escapeHtml(ref)}</span></div>`;
      return wrap;
    }

    const header = document.createElement('div');
    header.className = 'material-header';
    const isLocked = sourceRefIsLocked(getSelectedCartela(), ref);
    header.innerHTML = `
      <div>
        <strong>${escapeHtml(material.title || 'Sin titulo')}</strong>
        <span>${escapeHtml(material.type || '')} · ${(material.items || []).length} items${isLocked ? ' · bloqueado' : ''}</span>
      </div>
    `;

    const lockButton = document.createElement('button');
    lockButton.type = 'button';
    lockButton.className = 'icon-button block-lock-button' + (isLocked ? ' active' : '');
    lockButton.textContent = isLocked ? '🔒' : '🔓';
    lockButton.title = isLocked ? 'Desbloquear actualización desde XLS' : 'Bloquear actualización desde XLS';
    lockButton.setAttribute('aria-label', lockButton.title);
    lockButton.addEventListener('click', () => toggleSourceRefLock(ref));

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.textContent = 'Quitar';
    removeButton.addEventListener('click', () => {
      const cartela = getSelectedCartela();
      if (!cartela) return;
      cartela.pages = (cartela.pages || []).map((page) => ({
        ...page,
        source_refs: (page.source_refs || []).filter((sourceRef) => sourceRef !== ref),
      }));
      cartela.pages.forEach((page) => {
        if (page.source_ref_settings) delete page.source_ref_settings[ref];
      });
      rebuild();
    });
    const actions = document.createElement('div');
    actions.className = 'material-actions';
    actions.appendChild(lockButton);
    actions.appendChild(removeButton);
    header.appendChild(actions);
    wrap.appendChild(header);

    wrap.appendChild(inputRow('Título del bloque', material.id, 'title', material.default_title || ''));

    if (material.type === 'music_licenses') {
      wrap.appendChild(renderMusicThemesEditor(material));
      return wrap;
    }

    const breakUnits = getMaterialContentItems(material);
    breakUnits.forEach((item, index) => {
      const isLastItem = index === breakUnits.length - 1;
      wrap.appendChild(renderItemEditor(item, material.id, isLastItem));
    });
    return wrap;
  }

  function toggleSourceRefLock(ref) {
    const settings = ensureCartelaSourceRefSettings(getSelectedCartela(), ref);
    if (!settings) return;
    if (settings.locked) {
      delete settings.locked;
      delete settings.frozen_material;
    } else {
      const material = state.materials.find((candidate) => candidate.id === ref);
      if (!material) return;
      settings.locked = true;
      settings.frozen_material = normalizeFrozenMaterial(material);
    }
    rebuild();
  }

  function renderBlockAlignmentControls(material, ref) {
    const wrap = document.createElement('div');
    const alignment = getSelectedBlockAlignment(ref, material);
    const options = [
      ['left', 'Izquierda'],
      ['center', 'Centro'],
      ['right', 'Derecha'],
    ];

    if (!materialHasPairedText(material)) {
      wrap.appendChild(localSelectRow('Alineación texto', alignment.text || 'center', options, (value) => updateSelectedBlockAlignment(ref, { text: value })));
      return wrap;
    }

    wrap.appendChild(localSelectRow('Alineación cargo', alignment.role || 'right', options, (value) => updateSelectedBlockAlignment(ref, { role: value })));
    wrap.appendChild(localSelectRow('Alineación nombre', alignment.name || 'left', options, (value) => updateSelectedBlockAlignment(ref, { name: value })));
    return wrap;
  }

  function renderCartelaBlockTypographyControls(cartela, overrides) {
    const wrap = document.createElement('div');
    wrap.className = 'block-typography-settings';
    wrap.appendChild(sectionLabel('Tipografía del bloque'));

    const settings = getProductionSettings();
    const fontCatalog = getFontCatalog();

    BLOCK_TYPOGRAPHY_FIELDS.forEach(([key, label]) => {
      const base = settings.typography[key];
      const override = overrides[key] || {};
      const value = { ...base, ...override };
      const isOverride = hasCartelaBlockTypographyOverride(cartela, key);
      const row = document.createElement('div');
      row.className = 'typography-row block-typography-row' + (isOverride ? ' override-field' : '');

      const labelEl = document.createElement('label');
      labelEl.textContent = label;
      row.appendChild(labelEl);

      const sizeInput = makeFontSizeControl(value.font_size, base.font_size, (fontSize) => updateSelectedCartelaBlockTypography(key, { font_size: fontSize }));
      sizeInput.placeholder = String(base.font_size);
      row.appendChild(sizeInput);

      const fontSelect = makeFontFamilyControl(value.font_family, fontCatalog, (fontFamily) => {
        const nextStyle = getFontStyles(fontFamily)[0] || { style: 'Regular', postscript_name: '' };
        updateSelectedCartelaBlockTypography(key, {
          font_family: fontFamily,
          font_style: nextStyle.style,
          font_postscript_name: nextStyle.postscript_name,
        }, { rerenderEditor: true });
      });
      row.appendChild(fontSelect);

      const styleSelect = makeFontStyleControl(value.font_family, value.font_style, value.font_postscript_name, (fontStyle, postscriptName) => {
        updateSelectedCartelaBlockTypography(key, {
          font_style: fontStyle,
          font_postscript_name: postscriptName,
        });
      });
      row.appendChild(styleSelect);

      const colorInput = fieldControlRegistry.create('color', {
        value: normalizeColor(value.color),
        onInput: (color) => updateSelectedCartelaBlockTypography(key, { color }),
      });
      row.appendChild(colorInput);

      if (isOverride) {
        const resetButton = document.createElement('button');
        resetButton.type = 'button';
        resetButton.textContent = 'Restablecer';
        resetButton.addEventListener('click', () => resetSelectedCartelaBlockTypographyOverride(key));
        row.appendChild(resetButton);
      }

      wrap.appendChild(row);
    });

    return wrap;
  }

  function renderCartelaTitleTypographyControls(cartela) {
    const wrap = document.createElement('div');
    wrap.className = 'block-typography-settings';
    wrap.appendChild(sectionLabel('Tipografía del título de cartela'));

    const settings = getProductionSettings();
    const fontCatalog = getFontCatalog();
    const key = 'page_header';
    const label = 'Cabecera';
    const base = getEffectiveStyleTitleTypography(getStyleById(cartela && cartela.style_id)).page_header;
    const override = cartela && cartela.title_typography && cartela.title_typography[key] ? cartela.title_typography[key] : {};
    const value = { ...base, ...override };
    const isOverride = hasCartelaTitleTypographyOverride(cartela);
    const row = document.createElement('div');
    row.className = 'typography-row block-typography-row' + (isOverride ? ' override-field' : '');

    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    row.appendChild(labelEl);

    const sizeInput = makeFontSizeControl(value.font_size, base.font_size, (fontSize) => updateSelectedCartelaTitleTypography({ font_size: fontSize }));
    sizeInput.placeholder = String(base.font_size);
    row.appendChild(sizeInput);

    const fontSelect = makeFontFamilyControl(value.font_family, fontCatalog, (fontFamily) => {
      const nextStyle = getFontStyles(fontFamily)[0] || { style: 'Regular', postscript_name: '' };
      updateSelectedCartelaTitleTypography({
        font_family: fontFamily,
        font_style: nextStyle.style,
        font_postscript_name: nextStyle.postscript_name,
      }, { rerenderEditor: true });
    });
    row.appendChild(fontSelect);

    const styleSelect = makeFontStyleControl(value.font_family, value.font_style, value.font_postscript_name, (fontStyle, postscriptName) => {
      updateSelectedCartelaTitleTypography({
        font_style: fontStyle,
        font_postscript_name: postscriptName,
      });
    });
    row.appendChild(styleSelect);

    const colorInput = fieldControlRegistry.create('color', {
      value: normalizeColor(value.color),
      onInput: (color) => updateSelectedCartelaTitleTypography({ color }),
    });
    row.appendChild(colorInput);

    if (isOverride) {
      const resetButton = document.createElement('button');
      resetButton.type = 'button';
      resetButton.textContent = 'Restablecer';
      resetButton.addEventListener('click', resetSelectedCartelaTitleTypographyOverride);
      row.appendChild(resetButton);
    }

    wrap.appendChild(row);
    return wrap;
  }

  function renderBlockTypographyControls(ref) {
    const wrap = document.createElement('div');
    wrap.className = 'block-typography-settings';
    wrap.appendChild(sectionLabel('Tipografía del bloque'));

    const settings = getProductionSettings();
    const overrides = getSelectedBlockTypography(ref);
    const fontCatalog = getFontCatalog();

    BLOCK_TYPOGRAPHY_FIELDS.forEach(([key, label]) => {
      const base = settings.typography[key];
      const override = overrides[key] || {};
      const value = { ...base, ...override };
      const row = document.createElement('div');
      row.className = 'typography-row block-typography-row';

      const labelEl = document.createElement('label');
      labelEl.textContent = label;
      row.appendChild(labelEl);

      const sizeInput = makeFontSizeControl(value.font_size, base.font_size, (fontSize) => updateSelectedBlockTypography(ref, key, { font_size: fontSize }));
      sizeInput.placeholder = String(base.font_size);
      row.appendChild(sizeInput);

      const fontSelect = makeFontFamilyControl(value.font_family, fontCatalog, (fontFamily) => {
        const nextStyle = getFontStyles(fontFamily)[0] || { style: 'Regular', postscript_name: '' };
        updateSelectedBlockTypography(ref, key, {
          font_family: fontFamily,
          font_style: nextStyle.style,
          font_postscript_name: nextStyle.postscript_name,
        }, { rerenderEditor: true });
      });
      row.appendChild(fontSelect);

      const styleSelect = makeFontStyleControl(value.font_family, value.font_style, value.font_postscript_name, (fontStyle, postscriptName) => {
        updateSelectedBlockTypography(ref, key, {
          font_style: fontStyle,
          font_postscript_name: postscriptName,
        });
      });
      row.appendChild(styleSelect);

      const colorInput = fieldControlRegistry.create('color', {
        value: normalizeColor(value.color),
        onInput: (color) => updateSelectedBlockTypography(ref, key, { color }),
      });
      row.appendChild(colorInput);

      wrap.appendChild(row);
    });

    const resetButton = document.createElement('button');
    resetButton.type = 'button';
    resetButton.textContent = 'Restablecer tipografía del bloque';
    resetButton.addEventListener('click', () => resetSelectedBlockTypography(ref));
    wrap.appendChild(resetButton);
    return wrap;
  }

  function renderMusicThemesEditor(material) {
    const wrap = document.createElement('div');
    wrap.className = 'music-themes';
    const themes = groupMusicLicenseThemes(getMaterialContentItems(material), state.structure.overrides || {});
    themes.forEach((theme, index) => {
      const themeWrap = document.createElement('div');
      themeWrap.className = 'music-theme';
      const header = document.createElement('div');
      header.className = 'music-theme-header';
      header.textContent = `Tema ${index + 1}`;
      themeWrap.appendChild(header);
      theme.lines.forEach((line, lineIndex) => {
        const row = document.createElement('div');
        row.className = 'preview-line music-line' + (lineIndex === 0 ? ' theme-title' : '');
        row.innerHTML = `<div class="row-label">Fila ${line.row}</div>`;
        row.appendChild(makePreviewInput(line.id, 'value', line.value || '', 'line-input'));
        themeWrap.appendChild(row);
      });
      wrap.appendChild(themeWrap);
    });
    return wrap;
  }

  function renderItemEditor(item, materialId, isLastItem) {
    const row = document.createElement('div');
    const cartela = getSelectedCartela();
    const orientation = cartela && cartela.orientation ? cartela.orientation : 'horizontal';

    if (item.kind === 'credit' || item.kind === 'crew_credit') {
      row.className = `preview-credit ${orientation}`;
      row.innerHTML = `<div class="row-label">Fila ${item.row}</div>`;
      const roleWrap = document.createElement('div');
      roleWrap.className = 'preview-role';
      roleWrap.appendChild(makePreviewInput(item.id, 'role', item.role || '', 'role-input'));

      const namesWrap = document.createElement('div');
      namesWrap.className = 'preview-names';
      (item.names || []).forEach((name, nameIndex) => {
        const nameLine = document.createElement('div');
        nameLine.className = 'preview-name-line';
        nameLine.appendChild(makePreviewInput(name.id, 'name', name.name || '', 'name-input'));
        namesWrap.appendChild(nameLine);
      });

      row.appendChild(roleWrap);
      row.appendChild(namesWrap);
      return row;
    }

    if (item.kind === 'cast') {
      row.className = `preview-credit ${orientation}`;
      row.innerHTML = `<div class="row-label">Fila ${item.row}</div>`;
      const actorWrap = document.createElement('div');
      actorWrap.className = 'preview-role';
      actorWrap.appendChild(makePreviewInput(item.id, 'actor', item.actor || '', 'role-input'));
      const characterWrap = document.createElement('div');
      characterWrap.className = 'preview-names';
      characterWrap.appendChild(makePreviewInput(item.id, 'character', item.character || '', 'name-input'));
      row.appendChild(actorWrap);
      row.appendChild(characterWrap);
      return row;
    }

    if (item.kind === 'section') {
      row.className = 'preview-section';
      row.innerHTML = `<div class="row-label">Fila ${item.row}</div>`;
      row.appendChild(makePreviewInput(item.id, 'title', item.title || '', 'section-input'));
      return row;
    }

    if (item.kind === 'list_item' || item.kind === 'closing_line') {
      row.className = 'preview-line';
      row.innerHTML = `<div class="row-label">Fila ${item.row}</div>`;
      row.appendChild(makePreviewInput(item.id, 'value', item.value || '', 'line-input'));
      return row;
    }

    row.className = 'line-row';
    row.innerHTML = `<div class="row-label">Fila ${item.row || '-'}<br>${escapeHtml(item.kind || 'item')}</div><pre>${escapeHtml(JSON.stringify(item, null, 2))}</pre>`;
    return row;
  }

  function renderNames(names) {
    const wrap = document.createElement('div');
    wrap.className = 'names-list';
    names.forEach((name) => {
      const item = document.createElement('div');
      item.className = 'chip';
      item.innerHTML = `<span>Fila ${name.row}</span>`;
      item.appendChild(makeInput(name.id, 'name', name.name || ''));
      wrap.appendChild(item);
    });
    return wrap;
  }

  function addEmptyCartela() {
    return appCommands.addEmptyCartela();
  }

  function deleteSelectedManualCartela() {
    return appCommands.deleteSelectedManualCartela();
  }

  function moveSelectedCartelaVisualOrder(cartelaId, delta) {
    return appCommands.moveSelectedCartelaVisualOrder(cartelaId, delta);
  }

  function updateSelectedCartela(fields) {
    return appCommands.updateSelectedCartela(fields);
  }

  function resetSelectedCartelaOverride(key) {
    return appCommands.resetSelectedCartelaOverride(key);
  }

  function updateSelectedCartelaBlockStyle(fields) {
    return appCommands.updateSelectedCartelaBlockStyle(fields);
  }

  function resetSelectedCartelaBlockOverride(key) {
    return appCommands.resetSelectedCartelaBlockOverride(key);
  }

  function updateSelectedCartelaBlockAlignment(key, value) {
    return appCommands.updateSelectedCartelaBlockAlignment(key, value);
  }

  function resetSelectedCartelaBlockAlignmentOverride(key) {
    return appCommands.resetSelectedCartelaBlockAlignmentOverride(key);
  }

  function resetSelectedCartelaBlockTypographyOverride(key) {
    return appCommands.resetSelectedCartelaBlockTypographyOverride(key);
  }

  function updateSelectedCartelaBlockTypography(key, fields, options = {}) {
    return appCommands.updateSelectedCartelaBlockTypography(key, fields, options);
  }

  function resetSelectedCartelaTitleTypographyOverride() {
    return appCommands.resetSelectedCartelaTitleTypographyOverride();
  }

  function updateSelectedCartelaTitleTypography(fields, options = {}) {
    return appCommands.updateSelectedCartelaTitleTypography(fields, options);
  }

  function pruneCurrentRedundantStyleOverrides() {
    pruneRedundantStyleOverridesInDomain(state.structure);
  }

  function pruneCurrentRedundantStyleDefaults() {
    pruneRedundantStyleDefaultsInDomain(state.styles, getProductionSettings());
  }

  async function writeStyleFile(style, options = {}) {
    const data = serializeCartelaStyle(style);
    await dbPost('/api/db/save-style', {
      production_id: state.selectedProductionId,
      data,
    });
    return { canceled: false, name: style.name };
  }

  function getSelectedCartela() {
    return state.structure && state.structure.cartelas
      ? state.structure.cartelas.find((cartela) => cartela.id === state.selectedCartelaId)
      : null;
  }

  function getEffectiveCartela(cartela) {
    const style = getStyleById(cartela && cartela.style_id);
    return {
      ...(style ? getEffectiveStyleCartela(style) : baseStyleCartelaFromSettings()),
      ...(cartela || {}),
    };
  }

  function getCartelaStyleBlock(cartela) {
    const style = getStyleById(cartela && cartela.style_id);
    return style ? getEffectiveStyleBlock(style) : null;
  }

  function getSelectedBlockAlignment(ref, material) {
    const cartela = getSelectedCartela();
    const page = findPageWithRef(cartela, ref);
    return getSourceRefAlignment(page, ref, material, cartela);
  }

  function updateSelectedBlockAlignment(ref, fields) {
    return appCommands.updateSelectedBlockAlignment(ref, fields);
  }

  function getSelectedBlockVerticalAlign(ref) {
    const cartela = getSelectedCartela();
    const page = findPageWithRef(cartela, ref);
    return getSourceRefVerticalAlign(page, ref);
  }

  function updateSelectedBlockVerticalAlign(ref, value) {
    return appCommands.updateSelectedBlockVerticalAlign(ref, value);
  }

  function getSelectedBlockTypography(ref) {
    const cartela = getSelectedCartela();
    const page = findPageWithRef(cartela, ref);
    return getSourceRefTypography(page, ref);
  }

  function updateSelectedBlockTypography(ref, key, fields, options = {}) {
    return appCommands.updateSelectedBlockTypography(ref, key, fields, options);
  }

  function resetSelectedBlockTypography(ref) {
    return appCommands.resetSelectedBlockTypography(ref);
  }

  function getSelectedBlockColumns(ref) {
    const cartela = getSelectedCartela();
    const page = findPageWithRef(cartela, ref);
    return getSourceRefColumns(page, ref);
  }

  function updateSelectedBlockColumns(ref, columns) {
    return appCommands.updateSelectedBlockColumns(ref, columns);
  }

  function inputRow(label, refId, field, fallback, options) {
    const row = document.createElement('div');
    row.className = 'field-grid';
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    row.appendChild(labelEl);
    row.appendChild(makeInput(refId, field, fallback, options));
    return row;
  }

  function makeInput(refId, field, fallback, options) {
    const opts = options || {};
    const current = resolveOverride(state.structure.overrides || {}, refId, field, fallback);
    const input = fieldControlRegistry.create('text', {
      value: Array.isArray(current) ? current.join('\n') : (current || ''),
      multiline: opts.multiline,
      rows: opts.multiline ? 1 : undefined,
      spellcheck: opts.multiline ? false : undefined,
      onInput: (rawValue, control) => {
        if (opts.multiline) resizeMultilineInput(control);
        const parsedValue = opts.parse ? opts.parse(rawValue) : rawValue;
        const parsedFallback = opts.fallback !== undefined ? opts.fallback : fallback;
        setEditableOverride(refId, field, parsedValue, parsedFallback);
        state.render = buildCurrentRenderJson(state.source, state.materials, state.structure);
        renderPreview();
      },
    });
    if (opts.multiline) window.requestAnimationFrame(() => resizeMultilineInput(input));
    return input;
  }

  function makePreviewInput(refId, field, fallback, className) {
    const input = makeInput(refId, field, fallback, { multiline: true });
    input.classList.add('preview-input', className);
    configureTextWrapInput(input, normalizeBoolean(getEffectiveCartela(getSelectedCartela() || {}).auto_text_wrap, false));
    return input;
  }

  function makeVisualInput(refId, field, fallback, className, options = {}) {
    const input = makeInput(refId, field, fallback, { multiline: true });
    input.classList.add('visual-input', className);
    input.setAttribute('aria-label', field);
    if (options.styleKey) applyTypography(input, options.styleKey, options);
    if (options.textAlign) input.style.textAlign = options.textAlign;
    configureTextWrapInput(input, normalizeBoolean(options.autoWrap, false));
    window.requestAnimationFrame(() => resizeMultilineInput(input));
    return input;
  }

  function configureTextWrapInput(input, autoWrap) {
    input.wrap = autoWrap ? 'soft' : 'off';
    input.style.whiteSpace = autoWrap ? 'pre-wrap' : 'pre';
    input.style.overflowWrap = autoWrap ? 'break-word' : 'normal';
  }

  function resizeMultilineInput(input) {
    if (!input || input.tagName !== 'TEXTAREA') return;
    input.style.height = 'auto';
    input.style.height = `${Math.max(input.scrollHeight, 30)}px`;
  }

  function makeVisualStaticText(value, className, styleKey, options = {}) {
    const text = String(value || '').trim();
    if (!text) return null;
    const element = document.createElement('div');
    element.className = `visual-static ${className}`;
    element.textContent = transformCartelaText(text, options.cartela, options.settings || getProductionSettings());
    applyTypography(element, styleKey, options);
    applyTextWrapStyle(element, options.cartela);
    if (options.textAlign) element.style.textAlign = options.textAlign;
    return element;
  }

  function applyTypography(element, key, options = {}) {
    const settings = normalizeSettings(options.settings || getProductionSettings());
    const typography = {
      ...settings.typography[key],
      ...((options.typography && options.typography[key]) || {}),
    };
    const scale = Number(options.multiplier) || 1;
    const lineScale = Number(options.lineMultiplier) || 1;
    element.style.fontFamily = typography.font_family;
    element.style.fontSize = `${Math.max(1, Number(typography.font_size) || 1) * scale}px`;
    element.style.lineHeight = String(settings.layout.line_spacing * lineScale);
    element.style.fontWeight = fontWeightFromStyle(typography.font_style);
    element.style.fontStyle = /italic|oblique/i.test(typography.font_style || '') ? 'italic' : 'normal';
    element.style.color = typography.color;
  }

  function getRenderLayout() {
    return settingsWithProductionLayout(getProductionSettings(), getProductionLayout()).layout;
  }

  function setEditableOverride(refId, field, value, fallback) {
    setOverrideInDomain(state.structure, refId, field, value, fallback);
  }

  function sectionLabel(text) {
    const label = document.createElement('div');
    label.className = 'section-title';
    label.textContent = text;
    return label;
  }

  function setPreview(kind) {
    state.preview = kind;
    if (els.structureTab) els.structureTab.classList.toggle('active', kind === 'structure');
    if (els.renderTab) els.renderTab.classList.toggle('active', kind === 'render');
    renderPreview();
  }

  function renderPreview() {
    if (!state.source && !state.structure && !state.render) {
      if (els.jsonPreview) els.jsonPreview.value = '';
      return;
    }
    if (els.jsonPreview) {
      els.jsonPreview.value = JSON.stringify(state.preview === 'structure' ? getStructureJsonForOutput() : state.render, null, 2);
    }
    scheduleAutosave();
  }

  function getStructureJsonForOutput() {
    return structureJsonForOutput(state.structure, state.materials);
  }

  function renderVisualPreview() {
    if (!state.render) {
      els.visualPreview.className = 'visual-preview empty-state';
      els.visualPreview.textContent = 'Asocia un archivo de créditos para ver el Preview.';
      return;
    }

    els.visualPreview.className = 'visual-preview';
    els.visualPreview.innerHTML = '';
    (state.render.cartelas || []).forEach((cartela) => {
      const layout = getRenderLayout();
      const cartelaEl = document.createElement('section');
      cartelaEl.className = 'render-cartela';

      const headerEl = document.createElement('div');
      headerEl.className = 'render-cartela-header';
      const labelEl = document.createElement('strong');
      labelEl.textContent = cartela.label || cartela.id;
      headerEl.appendChild(labelEl);
      const metaEl = document.createElement('span');
      metaEl.textContent = `${cartela.orientation || 'horizontal'} · ${cartela.columns || 1} col · ${cartela.duration || 0}s`;
      headerEl.appendChild(metaEl);
      cartelaEl.appendChild(headerEl);

      (cartela.pages || []).forEach((cartelaPage) => {
        const pageEl = document.createElement('div');
        pageEl.className = 'render-page';
        const pageLabelEl = document.createElement('div');
        pageLabelEl.className = 'render-page-label';
        pageLabelEl.appendChild(makeVisualInput(cartelaPage.id, 'title', cartelaPage.title || '', 'render-page-title-input', {
          autoWrap: cartela.auto_text_wrap,
          styleKey: 'page_header',
          multiplier: cartela.font_size_multiplier,
          lineMultiplier: cartela.line_spacing_multiplier,
          typography: cartela.title_typography,
        }));
        pageEl.appendChild(pageLabelEl);

        (cartelaPage.blocks || []).forEach((block) => {
          pageEl.appendChild(renderVisualBlock(block, cartela, layout));
        });

        cartelaEl.appendChild(pageEl);
      });

      els.visualPreview.appendChild(cartelaEl);
    });
  }

  function refreshPdfIfActive() {
    if (state.activeTab === 'pdf') renderPdfPreview();
  }

  function renderPdfPreview() {
    if (!state.render) {
      els.pdfPreview.className = 'pdf-preview empty-state';
      els.pdfPreview.textContent = 'Asocia un archivo de créditos para ver las páginas.';
      updatePdfToolbar(0, 0);
      return;
    }

    const layout = getRenderLayout();
    const pages = getCurrentPhysicalPages();
    if (state.pdfPageIndex >= pages.length) state.pdfPageIndex = Math.max(0, pages.length - 1);
    if (state.pdfPageIndex < 0) state.pdfPageIndex = 0;
    const page = pages[state.pdfPageIndex];
    updatePdfToolbar(state.pdfPageIndex + 1, pages.length);

    els.pdfPreview.className = 'pdf-preview';
    els.pdfPreview.innerHTML = '';

    if (!page) {
      els.pdfPreview.className = 'pdf-preview empty-state';
      els.pdfPreview.textContent = 'No hay páginas activas.';
      return;
    }

    renderPreviewAnimationFrame();
    updatePngZoomStatus();
  }

  function getPreviewAnimationPlan() {
    if (!state.render || !state.structure) return null;
    const cacheKey = previewAnimationPlanKey();
    if (previewPlanCache.render === state.render && previewPlanCache.key === cacheKey) {
      return previewPlanCache.plan;
    }
    const layout = getRenderLayout();
    const fps = currentMovieFps();
    const segments = readMovieSegmentSettings(fps);
    if (getMovieMode() === 'scroll') {
      const groups = getSelectedScrollCartelaGroups();
      if (!groups.length) return cachePreviewAnimationPlan(cacheKey, null);
      const sourceFrames = getSelectedScrollSourceFrames(fps);
      return cachePreviewAnimationPlan(cacheKey, buildScrollMoviePlan({
        fps,
        groups,
        layout,
        segments,
        sourceFrames,
        targetFrames: movieTargetDurationFrames(fps),
        useTargetFrames: movieUsesCustomTargetDuration(),
      }));
    }
    const selectedPages = getSelectedMoviePages();
    if (!selectedPages.length) return cachePreviewAnimationPlan(cacheKey, null);
    return cachePreviewAnimationPlan(cacheKey, buildPageMoviePlan({
      fps,
      groups: getSelectedMoviePageGroups(),
      layout,
      segments,
      selectedPages,
      sourceFrames: getSelectedMovieGroupFrameCounts(fps),
      targetFrames: movieTargetDurationFrames(fps),
      useTargetFrames: movieUsesCustomTargetDuration(),
    }));
  }

  function previewAnimationPlanKey() {
    return [
      getMovieMode(),
      els.exportFromPageInput && els.exportFromPageInput.value,
      els.exportToPageInput && els.exportToPageInput.value,
      els.movieTargetDurationInput && els.movieTargetDurationInput.value,
      els.moviePrerollCountInput && els.moviePrerollCountInput.value,
      els.moviePrerollDurationInput && els.moviePrerollDurationInput.value,
      els.moviePostrollCountInput && els.moviePostrollCountInput.value,
      els.moviePostrollDurationInput && els.moviePostrollDurationInput.value,
      currentMovieFps(),
    ].join('|');
  }

  function cachePreviewAnimationPlan(key, plan) {
    previewPlanCache = { render: state.render, key, plan };
    return plan;
  }

  async function renderPreviewAnimationFrame() {
    if (!els.pdfPreview || !state.render || !state.structure) return;
    const plan = getPreviewAnimationPlan();
    if (!plan || !plan.totalFrames) {
      updatePreviewPlaybackControls(null);
      return;
    }
    state.previewAnimation.frame = Math.max(0, Math.min(plan.totalFrames - 1, Number(state.previewAnimation.frame) || 0));
    updatePreviewPlaybackControls(plan);

    els.pdfPreview.className = 'pdf-preview';
    els.pdfPreview.innerHTML = '';
    const zoom = getCurrentPngPreviewZoom(plan.layout);
    state.pngPreviewZoom = zoom;
    const stage = document.createElement('div');
    stage.className = 'preview-animation-stage';
    stage.style.width = `${Math.max(1, Math.round(plan.layout.page_width * zoom))}px`;
    stage.style.height = `${Math.max(1, Math.round(plan.layout.page_height * zoom))}px`;
    const video = state.showPreviewReferenceVideo ? makeReferenceVideoElement(plan, zoom) : null;
    if (video) stage.appendChild(video);

    const canvas = document.createElement('canvas');
    canvas.className = 'preview-animation-canvas';
    canvas.width = Math.max(1, Math.round(plan.layout.page_width * zoom));
    canvas.height = Math.max(1, Math.round(plan.layout.page_height * zoom));
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(zoom, 0, 0, zoom, 0, 0);
    ctx.clearRect(0, 0, plan.layout.page_width, plan.layout.page_height);
    if (!video) {
      ctx.fillStyle = plan.layout.page_background || '#ffffff';
      ctx.fillRect(0, 0, plan.layout.page_width, plan.layout.page_height);
    }

    if (plan.mode === 'scroll') {
      await drawCanvasScrollFrame(ctx, plan.scrollPlan, state.previewAnimation.frame, plan.layout);
      syncPdfPageToAnimationFrame(plan, state.previewAnimation.frame);
      if (state.showMarginOverlay) drawCanvasMarginOverlay(ctx, plan.layout, zoom);
    } else {
      const page = pageForAnimationFrame(plan, state.previewAnimation.frame);
      if (page) {
        syncPdfPageToAnimationFrame(plan, state.previewAnimation.frame);
        await drawCanvasPage(ctx, page, plan.layout);
        if (state.showMarginOverlay) drawCanvasMarginOverlay(ctx, layoutForCartela(plan.layout, page.cartela), zoom);
      }
    }
    stage.appendChild(canvas);
    els.pdfPreview.appendChild(stage);
  }

  function makeReferenceVideoElement(plan, zoom) {
    return makeReferenceVideoElementInPreview(plan, zoom);
  }

  function syncPdfPageToAnimationFrame(plan, frame) {
    const pageIndex = pageIndexForAnimationFrame(plan, frame, getCurrentPhysicalPages());
    if (pageIndex === null || pageIndex === state.pdfPageIndex) return;
    state.pdfPageIndex = pageIndex;
    updatePdfToolbar(state.pdfPageIndex + 1, getCurrentPhysicalPages().length);
  }

  function updatePreviewPlaybackControls(plan) {
    const totalFrames = plan && plan.totalFrames ? Math.max(1, plan.totalFrames) : 0;
    const disabled = !totalFrames;
    if (els.previewStartBtn) els.previewStartBtn.disabled = disabled;
    if (els.previewPlayBtn) {
      els.previewPlayBtn.disabled = disabled;
      els.previewPlayBtn.textContent = state.previewAnimation.playing ? 'Pausa' : 'Play';
    }
    if (els.previewFrameInput) {
      els.previewFrameInput.disabled = disabled;
      els.previewFrameInput.max = String(Math.max(0, totalFrames - 1));
      els.previewFrameInput.value = String(Math.max(0, Math.min(totalFrames - 1, state.previewAnimation.frame)));
    }
    if (els.previewFrameStatus) {
      const speedText = plan.mode === 'scroll' && plan.scrollPlan
        ? ` · ${formatScrollSpeed(plan.scrollPlan.bodySpeed)} px/frame`
        : '';
      els.previewFrameStatus.textContent = totalFrames
        ? `${formatFrameDuration(state.previewAnimation.frame, plan.fps)} / ${formatFrameDuration(totalFrames, plan.fps)}${speedText}`
        : '0/0';
    }
  }

  function togglePreviewAnimation() {
    if (state.previewAnimation.playing) {
      stopPreviewAnimation();
      renderPreviewAnimationFrame();
      return;
    }
    const plan = getPreviewAnimationPlan();
    if (!plan || !plan.totalFrames) return;
    if (state.previewAnimation.frame >= plan.totalFrames - 1) state.previewAnimation.frame = 0;
    state.previewAnimation.playing = true;
    state.previewAnimation.startedAt = performance.now();
    state.previewAnimation.startFrame = state.previewAnimation.frame;
    updatePreviewPlaybackControls(plan);
    state.previewAnimation.raf = window.requestAnimationFrame(tickPreviewAnimation);
  }

  function stopPreviewAnimation() {
    state.previewAnimation.playing = false;
    if (state.previewAnimation.raf) window.cancelAnimationFrame(state.previewAnimation.raf);
    state.previewAnimation.raf = null;
    updatePreviewPlaybackControls(getPreviewAnimationPlan());
  }

  async function tickPreviewAnimation(now) {
    if (!state.previewAnimation.playing) return;
    const plan = getPreviewAnimationPlan();
    if (!plan || !plan.totalFrames) {
      stopPreviewAnimation();
      return;
    }
    const elapsedFrames = Math.floor(((now - state.previewAnimation.startedAt) / 1000) * plan.fps);
    const nextFrame = Math.min(plan.totalFrames - 1, state.previewAnimation.startFrame + elapsedFrames);
    if (nextFrame !== state.previewAnimation.frame) {
      state.previewAnimation.frame = nextFrame;
      await renderPreviewAnimationFrame();
    }
    if (state.previewAnimation.frame >= plan.totalFrames - 1) {
      stopPreviewAnimation();
      return;
    }
    state.previewAnimation.raf = window.requestAnimationFrame(tickPreviewAnimation);
  }

  function seekPreviewAnimation(frame) {
    stopPreviewAnimation();
    state.previewAnimation.frame = Math.max(0, Math.round(Number(frame) || 0));
    renderPreviewAnimationFrame();
  }

  function previewZoomForContainer(container, layout) {
    return previewZoomForContainerFromPreviewRender(container, layout);
  }

  function drawCanvasMarginOverlay(ctx, layout, zoom = state.pngPreviewZoom) {
    drawCanvasMarginOverlayInPreview(ctx, layout, zoom);
  }

  function makeMarginOverlay(layout, zoom = state.pngPreviewZoom) {
    return makeMarginOverlayFromPreviewRender(layout, zoom);
  }

  function makePdfSheetElement(page, layout, options = {}) {
    return makePdfSheetElementFromPreviewRender(page, layout, options);
  }

  function getCurrentPhysicalPages() {
    if (!state.render || !state.structure) return [];
    if (currentPhysicalPagesCache.render === state.render) return currentPhysicalPagesCache.pages;
    const pages = buildPhysicalPages(state.render.cartelas || [], state.structure.overrides || {}, {
      settings: getProductionSettings(),
      pageLineAdjustments: state.structure.page_line_adjustments,
    });
    currentPhysicalPagesCache = { render: state.render, pages };
    return pages;
  }

  function updatePdfToolbar(current, total) {
    if (!els.pdfPageNumberInput) return;
    const page = state.render ? getCurrentPhysicalPages()[state.pdfPageIndex] : null;
    els.pdfPageNumberInput.disabled = !page;
    els.pdfPageNumberInput.max = String(Math.max(1, total));
    els.pdfPageNumberInput.value = String(Math.max(1, current));
    els.pdfTotalPages.textContent = `/ ${total}`;
    els.pdfFirstPageBtn.disabled = current <= 1;
    els.pdfPrevPageBtn.disabled = current <= 1;
    els.pdfNextPageBtn.disabled = current >= total;
    els.pdfLastPageBtn.disabled = current >= total;
    els.pdfMinusLinesBtn.disabled = total === 0;
    els.pdfPlusLinesBtn.disabled = total === 0;
    els.toggleMarginsBtn.disabled = total === 0;
    els.toggleMarginsBtn.classList.toggle('active-toggle', state.showMarginOverlay);
    els.pdfVerticalOffsetInput.disabled = !page;
    els.pdfVerticalOffsetInput.value = page ? String(Number(page.cartela.vertical_offset) || 0) : '';
    els.pdfBaseNameInput.disabled = !state.structure;
    els.pdfBaseNameInput.value = getProductionSettings().pdf_base_name;
    const scrollMode = getMovieMode() === 'scroll';
    const totalChanged = state.lastPreviewRangeTotal !== total;
    if (totalChanged) state.lastPreviewRangeTotal = total;
    els.exportFromPageInput.disabled = total === 0 || scrollMode;
    els.exportToPageInput.disabled = total === 0 || scrollMode;
    els.exportFromPageInput.max = String(Math.max(1, total));
    els.exportToPageInput.max = String(Math.max(1, total));
    if (scrollMode) {
      els.exportFromPageInput.value = '1';
      els.exportToPageInput.value = String(Math.max(1, total));
      els.exportFromPageInput.dataset.manual = '0';
      els.exportToPageInput.dataset.manual = '0';
    } else {
      const manualRange = els.exportFromPageInput.dataset.manual === '1' || els.exportToPageInput.dataset.manual === '1';
      if (!manualRange) {
        els.exportFromPageInput.value = '1';
        els.exportToPageInput.value = String(Math.max(1, total));
      }
      if (!Number(els.exportFromPageInput.value) || Number(els.exportFromPageInput.value) > total) els.exportFromPageInput.value = '1';
      if (!Number(els.exportToPageInput.value) || Number(els.exportToPageInput.value) > total) els.exportToPageInput.value = String(Math.max(1, total));
    }
    els.exportCurrentPdfBtn.disabled = !page;
    els.exportAllPdfBtn.disabled = total === 0;
    els.exportMovBtn.disabled = total === 0;
    if (els.exportIncludeBackgroundInput) {
      els.exportIncludeBackgroundInput.disabled = total === 0;
      els.exportIncludeBackgroundInput.checked = !!state.exportIncludeBackground;
    }
    if (els.exportIncludeVideoInput) {
      els.exportIncludeVideoInput.disabled = total === 0 || !state.referenceVideo;
      els.exportIncludeVideoInput.checked = !!(state.referenceVideo && state.exportIncludeVideo);
    }
    if (els.exportIncludeMarginsInput) {
      els.exportIncludeMarginsInput.disabled = total === 0;
      els.exportIncludeMarginsInput.checked = !!state.exportIncludeMargins;
    }
    if (els.movieModeSelect) els.movieModeSelect.disabled = total === 0;
    if (els.movieCodecSelect) els.movieCodecSelect.disabled = total === 0;
    if (els.movieEncodingProfileSelect) els.movieEncodingProfileSelect.disabled = total === 0;
    els.pdfLineStatus.textContent = page
      ? getPdfLineStatus(
        page,
        getProductionSettings().default_auto_page_lines,
        state.structure && state.structure.page_line_adjustments
      )
      : '0/0';
    updateMovieDurationFields();
  }

  function currentMovieFps() {
    return getMovieFps(getProductionSettings());
  }

  function normalizeDurationInputElement(input, fps) {
    const result = normalizeDurationInputValueInDomain(input && input.value, fps);
    if (result === null) return null;
    if (input) input.value = result.value;
    return result.frames;
  }

  function readMovieSegmentSettings(fps) {
    return normalizeMovieSegmentSettings(selectedMovieGroupCount(), {
      preCount: els.moviePrerollCountInput && els.moviePrerollCountInput.value,
      postCount: els.moviePostrollCountInput && els.moviePostrollCountInput.value,
      preFrames: normalizeDurationInputElement(els.moviePrerollDurationInput, fps) || 0,
      postFrames: normalizeDurationInputElement(els.moviePostrollDurationInput, fps) || 0,
    });
  }

  function updateMovieSegmentInputs() {
    const fps = currentMovieFps();
    const groupCount = Math.max(0, selectedMovieGroupCount());
    const settings = readMovieSegmentSettings(fps);
    if (els.moviePrerollCountInput) els.moviePrerollCountInput.value = String(settings.preCount);
    if (els.moviePostrollCountInput) els.moviePostrollCountInput.value = String(settings.postCount);
    if (els.moviePrerollDurationInput) {
      els.moviePrerollDurationInput.disabled = settings.preCount === 0 || groupCount === 0;
      els.moviePrerollDurationInput.value = formatFrameDuration(settings.preFrames, fps);
    }
    if (els.moviePostrollDurationInput) {
      els.moviePostrollDurationInput.disabled = settings.postCount === 0 || groupCount === 0;
      els.moviePostrollDurationInput.value = formatFrameDuration(settings.postFrames, fps);
    }
    updateMovieDurationFields();
    renderPdfPreview();
    savePreviewSettingsFromUi();
  }

  function getSelectedMoviePages() {
    if (!state.render || !state.structure) return [];
    const pages = getCurrentPhysicalPages();
    const selection = readExportPageSelection(pages);
    return moviePageItems(selection.pages, selection.start);
  }

  function getSelectedMoviePageGroups() {
    return groupMoviePageItemsByCartela(getSelectedMoviePages());
  }

  function getSelectedMovieGroupFrameCounts(fps) {
    return movieGroupFrameCounts(getSelectedMoviePageGroups(), fps);
  }

  function getMovieMode() {
    return els.movieModeSelect && els.movieModeSelect.value === 'scroll' ? 'scroll' : 'pages';
  }

  function getSelectedScrollCartelaGroups() {
    if (!state.render || !state.structure) return [];
    return groupPhysicalPagesByCartela(getCurrentPhysicalPages());
  }

  function selectedMovieGroupCount() {
    return getMovieMode() === 'scroll'
      ? getSelectedScrollCartelaGroups().length
      : getSelectedMoviePageGroups().length;
  }

  function getSelectedScrollSourceFrames(fps) {
    return scrollSourceFrameCounts(getSelectedScrollCartelaGroups(), fps);
  }

  function updateMovieDurationFields(options = {}) {
    if (!els.movieRangeDurationInput || !els.movieTargetDurationInput) return;
    const fps = currentMovieFps();
    const frames = getMovieMode() === 'scroll' ? getSelectedScrollSourceFrames(fps) : getSelectedMovieGroupFrameCounts(fps);
    const segments = readMovieSegmentSettings(fps);
    const summary = movieDurationFrameSummary(frames, segments);
    const formatted = formatFrameDuration(summary.totalFrames, fps);
    const bodyFormatted = formatFrameDuration(summary.bodyFrames, fps);
    const disabled = frames.length === 0;
    els.movieRangeDurationInput.disabled = disabled;
    els.movieTargetDurationInput.disabled = disabled;
    els.movieRangeDurationInput.value = formatted;
    if (options.resetTarget || disabled || !els.movieTargetDurationInput.value || els.movieTargetDurationInput.dataset.auto !== '0') {
      els.movieTargetDurationInput.value = bodyFormatted;
      els.movieTargetDurationInput.dataset.auto = '1';
    }
    updateReferenceVideoDurationField();
  }

  function validateMovieTargetDuration() {
    if (!els.movieTargetDurationInput || !state.render || !state.structure) return;
    const fps = currentMovieFps();
    const targetFrames = parseFrameDuration(els.movieTargetDurationInput.value, fps);
    if (targetFrames === null) {
      window.alert(`Introduce la duración como mm:ss:ff. Para ${fps} fps, ff debe estar entre 00 y ${String(fps - 1).padStart(2, '0')}.`);
      updateMovieDurationFields({ resetTarget: true });
      return;
    }
    const segments = readMovieSegmentSettings(fps);
    const fittedTargetFrames = fitMovieTargetFrames(targetFrames, selectedMovieGroupCount(), segments);
    els.movieTargetDurationInput.value = formatFrameDuration(fittedTargetFrames, fps);
    const sourceFrames = getMovieMode() === 'scroll' ? getSelectedScrollSourceFrames(fps) : getSelectedMovieGroupFrameCounts(fps);
    els.movieTargetDurationInput.dataset.auto = fittedTargetFrames === movieBodySourceTotal(sourceFrames, segments) ? '1' : '0';
    savePreviewSettingsFromUi();
  }

  function movieTargetDurationFrames(fps) {
    return els.movieTargetDurationInput ? parseFrameDuration(els.movieTargetDurationInput.value, fps) : null;
  }

  function movieUsesCustomTargetDuration() {
    return !!(els.movieTargetDurationInput && els.movieTargetDurationInput.dataset.auto === '0');
  }

  function updateMovExportProgress(currentFrame, totalFrames) {
    if (!els.exportMovBtn) return;
    const total = Math.max(1, Math.round(Number(totalFrames) || 1));
    const current = Math.max(0, Math.min(total, Math.round(Number(currentFrame) || 0)));
    els.exportMovBtn.textContent = `${current}/${total} frames`;
    if (state.movExportProgress) state.movExportProgress.update(current, total);
  }

  function openMovExportProgressModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'app-modal mov-export-modal';
    const title = document.createElement('h2');
    title.textContent = 'Exportando MOV';
    const status = document.createElement('p');
    status.textContent = 'Preparando frames...';
    const progress = document.createElement('progress');
    progress.className = 'mov-export-progress';
    progress.max = 1;
    progress.value = 0;
    const counter = document.createElement('div');
    counter.className = 'mov-export-counter';
    counter.textContent = '0 / 0 frames';
    const actions = document.createElement('div');
    actions.className = 'modal-actions';
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = 'Cancelar';
    actions.appendChild(cancelButton);
    modal.appendChild(title);
    modal.appendChild(status);
    modal.appendChild(progress);
    modal.appendChild(counter);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    let cancelRequested = false;
    let cancelHandler = null;
    cancelButton.addEventListener('click', async () => {
      if (cancelRequested) return;
      const native = nativeBridge();
      let confirmed = false;
      if (native && native.confirm) {
        const result = await native.confirm({
          title: 'Cancelar exportación',
          message: '¿Quieres cancelar la exportación MOV en curso?',
          confirmLabel: 'Cancelar exportación',
        });
        confirmed = !!(result && result.confirmed);
      } else {
        confirmed = window.confirm('¿Quieres cancelar la exportación MOV en curso?');
      }
      if (!confirmed) return;
      cancelRequested = true;
      cancelButton.disabled = true;
      status.textContent = 'Cancelando exportación...';
      if (cancelHandler) await cancelHandler().catch(() => {});
    });

    return {
      update(current, total) {
        const safeTotal = Math.max(1, Math.round(Number(total) || 1));
        const safeCurrent = Math.max(0, Math.min(safeTotal, Math.round(Number(current) || 0)));
        progress.max = safeTotal;
        progress.value = safeCurrent;
        counter.textContent = `${safeCurrent} / ${safeTotal} frames`;
      },
      setPhase(message) {
        if (!cancelRequested) status.textContent = message;
      },
      setCancelHandler(handler) {
        cancelHandler = handler;
        if (cancelRequested && cancelHandler) cancelHandler().catch(() => {});
      },
      isCancellationRequested() {
        return cancelRequested;
      },
      close() {
        overlay.remove();
      },
    };
  }

  function throwIfMovExportCancelled() {
    if (!state.movExportProgress || !state.movExportProgress.isCancellationRequested()) return;
    const error = new Error('Exportación cancelada.');
    error.name = 'AbortError';
    throw error;
  }

  async function exportScrollMovSequence({ native, filePath, fps, layout, encodingProfile, renderOptions = {} }) {
    const groups = getSelectedScrollCartelaGroups();
    if (!groups.length) return;
    const sourceFrames = getSelectedScrollSourceFrames(fps);
    const segments = readMovieSegmentSettings(fps);
    const moviePlan = buildScrollMoviePlan({
      fps,
      groups,
      layout,
      segments,
      sourceFrames,
      targetFrames: movieTargetDurationFrames(fps),
      useTargetFrames: movieUsesCustomTargetDuration(),
    });
    const plan = moviePlan.scrollPlan;
    updateMovExportProgress(0, moviePlan.totalFrames);
    await exportMovFramesIncrementally(native, filePath, fps, encodingProfile, async (writeFrame) => {
      await writeAnimatedFrames({
        frameCount: moviePlan.totalFrames,
        onFramesWritten: (_count, frame) => updateMovExportProgress(frame + 1, moviePlan.totalFrames),
        renderFrameBytes: async (frame) => {
          const blob = await renderScrollFrameToPngBlob(plan, frame, layout, {
            ...renderOptions,
            videoTime: frame >= moviePlan.videoStartFrame ? (frame - moviePlan.videoStartFrame) / fps : null,
          });
          return blobToBytes(blob);
        },
        writeFrame,
      });
      updateMovExportProgress(moviePlan.totalFrames, moviePlan.totalFrames);
    });
  }

  async function renderScrollFrameToPngBlob(plan, frame, layout, options = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = layout.page_width;
    canvas.height = layout.page_height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    await drawExportBackground(ctx, layout, options);
    await drawCanvasScrollFrame(ctx, plan, frame, layout);
    if (options.includeMargins) drawCanvasMarginOverlay(ctx, layout, 1);
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('No se pudo crear el frame de scroll.'));
      }, 'image/png');
    });
  }

  function changePdfPage(delta) {
    const total = state.render ? getCurrentPhysicalPages().length : 0;
    state.pdfPageIndex = Math.max(0, Math.min(total - 1, state.pdfPageIndex + delta));
    syncAnimationFrameToPdfPage();
    renderPdfPreview();
  }

  function goToPdfPage(index) {
    const total = state.render ? getCurrentPhysicalPages().length : 0;
    if (!total) {
      state.pdfPageIndex = 0;
    } else {
      state.pdfPageIndex = Math.max(0, Math.min(total - 1, index));
    }
    syncAnimationFrameToPdfPage();
    renderPdfPreview();
  }

  function syncAnimationFrameToPdfPage() {
    const plan = getPreviewAnimationPlan();
    if (!plan || !plan.totalFrames) return;
    state.previewAnimation.frame = frameForPdfPageIndex(plan, state.pdfPageIndex, getCurrentPhysicalPages());
    if (state.previewAnimation.playing) {
      state.previewAnimation.startedAt = performance.now();
      state.previewAnimation.startFrame = state.previewAnimation.frame;
    }
  }

  function adjustCurrentPdfPageLines(delta) {
    if (!state.render || !state.structure) return;
    const page = getCurrentPhysicalPages()[state.pdfPageIndex];
    if (!page) return;
    state.structure.page_line_adjustments = state.structure.page_line_adjustments || {};
    adjustPdfPageLineAdjustment(
      state.structure.page_line_adjustments,
      page.id,
      getProductionSettings().default_auto_page_lines,
      delta
    );
    state.render = buildCurrentRenderJson(state.source, state.materials, state.structure);
    renderPreview();
    renderPdfPreview();
  }

  function updatePdfBaseName() {
    updateSettings({ pdf_base_name: safeFilePart(els.pdfBaseNameInput.value || 'creditos') });
    renderPreview();
  }

  function updatePngPreviewZoom(delta) {
    const layout = getRenderLayout();
    const baseZoom = state.pngPreviewZoomMode === 'auto' || !Number(state.pngPreviewZoom)
      ? calculateFitPreviewZoom(layout)
      : Number(state.pngPreviewZoom);
    state.pngPreviewZoomMode = 'manual';
    state.pngPreviewZoom = Math.max(0.05, Math.min(2, Math.round((baseZoom + delta) * 20) / 20));
    renderPdfPreview();
  }

  function updatePngZoomStatus() {
    if (!els.pngZoomStatus) return;
    const suffix = state.pngPreviewZoomMode === 'auto' ? ' auto' : '';
    els.pngZoomStatus.textContent = `${Math.round((Number(state.pngPreviewZoom) || 0) * 100)}%${suffix}`;
  }

  function getCurrentPngPreviewZoom(layout) {
    if (state.pngPreviewZoomMode === 'auto' || !Number(state.pngPreviewZoom)) {
      return calculateFitPreviewZoom(layout);
    }
    return Math.max(0.03, Number(state.pngPreviewZoom) || 0.25);
  }

  function calculateFitPreviewZoom(layout) {
    if (!els.pdfPreview || !layout) return 0.25;
    const rect = els.pdfPreview.getBoundingClientRect();
    const availableWidth = Math.max(1, rect.width - 28);
    const availableHeight = Math.max(1, rect.height - 28);
    return fitPreviewZoom(availableWidth, availableHeight, layout.page_width, layout.page_height, { maxZoom: 2 });
  }

  function toggleMarginOverlay() {
    state.showMarginOverlay = !state.showMarginOverlay;
    if (els.toggleMarginsBtn) {
      els.toggleMarginsBtn.classList.toggle('active-toggle', state.showMarginOverlay);
      els.toggleMarginsBtn.textContent = state.showMarginOverlay ? 'Ocultar márgenes' : 'Mostrar márgenes';
    }
    renderPdfPreview();
    savePreviewSettingsFromUi();
  }

  function togglePanelMarginOverlay() {
    state.showPanelMarginOverlay = !state.showPanelMarginOverlay;
    updatePanelMarginButtons();
    renderVisiblePanelPreviews();
  }

  function updatePanelMarginButtons() {
    [els.toggleStyleMarginsBtn, els.toggleCartelaMarginsBtn].forEach((button) => {
      if (!button) return;
      button.classList.toggle('active-toggle', state.showPanelMarginOverlay);
      button.textContent = state.showPanelMarginOverlay ? 'Ocultar márgenes' : 'Márgenes';
    });
  }

  function updateCurrentPdfCartela(fields) {
    if (!state.render || !state.structure) return;
    const page = getCurrentPhysicalPages()[state.pdfPageIndex];
    if (!page || !page.cartela) return;
    const cartela = (state.structure.cartelas || []).find((candidate) => candidate.id === page.cartela.id);
    if (!cartela) return;
    const previousSelected = state.selectedCartelaId;
    state.selectedCartelaId = cartela.id;
    updateSelectedCartela(fields);
    state.selectedCartelaId = previousSelected;
    state.render = buildCurrentRenderJson(state.source, state.materials, state.structure);
    renderCartelaList();
    renderEditor();
    renderPreview();
    renderPdfPreview();
  }

  async function exportPngPages(mode) {
    if (!state.render || !state.structure) return;
    const layout = getRenderLayout();
    const pages = getCurrentPhysicalPages();
    if (!pages.length) return;
    const selectedPages = mode === 'current'
      ? [{ page: pages[state.pdfPageIndex], pageNumber: state.pdfPageIndex + 1 }]
      : readExportPageSelection(pages).pages.map((page, index) => ({
        page,
        pageNumber: index + 1,
      }));
    const settings = getProductionSettings();
    const baseName = safeFilePart(settings.pdf_base_name || 'creditos');
    const renderOptions = currentExportRenderOptions();
    const native = nativeBridge();
    try {
      if (native && mode === 'all' && native.exportPngSequence) {
        const exportedPages = [];
        for (const item of selectedPages.filter((candidate) => candidate.page)) {
          const fileName = `${baseName}_${String(item.pageNumber).padStart(3, '0')}.png`;
          const blob = await renderPageToPngBlob(item.page, layout, {
            ...renderOptions,
            videoTime: currentVideoTimeForPage(item.page),
          });
          exportedPages.push({ fileName, bytes: await blobToBytes(blob) });
        }
        await native.exportPngSequence({ pages: exportedPages });
        return;
      }

      if (mode === 'all' && window.showDirectoryPicker) {
        const directory = await window.showDirectoryPicker({ mode: 'readwrite' });
        for (const item of selectedPages.filter((candidate) => candidate.page)) {
          const fileName = `${baseName}_${String(item.pageNumber).padStart(3, '0')}.png`;
          const blob = await renderPageToPngBlob(item.page, layout, {
            ...renderOptions,
            videoTime: currentVideoTimeForPage(item.page),
          });
          await writeBlobToDirectory(directory, fileName, blob);
        }
        return;
      }

      for (const item of selectedPages.filter((candidate) => candidate.page)) {
        const fileName = `${baseName}_${String(item.pageNumber).padStart(3, '0')}.png`;
        const blob = await renderPageToPngBlob(item.page, layout, {
          ...renderOptions,
          videoTime: currentVideoTimeForPage(item.page),
        });
        if (mode === 'current') {
          await saveBlobAs(blob, fileName);
        } else {
          downloadBlob(blob, fileName);
        }
        await wait(120);
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      window.alert('No se pudo exportar PNG: ' + error.message);
    }
  }

  async function exportMov() {
    if (!state.render || !state.structure) return;
    const native = nativeBridge();
    if (!native || !native.chooseMovPath || !native.exportMovSequence) {
      window.alert('La exportacion MOV necesita la app Electron.');
      return;
    }

    const layout = getRenderLayout();
    const pages = getCurrentPhysicalPages();
    if (!pages.length) return;

    const selectedPages = getSelectedMoviePages();
    if (!selectedPages.length) return;

    const settings = getProductionSettings();
    const fps = Math.max(1, Math.round(Number(settings.movie_fps) || 25));
    const baseName = safeFilePart(settings.pdf_base_name || 'creditos');
    const encodingProfile = selectedRenderProfile();

    try {
      const saveResult = await native.chooseMovPath({
        defaultPath: joinPath(readLocalPreference(STORAGE_KEYS.renderDir), `${baseName}.mov`),
        encodingProfile,
      });
      if (!saveResult || saveResult.canceled) return;
      rememberFileDirectory(STORAGE_KEYS.renderDir, saveResult.filePath);

      els.exportMovBtn.disabled = true;
      state.movExportProgress = openMovExportProgressModal();
      if (getMovieMode() === 'scroll') {
        await exportScrollMovSequence({
          native,
          filePath: saveResult.filePath,
          fps,
          layout,
          encodingProfile,
          renderOptions: currentExportRenderOptions(),
        });
        return;
      }

      const moviePlan = buildPageMoviePlan({
        fps,
        groups: getSelectedMoviePageGroups(),
        layout,
        segments: readMovieSegmentSettings(fps),
        selectedPages,
        sourceFrames: getSelectedMovieGroupFrameCounts(fps),
        targetFrames: movieTargetDurationFrames(fps),
        useTargetFrames: movieUsesCustomTargetDuration(),
      });
      const exportFrameCounts = moviePlan.frameCounts;
      const totalExportFrames = moviePlan.totalFrames;
      const renderOptions = currentExportRenderOptions();
      updateMovExportProgress(0, totalExportFrames);
      await exportMovFramesIncrementally(native, saveResult.filePath, fps, encodingProfile, async (writeFrame) => {
        let renderedFrames = 0;
        for (const [index, item] of selectedPages.entries()) {
          throwIfMovExportCancelled();
          updateMovExportProgress(renderedFrames, totalExportFrames);
          await wait(0);
          const duration = Math.max(0, Number(item.page.cartela && item.page.cartela.duration) || 0);
          const frameCount = exportFrameCounts[index] || Math.max(1, Math.round(duration * fps));
          if (renderOptions.includeVideo) {
            const startFrame = renderedFrames;
            await writeAnimatedFrames({
              frameCount,
              onFramesWritten: () => {
                renderedFrames += 1;
                updateMovExportProgress(renderedFrames, totalExportFrames);
              },
              renderFrameBytes: async (frame) => {
                const blob = await renderPageToPngBlob(item.page, layout, {
                  ...renderOptions,
                  videoTime: startFrame + frame >= moviePlan.videoStartFrame ? (startFrame + frame - moviePlan.videoStartFrame) / fps : null,
                });
                return blobToBytes(blob);
              },
              writeFrame,
            });
          } else {
            const blob = await renderPageToPngBlob(item.page, layout, renderOptions);
            const bytes = await blobToBytes(blob);
            await writeRepeatedFrames({
              bytes,
              frameCount,
              onFramesWritten: (chunk) => {
                renderedFrames += chunk;
                updateMovExportProgress(renderedFrames, totalExportFrames);
              },
              writeFrame,
            });
          }
        }
        updateMovExportProgress(totalExportFrames, totalExportFrames);
      });
    } catch (error) {
      if (error.name === 'AbortError' || (state.movExportProgress && state.movExportProgress.isCancellationRequested())) return;
      window.alert('No se pudo exportar MOV: ' + error.message);
    } finally {
      if (state.movExportProgress) state.movExportProgress.close();
      state.movExportProgress = null;
      els.exportMovBtn.textContent = 'Exportar MOV';
      updatePdfToolbar(state.pdfPageIndex + 1, pages.length);
    }
  }

  function readExportPageSelection(pages) {
    const selection = exportPageSelection(
      pages,
      els.exportFromPageInput && els.exportFromPageInput.value,
      els.exportToPageInput && els.exportToPageInput.value
    );
    const { start, end } = selection;
    els.exportFromPageInput.value = String(start);
    els.exportToPageInput.value = String(end);
    return selection;
  }

  function currentExportRenderOptions() {
    return getExportRenderOptionsInDomain({
      includeBackground: state.exportIncludeBackground,
      includeVideo: state.exportIncludeVideo,
      includeMargins: state.exportIncludeMargins,
    }, state.referenceVideo);
  }

  function currentVideoTimeForPage(page) {
    const plan = getPreviewAnimationPlan();
    if (!plan || !page) return null;
    return videoTimeForPage(plan, page, getCurrentPhysicalPages());
  }

  async function drawExportBackground(ctx, layout, options = {}) {
    if (options.includeBackground) {
      ctx.fillStyle = layout.page_background || '#ffffff';
      ctx.fillRect(0, 0, layout.page_width, layout.page_height);
    }
    const videoTime = Number(options.videoTime);
    if (options.includeVideo && Number.isFinite(videoTime) && videoTime >= 0) {
      await drawReferenceVideoFrame(ctx, layout, videoTime);
    }
  }

  async function drawReferenceVideoFrame(ctx, layout, time) {
    await drawReferenceVideoFrameInPreview(ctx, layout, time);
  }

  function referenceVideoForCanvas() {
    return referenceVideoForCanvasInPreview();
  }

  async function renderPageToPngBlob(page, layout, options = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = layout.page_width;
    canvas.height = layout.page_height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    await drawExportBackground(ctx, layout, options);
    await drawCanvasPage(ctx, page, layout);
    if (options.includeMargins) drawCanvasMarginOverlay(ctx, layoutForCartela(layout, page && page.cartela), 1);
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('No se pudo crear el PNG.'));
      }, 'image/png');
    });
  }

  async function drawCanvasPage(ctx, page, layout) {
    await drawCanvasPageInPreview(ctx, page, layout);
  }

  async function drawCanvasScrollFrame(ctx, plan, frame, layout) {
    await drawCanvasScrollFrameInPreview(ctx, plan, frame, layout);
  }

  function measureCanvasBlock(ctx, block, cartela, layout, width) {
    return measureCanvasBlockInPreview(ctx, block, cartela, layout, width);
  }

  function canvasTextMetrics(styleKey, cartela, layout, typographyOverrides = {}) {
    return canvasTextMetricsInPreview(styleKey, cartela, layout, typographyOverrides);
  }

  function canvasTextHeight(text, metrics, width = Infinity) {
    return canvasTextHeightInPreview(text, metrics, width);
  }

  function canvasWrappedTextLines(text, metrics, width = Infinity) {
    return canvasWrappedTextLinesInPreview(text, metrics, width);
  }

  function applyTextWrapStyle(element, cartela) {
    applyTextWrapStyleInPreview(element, cartela);
  }

  function renderVisualBlock(block, cartela, layout) {
    const blockEl = document.createElement('div');
    blockEl.className = 'render-block';
    if (block.missing_source) {
      blockEl.textContent = `Fuente no encontrada: ${block.missing_source}`;
      return blockEl;
    }

    const repeatBlockTitles = repeatBlockTitlesForCartela(cartela);
    (block.pages || []).forEach((blockPage, index) => {
      const blockPageEl = document.createElement('div');
      blockPageEl.className = 'render-block-page';
      const displayBlock = blockForTitleRepeat(block, repeatBlockTitles, index);

      const blockTitle = makeVisualStaticText(displayBlock.title, 'render-block-title-input', 'block_title', {
        multiplier: cartela.font_size_multiplier,
        lineMultiplier: cartela.line_spacing_multiplier,
        typography: block.typography,
        textAlign: 'center',
        cartela,
      });

      const contentEl = document.createElement('div');
      contentEl.className = 'render-block-content';
      contentEl.style.gridTemplateColumns = `repeat(${Math.max(1, Number(block.columns) || 1)}, minmax(0, 1fr))`;
      contentEl.style.columnGap = `${layout.column_gap}px`;
      contentEl.style.rowGap = '0';

      const units = blockPage.items || [];
      if (blockTitle) {
        if (units.length) blockTitle.style.marginBottom = `${cartelaBlockTitleGap(cartela, layout)}px`;
        blockPageEl.appendChild(blockTitle);
      }
      let previousCreditSourceId = null;
      units.forEach((unit, index) => {
        const options = unitRenderOptions(unit, previousCreditSourceId, cartela, index > 0, units[index - 1]);
        const gapBefore = unitGapBefore(options, layout);
        if (block.type === 'music_licenses' && unit.lines) {
          const themeEl = document.createElement('div');
          themeEl.className = 'render-theme';
          if (gapBefore) themeEl.style.marginTop = `${gapBefore}px`;
          unit.lines.forEach((line, lineIndex) => {
            themeEl.appendChild(makeVisualInput(line.id, 'value', line.value || '', lineIndex === 0 ? 'render-theme-title-input' : 'render-line-input', {
              autoWrap: cartela.auto_text_wrap,
              styleKey: lineIndex === 0 ? 'role' : 'name',
              multiplier: cartela.font_size_multiplier,
              lineMultiplier: cartela.line_spacing_multiplier,
              typography: block.typography,
              textAlign: block.alignment && block.alignment.text ? block.alignment.text : 'center',
            }));
          });
          contentEl.appendChild(themeEl);
        } else {
          contentEl.appendChild(renderVisualUnit(unit, cartela, block.alignment || {}, layout, {
            ...options,
            gapBefore,
            typography: block.typography,
          }));
          previousCreditSourceId = creditSourceId(unit);
        }
      });
      blockPageEl.appendChild(contentEl);
      blockEl.appendChild(blockPageEl);
    });
    return blockEl;
  }

  function renderVisualUnit(unit, cartela, alignment, layout, options = {}) {
    const orientation = cartela.orientation || 'horizontal';
    const unitEl = document.createElement('div');
    unitEl.className = `render-unit ${orientation}`;
    if (options.gapBefore) unitEl.style.marginTop = `${options.gapBefore}px`;
    if (orientation === 'horizontal') {
      unitEl.style.gap = `${layout.role_name_gap}px`;
    } else {
      unitEl.style.gap = `${roleNameGapForOrientation(layout, orientation)}px`;
    }
    if (unit.kind === 'credit' || unit.kind === 'crew_credit') {
      if (options.repeatedNameRow) {
        // Continuacion del mismo cargo: solo se pinta el nombre.
      } else if (options.hideRole) {
        const roleEl = document.createElement('div');
        roleEl.className = 'render-role repeated-role';
        unitEl.appendChild(roleEl);
      } else {
        unitEl.appendChild(makeVisualInput(unit.source_item_id || unit.id, 'role', unit.role || '', 'render-role-input', {
          autoWrap: cartela.auto_text_wrap,
          styleKey: 'role',
          multiplier: cartela.font_size_multiplier,
          lineMultiplier: cartela.line_spacing_multiplier,
          typography: options.typography,
          textAlign: alignment.role || (orientation === 'vertical' ? 'center' : 'right'),
        }));
      }
      unitEl.appendChild(makeVisualInput(unit.source_name_id || unit.id, 'name', unit.name || '', 'render-name-input', {
        autoWrap: cartela.auto_text_wrap,
        styleKey: 'name',
        multiplier: cartela.font_size_multiplier,
        lineMultiplier: cartela.line_spacing_multiplier,
        typography: options.typography,
        textAlign: alignment.name || (orientation === 'vertical' ? 'center' : 'left'),
      }));
      return unitEl;
    }
    if (unit.kind === 'cast') {
      unitEl.appendChild(makeVisualInput(unit.id, 'actor', unit.actor || '', 'render-role-input', {
        autoWrap: cartela.auto_text_wrap,
        styleKey: 'role',
        multiplier: cartela.font_size_multiplier,
        lineMultiplier: cartela.line_spacing_multiplier,
        typography: options.typography,
        textAlign: alignment.role || (orientation === 'vertical' ? 'center' : 'right'),
      }));
      unitEl.appendChild(makeVisualInput(unit.id, 'character', unit.character || '', 'render-name-input', {
        autoWrap: cartela.auto_text_wrap,
        styleKey: 'name',
        multiplier: cartela.font_size_multiplier,
        lineMultiplier: cartela.line_spacing_multiplier,
        typography: options.typography,
        textAlign: alignment.name || (orientation === 'vertical' ? 'center' : 'left'),
      }));
      return unitEl;
    }
    const value = unit.title || unit.value || '';
    unitEl.appendChild(makeVisualInput(unit.id, unit.title !== undefined ? 'title' : 'value', value, 'render-line-input', {
      autoWrap: cartela.auto_text_wrap,
      styleKey: unit.title !== undefined ? 'block_title' : 'name',
      multiplier: cartela.font_size_multiplier,
      lineMultiplier: cartela.line_spacing_multiplier,
      typography: options.typography,
      textAlign: alignment.text || (orientation === 'vertical' ? 'center' : 'left'),
    }));
    return unitEl;
  }

}());
