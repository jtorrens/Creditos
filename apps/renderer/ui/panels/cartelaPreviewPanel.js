(function (root) {
  function createCartelaPreviewPanel(options = {}) {
    const documentRef = options.documentRef || root.document;
    const els = options.els;
    const state = options.state;

    function renderCartelaPreview() {
      if (!els.cartelaPreview) return;
      els.cartelaPreview.innerHTML = '';
      const cartela = options.getSelectedCartela();
      if (!state.render || !state.structure || !cartela) {
        els.cartelaPreview.className = 'cartela-preview empty-state';
        els.cartelaPreview.textContent = 'Selecciona una cartela.';
        return;
      }
      const layout = options.getRenderLayout();
      const pages = options.getCurrentPhysicalPages();
      const page = pages.find((candidate) => candidate.cartela && candidate.cartela.id === cartela.id);
      if (!page) {
        els.cartelaPreview.className = 'cartela-preview empty-state';
        els.cartelaPreview.textContent = 'Sin página activa.';
        return;
      }
      els.cartelaPreview.className = 'cartela-preview';
      const zoom = options.previewZoomForContainer(els.cartelaPreview, layout);
      const frame = documentRef.createElement('div');
      frame.className = 'png-preview-frame';
      frame.style.width = `${layout.page_width * zoom}px`;
      frame.style.height = `${layout.page_height * zoom}px`;
      const plan = options.getPreviewAnimationPlan();
      const video = state.showCartelaReferenceVideo && plan ? options.makeReferenceVideoElement(plan, zoom) : null;
      if (video) frame.appendChild(video);
      const sheet = options.makePdfSheetElement(page, layout, { transparent: !!video });
      sheet.style.transform = `scale(${zoom})`;
      frame.appendChild(sheet);
      if (state.showPanelMarginOverlay) {
        frame.appendChild(options.makeMarginOverlay(options.layoutForCartela(layout, page.cartela), zoom));
      }
      els.cartelaPreview.appendChild(frame);
      options.updatePanelMarginButtons();
    }

    return {
      renderCartelaPreview,
    };
  }

  root.CreditosCartelaPreviewPanel = {
    createCartelaPreviewPanel,
  };
})(globalThis);
