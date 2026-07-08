(function (root) {
  function createStylesPanel(options = {}) {
    const documentRef = options.documentRef || root.document;
    const els = options.els;
    const state = options.state;
    const fieldControlRegistry = options.fieldControlRegistry;
    const stylePreviewLoopPauseMs = 3000;
    let stylePreviewRenderId = 0;
    let stylePreviewPairCount = 3;
    const stylePreviewPlayback = {
      frame: 0,
      lastTickTime: 0,
      playing: false,
      raf: null,
      realTime: true,
      renderId: 0,
      startFrame: 0,
      startedAt: 0,
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
      const pages = options.buildPhysicalPages(options.makeSampleStyleRender(style, {
        pairCount: stylePreviewPairCount,
      }).cartelas, {}, {
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
      const stack = documentRef.createElement('div');
      stack.className = 'style-preview-stack';
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
      const realtimeDot = documentRef.createElement('span');
      realtimeDot.className = 'style-preview-realtime-dot ok';
      frame.appendChild(realtimeDot);
      if (state.showPanelMarginOverlay) {
        frame.appendChild(options.makeMarginOverlay(options.layoutForCartela(layout, page.cartela), zoom));
      }
      const renderId = ++stylePreviewRenderId;
      const frameState = panelAnimationFrame(page);
      const rowState = previewAnimatedRowState(page);
      const playbackOptions = {
        canvas,
        frameState,
        layout,
        page,
        realtimeDot,
        renderId,
        rowState,
        style,
        zoom,
      };
      const controls = renderStylePreviewPlaybackControls(playbackOptions);
      playbackOptions.controls = controls;
      stack.appendChild(frame);
      stack.appendChild(controls);
      els.stylePreview.appendChild(stack);
      options.updatePanelMarginButtons();
      if (stylePreviewPlayback.playing && stylePreviewPlayback.styleId !== style.id) {
        stopStylePreviewPlayback();
      }
      const localFrame = stylePreviewPlayback.playing && stylePreviewPlayback.styleId === style.id
        ? stylePreviewDisplayFrame(frameState)
        : 0;
      const localFrameState = { ...frameState, localFrame };
      drawPanelPage(canvas, page, layout, zoom, localFrameState).catch((error) => {
        if (renderId === stylePreviewRenderId) console.warn(error);
      });
      updateStylePreviewPlaybackUi(playbackOptions, localFrameState);
      if (stylePreviewPlayback.playing && stylePreviewPlayback.styleId === style.id) {
        startStylePreviewPlayback(playbackOptions);
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
      const animation = page && page.cartela && page.cartela.animation ? page.cartela.animation : {};
      const inMs = animation.in && animation.in.durationMs !== undefined ? animation.in.durationMs : 600;
      const outMs = animation.out && animation.out.durationMs !== undefined ? animation.out.durationMs : 500;
      const inFrames = msToFrames(inMs, fps);
      const holdFrames = msToFrames(3000, fps);
      const outFrames = msToFrames(outMs, fps);
      const frameCount = inFrames + holdFrames + outFrames;
      return {
        holdFrames,
        inFrames,
        page,
        localFrame: 0,
        frameCount: Math.max(1, frameCount),
        fps,
        outFrames,
      };
    }

    function msToFrames(ms, fps) {
      return Math.max(0, Math.round((Math.max(0, Number(ms) || 0) / 1000) * fps));
    }

    function previewAnimatedRowState(page) {
      const blocks = page && Array.isArray(page.blocks) ? page.blocks.filter((block) => !block.missing_source) : [];
      const titleRows = page && page.cartela_physical_index === 0 && String(page.title || '').trim() ? 1 : 0;
      let nextRow = titleRows;
      let firstUnitRow = titleRows;
      blocks.forEach((block, index) => {
        const units = block && block.pages && block.pages[0] ? block.pages[0].items || [] : [];
        const blockTitleRows = String(block && block.title || '').trim() ? 1 : 0;
        if (index === 0) firstUnitRow = nextRow + blockTitleRows;
        nextRow += blockTitleRows + units.length;
      });
      return {
        rowCount: Math.max(1, nextRow),
        rowIndex: Math.max(0, Math.min(Math.max(1, nextRow) - 1, firstUnitRow)),
      };
    }

    function renderStylePreviewPlaybackControls(playbackOptions) {
      const controls = documentRef.createElement('div');
      controls.className = 'style-preview-playback';
      const topRow = documentRef.createElement('div');
      topRow.className = 'style-preview-playback-row';
      const pairInput = renderStylePreviewPairCountInput(playbackOptions.style);
      const buttons = documentRef.createElement('div');
      buttons.className = 'style-preview-transport';
      const status = documentRef.createElement('span');
      status.className = 'style-preview-frame-status';
      topRow.appendChild(pairInput);
      buttons.appendChild(transportButton('⏮', 'Inicio', () => setStylePreviewFrame(playbackOptions, 0)));
      buttons.appendChild(transportButton('‹', 'Frame anterior', () => setStylePreviewFrame(playbackOptions, stylePreviewDisplayFrame(playbackOptions.frameState) - 1)));
      buttons.appendChild(transportButton('|‹', 'Inicio neutro', () => setStylePreviewFrame(playbackOptions, neutralStartFrame(playbackOptions.frameState))));
      buttons.appendChild(transportButton('▶', 'Play', () => toggleStylePreviewPlayback(playbackOptions), 'play'));
      buttons.appendChild(transportButton('›|', 'Fin neutro', () => setStylePreviewFrame(playbackOptions, neutralEndFrame(playbackOptions.frameState))));
      buttons.appendChild(transportButton('›', 'Frame siguiente', () => setStylePreviewFrame(playbackOptions, stylePreviewDisplayFrame(playbackOptions.frameState) + 1)));
      buttons.appendChild(transportButton('⏭', 'Fin', () => setStylePreviewFrame(playbackOptions, playbackOptions.frameState.frameCount - 1)));
      topRow.appendChild(buttons);
      topRow.appendChild(status);
      const values = documentRef.createElement('div');
      values.className = 'style-preview-values';
      controls.appendChild(topRow);
      controls.appendChild(values);
      updateStylePreviewPlaybackUi(playbackOptions, playbackOptions.frameState);
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

    function renderStylePreviewPairCountInput(style) {
      const wrap = documentRef.createElement('label');
      wrap.className = 'style-preview-pair-count';
      const label = documentRef.createElement('span');
      label.textContent = 'Pares';
      const input = fieldControlRegistry.create('number', {
        value: stylePreviewPairCount,
        min: 1,
        max: 50,
        step: 1,
        fallbackValue: 3,
        onInput: (value) => {
          stylePreviewPairCount = Math.max(1, Math.min(50, Math.round(Number(value) || 3)));
        },
        onAfterCommit: () => {
          stopStylePreviewPlayback();
          renderStylePreview(style);
        },
      });
      input.classList.add('style-preview-pair-input');
      wrap.appendChild(label);
      wrap.appendChild(input);
      return wrap;
    }

    function startStylePreviewPlayback(playbackOptions) {
      stopStylePreviewPlayback({ keepFrame: true });
      stylePreviewPlayback.playing = true;
      stylePreviewPlayback.renderId = playbackOptions.renderId;
      stylePreviewPlayback.styleId = playbackOptions.style.id;
      stylePreviewPlayback.lastTickTime = 0;
      stylePreviewPlayback.realTime = true;
      stylePreviewPlayback.startFrame = stylePreviewDisplayFrame(playbackOptions.frameState);
      stylePreviewPlayback.startedAt = 0;
      const tick = (time) => {
        if (!stylePreviewPlayback.playing || stylePreviewPlayback.renderId !== playbackOptions.renderId || stylePreviewRenderId !== playbackOptions.renderId) return;
        const frameCount = stylePreviewLoopFrameCount(playbackOptions.frameState);
        const frameMs = 1000 / Math.max(1, Number(playbackOptions.frameState.fps) || 25);
        if (!stylePreviewPlayback.startedAt) stylePreviewPlayback.startedAt = time;
        const tickDelta = stylePreviewPlayback.lastTickTime ? time - stylePreviewPlayback.lastTickTime : frameMs;
        stylePreviewPlayback.realTime = tickDelta <= frameMs * 1.5;
        stylePreviewPlayback.lastTickTime = time;
        const elapsedFrames = Math.floor(Math.max(0, time - stylePreviewPlayback.startedAt) / frameMs);
        stylePreviewPlayback.frame = (stylePreviewPlayback.startFrame + elapsedFrames) % frameCount;
        drawPanelPage(playbackOptions.canvas, playbackOptions.page, playbackOptions.layout, playbackOptions.zoom, {
          ...playbackOptions.frameState,
          localFrame: stylePreviewDisplayFrame(playbackOptions.frameState),
        }).catch((error) => {
          if (stylePreviewPlayback.renderId === playbackOptions.renderId) console.warn(error);
        });
        updateStylePreviewPlaybackUi(playbackOptions, {
          ...playbackOptions.frameState,
          localFrame: stylePreviewDisplayFrame(playbackOptions.frameState),
        });
        stylePreviewPlayback.raf = root.requestAnimationFrame(tick);
      };
      updateStylePreviewPlaybackUi(playbackOptions, playbackOptions.frameState);
      stylePreviewPlayback.raf = root.requestAnimationFrame(tick);
    }

    function toggleStylePreviewPlayback(playbackOptions) {
      if (stylePreviewPlayback.playing && stylePreviewPlayback.styleId === playbackOptions.style.id) {
        stopStylePreviewPlayback({ keepFrame: true });
        updateStylePreviewPlaybackUi(playbackOptions, {
          ...playbackOptions.frameState,
          localFrame: stylePreviewDisplayFrame(playbackOptions.frameState),
        });
        return;
      }
      startStylePreviewPlayback(playbackOptions);
    }

    function setStylePreviewFrame(playbackOptions, frame) {
      stopStylePreviewPlayback({ keepFrame: true });
      const frameCount = Math.max(1, playbackOptions.frameState.frameCount);
      stylePreviewPlayback.frame = Math.max(0, Math.min(frameCount - 1, Math.round(Number(frame) || 0)));
      drawPanelPage(playbackOptions.canvas, playbackOptions.page, playbackOptions.layout, playbackOptions.zoom, {
        ...playbackOptions.frameState,
        localFrame: stylePreviewDisplayFrame(playbackOptions.frameState),
      }).catch((error) => {
        if (stylePreviewPlayback.renderId === playbackOptions.renderId) console.warn(error);
      });
      updateStylePreviewPlaybackUi(playbackOptions, {
        ...playbackOptions.frameState,
        localFrame: stylePreviewDisplayFrame(playbackOptions.frameState),
      });
    }

    function stopStylePreviewPlayback(options = {}) {
      if (stylePreviewPlayback.raf) root.cancelAnimationFrame(stylePreviewPlayback.raf);
      stylePreviewPlayback.raf = null;
      stylePreviewPlayback.playing = false;
      stylePreviewPlayback.renderId = 0;
      stylePreviewPlayback.lastTickTime = 0;
      stylePreviewPlayback.realTime = true;
      stylePreviewPlayback.startedAt = 0;
      stylePreviewPlayback.time = 0;
      if (!options.keepFrame) {
        stylePreviewPlayback.frame = 0;
        stylePreviewPlayback.styleId = null;
      }
    }

    function updateStylePreviewPlaybackUi(playbackOptions, frameState) {
      const controls = playbackOptions && playbackOptions.controls;
      const button = controls && controls.querySelector('[data-role="play"]');
      const status = controls && controls.querySelector('.style-preview-frame-status');
      const values = controls && controls.querySelector('.style-preview-values');
      if (button) {
        button.textContent = stylePreviewPlayback.playing ? '⏸' : '▶';
        button.title = stylePreviewPlayback.playing ? 'Pausa' : 'Play';
        button.setAttribute('aria-label', button.title);
      }
      if (status) {
        const frameCount = Math.max(1, frameState && frameState.frameCount || 1);
        const rawFrame = frameState && frameState.localFrame !== undefined ? Number(frameState.localFrame) : stylePreviewPlayback.frame;
        const localFrame = Math.max(0, Math.min(frameCount - 1, Number.isFinite(rawFrame) ? rawFrame : 0));
        status.textContent = `${localFrame}/${frameCount - 1}`;
      }
      if (playbackOptions && playbackOptions.realtimeDot) {
        playbackOptions.realtimeDot.className = 'style-preview-realtime-dot ' + (stylePreviewPlayback.realTime ? 'ok' : 'late');
      }
      if (values) renderStylePreviewAnimatedValues(values, playbackOptions, frameState);
    }

    function stylePreviewLoopFrameCount(frameState) {
      const frameCount = Math.max(1, Number(frameState && frameState.frameCount) || 1);
      const fps = Math.max(1, Number(frameState && frameState.fps) || 25);
      return frameCount + msToFrames(stylePreviewLoopPauseMs, fps);
    }

    function stylePreviewDisplayFrame(frameState) {
      const frameCount = Math.max(1, Number(frameState && frameState.frameCount) || 1);
      return Math.min(frameCount - 1, Math.max(0, Math.round(Number(stylePreviewPlayback.frame) || 0)));
    }

    function neutralStartFrame(frameState) {
      return Math.max(0, Math.min(Math.max(1, frameState.frameCount) - 1, Number(frameState.inFrames) || 0));
    }

    function neutralEndFrame(frameState) {
      const frameCount = Math.max(1, Number(frameState && frameState.frameCount) || 1);
      const outFrames = Math.max(0, Number(frameState && frameState.outFrames) || 0);
      return Math.max(0, Math.min(frameCount - 1, frameCount - outFrames - 1));
    }

    function renderStylePreviewAnimatedValues(container, playbackOptions, frameState) {
      container.innerHTML = '';
      const rows = stylePreviewAnimatedValueRows(playbackOptions, frameState);
      if (!rows.length) {
        const empty = documentRef.createElement('div');
        empty.className = 'style-preview-values-empty';
        empty.textContent = 'Sin propiedades animadas';
        container.appendChild(empty);
        return;
      }
      rows.forEach((row) => {
        const item = documentRef.createElement('div');
        item.className = 'style-preview-value-row';
        const label = documentRef.createElement('span');
        label.textContent = row.label;
        const value = documentRef.createElement('strong');
        value.textContent = row.value;
        item.appendChild(label);
        item.appendChild(value);
        container.appendChild(item);
      });
    }

    function stylePreviewAnimatedValueRows(playbackOptions, frameState) {
      const page = playbackOptions && playbackOptions.page;
      const cartela = page && page.cartela;
      const animation = cartela && cartela.animation ? cartela.animation : {};
      const properties = animation.properties || {};
      const rows = [];
      Object.keys(properties).forEach((key) => {
        const property = properties[key];
        if (!property || !property.animate) return;
        const value = animatedPropertyPreviewValue(key, playbackOptions, frameState);
        if (value === null || value === undefined) return;
        rows.push({
          label: animatedPropertyLabel(key),
          value: formatAnimatedValue(value),
        });
      });
      ['in', 'out'].forEach((phase) => {
        if (!animation[phase] || !(Number(animation[phase].fadeDurationMs) > 0)) return;
        const alpha = options.animationFadeAlpha
          ? options.animationFadeAlpha(cartela, frameState, {
            fadeScope: animation[phase].fadeMode === 'cascade' ? 'row' : 'fullFrame',
            rowCount: playbackOptions.rowState.rowCount,
            rowIndex: playbackOptions.rowState.rowIndex,
          })
          : 1;
        rows.push({
          label: `Fade ${phase === 'in' ? 'entrada' : 'salida'}`,
          value: formatAnimatedValue(alpha),
        });
      });
      return rows;
    }

    function animatedPropertyPreviewValue(key, playbackOptions, frameState) {
      const page = playbackOptions && playbackOptions.page;
      const block = page && page.blocks && page.blocks[0];
      if (key.startsWith('typography.')) {
        if (!options.typographyWithResolvedRowAnimation || !block) return null;
        const typography = options.typographyWithResolvedRowAnimation(page.cartela, block.typography, frameState, playbackOptions.rowState);
        const match = key.match(/^typography\.(block_title|role|name)\.(font_size|letter_spacing)$/);
        return match && typography && typography[match[1]] ? typography[match[1]][match[2]] : null;
      }
      const cartela = options.cartelaWithResolvedRowAnimation
        ? options.cartelaWithResolvedRowAnimation(page && page.cartela, frameState, playbackOptions.rowState)
        : page && page.cartela;
      return cartela ? cartela[key] : null;
    }

    function animatedPropertyLabel(key) {
      const labels = {
        line_spacing: 'Interlineado',
        column_gap: 'Columnas',
        role_name_gap: 'Cargo/nombre',
        source_group_gap: 'Grupos',
        block_gap: 'Bloques',
        block_title_gap: 'Título/fila',
        vertical_offset: 'Vertical',
        page_top_margin: 'Margen sup.',
        page_bottom_margin: 'Margen inf.',
        page_left_margin: 'Margen izq.',
        page_right_margin: 'Margen der.',
        'typography.block_title.font_size': 'Título tamaño',
        'typography.block_title.letter_spacing': 'Título spacing',
        'typography.role.font_size': 'Cargo tamaño',
        'typography.role.letter_spacing': 'Cargo spacing',
        'typography.name.font_size': 'Nombre tamaño',
        'typography.name.letter_spacing': 'Nombre spacing',
      };
      return labels[key] || key;
    }

    function formatAnimatedValue(value) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return String(value);
      return numeric.toFixed(Math.abs(numeric) < 10 ? 2 : 1).replace(/\.0+$/, '').replace(/(\.\d)0$/, '$1');
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
