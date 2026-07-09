(function (root) {
  function createCartelaPreviewPanel(options = {}) {
    const documentRef = options.documentRef || root.document;
    const els = options.els;
    const state = options.state;
    const fieldControlRegistry = options.fieldControlRegistry;
    let cartelaPreviewRenderId = 0;
    let cartelaPreviewHoldFrames = 75;
    const cartelaPreviewPlayback = {
      frame: 0,
      lastTickTime: 0,
      playing: false,
      raf: null,
      realTime: true,
      renderId: 0,
      startFrame: 0,
      startedAt: 0,
      cartelaId: null,
    };

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
      const cartelaPages = pages.filter((candidate) => candidate.cartela && candidate.cartela.id === cartela.id);
      const page = cartelaPages[0];
      if (!page) {
        els.cartelaPreview.className = 'cartela-preview empty-state';
        els.cartelaPreview.textContent = 'Sin página activa.';
        return;
      }
      els.cartelaPreview.className = 'cartela-preview';
      const zoom = options.previewZoomForContainer(els.cartelaPreview, layout);
      const stack = documentRef.createElement('div');
      stack.className = 'cartela-preview-stack';
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
      const realtimeDot = documentRef.createElement('span');
      realtimeDot.className = 'style-preview-realtime-dot ok';
      frame.appendChild(realtimeDot);
      if (state.showPanelMarginOverlay) {
        frame.appendChild(options.makeMarginOverlay(options.layoutForCartela(layout, page.cartela), zoom));
      }
      const renderId = ++cartelaPreviewRenderId;
      const frameState = panelAnimationFrame(page, cartelaPages);
      const playbackOptions = {
        canvas,
        cartela,
        frameState,
        layout,
        realtimeDot,
        renderId,
        transparent: !!video,
        zoom,
      };
      const controls = renderCartelaPreviewPlaybackControls(playbackOptions);
      playbackOptions.controls = controls;
      stack.appendChild(frame);
      stack.appendChild(controls);
      els.cartelaPreview.appendChild(stack);
      options.updatePanelMarginButtons();
      const sameCartela = cartelaPreviewPlayback.cartelaId === cartela.id;
      if (cartelaPreviewPlayback.playing && !sameCartela) {
        stopCartelaPreviewPlayback();
      }
      const localFrame = sameCartela ? cartelaPreviewDisplayFrame(frameState) : 0;
      cartelaPreviewPlayback.frame = localFrame;
      cartelaPreviewPlayback.cartelaId = cartela.id;
      const localFrameState = cartelaPreviewRenderFrameState(frameState);
      drawPanelPage(canvas, localFrameState.page, layout, zoom, localFrameState, { transparent: !!video }).catch((error) => {
        if (renderId === cartelaPreviewRenderId) console.warn(error);
      });
      updateCartelaPreviewPlaybackUi(playbackOptions, localFrameState);
      if (cartelaPreviewPlayback.playing && cartelaPreviewPlayback.cartelaId === cartela.id && previewAnimationEnabled()) {
        startCartelaPreviewPlayback(playbackOptions);
      }
    }

    async function drawPanelPage(canvas, page, layout, zoom, animationFrame, renderOptions = {}) {
      const ctx = canvas.getContext('2d');
      ctx.setTransform(zoom, 0, 0, zoom, 0, 0);
      ctx.clearRect(0, 0, layout.page_width, layout.page_height);
      if (!renderOptions.transparent) {
        ctx.fillStyle = layout.page_background || '#ffffff';
        ctx.fillRect(0, 0, layout.page_width, layout.page_height);
      }
      await options.drawCanvasPage(ctx, page, layout, { animationFrame: previewAnimationEnabled() ? animationFrame : null });
    }

    function panelAnimationFrame(page, pages = []) {
      const settings = options.getProductionSettings();
      const fps = options.currentMovieFps ? options.currentMovieFps() : Math.max(1, Math.round(Number(settings.movie_fps) || 25));
      const animation = page && page.cartela && page.cartela.animation ? page.cartela.animation : {};
      const inFrames = phaseFrames(animation.in, 'duration', 600, fps);
      const outFrames = phaseFrames(animation.out, 'duration', 500, fps);
      const pageFrameCount = Math.max(1, inFrames + cartelaPreviewHoldFrames + outFrames);
      const pageCount = Math.max(1, pages.length);
      return {
        holdFrames: cartelaPreviewHoldFrames,
        inFrames,
        page,
        pageCount,
        pageFrameCount,
        pages,
        localFrame: 0,
        frameCount: pageFrameCount * pageCount,
        fps,
        outFrames,
      };
    }

    function renderCartelaPreviewPlaybackControls(playbackOptions) {
      const controls = documentRef.createElement('div');
      controls.className = 'style-preview-playback';
      const topRow = documentRef.createElement('div');
      topRow.className = 'style-preview-playback-row';
      const holdInput = renderCartelaPreviewTimingInput(playbackOptions.cartela, 'Pausa', 'Frames parado entre entrada y salida', cartelaPreviewHoldFrames, (value) => {
        cartelaPreviewHoldFrames = value;
      });
      const buttons = documentRef.createElement('div');
      buttons.className = 'style-preview-transport';
      const status = documentRef.createElement('span');
      status.className = 'style-preview-frame-status';
      topRow.appendChild(holdInput);
      buttons.appendChild(transportButton('⏮', 'Inicio', () => setCartelaPreviewFrame(playbackOptions, 0)));
      buttons.appendChild(transportButton('‹', 'Frame anterior', () => setCartelaPreviewFrame(playbackOptions, cartelaPreviewDisplayFrame(playbackOptions.frameState) - 1)));
      buttons.appendChild(transportButton('|‹', 'Inicio neutro', () => setCartelaPreviewFrame(playbackOptions, neutralStartFrame(playbackOptions.frameState))));
      buttons.appendChild(transportButton('▶', 'Play', () => toggleCartelaPreviewPlayback(playbackOptions), 'play'));
      buttons.appendChild(transportButton('›|', 'Fin neutro', () => setCartelaPreviewFrame(playbackOptions, neutralEndFrame(playbackOptions.frameState))));
      buttons.appendChild(transportButton('›', 'Frame siguiente', () => setCartelaPreviewFrame(playbackOptions, cartelaPreviewDisplayFrame(playbackOptions.frameState) + 1)));
      buttons.appendChild(transportButton('⏭', 'Fin', () => setCartelaPreviewFrame(playbackOptions, playbackOptions.frameState.frameCount - 1)));
      topRow.appendChild(buttons);
      topRow.appendChild(status);
      controls.appendChild(topRow);
      return controls;
    }

    function transportButton(text, title, onClick, role) {
      const button = documentRef.createElement('button');
      button.type = 'button';
      button.className = 'style-preview-transport-button';
      if (role) button.dataset.role = role;
      button.textContent = text;
      button.title = title;
      button.setAttribute('aria-label', title);
      button.addEventListener('click', onClick);
      return button;
    }

    function renderCartelaPreviewTimingInput(cartela, labelText, title, value, onChange) {
      const wrap = documentRef.createElement('label');
      wrap.className = 'style-preview-pair-count';
      wrap.title = title;
      const label = documentRef.createElement('span');
      label.textContent = labelText;
      const input = fieldControlRegistry.create('number', {
        value,
        min: 0,
        max: 1000,
        step: 1,
        fallbackValue: 75,
        onInput: (nextValue) => {
          onChange(Math.max(0, Math.min(1000, Math.round(Number(nextValue) || 0))));
        },
        onAfterCommit: () => {
          stopCartelaPreviewPlayback({ keepFrame: true });
          cartelaPreviewPlayback.cartelaId = cartela.id;
          renderCartelaPreview();
        },
      });
      input.classList.add('style-preview-pair-input');
      wrap.appendChild(label);
      wrap.appendChild(input);
      return wrap;
    }

    function startCartelaPreviewPlayback(playbackOptions) {
      if (!previewAnimationEnabled()) return;
      stopCartelaPreviewPlayback({ keepFrame: true });
      cartelaPreviewPlayback.playing = true;
      cartelaPreviewPlayback.renderId = playbackOptions.renderId;
      cartelaPreviewPlayback.cartelaId = playbackOptions.cartela.id;
      cartelaPreviewPlayback.lastTickTime = 0;
      cartelaPreviewPlayback.realTime = true;
      cartelaPreviewPlayback.startFrame = cartelaPreviewDisplayFrame(playbackOptions.frameState);
      cartelaPreviewPlayback.startedAt = 0;
      const tick = (time) => {
        if (!cartelaPreviewPlayback.playing || cartelaPreviewPlayback.renderId !== playbackOptions.renderId || cartelaPreviewRenderId !== playbackOptions.renderId) return;
        const frameCount = cartelaPreviewLoopFrameCount(playbackOptions.frameState);
        const frameMs = 1000 / Math.max(1, Number(playbackOptions.frameState.fps) || 25);
        if (!cartelaPreviewPlayback.startedAt) cartelaPreviewPlayback.startedAt = time;
        const tickDelta = cartelaPreviewPlayback.lastTickTime ? time - cartelaPreviewPlayback.lastTickTime : frameMs;
        cartelaPreviewPlayback.realTime = tickDelta <= frameMs * 1.5;
        cartelaPreviewPlayback.lastTickTime = time;
        const elapsedFrames = Math.floor(Math.max(0, time - cartelaPreviewPlayback.startedAt) / frameMs);
        cartelaPreviewPlayback.frame = (cartelaPreviewPlayback.startFrame + elapsedFrames) % frameCount;
        const renderFrameState = cartelaPreviewRenderFrameState(playbackOptions.frameState);
        drawPanelPage(playbackOptions.canvas, renderFrameState.page, playbackOptions.layout, playbackOptions.zoom, renderFrameState, { transparent: playbackOptions.transparent }).catch((error) => {
          if (cartelaPreviewPlayback.renderId === playbackOptions.renderId) console.warn(error);
        });
        updateCartelaPreviewPlaybackUi(playbackOptions, renderFrameState);
        cartelaPreviewPlayback.raf = root.requestAnimationFrame(tick);
      };
      updateCartelaPreviewPlaybackUi(playbackOptions, cartelaPreviewRenderFrameState(playbackOptions.frameState));
      cartelaPreviewPlayback.raf = root.requestAnimationFrame(tick);
    }

    function toggleCartelaPreviewPlayback(playbackOptions) {
      if (!previewAnimationEnabled()) return;
      if (cartelaPreviewPlayback.playing && cartelaPreviewPlayback.cartelaId === playbackOptions.cartela.id) {
        stopCartelaPreviewPlayback({ keepFrame: true });
        updateCartelaPreviewPlaybackUi(playbackOptions, cartelaPreviewRenderFrameState(playbackOptions.frameState));
        return;
      }
      startCartelaPreviewPlayback(playbackOptions);
    }

    function setCartelaPreviewFrame(playbackOptions, frame) {
      if (!previewAnimationEnabled()) return;
      stopCartelaPreviewPlayback({ keepFrame: true });
      const frameCount = Math.max(1, playbackOptions.frameState.frameCount);
      cartelaPreviewPlayback.frame = Math.max(0, Math.min(frameCount - 1, Math.round(Number(frame) || 0)));
      cartelaPreviewPlayback.cartelaId = playbackOptions.cartela.id;
      const renderFrameState = cartelaPreviewRenderFrameState(playbackOptions.frameState);
      drawPanelPage(playbackOptions.canvas, renderFrameState.page, playbackOptions.layout, playbackOptions.zoom, renderFrameState, { transparent: playbackOptions.transparent }).catch((error) => {
        if (cartelaPreviewPlayback.renderId === playbackOptions.renderId) console.warn(error);
      });
      updateCartelaPreviewPlaybackUi(playbackOptions, renderFrameState);
    }

    function stopCartelaPreviewPlayback(options = {}) {
      if (cartelaPreviewPlayback.raf) root.cancelAnimationFrame(cartelaPreviewPlayback.raf);
      cartelaPreviewPlayback.raf = null;
      cartelaPreviewPlayback.playing = false;
      cartelaPreviewPlayback.renderId = 0;
      cartelaPreviewPlayback.lastTickTime = 0;
      cartelaPreviewPlayback.realTime = true;
      cartelaPreviewPlayback.startedAt = 0;
      if (!options.keepFrame) {
        cartelaPreviewPlayback.frame = 0;
        cartelaPreviewPlayback.cartelaId = null;
      }
    }

    function updateCartelaPreviewPlaybackUi(playbackOptions, frameState) {
      const controls = playbackOptions && playbackOptions.controls;
      const button = controls && controls.querySelector('[data-role="play"]');
      const status = controls && controls.querySelector('.style-preview-frame-status');
      if (button) {
        button.disabled = !previewAnimationEnabled();
        button.textContent = cartelaPreviewPlayback.playing ? '⏸' : '▶';
        button.title = cartelaPreviewPlayback.playing ? 'Pausa' : 'Play';
        button.setAttribute('aria-label', button.title);
      }
      controls && controls.querySelectorAll('.style-preview-transport-button').forEach((control) => {
        control.disabled = !previewAnimationEnabled();
      });
      if (status) {
        if (!previewAnimationEnabled()) {
          status.textContent = 'Animación desactivada';
        } else {
          const frameCount = Math.max(1, frameState && (frameState.totalFrameCount || frameState.frameCount) || 1);
          const rawFrame = frameState && frameState.absoluteFrame !== undefined ? Number(frameState.absoluteFrame) : cartelaPreviewPlayback.frame;
          const absoluteFrame = Math.max(0, Math.min(frameCount - 1, Number.isFinite(rawFrame) ? rawFrame : 0));
          const pageCount = Math.max(1, Number(frameState && frameState.pageCount) || 1);
          const pageIndex = Math.max(0, Math.min(pageCount - 1, Math.round(Number(frameState && frameState.pageIndex) || 0)));
          status.textContent = pageCount > 1
            ? `Pág ${pageIndex + 1}/${pageCount} · ${absoluteFrame}/${frameCount - 1}`
            : `${absoluteFrame}/${frameCount - 1}`;
        }
      }
      if (playbackOptions && playbackOptions.realtimeDot) {
        playbackOptions.realtimeDot.className = 'style-preview-realtime-dot ' + (cartelaPreviewPlayback.realTime ? 'ok' : 'late');
      }
    }

    function cartelaPreviewLoopFrameCount(frameState) {
      return Math.max(1, Number(frameState && frameState.frameCount) || 1);
    }

    function cartelaPreviewDisplayFrame(frameState) {
      const maxFrame = cartelaPreviewLoopFrameCount(frameState) - 1;
      return Math.min(maxFrame, Math.max(0, Math.round(Number(cartelaPreviewPlayback.frame) || 0)));
    }

    function cartelaPreviewRenderFrameState(frameState) {
      const frameCount = Math.max(1, Number(frameState && frameState.frameCount) || 1);
      const rawFrame = cartelaPreviewDisplayFrame(frameState);
      const pageFrameCount = Math.max(1, Number(frameState && frameState.pageFrameCount) || frameCount);
      const pageCount = Math.max(1, Number(frameState && frameState.pageCount) || 1);
      const pageIndex = Math.max(0, Math.min(pageCount - 1, Math.floor(rawFrame / pageFrameCount)));
      const localFrame = Math.max(0, Math.min(pageFrameCount - 1, rawFrame - pageIndex * pageFrameCount));
      const pages = Array.isArray(frameState && frameState.pages) ? frameState.pages : [];
      return {
        ...frameState,
        absoluteFrame: rawFrame,
        frameCount: pageFrameCount,
        page: pages[pageIndex] || frameState.page,
        pageIndex,
        localFrame,
        totalFrameCount: frameCount,
      };
    }

    function neutralStartFrame(frameState) {
      const pageFrameCount = Math.max(1, Number(frameState && frameState.pageFrameCount) || Number(frameState && frameState.frameCount) || 1);
      const currentPageStart = Math.floor(cartelaPreviewDisplayFrame(frameState) / pageFrameCount) * pageFrameCount;
      return Math.max(0, Math.min(Math.max(1, frameState.frameCount) - 1, currentPageStart + (Number(frameState.inFrames) || 0)));
    }

    function neutralEndFrame(frameState) {
      const frameCount = Math.max(1, Number(frameState && frameState.frameCount) || 1);
      const pageFrameCount = Math.max(1, Number(frameState && frameState.pageFrameCount) || frameCount);
      const currentPageStart = Math.floor(cartelaPreviewDisplayFrame(frameState) / pageFrameCount) * pageFrameCount;
      const outFrames = Math.max(0, Number(frameState && frameState.outFrames) || 0);
      return Math.max(0, Math.min(frameCount - 1, currentPageStart + pageFrameCount - outFrames - 1));
    }

    function msToFrames(ms, fps) {
      return Math.max(0, Math.round((Math.max(0, Number(ms) || 0) / 1000) * fps));
    }

    function phaseFrames(phase = {}, field, fallbackMs, fps) {
      const frameKey = field === 'fadeDuration' ? 'fadeDurationFrames' : `${field}Frames`;
      const msKey = field === 'fadeDuration' ? 'fadeDurationMs' : `${field}Ms`;
      const frames = Number(phase && phase[frameKey]);
      if (Number.isFinite(frames)) return Math.max(0, Math.round(frames));
      return msToFrames(phase && phase[msKey] !== undefined ? phase[msKey] : fallbackMs, fps);
    }

    function previewAnimationEnabled() {
      return typeof options.previewAnimationEnabled === 'function' ? options.previewAnimationEnabled() : true;
    }

    return {
      renderCartelaPreview,
    };
  }

  root.CreditosCartelaPreviewPanel = {
    createCartelaPreviewPanel,
  };
})(globalThis);
