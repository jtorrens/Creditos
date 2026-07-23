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
    cartelaQuickFilterEnabled: false,
    showMarginOverlay: false,
    showPanelMarginOverlay: false,
    previewAnimationEnabled: true,
    showPreviewReferenceVideo: false,
    showCartelaReferenceVideo: false,
    exportIncludeBackground: false,
    exportIncludeVideo: false,
    exportIncludeMargins: false,
    exportIncludeAnimation: true,
    movExportProgress: null,
    isLoadingEpisode: false,
    autosaveTimer: null,
    autosaveStyleTimers: new Map(),
    lastPreviewRangeTotal: 0,
    previewAnimation: {
      frame: 0,
      lastTickTime: 0,
      playing: false,
      raf: null,
      realTime: true,
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
    previewAnimationInput: document.getElementById('previewAnimationInput'),
    stylePreviewAnimationInput: document.getElementById('stylePreviewAnimationInput'),
    cartelaPreviewAnimationInput: document.getElementById('cartelaPreviewAnimationInput'),
    toggleMarginsBtn: document.getElementById('toggleMarginsBtn'),
    showPreviewReferenceVideoInput: document.getElementById('showPreviewReferenceVideoInput'),
    showCartelaReferenceVideoInput: document.getElementById('showCartelaReferenceVideoInput'),
    exportIncludeBackgroundInput: document.getElementById('exportIncludeBackgroundInput'),
    exportIncludeVideoInput: document.getElementById('exportIncludeVideoInput'),
    exportIncludeMarginsInput: document.getElementById('exportIncludeMarginsInput'),
    exportIncludeAnimationInput: document.getElementById('exportIncludeAnimationInput'),
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
    documentRef: document, els,
    initializeDatabase,
    nativeBridge,
    state,
    windowRef: window,
  });
  const {
    initializeDatabaseWithSyncCheck,
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
    applyTextSubstitutions,
    animationFadeAlpha,
    animationFadeRevealState,
    animatableStyleProperties,
    blockForTitleRepeat,
    boolSelectValue,
    buildFontCatalog,
    cartelaBlockGap,
    cartelaBlockTitleGap,
    cartelaWithResolvedRowAnimation,
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
    fontWeightFromTypography,
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
    mergeStyleAnimation,
    normalizeBoolean,
    normalizeColor,
    normalizeFontWeight,
    normalizeDurationInputValueInDomain,
    normalizeEditableValue,
    normalizeGlyphAlternates,
    normalizeLanguage,
    normalizeMovieSegmentSettings,
    normalizePreviewSettings,
    normalizeProtectedCapitalizationTerms,
    normalizeProtectedCapitalizationText,
    normalizeTextSubstitutions,
    normalizeReferenceVideo,
    normalizeRenderCodec,
    normalizeRenderProfile,
    normalizeSettings,
    normalizeStyleAnimation,
    typographyWithResolvedRowAnimation,
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
    resolveFontStyleForWeight,
    resolveOverride,
    roleNameGapForOrientation,
    safeFilePart,
    safeStyleId,
    scrollSourceFrameCounts,
    selectedImportModelIdInDomain,
    selectedProductionHasStoredSettings,
    setOverrideInDomain,
    settingsWithProductionLayout,
    serializeStyleAnimation,
    sourceBlankRowCounts,
    sourceUnitStartRow,
    stripProductionLayoutFromSettings,
    styleNameFromFileName,
    styleFadeBounds,
    styleFadeEasings,
    styleTransitionEasings,
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
    currentImportModelId: () => selectedImportModelIdInDomain(selectedProduction(), state.importModels),
    dbPost,
    getStructureJsonForOutput,
    getStyleById,
    state,
    windowRef: window,
    writeStyleFile,
  });
  const {
    flushCurrentEpisode,
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
    syncPreviewAnimationInputs,
    selectedRenderCodec,
    selectedRenderProfile,
  } = appPreviewSettings;
  const appBootstrap = globalThis.CreditosAppBootstrap.createAppBootstrap({
    appApi,
    els,
    initializeDatabaseWithSyncCheck,
    loadSystemFonts,
    nativeBridge,
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
    mergeStyleAnimation,
    normalizeBoolean,
    normalizeColor,
    normalizeFontWeight,
    normalizeStyleAnimation,
    normalizeTextCapitalization,
    safeStyleId,
    serializeStyleAnimation,
    styleCartelaFields: STYLE_CARTELA_FIELDS,
  });
  const {
    applyBlockStyleToCartelaRefs,
    applyExplicitCartelaOverridesFromSource,
    baseStyleCartelaFromSettings: baseStyleCartelaFromSettingsWithSettings,
    clearCartelaStyleOverrides,
    ensureCartelaSourceRefSettings,
    getEffectiveCartelaBlockStyle,
    getEffectiveCartelaAnimation,
    getEffectiveCartelaTitleTypography: getEffectiveCartelaTitleTypographyWithSettings,
    getEffectiveStyleBlock: getEffectiveStyleBlockWithSettings,
    getEffectiveStyleAnimation,
    getEffectiveStyleCartela: getEffectiveStyleCartelaWithSettings,
    getEffectiveStyleTitleTypography: getEffectiveStyleTitleTypographyWithSettings,
    getSourceRefAlignment,
    getSourceRefColumns,
    getSourceRefTypography,
    getSourceRefVerticalAlign,
    hasCartelaBlockAlignmentOverride,
    hasCartelaBlockTypographyOverride,
    hasCartelaAnimationOverride,
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
    resetCartelaBlockTypographyFieldOverride: resetCartelaBlockTypographyFieldOverrideInDomain,
    resetCartelaBlockTypographyOverride: resetCartelaBlockTypographyOverrideInDomain,
    resetCartelaTitleTypographyFieldOverride: resetCartelaTitleTypographyFieldOverrideInDomain,
    resetCartelaTitleTypographyOverride: resetCartelaTitleTypographyOverrideInDomain,
    resetStyleBlockAlignmentOverride: resetStyleBlockAlignmentOverrideInDomain,
    resetStyleBlockOverride: resetStyleBlockOverrideInDomain,
    resetStyleCartelaOverride: resetStyleCartelaOverrideInDomain,
    resetStyleTitleTypographyFieldOverride: resetStyleTitleTypographyFieldOverrideInDomain,
    resetStyleTitleTypographyOverride: resetStyleTitleTypographyOverrideInDomain,
    resetStyleTypographyFieldOverride: resetStyleTypographyFieldOverrideInDomain,
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
    updateStyleBlock: updateStyleBlockInDomain,
    updateStyleBlockAlignment: updateStyleBlockAlignmentInDomain,
    updateStyleCartela: updateStyleCartelaInDomain,
    updateStyleTitleTypography: updateStyleTitleTypographyInDomain,
    updateStyleTypography: updateStyleTypographyInDomain,
  } = styleDomain;
  const appSelectors = globalThis.CreditosAppSelectors.createAppSelectors({
    baseStyleCartelaFromSettingsWithSettings,
    getEffectiveCartelaTitleTypographyWithSettings,
    getEffectiveStyleBlockWithSettings,
    getEffectiveStyleCartelaWithSettings,
    getEffectiveStyleTitleTypographyWithSettings,
    getProductionLayout, getProductionSettings,
    settingsWithProductionLayout, state,
  });
  const appStyleState = globalThis.CreditosAppStyleState.createAppStyleState({
    buildCurrentRenderJson,
    dbPost, getProductionSettings,
    normalizeCartelaStyle,
    pruneRedundantStyleDefaultsInDomain,
    pruneRedundantStyleOverridesInDomain,
    refreshPdfIfActive,
    renderCartelaList, renderEditor,
    renderPreview, renderStylesPane,
    serializeCartelaStyle,
    state,
  });
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
    applyTextSubstitutions,
    buildPhysicalPages,
    canvasTextMetrics,
    canvasWrappedTextLines,
    cartelaHasRenderableRefs,
    cartelaImages,
    forceRenderedRoleNameColumns,
    getEffectiveCartela,
    getEffectiveCartelaAnimation,
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
    serializeStyleAnimation,
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
    pageFrameStateForAnimationFrame,
    pageIndexForAnimationFrame,
    videoTimeForPage,
  } = timelineDomain;
  const appGlyphAlternates = globalThis.CreditosAppGlyphAlternates.createAppGlyphAlternates({
    clearCanvasTextCaches: () => clearCanvasTextCachesInPreview(),
    documentRef: document,
    fontStyleFromStyle,
    fontWeightFromStyle,
    getProductionSettings,
    nativeBridge,
    normalizeGlyphAlternates,
    onFontFacesReady: () => {
      renderPreview();
      renderVisiblePanelPreviews();
    },
    quoteFontFamily,
    updateSettings,
  });
  const appComposition = globalThis.CreditosAppComposition.createAppComposition({
    documentRef: document,
    textCapitalizationOptions: TEXT_CAPITALIZATION_OPTIONS,
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
      applyTextSubstitutions,
      animationFadeAlpha,
      animationFadeRevealState,
      applyTypography,
      cartelaBlockGap,
      cartelaBlockTitleGap,
      cartelaImages,
      cartelaWithResolvedRowAnimation,
      typographyWithResolvedRowAnimation,
      typographyFontFamilyCss: appGlyphAlternates.fontFamilyCss,
      contentAreaRect,
      creditSourceId,
      explicitTextLines,
      fontStyleFromStyle,
      fontWeightFromStyle,
      fontWeightFromTypography,
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
    clearCanvasTextCaches: clearCanvasTextCachesInPreview,
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
    fontStylesForFamily,
    refreshPdfIfActive,
    renderEditor,
    renderPreview,
    renderProjectSelectors,
    renderSettings,
    setFontSources: appGlyphAlternates.setFontSources,
    state,
    windowRef: window,
  });
  const {
    getFontCatalog,
    getFontStyles,
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
    sectionLabel,
  } = appFormRows;
  const appAccordion = globalThis.CreditosUiAccordion.createAccordion({
    documentRef: document,
  });
  const glyphAlternatesTable = globalThis.CreditosGlyphAlternatesTable.createGlyphAlternatesTable({
    analyzeInventory: appGlyphAlternates.analyzeInventory,
    documentRef: document,
    fontStyleFromStyle,
    fontWeightFromTypography,
    quoteFontFamily,
    rulesForTypography: appGlyphAlternates.rulesForTypography,
    saveRule: appGlyphAlternates.saveRule,
  });
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
    normalizeBoolean,
    normalizeColor,
    normalizeProtectedCapitalizationText,
    normalizeTextSubstitutions,
    renderGlyphAlternates: (category, typography) => glyphAlternatesTable.render(category, typography),
    renderAccordionGroup: appAccordion.renderAccordionGroup,
    sectionLabel,
    textCapitalizationOptions: TEXT_CAPITALIZATION_OPTIONS,
    typographyFields: TYPOGRAPHY_FIELDS,
    updateBaseTypographyFamily,
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
    flushCurrentEpisode,
    frameForPdfPageIndex,
    getCurrentPhysicalPages,
    getEffectiveStyleTitleTypography,
    getPreviewAnimationPlan,
    getSelectedCartela,
    getFontStyles,
    getStyleById,
    getProductionSettings,
    initializeDatabase,
    insertManualCartela,
    loadCurrentEpisode,
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
    resetCartelaBlockTypographyFieldOverrideInDomain,
    resetCartelaBlockTypographyOverrideInDomain,
    resetCartelaOverrideInStructure,
    resetCartelaTitleTypographyFieldOverrideInDomain,
    resetCartelaTitleTypographyOverrideInDomain,
    resetStyleBlockAlignmentOverrideInDomain,
    resetStyleBlockOverrideInDomain,
    resetStyleCartelaOverrideInDomain,
    resetStyleTitleTypographyFieldOverrideInDomain,
    resetStyleTitleTypographyOverrideInDomain,
    resetStyleTypographyFieldOverrideInDomain,
    resetStyleTypographyOverrideInDomain,
    normalizeColor,
    normalizeStyleAnimation,
    normalizeTitleTypographyOverrides,
    safeStyleId,
    sanitizeStyleBlockOverrides,
    sanitizeStyleCartelaOverrides,
    scheduleStyleAutosave,
    scheduleAutosave,
    selectedImportModelIdInDomain,
    selectedProduction,
    setSelectedProductionLocalFields,
    showEpisodeStyleSourceModal: (episodes) => projectPanel.showEpisodeStyleSourceModal(episodes),
    state,
    stripProductionLayoutFromSettings,
    typographyFields: TYPOGRAPHY_FIELDS,
    updateCartelaBlockAlignmentInDomain,
    updateCartelaBlockStyleInDomain,
    updateCartelaBlockTypographyInDomain,
    updateCartelaInStructure,
    updateCartelaTitleTypographyInDomain,
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
  const appEpisodeLoader = globalThis.CreditosAppEpisodeLoader.createAppEpisodeLoader({
    applyPreviewSettingsToUi,
    buildCurrentRenderJson,
    createMaterialsFromSource,
    createStructureFromSource,
    currentImportModelId: () => selectedImportModelIdInDomain(selectedProduction(), state.importModels),
    dbPost,
    defaultPreviewSettings,
    loadStyleObjects,
    migrateStructure,
    normalizeReferenceVideo,
    normalizeSource,
    persistCurrentEpisode,
    persistSelectedProductionFields,
    rebuild,
    selectedProduction,
    selectedProductionHasStoredSettings,
    setSelectedProductionLocalFields,
    state,
    stripProductionLayoutFromSettings,
    updateReferenceVideoStatus,
    updateXlsxStatus,
  });
  const appProjectSelection = globalThis.CreditosAppProjectSelection.createAppProjectSelection({
    currentProductionEpisodes,
    dbPost,
    els,
    loadCurrentEpisode,
    loadProductionStyles,
    readSavedSelection,
    rememberCurrentSelection,
    renderProjectSelectors,
    state,
    updateDatabaseStatus,
    windowRef: window,
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
    hasCartelaStyleOverrides,
    moveSelectedCartelaVisualOrder,
    copyCartelaStyle: (sourceId, targetId) => appCommands.copyCartelaStyle(sourceId, targetId),
    selectCartela: (cartelaId) => {
      state.selectedCartelaId = cartelaId;
      rebuild({ selectionOnly: true });
    },
    selectedEpisode,
    state,
  });
  const cartelaPreviewPanel = globalThis.CreditosCartelaPreviewPanel.createCartelaPreviewPanel({
    documentRef: document,
    currentMovieFps,
    drawCanvasPage,
    els,
    fieldControlRegistry,
    getCurrentPhysicalPages,
    getProductionSettings,
    getPreviewAnimationPlan,
    getRenderLayout,
    getSelectedCartela,
    layoutForCartela,
    makeMarginOverlay,
    makePdfSheetElement,
    makeReferenceVideoElement,
    previewAnimationEnabled,
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
    fontWeightFromTypography,
    fontWeightFromStyle,
    getEffectiveCartela,
    getProductionSettings,
    getSelectedCartela,
    hasEditableOverride,
    normalizeBoolean,
    normalizeSettings,
    renderCartelaPreview,
    renderPreview,
    resolveOverride,
    setEditableOverride,
    state,
    typographyFontFamilyCss: appGlyphAlternates.fontFamilyCss,
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
    pageFrameStateForAnimationFrame,
    pageIndexForAnimationFrame,
    previewAnimationEnabled,
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
    ensureGlyphAlternateFontsReady: appGlyphAlternates.ensureFontsReady,
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
    includeExportAnimation: () => state.exportIncludeAnimation !== false,
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
  const appStyleAnimationEditor = globalThis.CreditosAppStyleAnimationEditor.createAppStyleAnimationEditor({
    animatableStyleProperties,
    boolSelectValue,
    currentMovieFps,
    documentRef: document,
    fieldControlRegistry,
    getEffectiveCartela,
    getEffectiveCartelaAnimation,
    hasCartelaAnimationOverride,
    localInputRow,
    localNumberRow,
    localSelectRow,
    normalizeBoolean,
    normalizeStyleAnimation,
    resetSelectedCartelaAnimationOverride,
    renderAccordionGroup: appAccordion.renderAccordionGroup,
    renderEditor,
    sectionLabel,
    styleFadeBounds,
    styleFadeEasings,
    styleTransitionEasings,
    updateEditableStyleAnimation,
    updateSelectedCartelaAnimation,
    yesNoOptions: YES_NO_OPTIONS,
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
    localInputRow,
    localDurationRow,
    localNumberRow,
    localSelectRow,
    normalizeBoolean,
    normalizeColor,
    normalizeStyleAnimation,
    resetEditableStyleBlockOverride,
    resetEditableStyleCartelaOverride,
    resetEditableStyleTitleTypographyFieldOverride,
    resetEditableStyleTitleTypographyOverride,
    resetEditableStyleTypographyFieldOverride,
    resetEditableStyleTypographyOverride,
    renderStyleAnimationControls: appStyleAnimationEditor.renderStyleAnimationControls,
    renderAccordionGroup: appAccordion.renderAccordionGroup,
    styleAnimationRowMeta: appStyleAnimationEditor.styleAnimationRowMeta,
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
    getStyleById,
    hasCartelaBlockTypographyOverride,
    hasCartelaTitleTypographyOverride,
    normalizeColor,
    resetSelectedCartelaBlockTypographyOverride,
    resetSelectedCartelaBlockTypographyFieldOverride,
    resetSelectedCartelaTitleTypographyOverride,
    resetSelectedCartelaTitleTypographyFieldOverride,
    sectionLabel,
    updateSelectedCartelaBlockTypography,
    updateSelectedCartelaTitleTypography,
  });
  const appMaterialEditor = globalThis.CreditosAppMaterialEditor.createAppMaterialEditor({
    documentRef: document,
    ensureCartelaSourceRefSettings,
    escapeHtml,
    getMaterialContentItems,
    getSelectedCartela,
    groupMusicLicenseThemes,
    inputRow,
    makePreviewInput,
    normalizeFrozenMaterial,
    rebuild,
    hasEditableOverride,
    resetEditableOverrides,
    sourceRefIsLocked,
    state,
  });
  const appCartelaEditor = globalThis.CreditosAppCartelaEditor.createAppCartelaEditor({
    blockTypographyFields: BLOCK_TYPOGRAPHY_FIELDS,
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
    hasCartelaBlockTypographyOverride,
    hasCartelaAnimationOverride,
    hasCartelaOverride,
    hasCartelaStyleOverrides,
    hasCartelaTitleTypographyOverride,
    localCheckboxRow,
    localDurationRow,
    localInputRow,
    localNumberRow,
    localSelectRow,
    moveMaterialToCartela,
    nativeBridge,
    normalizeBoolean,
    normalizeStyleAnimation,
    previewAnimationEnabled,
    rebuild,
    refreshPdfIfActive,
    renderAccordionGroup: appAccordion.renderAccordionGroup,
    renderCartelaBlockTypographyControls,
    renderCartelaAnimationControls: appStyleAnimationEditor.renderCartelaAnimationControls,
    cartelaAnimationRowMeta: appStyleAnimationEditor.cartelaAnimationRowMeta,
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
    animationFadeAlpha,
    animationFadeRevealState,
    buildPhysicalPages,
    cartelaWithResolvedRowAnimation,
    currentMovieFps,
    documentRef: document,
    drawCanvasPage,
    els,
    fieldControlRegistry,
    getProductionSettings,
    getRenderLayout,
    getStyleById,
    layoutForCartela,
    makeMarginOverlay,
    makePdfSheetElement,
    makeSampleStyleRender,
    previewAnimationEnabled,
    previewZoomForContainer,
    renderStyleEditor,
    selectedProduction,
    state,
    typographyWithResolvedRowAnimation,
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
  const appLifecycle = globalThis.CreditosAppLifecycle.createAppLifecycle({
    buildCurrentRenderJson,
    documentRef: document,
    els,
    getStyleById,
    renderCartelaList,
    renderCartelaPreview,
    renderEditor,
    renderPdfPreview,
    renderSettings,
    renderStylePreview,
    renderStylesPane,
    scheduleAutosave,
    selectedEpisode,
    selectedProduction,
    state,
    structureJsonForOutput,
    updateXlsxStatus,
    windowRef: window,
  });

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
      setPreviewAnimationEnabled,
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
    return appProjectSelection.initializeDatabase(options);
  }

  function applyDatabaseOverview(overview) {
    return appProjectSelection.applyDatabaseOverview(overview);
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
    return appProjectSelection.selectProductionFromUi();
  }

  async function selectProductionById(productionId) {
    return appProjectSelection.selectProductionById(productionId);
  }

  function toggleCreateProductionBox() {
    return appProjectSelection.toggleCreateProductionBox();
  }

  async function selectEpisodeFromUi() {
    return appProjectSelection.selectEpisodeFromUi();
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
    return appEpisodeLoader.loadProductionStyles();
  }

  async function loadCurrentEpisode() {
    return appEpisodeLoader.loadCurrentEpisode();
  }

  function renderVisiblePanelPreviews() {
    return appLifecycle.renderVisiblePanelPreviews();
  }

  function previewAnimationEnabled() {
    return state.previewAnimationEnabled !== false;
  }

  function setPreviewAnimationEnabled(enabled) {
    state.previewAnimationEnabled = !!enabled;
    syncPreviewAnimationInputs();
    renderVisiblePanelPreviews();
    if (state.activeTab === 'pdf') renderPdfPreview();
    savePreviewSettingsFromUi();
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

  function rebuild(options) {
    return appLifecycle.rebuild(options);
  }

  function renderMeta() {
    return appLifecycle.renderMeta();
  }

  function setActiveTab(tabName) {
    return appLifecycle.setActiveTab(tabName);
  }

  function renderSettings() {
    return settingsPanel.renderSettings();
  }

  async function loadSystemFonts(options = {}) {
    return appFonts.loadSystemFonts(options);
  }

  function loadStyleObjects(styleObjects) {
    return appStyleState.loadStyleObjects(styleObjects);
  }

  function getEffectiveStyleCartela(style) {
    return appSelectors.getEffectiveStyleCartela(style);
  }

  function getEffectiveStyleTitleTypography(style) {
    return appSelectors.getEffectiveStyleTitleTypography(style);
  }

  function getEffectiveCartelaTitleTypography(cartela) {
    return appSelectors.getEffectiveCartelaTitleTypography(cartela);
  }

  function baseStyleCartelaFromSettings() {
    return appSelectors.baseStyleCartelaFromSettings();
  }

  function getEffectiveStyleBlock(style) {
    return appSelectors.getEffectiveStyleBlock(style);
  }

  function getStyleById(styleId) {
    return appSelectors.getStyleById(styleId);
  }

  function updateTypographySetting(key, fields) {
    return appCommands.updateTypographySetting(key, fields);
  }

  function updateBaseTypographyFamily(fontFamily) {
    return appCommands.updateBaseTypographyFamily(fontFamily);
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

  function updateEditableStyleAnimation(style, animation) {
    return appCommands.updateEditableStyleAnimation(style, animation);
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

  function resetEditableStyleTitleTypographyFieldOverride(style, fields) {
    return appCommands.resetEditableStyleTitleTypographyFieldOverride(style, fields);
  }

  function updateEditableStyleTypography(style, key, fields) {
    return appCommands.updateEditableStyleTypography(style, key, fields);
  }

  function resetEditableStyleTypographyOverride(style, key) {
    return appCommands.resetEditableStyleTypographyOverride(style, key);
  }

  function resetEditableStyleTypographyFieldOverride(style, key, fields) {
    return appCommands.resetEditableStyleTypographyFieldOverride(style, key, fields);
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

  function renderEditor(options) {
    return appMainEditor.renderEditor(options);
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

  function renderCartelaBlockTypographyControls(cartela, overrides) {
    return appCartelaTypography.renderCartelaBlockTypographyControls(cartela, overrides);
  }

  function renderCartelaTitleTypographyControls(cartela) {
    return appCartelaTypography.renderCartelaTitleTypographyControls(cartela);
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

  function resetSelectedCartelaBlockTypographyFieldOverride(key, fields) {
    return appCommands.resetSelectedCartelaBlockTypographyFieldOverride(key, fields);
  }

  function updateSelectedCartelaBlockTypography(key, fields, options = {}) {
    return appCommands.updateSelectedCartelaBlockTypography(key, fields, options);
  }

  function resetSelectedCartelaTitleTypographyOverride() {
    return appCommands.resetSelectedCartelaTitleTypographyOverride();
  }

  function resetSelectedCartelaTitleTypographyFieldOverride(fields) {
    return appCommands.resetSelectedCartelaTitleTypographyFieldOverride(fields);
  }

  function updateSelectedCartelaTitleTypography(fields, options = {}) {
    return appCommands.updateSelectedCartelaTitleTypography(fields, options);
  }

  function updateSelectedCartelaAnimation(animation) {
    return appCommands.updateSelectedCartelaAnimation(animation);
  }

  function resetSelectedCartelaAnimationOverride() {
    return appCommands.resetSelectedCartelaAnimationOverride();
  }

  function pruneCurrentRedundantStyleOverrides() {
    return appStyleState.pruneCurrentRedundantStyleOverrides();
  }

  function pruneCurrentRedundantStyleDefaults() {
    return appStyleState.pruneCurrentRedundantStyleDefaults();
  }

  async function writeStyleFile(style, options = {}) {
    return appStyleState.writeStyleFile(style, options);
  }

  function getSelectedCartela() {
    return appSelectors.getSelectedCartela();
  }

  function getEffectiveCartela(cartela) {
    return appSelectors.getEffectiveCartela(cartela);
  }

  function getCartelaStyleBlock(cartela) {
    return appSelectors.getCartelaStyleBlock(cartela);
  }

  function inputRow(label, refId, field, fallback, options) {
    return appEditableInputs.inputRow(label, refId, field, fallback, options);
  }

  function makePreviewInput(refId, field, fallback, className, options = {}) {
    return appEditableInputs.makePreviewInput(refId, field, fallback, className, options);
  }

  function makeVisualInput(refId, field, fallback, className, options = {}) {
    return appEditableInputs.makeVisualInput(refId, field, fallback, className, options);
  }

  function applyTypography(element, key, options = {}) {
    return appEditableInputs.applyTypography(element, key, options);
  }

  function getRenderLayout() {
    return appSelectors.getRenderLayout();
  }

  function setEditableOverride(refId, field, value, fallback) {
    setOverrideInDomain(state.structure, refId, field, value, fallback);
  }

  function hasEditableOverride(refId, field) {
    return !!(
      state.structure &&
      state.structure.overrides &&
      state.structure.overrides[refId] &&
      Object.prototype.hasOwnProperty.call(state.structure.overrides[refId], field)
    );
  }

  function resetEditableOverrides(entries = []) {
    if (!state.structure) return;
    (entries || []).forEach((entry) => {
      if (!entry || !entry.refId || !entry.field) return;
      setOverrideInDomain(state.structure, entry.refId, entry.field, entry.fallback, entry.fallback);
    });
    state.render = state.source && state.structure ? buildCurrentRenderJson(state.source, state.materials, state.structure) : state.render;
    renderEditor();
    renderPreview();
    renderCartelaPreview();
  }

  function setPreview(kind) {
    state.preview = kind;
    if (els.structureTab) els.structureTab.classList.toggle('active', kind === 'structure');
    if (els.renderTab) els.renderTab.classList.toggle('active', kind === 'render');
    renderPreview();
  }

  function renderPreview() {
    return appLifecycle.renderPreview();
  }

  function getStructureJsonForOutput() {
    return appLifecycle.getStructureJsonForOutput();
  }

  function renderVisualPreview() {
    return appVisualPreview.renderVisualPreview();
  }

  function refreshPdfIfActive() {
    return appLifecycle.refreshPdfIfActive();
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

  async function drawCanvasPage(ctx, page, layout, renderOptions) {
    await drawCanvasPageInPreview(ctx, page, layout, renderOptions);
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
