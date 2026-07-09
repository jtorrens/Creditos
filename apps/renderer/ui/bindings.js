(function (root) {
  function bindAppUi(options = {}) {
    const els = options.els;
    const state = options.state;
    const windowRef = options.windowRef || root;
    const actions = options.actions || {};

    els.openXlsxBtn.addEventListener('click', actions.openXlsxFile);
    if (els.openReferenceVideoBtn) els.openReferenceVideoBtn.addEventListener('click', actions.associateReferenceVideo);
    if (els.clearReferenceVideoBtn) els.clearReferenceVideoBtn.addEventListener('click', actions.clearReferenceVideo);
    if (els.newCartelaBtn) els.newCartelaBtn.addEventListener('click', actions.addEmptyCartela);
    if (els.copyEpisodeStylesBtn) els.copyEpisodeStylesBtn.addEventListener('click', actions.copyStylesFromEpisodeFlow);
    els.xlsxInput.addEventListener('change', actions.loadXlsxFile);
    els.productionSelect.addEventListener('change', actions.selectProductionFromUi);
    els.productionPageWidthInput.addEventListener('change', actions.updateProductionLayoutFromUi);
    els.productionPageHeightInput.addEventListener('change', actions.updateProductionLayoutFromUi);
    els.productionPreviewBackgroundInput.addEventListener('input', actions.updateProductionLayoutFromUi);
    if (els.productionImportModelSelect) els.productionImportModelSelect.addEventListener('change', actions.updateProductionImportModelFromUi);
    els.episodeSelect.addEventListener('change', actions.selectEpisodeFromUi);
    els.showCreateProductionBtn.addEventListener('click', actions.toggleCreateProductionBox);
    els.duplicateProductionBtn.addEventListener('click', actions.duplicateSelectedProduction);
    els.deleteProductionBtn.addEventListener('click', actions.deleteSelectedProduction);
    els.createProductionBtn.addEventListener('click', actions.createProductionFromUi);
    els.createStyleBtn.addEventListener('click', actions.createStyleFromUi);
    els.duplicateStyleBtn.addEventListener('click', actions.duplicateSelectedStyle);
    els.deleteStyleBtn.addEventListener('click', actions.deleteSelectedStyle);
    els.tabButtons.forEach((button) => {
      button.addEventListener('click', () => actions.setActiveTab(button.dataset.tab));
    });
    els.defaultDurationInput.addEventListener('change', () => {
      const fps = actions.currentMovieFps();
      const frames = actions.normalizeDurationInputElement(els.defaultDurationInput, fps);
      if (frames === null) {
        windowRef.alert(`Introduce la duración como mm:ss:ff. También puedes escribir solo números, por ejemplo 35 = ${actions.formatFrameDuration(35, fps)}.`);
        els.defaultDurationInput.value = actions.formatSecondsAsFrameDuration(actions.getProductionSettings().default_cartela_duration, fps);
        return;
      }
      actions.updateSettings({ default_cartela_duration: frames / fps });
    });
    els.defaultAutoLinesInput.addEventListener('change', () => actions.updateSettings({
      default_auto_page_lines: Math.max(1, Number(els.defaultAutoLinesInput.value) || 1),
    }));
    els.movieFpsInput.addEventListener('change', () => {
      actions.updateSettings({
        movie_fps: Math.max(1, Math.round(Number(els.movieFpsInput.value) || 25)),
      });
      actions.updateMovieDurationFields({ resetTarget: true });
    });
    if (els.structureTab) els.structureTab.addEventListener('click', () => actions.setPreview('structure'));
    if (els.renderTab) els.renderTab.addEventListener('click', () => actions.setPreview('render'));
    els.pdfFirstPageBtn.addEventListener('click', () => actions.goToPdfPage(0));
    els.pdfPrevPageBtn.addEventListener('click', () => actions.changePdfPage(-1));
    els.pdfNextPageBtn.addEventListener('click', () => actions.changePdfPage(1));
    els.pdfLastPageBtn.addEventListener('click', () => actions.goToPdfPage(Number.POSITIVE_INFINITY));
    els.pdfPageNumberInput.addEventListener('change', () => actions.goToPdfPage((Number(els.pdfPageNumberInput.value) || 1) - 1));
    els.pdfMinusLinesBtn.addEventListener('click', () => actions.adjustCurrentPdfPageLines(-1));
    els.pdfPlusLinesBtn.addEventListener('click', () => actions.adjustCurrentPdfPageLines(1));
    els.pdfBaseNameInput.addEventListener('input', actions.updatePdfBaseName);
    els.exportFromPageInput.addEventListener('change', () => {
      els.exportFromPageInput.dataset.manual = '1';
      els.exportToPageInput.dataset.manual = '1';
      actions.updateMovieDurationFields({ resetTarget: true });
      actions.savePreviewSettingsFromUi();
    });
    els.exportToPageInput.addEventListener('change', () => {
      els.exportFromPageInput.dataset.manual = '1';
      els.exportToPageInput.dataset.manual = '1';
      actions.updateMovieDurationFields({ resetTarget: true });
      actions.savePreviewSettingsFromUi();
    });
    if (els.movieModeSelect) els.movieModeSelect.addEventListener('change', () => {
      if (actions.getMovieMode() === 'scroll') {
        els.exportFromPageInput.dataset.manual = '0';
        els.exportToPageInput.dataset.manual = '0';
      }
      actions.updateMovieDurationFields();
      actions.renderPdfPreview();
      actions.savePreviewSettingsFromUi();
    });
    if (els.movieCodecSelect) els.movieCodecSelect.addEventListener('change', () => {
      actions.renderMovieEncodingProfiles(els.movieCodecSelect.value);
      actions.ensureBackgroundForEncodingProfile();
      actions.savePreviewSettingsFromUi();
    });
    if (els.movieEncodingProfileSelect) els.movieEncodingProfileSelect.addEventListener('change', () => {
      actions.ensureBackgroundForEncodingProfile();
      actions.savePreviewSettingsFromUi();
    });
    els.movieTargetDurationInput.addEventListener('focus', () => {
      els.movieTargetDurationInput.dataset.auto = '0';
    });
    els.movieTargetDurationInput.addEventListener('change', actions.validateMovieTargetDuration);
    [els.moviePrerollCountInput, els.moviePrerollDurationInput, els.moviePostrollCountInput, els.moviePostrollDurationInput]
      .filter(Boolean)
      .forEach((input) => input.addEventListener('change', actions.updateMovieSegmentInputs));
    els.pdfVerticalOffsetInput.addEventListener('change', () => actions.updateCurrentPdfCartela({ vertical_offset: Number(els.pdfVerticalOffsetInput.value) || 0 }));
    els.pngZoomOutBtn.addEventListener('click', () => actions.updatePngPreviewZoom(-0.1));
    els.pngZoomInBtn.addEventListener('click', () => actions.updatePngPreviewZoom(0.1));
    if (els.previewStartBtn) els.previewStartBtn.addEventListener('click', () => actions.seekPreviewAnimation(0));
    if (els.previewPlayBtn) els.previewPlayBtn.addEventListener('click', actions.togglePreviewAnimation);
    if (els.previewFrameInput) els.previewFrameInput.addEventListener('input', () => actions.seekPreviewAnimation(Number(els.previewFrameInput.value) || 0));
    [els.previewAnimationInput, els.stylePreviewAnimationInput, els.cartelaPreviewAnimationInput]
      .filter(Boolean)
      .forEach((input) => input.addEventListener('change', () => actions.setPreviewAnimationEnabled(!!input.checked)));
    if (els.showPreviewReferenceVideoInput) els.showPreviewReferenceVideoInput.addEventListener('change', () => {
      state.showPreviewReferenceVideo = !!els.showPreviewReferenceVideoInput.checked;
      actions.renderPdfPreview();
      actions.savePreviewSettingsFromUi();
    });
    if (els.showCartelaReferenceVideoInput) els.showCartelaReferenceVideoInput.addEventListener('change', () => {
      state.showCartelaReferenceVideo = !!els.showCartelaReferenceVideoInput.checked;
      actions.renderCartelaPreview();
    });
    if (els.exportIncludeBackgroundInput) els.exportIncludeBackgroundInput.addEventListener('change', () => {
      state.exportIncludeBackground = !!els.exportIncludeBackgroundInput.checked;
      actions.savePreviewSettingsFromUi();
    });
    if (els.exportIncludeVideoInput) els.exportIncludeVideoInput.addEventListener('change', () => {
      state.exportIncludeVideo = !!els.exportIncludeVideoInput.checked;
      if (state.exportIncludeVideo && els.exportIncludeBackgroundInput) {
        els.exportIncludeBackgroundInput.checked = true;
        state.exportIncludeBackground = true;
      }
      actions.savePreviewSettingsFromUi();
    });
    if (els.exportIncludeMarginsInput) els.exportIncludeMarginsInput.addEventListener('change', () => {
      state.exportIncludeMargins = !!els.exportIncludeMarginsInput.checked;
      actions.savePreviewSettingsFromUi();
    });
    if (els.exportIncludeAnimationInput) els.exportIncludeAnimationInput.addEventListener('change', () => {
      state.exportIncludeAnimation = !!els.exportIncludeAnimationInput.checked;
      actions.savePreviewSettingsFromUi();
    });
    els.toggleMarginsBtn.addEventListener('click', actions.toggleMarginOverlay);
    if (els.toggleStyleMarginsBtn) els.toggleStyleMarginsBtn.addEventListener('click', actions.togglePanelMarginOverlay);
    if (els.toggleCartelaMarginsBtn) els.toggleCartelaMarginsBtn.addEventListener('click', actions.togglePanelMarginOverlay);
    els.exportCurrentPdfBtn.addEventListener('click', () => actions.exportPngPages('current'));
    els.exportAllPdfBtn.addEventListener('click', () => actions.exportPngPages('all'));
    els.exportMovBtn.addEventListener('click', actions.exportMov);
    if (els.downloadDatabaseBtn) els.downloadDatabaseBtn.addEventListener('click', () => actions.syncDatabaseManually('download'));
    if (els.uploadDatabaseBtn) els.uploadDatabaseBtn.addEventListener('click', () => actions.syncDatabaseManually('upload'));
    windowRef.addEventListener('resize', () => {
      actions.renderVisiblePanelPreviews();
      if (state.activeTab === 'pdf' && state.pngPreviewZoomMode === 'auto') actions.renderPdfPreview();
    });
  }

  root.CreditosUiBindings = {
    bindAppUi,
  };
})(globalThis);
