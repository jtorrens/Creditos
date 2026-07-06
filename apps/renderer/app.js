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
    buildPhysicalPages,
    els,
    fitPreviewZoom,
    getPngPreviewZoom: () => state.pngPreviewZoom,
    getProductionSettings,
    getRenderLayout,
    makeMarginOverlayInPreview,
    makePdfSheetElementInPreview,
    renderPdfPreview,
    renderVisiblePanelPreviews,
    savePreviewSettingsFromUi,
    state,
  });
  const {
    calculateFitPreviewZoom: calculateFitPreviewZoomFromPreviewRender,
    getCurrentPhysicalPages: getCurrentPhysicalPagesFromPreviewRender,
    getCurrentPngPreviewZoom: getCurrentPngPreviewZoomFromPreviewRender,
    makeMarginOverlay: makeMarginOverlayFromPreviewRender,
    makePdfSheetElement: makePdfSheetElementFromPreviewRender,
    previewZoomForContainer: previewZoomForContainerFromPreviewRender,
    toggleMarginOverlay: toggleMarginOverlayFromPreviewRender,
    togglePanelMarginOverlay: togglePanelMarginOverlayFromPreviewRender,
    updatePanelMarginButtons: updatePanelMarginButtonsFromPreviewRender,
    updatePngPreviewZoom: updatePngPreviewZoomFromPreviewRender,
    updatePngZoomStatus: updatePngZoomStatusFromPreviewRender,
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
    applyExplicitCartelaOverridesFromSource,
    applyDatabaseOverview,
    adjustPdfPageLineAdjustment,
    buildCurrentRenderJson,
    clearCartelaStyleOverrides,
    currentProductionEpisodes,
    dbPost,
    defaultImportModelIdInDomain,
    deleteManualCartela,
    els,
    findPageWithRef,
    frameForPdfPageIndex,
    getCurrentPhysicalPages,
    getEffectiveStyleTitleTypography,
    getPreviewAnimationPlan,
    getSelectedCartela,
    getStyleById,
    getProductionSettings,
    initializeDatabase,
    insertManualCartela,
    moveCartelaVisualOrderInStructure,
    migrateStructure,
    nativeBridge,
    persistSelectedProductionFields,
    pruneCurrentRedundantStyleDefaults,
    refreshPdfIfActive,
    rebuild,
    renderCartelaList,
    renderCartelaPreview,
    renderEditor,
    renderPdfPreview,
    renderPreview,
    renderProductionList,
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
    normalizeColor,
    normalizeTitleTypographyOverrides,
    safeStyleId,
    sanitizeStyleBlockOverrides,
    sanitizeStyleCartelaOverrides,
    scheduleStyleAutosave,
    scheduleAutosave,
    selectedProduction,
    setSelectedProductionLocalFields,
    showEpisodeStyleSourceModal: (episodes) => projectPanel.showEpisodeStyleSourceModal(episodes),
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
  const appMovieControls = globalThis.CreditosAppMovieControls.createAppMovieControls({
    els,
    fitMovieTargetFrames,
    formatFrameDuration,
    getCurrentPhysicalPages,
    getMovieFps,
    getProductionSettings,
    groupMoviePageItemsByCartela,
    groupPhysicalPagesByCartela,
    movieBodySourceTotal,
    movieDurationFrameSummary,
    movieGroupFrameCounts,
    moviePageItems,
    normalizeDurationInputValueInDomain,
    normalizeMovieSegmentSettings,
    parseFrameDuration,
    readExportPageSelection,
    renderPdfPreview,
    savePreviewSettingsFromUi,
    scrollSourceFrameCounts,
    state,
    updateReferenceVideoDurationField,
    windowRef: window,
  });
  const appMovExportProgress = globalThis.CreditosAppMovExportProgress.createAppMovExportProgress({
    documentRef: document,
    els,
    nativeBridge,
    state,
    windowRef: window,
  });
  const appEditableInputs = globalThis.CreditosAppEditableInputs.createAppEditableInputs({
    buildCurrentRenderJson,
    documentRef: document,
    fieldControlRegistry,
    fontWeightFromStyle,
    getEffectiveCartela,
    getProductionSettings,
    getSelectedCartela,
    normalizeBoolean,
    normalizeSettings,
    renderPreview,
    resolveOverride,
    setEditableOverride,
    state,
    windowRef: window,
  });
  const appVisualPreview = globalThis.CreditosAppVisualPreview.createAppVisualPreview({
    applyTextWrapStyle,
    applyTypography,
    blockForTitleRepeat,
    cartelaBlockTitleGap,
    creditSourceId,
    documentRef: document,
    els,
    getProductionSettings,
    getRenderLayout,
    makeVisualInput,
    repeatBlockTitlesForCartela,
    roleNameGapForOrientation,
    state,
    transformCartelaText,
    unitGapBefore,
    unitRenderOptions,
  });
  const appPreviewAnimation = globalThis.CreditosAppPreviewAnimation.createAppPreviewAnimation({
    buildPageMoviePlan,
    buildScrollMoviePlan,
    currentMovieFps,
    documentRef: document,
    drawCanvasMarginOverlay,
    drawCanvasPage,
    drawCanvasScrollFrame,
    els,
    formatFrameDuration,
    formatScrollSpeed,
    getCurrentPhysicalPages,
    getCurrentPngPreviewZoom,
    getMovieMode,
    getRenderLayout,
    getSelectedMovieGroupFrameCounts,
    getSelectedMoviePageGroups,
    getSelectedMoviePages,
    getSelectedScrollCartelaGroups,
    getSelectedScrollSourceFrames,
    layoutForCartela,
    makeReferenceVideoElement,
    movieTargetDurationFrames,
    movieUsesCustomTargetDuration,
    pageForAnimationFrame,
    pageIndexForAnimationFrame,
    readMovieSegmentSettings,
    state,
    updatePdfToolbar,
    windowRef: window,
  });
  const appPageExport = globalThis.CreditosAppPageExport.createAppPageExport({
    blobToBytes,
    buildPageMoviePlan,
    buildScrollMoviePlan,
    currentExportRenderOptions,
    documentRef: document,
    downloadBlob,
    drawCanvasMarginOverlay,
    drawCanvasPage,
    drawCanvasScrollFrame,
    drawReferenceVideoFrame,
    els,
    exportMovFramesIncrementally,
    exportPageSelection,
    getCurrentPhysicalPages,
    getExportRenderOptionsInDomain,
    getMovieMode,
    getPreviewAnimationPlan,
    getProductionSettings,
    getRenderLayout,
    getSelectedMovieGroupFrameCounts,
    getSelectedMoviePageGroups,
    getSelectedMoviePages,
    getSelectedScrollCartelaGroups,
    getSelectedScrollSourceFrames,
    joinPath,
    layoutForCartela,
    movieTargetDurationFrames,
    movieUsesCustomTargetDuration,
    nativeBridge,
    openMovExportProgressModal,
    readLocalPreference,
    readMovieSegmentSettings,
    rememberFileDirectory,
    safeFilePart,
    saveBlobAs,
    selectedRenderProfile,
    state,
    storageKeys: STORAGE_KEYS,
    throwIfMovExportCancelled,
    updateMovExportProgress,
    updatePdfToolbar,
    videoTimeForPage,
    wait,
    windowRef: window,
    writeAnimatedFrames,
    writeBlobToDirectory,
    writeRepeatedFrames,
  });
  const appStyleEditor = globalThis.CreditosAppStyleEditor.createAppStyleEditor({
    blockTypographyFields: BLOCK_TYPOGRAPHY_FIELDS,
    boolSelectValue,
    documentRef: document,
    fieldControlRegistry,
    getEffectiveStyleBlock,
    getEffectiveStyleCartela,
    getEffectiveStyleTitleTypography,
    getFontCatalog,
    getFontStyles,
    getProductionSettings,
    hasStyleCartelaOverride,
    hasStyleTitleTypographyOverride,
    hasStyleTypographyOverride,
    localDurationRow,
    localNumberRow,
    localSelectRow,
    makeFontFamilyControl,
    makeFontSizeControl,
    makeFontStyleControl,
    normalizeBoolean,
    normalizeColor,
    resetEditableStyleBlockOverride,
    resetEditableStyleCartelaOverride,
    resetEditableStyleTitleTypographyOverride,
    resetEditableStyleTypographyOverride,
    sectionLabel,
    textCapitalizationOptions: TEXT_CAPITALIZATION_OPTIONS,
    updateEditableStyleBlock,
    updateEditableStyleBlockAlignment,
    updateEditableStyleCartela,
    updateEditableStyleTitleTypography,
    updateEditableStyleTypography,
    yesNoOptions: YES_NO_OPTIONS,
  });
  const appCartelaTypography = globalThis.CreditosAppCartelaTypography.createAppCartelaTypography({
    blockTypographyFields: BLOCK_TYPOGRAPHY_FIELDS,
    documentRef: document,
    fieldControlRegistry,
    getEffectiveStyleTitleTypography,
    getFontCatalog,
    getFontStyles,
    getProductionSettings,
    getSelectedBlockTypography,
    getStyleById,
    hasCartelaBlockTypographyOverride,
    hasCartelaTitleTypographyOverride,
    makeFontFamilyControl,
    makeFontSizeControl,
    makeFontStyleControl,
    normalizeColor,
    resetSelectedBlockTypography,
    resetSelectedCartelaBlockTypographyOverride,
    resetSelectedCartelaTitleTypographyOverride,
    sectionLabel,
    updateSelectedBlockTypography,
    updateSelectedCartelaBlockTypography,
    updateSelectedCartelaTitleTypography,
  });
  const appMaterialEditor = globalThis.CreditosAppMaterialEditor.createAppMaterialEditor({
    documentRef: document,
    escapeHtml,
    getMaterialContentItems,
    getSelectedCartela,
    groupMusicLicenseThemes,
    inputRow,
    makePreviewInput,
    rebuild,
    sourceRefIsLocked,
    state,
    toggleSourceRefLock,
  });
  const appCartelaEditor = globalThis.CreditosAppCartelaEditor.createAppCartelaEditor({
    boolSelectValue,
    buildCurrentRenderJson,
    clearCartelaStyleOverrides,
    deleteSelectedManualCartela,
    documentRef: document,
    fieldControlRegistry,
    getEffectiveCartela,
    getEffectiveCartelaBlockStyle,
    getStyleById,
    hasCartelaBlockAlignmentOverride,
    hasCartelaOverride,
    hasCartelaStyleOverrides,
    localCheckboxRow,
    localDurationRow,
    localInputRow,
    localNumberRow,
    localSelectRow,
    moveMaterialToCartela,
    nativeBridge,
    normalizeBoolean,
    rebuild,
    refreshPdfIfActive,
    renderCartelaBlockTypographyControls,
    renderCartelaImageControls,
    renderCartelaList,
    renderCartelaTitleTypographyControls,
    renderEditor,
    renderPreview,
    resetSelectedCartelaBlockAlignmentOverride,
    resetSelectedCartelaBlockOverride,
    resetSelectedCartelaOverride,
    sectionLabel,
    state,
    textCapitalizationOptions: TEXT_CAPITALIZATION_OPTIONS,
    updateSelectedCartela,
    updateSelectedCartelaBlockAlignment,
    updateSelectedCartelaBlockStyle,
    windowRef: window,
    yesNoOptions: YES_NO_OPTIONS,
  });
  const appMainEditor = globalThis.CreditosAppMainEditor.createAppMainEditor({
    documentRef: document,
    els,
    escapeHtml,
    getCartelaDisplayName,
    getCartelaRefs,
    getEffectiveCartela,
    getSelectedCartela,
    renderCartelaFields,
    renderCartelaPreview,
    renderMaterialEditor,
    renderSourceRefControls,
    sectionLabel,
    state,
  });
  const pdfPanel = globalThis.CreditosPdfPanel.createPdfPanel({
    els,
    getCurrentPhysicalPages,
    getMovieMode,
    getPdfLineStatus,
    getProductionSettings,
    renderPreviewAnimationFrame,
    state,
    updateMovieDurationFields,
    updatePngZoomStatus,
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
    documentRef: document,
    fieldControlRegistry,
    getSelectedCartela,
    nativeBridge,
    readLocalPreference,
    rememberFileDirectory,
    sectionLabel,
    storageKeys: STORAGE_KEYS,
    uniqueCartelaImageId,
    updateSelectedCartela,
    windowRef: window,
  });
  const {
    renderCartelaImageControls: renderCartelaImageControlsFromImages,
  } = appCartelaImages;

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
    return appCommands.copyStylesFromEpisodeFlow();
  }

  async function createProductionFromUi() {
    return appCommands.createProductionFromUi();
  }

  async function duplicateSelectedProduction() {
    return appCommands.duplicateSelectedProduction();
  }

  async function deleteSelectedProduction() {
    return appCommands.deleteSelectedProduction();
  }

  async function updateProductionLayoutFromUi() {
    return appCommands.updateProductionLayoutFromUi();
  }

  async function updateProductionImportModelFromUi() {
    return appCommands.updateProductionImportModelFromUi();
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

  function changePdfPage(delta) {
    return appCommands.changePdfPage(delta);
  }

  function goToPdfPage(index) {
    return appCommands.goToPdfPage(index);
  }

  function adjustCurrentPdfPageLines(delta) {
    return appCommands.adjustCurrentPdfPageLines(delta);
  }

  function updateCurrentPdfCartela(fields) {
    return appCommands.updateCurrentPdfCartela(fields);
  }

  function updateStyleName(style, name) {
    return appCommands.updateStyleName(style, name);
  }

  function renderStyleEditor(style) {
    return appStyleEditor.renderStyleEditor(style);
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
    return appMainEditor.renderEditor();
  }

  function renderCartelaFields(cartela) {
    return appCartelaEditor.renderCartelaFields(cartela);
  }

  function renderCartelaImageControls(cartela) {
    return renderCartelaImageControlsFromImages(cartela);
  }

  function renderSourceRefControls(cartela) {
    return appCartelaEditor.renderSourceRefControls(cartela);
  }

  function renderMaterialEditor(material, ref) {
    return appMaterialEditor.renderMaterialEditor(material, ref);
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
    return appCartelaTypography.renderCartelaBlockTypographyControls(cartela, overrides);
  }

  function renderCartelaTitleTypographyControls(cartela) {
    return appCartelaTypography.renderCartelaTitleTypographyControls(cartela);
  }

  function renderBlockTypographyControls(ref) {
    return appCartelaTypography.renderBlockTypographyControls(ref);
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
    return appEditableInputs.inputRow(label, refId, field, fallback, options);
  }

  function makePreviewInput(refId, field, fallback, className) {
    return appEditableInputs.makePreviewInput(refId, field, fallback, className);
  }

  function makeVisualInput(refId, field, fallback, className, options = {}) {
    return appEditableInputs.makeVisualInput(refId, field, fallback, className, options);
  }

  function applyTypography(element, key, options = {}) {
    return appEditableInputs.applyTypography(element, key, options);
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
    return appVisualPreview.renderVisualPreview();
  }

  function refreshPdfIfActive() {
    if (state.activeTab === 'pdf') renderPdfPreview();
  }

  function renderPdfPreview() {
    return pdfPanel.renderPdfPreview();
  }

  function getPreviewAnimationPlan() {
    return appPreviewAnimation.getPreviewAnimationPlan();
  }

  async function renderPreviewAnimationFrame() {
    return appPreviewAnimation.renderPreviewAnimationFrame();
  }

  function makeReferenceVideoElement(plan, zoom) {
    return makeReferenceVideoElementInPreview(plan, zoom);
  }

  function togglePreviewAnimation() {
    return appPreviewAnimation.togglePreviewAnimation();
  }

  function stopPreviewAnimation() {
    return appPreviewAnimation.stopPreviewAnimation();
  }

  function seekPreviewAnimation(frame) {
    return appPreviewAnimation.seekPreviewAnimation(frame);
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
    return getCurrentPhysicalPagesFromPreviewRender();
  }

  function updatePdfToolbar(current, total) {
    return pdfPanel.updatePdfToolbar(current, total);
  }

  function currentMovieFps() {
    return appMovieControls.currentMovieFps();
  }

  function normalizeDurationInputElement(input, fps) {
    return appMovieControls.normalizeDurationInputElement(input, fps);
  }

  function readMovieSegmentSettings(fps) {
    return appMovieControls.readMovieSegmentSettings(fps);
  }

  function updateMovieSegmentInputs() {
    return appMovieControls.updateMovieSegmentInputs();
  }

  function getSelectedMoviePages() {
    return appMovieControls.getSelectedMoviePages();
  }

  function getSelectedMoviePageGroups() {
    return appMovieControls.getSelectedMoviePageGroups();
  }

  function getSelectedMovieGroupFrameCounts(fps) {
    return appMovieControls.getSelectedMovieGroupFrameCounts(fps);
  }

  function getMovieMode() {
    return appMovieControls.getMovieMode();
  }

  function getSelectedScrollCartelaGroups() {
    return appMovieControls.getSelectedScrollCartelaGroups();
  }

  function selectedMovieGroupCount() {
    return appMovieControls.selectedMovieGroupCount();
  }

  function getSelectedScrollSourceFrames(fps) {
    return appMovieControls.getSelectedScrollSourceFrames(fps);
  }

  function updateMovieDurationFields(options = {}) {
    return appMovieControls.updateMovieDurationFields(options);
  }

  function validateMovieTargetDuration() {
    return appMovieControls.validateMovieTargetDuration();
  }

  function movieTargetDurationFrames(fps) {
    return appMovieControls.movieTargetDurationFrames(fps);
  }

  function movieUsesCustomTargetDuration() {
    return appMovieControls.movieUsesCustomTargetDuration();
  }

  function updateMovExportProgress(currentFrame, totalFrames) {
    return appMovExportProgress.updateMovExportProgress(currentFrame, totalFrames);
  }

  function openMovExportProgressModal() {
    return appMovExportProgress.openMovExportProgressModal();
  }

  function throwIfMovExportCancelled() {
    return appMovExportProgress.throwIfMovExportCancelled();
  }

  async function exportScrollMovSequence({ native, filePath, fps, layout, encodingProfile, renderOptions = {} }) {
    return appPageExport.exportScrollMovSequence({ native, filePath, fps, layout, encodingProfile, renderOptions });
  }

  async function renderScrollFrameToPngBlob(plan, frame, layout, options = {}) {
    return appPageExport.renderScrollFrameToPngBlob(plan, frame, layout, options);
  }

  function updatePdfBaseName() {
    updateSettings({ pdf_base_name: safeFilePart(els.pdfBaseNameInput.value || 'creditos') });
    renderPreview();
  }

  function updatePngPreviewZoom(delta) {
    return updatePngPreviewZoomFromPreviewRender(delta);
  }

  function updatePngZoomStatus() {
    return updatePngZoomStatusFromPreviewRender();
  }

  function getCurrentPngPreviewZoom(layout) {
    return getCurrentPngPreviewZoomFromPreviewRender(layout);
  }

  function calculateFitPreviewZoom(layout) {
    return calculateFitPreviewZoomFromPreviewRender(layout);
  }

  function toggleMarginOverlay() {
    return toggleMarginOverlayFromPreviewRender();
  }

  function togglePanelMarginOverlay() {
    return togglePanelMarginOverlayFromPreviewRender();
  }

  function updatePanelMarginButtons() {
    return updatePanelMarginButtonsFromPreviewRender();
  }

  async function exportPngPages(mode) {
    return appPageExport.exportPngPages(mode);
  }

  async function exportMov() {
    return appPageExport.exportMov();
  }

  function readExportPageSelection(pages) {
    return appPageExport.readExportPageSelection(pages);
  }

  function currentExportRenderOptions() {
    return appPageExport.currentExportRenderOptions();
  }

  function currentVideoTimeForPage(page) {
    return appPageExport.currentVideoTimeForPage(page);
    }

  async function drawReferenceVideoFrame(ctx, layout, time) {
    await drawReferenceVideoFrameInPreview(ctx, layout, time);
  }

  function referenceVideoForCanvas() {
    return referenceVideoForCanvasInPreview();
  }

  async function renderPageToPngBlob(page, layout, options = {}) {
    return appPageExport.renderPageToPngBlob(page, layout, options);
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

}());
