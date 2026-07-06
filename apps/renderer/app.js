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
  const TEXT_VERTICAL_BLEED_RATIO = 0.35;
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
  const commonDomain = globalThis.CreditosDomainCommon.createCommonDomain();
  const {
    clamp,
    directoryFromPath,
    joinPath,
    normalizeBoolean,
    normalizeColor,
    normalizeEditableValue,
    normalizeText,
    safeFilePart,
    styleNameFromFileName,
  } = commonDomain;
  const typographyDomain = globalThis.CreditosDomainTypography.createTypographyDomain();
  const {
    fontStyleFromStyle,
    fontWeightFromStyle,
    quoteFontFamily,
  } = typographyDomain;
  const settingsDomain = globalThis.CreditosDomainSettings.createSettingsDomain({
    languageLocales: LANGUAGE_LOCALES,
    languageOptions: LANGUAGE_OPTIONS,
    normalizeBoolean,
    normalizeColor,
    safeFilePart,
    textCapitalizationOptions: TEXT_CAPITALIZATION_OPTIONS,
    titleMinorWords: TITLE_MINOR_WORDS,
    typographyFields: TYPOGRAPHY_FIELDS,
  });
  const {
    applyProtectedCapitalizations,
    applyTextCapitalization,
    defaultSettings,
    localeForLanguage,
    normalizeLanguage,
    normalizeProtectedCapitalizationTerms,
    normalizeProtectedCapitalizationText,
    normalizeSettings,
    normalizeTextCapitalization,
    settingsWithProductionLayout,
    stripProductionLayoutFromSettings,
    transformCartelaText,
  } = settingsDomain;
  const previewSettingsDomain = globalThis.CreditosDomainPreviewSettings.createPreviewSettingsDomain({
    movEncodingProfiles: MOV_ENCODING_PROFILES,
  });
  const {
    defaultPreviewSettings,
    normalizePreviewSettings,
    normalizeReferenceVideo,
    normalizeRenderCodec,
    normalizeRenderProfile,
  } = previewSettingsDomain;
  const timecodeDomain = globalThis.CreditosDomainTimecode.createTimecodeDomain();
  const {
    formatFrameDuration,
    formatSecondsAsFrameDuration,
    getMovieBodyTargetFramesOrSource,
    getMovieExportFrameCounts,
    getPageFrameCount,
    movieBodySourceTotal,
    parseFrameDuration,
  } = timecodeDomain;
  const paginationUnitsDomain = globalThis.CreditosDomainPaginationUnits.createPaginationUnitsDomain();
  const {
    blockForTitleRepeat,
    countTitleLine,
    creditSourceId,
    explicitTextLines,
    sourceBlankRowCounts,
    sourceUnitStartRow,
    unitRenderOptions,
  } = paginationUnitsDomain;
  const styleDomain = globalThis.CreditosDomainStyles.createStyleDomain({
    blockTypographyFields: BLOCK_TYPOGRAPHY_FIELDS,
    getEffectiveCartelaBlockStyle,
    normalizeBoolean,
    normalizeColor,
    normalizeTextCapitalization,
    safeStyleId,
  });
  const {
    baseStyleCartelaFromSettings: baseStyleCartelaFromSettingsWithSettings,
    clonePlainValue,
    explicitCartelaBlockStyle,
    explicitCartelaTitleTypography,
    explicitSourceRefSettings,
    getEffectiveCartelaTitleTypography: getEffectiveCartelaTitleTypographyWithSettings,
    getEffectiveStyleBlock: getEffectiveStyleBlockWithSettings,
    getEffectiveStyleCartela: getEffectiveStyleCartelaWithSettings,
    getEffectiveStyleTitleTypography: getEffectiveStyleTitleTypographyWithSettings,
    getSourceRefAlignment,
    getSourceRefColumns,
    getSourceRefTypography,
    getSourceRefVerticalAlign,
    normalizeBlockAlignment,
    normalizeCartelaStyle,
    normalizeStyleCartela,
    normalizeStyleBlock,
    normalizeTitleTypographyOverrides,
    normalizeTypographyOverrides,
    normalizeVerticalAlign,
    sanitizeStyleCartelaOverrides,
    sanitizeStyleBlockOverrides,
    serializeCartelaStyle,
    sameStyleValue,
  } = styleDomain;
  const sourceDomain = globalThis.CreditosDomainSource.createSourceDomain({
    safeFilePart,
  });
  const {
    normalizeSource,
  } = sourceDomain;
  const materialsDomain = globalThis.CreditosDomainMaterials.createMaterialsDomain({
    normalizeText,
    safeFilePart,
  });
  const {
    createMaterialsFromSource,
    defaultLayoutForMaterial,
    defaultOrientationForMaterial,
  } = materialsDomain;
  const renderUnitsDomain = globalThis.CreditosDomainRenderUnits.createRenderUnitsDomain({
    normalizeText,
    resolveOverride,
  });
  const {
    forceRenderedRoleNameColumns,
    getMaterialContentItems,
    getRenderedBlockUnits,
    groupMusicLicenseThemes,
    renderMaterial,
    renderedUnitText,
  } = renderUnitsDomain;
  const layoutDomain = globalThis.CreditosDomainLayout.createLayoutDomain();
  const {
    contentAreaRect,
    layoutForCartela,
    numberWithFallback,
  } = layoutDomain;
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
    enforceUniqueMaterialRefs,
    ensureCartelaOrders,
    getCartelaRefs,
    getVisualCartelas,
    migrateStructure,
    normalizeCartelaImages,
    normalizeFrozenMaterial,
    normalizeVisualOrders,
    removeDefaultEmptyCartelas,
  } = structureDomain;
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
    buildPhysicalPages,
    repeatBlockTitlesForCartela,
    unitGapBefore,
  } = paginationDomain;

  const FONT_OPTIONS = [
    'Arial',
    'Helvetica',
    'Georgia',
    'Times New Roman',
    'Courier New',
    'Verdana',
    'Trebuchet MS',
  ];
  const canvasImageCache = new Map();
  let canvasMeasureContext = null;
  const canvasWrapCache = new Map();
  let currentPhysicalPagesCache = { render: null, pages: [] };
  let previewPlanCache = { render: null, key: '', plan: null };

  els.openXlsxBtn.addEventListener('click', openXlsxFile);
  if (els.openReferenceVideoBtn) els.openReferenceVideoBtn.addEventListener('click', associateReferenceVideo);
  if (els.clearReferenceVideoBtn) els.clearReferenceVideoBtn.addEventListener('click', clearReferenceVideo);
  if (els.newCartelaBtn) els.newCartelaBtn.addEventListener('click', addEmptyCartela);
  if (els.copyEpisodeStylesBtn) els.copyEpisodeStylesBtn.addEventListener('click', copyStylesFromEpisodeFlow);
  els.xlsxInput.addEventListener('change', loadXlsxFile);
  els.productionSelect.addEventListener('change', selectProductionFromUi);
  els.productionPageWidthInput.addEventListener('change', updateProductionLayoutFromUi);
  els.productionPageHeightInput.addEventListener('change', updateProductionLayoutFromUi);
  els.productionPreviewBackgroundInput.addEventListener('input', updateProductionLayoutFromUi);
  if (els.productionImportModelSelect) els.productionImportModelSelect.addEventListener('change', updateProductionImportModelFromUi);
  els.episodeSelect.addEventListener('change', selectEpisodeFromUi);
  els.showCreateProductionBtn.addEventListener('click', toggleCreateProductionBox);
  els.duplicateProductionBtn.addEventListener('click', duplicateSelectedProduction);
  els.deleteProductionBtn.addEventListener('click', deleteSelectedProduction);
  els.createProductionBtn.addEventListener('click', createProductionFromUi);
  els.createStyleBtn.addEventListener('click', createStyleFromUi);
  els.duplicateStyleBtn.addEventListener('click', duplicateSelectedStyle);
  els.deleteStyleBtn.addEventListener('click', deleteSelectedStyle);
  els.tabButtons.forEach((button) => {
    button.addEventListener('click', () => setActiveTab(button.dataset.tab));
  });
  els.defaultDurationInput.addEventListener('change', () => {
    const fps = getMovieFps();
    const frames = normalizeDurationInputValue(els.defaultDurationInput, fps);
    if (frames === null) {
      window.alert(`Introduce la duración como mm:ss:ff. También puedes escribir solo números, por ejemplo 35 = ${formatFrameDuration(35, fps)}.`);
      els.defaultDurationInput.value = formatSecondsAsFrameDuration(getProductionSettings().default_cartela_duration, fps);
      return;
    }
    updateSettings({ default_cartela_duration: frames / fps });
  });
  els.defaultAutoLinesInput.addEventListener('change', () => updateSettings({
    default_auto_page_lines: Math.max(1, Number(els.defaultAutoLinesInput.value) || 1),
  }));
  els.movieFpsInput.addEventListener('change', () => {
    updateSettings({
      movie_fps: Math.max(1, Math.round(Number(els.movieFpsInput.value) || 25)),
    });
    updateMovieDurationFields({ resetTarget: true });
  });
  if (els.structureTab) els.structureTab.addEventListener('click', () => setPreview('structure'));
  if (els.renderTab) els.renderTab.addEventListener('click', () => setPreview('render'));
  els.pdfFirstPageBtn.addEventListener('click', () => goToPdfPage(0));
  els.pdfPrevPageBtn.addEventListener('click', () => changePdfPage(-1));
  els.pdfNextPageBtn.addEventListener('click', () => changePdfPage(1));
  els.pdfLastPageBtn.addEventListener('click', () => goToPdfPage(Number.POSITIVE_INFINITY));
  els.pdfPageNumberInput.addEventListener('change', () => goToPdfPage((Number(els.pdfPageNumberInput.value) || 1) - 1));
  els.pdfMinusLinesBtn.addEventListener('click', () => adjustCurrentPdfPageLines(-1));
  els.pdfPlusLinesBtn.addEventListener('click', () => adjustCurrentPdfPageLines(1));
  els.pdfBaseNameInput.addEventListener('input', updatePdfBaseName);
  els.exportFromPageInput.addEventListener('change', () => {
    els.exportFromPageInput.dataset.manual = '1';
    els.exportToPageInput.dataset.manual = '1';
    updateMovieDurationFields({ resetTarget: true });
    savePreviewSettingsFromUi();
  });
  els.exportToPageInput.addEventListener('change', () => {
    els.exportFromPageInput.dataset.manual = '1';
    els.exportToPageInput.dataset.manual = '1';
    updateMovieDurationFields({ resetTarget: true });
    savePreviewSettingsFromUi();
  });
  if (els.movieModeSelect) els.movieModeSelect.addEventListener('change', () => {
    if (getMovieMode() === 'scroll') {
      els.exportFromPageInput.dataset.manual = '0';
      els.exportToPageInput.dataset.manual = '0';
    }
    updateMovieDurationFields();
    renderPdfPreview();
    savePreviewSettingsFromUi();
  });
  if (els.movieCodecSelect) els.movieCodecSelect.addEventListener('change', () => {
    renderMovieEncodingProfiles(els.movieCodecSelect.value);
    ensureBackgroundForEncodingProfile();
    savePreviewSettingsFromUi();
  });
  if (els.movieEncodingProfileSelect) els.movieEncodingProfileSelect.addEventListener('change', () => {
    ensureBackgroundForEncodingProfile();
    savePreviewSettingsFromUi();
  });
  els.movieTargetDurationInput.addEventListener('focus', () => {
    els.movieTargetDurationInput.dataset.auto = '0';
  });
  els.movieTargetDurationInput.addEventListener('change', validateMovieTargetDuration);
  [els.moviePrerollCountInput, els.moviePrerollDurationInput, els.moviePostrollCountInput, els.moviePostrollDurationInput]
    .filter(Boolean)
    .forEach((input) => input.addEventListener('change', updateMovieSegmentInputs));
  els.pdfVerticalOffsetInput.addEventListener('change', () => updateCurrentPdfCartela({ vertical_offset: Number(els.pdfVerticalOffsetInput.value) || 0 }));
  els.pngZoomOutBtn.addEventListener('click', () => updatePngPreviewZoom(-0.1));
  els.pngZoomInBtn.addEventListener('click', () => updatePngPreviewZoom(0.1));
  if (els.previewStartBtn) els.previewStartBtn.addEventListener('click', () => seekPreviewAnimation(0));
  if (els.previewPlayBtn) els.previewPlayBtn.addEventListener('click', togglePreviewAnimation);
  if (els.previewFrameInput) els.previewFrameInput.addEventListener('input', () => seekPreviewAnimation(Number(els.previewFrameInput.value) || 0));
  if (els.showPreviewReferenceVideoInput) els.showPreviewReferenceVideoInput.addEventListener('change', () => {
    state.showPreviewReferenceVideo = !!els.showPreviewReferenceVideoInput.checked;
    renderPdfPreview();
    savePreviewSettingsFromUi();
  });
  if (els.showCartelaReferenceVideoInput) els.showCartelaReferenceVideoInput.addEventListener('change', () => {
    state.showCartelaReferenceVideo = !!els.showCartelaReferenceVideoInput.checked;
    renderCartelaPreview();
  });
  if (els.exportIncludeBackgroundInput) els.exportIncludeBackgroundInput.addEventListener('change', () => {
    state.exportIncludeBackground = !!els.exportIncludeBackgroundInput.checked;
    savePreviewSettingsFromUi();
  });
  if (els.exportIncludeVideoInput) els.exportIncludeVideoInput.addEventListener('change', () => {
    state.exportIncludeVideo = !!els.exportIncludeVideoInput.checked;
    if (state.exportIncludeVideo && els.exportIncludeBackgroundInput) {
      els.exportIncludeBackgroundInput.checked = true;
      state.exportIncludeBackground = true;
    }
    savePreviewSettingsFromUi();
  });
  if (els.exportIncludeMarginsInput) els.exportIncludeMarginsInput.addEventListener('change', () => {
    state.exportIncludeMargins = !!els.exportIncludeMarginsInput.checked;
    savePreviewSettingsFromUi();
  });
  els.toggleMarginsBtn.addEventListener('click', toggleMarginOverlay);
  if (els.toggleStyleMarginsBtn) els.toggleStyleMarginsBtn.addEventListener('click', togglePanelMarginOverlay);
  if (els.toggleCartelaMarginsBtn) els.toggleCartelaMarginsBtn.addEventListener('click', togglePanelMarginOverlay);
  els.exportCurrentPdfBtn.addEventListener('click', () => exportPngPages('current'));
  els.exportAllPdfBtn.addEventListener('click', () => exportPngPages('all'));
  els.exportMovBtn.addEventListener('click', exportMov);
  if (els.downloadDatabaseBtn) els.downloadDatabaseBtn.addEventListener('click', () => syncDatabaseManually('download'));
  if (els.uploadDatabaseBtn) els.uploadDatabaseBtn.addEventListener('click', () => syncDatabaseManually('upload'));
  window.addEventListener('resize', () => {
    renderVisiblePanelPreviews();
    if (state.activeTab === 'pdf' && state.pngPreviewZoomMode === 'auto') renderPdfPreview();
  });
  initializeAppInfo();
  initializeAppPreferences();

  function nativeBridge() {
    return window.creditosNative || null;
  }

  async function initializeAppInfo() {
    const native = nativeBridge();
    if (!native || !native.getAppInfo || !els.appVersion) return;
    try {
      const info = await native.getAppInfo();
      if (info && info.version) {
        els.appVersion.textContent = `v${info.version}`;
        els.appVersion.title = `${info.name || 'Créditos'} ${info.version} (${info.platform || ''} ${info.arch || ''})`.trim();
      }
    } catch (_error) {
      els.appVersion.textContent = '';
    }
  }

  async function initializeAppPreferences() {
    await loadNativePreferences();
    setupResizablePanels();
    await initializeDatabase();
    await refreshDatabaseSyncStatus();

    loadSystemFonts({ silent: true });
    renderProjectSelectors();
  }

  async function loadNativePreferences() {
    const native = nativeBridge();
    if (!native || !native.readPreferences) return;
    try {
      state.preferences = await native.readPreferences() || {};
    } catch (error) {
      console.warn('No se pudieron cargar preferencias:', error.message);
      state.preferences = {};
    }
  }

  async function dbPost(endpoint, payload = {}) {
    if (!state.databasePath && endpoint !== '/api/db/init') {
      throw new Error('Selecciona primero una base de datos.');
    }
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ db_path: state.databasePath, ...payload }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error de base de datos.');
    return result;
  }

  async function initializeDatabase(options = {}) {
    try {
      const overview = await dbPost('/api/db/init', { db_path: null });
      state.databasePath = overview.db_path || 'data/creditos.db';
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

  function updateDatabaseStatus() {
    if (!els.databaseStatus) return;
    const status = state.databaseSyncStatus;
    const pathText = state.databasePath ? state.databasePath : 'data/creditos.db';
    let suffix = '';
    if (status && status.remoteIsNewer) suffix = ' · GitHub tiene una DB mas reciente';
    else if (status && status.localChanged) suffix = ' · DB local pendiente de subir';
    else if (status && status.available) suffix = ' · sincronizada';
    els.databaseStatus.textContent = `${pathText}${suffix}`;
    els.databaseStatus.classList.toggle('db-sync-warning', Boolean(status && status.remoteIsNewer));
    els.databaseStatus.classList.toggle('db-sync-ok', Boolean(status && !status.remoteIsNewer));
    els.databaseStatus.title = status && status.message ? status.message : pathText;
  }

  async function refreshDatabaseSyncStatus() {
    const native = nativeBridge();
    if (!native || !native.getDatabaseSyncStatus) return;
    try {
      state.databaseSyncStatus = await native.getDatabaseSyncStatus();
    } catch (error) {
      state.databaseSyncStatus = { message: error.message, error: error.message };
    }
    updateDatabaseStatus();
  }

  async function applyDatabaseSyncAction(action) {
    const native = nativeBridge();
    if (!native) throw new Error('La sincronizacion solo esta disponible desde la app de escritorio.');
    if (action === 'download') {
      if (!native.forceDatabaseFromGitHub) throw new Error('No esta disponible la actualizacion desde GitHub.');
      state.databaseSyncStatus = await native.forceDatabaseFromGitHub();
    } else if (action === 'upload') {
      if (!native.forceDatabaseToGitHub) throw new Error('No esta disponible la subida de DB local.');
      state.databaseSyncStatus = await native.forceDatabaseToGitHub();
    } else {
      if (!native.syncDatabase) throw new Error('No esta disponible la sincronizacion de DB.');
      state.databaseSyncStatus = await native.syncDatabase();
    }
    updateDatabaseStatus();
    await initializeDatabase({ silent: true });
    await refreshDatabaseSyncStatus();
  }

  async function syncDatabaseManually(action) {
    const native = nativeBridge();
    if (!native || !native.confirm) {
      window.alert('La sincronizacion solo esta disponible desde la app de escritorio.');
      return;
    }
    const isDownload = action === 'download';
    const result = await native.confirm({
      title: isDownload ? 'Bajar DB de GitHub' : 'Subir DB a GitHub',
      message: isDownload
        ? 'Esto reemplazara la base de datos local por la version de GitHub.'
        : 'Esto subira la base de datos local a GitHub y reemplazara la version remota.',
      confirmLabel: isDownload ? 'Bajar de GitHub' : 'Subir a GitHub',
    });
    if (!result || !result.confirmed) return;
    try {
      await applyDatabaseSyncAction(action);
    } catch (error) {
      window.alert('No se pudo sincronizar la DB: ' + error.message);
      await refreshDatabaseSyncStatus();
    }
  }

  function renderProjectSelectors() {
    renderSelect(els.productionSelect, state.productions, state.selectedProductionId, 'Sin producciones', (production) => production.name);
    renderProductionList();
    renderSelect(els.episodeSelect, currentProductionEpisodes(), state.selectedEpisodeId, 'Sin episodios', (episode) => episode.name);
    renderProductionLayoutControls();
    renderProductionImportModelControl();
    updateDatabaseStatus();
  }

  function renderProductionList() {
    if (!els.productionList) return;
    els.productionList.innerHTML = '';
    if (!state.productions.length) {
      els.productionList.className = 'production-list empty-state';
      els.productionList.textContent = 'Sin producciones.';
    } else {
      els.productionList.className = 'production-list';
      const table = document.createElement('table');
      table.className = 'data-table';
      table.innerHTML = '<thead><tr><th></th><th>Producción</th><th>Capítulos</th><th>Formato</th><th>Importación</th></tr></thead>';
      const tbody = document.createElement('tbody');
      state.productions.forEach((production) => {
        const row = document.createElement('tr');
        row.className = String(production.id) === String(state.selectedProductionId) ? 'selected' : '';
        row.addEventListener('click', (event) => {
          if (event.target && event.target.closest('input')) return;
          selectProductionById(production.id);
        });
        const selectCell = document.createElement('td');
        selectCell.className = 'table-select-cell';
        const selectButton = document.createElement('button');
        selectButton.type = 'button';
        selectButton.className = 'table-select-button';
        selectButton.textContent = String(production.id) === String(state.selectedProductionId) ? '●' : '○';
        selectButton.addEventListener('click', () => selectProductionById(production.id));
        selectCell.appendChild(selectButton);
        row.appendChild(selectCell);
        const nameCell = document.createElement('td');
        const nameInput = document.createElement('input');
        nameInput.className = 'table-input';
        nameInput.value = production.name;
        nameInput.addEventListener('change', () => updateProductionName(production.id, nameInput.value));
        nameCell.appendChild(nameInput);
        row.appendChild(nameCell);
        const episodesCell = document.createElement('td');
        const episodesInput = document.createElement('input');
        episodesInput.className = 'table-input compact-number';
        episodesInput.type = 'number';
        episodesInput.min = '1';
        episodesInput.step = '1';
        episodesInput.value = String(Number(production.episode_count) || currentProductionEpisodes(production.id).length || 1);
        episodesInput.addEventListener('change', () => updateProductionEpisodeCount(production.id, episodesInput.value));
        episodesCell.appendChild(episodesInput);
        row.appendChild(episodesCell);
        const formatCell = document.createElement('td');
        formatCell.textContent = `${Number(production.page_width) || 1920}x${Number(production.page_height) || 1080}`;
        row.appendChild(formatCell);
        const importCell = document.createElement('td');
        importCell.textContent = labelForImportModel(production.import_model_id);
        row.appendChild(importCell);
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      els.productionList.appendChild(table);
    }
    const hasProduction = !!selectedProduction();
    if (els.duplicateProductionBtn) els.duplicateProductionBtn.disabled = !hasProduction;
    if (els.deleteProductionBtn) els.deleteProductionBtn.disabled = !hasProduction;
  }

  function renderProductionLayoutControls() {
    const production = selectedProduction();
    const layout = getProductionLayout();
    if (els.productionPageWidthInput) {
      els.productionPageWidthInput.value = String(layout.page_width);
      els.productionPageWidthInput.disabled = !production;
    }
    if (els.productionPageHeightInput) {
      els.productionPageHeightInput.value = String(layout.page_height);
      els.productionPageHeightInput.disabled = !production;
    }
    if (els.productionPreviewBackgroundInput) {
      els.productionPreviewBackgroundInput.value = normalizeColor(layout.preview_background);
      els.productionPreviewBackgroundInput.disabled = !production;
    }
  }

  function renderProductionImportModelControl() {
    if (!els.productionImportModelSelect) return;
    const production = selectedProduction();
    els.productionImportModelSelect.innerHTML = '';
    const models = state.importModels.length
      ? state.importModels
      : [{ id: 'standard_credits_xls', label: 'XLS Créditos Buendía' }];
    models.forEach((model) => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.label || model.id;
      els.productionImportModelSelect.appendChild(option);
    });
    els.productionImportModelSelect.value = production && production.import_model_id
      ? production.import_model_id
      : models[0].id;
    els.productionImportModelSelect.disabled = !production || !models.length;
  }

  function labelForImportModel(importModelId) {
    const model = state.importModels.find((candidate) => candidate.id === importModelId);
    if (model) return model.label;
    if (importModelId === 'standard_credits_xls') return 'XLS Créditos Buendía';
    return importModelId || 'Por defecto';
  }

  function currentXlsxName() {
    if (state.source && state.source.meta && state.source.meta.loaded_file) return state.source.meta.loaded_file;
    if (state.structure && state.structure.source_file) return state.structure.source_file;
    return '';
  }

  function updateXlsxStatus() {
    if (!els.xlsxFileStatus) return;
    const name = currentXlsxName();
    els.xlsxFileStatus.textContent = name ? `Archivo asociado: ${name}` : 'Sin archivo asociado';
    if (els.openXlsxBtn) els.openXlsxBtn.textContent = name ? 'Cambiar archivo' : 'Asociar archivo';
    updateReferenceVideoStatus();
    if (els.copyEpisodeStylesBtn) {
      els.copyEpisodeStylesBtn.disabled = !state.selectedProductionId || !state.selectedEpisodeId || !state.structure;
    }
  }

  function updateReferenceVideoStatus() {
    const video = state.referenceVideo;
    const hasEpisode = !!(state.selectedProductionId && state.selectedEpisodeId);
    if (els.referenceVideoStatus) {
      els.referenceVideoStatus.textContent = video && video.name
        ? `Vídeo referencia: ${video.name}`
        : 'Sin vídeo de referencia';
    }
    if (els.openReferenceVideoBtn) {
      els.openReferenceVideoBtn.disabled = !hasEpisode;
      els.openReferenceVideoBtn.textContent = video ? 'Cambiar vídeo' : 'Asociar vídeo';
    }
    if (els.clearReferenceVideoBtn) {
      els.clearReferenceVideoBtn.disabled = !hasEpisode || !video;
    }
    if (els.showPreviewReferenceVideoInput) {
      els.showPreviewReferenceVideoInput.disabled = !video;
      els.showPreviewReferenceVideoInput.checked = !!(video && state.showPreviewReferenceVideo);
    }
    if (els.showCartelaReferenceVideoInput) {
      els.showCartelaReferenceVideoInput.disabled = !video;
      els.showCartelaReferenceVideoInput.checked = !!(video && state.showCartelaReferenceVideo);
    }
    if (els.exportIncludeVideoInput) {
      els.exportIncludeVideoInput.disabled = !video;
      els.exportIncludeVideoInput.checked = !!(video && state.exportIncludeVideo);
    }
    updateReferenceVideoDurationField();
    if (video && state.referenceVideoDuration === null) loadReferenceVideoDuration().catch((error) => console.warn(error));
  }

  function updateReferenceVideoDurationField() {
    if (!els.referenceVideoDurationInput) return;
    const duration = Number(state.referenceVideoDuration);
    if (!state.referenceVideo || !Number.isFinite(duration) || duration <= 0) {
      els.referenceVideoDurationInput.value = '--:--:--';
      return;
    }
    els.referenceVideoDurationInput.value = formatSecondsAsFrameDuration(duration, getMovieFps());
  }

  function currentPreviewSettingsFromUi() {
    const settings = normalizePreviewSettings(state.structure && state.structure.preview_settings ? state.structure.preview_settings : {});
    return normalizePreviewSettings({
      ...settings,
      movie_mode: getMovieMode(),
      render_codec: selectedRenderCodec(),
      render_profile: selectedRenderProfile(),
      range_from: Number(els.exportFromPageInput && els.exportFromPageInput.value) || settings.range_from,
      range_to: Number(els.exportToPageInput && els.exportToPageInput.value) || settings.range_to,
      range_manual: !!(els.exportFromPageInput && els.exportFromPageInput.dataset.manual === '1') || !!(els.exportToPageInput && els.exportToPageInput.dataset.manual === '1'),
      target_duration: els.movieTargetDurationInput ? els.movieTargetDurationInput.value : settings.target_duration,
      target_duration_manual: !!(els.movieTargetDurationInput && els.movieTargetDurationInput.dataset.auto === '0'),
      preroll_count: Number(els.moviePrerollCountInput && els.moviePrerollCountInput.value) || 0,
      preroll_duration: els.moviePrerollDurationInput ? els.moviePrerollDurationInput.value : settings.preroll_duration,
      postroll_count: Number(els.moviePostrollCountInput && els.moviePostrollCountInput.value) || 0,
      postroll_duration: els.moviePostrollDurationInput ? els.moviePostrollDurationInput.value : settings.postroll_duration,
      show_reference_video: !!state.showPreviewReferenceVideo,
      include_background: !!state.exportIncludeBackground,
      include_video: !!state.exportIncludeVideo,
      include_margins: !!state.exportIncludeMargins,
      show_margins: !!state.showMarginOverlay,
    });
  }

  function savePreviewSettingsFromUi() {
    if (!state.structure) return;
    state.structure.preview_settings = currentPreviewSettingsFromUi();
    scheduleAutosave();
  }

  function applyPreviewSettingsToUi(settingsValue) {
    const settings = normalizePreviewSettings(settingsValue);
    if (els.movieModeSelect) els.movieModeSelect.value = settings.movie_mode;
    if (els.movieCodecSelect) els.movieCodecSelect.value = settings.render_codec;
    renderMovieEncodingProfiles(settings.render_codec, settings.render_profile);
    if (els.exportFromPageInput) {
      els.exportFromPageInput.value = String(settings.range_from);
      els.exportFromPageInput.dataset.manual = settings.range_manual ? '1' : '0';
    }
    if (els.exportToPageInput) {
      els.exportToPageInput.value = String(settings.range_to);
      els.exportToPageInput.dataset.manual = settings.range_manual ? '1' : '0';
    }
    if (els.movieTargetDurationInput) {
      els.movieTargetDurationInput.value = settings.target_duration || '';
      els.movieTargetDurationInput.dataset.auto = settings.target_duration_manual ? '0' : '1';
    }
    if (els.moviePrerollCountInput) els.moviePrerollCountInput.value = String(settings.preroll_count);
    if (els.moviePrerollDurationInput) els.moviePrerollDurationInput.value = settings.preroll_duration;
    if (els.moviePostrollCountInput) els.moviePostrollCountInput.value = String(settings.postroll_count);
    if (els.moviePostrollDurationInput) els.moviePostrollDurationInput.value = settings.postroll_duration;
    state.showPreviewReferenceVideo = !!settings.show_reference_video;
    state.exportIncludeBackground = !!settings.include_background;
    state.exportIncludeVideo = !!settings.include_video;
    state.exportIncludeMargins = !!settings.include_margins;
    state.showMarginOverlay = !!settings.show_margins;
    if (els.showPreviewReferenceVideoInput) els.showPreviewReferenceVideoInput.checked = state.showPreviewReferenceVideo;
    if (els.exportIncludeBackgroundInput) els.exportIncludeBackgroundInput.checked = state.exportIncludeBackground;
    if (els.exportIncludeVideoInput) els.exportIncludeVideoInput.checked = state.exportIncludeVideo;
    if (els.exportIncludeMarginsInput) els.exportIncludeMarginsInput.checked = state.exportIncludeMargins;
    ensureBackgroundForEncodingProfile();
    if (els.toggleMarginsBtn) {
      els.toggleMarginsBtn.classList.toggle('active-toggle', state.showMarginOverlay);
      els.toggleMarginsBtn.textContent = state.showMarginOverlay ? 'Ocultar márgenes' : 'Mostrar márgenes';
    }
  }

  function selectedRenderCodec() {
    return normalizeRenderCodec(els.movieCodecSelect && els.movieCodecSelect.value);
  }

  function selectedRenderProfile() {
    return normalizeRenderProfile(
      els.movieEncodingProfileSelect && els.movieEncodingProfileSelect.value,
      selectedRenderCodec()
    );
  }

  function renderMovieEncodingProfiles(codecValue, selectedValue) {
    if (!els.movieEncodingProfileSelect) return;
    const codec = normalizeRenderCodec(codecValue);
    const selected = normalizeRenderProfile(selectedValue, codec);
    els.movieEncodingProfileSelect.innerHTML = '';
    (MOV_ENCODING_PROFILES[codec] || []).forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      els.movieEncodingProfileSelect.appendChild(option);
    });
    els.movieEncodingProfileSelect.value = selected;
  }

  function renderProfileSupportsAlpha(profile = selectedRenderProfile()) {
    return profile === 'prores_4444' || profile === 'prores_4444_xq';
  }

  function ensureBackgroundForEncodingProfile() {
    if (renderProfileSupportsAlpha()) return;
    state.exportIncludeBackground = true;
    if (els.exportIncludeBackgroundInput) els.exportIncludeBackgroundInput.checked = true;
  }

  function renderSelect(select, items, selectedId, emptyLabel, labelForItem) {
    if (!select) return;
    select.innerHTML = '';
    if (!items.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = emptyLabel;
      select.appendChild(option);
      select.disabled = true;
      return;
    }
    select.disabled = false;
    items.forEach((item) => {
      const option = document.createElement('option');
      option.value = String(item.id);
      option.textContent = labelForItem(item);
      select.appendChild(option);
    });
    select.value = selectedId ? String(selectedId) : String(items[0].id);
  }

  function currentProductionEpisodes(productionId = state.selectedProductionId) {
    return state.episodes.filter((episode) => String(episode.production_id) === String(productionId));
  }

  function selectedProduction() {
    return state.productions.find((production) => String(production.id) === String(state.selectedProductionId)) || null;
  }

  function getProductionLayout() {
    const production = selectedProduction();
    return {
      page_width: Math.max(1, Number(production && production.page_width) || 1920),
      page_height: Math.max(1, Number(production && production.page_height) || 1080),
      preview_background: normalizeColor((production && production.preview_background) || '#ffffff'),
    };
  }

  function getProductionSettings() {
    const production = selectedProduction();
    return normalizeSettings(production && production.settings ? production.settings : {});
  }

  function selectedProductionHasStoredSettings() {
    const production = selectedProduction();
    return !!(production && production.settings && Object.keys(production.settings).length);
  }

  function setSelectedProductionLocalFields(fields) {
    const production = selectedProduction();
    if (!production) return;
    Object.assign(production, fields);
  }

  async function persistSelectedProductionFields(fields) {
    if (!state.selectedProductionId) return;
    const overview = await dbPost('/api/db/update-production', {
      production_id: state.selectedProductionId,
      fields,
    });
    state.productions = overview.productions || state.productions;
    state.episodes = overview.episodes || state.episodes;
    renderProjectSelectors();
  }

  function selectedEpisode() {
    return state.episodes.find((episode) => String(episode.id) === String(state.selectedEpisodeId)) || null;
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

  function rememberCurrentSelection() {
    if (!state.selectedProductionId) return;
    const selection = {
      productionId: state.selectedProductionId ? String(state.selectedProductionId) : '',
      episodeId: state.selectedEpisodeId ? String(state.selectedEpisodeId) : '',
    };
    writeLocalJsonPreference(STORAGE_KEYS.lastSelection, selection);
  }

  function readSavedSelection() {
    const saved = readLocalJsonPreference(STORAGE_KEYS.lastSelection, null);
    if (saved && (saved.productionId || saved.episodeId)) {
      return {
        productionId: saved.productionId ? String(saved.productionId) : '',
        episodeId: saved.episodeId ? String(saved.episodeId) : '',
      };
    }
    return {
      productionId: readLocalPreference(STORAGE_KEYS.selectedProduction),
      episodeId: readLocalPreference(STORAGE_KEYS.selectedEpisode),
    };
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
      state.render = buildRenderJson(state.source, state.materials, state.structure);
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

  function applyExplicitCartelaOverridesFromSource(target, source, sourceRaw = source) {
    if (!target || !source) return;
    const styleId = sourceRaw && sourceRaw.style_id !== undefined ? sourceRaw.style_id : source.style_id;
    target.style_id = styleId || '';

    const upperCartela = target.style_id
      ? getEffectiveStyleCartela(getStyleById(target.style_id))
      : baseStyleCartelaFromSettings();
    STYLE_CARTELA_FIELDS.forEach((key) => {
      delete target[key];
      if (!sourceRaw || !Object.prototype.hasOwnProperty.call(sourceRaw, key)) return;
      const normalized = sanitizeStyleCartelaOverrides({ [key]: sourceRaw[key] });
      if (normalized[key] === undefined) return;
      if (!sameStyleValue(normalized[key], upperCartela[key])) target[key] = clonePlainValue(normalized[key]);
    });

    const explicitBlockStyle = explicitCartelaBlockStyle(sourceRaw && sourceRaw.block_style, getEffectiveStyleBlock(getStyleById(target.style_id)));
    if (Object.keys(explicitBlockStyle).length) {
      target.block_style = explicitBlockStyle;
    } else {
      delete target.block_style;
    }

    const explicitTitleTypography = explicitCartelaTitleTypography(
      sourceRaw && sourceRaw.title_typography,
      getEffectiveStyleTitleTypography(getStyleById(target.style_id)).page_header
    );
    if (Object.keys(explicitTitleTypography).length) {
      target.title_typography = explicitTitleTypography;
    } else {
      delete target.title_typography;
    }

    applyExplicitSourceRefSettings(target, source, sourceRaw);
  }

  function applyExplicitSourceRefSettings(target, source, sourceRaw = source) {
    const explicitByRef = collectExplicitSourceRefSettings(source, sourceRaw);
    (target.pages || []).forEach((page) => {
      const nextSettings = {};
      (page.source_refs || []).forEach((ref) => {
        if (!explicitByRef.has(ref)) return;
        nextSettings[ref] = clonePlainValue(explicitByRef.get(ref));
      });
      page.source_ref_settings = nextSettings;
    });
  }

  function collectExplicitSourceRefSettings(source, sourceRaw = source) {
    const output = new Map();
    const sourceUpperBlock = getEffectiveCartelaBlockStyle(source);
    const rawPages = sourceRaw && Array.isArray(sourceRaw.pages) ? sourceRaw.pages : [];
    rawPages.forEach((page) => {
      const settingsByRef = page && page.source_ref_settings ? page.source_ref_settings : {};
      Object.keys(settingsByRef).forEach((ref) => {
        const explicit = explicitSourceRefSettings(settingsByRef[ref], sourceUpperBlock);
        if (Object.keys(explicit).length) output.set(ref, explicit);
      });
    });
    return output;
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
      const select = document.createElement('select');
      select.className = 'text-input';
      episodes.forEach((episode) => {
        const option = document.createElement('option');
        option.value = episode.id;
        option.textContent = episode.name || `Capítulo ${episode.episode_number || episode.id}`;
        select.appendChild(option);
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
        import_model_id: defaultImportModelId(),
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
    const production = selectedProduction();
    if (!production) return;
    try {
      const overview = await dbPost('/api/db/duplicate-production', {
        production_id: production.id,
      });
      state.selectedProductionId = overview.production_id;
      state.selectedEpisodeId = null;
      applyDatabaseOverview(overview);
    } catch (error) {
      window.alert('No se pudo duplicar la producción: ' + error.message);
    }
  }

  async function deleteSelectedProduction() {
    const production = selectedProduction();
    if (!production) return;
    const native = nativeBridge();
    let confirmed = false;
    if (native && native.confirm) {
      const result = await native.confirm({
        title: 'Borrar producción',
        message: `Borrar "${production.name}" y todos sus episodios, estilos y documentos?`,
        confirmLabel: 'Borrar',
      });
      confirmed = !!(result && result.confirmed);
    } else {
      confirmed = window.confirm(`Borrar "${production.name}" y todos sus episodios, estilos y documentos?`);
    }
    if (!confirmed) return;
    try {
      const overview = await dbPost('/api/db/delete-production', {
        production_id: production.id,
      });
      state.selectedProductionId = null;
      state.selectedEpisodeId = null;
      state.source = null;
      state.referenceVideo = null;
      state.materials = [];
      state.structure = null;
      state.render = null;
      applyDatabaseOverview(overview);
      renderCartelaList();
      renderEditor();
      renderStylesPane();
      renderPreview();
      refreshPdfIfActive();
    } catch (error) {
      window.alert('No se pudo borrar la producción: ' + error.message);
    }
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
        state.render = buildRenderJson(state.source, state.materials, state.structure);
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
      import_model_id: els.productionImportModelSelect.value || defaultImportModelId(),
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

  function defaultImportModelId() {
    return state.importModels[0] ? state.importModels[0].id : 'standard_credits_xls';
  }

  async function updateProductionName(productionId, name) {
    const cleanName = String(name || '').trim();
    if (!cleanName) {
      renderProjectSelectors();
      return;
    }
    try {
      const overview = await dbPost('/api/db/update-production', {
        production_id: productionId,
        fields: { name: cleanName },
      });
      applyDatabaseOverview(overview);
    } catch (error) {
      window.alert('No se pudo renombrar la producción: ' + error.message);
      renderProjectSelectors();
    }
  }

  async function updateProductionEpisodeCount(productionId, value) {
    const production = state.productions.find((candidate) => String(candidate.id) === String(productionId));
    if (!production) return;
    const nextCount = Math.max(1, Math.round(Number(value) || 1));
    const currentCount = Math.max(
      Number(production.episode_count) || 0,
      ...currentProductionEpisodes(productionId).map((episode) => Number(episode.episode_number) || 0),
      1
    );
    if (nextCount < currentCount) {
      const deletedEpisodes = currentProductionEpisodes(productionId)
        .filter((episode) => Number(episode.episode_number) > nextCount);
      const withDocuments = deletedEpisodes.filter((episode) => !!episode.has_documents);
      if (withDocuments.length) {
        const names = withDocuments.map((episode) => episode.name || `Episodio ${episode.episode_number}`).join(', ');
        const native = nativeBridge();
        let confirmed = false;
        if (native && native.confirm) {
          const result = await native.confirm({
            title: 'Reducir capítulos',
            message: `Vas a borrar capítulos con archivos/datos asociados: ${names}.`,
            confirmLabel: 'Borrar capítulos',
          });
          confirmed = !!(result && result.confirmed);
        } else {
          confirmed = window.confirm(`Vas a borrar capítulos con archivos/datos asociados: ${names}. Continuar?`);
        }
        if (!confirmed) {
          renderProjectSelectors();
          return;
        }
      }
    }

    try {
      const overview = await dbPost('/api/db/update-production', {
        production_id: productionId,
        fields: { episode_count: nextCount },
      });
      applyDatabaseOverview(overview);
    } catch (error) {
      window.alert('No se pudo actualizar el número de capítulos: ' + error.message);
      renderProjectSelectors();
    }
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
      if (result.structure && result.structure.settings && !selectedProductionHasStoredSettings()) {
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
        state.render = result.render || buildRenderJson(state.source, state.materials, state.structure);
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

  function setAutosaveStatus(message) {
    void message;
  }

  function scheduleAutosave() {
    if (state.isLoadingEpisode || !state.databasePath || !state.selectedProductionId || !state.selectedEpisodeId || !state.structure) {
      return;
    }
    setAutosaveStatus('Guardando...');
    window.clearTimeout(state.autosaveTimer);
    state.autosaveTimer = window.setTimeout(() => {
      persistCurrentEpisode().catch((error) => {
        console.error(error);
        setAutosaveStatus('Error al guardar');
      });
    }, 500);
  }

  async function persistCurrentEpisode() {
    if (!state.databasePath || !state.selectedProductionId || !state.selectedEpisodeId || !state.structure) return;
    const base = {
      production_id: state.selectedProductionId,
      episode_id: state.selectedEpisodeId,
    };
    if (state.source) {
      await dbPost('/api/db/save-document', { ...base, kind: 'source', data: state.source });
    }
    await dbPost('/api/db/save-document', { ...base, kind: 'structure', data: getStructureJsonForOutput() });
    if (state.render) {
      await dbPost('/api/db/save-document', { ...base, kind: 'render', data: state.render });
    }
    setAutosaveStatus(`Autoguardado ${new Date().toLocaleTimeString()}`);
  }

  function scheduleStyleAutosave(styleId) {
    if (!state.databasePath || !state.selectedProductionId || !styleId) return;
    const style = getStyleById(styleId);
    if (!style) return;
    window.clearTimeout(state.autosaveStyleTimers.get(styleId));
    state.autosaveStyleTimers.set(styleId, window.setTimeout(() => {
      writeStyleFile(style)
        .then(() => setAutosaveStatus(`Estilo autoguardado ${new Date().toLocaleTimeString()}`))
        .catch((error) => {
          console.error(error);
          setAutosaveStatus('Error al guardar estilo');
        });
    }, 500));
  }

  function readLocalPreference(key) {
    if (state.preferences && state.preferences[key]) return state.preferences[key];
    try {
      return window.localStorage.getItem(key) || '';
    } catch (_error) {
      return '';
    }
  }

  function writeLocalPreference(key, value) {
    if (!value) return;
    state.preferences = state.preferences || {};
    state.preferences[key] = value;
    writeNativePreference(key, value);
    try {
      window.localStorage.setItem(key, value);
    } catch (_error) {
      // Local persistence is a convenience only.
    }
  }

  function readLocalJsonPreference(key, fallback) {
    if (state.preferences && state.preferences[key] !== undefined) return state.preferences[key];
    try {
      const value = window.localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function writeLocalJsonPreference(key, value) {
    state.preferences = state.preferences || {};
    state.preferences[key] = value;
    writeNativePreference(key, value);
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (_error) {
      // Local persistence is a convenience only.
    }
  }

  function writeNativePreference(key, value) {
    const native = nativeBridge();
    if (!native || !native.writePreference) return;
    native.writePreference({ key, value }).catch((error) => {
      console.warn('No se pudo guardar preferencia:', error.message);
    });
  }

  function setupResizablePanels() {
    const stylesWorkspace = document.querySelector('.styles-workspace');
    const savedStyles = readLocalJsonPreference(STORAGE_KEYS.stylesPanels, null);
    if (savedStyles) applyPanelWidths('styles', {
      left: clamp(Number(savedStyles.left) || 320, 300, 620),
      preview: clamp(Number(savedStyles.preview) || 360, 160, 1400),
    });
    setupWorkspaceResizers(stylesWorkspace, 'styles', STORAGE_KEYS.stylesPanels, {
      left: [300, 620],
      preview: [160, 1400],
    });

    const cartelasWorkspace = document.querySelector('.cartelas-workspace');
    const savedCartelas = readLocalJsonPreference(STORAGE_KEYS.cartelasPanels, null);
    if (savedCartelas) applyPanelWidths('cartelas', savedCartelas);
    setupWorkspaceResizers(cartelasWorkspace, 'cartelas', STORAGE_KEYS.cartelasPanels, {
      left: [140, 520],
      preview: [160, 1400],
    });
  }

  function setupWorkspaceResizers(workspace, namespace, storageKey, limits) {
    if (!workspace) return;
    workspace.querySelectorAll('.panel-resizer').forEach((handle) => {
      handle.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        handle.setPointerCapture(event.pointerId);
        const startX = event.clientX;
        const current = getPanelWidths(namespace);
        const side = handle.dataset.resizer;
        const onMove = (moveEvent) => {
          const delta = moveEvent.clientX - startX;
          const next = { ...current };
          if (side === `${namespace}-left`) {
            next.left = clamp(current.left + delta, limits.left[0], limits.left[1]);
          } else if (side === `${namespace}-right`) {
            next.preview = clamp(current.preview - delta, limits.preview[0], limits.preview[1]);
          }
          applyPanelWidths(namespace, next);
          renderVisiblePanelPreviews();
        };
        const onUp = () => {
          writeLocalJsonPreference(storageKey, getPanelWidths(namespace));
          handle.removeEventListener('pointermove', onMove);
          handle.removeEventListener('pointerup', onUp);
          handle.removeEventListener('pointercancel', onUp);
        };
        handle.addEventListener('pointermove', onMove);
        handle.addEventListener('pointerup', onUp);
        handle.addEventListener('pointercancel', onUp);
      });
    });
  }

  function getPanelWidths(namespace) {
    const root = document.documentElement;
    const fallbackLeft = namespace === 'cartelas' ? 260 : 320;
    const fallbackPreview = namespace === 'cartelas' ? 360 : 360;
    return {
      left: Number.parseFloat(root.style.getPropertyValue(`--${namespace}-left-width`)) || fallbackLeft,
      preview: Number.parseFloat(root.style.getPropertyValue(`--${namespace}-preview-width`)) || fallbackPreview,
    };
  }

  function applyPanelWidths(namespace, widths) {
    const root = document.documentElement;
    root.style.setProperty(`--${namespace}-left-width`, `${Number(widths.left) || 240}px`);
    root.style.setProperty(`--${namespace}-preview-width`, `${Number(widths.preview) || 360}px`);
  }

  function renderVisiblePanelPreviews() {
    window.requestAnimationFrame(() => {
      if (state.activeTab === 'styles') renderStylePreview(getStyleById(state.selectedStyleId));
      if (state.activeTab === 'structure') renderCartelaPreview();
      if (state.activeTab === 'pdf') renderPdfPreview();
    });
  }

  function rememberFileDirectory(key, filePath) {
    const directory = directoryFromPath(filePath);
    if (directory) writeLocalPreference(key, directory);
  }

  async function loadXlsxFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!state.databasePath || !state.selectedProductionId || !state.selectedEpisodeId) {
      window.alert('Selecciona producción y episodio antes de importar un archivo de créditos.');
      event.target.value = '';
      return;
    }
    await parseXlsxFile(file);
    event.target.value = '';
  }

  async function openXlsxFile() {
    if (!state.databasePath || !state.selectedProductionId || !state.selectedEpisodeId) {
      window.alert('Selecciona producción y episodio antes de importar un archivo de créditos.');
      return;
    }
    const native = nativeBridge();
    if (native && native.openXlsx) {
      try {
        const result = await native.openXlsx({ defaultPath: readLocalPreference(STORAGE_KEYS.xlsxDir) });
        if (!result || result.canceled) return;
        rememberFileDirectory(STORAGE_KEYS.xlsxDir, result.filePath);
        const bytes = Uint8Array.from(atob(result.base64), (char) => char.charCodeAt(0));
        const fileName = result.name || 'creditos.xlsx';
        const file = new File([bytes], fileName, {
          type: /\.ods$/i.test(fileName)
            ? 'application/vnd.oasis.opendocument.spreadsheet'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        await parseXlsxFile(file);
      } catch (error) {
        window.alert('No se pudo abrir el archivo de créditos: ' + error.message);
      }
      return;
    }
    els.xlsxInput.click();
  }

  async function associateReferenceVideo() {
    if (!state.databasePath || !state.selectedProductionId || !state.selectedEpisodeId) {
      window.alert('Selecciona producción y episodio antes de asociar un vídeo.');
      return;
    }
    const native = nativeBridge();
    if (!native || !native.openReferenceVideo) {
      window.alert('El selector de vídeo solo está disponible desde la app de escritorio.');
      return;
    }
    try {
      const result = await native.openReferenceVideo({ defaultPath: readLocalPreference(STORAGE_KEYS.referenceVideoDir) });
      if (!result || result.canceled) return;
      rememberFileDirectory(STORAGE_KEYS.referenceVideoDir, result.filePath);
      state.referenceVideo = normalizeReferenceVideo({
        schema: 'credits_reference_video',
        version: 1,
        name: result.name || 'video',
        file_path: result.filePath,
      });
      state.referenceVideoElement = null;
      state.referenceVideoSrc = '';
      state.referenceVideoCanvasElement = null;
      state.referenceVideoCanvasSrc = '';
      state.referenceVideoDuration = null;
      await persistReferenceVideo();
      updateReferenceVideoStatus();
      renderPreview();
      refreshPdfIfActive();
    } catch (error) {
      window.alert('No se pudo asociar el vídeo de referencia: ' + error.message);
    }
  }

  async function clearReferenceVideo() {
    if (!state.databasePath || !state.selectedProductionId || !state.selectedEpisodeId) return;
    state.referenceVideo = null;
    state.referenceVideoElement = null;
    state.referenceVideoSrc = '';
    state.referenceVideoCanvasElement = null;
    state.referenceVideoCanvasSrc = '';
    state.referenceVideoDuration = null;
    await persistReferenceVideo();
    updateReferenceVideoStatus();
    renderPreview();
    refreshPdfIfActive();
  }

  async function loadReferenceVideoDuration() {
    const video = normalizeReferenceVideo(state.referenceVideo);
    if (!video || !video.file_path) {
      state.referenceVideoDuration = null;
      updateReferenceVideoDurationField();
      return null;
    }
    const videoEl = await referenceVideoForCanvas();
    const duration = Number(videoEl.duration);
    state.referenceVideoDuration = Number.isFinite(duration) && duration > 0 ? duration : null;
    updateReferenceVideoDurationField();
    return state.referenceVideoDuration;
  }

  async function persistReferenceVideo() {
    await dbPost('/api/db/save-document', {
      production_id: state.selectedProductionId,
      episode_id: state.selectedEpisodeId,
      kind: 'reference',
      data: state.referenceVideo || {},
    });
  }

  async function parseXlsxFile(file) {
    try {
      els.sourceMeta.textContent = `Parseando ${file.name}...`;
      const form = new FormData();
      form.append('file', file);
      form.append('import_model_id', selectedImportModelId());

      const response = await fetch('/api/parse-xlsx', { method: 'POST', body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Error al interpretar el archivo de créditos.');
      await loadSourceJson(payload, file.name);
      updateXlsxStatus();
    } catch (error) {
      window.alert(
        'No se pudo interpretar el archivo de créditos: ' +
          error.message +
          '\n\nPara asociar archivos, inicia la app desde Electron con npm start en apps/desktop, o arranca el renderer manualmente con python3 apps/renderer/server.py en macOS y py apps\\renderer\\server.py en Windows.'
      );
      renderMeta();
    } finally {
    }
  }

  function selectedImportModelId() {
    const production = selectedProduction();
    return (production && production.import_model_id) || defaultImportModelId();
  }

  async function loadSourceJson(json, fileName) {
    state.source = normalizeSource(json, fileName);
    state.materials = applyLockedMaterials(createMaterialsFromSource(state.source), state.structure);
    state.structure = createStructureFromSource(state.source, state.materials, state.structure);
    state.selectedCartelaId = state.structure.cartelas[0] ? state.structure.cartelas[0].id : null;
    rebuild();
    if (state.databasePath && state.selectedProductionId && state.selectedEpisodeId) {
      await dbPost('/api/db/save-document', {
        production_id: state.selectedProductionId,
        episode_id: state.selectedEpisodeId,
        kind: 'source',
        data: state.source,
      });
      await dbPost('/api/db/save-document', {
        production_id: state.selectedProductionId,
        episode_id: state.selectedEpisodeId,
        kind: 'structure',
        data: getStructureJsonForOutput(),
      });
    }
  }

  function createStructureFromSource(source, materials, previousStructure) {
    return createStructureFromSourceWithSettings(source, materials, previousStructure, getProductionSettings());
  }

  function buildRenderJson(source, materials, structure) {
    const materialById = new Map(materials.map((material) => [material.id, material]));
    const overrides = structure.overrides || {};
    const productionSettings = getProductionSettings();
    const maxAutoLines = Number(productionSettings.default_auto_page_lines) || 0;

    const render = {
      schema: 'credits_render_json',
      version: 9,
      source_sheet: source.sheet || '',
      settings: {
        language: productionSettings.language,
        text_capitalization: productionSettings.text_capitalization,
        protected_capitalizations: productionSettings.protected_capitalizations,
        use_protected_capitalization: productionSettings.use_protected_capitalization,
        typography: productionSettings.typography,
        layout: settingsWithProductionLayout(productionSettings, getProductionLayout()).layout,
      },
      cartelas: getVisualCartelas(structure.cartelas || [])
        .filter((cartela) => cartela.enabled !== false)
        .filter((cartela) => cartelaHasRenderableRefs(cartela, materialById))
        .map((cartela, cartelaIndex) => {
          const effectiveCartela = getEffectiveCartela(cartela);
          return {
            id: cartela.id,
            style_id: cartela.style_id || '',
            manual: !!cartela.manual,
            cartela_number: cartelaIndex + 1,
            label: cartela.title || '',
            title: cartela.title || '',
            type: cartela.type,
            orientation: effectiveCartela.orientation || 'horizontal',
            columns: Number(effectiveCartela.columns) || 1,
            font_size_multiplier: 1,
            line_spacing_multiplier: 1,
            vertical_offset: Number(effectiveCartela.vertical_offset) || 0,
            duration: Number(effectiveCartela.duration) || 0,
            text_capitalization: normalizeTextCapitalization(effectiveCartela.text_capitalization),
            use_protected_capitalization: normalizeBoolean(effectiveCartela.use_protected_capitalization, true),
            auto_text_wrap: normalizeBoolean(effectiveCartela.auto_text_wrap, false),
            images: cartelaImages(cartela),
            title_typography: getEffectiveCartelaTitleTypography(cartela),
            line_spacing: Math.max(0.1, Number(effectiveCartela.line_spacing) || 1.12),
            column_gap: Math.max(0, Number(effectiveCartela.column_gap) || 0),
            role_name_gap: Math.max(0, Number(effectiveCartela.role_name_gap) || 0),
            source_group_gap: Math.max(0, Number(effectiveCartela.source_group_gap) || 0),
            block_gap: Math.max(0, Number(effectiveCartela.block_gap) || 0),
            block_title_gap: Math.max(0, Number(effectiveCartela.block_title_gap) || 0),
            page_top_margin: Math.max(0, Number(effectiveCartela.page_top_margin) || 0),
            page_bottom_margin: Math.max(0, Number(effectiveCartela.page_bottom_margin) || 0),
            page_left_margin: Math.max(0, Number(effectiveCartela.page_left_margin) || 0),
            page_right_margin: Math.max(0, Number(effectiveCartela.page_right_margin) || 0),
            pages: (cartela.pages || []).map((page, pageIndex) => ({
              id: page.id,
              page_number: pageIndex + 1,
              title: resolveOverride(overrides, page.id, 'title', page.title || ''),
              blocks: (page.source_refs || []).map((ref) => {
                const material = materialById.get(ref);
                const lineAdjustments = structure.page_line_adjustments || {};
                const block = renderMaterial(material, ref, overrides, structure.page_breaks || {}, 0, lineAdjustments);
                block.columns = getSourceRefColumns(page, ref, cartela);
                block.alignment = getSourceRefAlignment(page, ref, material, effectiveCartela, cartela);
                block.vertical_align = getSourceRefVerticalAlign(page, ref, cartela);
                block.typography = getSourceRefTypography(page, ref, cartela);
                const effectiveBlockStyle = getEffectiveCartelaBlockStyle(cartela);
                block.force_role_name_columns = effectiveBlockStyle.force_role_name_columns;
                if (block.force_role_name_columns) forceRenderedRoleNameColumns(block);
                block.concatenate_rows = effectiveBlockStyle.concatenate_rows;
                if (block.concatenate_rows) concatenateRenderedBlockRows(block, effectiveCartela, productionSettings);
                return block;
              }),
            })),
          };
        }),
    };
    render.physical_pages = buildPhysicalPages(render.cartelas, overrides, {
      settings: productionSettings,
      pageLineAdjustments: structure.page_line_adjustments,
    }).map((page, index) => ({
      id: page.id,
      page_number: index + 1,
      title: page.title || '',
      line_count: page.line_count || 0,
      line_limit: page.line_limit || 0,
      cartela_id: page.cartela.id,
      cartela_page_id: page.cartela_page.id,
      blocks: page.blocks,
    }));
    return render;
  }

  function concatenateRenderedBlockRows(block, cartela, settings) {
    const units = getRenderedBlockUnits(block);
    const values = units.map(renderedUnitText).filter((value) => String(value || '').trim());
    if (!values.length) return block;
    const sourceText = values.join(' ');
    const normalizedSettings = normalizeSettings(settings || getProductionSettings());
    const transformedText = applyTextCapitalization(
      sourceText,
      cartela && cartela.text_capitalization,
      normalizedSettings.language,
      normalizedSettings.protected_capitalizations,
      cartela && cartela.use_protected_capitalization !== undefined
        ? cartela.use_protected_capitalization
        : normalizedSettings.use_protected_capitalization
    );
    const layout = layoutForCartela(settingsWithProductionLayout(normalizedSettings, getProductionLayout()).layout, cartela);
    const columns = Math.max(1, Number(block.columns) || 1);
    const contentWidth = Math.max(1, layout.page_width - layout.page_left_margin - layout.page_right_margin);
    const columnWidth = Math.max(1, (contentWidth - layout.column_gap * (columns - 1)) / columns);
    const metrics = {
      ...canvasTextMetrics('name', cartela, layout, block.typography),
      textCapitalization: 'source',
    };
    const lines = canvasWrappedTextLines(transformedText, metrics, columnWidth);
    const firstRow = sourceUnitStartRow(units[0]);
    block.pages = [{
      id: 'block_page_01',
      items: lines.map((value, index) => ({
        id: `${block.id}_concatenated_${String(index + 1).padStart(3, '0')}`,
        kind: 'concatenated_line',
        row: Number.isFinite(firstRow) ? firstRow : 0,
        value,
        text_already_transformed: true,
      })),
      start_index: 0,
      end_index: Math.max(0, lines.length - 1),
      line_count: lines.length,
    }];
    return block;
  }

  function rebuild() {
    if (state.source && state.structure) {
      state.render = buildRenderJson(state.source, state.materials, state.structure);
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
    const settings = getProductionSettings();
    els.defaultDurationInput.value = formatSecondsAsFrameDuration(settings.default_cartela_duration, getMovieFps());
    els.defaultAutoLinesInput.value = String(settings.default_auto_page_lines);
    els.movieFpsInput.value = String(settings.movie_fps);
    renderTypographySettings(settings);
    renderLayoutSettings(settings);
  }

  function renderTypographySettings(settings) {
    els.typographySettings.innerHTML = '';
    els.typographySettings.appendChild(sectionLabel('Tipografia base'));
    const fontCatalog = getFontCatalog();

    TYPOGRAPHY_FIELDS.forEach(([key, label]) => {
      const value = settings.typography[key];
      const row = document.createElement('div');
      row.className = 'typography-row';

      const labelEl = document.createElement('label');
      labelEl.textContent = label;
      row.appendChild(labelEl);

      const sizeInput = document.createElement('input');
      sizeInput.className = 'text-input compact-number-input';
      sizeInput.type = 'number';
      sizeInput.min = '1';
      sizeInput.step = '1';
      sizeInput.value = String(value.font_size);
      sizeInput.addEventListener('change', () => updateTypographySetting(key, { font_size: Math.max(1, Number(sizeInput.value) || 1) }));
      row.appendChild(sizeInput);

      const fontSelect = document.createElement('select');
      fontSelect.className = 'text-input font-family-select';
      fontCatalog.families.forEach((font) => {
        const option = document.createElement('option');
        option.value = font;
        option.textContent = font;
        fontSelect.appendChild(option);
      });
      if (!fontCatalog.families.includes(value.font_family)) {
        const option = document.createElement('option');
        option.value = value.font_family;
        option.textContent = value.font_family;
        fontSelect.appendChild(option);
      }
      fontSelect.value = value.font_family;
      fontSelect.addEventListener('change', () => {
        const nextStyle = getFontStyles(fontSelect.value)[0] || { style: 'Regular', postscript_name: '' };
        updateTypographySetting(key, {
          font_family: fontSelect.value,
          font_style: nextStyle.style,
          font_postscript_name: nextStyle.postscript_name,
        });
        renderSettings();
      });
      row.appendChild(fontSelect);

      const styleSelect = document.createElement('select');
      styleSelect.className = 'text-input compact-select';
      const styles = getFontStyles(value.font_family);
      styles.forEach((fontStyle) => {
        const option = document.createElement('option');
        option.value = fontStyle.style;
        option.textContent = fontStyle.style;
        option.dataset.postscriptName = fontStyle.postscript_name || '';
        styleSelect.appendChild(option);
      });
      if (!styles.some((fontStyle) => fontStyle.style === value.font_style)) {
        const option = document.createElement('option');
        option.value = value.font_style;
        option.textContent = value.font_style;
        option.dataset.postscriptName = value.font_postscript_name || '';
        styleSelect.appendChild(option);
      }
      styleSelect.value = value.font_style;
      styleSelect.addEventListener('change', () => {
        const selected = styleSelect.selectedOptions[0];
        updateTypographySetting(key, {
          font_style: styleSelect.value,
          font_postscript_name: selected ? selected.dataset.postscriptName || '' : '',
        });
      });
      row.appendChild(styleSelect);

      const colorInput = document.createElement('input');
      colorInput.className = 'color-input';
      colorInput.type = 'color';
      colorInput.value = normalizeColor(value.color);
      colorInput.addEventListener('input', () => updateTypographySetting(key, { color: colorInput.value }));
      row.appendChild(colorInput);

      els.typographySettings.appendChild(row);
    });
  }

  async function loadSystemFonts(options = {}) {
    if (!window.queryLocalFonts) {
      if (!options.silent) window.alert('Chrome no permite leer fuentes del sistema en este entorno. Se usara la lista basica.');
      return;
    }

    try {
      const fonts = await window.queryLocalFonts();
      const byFamily = new Map();
      fonts.forEach((font) => {
        const family = font.family || font.fullName || font.postscriptName;
        if (!family) return;
        const style = font.style || styleFromFullName(font.fullName, family);
        const entry = {
          family,
          style: style || 'Regular',
          full_name: font.fullName || '',
          postscript_name: font.postscriptName || '',
        };
        if (!byFamily.has(family)) byFamily.set(family, []);
        byFamily.get(family).push(entry);
      });
      state.fontCatalog = {
        families: Array.from(byFamily.keys()).sort((a, b) => a.localeCompare(b)),
        stylesByFamily: Object.fromEntries(
          Array.from(byFamily.entries()).map(([family, styles]) => [
            family,
            dedupeFontStyles(styles),
          ])
        ),
      };
      renderProjectSelectors();
      renderSettings();
      renderEditor();
      renderPreview();
      refreshPdfIfActive();
    } catch (error) {
      if (!options.silent && error.name !== 'AbortError') {
        window.alert('No se pudieron cargar las fuentes del sistema: ' + error.message);
      }
    }
  }

  function getFontCatalog() {
    if (state.fontCatalog) return state.fontCatalog;
    return {
      families: FONT_OPTIONS,
      stylesByFamily: Object.fromEntries(FONT_OPTIONS.map((font) => [font, [{ style: 'Regular', postscript_name: '' }]])),
    };
  }

  function getFontStyles(family) {
    const catalog = getFontCatalog();
    return catalog.stylesByFamily[family] || [{ style: 'Regular', postscript_name: '' }];
  }

  function dedupeFontStyles(styles) {
    const byStyle = new Map();
    styles.forEach((fontStyle) => {
      if (!byStyle.has(fontStyle.style)) byStyle.set(fontStyle.style, fontStyle);
    });
    return Array.from(byStyle.values()).sort((a, b) => a.style.localeCompare(b.style));
  }

  function styleFromFullName(fullName, family) {
    return String(fullName || '').replace(String(family || ''), '').trim() || 'Regular';
  }

  function loadStyleObjects(styleObjects) {
    state.styles = (styleObjects || [])
      .map((style) => normalizeCartelaStyle(style, { name: style.file_name || `${style.id || 'estilo'}.json` }))
      .sort((a, b) => a.name.localeCompare(b.name));
    pruneRedundantStyleDefaults();
    syncLoadedStyleSnapshots();
    pruneRedundantStyleOverrides();
    if (state.source && state.structure) {
      state.render = buildRenderJson(state.source, state.materials, state.structure);
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

  function hasStyleCartelaOverride(style, key) {
    return !!(style && style.cartela && Object.prototype.hasOwnProperty.call(style.cartela, key));
  }

  function hasStyleBlockOverride(style, key) {
    return !!(style && style.block && Object.prototype.hasOwnProperty.call(style.block, key));
  }

  function hasStyleBlockAlignmentOverride(style, key) {
    return !!(style && style.block && style.block.alignment && Object.prototype.hasOwnProperty.call(style.block.alignment, key));
  }

  function hasStyleTypographyOverride(style, key) {
    return !!(style && style.block && style.block.typography && style.block.typography[key] && Object.keys(style.block.typography[key]).length);
  }

  function hasStyleTitleTypographyOverride(style) {
    return !!(style && style.title_typography && style.title_typography.page_header && Object.keys(style.title_typography.page_header).length);
  }

  function safeStyleId(value) {
    return safeFilePart(String(value || 'estilo').toLowerCase().replace(/\s+/g, '_')) || `style_${Date.now()}`;
  }

  function getStyleById(styleId) {
    if (!styleId) return null;
    return state.styles.find((style) => style.id === styleId) || null;
  }

  function updateTypographySetting(key, fields) {
    if (!selectedProduction()) return;
    const settings = getProductionSettings();
    settings.typography[key] = {
      ...settings.typography[key],
      ...fields,
    };
    setSelectedProductionLocalFields({ settings: stripProductionLayoutFromSettings(settings) });
    persistSelectedProductionFields({ settings: selectedProduction().settings }).catch((error) => console.warn(error));
    state.render = state.source ? buildRenderJson(state.source, state.materials, state.structure) : state.render;
    renderStylesPane();
    renderEditor();
    renderPreview();
    refreshPdfIfActive();
  }

  function renderLayoutSettings(settings) {
    const existing = document.getElementById('layoutSettings');
    if (existing) existing.remove();

    const wrap = document.createElement('div');
    wrap.id = 'layoutSettings';
    wrap.className = 'layout-settings';
    wrap.appendChild(sectionLabel('Composición base'));
    wrap.appendChild(localSelectRow('Idioma', settings.language, LANGUAGE_OPTIONS, (value) => updateSettings({ language: value })));
    wrap.appendChild(localSelectRow('Capitalización', settings.text_capitalization, TEXT_CAPITALIZATION_OPTIONS, (value) => updateSettings({ text_capitalization: value })));
    wrap.appendChild(localInputRow('Capitalización protegida', settings.protected_capitalizations, (value) => updateSettings({ protected_capitalizations: normalizeProtectedCapitalizationText(value) }), { multiline: true, commitOnChange: true }));
    wrap.appendChild(localSelectRow('Usar capitalización protegida', boolSelectValue(settings.use_protected_capitalization), YES_NO_OPTIONS, (value) => updateSettings({ use_protected_capitalization: normalizeBoolean(value, true) })));
    wrap.appendChild(settingsNumberRow('Interlineado', settings.layout.line_spacing, 0.1, null, 0.01, (value) => updateLayoutSetting({ line_spacing: value })));
    wrap.appendChild(settingsNumberRow('Separación entre columnas', settings.layout.column_gap, 0, null, 1, (value) => updateLayoutSetting({ column_gap: value })));
    wrap.appendChild(settingsNumberRow('Separación cargo/nombre', settings.layout.role_name_gap, 0, null, 1, (value) => updateLayoutSetting({ role_name_gap: value })));
    wrap.appendChild(settingsNumberRow('Separación de grupos del origen', settings.layout.source_group_gap, 0, null, 1, (value) => updateLayoutSetting({ source_group_gap: value })));
    wrap.appendChild(settingsNumberRow('Separación entre bloques', settings.layout.block_gap, 0, null, 1, (value) => updateLayoutSetting({ block_gap: value })));
    wrap.appendChild(settingsNumberRow('Separación título/primera fila', settings.layout.block_title_gap, 0, null, 1, (value) => updateLayoutSetting({ block_title_gap: value })));
    wrap.appendChild(settingsNumberRow('Margen superior de página', settings.layout.page_top_margin, 0, null, 1, (value) => updateLayoutSetting({ page_top_margin: value })));
    wrap.appendChild(settingsNumberRow('Margen inferior de página', settings.layout.page_bottom_margin, 0, null, 1, (value) => updateLayoutSetting({ page_bottom_margin: value })));
    wrap.appendChild(settingsNumberRow('Margen izquierdo de página', settings.layout.page_left_margin, 0, null, 1, (value) => updateLayoutSetting({ page_left_margin: value })));
    wrap.appendChild(settingsNumberRow('Margen derecho de página', settings.layout.page_right_margin, 0, null, 1, (value) => updateLayoutSetting({ page_right_margin: value })));
    wrap.appendChild(localSelectRow('Repetir nombre de bloque', boolSelectValue(settings.layout.repeat_block_titles), YES_NO_OPTIONS, (value) => updateLayoutSetting({ repeat_block_titles: normalizeBoolean(value, true) })));
    wrap.appendChild(localSelectRow('Ajuste automático de texto', boolSelectValue(settings.layout.auto_text_wrap), YES_NO_OPTIONS, (value) => updateLayoutSetting({ auto_text_wrap: normalizeBoolean(value, false) })));
    wrap.appendChild(sectionLabel('Scroll'));
    wrap.appendChild(settingsNumberRow('Separación entre cartelas', settings.layout.scroll_page_gap, 0, null, 1, (value) => updateLayoutSetting({ scroll_page_gap: value })));
    wrap.appendChild(settingsNumberRow('Separación antes de última cartela', settings.layout.scroll_last_page_gap, 0, null, 1, (value) => updateLayoutSetting({ scroll_last_page_gap: value })));
    wrap.appendChild(settingsNumberRow('Fade superior', settings.layout.scroll_fade_up, 0, null, 1, (value) => updateLayoutSetting({ scroll_fade_up: value })));
    wrap.appendChild(settingsNumberRow('Fade inferior', settings.layout.scroll_fade_down, 0, null, 1, (value) => updateLayoutSetting({ scroll_fade_down: value })));
    els.typographySettings.after(wrap);
  }

  function settingsNumberRow(label, value, min, max, step, onInput) {
    const row = document.createElement('div');
    row.className = 'field-grid';
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    const input = document.createElement('input');
    input.className = 'text-input compact-number-input';
    input.type = 'number';
    input.min = String(min);
    if (max !== null && max !== undefined) input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.addEventListener('change', () => {
      const raw = Number(input.value);
      let next = Math.max(min, Number.isFinite(raw) ? raw : min);
      if (max !== null && max !== undefined) next = Math.min(max, next);
      input.value = String(next);
      onInput(next);
    });
    row.appendChild(labelEl);
    row.appendChild(input);
    return row;
  }

  function settingsColorRow(label, value, onInput) {
    const row = document.createElement('div');
    row.className = 'field-grid';
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    const input = document.createElement('input');
    input.className = 'color-input';
    input.type = 'color';
    input.value = normalizeColor(value);
    input.addEventListener('input', () => onInput(input.value));
    row.appendChild(labelEl);
    row.appendChild(input);
    return row;
  }

  function updateLayoutSetting(fields) {
    if (!selectedProduction()) return;
    const settings = getProductionSettings();
    settings.layout = {
      ...settings.layout,
      ...fields,
    };
    setSelectedProductionLocalFields({ settings: stripProductionLayoutFromSettings(settings) });
    persistSelectedProductionFields({ settings: selectedProduction().settings }).catch((error) => console.warn(error));
    state.render = state.source ? buildRenderJson(state.source, state.materials, state.structure) : state.render;
    renderStylesPane();
    renderEditor();
    renderPreview();
    refreshPdfIfActive();
  }

  function updateSettings(fields) {
    if (!selectedProduction()) return;
    const settings = {
      ...getProductionSettings(),
      ...fields,
    };
    setSelectedProductionLocalFields({ settings: stripProductionLayoutFromSettings(settings) });
    persistSelectedProductionFields({ settings: selectedProduction().settings }).catch((error) => console.warn(error));
    if (state.source) {
      state.render = buildRenderJson(state.source, state.materials, state.structure);
    }
    renderSettings();
    renderPreview();
    refreshPdfIfActive();
  }

  async function associateCartelaImage() {
    const cartela = getSelectedCartela();
    if (!cartela) return;
    const native = nativeBridge();
    try {
      let result = null;
      if (native && native.openImage) {
        result = await native.openImage({ defaultPath: readLocalPreference(STORAGE_KEYS.imageDir) });
      } else if (window.showOpenFilePicker) {
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: 'Imagen', accept: { 'image/*': ['.png', '.jpg', '.jpeg'] } }],
          multiple: false,
        });
        const file = await handle.getFile();
        result = {
          canceled: false,
          name: file.name,
          mime: file.type || (file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' : 'image/png'),
          base64: await blobToBase64(file),
        };
      }
      if (!result || result.canceled) return;
      rememberFileDirectory(STORAGE_KEYS.imageDir, result.filePath);
      const images = cartelaImages(cartela);
      updateCartela({
        images: images.concat({
          id: uniqueCartelaImageId(images),
          name: result.name || 'imagen',
          file_path: result.filePath || result.name || '',
          mime: result.mime || 'image/png',
          data_url: `data:${result.mime || 'image/png'};base64,${result.base64}`,
          scale: 1,
          offset_x: 0,
          offset_y: 0,
        }),
      });
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      window.alert('No se pudo asociar la imagen: ' + error.message);
    }
  }

  function uniqueCartelaImageId(images) {
    const existing = new Set((images || []).map((image) => image.id));
    let index = existing.size + 1;
    let candidate = `image_${String(index).padStart(3, '0')}`;
    while (existing.has(candidate)) {
      index += 1;
      candidate = `image_${String(index).padStart(3, '0')}`;
    }
    return candidate;
  }

  function removeCartelaImage(imageId) {
    const cartela = getSelectedCartela();
    if (!cartela) return;
    updateCartela({ images: cartelaImages(cartela).filter((image) => image.id !== imageId) });
  }

  function updateCartelaImage(imageId, fields) {
    const cartela = getSelectedCartela();
    if (!cartela) return;
    updateCartela({
      images: cartelaImages(cartela).map((image) => image.id === imageId ? { ...image, ...fields } : image),
    });
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
      reader.onerror = () => reject(reader.error || new Error('No se pudo leer la imagen.'));
      reader.readAsDataURL(blob);
    });
  }

  function renderCartelaList() {
    els.blockList.innerHTML = '';
    const cartelas = state.structure && state.structure.cartelas ? getVisualCartelas(state.structure.cartelas) : [];
    const episode = selectedEpisode();
    els.blockCount.textContent = episode ? `${episode.name} · ${cartelas.length}` : String(cartelas.length);

    cartelas.forEach((cartela, index) => {
      const refs = getCartelaRefs(cartela);
      const effectiveCartela = getEffectiveCartela(cartela);
      const style = getStyleById(cartela.style_id);
      const button = document.createElement('div');
      button.className = 'block-button' + (cartela.id === state.selectedCartelaId ? ' active' : '');
      button.addEventListener('click', () => {
        state.selectedCartelaId = cartela.id;
        rebuild();
      });

      button.innerHTML = `
        <div class="block-group">${String(index + 1).padStart(2, '0')}</div>
        <div class="block-name">${escapeHtml(getCartelaDisplayName(cartela, index))}</div>
        <div class="block-meta">${cartela.enabled === false ? 'excluida · ' : ''}${style ? escapeHtml(style.name) + ' · ' : ''}${escapeHtml(effectiveCartela.orientation || 'horizontal')} · ${Number(effectiveCartela.columns) || 1} col · ${refs.length} bloque${refs.length === 1 ? '' : 's'}</div>
      `;
      const orderControls = document.createElement('div');
      orderControls.className = 'cartela-order-controls';
      const upButton = document.createElement('button');
      upButton.type = 'button';
      upButton.textContent = '↑';
      upButton.title = 'Mover cartela arriba';
      upButton.disabled = index === 0;
      upButton.addEventListener('click', (event) => {
        event.stopPropagation();
        moveCartelaVisualOrder(cartela.id, -1);
      });
      const downButton = document.createElement('button');
      downButton.type = 'button';
      downButton.textContent = '↓';
      downButton.title = 'Mover cartela abajo';
      downButton.disabled = index >= cartelas.length - 1;
      downButton.addEventListener('click', (event) => {
        event.stopPropagation();
        moveCartelaVisualOrder(cartela.id, 1);
      });
      orderControls.appendChild(upButton);
      orderControls.appendChild(downButton);
      button.appendChild(orderControls);
      els.blockList.appendChild(button);
    });
  }

  function renderStylesPane() {
    if (!els.styleList) return;
    els.styleList.innerHTML = '';
    els.styleCount.textContent = String(state.styles.length);
    if (!state.selectedStyleId || !getStyleById(state.selectedStyleId)) {
      state.selectedStyleId = state.styles[0] ? state.styles[0].id : null;
    }
    if (!state.styles.length) {
      els.styleList.className = 'style-list empty-state';
      els.styleList.textContent = selectedProduction() ? 'Sin estilos.' : 'Selecciona una producción.';
    } else {
      els.styleList.className = 'style-list';
      const table = document.createElement('table');
      table.className = 'data-table';
      table.innerHTML = '<thead><tr><th></th><th>Estilo</th></tr></thead>';
      const tbody = document.createElement('tbody');
      state.styles.forEach((style) => {
        const row = document.createElement('tr');
        row.className = style.id === state.selectedStyleId ? 'selected' : '';
        row.addEventListener('click', (event) => {
          if (event.target && event.target.closest('input')) return;
          state.selectedStyleId = style.id;
          renderStylesPane();
        });
        const selectCell = document.createElement('td');
        selectCell.className = 'table-select-cell';
        const selectButton = document.createElement('button');
        selectButton.type = 'button';
        selectButton.className = 'table-select-button';
        selectButton.textContent = style.id === state.selectedStyleId ? '●' : '○';
        selectButton.addEventListener('click', () => {
          state.selectedStyleId = style.id;
          renderStylesPane();
        });
        selectCell.appendChild(selectButton);
        row.appendChild(selectCell);
        const nameCell = document.createElement('td');
        const nameInput = document.createElement('input');
        nameInput.className = 'table-input';
        nameInput.value = style.name;
        nameInput.addEventListener('change', () => updateStyleName(style, nameInput.value));
        nameCell.appendChild(nameInput);
        row.appendChild(nameCell);
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      els.styleList.appendChild(table);
    }
    if (els.duplicateStyleBtn) els.duplicateStyleBtn.disabled = !getStyleById(state.selectedStyleId);
    if (els.deleteStyleBtn) els.deleteStyleBtn.disabled = !getStyleById(state.selectedStyleId);

    const style = getStyleById(state.selectedStyleId);
    if (!style) {
      els.styleEditorTitle.textContent = 'Sin estilo seleccionado';
      els.styleEditorMeta.textContent = '';
      els.styleEditorBody.className = 'editor-body empty-state';
      els.styleEditorBody.textContent = selectedProduction() ? 'Crea o importa un estilo.' : 'Selecciona una producción.';
      renderStylePreview(null);
      return;
    }

    els.styleEditorTitle.textContent = style.name;
    els.styleEditorMeta.textContent = '';
    els.styleEditorBody.className = 'editor-body';
    els.styleEditorBody.innerHTML = '';
    els.styleEditorBody.appendChild(renderStyleEditor(style));
    renderStylePreview(style);
  }

  function updateStyleName(style, name) {
    if (!style) return;
    const cleanName = String(name || '').trim();
    if (!cleanName) {
      renderStylesPane();
      return;
    }
    style.name = cleanName;
    scheduleStyleAutosave(style.id);
    renderCartelaList();
    renderStylesPane();
  }

  function renderStyleEditor(style) {
    const wrap = document.createElement('div');
    wrap.appendChild(sectionLabel('Cartela'));
    const cartela = getEffectiveStyleCartela(style);
    wrap.appendChild(localSelectRow('Orientación', cartela.orientation, [
      ['horizontal', 'Horizontal'],
      ['vertical', 'Vertical'],
    ], (value) => updateStyleCartela(style, { orientation: value })));
    wrap.appendChild(localNumberRow('Columnas', cartela.columns, 1, 6, (value) => updateStyleCartela(style, { columns: value })));
    wrap.appendChild(localNumberRow('Desplazamiento vertical', cartela.vertical_offset, null, null, (value) => updateStyleCartela(style, { vertical_offset: value })));
    wrap.appendChild(localDurationRow('Duración por página', cartela.duration, (value) => updateStyleCartela(style, { duration: value }), { override: hasStyleCartelaOverride(style, 'duration'), reset: () => resetStyleCartelaOverride(style, 'duration') }));
    wrap.appendChild(localNumberRow('Interlineado', cartela.line_spacing, 0.1, null, (value) => updateStyleCartela(style, { line_spacing: value }), 0.01, { override: hasStyleCartelaOverride(style, 'line_spacing'), reset: () => resetStyleCartelaOverride(style, 'line_spacing') }));
    wrap.appendChild(localNumberRow('Separación entre columnas', cartela.column_gap, 0, null, (value) => updateStyleCartela(style, { column_gap: value }), 1, { override: hasStyleCartelaOverride(style, 'column_gap'), reset: () => resetStyleCartelaOverride(style, 'column_gap') }));
    wrap.appendChild(localNumberRow('Separación cargo/nombre', cartela.role_name_gap, 0, null, (value) => updateStyleCartela(style, { role_name_gap: value }), 1, { override: hasStyleCartelaOverride(style, 'role_name_gap'), reset: () => resetStyleCartelaOverride(style, 'role_name_gap') }));
    wrap.appendChild(localNumberRow('Separación de grupos del origen', cartela.source_group_gap, 0, null, (value) => updateStyleCartela(style, { source_group_gap: value }), 1, { override: hasStyleCartelaOverride(style, 'source_group_gap'), reset: () => resetStyleCartelaOverride(style, 'source_group_gap') }));
    wrap.appendChild(localNumberRow('Separación entre bloques', cartela.block_gap, 0, null, (value) => updateStyleCartela(style, { block_gap: value }), 1, { override: hasStyleCartelaOverride(style, 'block_gap'), reset: () => resetStyleCartelaOverride(style, 'block_gap') }));
    wrap.appendChild(localNumberRow('Separación título/primera fila', cartela.block_title_gap, 0, null, (value) => updateStyleCartela(style, { block_title_gap: value }), 1, { override: hasStyleCartelaOverride(style, 'block_title_gap'), reset: () => resetStyleCartelaOverride(style, 'block_title_gap') }));
    wrap.appendChild(localNumberRow('Margen superior', cartela.page_top_margin, 0, null, (value) => updateStyleCartela(style, { page_top_margin: value }), 1, { override: hasStyleCartelaOverride(style, 'page_top_margin'), reset: () => resetStyleCartelaOverride(style, 'page_top_margin') }));
    wrap.appendChild(localNumberRow('Margen inferior', cartela.page_bottom_margin, 0, null, (value) => updateStyleCartela(style, { page_bottom_margin: value }), 1, { override: hasStyleCartelaOverride(style, 'page_bottom_margin'), reset: () => resetStyleCartelaOverride(style, 'page_bottom_margin') }));
    wrap.appendChild(localNumberRow('Margen izquierdo', cartela.page_left_margin, 0, null, (value) => updateStyleCartela(style, { page_left_margin: value }), 1, { override: hasStyleCartelaOverride(style, 'page_left_margin'), reset: () => resetStyleCartelaOverride(style, 'page_left_margin') }));
    wrap.appendChild(localNumberRow('Margen derecho', cartela.page_right_margin, 0, null, (value) => updateStyleCartela(style, { page_right_margin: value }), 1, { override: hasStyleCartelaOverride(style, 'page_right_margin'), reset: () => resetStyleCartelaOverride(style, 'page_right_margin') }));
    wrap.appendChild(localSelectRow('Repetir nombre de bloque', boolSelectValue(cartela.repeat_block_titles), YES_NO_OPTIONS, (value) => updateStyleCartela(style, { repeat_block_titles: normalizeBoolean(value, true) }), { override: hasStyleCartelaOverride(style, 'repeat_block_titles'), reset: () => resetStyleCartelaOverride(style, 'repeat_block_titles') }));
    wrap.appendChild(localSelectRow('Ajuste automático de texto', boolSelectValue(cartela.auto_text_wrap), YES_NO_OPTIONS, (value) => updateStyleCartela(style, { auto_text_wrap: normalizeBoolean(value, false) }), { override: hasStyleCartelaOverride(style, 'auto_text_wrap'), reset: () => resetStyleCartelaOverride(style, 'auto_text_wrap') }));
    wrap.appendChild(localSelectRow('Capitalización', cartela.text_capitalization, TEXT_CAPITALIZATION_OPTIONS, (value) => updateStyleCartela(style, { text_capitalization: value }), { override: hasStyleCartelaOverride(style, 'text_capitalization'), reset: () => resetStyleCartelaOverride(style, 'text_capitalization') }));
    wrap.appendChild(localSelectRow('Usar capitalización protegida', boolSelectValue(cartela.use_protected_capitalization), YES_NO_OPTIONS, (value) => updateStyleCartela(style, { use_protected_capitalization: normalizeBoolean(value, true) }), { override: hasStyleCartelaOverride(style, 'use_protected_capitalization'), reset: () => resetStyleCartelaOverride(style, 'use_protected_capitalization') }));
    wrap.appendChild(renderStyleTitleTypographyControls(style));

    wrap.appendChild(sectionLabel('Bloque'));
    const block = getEffectiveStyleBlock(style);
    const alignment = block.alignment || {};
    const options = [['left', 'Izquierda'], ['center', 'Centro'], ['right', 'Derecha']];
    wrap.appendChild(localNumberRow('Columnas del bloque', block.columns, 1, 6, (value) => updateStyleBlock(style, { columns: value })));
    wrap.appendChild(localSelectRow('Concatenar filas', boolSelectValue(block.concatenate_rows), YES_NO_OPTIONS, (value) => updateStyleBlock(style, { concatenate_rows: normalizeBoolean(value, false) }), { override: !!(style.block && style.block.concatenate_rows !== undefined), reset: () => resetStyleBlockOverride(style, 'concatenate_rows') }));
    wrap.appendChild(localSelectRow('Forzar estructura cargo/nombre', boolSelectValue(block.force_role_name_columns), YES_NO_OPTIONS, (value) => updateStyleBlock(style, { force_role_name_columns: normalizeBoolean(value, false) }), { override: !!(style.block && style.block.force_role_name_columns !== undefined), reset: () => resetStyleBlockOverride(style, 'force_role_name_columns') }));
    wrap.appendChild(localSelectRow('Alineación cargo', alignment.role || 'right', options, (value) => updateStyleBlockAlignment(style, 'role', value)));
    wrap.appendChild(localSelectRow('Alineación nombre', alignment.name || 'left', options, (value) => updateStyleBlockAlignment(style, 'name', value)));
    wrap.appendChild(localSelectRow('Alineación texto', alignment.text || 'center', options, (value) => updateStyleBlockAlignment(style, 'text', value)));
    wrap.appendChild(localSelectRow('Alineación vertical', block.vertical_align, [
      ['top', 'Arriba'],
      ['center', 'Centrado'],
      ['bottom', 'Abajo'],
    ], (value) => updateStyleBlock(style, { vertical_align: value })));
    wrap.appendChild(renderStyleTypographyControls(style));
    return wrap;
  }

  function updateStyleCartela(style, fields) {
    style.cartela = sanitizeStyleCartelaOverrides({ ...(style.cartela || {}), ...fields });
    pruneRedundantStyleDefaults();
    syncStyleSnapshot(style.id);
    state.render = state.source && state.structure ? buildRenderJson(state.source, state.materials, state.structure) : state.render;
    scheduleStyleAutosave(style.id);
    renderStylesPane();
    renderCartelaList();
    renderPreview();
    refreshPdfIfActive();
  }

  function resetStyleCartelaOverride(style, key) {
    if (!style || !style.cartela) return;
    delete style.cartela[key];
    if (!Object.keys(style.cartela).length) style.cartela = {};
    updateStyleAfterOverrideChange(style);
  }

  function updateStyleBlock(style, fields) {
    style.block = sanitizeStyleBlockOverrides({
      ...(style.block || {}),
      ...fields,
      alignment: fields.alignment || (style.block && style.block.alignment) || {},
      typography: fields.typography || (style.block && style.block.typography) || {},
    });
    pruneRedundantStyleDefaults();
    syncStyleSnapshot(style.id);
    state.render = state.source && state.structure ? buildRenderJson(state.source, state.materials, state.structure) : state.render;
    scheduleStyleAutosave(style.id);
    renderStylesPane();
    renderEditor();
    renderPreview();
    refreshPdfIfActive();
  }

  function updateStyleBlockAlignment(style, key, value) {
    const current = style.block && style.block.alignment ? style.block.alignment : {};
    updateStyleBlock(style, { alignment: { ...current, [key]: value } });
  }

  function resetStyleBlockOverride(style, key) {
    if (!style || !style.block) return;
    delete style.block[key];
    if (!Object.keys(style.block).length) style.block = {};
    updateStyleAfterOverrideChange(style);
  }

  function resetStyleBlockAlignmentOverride(style, key) {
    if (!style || !style.block || !style.block.alignment) return;
    delete style.block.alignment[key];
    if (!Object.keys(style.block.alignment).length) delete style.block.alignment;
    if (!Object.keys(style.block).length) style.block = {};
    updateStyleAfterOverrideChange(style);
  }

  function updateStyleAfterOverrideChange(style) {
    pruneRedundantStyleDefaults();
    syncStyleSnapshot(style.id);
    state.render = state.source && state.structure ? buildRenderJson(state.source, state.materials, state.structure) : state.render;
    scheduleStyleAutosave(style.id);
    renderStylesPane();
    renderEditor();
    renderPreview();
    refreshPdfIfActive();
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
      const sizeInput = document.createElement('input');
      sizeInput.className = 'text-input compact-number-input';
      sizeInput.type = 'number';
      sizeInput.min = '1';
      sizeInput.value = String(value.font_size);
      sizeInput.addEventListener('change', () => updateStyleTypography(style, key, { font_size: Math.max(1, Number(sizeInput.value) || base.font_size) }));
      row.appendChild(sizeInput);

      const fontSelect = document.createElement('select');
      fontSelect.className = 'text-input font-family-select';
      fontCatalog.families.forEach((font) => {
        const option = document.createElement('option');
        option.value = font;
        option.textContent = font;
        fontSelect.appendChild(option);
      });
      if (!fontCatalog.families.includes(value.font_family)) {
        const option = document.createElement('option');
        option.value = value.font_family;
        option.textContent = value.font_family;
        fontSelect.appendChild(option);
      }
      fontSelect.value = value.font_family;
      fontSelect.addEventListener('change', () => {
        const nextStyle = getFontStyles(fontSelect.value)[0] || { style: 'Regular', postscript_name: '' };
        updateStyleTypography(style, key, {
          font_family: fontSelect.value,
          font_style: nextStyle.style,
          font_postscript_name: nextStyle.postscript_name,
        });
      });
      row.appendChild(fontSelect);

      const styleSelect = document.createElement('select');
      styleSelect.className = 'text-input compact-select';
      const styles = getFontStyles(value.font_family);
      styles.forEach((fontStyle) => {
        const option = document.createElement('option');
        option.value = fontStyle.style;
        option.textContent = fontStyle.style;
        option.dataset.postscriptName = fontStyle.postscript_name || '';
        styleSelect.appendChild(option);
      });
      if (!styles.some((fontStyle) => fontStyle.style === value.font_style)) {
        const option = document.createElement('option');
        option.value = value.font_style;
        option.textContent = value.font_style;
        option.dataset.postscriptName = value.font_postscript_name || '';
        styleSelect.appendChild(option);
      }
      styleSelect.value = value.font_style;
      styleSelect.addEventListener('change', () => {
        const selected = styleSelect.selectedOptions[0];
        updateStyleTypography(style, key, {
          font_style: styleSelect.value,
          font_postscript_name: selected ? selected.dataset.postscriptName || '' : '',
        });
      });
      row.appendChild(styleSelect);

      const colorInput = document.createElement('input');
      colorInput.className = 'color-input';
      colorInput.type = 'color';
      colorInput.value = normalizeColor(value.color);
      colorInput.addEventListener('input', () => updateStyleTypography(style, key, { color: colorInput.value }));
      row.appendChild(colorInput);
      if (isOverride) {
        const resetButton = document.createElement('button');
        resetButton.type = 'button';
        resetButton.textContent = 'Restablecer';
        resetButton.addEventListener('click', () => resetStyleTypographyOverride(style, key));
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

    const sizeInput = document.createElement('input');
    sizeInput.className = 'text-input compact-number-input';
    sizeInput.type = 'number';
    sizeInput.min = '1';
    sizeInput.value = String(value.font_size);
    sizeInput.addEventListener('change', () => updateStyleTitleTypography(style, { font_size: Math.max(1, Number(sizeInput.value) || base.font_size) }));
    row.appendChild(sizeInput);

    const fontSelect = document.createElement('select');
    fontSelect.className = 'text-input font-family-select';
    fontCatalog.families.forEach((font) => {
      const option = document.createElement('option');
      option.value = font;
      option.textContent = font;
      fontSelect.appendChild(option);
    });
    if (!fontCatalog.families.includes(value.font_family)) {
      const option = document.createElement('option');
      option.value = value.font_family;
      option.textContent = value.font_family;
      fontSelect.appendChild(option);
    }
    fontSelect.value = value.font_family;
    fontSelect.addEventListener('change', () => {
      const nextStyle = getFontStyles(fontSelect.value)[0] || { style: 'Regular', postscript_name: '' };
      updateStyleTitleTypography(style, {
        font_family: fontSelect.value,
        font_style: nextStyle.style,
        font_postscript_name: nextStyle.postscript_name,
      });
    });
    row.appendChild(fontSelect);

    const styleSelect = document.createElement('select');
    styleSelect.className = 'text-input compact-select';
    const styles = getFontStyles(value.font_family);
    styles.forEach((fontStyle) => {
      const option = document.createElement('option');
      option.value = fontStyle.style;
      option.textContent = fontStyle.style;
      option.dataset.postscriptName = fontStyle.postscript_name || '';
      styleSelect.appendChild(option);
    });
    if (!styles.some((fontStyle) => fontStyle.style === value.font_style)) {
      const option = document.createElement('option');
      option.value = value.font_style;
      option.textContent = value.font_style;
      option.dataset.postscriptName = value.font_postscript_name || '';
      styleSelect.appendChild(option);
    }
    styleSelect.value = value.font_style;
    styleSelect.addEventListener('change', () => {
      const selected = styleSelect.selectedOptions[0];
      updateStyleTitleTypography(style, {
        font_style: styleSelect.value,
        font_postscript_name: selected ? selected.dataset.postscriptName || '' : '',
      });
    });
    row.appendChild(styleSelect);

    const colorInput = document.createElement('input');
    colorInput.className = 'color-input';
    colorInput.type = 'color';
    colorInput.value = normalizeColor(value.color);
    colorInput.addEventListener('input', () => updateStyleTitleTypography(style, { color: colorInput.value }));
    row.appendChild(colorInput);

    if (hasStyleTitleTypographyOverride(style)) {
      const resetButton = document.createElement('button');
      resetButton.type = 'button';
      resetButton.textContent = 'Restablecer';
      resetButton.addEventListener('click', () => resetStyleTitleTypographyOverride(style));
      row.appendChild(resetButton);
    }
    wrap.appendChild(row);
    return wrap;
  }

  function updateStyleTitleTypography(style, fields) {
    const current = style.title_typography && style.title_typography.page_header ? style.title_typography.page_header : {};
    const next = normalizeTitleTypographyOverrides({ page_header: { ...current, ...fields } });
    const base = getProductionSettings().typography.page_header;
    Object.keys(next.page_header || {}).forEach((key) => {
      if (sameStyleValue(next.page_header[key], base && base[key])) delete next.page_header[key];
    });
    style.title_typography = next.page_header && Object.keys(next.page_header).length ? next : {};
    updateStyleAfterOverrideChange(style);
  }

  function resetStyleTitleTypographyOverride(style) {
    if (!style) return;
    style.title_typography = {};
    updateStyleAfterOverrideChange(style);
  }

  function updateStyleTypography(style, key, fields) {
    const block = sanitizeStyleBlockOverrides(style.block || {});
    block.typography = normalizeTypographyOverrides({
      ...(block.typography || {}),
      [key]: {
        ...(block.typography && block.typography[key] ? block.typography[key] : {}),
        ...fields,
      },
    });
    updateStyleBlock(style, { typography: block.typography });
  }

  function resetStyleTypographyOverride(style, key) {
    if (!style || !style.block || !style.block.typography) return;
    delete style.block.typography[key];
    if (!Object.keys(style.block.typography).length) delete style.block.typography;
    if (!Object.keys(style.block).length) style.block = {};
    updateStyleAfterOverrideChange(style);
  }

  async function createStyleFromUi() {
    if (!state.selectedProductionId) {
      window.alert('Selecciona primero una producción.');
      return;
    }
    const id = uniqueStyleId('nuevo_estilo');
    const style = {
      schema: 'credits_cartela_style_json',
      version: 2,
      id,
      name: 'Nuevo estilo',
      file_name: `${id}.json`,
      cartela: {},
      title_typography: {},
      block: {},
    };
    state.styles.push(style);
    state.selectedStyleId = id;
    await writeStyleFile(style);
    renderStylesPane();
  }

  async function duplicateSelectedStyle() {
    const source = getStyleById(state.selectedStyleId);
    if (!source || !state.selectedProductionId) return;
    const id = uniqueStyleId(safeStyleId(`${source.id}_copia`));
    const style = {
      schema: 'credits_cartela_style_json',
      version: 2,
      id,
      name: `${source.name} copia`,
      file_name: `${id}.json`,
      cartela: sanitizeStyleCartelaOverrides(source.cartela || {}),
      title_typography: normalizeTitleTypographyOverrides(source.title_typography || {}),
      block: sanitizeStyleBlockOverrides(source.block || {}),
    };
    state.styles.push(style);
    state.styles.sort((a, b) => a.name.localeCompare(b.name));
    state.selectedStyleId = id;
    await writeStyleFile(style);
    renderStylesPane();
  }

  async function deleteSelectedStyle() {
    const style = getStyleById(state.selectedStyleId);
    if (!style || !state.selectedProductionId) return;
    const native = nativeBridge();
    let confirmed = false;
    if (native && native.confirm) {
      const result = await native.confirm({
        title: 'Borrar estilo',
        message: `Borrar el estilo "${style.name}"? Las cartelas que lo usen quedarán sin estilo.`,
        confirmLabel: 'Borrar',
      });
      confirmed = !!(result && result.confirmed);
    } else {
      confirmed = window.confirm(`Borrar el estilo "${style.name}"? Las cartelas que lo usen quedarán sin estilo.`);
    }
    if (!confirmed) return;
    try {
      await dbPost('/api/db/delete-style', {
        production_id: state.selectedProductionId,
        style_id: style.id,
      });
      if (state.structure && Array.isArray(state.structure.cartelas)) {
        state.structure.cartelas.forEach((cartela) => {
          if (cartela.style_id === style.id) {
            cartela.style_id = '';
            clearCartelaStyleOverrides(cartela);
          }
        });
      }
      state.styles = state.styles.filter((candidate) => candidate.id !== style.id);
      state.selectedStyleId = state.styles[0] ? state.styles[0].id : null;
      if (state.source && state.structure) state.render = buildRenderJson(state.source, state.materials, state.structure);
      renderStylesPane();
      renderCartelaList();
      renderEditor();
      renderPreview();
      refreshPdfIfActive();
    } catch (error) {
      window.alert('No se pudo borrar el estilo: ' + error.message);
    }
  }

  function renderStylePreview(style) {
    if (!els.stylePreview) return;
    els.stylePreview.innerHTML = '';
    if (!style) {
      els.stylePreview.className = 'style-preview empty-state';
      els.stylePreview.textContent = 'Sin estilo seleccionado.';
      return;
    }
    els.stylePreview.className = 'style-preview';
    const layout = getRenderLayout();
    const settings = getProductionSettings();
    const pages = buildPhysicalPages(makeSampleStyleRender(style).cartelas, {}, {
      settings,
      pageLineAdjustments: {},
    });
    const page = pages[0];
    if (!page) {
      els.stylePreview.className = 'style-preview empty-state';
      els.stylePreview.textContent = 'Sin contenido de preview.';
      return;
    }
    const zoom = previewZoomForContainer(els.stylePreview, layout);
    const frame = document.createElement('div');
    frame.className = 'png-preview-frame';
    frame.style.width = `${layout.page_width * zoom}px`;
    frame.style.height = `${layout.page_height * zoom}px`;
    const sheet = makePdfSheetElement(page, layout, {
      settings,
    });
    sheet.style.transform = `scale(${zoom})`;
    frame.appendChild(sheet);
    if (state.showPanelMarginOverlay) frame.appendChild(makeMarginOverlay(layoutForCartela(layout, page.cartela), zoom));
    els.stylePreview.appendChild(frame);
    updatePanelMarginButtons();
  }

  function makeSampleStyleRender(style) {
    const cartela = {
      id: 'style_preview',
      title: style.name,
      ...getEffectiveStyleCartela(style),
      title_typography: getEffectiveStyleTitleTypography(style),
      style_id: style.id,
    };
    const block = getEffectiveStyleBlock(style);
    return {
      cartelas: [{
        ...cartela,
        pages: [{
          id: 'style_preview_page',
          title: '',
          blocks: [{
            id: 'style_preview_block',
            title: 'Dirección de producción',
            type: 'credits',
            columns: block.columns,
            alignment: block.alignment,
            vertical_align: block.vertical_align,
            typography: block.typography,
            items: [
              { id: 'style_preview_unit_1', source_item_id: 'sample_1', kind: 'credit', role: 'Productora Ejecutiva', name: 'Nombre Apellido' },
              { id: 'style_preview_unit_2', source_item_id: 'sample_2', kind: 'credit', role: 'Dirección de Producción', name: 'Nombre Apellido' },
              { id: 'style_preview_unit_3', source_item_id: 'sample_3', kind: 'credit', role: 'Una producción de', name: 'Lorem Ipsum Studio' },
            ],
          }],
        }],
      }],
    };
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

    els.editorTitle.textContent = getCartelaDisplayName(cartela);
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
    wrap.appendChild(localCheckboxRow('Incluir en salida', cartela.enabled !== false, (value) => updateCartela({ enabled: value })));
    wrap.appendChild(renderCartelaStyleControls(cartela));
    if (cartela.manual) wrap.appendChild(manualCartelaActionsRow());
    if (cartela.manual) wrap.appendChild(localInputRow('Nombre de cartela', cartela.manual_name || '', (value) => updateCartela({ manual_name: value }), { commitOnChange: true }));
    wrap.appendChild(localInputRow('Título de cartela', cartela.title || '', (value) => updateCartela({ title: value }), { commitOnChange: true }));
    wrap.appendChild(localSelectRow('Orientación', effectiveCartela.orientation || 'horizontal', [
      ['horizontal', 'Horizontal'],
      ['vertical', 'Vertical'],
    ], (value) => updateCartela({ orientation: value }), { override: isCartelaOverride(cartela, 'orientation'), reset: () => resetCartelaOverride('orientation') }));
    wrap.appendChild(localNumberRow('Columnas', Number(effectiveCartela.columns) || 1, 1, 6, (value) => updateCartela({ columns: value }), 1, { override: isCartelaOverride(cartela, 'columns'), reset: () => resetCartelaOverride('columns') }));
    wrap.appendChild(localNumberRow('Desplazamiento vertical', Number(effectiveCartela.vertical_offset) || 0, null, null, (value) => updateCartela({ vertical_offset: value }), 1, { override: isCartelaOverride(cartela, 'vertical_offset'), reset: () => resetCartelaOverride('vertical_offset') }));
    wrap.appendChild(localDurationRow('Duración por página', Number(effectiveCartela.duration) || 0, (value) => updateCartela({ duration: value }), { override: isCartelaOverride(cartela, 'duration'), reset: () => resetCartelaOverride('duration') }));
    wrap.appendChild(localNumberRow('Interlineado', Number(effectiveCartela.line_spacing) || 1.12, 0.1, null, (value) => updateCartela({ line_spacing: value }), 0.01, { override: isCartelaOverride(cartela, 'line_spacing'), reset: () => resetCartelaOverride('line_spacing') }));
    wrap.appendChild(localNumberRow('Separación entre columnas', Number(effectiveCartela.column_gap) || 0, 0, null, (value) => updateCartela({ column_gap: value }), 1, { override: isCartelaOverride(cartela, 'column_gap'), reset: () => resetCartelaOverride('column_gap') }));
    wrap.appendChild(localNumberRow('Separación cargo/nombre', Number(effectiveCartela.role_name_gap) || 0, 0, null, (value) => updateCartela({ role_name_gap: value }), 1, { override: isCartelaOverride(cartela, 'role_name_gap'), reset: () => resetCartelaOverride('role_name_gap') }));
    wrap.appendChild(localNumberRow('Separación de grupos del origen', Number(effectiveCartela.source_group_gap) || 0, 0, null, (value) => updateCartela({ source_group_gap: value }), 1, { override: isCartelaOverride(cartela, 'source_group_gap'), reset: () => resetCartelaOverride('source_group_gap') }));
    wrap.appendChild(localNumberRow('Separación entre bloques', Number(effectiveCartela.block_gap) || 0, 0, null, (value) => updateCartela({ block_gap: value }), 1, { override: isCartelaOverride(cartela, 'block_gap'), reset: () => resetCartelaOverride('block_gap') }));
    wrap.appendChild(localNumberRow('Separación título/primera fila', Number(effectiveCartela.block_title_gap) || 0, 0, null, (value) => updateCartela({ block_title_gap: value }), 1, { override: isCartelaOverride(cartela, 'block_title_gap'), reset: () => resetCartelaOverride('block_title_gap') }));
    wrap.appendChild(localNumberRow('Margen superior', Number(effectiveCartela.page_top_margin) || 0, 0, null, (value) => updateCartela({ page_top_margin: value }), 1, { override: isCartelaOverride(cartela, 'page_top_margin'), reset: () => resetCartelaOverride('page_top_margin') }));
    wrap.appendChild(localNumberRow('Margen inferior', Number(effectiveCartela.page_bottom_margin) || 0, 0, null, (value) => updateCartela({ page_bottom_margin: value }), 1, { override: isCartelaOverride(cartela, 'page_bottom_margin'), reset: () => resetCartelaOverride('page_bottom_margin') }));
    wrap.appendChild(localNumberRow('Margen izquierdo', Number(effectiveCartela.page_left_margin) || 0, 0, null, (value) => updateCartela({ page_left_margin: value }), 1, { override: isCartelaOverride(cartela, 'page_left_margin'), reset: () => resetCartelaOverride('page_left_margin') }));
    wrap.appendChild(localNumberRow('Margen derecho', Number(effectiveCartela.page_right_margin) || 0, 0, null, (value) => updateCartela({ page_right_margin: value }), 1, { override: isCartelaOverride(cartela, 'page_right_margin'), reset: () => resetCartelaOverride('page_right_margin') }));
    wrap.appendChild(localSelectRow('Repetir nombre de bloque', boolSelectValue(effectiveCartela.repeat_block_titles), YES_NO_OPTIONS, (value) => updateCartela({ repeat_block_titles: normalizeBoolean(value, true) }), { override: isCartelaOverride(cartela, 'repeat_block_titles'), reset: () => resetCartelaOverride('repeat_block_titles') }));
    wrap.appendChild(localSelectRow('Ajuste automático de texto', boolSelectValue(effectiveCartela.auto_text_wrap), YES_NO_OPTIONS, (value) => updateCartela({ auto_text_wrap: normalizeBoolean(value, false) }), { override: isCartelaOverride(cartela, 'auto_text_wrap'), reset: () => resetCartelaOverride('auto_text_wrap') }));
    wrap.appendChild(localSelectRow('Capitalización', effectiveCartela.text_capitalization || 'source', TEXT_CAPITALIZATION_OPTIONS, (value) => updateCartela({ text_capitalization: value }), { override: isCartelaOverride(cartela, 'text_capitalization'), reset: () => resetCartelaOverride('text_capitalization') }));
    wrap.appendChild(localSelectRow('Usar capitalización protegida', boolSelectValue(effectiveCartela.use_protected_capitalization), YES_NO_OPTIONS, (value) => updateCartela({ use_protected_capitalization: normalizeBoolean(value, true) }), { override: isCartelaOverride(cartela, 'use_protected_capitalization'), reset: () => resetCartelaOverride('use_protected_capitalization') }));
    wrap.appendChild(renderCartelaImageControls(cartela));
    wrap.appendChild(renderCartelaTitleTypographyControls(cartela));
    wrap.appendChild(renderCartelaBlockStyleControls(cartela));
    wrap.appendChild(localInputRow('Notas', cartela.notes || '', (value) => updateCartela({ notes: value }), { multiline: true }));
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
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'text-input compact-number-input';
    input.value = String(Number(image[field]) || (field === 'scale' ? 1 : 0));
    input.step = String(step);
    if (min !== null && min !== undefined) input.min = String(min);
    input.addEventListener('change', () => {
      const raw = Number(input.value);
      let value = Number.isFinite(raw) ? raw : (field === 'scale' ? 1 : 0);
      if (min !== null && min !== undefined) value = Math.max(min, value);
      input.value = String(value);
      updateCartelaImage(image.id, { [field]: value });
    });
    cell.appendChild(input);
    return cell;
  }

  function renderCartelaStyleControls(cartela) {
    const wrap = document.createElement('div');
    wrap.className = 'source-controls';

    const select = document.createElement('select');
    select.className = 'text-input compact-select';
    const noneOption = document.createElement('option');
    noneOption.value = '';
    noneOption.textContent = 'Sin estilo';
    select.appendChild(noneOption);
    state.styles.forEach((style) => {
      const option = document.createElement('option');
      option.value = style.id;
      option.textContent = style.name;
      select.appendChild(option);
    });
    select.value = cartela.style_id || '';
    select.addEventListener('change', async () => {
      const previousStyleId = cartela.style_id || '';
      const nextStyleId = select.value;
      if (nextStyleId === previousStyleId) return;
      const action = await chooseCartelaStyleChangeAction(cartela, previousStyleId, nextStyleId);
      if (action === 'cancel') {
        select.value = previousStyleId;
        return;
      }
      cartela.style_id = nextStyleId;
      if (action === 'discard') clearCartelaStyleOverrides(cartela);
      state.render = buildRenderJson(state.source, state.materials, state.structure);
      renderCartelaList();
      renderEditor();
      renderPreview();
      refreshPdfIfActive();
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

  function hasCartelaStyleOverrides(cartela) {
    if (!cartela || !cartela.style_id) return false;
    if (STYLE_CARTELA_FIELDS.some((key) => cartela[key] !== undefined)) return true;
    return hasCartelaTitleTypographyOverride(cartela) || !!(cartela.block_style && Object.keys(cartela.block_style).length);
  }

  function clearCartelaStyleOverrides(cartela) {
    if (!cartela) return;
    STYLE_CARTELA_FIELDS.forEach((key) => {
      delete cartela[key];
    });
    delete cartela.title_typography;
    delete cartela.block_style;
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
    wrap.appendChild(localNumberRow('Columnas del bloque', Number(value.columns) || 1, 1, 6, (next) => updateCartelaBlockStyle({ columns: next }), 1, { override: !!(cartela.block_style && cartela.block_style.columns !== undefined), reset: () => resetCartelaBlockOverride('columns') }));
    wrap.appendChild(localSelectRow('Concatenar filas', boolSelectValue(value.concatenate_rows), YES_NO_OPTIONS, (next) => updateCartelaBlockStyle({ concatenate_rows: normalizeBoolean(next, false) }), { override: !!(cartela.block_style && cartela.block_style.concatenate_rows !== undefined), reset: () => resetCartelaBlockOverride('concatenate_rows') }));
    wrap.appendChild(localSelectRow('Forzar estructura cargo/nombre', boolSelectValue(value.force_role_name_columns), YES_NO_OPTIONS, (next) => updateCartelaBlockStyle({ force_role_name_columns: normalizeBoolean(next, false) }), { override: !!(cartela.block_style && cartela.block_style.force_role_name_columns !== undefined), reset: () => resetCartelaBlockOverride('force_role_name_columns') }));
    wrap.appendChild(localSelectRow('Alineación cargo', alignment.role || 'right', options, (next) => updateCartelaBlockAlignment('role', next), { override: hasCartelaBlockAlignmentOverride(cartela, 'role'), reset: () => resetCartelaBlockAlignmentOverride('role') }));
    wrap.appendChild(localSelectRow('Alineación nombre', alignment.name || 'left', options, (next) => updateCartelaBlockAlignment('name', next), { override: hasCartelaBlockAlignmentOverride(cartela, 'name'), reset: () => resetCartelaBlockAlignmentOverride('name') }));
    wrap.appendChild(localSelectRow('Alineación texto', alignment.text || 'center', options, (next) => updateCartelaBlockAlignment('text', next), { override: hasCartelaBlockAlignmentOverride(cartela, 'text'), reset: () => resetCartelaBlockAlignmentOverride('text') }));
    wrap.appendChild(localSelectRow('Alineación vertical del bloque', value.vertical_align || 'top', [
      ['top', 'Arriba'],
      ['center', 'Centrado'],
      ['bottom', 'Abajo'],
    ], (next) => updateCartelaBlockStyle({ vertical_align: next }), { override: !!(cartela.block_style && cartela.block_style.vertical_align !== undefined), reset: () => resetCartelaBlockOverride('vertical_align') }));
    wrap.appendChild(renderCartelaBlockTypographyControls(cartela, value.typography || {}));
    return wrap;
  }

  function renderSourceRefControls(cartela) {
    const wrap = document.createElement('div');
    wrap.className = 'source-controls';

    const select = document.createElement('select');
    select.className = 'text-input compact-select';
    state.materials.forEach((material) => {
      const option = document.createElement('option');
      option.value = material.id;
      option.textContent = `${material.group || '-'} · ${material.title || material.id}`;
      select.appendChild(option);
    });

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.textContent = 'Añadir bloque';
    addButton.addEventListener('click', () => {
      moveMaterialToCartela(select.value, cartela);
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
    const isLocked = isSourceRefLocked(ref);
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

  function getSourceRefSettingsObject(ref) {
    const cartela = getSelectedCartela();
    const page = findPageWithRef(cartela, ref);
    if (!page) return null;
    page.source_ref_settings = page.source_ref_settings || {};
    page.source_ref_settings[ref] = page.source_ref_settings[ref] || { columns: 1 };
    return page.source_ref_settings[ref];
  }

  function isSourceRefLocked(ref) {
    const settings = getSourceRefSettingsObject(ref);
    return !!(settings && settings.locked);
  }

  function toggleSourceRefLock(ref) {
    const settings = getSourceRefSettingsObject(ref);
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

      const sizeInput = document.createElement('input');
      sizeInput.className = 'text-input compact-number-input';
      sizeInput.type = 'number';
      sizeInput.min = '1';
      sizeInput.step = '1';
      sizeInput.value = String(value.font_size);
      sizeInput.placeholder = String(base.font_size);
      sizeInput.addEventListener('change', () => updateCartelaBlockTypography(key, { font_size: Math.max(1, Number(sizeInput.value) || base.font_size) }));
      row.appendChild(sizeInput);

      const fontSelect = document.createElement('select');
      fontSelect.className = 'text-input font-family-select';
      fontCatalog.families.forEach((font) => {
        const option = document.createElement('option');
        option.value = font;
        option.textContent = font;
        fontSelect.appendChild(option);
      });
      if (!fontCatalog.families.includes(value.font_family)) {
        const option = document.createElement('option');
        option.value = value.font_family;
        option.textContent = value.font_family;
        fontSelect.appendChild(option);
      }
      fontSelect.value = value.font_family;
      fontSelect.addEventListener('change', () => {
        const nextStyle = getFontStyles(fontSelect.value)[0] || { style: 'Regular', postscript_name: '' };
        updateCartelaBlockTypography(key, {
          font_family: fontSelect.value,
          font_style: nextStyle.style,
          font_postscript_name: nextStyle.postscript_name,
        }, { rerenderEditor: true });
      });
      row.appendChild(fontSelect);

      const styleSelect = document.createElement('select');
      styleSelect.className = 'text-input compact-select';
      const styles = getFontStyles(value.font_family);
      styles.forEach((fontStyle) => {
        const option = document.createElement('option');
        option.value = fontStyle.style;
        option.textContent = fontStyle.style;
        option.dataset.postscriptName = fontStyle.postscript_name || '';
        styleSelect.appendChild(option);
      });
      if (!styles.some((fontStyle) => fontStyle.style === value.font_style)) {
        const option = document.createElement('option');
        option.value = value.font_style;
        option.textContent = value.font_style;
        option.dataset.postscriptName = value.font_postscript_name || '';
        styleSelect.appendChild(option);
      }
      styleSelect.value = value.font_style;
      styleSelect.addEventListener('change', () => {
        const selected = styleSelect.selectedOptions[0];
        updateCartelaBlockTypography(key, {
          font_style: styleSelect.value,
          font_postscript_name: selected ? selected.dataset.postscriptName || '' : '',
        });
      });
      row.appendChild(styleSelect);

      const colorInput = document.createElement('input');
      colorInput.className = 'color-input';
      colorInput.type = 'color';
      colorInput.value = normalizeColor(value.color);
      colorInput.addEventListener('input', () => updateCartelaBlockTypography(key, { color: colorInput.value }));
      row.appendChild(colorInput);

      if (isOverride) {
        const resetButton = document.createElement('button');
        resetButton.type = 'button';
        resetButton.textContent = 'Restablecer';
        resetButton.addEventListener('click', () => resetCartelaBlockTypographyOverride(key));
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

    const sizeInput = document.createElement('input');
    sizeInput.className = 'text-input compact-number-input';
    sizeInput.type = 'number';
    sizeInput.min = '1';
    sizeInput.step = '1';
    sizeInput.value = String(value.font_size);
    sizeInput.placeholder = String(base.font_size);
    sizeInput.addEventListener('change', () => updateCartelaTitleTypography({ font_size: Math.max(1, Number(sizeInput.value) || base.font_size) }));
    row.appendChild(sizeInput);

    const fontSelect = document.createElement('select');
    fontSelect.className = 'text-input font-family-select';
    fontCatalog.families.forEach((font) => {
      const option = document.createElement('option');
      option.value = font;
      option.textContent = font;
      fontSelect.appendChild(option);
    });
    if (!fontCatalog.families.includes(value.font_family)) {
      const option = document.createElement('option');
      option.value = value.font_family;
      option.textContent = value.font_family;
      fontSelect.appendChild(option);
    }
    fontSelect.value = value.font_family;
    fontSelect.addEventListener('change', () => {
      const nextStyle = getFontStyles(fontSelect.value)[0] || { style: 'Regular', postscript_name: '' };
      updateCartelaTitleTypography({
        font_family: fontSelect.value,
        font_style: nextStyle.style,
        font_postscript_name: nextStyle.postscript_name,
      }, { rerenderEditor: true });
    });
    row.appendChild(fontSelect);

    const styleSelect = document.createElement('select');
    styleSelect.className = 'text-input compact-select';
    const styles = getFontStyles(value.font_family);
    styles.forEach((fontStyle) => {
      const option = document.createElement('option');
      option.value = fontStyle.style;
      option.textContent = fontStyle.style;
      option.dataset.postscriptName = fontStyle.postscript_name || '';
      styleSelect.appendChild(option);
    });
    if (!styles.some((fontStyle) => fontStyle.style === value.font_style)) {
      const option = document.createElement('option');
      option.value = value.font_style;
      option.textContent = value.font_style;
      option.dataset.postscriptName = value.font_postscript_name || '';
      styleSelect.appendChild(option);
    }
    styleSelect.value = value.font_style;
    styleSelect.addEventListener('change', () => {
      const selected = styleSelect.selectedOptions[0];
      updateCartelaTitleTypography({
        font_style: styleSelect.value,
        font_postscript_name: selected ? selected.dataset.postscriptName || '' : '',
      });
    });
    row.appendChild(styleSelect);

    const colorInput = document.createElement('input');
    colorInput.className = 'color-input';
    colorInput.type = 'color';
    colorInput.value = normalizeColor(value.color);
    colorInput.addEventListener('input', () => updateCartelaTitleTypography({ color: colorInput.value }));
    row.appendChild(colorInput);

    if (isOverride) {
      const resetButton = document.createElement('button');
      resetButton.type = 'button';
      resetButton.textContent = 'Restablecer';
      resetButton.addEventListener('click', resetCartelaTitleTypographyOverride);
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

      const sizeInput = document.createElement('input');
      sizeInput.className = 'text-input compact-number-input';
      sizeInput.type = 'number';
      sizeInput.min = '1';
      sizeInput.step = '1';
      sizeInput.value = String(value.font_size);
      sizeInput.placeholder = String(base.font_size);
      sizeInput.addEventListener('change', () => updateSelectedBlockTypography(ref, key, { font_size: Math.max(1, Number(sizeInput.value) || base.font_size) }));
      row.appendChild(sizeInput);

      const fontSelect = document.createElement('select');
      fontSelect.className = 'text-input font-family-select';
      fontCatalog.families.forEach((font) => {
        const option = document.createElement('option');
        option.value = font;
        option.textContent = font;
        fontSelect.appendChild(option);
      });
      if (!fontCatalog.families.includes(value.font_family)) {
        const option = document.createElement('option');
        option.value = value.font_family;
        option.textContent = value.font_family;
        fontSelect.appendChild(option);
      }
      fontSelect.value = value.font_family;
      fontSelect.addEventListener('change', () => {
        const nextStyle = getFontStyles(fontSelect.value)[0] || { style: 'Regular', postscript_name: '' };
        updateSelectedBlockTypography(ref, key, {
          font_family: fontSelect.value,
          font_style: nextStyle.style,
          font_postscript_name: nextStyle.postscript_name,
        }, { rerenderEditor: true });
      });
      row.appendChild(fontSelect);

      const styleSelect = document.createElement('select');
      styleSelect.className = 'text-input compact-select';
      const styles = getFontStyles(value.font_family);
      styles.forEach((fontStyle) => {
        const option = document.createElement('option');
        option.value = fontStyle.style;
        option.textContent = fontStyle.style;
        option.dataset.postscriptName = fontStyle.postscript_name || '';
        styleSelect.appendChild(option);
      });
      if (!styles.some((fontStyle) => fontStyle.style === value.font_style)) {
        const option = document.createElement('option');
        option.value = value.font_style;
        option.textContent = value.font_style;
        option.dataset.postscriptName = value.font_postscript_name || '';
        styleSelect.appendChild(option);
      }
      styleSelect.value = value.font_style;
      styleSelect.addEventListener('change', () => {
        const selected = styleSelect.selectedOptions[0];
        updateSelectedBlockTypography(ref, key, {
          font_style: styleSelect.value,
          font_postscript_name: selected ? selected.dataset.postscriptName || '' : '',
        });
      });
      row.appendChild(styleSelect);

      const colorInput = document.createElement('input');
      colorInput.className = 'color-input';
      colorInput.type = 'color';
      colorInput.value = normalizeColor(value.color);
      colorInput.addEventListener('input', () => updateSelectedBlockTypography(ref, key, { color: colorInput.value }));
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
    if (!state.structure) return;
    const index = state.structure.cartelas.length + 1;
    const cartelaId = uniqueCartelaId(index);
    ensureCartelaOrders(state.structure.cartelas);
    const visualCartelas = getVisualCartelas(state.structure.cartelas);
    const selectedVisualIndex = visualCartelas.findIndex((cartela) => cartela.id === state.selectedCartelaId);
    const nextVisualOrder = selectedVisualIndex >= 0 ? selectedVisualIndex + 2 : visualCartelas.length + 1;
    visualCartelas.forEach((cartela) => {
      if (Number(cartela.visual_order) >= nextVisualOrder) cartela.visual_order = Number(cartela.visual_order) + 1;
    });
    const cartela = {
      id: cartelaId,
      manual_name: `Cartela manual ${index}`,
      title: '',
      manual: true,
      source_order: index,
      visual_order: nextVisualOrder,
      type: 'card',
      duration: 4,
      orientation: 'vertical',
      columns: 1,
      vertical_offset: 0,
      enabled: true,
      notes: '',
      pages: [{ id: `${cartelaId}_page_001`, source_refs: [], source_ref_settings: {} }],
    };
    state.structure.cartelas.push(cartela);
    state.selectedCartelaId = cartela.id;
    rebuild();
  }

  function deleteSelectedManualCartela() {
    if (!state.structure || !Array.isArray(state.structure.cartelas)) return;
    const cartela = getSelectedCartela();
    if (!cartela || !cartela.manual) return;
    const confirmed = window.confirm('Eliminar esta cartela manual?');
    if (!confirmed) return;
    const ordered = getVisualCartelas(state.structure.cartelas);
    const index = ordered.findIndex((candidate) => candidate.id === cartela.id);
    state.structure.cartelas = state.structure.cartelas.filter((candidate) => candidate.id !== cartela.id);
    normalizeVisualOrders(state.structure.cartelas);
    const nextCartela = getVisualCartelas(state.structure.cartelas)[Math.max(0, Math.min(index, state.structure.cartelas.length - 1))] || null;
    state.selectedCartelaId = nextCartela ? nextCartela.id : null;
    rebuild();
  }

  function uniqueCartelaId(seedIndex = 1) {
    const existing = new Set((state.structure && state.structure.cartelas ? state.structure.cartelas : []).map((cartela) => cartela.id));
    let index = Math.max(1, Number(seedIndex) || 1);
    let candidate = `cartela_${String(index).padStart(3, '0')}`;
    while (existing.has(candidate)) {
      index += 1;
      candidate = `cartela_${String(index).padStart(3, '0')}`;
    }
    return candidate;
  }

  function moveCartelaVisualOrder(cartelaId, delta) {
    if (!state.structure || !Array.isArray(state.structure.cartelas)) return;
    ensureCartelaOrders(state.structure.cartelas);
    const ordered = getVisualCartelas(state.structure.cartelas);
    const index = ordered.findIndex((cartela) => cartela.id === cartelaId);
    const nextIndex = index + delta;
    if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) return;
    const currentOrder = ordered[index].visual_order;
    ordered[index].visual_order = ordered[nextIndex].visual_order;
    ordered[nextIndex].visual_order = currentOrder;
    normalizeVisualOrders(state.structure.cartelas);
    state.render = buildRenderJson(state.source, state.materials, state.structure);
    renderCartelaList();
    renderPreview();
    refreshPdfIfActive();
  }

  function updateCartela(fields) {
    const cartela = getSelectedCartela();
    if (!cartela) return;
    Object.assign(cartela, fields);
    if (fields && fields.image === null) delete cartela.image;
    if (fields && fields.images) cartela.images = normalizeCartelaImages(fields.images);
    state.render = buildRenderJson(state.source, state.materials, state.structure);
    renderCartelaList();
    renderEditor();
    renderPreview();
    refreshPdfIfActive();
  }

  function isCartelaOverride(cartela, key) {
    return !!(cartela && cartela.style_id && Object.prototype.hasOwnProperty.call(cartela, key));
  }

  function resetCartelaOverride(key) {
    const cartela = getSelectedCartela();
    if (!cartela) return;
    delete cartela[key];
    state.render = buildRenderJson(state.source, state.materials, state.structure);
    renderCartelaList();
    renderEditor();
    renderPreview();
    refreshPdfIfActive();
  }

  function getEffectiveCartelaBlockStyle(cartela) {
    const styleBlock = getCartelaStyleBlock(cartela) || {};
    if (cartela && cartela.block_style) {
      return normalizeStyleBlock({
        ...styleBlock,
        ...cartela.block_style,
        alignment: {
          ...((styleBlock && styleBlock.alignment) || {}),
          ...((cartela.block_style && cartela.block_style.alignment) || {}),
        },
        typography: {
          ...((styleBlock && styleBlock.typography) || {}),
          ...((cartela.block_style && cartela.block_style.typography) || {}),
        },
      });
    }
    if (Object.keys(styleBlock).length) return normalizeStyleBlock(styleBlock);
    const firstRef = getCartelaRefs(cartela)[0];
    const firstPage = firstRef ? findPageWithRef(cartela, firstRef) : null;
    const settings = firstPage && firstPage.source_ref_settings && firstPage.source_ref_settings[firstRef]
      ? firstPage.source_ref_settings[firstRef]
      : {};
    return normalizeStyleBlock(settings);
  }

  function updateCartelaBlockStyle(fields) {
    const cartela = getSelectedCartela();
    if (!cartela) return;
    if (cartela.style_id) {
      cartela.block_style = normalizeStyleBlock({
        ...(cartela.block_style || {}),
        ...fields,
        alignment: fields.alignment || (cartela.block_style && cartela.block_style.alignment) || {},
        typography: fields.typography || (cartela.block_style && cartela.block_style.typography) || {},
      });
    } else {
      applyBlockStyleToCartelaRefs(cartela, fields);
    }
    state.render = buildRenderJson(state.source, state.materials, state.structure);
    renderEditor();
    renderPreview();
    refreshPdfIfActive();
  }

  function resetCartelaBlockOverride(key) {
    const cartela = getSelectedCartela();
    if (!cartela || !cartela.block_style) return;
    delete cartela.block_style[key];
    state.render = buildRenderJson(state.source, state.materials, state.structure);
    if (!Object.keys(cartela.block_style).length) delete cartela.block_style;
    renderEditor();
    renderPreview();
    refreshPdfIfActive();
  }

  function updateCartelaBlockAlignment(key, value) {
    const cartela = getSelectedCartela();
    if (!cartela) return;
    const current = cartela.block_style && cartela.block_style.alignment ? cartela.block_style.alignment : {};
    updateCartelaBlockStyle({
      alignment: {
        ...current,
        [key]: value,
      },
    });
  }

  function hasCartelaBlockAlignmentOverride(cartela, key) {
    return !!(
      cartela
      && cartela.block_style
      && cartela.block_style.alignment
      && cartela.block_style.alignment[key] !== undefined
    );
  }

  function resetCartelaBlockAlignmentOverride(key) {
    const cartela = getSelectedCartela();
    if (!cartela || !cartela.block_style || !cartela.block_style.alignment) return;
    delete cartela.block_style.alignment[key];
    if (!Object.keys(cartela.block_style.alignment).length) delete cartela.block_style.alignment;
    if (!Object.keys(cartela.block_style).length) delete cartela.block_style;
    state.render = buildRenderJson(state.source, state.materials, state.structure);
    renderEditor();
    renderPreview();
    refreshPdfIfActive();
  }

  function hasCartelaBlockTypographyOverride(cartela, key) {
    return !!(
      cartela
      && cartela.block_style
      && cartela.block_style.typography
      && cartela.block_style.typography[key]
      && Object.keys(cartela.block_style.typography[key]).length
    );
  }

  function resetCartelaBlockTypographyOverride(key) {
    const cartela = getSelectedCartela();
    if (!cartela || !cartela.block_style || !cartela.block_style.typography) return;
    delete cartela.block_style.typography[key];
    if (!Object.keys(cartela.block_style.typography).length) delete cartela.block_style.typography;
    if (!Object.keys(cartela.block_style).length) delete cartela.block_style;
    state.render = buildRenderJson(state.source, state.materials, state.structure);
    renderEditor();
    renderPreview();
    refreshPdfIfActive();
  }

  function updateCartelaBlockTypography(key, fields, options = {}) {
    const cartela = getSelectedCartela();
    if (!cartela) return;
    const current = cartela.block_style && cartela.block_style.typography ? cartela.block_style.typography : {};
    const typography = normalizeTypographyOverrides({
      ...current,
      [key]: {
        ...(current[key] || {}),
        ...fields,
      },
    });
    updateCartelaBlockStyle({ typography });
    if (options.rerenderEditor) renderEditor();
  }

  function hasCartelaTitleTypographyOverride(cartela) {
    return !!(
      cartela
      && cartela.title_typography
      && cartela.title_typography.page_header
      && Object.keys(cartela.title_typography.page_header).length
    );
  }

  function resetCartelaTitleTypographyOverride() {
    const cartela = getSelectedCartela();
    if (!cartela || !cartela.title_typography) return;
    delete cartela.title_typography.page_header;
    if (!Object.keys(cartela.title_typography).length) delete cartela.title_typography;
    state.render = buildRenderJson(state.source, state.materials, state.structure);
    renderEditor();
    renderPreview();
    renderCartelaPreview();
    refreshPdfIfActive();
  }

  function updateCartelaTitleTypography(fields, options = {}) {
    const cartela = getSelectedCartela();
    if (!cartela) return;
    const current = cartela.title_typography && cartela.title_typography.page_header ? cartela.title_typography.page_header : {};
    const typography = normalizeTitleTypographyOverrides({
      page_header: {
        ...current,
        ...fields,
      },
    });
    const base = getEffectiveStyleTitleTypography(getStyleById(cartela.style_id)).page_header;
    if (typography.page_header) {
      Object.keys(typography.page_header).forEach((key) => {
        if (sameStyleValue(typography.page_header[key], base && base[key])) delete typography.page_header[key];
      });
      if (!Object.keys(typography.page_header).length) delete typography.page_header;
    }
    if (typography.page_header) {
      cartela.title_typography = typography;
    } else {
      delete cartela.title_typography;
    }
    state.render = buildRenderJson(state.source, state.materials, state.structure);
    renderCartelaList();
    renderPreview();
    renderCartelaPreview();
    refreshPdfIfActive();
    if (options.rerenderEditor) renderEditor();
  }

  function applyBlockStyleToCartelaRefs(cartela, fields) {
    (cartela.pages || []).forEach((page) => {
      page.source_ref_settings = page.source_ref_settings || {};
      (page.source_refs || []).forEach((ref) => {
        const current = page.source_ref_settings[ref] || {};
        page.source_ref_settings[ref] = normalizeStyleBlock({
          ...current,
          ...fields,
          alignment: fields.alignment || current.alignment || {},
          typography: fields.typography || current.typography || {},
        });
      });
    });
  }

  function syncLoadedStyleSnapshots() {
    if (!state.structure || !Array.isArray(state.structure.cartelas)) return;
    state.structure.cartelas.forEach((cartela) => applyStyleSnapshotToCartela(cartela, getStyleById(cartela.style_id)));
  }

  function syncStyleSnapshot(styleId) {
    if (!state.structure || !Array.isArray(state.structure.cartelas)) return;
    const style = getStyleById(styleId);
    state.structure.cartelas
      .filter((cartela) => cartela.style_id === styleId)
      .forEach((cartela) => applyStyleSnapshotToCartela(cartela, style));
  }

  function applyStyleSnapshotToCartela(cartela, style) {
    if (!cartela || !style) return;
  }

  function pruneRedundantStyleOverrides() {
    if (!state.structure || !Array.isArray(state.structure.cartelas)) return;
    state.structure.cartelas.forEach((cartela) => {
      const style = getStyleById(cartela.style_id);
      const titleTypography = explicitCartelaTitleTypography(
        cartela.title_typography,
        getEffectiveStyleTitleTypography(style).page_header
      );
      if (Object.keys(titleTypography).length) {
        cartela.title_typography = titleTypography;
      } else {
        delete cartela.title_typography;
      }

      if (!style) return;
      const styleCartela = getEffectiveStyleCartela(style);
      STYLE_CARTELA_FIELDS.forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(cartela, key)) return;
        if (sameStyleValue(cartela[key], styleCartela[key])) delete cartela[key];
      });

      if (!cartela.block_style) return;
      const styleBlock = getEffectiveStyleBlock(style);
      if (sameStyleValue(cartela.block_style.columns, styleBlock.columns)) delete cartela.block_style.columns;
      if (sameStyleValue(cartela.block_style.concatenate_rows, styleBlock.concatenate_rows)) delete cartela.block_style.concatenate_rows;
      if (sameStyleValue(cartela.block_style.force_role_name_columns, styleBlock.force_role_name_columns)) delete cartela.block_style.force_role_name_columns;
      if (sameStyleValue(cartela.block_style.vertical_align, styleBlock.vertical_align)) delete cartela.block_style.vertical_align;
      Object.keys(cartela.block_style.alignment || {}).forEach((key) => {
        if (sameStyleValue(cartela.block_style.alignment[key], styleBlock.alignment && styleBlock.alignment[key])) {
          delete cartela.block_style.alignment[key];
        }
      });
      if (cartela.block_style.alignment && !Object.keys(cartela.block_style.alignment).length) delete cartela.block_style.alignment;

      Object.keys(cartela.block_style.typography || {}).forEach((key) => {
        if (sameStyleValue(cartela.block_style.typography[key], styleBlock.typography && styleBlock.typography[key])) {
          delete cartela.block_style.typography[key];
        }
      });
      if (cartela.block_style.typography && !Object.keys(cartela.block_style.typography).length) delete cartela.block_style.typography;
      if (!Object.keys(cartela.block_style).length) delete cartela.block_style;
    });
  }

  function pruneRedundantStyleDefaults() {
    const settings = getProductionSettings();
    state.styles.forEach((style) => {
      const defaultCartela = baseStyleCartelaFromSettings();
      ['duration', 'line_spacing', 'column_gap', 'role_name_gap', 'source_group_gap', 'block_gap', 'block_title_gap', 'page_top_margin', 'page_bottom_margin', 'page_left_margin', 'page_right_margin', 'repeat_block_titles', 'auto_text_wrap', 'text_capitalization', 'use_protected_capitalization'].forEach((key) => {
        if (style.cartela && Object.prototype.hasOwnProperty.call(style.cartela, key) && sameStyleValue(style.cartela[key], defaultCartela[key])) {
          delete style.cartela[key];
        }
      });
      if (style.cartela && !Object.keys(style.cartela).length) style.cartela = {};

      const defaultTitle = getProductionSettings().typography.page_header;
      const titleTypography = normalizeTitleTypographyOverrides(style.title_typography || {});
      Object.keys(titleTypography.page_header || {}).forEach((key) => {
        if (sameStyleValue(titleTypography.page_header[key], defaultTitle && defaultTitle[key])) delete titleTypography.page_header[key];
      });
      style.title_typography = titleTypography.page_header && Object.keys(titleTypography.page_header).length ? titleTypography : {};

      if (!style.block) return;
      const defaultBlock = normalizeStyleBlock({
        typography: Object.fromEntries(BLOCK_TYPOGRAPHY_FIELDS.map(([key]) => [key, settings.typography[key]])),
      });
      if (style.block.concatenate_rows !== undefined && sameStyleValue(style.block.concatenate_rows, defaultBlock.concatenate_rows)) {
        delete style.block.concatenate_rows;
      }
      if (style.block.force_role_name_columns !== undefined && sameStyleValue(style.block.force_role_name_columns, defaultBlock.force_role_name_columns)) {
        delete style.block.force_role_name_columns;
      }
      Object.keys(style.block.typography || {}).forEach((key) => {
        if (sameStyleValue(style.block.typography[key], defaultBlock.typography && defaultBlock.typography[key])) {
          delete style.block.typography[key];
        }
      });
      if (style.block.typography && !Object.keys(style.block.typography).length) delete style.block.typography;
      if (!Object.keys(style.block).length) style.block = {};
    });
  }

  function uniqueStyleId(baseId) {
    let candidate = baseId || 'estilo';
    let index = 2;
    const existing = new Set(state.styles.map((style) => style.id));
    while (existing.has(candidate)) {
      candidate = `${baseId}_${index}`;
      index += 1;
    }
    return candidate;
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

  function getCartelaDisplayName(cartela, index = 0) {
    if (cartela && cartela.manual && String(cartela.manual_name || '').trim()) return cartela.manual_name;
    const refs = getCartelaRefs(cartela);
    const titles = refs
      .map((ref) => state.materials.find((material) => material.id === ref))
      .filter(Boolean)
      .map((material) => material.title || material.id);
    return titles.length ? titles.join(' + ') : `Cartela ${index + 1}`;
  }

  function getSelectedBlockAlignment(ref, material) {
    const cartela = getSelectedCartela();
    const page = findPageWithRef(cartela, ref);
    return getSourceRefAlignment(page, ref, material, cartela);
  }

  function updateSelectedBlockAlignment(ref, fields) {
    const cartela = getSelectedCartela();
    const page = findPageWithRef(cartela, ref);
    if (!page) return;
    page.source_ref_settings = page.source_ref_settings || {};
    page.source_ref_settings[ref] = page.source_ref_settings[ref] || {};
    page.source_ref_settings[ref].alignment = {
      ...(page.source_ref_settings[ref].alignment || {}),
      ...fields,
    };
    state.render = buildRenderJson(state.source, state.materials, state.structure);
    renderPreview();
    refreshPdfIfActive();
  }

  function getSelectedBlockVerticalAlign(ref) {
    const cartela = getSelectedCartela();
    const page = findPageWithRef(cartela, ref);
    return getSourceRefVerticalAlign(page, ref);
  }

  function updateSelectedBlockVerticalAlign(ref, value) {
    const cartela = getSelectedCartela();
    const page = findPageWithRef(cartela, ref);
    if (!page) return;
    page.source_ref_settings = page.source_ref_settings || {};
    page.source_ref_settings[ref] = page.source_ref_settings[ref] || {};
    page.source_ref_settings[ref].vertical_align = normalizeVerticalAlign(value);
    state.render = buildRenderJson(state.source, state.materials, state.structure);
    renderPreview();
    refreshPdfIfActive();
  }

  function getSelectedBlockTypography(ref) {
    const cartela = getSelectedCartela();
    const page = findPageWithRef(cartela, ref);
    return getSourceRefTypography(page, ref);
  }

  function updateSelectedBlockTypography(ref, key, fields, options = {}) {
    const cartela = getSelectedCartela();
    const page = findPageWithRef(cartela, ref);
    if (!page) return;
    page.source_ref_settings = page.source_ref_settings || {};
    page.source_ref_settings[ref] = page.source_ref_settings[ref] || {};
    const typography = {
      ...(page.source_ref_settings[ref].typography || {}),
      [key]: {
        ...(page.source_ref_settings[ref].typography && page.source_ref_settings[ref].typography[key] ? page.source_ref_settings[ref].typography[key] : {}),
        ...fields,
      },
    };
    page.source_ref_settings[ref].typography = normalizeTypographyOverrides(typography);
    state.render = buildRenderJson(state.source, state.materials, state.structure);
    if (options.rerenderEditor) renderEditor();
    renderPreview();
    refreshPdfIfActive();
  }

  function resetSelectedBlockTypography(ref) {
    const cartela = getSelectedCartela();
    const page = findPageWithRef(cartela, ref);
    if (!page || !page.source_ref_settings || !page.source_ref_settings[ref]) return;
    delete page.source_ref_settings[ref].typography;
    state.render = buildRenderJson(state.source, state.materials, state.structure);
    renderEditor();
    renderPreview();
    refreshPdfIfActive();
  }

  function getSelectedBlockColumns(ref) {
    const cartela = getSelectedCartela();
    const page = findPageWithRef(cartela, ref);
    return getSourceRefColumns(page, ref);
  }

  function updateSelectedBlockColumns(ref, columns) {
    const cartela = getSelectedCartela();
    const page = findPageWithRef(cartela, ref);
    if (!page) return;
    page.source_ref_settings = page.source_ref_settings || {};
    page.source_ref_settings[ref] = page.source_ref_settings[ref] || {};
    page.source_ref_settings[ref].columns = Math.max(1, Number(columns) || 1);
    state.render = buildRenderJson(state.source, state.materials, state.structure);
    renderPreview();
    refreshPdfIfActive();
  }

  function findPageWithRef(cartela, ref) {
    if (!cartela) return null;
    return (cartela.pages || []).find((page) => (page.source_refs || []).includes(ref)) || null;
  }

  function moveMaterialToCartela(materialId, targetCartela) {
    if (!state.structure || !targetCartela) return;
    state.structure.cartelas.forEach((cartela) => {
      (cartela.pages || []).forEach((page) => {
        page.source_refs = (page.source_refs || []).filter((ref) => ref !== materialId);
      });
    });
    const page = ensureFirstPage(targetCartela);
    page.source_ref_settings = page.source_ref_settings || {};
    page.source_ref_settings[materialId] = page.source_ref_settings[materialId] || { columns: 1 };
    page.source_refs.push(materialId);
  }

  function ensureFirstPage(cartela) {
    cartela.pages = cartela.pages || [];
    if (!cartela.pages[0]) cartela.pages.push({ id: `${cartela.id}_page_001`, source_refs: [], source_ref_settings: {} });
    cartela.pages[0].source_refs = cartela.pages[0].source_refs || [];
    cartela.pages[0].source_ref_settings = cartela.pages[0].source_ref_settings || {};
    return cartela.pages[0];
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

  function localInputRow(label, value, onInput, options) {
    const row = document.createElement('div');
    row.className = 'field-grid' + (options && options.override ? ' override-field' : '');
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    const input = options && options.multiline ? document.createElement('textarea') : document.createElement('input');
    input.className = 'text-input';
    if (!(options && options.multiline)) input.type = 'text';
    input.value = value;
    const commit = () => onInput(input.value);
    if (options && options.commitOnChange) {
      input.addEventListener('change', commit);
    } else {
      input.addEventListener('input', commit);
    }
    row.appendChild(labelEl);
    row.appendChild(wrapOverrideControl(input, options));
    return row;
  }

  function localSelectRow(label, value, options, onInput, meta = {}) {
    const row = document.createElement('div');
    row.className = 'field-grid' + (meta.override ? ' override-field' : '');
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    const select = document.createElement('select');
    select.className = 'text-input compact-select';
    options.forEach(([optionValue, optionLabel]) => {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = optionLabel;
      select.appendChild(option);
    });
    select.value = value;
    select.addEventListener('change', () => {
      onInput(select.value);
      renderEditor();
    });
    row.appendChild(labelEl);
    row.appendChild(wrapOverrideControl(select, meta));
    return row;
  }

  function localDurationRow(label, secondsValue, onInput, meta = {}) {
    const row = document.createElement('div');
    row.className = 'field-grid' + (meta.override ? ' override-field' : '');
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    const input = document.createElement('input');
    const fps = getMovieFps();
    input.className = 'text-input';
    input.type = 'text';
    input.inputMode = 'numeric';
    input.value = formatSecondsAsFrameDuration(secondsValue, fps);
    input.addEventListener('change', () => {
      const currentFps = getMovieFps();
      const frames = parseFrameDuration(input.value, currentFps);
      if (frames === null) {
        window.alert(`Introduce la duración como mm:ss:ff. También puedes escribir solo números, por ejemplo 35 = ${formatFrameDuration(35, currentFps)}.`);
        input.value = formatSecondsAsFrameDuration(secondsValue, currentFps);
        return;
      }
      input.value = formatFrameDuration(frames, currentFps);
      onInput(frames / currentFps);
      renderEditor();
    });
    row.appendChild(labelEl);
    row.appendChild(wrapOverrideControl(input, meta));
    return row;
  }

  function localNumberRow(label, value, min, max, onInput, step = 1, meta = {}) {
    const row = document.createElement('div');
    row.className = 'field-grid' + (meta.override ? ' override-field' : '');
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    const input = document.createElement('input');
    input.className = 'text-input compact-number-input';
    input.type = 'number';
    if (min !== null && min !== undefined) input.min = String(min);
    if (max !== null && max !== undefined) input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.addEventListener('change', () => {
      const raw = Number(input.value);
      let next = Number.isFinite(raw) ? raw : (min !== null && min !== undefined ? min : 0);
      if (min !== null && min !== undefined) next = Math.max(min, next);
      if (max !== null && max !== undefined) next = Math.min(max, next);
      input.value = String(next);
      onInput(next);
      renderEditor();
    });
    row.appendChild(labelEl);
    row.appendChild(wrapOverrideControl(input, meta));
    return row;
  }

  function wrapOverrideControl(control, meta = {}) {
    if (!meta.override) return control;
    const wrap = document.createElement('div');
    wrap.className = 'override-control';
    wrap.appendChild(control);
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.textContent = 'Restablecer';
    reset.addEventListener('click', meta.reset || (() => {}));
    wrap.appendChild(reset);
    return wrap;
  }

  function localCheckboxRow(label, value, onInput) {
    const row = document.createElement('div');
    row.className = 'field-grid';
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    const inputWrap = document.createElement('label');
    inputWrap.className = 'check-row';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = value;
    input.addEventListener('change', () => onInput(input.checked));
    inputWrap.appendChild(input);
    inputWrap.appendChild(document.createTextNode(value ? 'Activa' : 'Excluida'));
    input.addEventListener('change', () => {
      inputWrap.lastChild.textContent = input.checked ? 'Activa' : 'Excluida';
    });
    row.appendChild(labelEl);
    row.appendChild(inputWrap);
    return row;
  }

  function makeInput(refId, field, fallback, options) {
    const opts = options || {};
    const current = resolveOverride(state.structure.overrides || {}, refId, field, fallback);
    const input = opts.multiline ? document.createElement('textarea') : document.createElement('input');
    input.className = 'text-input';
    input.value = Array.isArray(current) ? current.join('\n') : (current || '');
    if (!opts.multiline) {
      input.type = 'text';
    } else {
      input.rows = 1;
      input.spellcheck = false;
    }
    input.addEventListener('input', () => {
      if (opts.multiline) resizeMultilineInput(input);
      const rawValue = input.value;
      const parsedValue = opts.parse ? opts.parse(rawValue) : rawValue;
      const parsedFallback = opts.fallback !== undefined ? opts.fallback : fallback;
      setOverride(refId, field, parsedValue, parsedFallback);
      state.render = buildRenderJson(state.source, state.materials, state.structure);
      renderPreview();
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

  function setOverride(refId, field, value, fallback) {
    state.structure.overrides = state.structure.overrides || {};
    const hasChanged = normalizeEditableValue(value) !== normalizeEditableValue(fallback);

    if (!hasChanged) {
      if (state.structure.overrides[refId]) {
        delete state.structure.overrides[refId][field];
        if (!Object.keys(state.structure.overrides[refId]).length) delete state.structure.overrides[refId];
      }
      return;
    }

    state.structure.overrides[refId] = state.structure.overrides[refId] || {};
    state.structure.overrides[refId][field] = value;
  }

  function resolveOverride(overrides, refId, field, fallback) {
    return overrides[refId] && Object.prototype.hasOwnProperty.call(overrides[refId], field)
      ? overrides[refId][field]
      : fallback;
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
    if (!state.structure) return null;
    const output = JSON.parse(JSON.stringify(state.structure));
    delete output.settings;
    output.cartelas = removeDefaultEmptyCartelas(output.cartelas || [], state.materials || []);
    output.cartelas.forEach(removeLegacyCartelaScaleFields);
    return output;
  }

  function removeLegacyCartelaScaleFields(cartela) {
    delete cartela.font_size_multiplier;
    delete cartela.line_spacing_multiplier;
    delete cartela.block_gap_multiplier;
    return cartela;
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
    const fps = getMovieFps();
    const segments = readMovieSegmentSettings(fps);
    if (getMovieMode() === 'scroll') {
      const groups = getSelectedScrollCartelaGroups();
      if (!groups.length) return cachePreviewAnimationPlan(cacheKey, null);
      const sourceFrames = getSelectedScrollSourceFrames(fps);
      const bodyFrames = getMovieBodyTargetFramesOrSource(
        sourceFrames,
        segments,
        movieTargetDurationFrames(fps),
        movieUsesCustomTargetDuration()
      );
      const scrollPlan = buildScrollPlan(groups, layout, bodyFrames, segments);
      const bodyPhase = scrollPlan.phases.find((phase) => phase.name === 'body');
      return cachePreviewAnimationPlan(cacheKey, {
        mode: 'scroll',
        layout,
        fps,
        videoStartFrame: bodyPhase ? bodyPhase.startFrame : segments.preFrames,
        totalFrames: Math.max(1, scrollPlan.totalFrames),
        scrollPlan,
      });
    }
    const selectedPages = getSelectedMoviePages();
    if (!selectedPages.length) return cachePreviewAnimationPlan(cacheKey, null);
    const frameCounts = getMovieExportFrameCounts(
      selectedPages,
      getSelectedMoviePageGroups(),
      getSelectedMovieGroupFrameCounts(fps),
      segments,
      movieTargetDurationFrames(fps),
      movieUsesCustomTargetDuration(),
      fps
    );
    return cachePreviewAnimationPlan(cacheKey, {
      mode: 'pages',
      layout,
      fps,
      videoStartFrame: segments.preFrames,
      selectedPages,
      frameCounts,
      totalFrames: frameCounts.reduce((sum, value) => sum + Math.max(1, Number(value) || 1), 0),
    });
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
      getMovieFps(),
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
    const video = normalizeReferenceVideo(state.referenceVideo);
    if (!video || !video.file_path) return null;
    const currentFrame = Math.max(0, Number(state.previewAnimation.frame) || 0);
    if (currentFrame < Math.max(0, Number(plan.videoStartFrame) || 0)) return null;
    const src = `/api/reference-video?path=${encodeURIComponent(video.file_path)}`;
    if (!state.referenceVideoElement || state.referenceVideoSrc !== src) {
      state.referenceVideoElement = document.createElement('video');
      state.referenceVideoElement.className = 'reference-video-preview';
      state.referenceVideoElement.muted = true;
      state.referenceVideoElement.playsInline = true;
      state.referenceVideoElement.preload = 'auto';
      state.referenceVideoElement.src = src;
      state.referenceVideoSrc = src;
    }
    const videoEl = state.referenceVideoElement;
    videoEl.style.width = `${Math.max(1, Math.round(plan.layout.page_width * zoom))}px`;
    videoEl.style.height = `${Math.max(1, Math.round(plan.layout.page_height * zoom))}px`;
    syncReferenceVideoElement(videoEl, plan);
    return videoEl;
  }

  function syncReferenceVideoElement(videoEl, plan) {
    const currentFrame = Math.max(0, Number(state.previewAnimation.frame) || 0);
    const videoStartFrame = Math.max(0, Number(plan.videoStartFrame) || 0);
    if (currentFrame < videoStartFrame) {
      videoEl.pause();
      videoEl.style.visibility = 'hidden';
      return;
    }
    const targetFrame = currentFrame - videoStartFrame;
    const targetTime = targetFrame / Math.max(1, Number(plan.fps) || 25);
    const updateDuration = () => {
      const duration = Number(videoEl.duration);
      if (Number.isFinite(duration) && duration > 0) {
        state.referenceVideoDuration = duration;
        updateReferenceVideoDurationField();
      }
    };
    const seek = () => {
      updateDuration();
      const duration = Number(videoEl.duration);
      if (Number.isFinite(duration) && duration > 0 && targetTime >= duration) {
        videoEl.pause();
        videoEl.style.visibility = 'hidden';
        return;
      }
      videoEl.style.visibility = 'visible';
      if (Number.isFinite(duration) && duration > 0) {
        videoEl.currentTime = targetTime;
      } else {
        videoEl.currentTime = targetTime;
      }
      if (state.previewAnimation.playing) {
        videoEl.play().catch(() => {});
      } else {
        videoEl.pause();
      }
    };
    if (videoEl.readyState >= 1) seek();
    else videoEl.addEventListener('loadedmetadata', seek, { once: true });
  }

  function pageForAnimationFrame(plan, frame) {
    let remaining = Math.max(0, Math.round(Number(frame) || 0));
    for (let index = 0; index < plan.selectedPages.length; index += 1) {
      const frameCount = Math.max(1, Number(plan.frameCounts[index]) || 1);
      if (remaining < frameCount) return plan.selectedPages[index].page;
      remaining -= frameCount;
    }
    return plan.selectedPages.length ? plan.selectedPages[plan.selectedPages.length - 1].page : null;
  }

  function syncPdfPageToAnimationFrame(plan, frame) {
    const pageIndex = pageIndexForAnimationFrame(plan, frame);
    if (pageIndex === null || pageIndex === state.pdfPageIndex) return;
    state.pdfPageIndex = pageIndex;
    updatePdfToolbar(state.pdfPageIndex + 1, getCurrentPhysicalPages().length);
  }

  function pageIndexForAnimationFrame(plan, frame) {
    if (!plan) return null;
    if (plan.mode === 'pages') {
      let remaining = Math.max(0, Math.round(Number(frame) || 0));
      for (let index = 0; index < plan.selectedPages.length; index += 1) {
        const frameCount = Math.max(1, Number(plan.frameCounts[index]) || 1);
        if (remaining < frameCount) return pageIndexById(plan.selectedPages[index].page && plan.selectedPages[index].page.id);
        remaining -= frameCount;
      }
      const last = plan.selectedPages[plan.selectedPages.length - 1];
      return pageIndexById(last && last.page && last.page.id);
    }
    return dominantScrollPageIndex(plan, frame);
  }

  function pageIndexById(pageId) {
    if (!pageId || !state.render || !state.structure) return null;
    const pages = getCurrentPhysicalPages();
    const index = pages.findIndex((page) => page.id === pageId);
    return index >= 0 ? index : null;
  }

  function frameForPdfPageIndex(plan, pageIndex) {
    if (!plan) return 0;
    const pages = getCurrentPhysicalPages();
    const page = pages[Math.max(0, Math.min(pages.length - 1, pageIndex))];
    if (!page) return 0;
    if (plan.mode === 'pages') {
      let frame = 0;
      for (let index = 0; index < plan.selectedPages.length; index += 1) {
        if (plan.selectedPages[index].page && plan.selectedPages[index].page.id === page.id) return frame;
        frame += Math.max(1, Number(plan.frameCounts[index]) || 1);
      }
      return Math.max(0, Math.min(plan.totalFrames - 1, frame));
    }
    return frameForScrollPage(plan, page);
  }

  function dominantScrollPageIndex(plan, frame) {
    const page = dominantScrollPage(plan, frame);
    return page ? pageIndexById(page.id) : null;
  }

  function dominantScrollPage(plan, frame) {
    if (!plan || plan.mode !== 'scroll') return null;
    const offset = scrollOffsetForFrame(plan.scrollPlan, frame);
    const viewportCenter = (plan.layout.page_top_margin + (plan.layout.page_height - plan.layout.page_bottom_margin)) / 2;
    let best = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const item of plan.scrollPlan.items) {
      const itemY = Math.round(item.stackTop - offset);
      for (const page of item.pages || []) {
        const center = itemY + scrollPageLocalCenter(item, page);
        const distance = Math.abs(center - viewportCenter);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = page;
        }
      }
    }
    return best;
  }

  function frameForScrollPage(plan, page) {
    if (!plan || plan.mode !== 'scroll' || !page) return 0;
    const item = (plan.scrollPlan.items || []).find((candidate) => (candidate.pages || []).some((itemPage) => itemPage.id === page.id));
    if (!item) return 0;
    const viewportCenter = (plan.layout.page_top_margin + (plan.layout.page_height - plan.layout.page_bottom_margin)) / 2;
    const localCenter = scrollPageLocalCenter(item, page);
    const targetOffset = item.stackTop + localCenter - viewportCenter;
    return frameForScrollOffset(plan.scrollPlan, targetOffset);
  }

  function frameForScrollOffset(plan, targetOffset) {
    if (!plan) return 0;
    const totalFrames = Math.max(1, Number(plan.totalFrames) || 1);
    const offset = Math.max(0, Number(targetOffset) || 0);
    const phases = (plan.phases || []).filter((phase) => Math.max(0, Number(phase.frames) || 0) > 0);
    if (!phases.length) return 0;
    for (const phase of phases) {
      const start = Math.max(0, Number(phase.startOffset) || 0);
      const end = Math.max(0, Number(phase.endOffset) || 0);
      const min = Math.min(start, end);
      const max = Math.max(start, end);
      if (offset < min || offset > max) continue;
      const frames = Math.max(1, Math.round(Number(phase.frames) || 1));
      if (frames <= 1 || start === end) return Math.max(0, Math.min(totalFrames - 1, Math.round(Number(phase.startFrame) || 0)));
      const localFrame = Math.round((Math.max(0, offset - start) * (frames - 1)) / Math.max(1, end - start));
      return Math.max(0, Math.min(totalFrames - 1, Math.round(Number(phase.startFrame) || 0) + localFrame));
    }
    const first = phases[0];
    const last = phases[phases.length - 1];
    if (offset <= Math.min(first.startOffset, first.endOffset)) return Math.max(0, Math.round(Number(first.startFrame) || 0));
    return totalFrames - 1;
  }

  function scrollPageLocalCenter(item, page) {
    const pages = item.pages || [];
    const index = Math.max(0, pages.findIndex((candidate) => candidate.id === page.id));
    if (pages.length <= 1) return Math.max(1, Number(item.height) || 1) / 2;
    const height = Math.max(1, Number(item.height) || 1);
    const segment = height / pages.length;
    return (index * segment) + (segment / 2);
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

  function renderCartelaPreview() {
    if (!els.cartelaPreview) return;
    els.cartelaPreview.innerHTML = '';
    const cartela = getSelectedCartela();
    if (!state.render || !state.structure || !cartela) {
      els.cartelaPreview.className = 'cartela-preview empty-state';
      els.cartelaPreview.textContent = 'Selecciona una cartela.';
      return;
    }
    const layout = getRenderLayout();
    const pages = getCurrentPhysicalPages();
    const page = pages.find((candidate) => candidate.cartela && candidate.cartela.id === cartela.id);
    if (!page) {
      els.cartelaPreview.className = 'cartela-preview empty-state';
      els.cartelaPreview.textContent = 'Sin página activa.';
      return;
    }
    els.cartelaPreview.className = 'cartela-preview';
    const zoom = previewZoomForContainer(els.cartelaPreview, layout);
    const frame = document.createElement('div');
    frame.className = 'png-preview-frame';
    frame.style.width = `${layout.page_width * zoom}px`;
    frame.style.height = `${layout.page_height * zoom}px`;
    const plan = getPreviewAnimationPlan();
    const video = state.showCartelaReferenceVideo && plan ? makeReferenceVideoElement(plan, zoom) : null;
    if (video) frame.appendChild(video);
    const sheet = makePdfSheetElement(page, layout, { transparent: !!video });
    sheet.style.transform = `scale(${zoom})`;
    frame.appendChild(sheet);
    if (state.showPanelMarginOverlay) frame.appendChild(makeMarginOverlay(layoutForCartela(layout, page.cartela), zoom));
    els.cartelaPreview.appendChild(frame);
    updatePanelMarginButtons();
  }

  function previewZoomForContainer(container, layout) {
    const width = Math.max(1, Number(layout.page_width) || 1);
    const height = Math.max(1, Number(layout.page_height) || 1);
    const availableWidth = Math.max(120, (container && container.clientWidth ? container.clientWidth : 360) - 24);
    const availableHeight = Math.max(120, (container && container.clientHeight ? container.clientHeight : 260) - 24);
    return Math.max(0.03, Math.min(availableWidth / width, availableHeight / height));
  }

  function makeMarginOverlay(layout, zoom = state.pngPreviewZoom) {
    const overlay = document.createElement('div');
    overlay.className = 'margin-overlay';
    const area = contentAreaRect(layout);
    const guides = [
      ['vertical', layout.page_left_margin * zoom, false],
      ['vertical', (layout.page_width - layout.page_right_margin) * zoom, false],
      ['horizontal', layout.page_top_margin * zoom, false],
      ['horizontal', (layout.page_height - layout.page_bottom_margin) * zoom, false],
      ['vertical', (area.x + (area.width / 2)) * zoom, true],
      ['horizontal', (area.y + (area.height / 2)) * zoom, true],
    ];

    guides.forEach(([direction, position, center]) => {
      const guide = document.createElement('div');
      guide.className = `margin-guide ${direction}${center ? ' center' : ''}`;
      if (direction === 'vertical') guide.style.left = `${position}px`;
      else guide.style.top = `${position}px`;
      if (center && direction === 'vertical') {
        guide.style.top = `${area.y * zoom}px`;
        guide.style.height = `${area.height * zoom}px`;
      } else if (center) {
        guide.style.left = `${area.x * zoom}px`;
        guide.style.width = `${area.width * zoom}px`;
      }
      overlay.appendChild(guide);
    });

    return overlay;
  }

  function drawCanvasMarginOverlay(ctx, layout, zoom = state.pngPreviewZoom) {
    ctx.save();
    ctx.strokeStyle = '#ff2b2b';
    ctx.lineWidth = 1 / Math.max(0.01, Number(zoom) || 1);
    ctx.beginPath();
    ctx.moveTo(layout.page_left_margin, 0);
    ctx.lineTo(layout.page_left_margin, layout.page_height);
    ctx.moveTo(layout.page_width - layout.page_right_margin, 0);
    ctx.lineTo(layout.page_width - layout.page_right_margin, layout.page_height);
    ctx.moveTo(0, layout.page_top_margin);
    ctx.lineTo(layout.page_width, layout.page_top_margin);
    ctx.moveTo(0, layout.page_height - layout.page_bottom_margin);
    ctx.lineTo(layout.page_width, layout.page_height - layout.page_bottom_margin);
    ctx.stroke();
    ctx.restore();
  }

  function makePdfSheetElement(page, layout, options = {}) {
    const effectiveLayout = layoutForCartela(layout, page && page.cartela);
    const effectiveSettings = {
      ...normalizeSettings(options.settings || getProductionSettings()),
      layout: effectiveLayout,
    };
    const renderOptions = {
      ...options,
      settings: effectiveSettings,
    };
    const sheetEl = document.createElement('section');
    sheetEl.className = 'pdf-sheet';
    sheetEl.style.width = `${effectiveLayout.page_width}px`;
    sheetEl.style.height = `${effectiveLayout.page_height}px`;
    sheetEl.style.background = options.transparent ? 'transparent' : effectiveLayout.page_background;
    if (options.transparent) sheetEl.classList.add('transparent-export');

    const pageInner = document.createElement('div');
    pageInner.className = 'pdf-page-inner';
    pageInner.style.padding = `${effectiveLayout.page_top_margin}px ${effectiveLayout.page_right_margin}px ${effectiveLayout.page_bottom_margin}px ${effectiveLayout.page_left_margin}px`;
    makePdfCartelaImages(page.cartela, effectiveLayout).forEach((imageEl) => pageInner.appendChild(imageEl));

    const pageBody = document.createElement('div');
    pageBody.className = 'pdf-page-body';
    pageBody.style.gap = `${cartelaBlockGap(page.cartela, effectiveLayout)}px`;
    pageBody.style.justifyContent = pdfPageVerticalJustify(page);
    pageBody.style.transform = `translateY(${Number(page.cartela.vertical_offset) || 0}px)`;

    const pageTitle = makePdfPageTitle(page, renderOptions);
    if (pageTitle) pageBody.appendChild(pageTitle);

    page.blocks.forEach((block) => {
      pageBody.appendChild(renderPdfBlock(block, page.cartela, effectiveLayout, renderOptions));
    });

    pageInner.appendChild(pageBody);
    sheetEl.appendChild(pageInner);
    return sheetEl;
  }

  function makePdfCartelaImages(cartela, layout) {
    const area = contentAreaRect(layout);
    return cartelaImages(cartela).map((image) => {
      const imageEl = document.createElement('img');
      imageEl.className = 'pdf-cartela-image';
      imageEl.alt = '';
      imageEl.src = image.data_url;
      imageEl.style.left = `${area.x + (area.width / 2) + (Number(image.offset_x) || 0)}px`;
      imageEl.style.top = `${area.y + (area.height / 2) + (Number(image.offset_y) || 0)}px`;
      imageEl.style.transform = `translate(-50%, -50%) scale(${Math.max(0.01, Number(image.scale) || 1)})`;
      return imageEl;
    });
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
    els.pdfLineStatus.textContent = page ? getPdfLineStatus(page) : '0/0';
    updateMovieDurationFields();
  }

  function getMovieFps() {
    const settings = getProductionSettings();
    return Math.max(1, Math.round(Number(settings.movie_fps) || 25));
  }

  function normalizeDurationInputValue(input, fps) {
    const frames = parseFrameDuration(input && input.value, fps);
    if (frames === null) return null;
    input.value = formatFrameDuration(frames, fps);
    return frames;
  }

  function readMovieSegmentSettings(fps) {
    const groupCount = Math.max(0, selectedMovieGroupCount());
    const preCount = Math.max(0, Math.min(groupCount, Math.round(Number(els.moviePrerollCountInput && els.moviePrerollCountInput.value) || 0)));
    const maxPost = Math.max(0, groupCount - preCount);
    const postCount = Math.max(0, Math.min(maxPost, Math.round(Number(els.moviePostrollCountInput && els.moviePostrollCountInput.value) || 0)));
    const preFrames = normalizeDurationInputValue(els.moviePrerollDurationInput, fps) || 0;
    const postFrames = normalizeDurationInputValue(els.moviePostrollDurationInput, fps) || 0;
    return {
      preCount,
      postCount,
      preFrames: preCount ? Math.max(preCount, preFrames) : 0,
      postFrames: postCount ? Math.max(postCount, postFrames) : 0,
    };
  }

  function updateMovieSegmentInputs() {
    const fps = getMovieFps();
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
    return getExportPageRange(pages).map((page, index) => ({
      page,
      pageNumber: getExportRangeStart(pages) + index,
    })).filter((candidate) => candidate.page);
  }

  function getSelectedMoviePageGroups() {
    const groups = [];
    getSelectedMoviePages().forEach((item) => {
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

  function getSelectedMovieFrameCounts(fps) {
    return getSelectedMoviePages().map((item) => getPageFrameCount(item.page, fps));
  }

  function getSelectedMovieGroupFrameCounts(fps) {
    return getSelectedMoviePageGroups().map((group) => (
      Math.max(1, group.pages.reduce((sum, item) => sum + getPageFrameCount(item.page, fps), 0))
    ));
  }

  function getMovieMode() {
    return els.movieModeSelect && els.movieModeSelect.value === 'scroll' ? 'scroll' : 'pages';
  }

  function getSelectedScrollCartelaGroups() {
    if (!state.render || !state.structure) return [];
    const pages = getCurrentPhysicalPages();
    const groups = [];
    pages.forEach((page) => {
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

  function selectedMovieGroupCount() {
    return getMovieMode() === 'scroll'
      ? getSelectedScrollCartelaGroups().length
      : getSelectedMoviePageGroups().length;
  }

  function getSelectedScrollSourceFrames(fps) {
    return getSelectedScrollCartelaGroups().map((group) => {
      const duration = Math.max(0, Number(group.cartela && group.cartela.duration) || 0);
      return Math.max(1, Math.round(duration * fps) * Math.max(1, group.pages.length));
    });
  }

  function updateMovieDurationFields(options = {}) {
    if (!els.movieRangeDurationInput || !els.movieTargetDurationInput) return;
    const fps = getMovieFps();
    const frames = getMovieMode() === 'scroll' ? getSelectedScrollSourceFrames(fps) : getSelectedMovieGroupFrameCounts(fps);
    const segments = readMovieSegmentSettings(fps);
    const bodyTotalFrames = movieBodySourceTotal(frames, segments);
    const formatted = formatFrameDuration(bodyTotalFrames + segments.preFrames + segments.postFrames, fps);
    const bodyFormatted = formatFrameDuration(bodyTotalFrames, fps);
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
    const fps = getMovieFps();
    const targetFrames = parseFrameDuration(els.movieTargetDurationInput.value, fps);
    if (targetFrames === null) {
      window.alert(`Introduce la duración como mm:ss:ff. Para ${fps} fps, ff debe estar entre 00 y ${String(fps - 1).padStart(2, '0')}.`);
      updateMovieDurationFields({ resetTarget: true });
      return;
    }
    const segments = readMovieSegmentSettings(fps);
    const itemCount = Math.max(1, selectedMovieGroupCount() - segments.preCount - segments.postCount);
    const fittedTargetFrames = Math.max(itemCount, targetFrames);
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

  async function exportMovFramesIncrementally(native, filePath, fps, encodingProfile, writeFrames) {
    if (!native.startMovExport || !native.addMovFrame || !native.finishMovExport) {
      const pages = [];
      await writeFrames(async ({ bytes, frameCount }) => {
        pages.push({
          pageNumber: pages.length + 1,
          duration: 1 / fps,
          frameCount,
          bytes,
        });
      });
      return native.exportMovSequence({ filePath, fps, encodingProfile, pages });
    }

    const session = await native.startMovExport({ filePath, fps, encodingProfile });
    if (state.movExportProgress) {
      state.movExportProgress.setCancelHandler(() => native.cancelMovExport({ exportId: session.exportId }));
    }
    try {
      await writeFrames(async ({ bytes, frameCount }) => {
        await native.addMovFrame({
          exportId: session.exportId,
          bytes,
          frameCount,
        });
      });
      throwIfMovExportCancelled();
      if (state.movExportProgress) state.movExportProgress.setPhase('Codificando MOV...');
      return await native.finishMovExport({ exportId: session.exportId });
    } catch (error) {
      if (native.cancelMovExport) {
        try {
          await native.cancelMovExport({ exportId: session.exportId });
        } catch (_cancelError) {
          // Best effort cleanup; the original error is more useful to report.
        }
      }
      throw error;
    }
  }

  async function exportScrollMovSequence({ native, filePath, fps, layout, encodingProfile, renderOptions = {} }) {
    const groups = getSelectedScrollCartelaGroups();
    if (!groups.length) return;
    const sourceFrames = getSelectedScrollSourceFrames(fps);
    const segments = readMovieSegmentSettings(fps);
    const bodyFrames = getMovieBodyTargetFramesOrSource(
      sourceFrames,
      segments,
      movieTargetDurationFrames(fps),
      movieUsesCustomTargetDuration()
    );
    const plan = buildScrollPlan(groups, layout, bodyFrames, segments);
    const bodyPhase = plan.phases.find((phase) => phase.name === 'body');
    const videoStartFrame = bodyPhase ? bodyPhase.startFrame : segments.preFrames;
    updateMovExportProgress(0, plan.totalFrames);
    await exportMovFramesIncrementally(native, filePath, fps, encodingProfile, async (writeFrame) => {
      for (let frame = 0; frame < plan.totalFrames; frame += 1) {
        throwIfMovExportCancelled();
        const blob = await renderScrollFrameToPngBlob(plan, frame, layout, {
          ...renderOptions,
          videoTime: frame >= videoStartFrame ? (frame - videoStartFrame) / fps : null,
        });
        await writeFrame({
          frameCount: 1,
          bytes: await blobToBytes(blob),
        });
        updateMovExportProgress(frame + 1, plan.totalFrames);
        if (frame % 25 === 0) {
          await wait(0);
        }
      }
      updateMovExportProgress(plan.totalFrames, plan.totalFrames);
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

  async function drawCanvasScrollFrame(ctx, plan, frame, layout) {
    const offset = scrollOffsetForFrame(plan, frame);
    for (const item of plan.items) {
      const y = Math.round(item.stackTop - offset);
      const clip = scrollClipRect(item.layout);
      if (!scrollItemIntersectsClip(item, y, clip)) continue;
      const itemClip = item.fullAreaCartela ? scrollFullAreaItemClip(item, y, clip) : clip;
      if (itemClip.height <= 0) continue;
      ctx.save();
      ctx.beginPath();
      ctx.rect(itemClip.x, itemClip.y, itemClip.width, itemClip.height);
      ctx.clip();
      await drawCanvasScrollItem(ctx, item, y);
      ctx.restore();
    }
    drawCanvasScrollFade(ctx, layout);
  }

  function drawCanvasScrollFade(ctx, layout) {
    const clip = scrollClipRect(layout);
    const fadeUp = Math.min(clip.height, Math.max(0, Number(layout.scroll_fade_up) || 0));
    const fadeDown = Math.min(clip.height, Math.max(0, Number(layout.scroll_fade_down) || 0));
    if (!fadeUp && !fadeDown) return;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    if (fadeUp) {
      const gradient = ctx.createLinearGradient(0, clip.y, 0, clip.y + fadeUp);
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(clip.x, clip.y, clip.width, fadeUp);
    }
    if (fadeDown) {
      const gradient = ctx.createLinearGradient(0, clip.y + clip.height - fadeDown, 0, clip.y + clip.height);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(clip.x, clip.y + clip.height - fadeDown, clip.width, fadeDown);
    }
    ctx.restore();
  }

  async function drawCanvasScrollItem(ctx, item, y) {
    const layout = item.layout;
    const cartela = item.cartela;
    const x = Math.max(0, Number(layout.page_left_margin) || 0);
    const width = Math.max(0, layout.page_width - x - (Number(layout.page_right_margin) || 0));
    await drawCanvasScrollCartelaImages(ctx, item, y);
    let cursorY = y;
    if (item.title && item.titleMetrics) {
      drawCanvasText(ctx, item.title, x, cursorY, width, item.titleMetrics, 'center');
      cursorY += canvasTextHeight(item.title, item.titleMetrics, width) + (item.blocks.length ? item.blockGap : 0);
    }
    item.blocks.forEach((block, index) => {
      drawCanvasBlock(ctx, block, cartela, layout, x, cursorY, width);
      cursorY += item.blockHeights[index] + item.blockGap;
    });
  }

  async function drawCanvasScrollCartelaImages(ctx, item, itemY) {
    const area = contentAreaRect(item.layout);
    for (const image of cartelaImages(item.cartela)) {
      const bitmap = await loadCanvasImage(image.data_url);
      const scale = Math.max(0.01, Number(image.scale) || 1);
      const width = bitmap.naturalWidth * scale;
      const height = bitmap.naturalHeight * scale;
      const centerX = area.x + (area.width / 2) + (Number(image.offset_x) || 0);
      const centerY = item.fullAreaCartela
        ? itemY + (Math.max(1, Number(item.height) || 1) / 2) + (Number(image.offset_y) || 0)
        : itemY + ((area.y + (area.height / 2) + (Number(image.offset_y) || 0)) - item.normalTop);
      ctx.drawImage(bitmap, centerX - (width / 2), centerY - (height / 2), width, height);
    }
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
    state.previewAnimation.frame = frameForPdfPageIndex(plan, state.pdfPageIndex);
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
    state.structure.page_line_adjustments.__physical = state.structure.page_line_adjustments.__physical || {};
    const current = Number(state.structure.page_line_adjustments.__physical[page.id]) || 0;
    const defaultLines = Number(getProductionSettings().default_auto_page_lines) || 1;
    const next = Math.max(1 - defaultLines, current + delta);
    if (next === 0) {
      delete state.structure.page_line_adjustments.__physical[page.id];
    } else {
      state.structure.page_line_adjustments.__physical[page.id] = next;
    }
    state.render = buildRenderJson(state.source, state.materials, state.structure);
    renderPreview();
    renderPdfPreview();
  }

  function getPdfLineStatus(page) {
    const defaultLines = Number(getProductionSettings().default_auto_page_lines) || 1;
    const adjustment = Number(
      state.structure &&
      state.structure.page_line_adjustments &&
      state.structure.page_line_adjustments.__physical &&
      state.structure.page_line_adjustments.__physical[page.id]
    ) || 0;
    return `${defaultLines}/${Math.max(1, defaultLines + adjustment)}`;
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
    const pageWidth = Math.max(1, Number(layout.page_width) || 1);
    const pageHeight = Math.max(1, Number(layout.page_height) || 1);
    return Math.max(0.03, Math.min(2, availableWidth / pageWidth, availableHeight / pageHeight));
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
    updateCartela(fields);
    state.selectedCartelaId = previousSelected;
    state.render = buildRenderJson(state.source, state.materials, state.structure);
    renderCartelaList();
    renderEditor();
    renderPreview();
    renderPdfPreview();
  }

  function pdfPageVerticalJustify(page) {
    const align = page.blocks && page.blocks[0] ? page.blocks[0].vertical_align : 'top';
    if (align === 'center') return 'center';
    if (align === 'bottom') return 'flex-end';
    return 'flex-start';
  }

  function makePdfPageTitle(page, options = {}) {
    const title = page && page.cartela_physical_index === 0 ? page.title : '';
    const text = String(title || '').trim();
    if (!text) return null;
    const titleEl = document.createElement('div');
    titleEl.className = 'pdf-page-title';
    titleEl.textContent = transformCartelaText(text, page.cartela, options.settings || getProductionSettings());
    applyTypography(titleEl, 'page_header', {
      multiplier: page.cartela.font_size_multiplier,
      lineMultiplier: page.cartela.line_spacing_multiplier,
      typography: page.cartela.title_typography,
      settings: options.settings,
    });
    return titleEl;
  }

  async function exportPngPages(mode) {
    if (!state.render || !state.structure) return;
    const layout = getRenderLayout();
    const pages = getCurrentPhysicalPages();
    if (!pages.length) return;
    const selectedPages = mode === 'current'
      ? [{ page: pages[state.pdfPageIndex], pageNumber: state.pdfPageIndex + 1 }]
      : getExportPageRange(pages).map((page, index) => ({
        page,
        pageNumber: index + 1,
      }));
    const settings = getProductionSettings();
    const baseName = safeFilePart(settings.pdf_base_name || 'creditos');
    const renderOptions = getExportRenderOptions();
    const native = nativeBridge();
    try {
      if (native && mode === 'all' && native.exportPngSequence) {
        const exportedPages = [];
        for (const item of selectedPages.filter((candidate) => candidate.page)) {
          const fileName = `${baseName}_${String(item.pageNumber).padStart(3, '0')}.png`;
          const blob = await renderPageToPngBlob(item.page, layout, {
            ...renderOptions,
            videoTime: videoTimeForPage(item.page),
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
            videoTime: videoTimeForPage(item.page),
          });
          await writeBlobToDirectory(directory, fileName, blob);
        }
        return;
      }

      for (const item of selectedPages.filter((candidate) => candidate.page)) {
        const fileName = `${baseName}_${String(item.pageNumber).padStart(3, '0')}.png`;
        const blob = await renderPageToPngBlob(item.page, layout, {
          ...renderOptions,
          videoTime: videoTimeForPage(item.page),
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
          renderOptions: getExportRenderOptions(),
        });
        return;
      }

      const exportFrameCounts = getMovieExportFrameCounts(
        selectedPages,
        getSelectedMoviePageGroups(),
        getSelectedMovieGroupFrameCounts(fps),
        readMovieSegmentSettings(fps),
        movieTargetDurationFrames(fps),
        movieUsesCustomTargetDuration(),
        fps
      );
      const totalExportFrames = exportFrameCounts.reduce((sum, value) => sum + Math.max(1, Number(value) || 1), 0);
      const renderOptions = getExportRenderOptions();
      const segments = readMovieSegmentSettings(fps);
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
            for (let frame = 0; frame < frameCount; frame += 1) {
              throwIfMovExportCancelled();
              const blob = await renderPageToPngBlob(item.page, layout, {
                ...renderOptions,
                videoTime: startFrame + frame >= segments.preFrames ? (startFrame + frame - segments.preFrames) / fps : null,
              });
              await writeFrame({
                frameCount: 1,
                bytes: await blobToBytes(blob),
              });
              renderedFrames += 1;
              updateMovExportProgress(renderedFrames, totalExportFrames);
              if (frame % 25 === 0) {
                await wait(0);
              }
            }
          } else {
            const blob = await renderPageToPngBlob(item.page, layout, renderOptions);
            const bytes = await blobToBytes(blob);
            let remaining = frameCount;
            while (remaining > 0) {
              throwIfMovExportCancelled();
              const chunk = Math.min(25, remaining);
              await writeFrame({ frameCount: chunk, bytes });
              remaining -= chunk;
              renderedFrames += chunk;
              updateMovExportProgress(renderedFrames, totalExportFrames);
              await wait(0);
            }
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

  function getExportRangeStart(pages) {
    const total = pages ? pages.length : 0;
    return Math.max(1, Math.min(total, Number(els.exportFromPageInput.value) || 1));
  }

  function getExportRangeEnd(pages) {
    const total = pages ? pages.length : 0;
    const start = getExportRangeStart(pages);
    return Math.max(start, Math.min(total, Number(els.exportToPageInput.value) || total));
  }

  function getExportPageRange(pages) {
    const start = getExportRangeStart(pages);
    const end = getExportRangeEnd(pages);
    els.exportFromPageInput.value = String(start);
    els.exportToPageInput.value = String(end);
    return pages.slice(start - 1, end);
  }

  function getExportRenderOptions() {
    const includeVideo = !!(state.exportIncludeVideo && state.referenceVideo && state.referenceVideo.file_path);
    return {
      includeBackground: !!(state.exportIncludeBackground || includeVideo),
      includeVideo,
      includeMargins: !!state.exportIncludeMargins,
    };
  }

  function videoTimeForPage(page) {
    const plan = getPreviewAnimationPlan();
    if (!plan || !page) return null;
    const pageIndex = pageIndexById(page.id);
    const frame = frameForPdfPageIndex(plan, pageIndex);
    const videoStartFrame = Math.max(0, Number(plan.videoStartFrame) || 0);
    if (frame < videoStartFrame) return null;
    return (frame - videoStartFrame) / Math.max(1, Number(plan.fps) || 25);
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
    const video = await referenceVideoForCanvas();
    const duration = Number(video.duration);
    if (Number.isFinite(duration) && duration > 0 && time >= duration) return;
    await seekVideoForCanvas(video, time);
    const sourceWidth = video.videoWidth || layout.page_width;
    const sourceHeight = video.videoHeight || layout.page_height;
    const targetRatio = layout.page_width / layout.page_height;
    const sourceRatio = sourceWidth / sourceHeight;
    let sx = 0;
    let sy = 0;
    let sw = sourceWidth;
    let sh = sourceHeight;
    if (sourceRatio > targetRatio) {
      sw = sourceHeight * targetRatio;
      sx = (sourceWidth - sw) / 2;
    } else if (sourceRatio < targetRatio) {
      sh = sourceWidth / targetRatio;
      sy = (sourceHeight - sh) / 2;
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, layout.page_width, layout.page_height);
  }

  function referenceVideoForCanvas() {
    const video = normalizeReferenceVideo(state.referenceVideo);
    if (!video || !video.file_path) return Promise.reject(new Error('No hay vídeo de referencia asociado.'));
    const src = `/api/reference-video?path=${encodeURIComponent(video.file_path)}`;
    if (!state.referenceVideoCanvasElement || state.referenceVideoCanvasSrc !== src) {
      state.referenceVideoCanvasElement = document.createElement('video');
      state.referenceVideoCanvasElement.muted = true;
      state.referenceVideoCanvasElement.playsInline = true;
      state.referenceVideoCanvasElement.preload = 'auto';
      state.referenceVideoCanvasElement.src = src;
      state.referenceVideoCanvasSrc = src;
    }
    const videoEl = state.referenceVideoCanvasElement;
    if (videoEl.readyState >= 1) {
      const duration = Number(videoEl.duration);
      if (Number.isFinite(duration) && duration > 0) {
        state.referenceVideoDuration = duration;
        updateReferenceVideoDurationField();
      }
      return Promise.resolve(videoEl);
    }
    return new Promise((resolve, reject) => {
      videoEl.addEventListener('loadedmetadata', () => {
        const duration = Number(videoEl.duration);
        if (Number.isFinite(duration) && duration > 0) {
          state.referenceVideoDuration = duration;
          updateReferenceVideoDurationField();
        }
        resolve(videoEl);
      }, { once: true });
      videoEl.addEventListener('error', () => reject(new Error('No se pudo cargar el vídeo de referencia.')), { once: true });
      videoEl.load();
    });
  }

  function seekVideoForCanvas(video, time) {
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    if (duration && time >= duration) return Promise.resolve();
    const target = duration ? Math.min(time, Math.max(0, duration - 0.001)) : time;
    if (Math.abs((Number(video.currentTime) || 0) - target) < 0.025 && video.readyState >= 2) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);
      };
      const onSeeked = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error('No se pudo leer el frame del vídeo de referencia.'));
      };
      video.addEventListener('seeked', onSeeked, { once: true });
      video.addEventListener('error', onError, { once: true });
      video.currentTime = target;
    });
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
    const effectiveLayout = layoutForCartela(layout, page && page.cartela);
    const blockGap = cartelaBlockGap(page.cartela, effectiveLayout);
    const x = Math.max(0, Number(effectiveLayout.page_left_margin) || 0);
    const y = effectiveLayout.page_top_margin;
    const width = Math.max(0, effectiveLayout.page_width - x - (Number(effectiveLayout.page_right_margin) || 0));
    const height = effectiveLayout.page_height - effectiveLayout.page_top_margin - effectiveLayout.page_bottom_margin;
    const blocks = page.blocks.filter((block) => !block.missing_source);
    const heights = blocks.map((block) => measureCanvasBlock(ctx, block, page.cartela, effectiveLayout, width));
    const titleText = page && page.cartela_physical_index === 0 ? String(page.title || '').trim() : '';
    const titleMetrics = titleText ? canvasTextMetrics('page_header', page.cartela, effectiveLayout, page.cartela.title_typography) : null;
    const titleHeight = titleMetrics ? canvasTextHeight(titleText, titleMetrics, width) : 0;
    const totalBlocksHeight = heights.reduce((total, value) => total + value, 0);
    const gaps = Math.max(0, blocks.length - 1) * blockGap;
    const totalHeight = titleHeight + (titleHeight && blocks.length ? blockGap : 0) + totalBlocksHeight + gaps;
    let cursorY = y + verticalOffset(height, totalHeight, pdfPageVerticalJustify(page)) + (Number(page.cartela.vertical_offset) || 0);

    await drawCanvasCartelaImages(ctx, page.cartela, effectiveLayout);

    if (titleText && titleMetrics) {
      drawCanvasText(ctx, titleText, x, cursorY, width, titleMetrics, 'center');
      cursorY += canvasTextHeight(titleText, titleMetrics, width) + (blocks.length ? blockGap : 0);
    }

    blocks.forEach((block, index) => {
      drawCanvasBlock(ctx, block, page.cartela, effectiveLayout, x, cursorY, width);
      cursorY += heights[index] + blockGap;
    });
  }

  async function drawCanvasCartelaImages(ctx, cartela, layout) {
    const area = contentAreaRect(layout);
    for (const image of cartelaImages(cartela)) {
      const bitmap = await loadCanvasImage(image.data_url);
      const scale = Math.max(0.01, Number(image.scale) || 1);
      const width = bitmap.naturalWidth * scale;
      const height = bitmap.naturalHeight * scale;
      const centerX = area.x + (area.width / 2) + (Number(image.offset_x) || 0);
      const centerY = area.y + (area.height / 2) + (Number(image.offset_y) || 0);
      ctx.drawImage(bitmap, centerX - (width / 2), centerY - (height / 2), width, height);
    }
  }

  function loadCanvasImage(src) {
    if (canvasImageCache.has(src)) return canvasImageCache.get(src);
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => {
        canvasImageCache.delete(src);
        reject(new Error('No se pudo cargar la imagen asociada.'));
      };
      image.src = src;
    });
    canvasImageCache.set(src, promise);
    return promise;
  }

  function verticalOffset(availableHeight, contentHeight, justify) {
    if (justify === 'center') return Math.max(0, (availableHeight - contentHeight) / 2);
    if (justify === 'flex-end') return Math.max(0, availableHeight - contentHeight);
    return 0;
  }

  function measureCanvasBlock(ctx, block, cartela, layout, width) {
    let height = 0;
    const title = String(block.title || '').trim();
    const units = block.pages && block.pages[0] ? block.pages[0].items || [] : [];
    if (title) {
      const titleMetrics = canvasTextMetrics('block_title', cartela, layout, block.typography);
      height += canvasTextHeight(title, titleMetrics, width);
      if (units.length) height += cartelaBlockTitleGap(cartela, layout);
    }
    const columns = Math.max(1, Number(block.columns) || 1);
    const columnWidth = (width - layout.column_gap * (columns - 1)) / columns;
    const rowHeights = [];
    let previousCreditSourceId = null;
    units.forEach((unit, index) => {
      const row = Math.floor(index / columns);
      const options = unitRenderOptions(unit, previousCreditSourceId, cartela, index > 0, units[index - 1]);
      const unitHeight = measureCanvasUnit(unit, block, cartela, layout, columnWidth, options);
      rowHeights[row] = Math.max(rowHeights[row] || 0, unitHeight);
      previousCreditSourceId = creditSourceId(unit);
    });
    height += rowHeights.reduce((total, value) => total + value, 0);
    height += canvasRowGaps(units, cartela, layout, columns).reduce((total, value) => total + value, 0);
    return height;
  }

  function drawCanvasBlock(ctx, block, cartela, layout, x, y, width) {
    let cursorY = y;
    const title = String(block.title || '').trim();
    const units = block.pages && block.pages[0] ? block.pages[0].items || [] : [];
    if (title) {
      const metrics = canvasTextMetrics('block_title', cartela, layout, block.typography);
      drawCanvasText(ctx, title, x, cursorY, width, metrics, 'center');
      cursorY += canvasTextHeight(title, metrics, width) + (units.length ? cartelaBlockTitleGap(cartela, layout) : 0);
    }
    const columns = Math.max(1, Number(block.columns) || 1);
    const columnWidth = (width - layout.column_gap * (columns - 1)) / columns;
    const rowHeights = [];
    const rowGaps = canvasRowGaps(units, cartela, layout, columns);
    units.forEach((unit, index) => {
      const row = Math.floor(index / columns);
      const previousSourceId = index > 0 ? creditSourceId(units[index - 1]) : null;
      const options = unitRenderOptions(unit, previousSourceId, cartela, index > 0, units[index - 1]);
      rowHeights[row] = Math.max(rowHeights[row] || 0, measureCanvasUnit(unit, block, cartela, layout, columnWidth, options));
    });
    let previousCreditSourceId = null;
    units.forEach((unit, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      const unitX = x + col * (columnWidth + layout.column_gap);
      const unitY = cursorY +
        rowHeights.slice(0, row).reduce((total, value) => total + value, 0) +
        rowGaps.slice(0, row).reduce((total, value) => total + value, 0);
      const options = unitRenderOptions(unit, previousCreditSourceId, cartela, index > 0, units[index - 1]);
      drawCanvasUnit(ctx, unit, block, cartela, layout, unitX, unitY, columnWidth, options);
      previousCreditSourceId = creditSourceId(unit);
    });
  }

  function canvasRowGaps(units, cartela, layout, columns) {
    const items = units || [];
    const rowCount = Math.ceil(items.length / Math.max(1, columns));
    const gaps = Array.from({ length: Math.max(0, rowCount - 1) }, () => 0);

    for (let row = 1; row < rowCount; row += 1) {
      const firstIndex = row * columns;
      const unit = items[firstIndex];
      const previousUnit = items[firstIndex - 1];
      const options = unitRenderOptions(unit, creditSourceId(previousUnit), cartela, firstIndex > 0, previousUnit);
      gaps[row - 1] = unitGapBefore(options, layout);
    }
    return gaps;
  }

  function cartelaBlockGap(cartela, layout) {
    return Math.max(0, Number(layout.block_gap) || 0);
  }

  function cartelaBlockTitleGap(cartela, layout) {
    return Math.max(0, Number(layout.block_title_gap) || 0);
  }

  function roleNameGapForOrientation(layout, orientation) {
    return orientation === 'vertical' ? Math.max(0, Number(layout.role_name_gap) || 0) : 0;
  }

  function measureCanvasUnit(unit, block, cartela, layout, width, options = {}) {
    if (block.type === 'music_licenses' && unit.lines) {
      return (unit.lines || []).reduce((total, line, index) => {
        const metrics = canvasTextMetrics(index === 0 ? 'role' : 'name', cartela, layout, block.typography);
        return total + canvasTextHeight(line.value, metrics, width);
      }, 0);
    }
    if (options.repeatedNameRow) {
      const metrics = canvasTextMetrics('name', cartela, layout, block.typography);
      return canvasTextHeight(unit.name, metrics, width);
    }
    if (unit.kind === 'credit' || unit.kind === 'crew_credit' || unit.kind === 'cast') {
      const orientation = cartela.orientation || 'horizontal';
      const role = unit.kind === 'cast' ? unit.actor : unit.role;
      const name = unit.kind === 'cast' ? unit.character : unit.name;
      const textWidth = orientation === 'horizontal'
        ? Math.max(1, (width - layout.role_name_gap) / 2)
        : width;
      const roleHeight = String(role || '').length
        ? canvasTextHeight(role, canvasTextMetrics('role', cartela, layout, block.typography), textWidth)
        : 0;
      const nameHeight = String(name || '').length
        ? canvasTextHeight(name, canvasTextMetrics('name', cartela, layout, block.typography), textWidth)
        : 0;
      return orientation === 'vertical'
        ? roleHeight + (roleHeight && nameHeight ? roleNameGapForOrientation(layout, orientation) : 0) + nameHeight
        : Math.max(roleHeight, nameHeight, canvasTextMetrics('name', cartela, layout, block.typography).lineHeight);
    }
    const metrics = canvasTextMetrics(unit.title !== undefined ? 'block_title' : 'name', cartela, layout, block.typography);
    if (unit.text_already_transformed) metrics.textCapitalization = 'source';
    return canvasTextHeight(unit.title !== undefined ? unit.title : unit.value, metrics, width);
  }

  function drawCanvasUnit(ctx, unit, block, cartela, layout, x, y, width, options = {}) {
    const orientation = cartela.orientation || 'horizontal';
    const alignment = block.alignment || {};
    if (block.type === 'music_licenses' && unit.lines) {
      let cursorY = y;
      (unit.lines || []).forEach((line, index) => {
        const metrics = canvasTextMetrics(index === 0 ? 'role' : 'name', cartela, layout, block.typography);
        drawCanvasText(ctx, line.value || '', x, cursorY, width, metrics, alignment.text || 'center');
        cursorY += canvasTextHeight(line.value, metrics, width);
      });
      return;
    }
    if (unit.kind === 'credit' || unit.kind === 'crew_credit') {
      drawCanvasPair(ctx, options.hideRole ? '' : unit.role || '', unit.name || '', cartela, layout, x, y, width, alignment, orientation, block.typography);
      return;
    }
    if (unit.kind === 'cast') {
      drawCanvasPair(ctx, unit.actor || '', unit.character || '', cartela, layout, x, y, width, alignment, orientation, block.typography);
      return;
    }
    const metrics = canvasTextMetrics(unit.title !== undefined ? 'block_title' : 'name', cartela, layout, block.typography);
    if (unit.text_already_transformed) metrics.textCapitalization = 'source';
    drawCanvasText(ctx, unit.title || unit.value || '', x, y, width, metrics, alignment.text || (orientation === 'vertical' ? 'center' : 'left'));
  }

  function drawCanvasPair(ctx, role, name, cartela, layout, x, y, width, alignment, orientation, typography) {
    const roleMetrics = canvasTextMetrics('role', cartela, layout, typography);
    const nameMetrics = canvasTextMetrics('name', cartela, layout, typography);
    if (orientation === 'vertical') {
      if (!role) {
        drawCanvasText(ctx, name, x, y, width, nameMetrics, alignment.name || 'center');
        return;
      }
      drawCanvasText(ctx, role, x, y, width, roleMetrics, alignment.role || 'center');
      drawCanvasText(ctx, name, x, y + canvasTextHeight(role, roleMetrics, width) + roleNameGapForOrientation(layout, orientation), width, nameMetrics, alignment.name || 'center');
      return;
    }
    const halfWidth = (width - layout.role_name_gap) / 2;
    drawCanvasText(ctx, role, x, y, halfWidth, roleMetrics, alignment.role || 'right');
    drawCanvasText(ctx, name, x + halfWidth + layout.role_name_gap, y, halfWidth, nameMetrics, alignment.name || 'left');
  }

  function canvasTextMetrics(styleKey, cartela, layout, typographyOverrides = {}) {
    const settings = getProductionSettings();
    const typography = {
      ...settings.typography[styleKey],
      ...((typographyOverrides && typographyOverrides[styleKey]) || {}),
    };
    const fontSize = Math.max(1, Number(typography.font_size) || 1) * (Number(cartela.font_size_multiplier) || 1);
    return {
      color: typography.color,
      font: `${fontStyleFromStyle(typography.font_style)} ${fontWeightFromStyle(typography.font_style)} ${fontSize}px ${quoteFontFamily(typography.font_family)}`,
      fontSize,
      lineHeight: fontSize * Math.max(0.1, Number(layout.line_spacing) || settings.layout.line_spacing) * (Number(cartela.line_spacing_multiplier) || 1),
      textCapitalization: normalizeTextCapitalization(cartela && cartela.text_capitalization !== undefined ? cartela.text_capitalization : settings.text_capitalization),
      language: normalizeLanguage(settings.language),
      protectedCapitalizations: settings.protected_capitalizations,
      useProtectedCapitalization: cartela && cartela.use_protected_capitalization !== undefined
        ? normalizeBoolean(cartela.use_protected_capitalization, true)
        : settings.use_protected_capitalization,
      autoWrap: normalizeBoolean(cartela && cartela.auto_text_wrap, false),
    };
  }

  function canvasTextHeight(text, metrics, width = Infinity) {
    return canvasWrappedTextLines(text, metrics, width).length * metrics.lineHeight;
  }

  function canvasWrappedTextLines(text, metrics, width = Infinity) {
    const transformed = applyTextCapitalization(
      text,
      metrics.textCapitalization,
      metrics.language,
      metrics.protectedCapitalizations,
      metrics.useProtectedCapitalization
    );
    const sourceLines = explicitTextLines(transformed);
    if (!metrics.autoWrap || !Number.isFinite(width) || width <= 0) return sourceLines;
    const cacheKey = [metrics.font, metrics.textCapitalization, metrics.language, Math.round(width * 100) / 100, transformed].join('\u0001');
    const cached = canvasWrapCache.get(cacheKey);
    if (cached) return cached;
    if (!canvasMeasureContext) canvasMeasureContext = document.createElement('canvas').getContext('2d');
    canvasMeasureContext.font = metrics.font;
    const output = [];
    const fits = (value) => canvasMeasureContext.measureText(value).width <= width;
    const pushLongWord = (word) => {
      let line = '';
      for (const character of word) {
        if (line && !fits(line + character)) {
          output.push(line);
          line = character;
        } else {
          line += character;
        }
      }
      return line;
    };
    sourceLines.forEach((sourceLine) => {
      if (!sourceLine || fits(sourceLine)) {
        output.push(sourceLine);
        return;
      }
      let current = '';
      sourceLine.trim().split(/\s+/).forEach((word) => {
        const candidate = current ? `${current} ${word}` : word;
        if (fits(candidate)) {
          current = candidate;
        } else {
          if (current) output.push(current);
          current = fits(word) ? word : pushLongWord(word);
        }
      });
      output.push(current);
    });
    const lines = output.length ? output : [''];
    if (canvasWrapCache.size >= 5000) canvasWrapCache.clear();
    canvasWrapCache.set(cacheKey, lines);
    return lines;
  }

  function drawCanvasText(ctx, text, x, y, width, metrics, align) {
    ctx.save();
    const verticalBleed = Math.ceil(Math.max(1, Number(metrics.fontSize) || 1) * TEXT_VERTICAL_BLEED_RATIO);
    const lines = canvasWrappedTextLines(text, metrics, width);
    const textHeight = Math.max(metrics.lineHeight, lines.length * metrics.lineHeight);
    ctx.beginPath();
    ctx.rect(x, y - verticalBleed, width, textHeight + (verticalBleed * 2));
    ctx.clip();
    ctx.font = metrics.font;
    ctx.fillStyle = metrics.color;
    ctx.textBaseline = 'top';
    ctx.textAlign = align;
    const textX = align === 'center' ? x + width / 2 : align === 'right' ? x + width : x;
    lines.forEach((line, index) => ctx.fillText(line, textX, y + index * metrics.lineHeight));
    ctx.restore();
  }

  function downloadBlob(blob, fileName) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  async function saveBlobAs(blob, fileName) {
    const native = nativeBridge();
    if (native && native.savePng) {
      await native.savePng({ fileName, bytes: await blobToBytes(blob) });
      return;
    }

    if (!window.showSaveFilePicker) {
      downloadBlob(blob, fileName);
      return;
    }
    const handle = await window.showSaveFilePicker({
      suggestedName: fileName,
      types: [
        {
          description: 'PNG',
          accept: { 'image/png': ['.png'] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  }

  async function blobToBytes(blob) {
    return await blob.arrayBuffer();
  }

  async function writeBlobToDirectory(directory, fileName, blob) {
    const handle = await directory.getFileHandle(fileName, { create: true });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function renderPdfBlock(block, cartela, layout, options = {}) {
    const blockEl = document.createElement('div');
    blockEl.className = 'pdf-block';
    if (block.missing_source) {
      blockEl.textContent = `Fuente no encontrada: ${block.missing_source}`;
      return blockEl;
    }

    const blockTitle = makePdfOptionalTitle(block.title, 'pdf-block-title', 'block_title', cartela, block.typography, options);
    const units = block.pages && block.pages[0] ? block.pages[0].items || [] : [];
    if (blockTitle) {
      if (units.length) blockTitle.style.marginBottom = `${cartelaBlockTitleGap(cartela, layout)}px`;
      blockEl.appendChild(blockTitle);
    }

    const contentEl = document.createElement('div');
    contentEl.className = 'pdf-block-content';
    contentEl.style.gridTemplateColumns = `repeat(${Math.max(1, Number(block.columns) || 1)}, minmax(0, 1fr))`;
    contentEl.style.columnGap = `${layout.column_gap}px`;
    contentEl.style.rowGap = '0';

    let previousCreditSourceId = null;
    units.forEach((unit, index) => {
      const unitOptions = {
        ...options,
        ...unitRenderOptions(unit, previousCreditSourceId, cartela, index > 0, units[index - 1]),
      };
      const gapBefore = unitGapBefore(unitOptions, layout);
      if (block.type === 'music_licenses' && unit.lines) {
        unitOptions.gapBefore = gapBefore;
        contentEl.appendChild(renderPdfTheme(unit, block, cartela, layout, unitOptions));
      } else {
        unitOptions.gapBefore = gapBefore;
        contentEl.appendChild(renderPdfUnit(unit, block, cartela, layout, unitOptions));
        previousCreditSourceId = creditSourceId(unit);
      }
    });

    blockEl.appendChild(contentEl);
    return blockEl;
  }

  function makePdfOptionalTitle(value, className, styleKey, cartela, typography, options = {}) {
    const text = String(value || '').trim();
    if (!text) return null;
    const title = document.createElement('div');
    title.className = className;
    title.textContent = transformCartelaText(text, cartela, options.settings || getProductionSettings());
    applyTextWrapStyle(title, cartela);
    applyTypography(title, styleKey, {
      multiplier: cartela.font_size_multiplier,
      lineMultiplier: cartela.line_spacing_multiplier,
      typography,
      settings: options.settings,
    });
    return title;
  }

  function renderPdfTheme(theme, block, cartela, layout, options = {}) {
    const themeEl = document.createElement('div');
    themeEl.className = 'pdf-theme';
    if (options.gapBefore) themeEl.style.marginTop = `${options.gapBefore}px`;
    (theme.lines || []).forEach((line, index) => {
      const lineEl = document.createElement('div');
      lineEl.className = index === 0 ? 'pdf-theme-title' : 'pdf-line';
      lineEl.textContent = transformCartelaText(line.value || '', cartela, options.settings || getProductionSettings());
      applyTextWrapStyle(lineEl, cartela);
      lineEl.style.textAlign = block.alignment && block.alignment.text ? block.alignment.text : 'center';
      applyTypography(lineEl, index === 0 ? 'role' : 'name', {
        multiplier: cartela.font_size_multiplier,
        lineMultiplier: cartela.line_spacing_multiplier,
        typography: block.typography,
        settings: options.settings,
      });
      themeEl.appendChild(lineEl);
    });
    return themeEl;
  }

  function renderPdfUnit(unit, block, cartela, layout, options = {}) {
    const orientation = cartela.orientation || 'horizontal';
    const alignment = block.alignment || {};
    const unitEl = document.createElement('div');
    unitEl.className = `pdf-unit ${orientation}`;
    if (options.gapBefore) unitEl.style.marginTop = `${options.gapBefore}px`;
    if (orientation === 'horizontal') {
      unitEl.style.gap = `${layout.role_name_gap}px`;
    } else {
      unitEl.style.gap = `${roleNameGapForOrientation(layout, orientation)}px`;
    }

    if (unit.kind === 'credit' || unit.kind === 'crew_credit') {
      if (!options.repeatedNameRow) {
        unitEl.appendChild(makePdfText(options.hideRole ? '' : unit.role || '', 'role', {
          className: 'pdf-role',
          cartela,
          typography: block.typography,
          textAlign: alignment.role || (orientation === 'vertical' ? 'center' : 'right'),
          settings: options.settings,
        }));
      }
      unitEl.appendChild(makePdfText(unit.name || '', 'name', {
        className: 'pdf-name',
        cartela,
        typography: block.typography,
        textAlign: alignment.name || (orientation === 'vertical' ? 'center' : 'left'),
        settings: options.settings,
      }));
      return unitEl;
    }

    if (unit.kind === 'cast') {
      unitEl.appendChild(makePdfText(unit.actor || '', 'role', {
        className: 'pdf-role',
        cartela,
        typography: block.typography,
        textAlign: alignment.role || (orientation === 'vertical' ? 'center' : 'right'),
        settings: options.settings,
      }));
      unitEl.appendChild(makePdfText(unit.character || '', 'name', {
        className: 'pdf-name',
        cartela,
        typography: block.typography,
        textAlign: alignment.name || (orientation === 'vertical' ? 'center' : 'left'),
        settings: options.settings,
      }));
      return unitEl;
    }

    return makePdfText(unit.title || unit.value || '', unit.title !== undefined ? 'block_title' : 'name', {
      className: 'pdf-line',
      cartela,
      typography: block.typography,
      textAlign: alignment.text || (orientation === 'vertical' ? 'center' : 'left'),
      settings: options.settings,
      textAlreadyTransformed: !!unit.text_already_transformed,
    });
  }

  function makePdfText(text, styleKey, options) {
    const el = document.createElement('div');
    el.className = options.className;
    el.textContent = options.textAlreadyTransformed ? String(text || '') : transformCartelaText(text, options.cartela, options.settings || getProductionSettings());
    applyTextWrapStyle(el, options.cartela);
    if (options.textAlreadyTransformed) {
      el.style.whiteSpace = 'pre';
      el.style.overflowWrap = 'normal';
    }
    el.style.textAlign = options.textAlign;
    applyTypography(el, styleKey, {
      multiplier: options.cartela.font_size_multiplier,
      lineMultiplier: options.cartela.line_spacing_multiplier,
      typography: options.typography,
      settings: options.settings,
    });
    return el;
  }

  function applyTextWrapStyle(element, cartela) {
    const autoWrap = normalizeBoolean(cartela && cartela.auto_text_wrap, false);
    element.style.whiteSpace = autoWrap ? 'pre-wrap' : 'pre';
    element.style.overflowWrap = autoWrap ? 'break-word' : 'normal';
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

  function boolSelectValue(value) {
    return normalizeBoolean(value, true) ? 'true' : 'false';
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}());
