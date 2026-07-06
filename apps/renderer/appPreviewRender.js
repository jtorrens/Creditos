(function (root) {
  function createAppPreviewRender(options = {}) {
    let currentPhysicalPagesCache = { render: null, pages: [] };

    function previewZoomForContainer(container, layout) {
      const availableWidth = Math.max(120, (container && container.clientWidth ? container.clientWidth : 360) - 24);
      const availableHeight = Math.max(120, (container && container.clientHeight ? container.clientHeight : 260) - 24);
      return options.fitPreviewZoom(availableWidth, availableHeight, layout.page_width, layout.page_height);
    }

    function makeMarginOverlay(layout, zoom = options.getPngPreviewZoom()) {
      return options.makeMarginOverlayInPreview(layout, zoom);
    }

    function makePdfSheetElement(page, layout, elementOptions = {}) {
      return options.makePdfSheetElementInPreview(page, layout, {
        ...elementOptions,
        settings: elementOptions.settings || options.getProductionSettings(),
      });
    }

    function calculateFitPreviewZoom(layout) {
      if (!options.els.pdfPreview || !layout) return 0.25;
      const rect = options.els.pdfPreview.getBoundingClientRect();
      const availableWidth = Math.max(1, rect.width - 28);
      const availableHeight = Math.max(1, rect.height - 28);
      return options.fitPreviewZoom(availableWidth, availableHeight, layout.page_width, layout.page_height, { maxZoom: 2 });
    }

    function getCurrentPngPreviewZoom(layout) {
      if (options.state.pngPreviewZoomMode === 'auto' || !Number(options.state.pngPreviewZoom)) {
        return calculateFitPreviewZoom(layout);
      }
      return Math.max(0.03, Number(options.state.pngPreviewZoom) || 0.25);
    }

    function updatePngPreviewZoom(delta) {
      const layout = options.getRenderLayout();
      const baseZoom = options.state.pngPreviewZoomMode === 'auto' || !Number(options.state.pngPreviewZoom)
        ? calculateFitPreviewZoom(layout)
        : Number(options.state.pngPreviewZoom);
      options.state.pngPreviewZoomMode = 'manual';
      options.state.pngPreviewZoom = Math.max(0.05, Math.min(2, Math.round((baseZoom + delta) * 20) / 20));
      options.renderPdfPreview();
    }

    function updatePngZoomStatus() {
      if (!options.els.pngZoomStatus) return;
      const suffix = options.state.pngPreviewZoomMode === 'auto' ? ' auto' : '';
      options.els.pngZoomStatus.textContent = `${Math.round((Number(options.state.pngPreviewZoom) || 0) * 100)}%${suffix}`;
    }

    function toggleMarginOverlay() {
      options.state.showMarginOverlay = !options.state.showMarginOverlay;
      if (options.els.toggleMarginsBtn) {
        options.els.toggleMarginsBtn.classList.toggle('active-toggle', options.state.showMarginOverlay);
        options.els.toggleMarginsBtn.textContent = options.state.showMarginOverlay ? 'Ocultar márgenes' : 'Mostrar márgenes';
      }
      options.renderPdfPreview();
      options.savePreviewSettingsFromUi();
    }

    function togglePanelMarginOverlay() {
      options.state.showPanelMarginOverlay = !options.state.showPanelMarginOverlay;
      updatePanelMarginButtons();
      options.renderVisiblePanelPreviews();
    }

    function updatePanelMarginButtons() {
      [options.els.toggleStyleMarginsBtn, options.els.toggleCartelaMarginsBtn].forEach((button) => {
        if (!button) return;
        button.classList.toggle('active-toggle', options.state.showPanelMarginOverlay);
        button.textContent = options.state.showPanelMarginOverlay ? 'Ocultar márgenes' : 'Márgenes';
      });
    }

    function getCurrentPhysicalPages() {
      if (!options.state.render || !options.state.structure) return [];
      if (currentPhysicalPagesCache.render === options.state.render) return currentPhysicalPagesCache.pages;
      const pages = options.buildPhysicalPages(options.state.render.cartelas || [], options.state.structure.overrides || {}, {
        settings: options.getProductionSettings(),
        pageLineAdjustments: options.state.structure.page_line_adjustments,
      });
      currentPhysicalPagesCache = { render: options.state.render, pages };
      return pages;
    }

    return {
      calculateFitPreviewZoom,
      getCurrentPngPreviewZoom,
      getCurrentPhysicalPages,
      makeMarginOverlay,
      makePdfSheetElement,
      previewZoomForContainer,
      toggleMarginOverlay,
      togglePanelMarginOverlay,
      updatePanelMarginButtons,
      updatePngPreviewZoom,
      updatePngZoomStatus,
    };
  }

  root.CreditosAppPreviewRender = {
    createAppPreviewRender,
  };
})(globalThis);
