(function (root) {
  function createPdfPanel(options = {}) {
    const els = options.els;
    const state = options.state;

    function updatePdfToolbar(current, total) {
      if (!els.pdfPageNumberInput) return;
      const page = state.render ? options.getCurrentPhysicalPages()[state.pdfPageIndex] : null;
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
      els.pdfBaseNameInput.value = options.getProductionSettings().pdf_base_name;
      const scrollMode = options.getMovieMode() === 'scroll';
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
        ? options.getPdfLineStatus(
          page,
          options.getProductionSettings().default_auto_page_lines,
          state.structure && state.structure.page_line_adjustments
        )
        : '0/0';
      options.updateMovieDurationFields();
    }

    return {
      updatePdfToolbar,
    };
  }

  root.CreditosPdfPanel = {
    createPdfPanel,
  };
})(globalThis);
