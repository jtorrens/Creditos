(function (root) {
  function createStylesPanel(options = {}) {
    const documentRef = options.documentRef || root.document;
    const els = options.els;
    const state = options.state;
    const fieldControlRegistry = options.fieldControlRegistry;
    let stylePreviewRenderId = 0;
    const stylePreviewPlayback = {
      frame: 0,
      playing: false,
      raf: null,
      renderId: 0,
      styleId: null,
      time: 0,
    };

    function renderStylePreview(style) {
      if (!els.stylePreview) return;
      els.stylePreview.innerHTML = '';
      if (!style) {
        els.stylePreview.className = 'style-preview empty-state';
        els.stylePreview.textContent = 'Sin estilo seleccionado.';
        return;
      }
      els.stylePreview.className = 'style-preview';
      const layout = options.getRenderLayout();
      const settings = options.getProductionSettings();
      const pages = options.buildPhysicalPages(options.makeSampleStyleRender(style).cartelas, {}, {
        settings,
        pageLineAdjustments: {},
      });
      const page = pages[0];
      if (!page) {
        els.stylePreview.className = 'style-preview empty-state';
        els.stylePreview.textContent = 'Sin contenido de preview.';
        return;
      }
      const zoom = options.previewZoomForContainer(els.stylePreview, layout);
      const frame = documentRef.createElement('div');
      frame.className = 'png-preview-frame';
      frame.style.width = `${layout.page_width * zoom}px`;
      frame.style.height = `${layout.page_height * zoom}px`;
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
      const renderId = ++stylePreviewRenderId;
      const frameState = panelAnimationFrame(page);
      const controls = renderStylePreviewPlaybackControls({
        canvas,
        frameState,
        layout,
        page,
        renderId,
        style,
        zoom,
      });
      frame.appendChild(controls);
      els.stylePreview.appendChild(frame);
      options.updatePanelMarginButtons();
      if (stylePreviewPlayback.playing && stylePreviewPlayback.styleId !== style.id) {
        stopStylePreviewPlayback();
      }
      const localFrame = stylePreviewPlayback.playing && stylePreviewPlayback.styleId === style.id
        ? stylePreviewPlayback.frame % frameState.frameCount
        : 0;
      drawPanelPage(canvas, page, layout, zoom, { ...frameState, localFrame }).catch((error) => {
        if (renderId === stylePreviewRenderId) console.warn(error);
      });
      if (stylePreviewPlayback.playing && stylePreviewPlayback.styleId === style.id) {
        startStylePreviewPlayback({ canvas, frameState, layout, page, renderId, style, zoom });
      }
    }

    async function drawPanelPage(canvas, page, layout, zoom, animationFrame) {
      const ctx = canvas.getContext('2d');
      ctx.setTransform(zoom, 0, 0, zoom, 0, 0);
      ctx.clearRect(0, 0, layout.page_width, layout.page_height);
      ctx.fillStyle = layout.page_background || '#ffffff';
      ctx.fillRect(0, 0, layout.page_width, layout.page_height);
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

    function renderStylePreviewPlaybackControls(playbackOptions) {
      const controls = documentRef.createElement('div');
      controls.className = 'style-preview-playback';
      const button = documentRef.createElement('button');
      button.type = 'button';
      const status = documentRef.createElement('span');
      controls.appendChild(button);
      controls.appendChild(status);
      button.addEventListener('click', () => {
        if (stylePreviewPlayback.playing && stylePreviewPlayback.styleId === playbackOptions.style.id) {
          stopStylePreviewPlayback();
          updateStylePreviewPlaybackUi(button, status, playbackOptions.frameState);
          return;
        }
        stylePreviewPlayback.frame = 0;
        startStylePreviewPlayback(playbackOptions);
      });
      updateStylePreviewPlaybackUi(button, status, playbackOptions.frameState);
      return controls;
    }

    function startStylePreviewPlayback(playbackOptions) {
      stopStylePreviewPlayback({ keepFrame: true });
      stylePreviewPlayback.playing = true;
      stylePreviewPlayback.renderId = playbackOptions.renderId;
      stylePreviewPlayback.styleId = playbackOptions.style.id;
      stylePreviewPlayback.time = 0;
      const controls = playbackOptions.canvas.parentElement && playbackOptions.canvas.parentElement.querySelector('.style-preview-playback');
      const button = controls && controls.querySelector('button');
      const status = controls && controls.querySelector('span');
      const tick = (time) => {
        if (!stylePreviewPlayback.playing || stylePreviewPlayback.renderId !== playbackOptions.renderId || stylePreviewRenderId !== playbackOptions.renderId) return;
        const frameCount = Math.max(1, playbackOptions.frameState.frameCount);
        if (!stylePreviewPlayback.time) stylePreviewPlayback.time = time;
        const elapsedMs = Math.max(0, time - stylePreviewPlayback.time);
        const elapsedFrames = Math.max(1, Math.floor((elapsedMs / 1000) * playbackOptions.frameState.fps));
        stylePreviewPlayback.time = time;
        stylePreviewPlayback.frame = (stylePreviewPlayback.frame + elapsedFrames) % frameCount;
        drawPanelPage(playbackOptions.canvas, playbackOptions.page, playbackOptions.layout, playbackOptions.zoom, {
          ...playbackOptions.frameState,
          localFrame: stylePreviewPlayback.frame,
        }).catch((error) => {
          if (stylePreviewPlayback.renderId === playbackOptions.renderId) console.warn(error);
        });
        updateStylePreviewPlaybackUi(button, status, playbackOptions.frameState);
        stylePreviewPlayback.raf = root.requestAnimationFrame(tick);
      };
      updateStylePreviewPlaybackUi(button, status, playbackOptions.frameState);
      stylePreviewPlayback.raf = root.requestAnimationFrame(tick);
    }

    function stopStylePreviewPlayback(options = {}) {
      if (stylePreviewPlayback.raf) root.cancelAnimationFrame(stylePreviewPlayback.raf);
      stylePreviewPlayback.raf = null;
      stylePreviewPlayback.playing = false;
      stylePreviewPlayback.renderId = 0;
      stylePreviewPlayback.time = 0;
      if (!options.keepFrame) {
        stylePreviewPlayback.frame = 0;
        stylePreviewPlayback.styleId = null;
      }
    }

    function updateStylePreviewPlaybackUi(button, status, frameState) {
      if (button) button.textContent = stylePreviewPlayback.playing ? 'Pausa' : 'Play';
      if (status) {
        const frameCount = Math.max(1, frameState && frameState.frameCount || 1);
        status.textContent = `${Math.min(frameCount - 1, stylePreviewPlayback.frame)}/${frameCount - 1}`;
      }
    }

    function renderStylesPane() {
      if (!els.styleList) return;
      els.styleList.innerHTML = '';
      els.styleCount.textContent = String(state.styles.length);
      if (!state.selectedStyleId || !options.getStyleById(state.selectedStyleId)) {
        state.selectedStyleId = state.styles[0] ? state.styles[0].id : null;
      }
      if (!state.styles.length) {
        els.styleList.className = 'style-list empty-state';
        els.styleList.textContent = options.selectedProduction() ? 'Sin estilos.' : 'Selecciona una producción.';
      } else {
        els.styleList.className = 'style-list';
        const table = documentRef.createElement('table');
        table.className = 'data-table';
        table.innerHTML = '<thead><tr><th></th><th>Estilo</th></tr></thead>';
        const tbody = documentRef.createElement('tbody');
        state.styles.forEach((style) => {
          const row = documentRef.createElement('tr');
          row.className = style.id === state.selectedStyleId ? 'selected' : '';
          row.addEventListener('click', (event) => {
            if (event.target && event.target.closest('input')) return;
            state.selectedStyleId = style.id;
            renderStylesPane();
          });
          const selectCell = documentRef.createElement('td');
          selectCell.className = 'table-select-cell';
          const selectButton = documentRef.createElement('button');
          selectButton.type = 'button';
          selectButton.className = 'table-select-button';
          selectButton.textContent = style.id === state.selectedStyleId ? '●' : '○';
          selectButton.addEventListener('click', () => {
            state.selectedStyleId = style.id;
            renderStylesPane();
          });
          selectCell.appendChild(selectButton);
          row.appendChild(selectCell);
          const nameCell = documentRef.createElement('td');
          const nameInput = fieldControlRegistry.create('text', {
            className: 'table-input',
            value: style.name,
            commitOnChange: true,
            onInput: (value) => options.updateStyleName(style, value),
          });
          nameCell.appendChild(nameInput);
          row.appendChild(nameCell);
          tbody.appendChild(row);
        });
        table.appendChild(tbody);
        els.styleList.appendChild(table);
      }
      if (els.duplicateStyleBtn) els.duplicateStyleBtn.disabled = !options.getStyleById(state.selectedStyleId);
      if (els.deleteStyleBtn) els.deleteStyleBtn.disabled = !options.getStyleById(state.selectedStyleId);

      const style = options.getStyleById(state.selectedStyleId);
      if (!style) {
        els.styleEditorTitle.textContent = 'Sin estilo seleccionado';
        els.styleEditorMeta.textContent = '';
        els.styleEditorBody.className = 'editor-body empty-state';
        els.styleEditorBody.textContent = options.selectedProduction() ? 'Crea o importa un estilo.' : 'Selecciona una producción.';
        renderStylePreview(null);
        return;
      }

      els.styleEditorTitle.textContent = style.name;
      els.styleEditorMeta.textContent = '';
      els.styleEditorBody.className = 'editor-body';
      els.styleEditorBody.innerHTML = '';
      els.styleEditorBody.appendChild(options.renderStyleEditor(style));
      renderStylePreview(style);
    }

    return {
      renderStylePreview,
      renderStylesPane,
    };
  }

  root.CreditosStylesPanel = {
    createStylesPanel,
  };
})(globalThis);
