(function (root) {
  function createCartelaPreviewPanel(options = {}) {
    const documentRef = options.documentRef || root.document;
    const els = options.els;
    const state = options.state;
    let cartelaPreviewRenderId = 0;

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
      const canvas = documentRef.createElement('canvas');
      canvas.className = 'preview-animation-canvas';
      canvas.width = Math.max(1, Math.round(layout.page_width * zoom));
      canvas.height = Math.max(1, Math.round(layout.page_height * zoom));
      canvas.style.width = `${canvas.width}px`;
      canvas.style.height = `${canvas.height}px`;
      frame.appendChild(canvas);
      if (state.showPanelMarginOverlay) {
        frame.appendChild(options.makeMarginOverlay(options.layoutForCartela(layout, page.cartela), zoom));
      }
      els.cartelaPreview.appendChild(frame);
      options.updatePanelMarginButtons();
      const renderId = ++cartelaPreviewRenderId;
      drawPanelPage(canvas, page, layout, zoom, panelAnimationFrame(page), { transparent: !!video }).catch((error) => {
        if (renderId === cartelaPreviewRenderId) console.warn(error);
      });
    }

    async function drawPanelPage(canvas, page, layout, zoom, animationFrame, renderOptions = {}) {
      const ctx = canvas.getContext('2d');
      ctx.setTransform(zoom, 0, 0, zoom, 0, 0);
      ctx.clearRect(0, 0, layout.page_width, layout.page_height);
      if (!renderOptions.transparent) {
        ctx.fillStyle = layout.page_background || '#ffffff';
        ctx.fillRect(0, 0, layout.page_width, layout.page_height);
      }
      await options.drawCanvasPage(ctx, page, layout, { animationFrame });
    }

    function panelAnimationFrame(page) {
      const settings = options.getProductionSettings();
      const fps = options.currentMovieFps ? options.currentMovieFps() : Math.max(1, Math.round(Number(settings.movie_fps) || 25));
      const duration = Math.max(0.1, Number(page && page.cartela && page.cartela.duration) || Number(settings.default_cartela_duration) || 1);
      return {
        page,
        localFrame: 0,
        frameCount: Math.max(1, Math.round(duration * fps)),
        fps,
      };
    }

    return {
      renderCartelaPreview,
    };
  }

  root.CreditosCartelaPreviewPanel = {
    createCartelaPreviewPanel,
  };
})(globalThis);
