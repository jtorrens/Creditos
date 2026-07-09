(function (root) {
  function createAppPreviewAnimation(options = {}) {
    const documentRef = options.documentRef || root.document;
    const windowRef = options.windowRef || root;
    const els = options.els;
    const state = options.state;
    let previewPlanCache = { render: null, key: '', plan: null };

    function getPreviewAnimationPlan() {
      if (!state.render || !state.structure) return null;
      const cacheKey = previewAnimationPlanKey();
      if (previewPlanCache.render === state.render && previewPlanCache.key === cacheKey) {
        return previewPlanCache.plan;
      }
      const layout = options.getRenderLayout();
      const fps = options.currentMovieFps();
      const segments = options.readMovieSegmentSettings(fps);
      if (options.getMovieMode() === 'scroll') {
        const groups = options.getSelectedScrollCartelaGroups();
        if (!groups.length) return cachePreviewAnimationPlan(cacheKey, null);
        const sourceFrames = options.getSelectedScrollSourceFrames(fps);
        return cachePreviewAnimationPlan(cacheKey, options.buildScrollMoviePlan({
          fps,
          groups,
          layout,
          segments,
          sourceFrames,
          targetFrames: options.movieTargetDurationFrames(fps),
          useTargetFrames: options.movieUsesCustomTargetDuration(),
        }));
      }
      const selectedPages = options.getSelectedMoviePages();
      if (!selectedPages.length) return cachePreviewAnimationPlan(cacheKey, null);
      return cachePreviewAnimationPlan(cacheKey, options.buildPageMoviePlan({
        fps,
        groups: options.getSelectedMoviePageGroups(),
        layout,
        segments,
        selectedPages,
        sourceFrames: options.getSelectedMovieGroupFrameCounts(fps),
        targetFrames: options.movieTargetDurationFrames(fps),
        useTargetFrames: options.movieUsesCustomTargetDuration(),
      }));
    }

    function previewAnimationPlanKey() {
      return [
        options.getMovieMode(),
        els.exportFromPageInput && els.exportFromPageInput.value,
        els.exportToPageInput && els.exportToPageInput.value,
        els.movieTargetDurationInput && els.movieTargetDurationInput.value,
        els.moviePrerollCountInput && els.moviePrerollCountInput.value,
        els.moviePrerollDurationInput && els.moviePrerollDurationInput.value,
        els.moviePostrollCountInput && els.moviePostrollCountInput.value,
        els.moviePostrollDurationInput && els.moviePostrollDurationInput.value,
        options.currentMovieFps(),
      ].join('|');
    }

    function cachePreviewAnimationPlan(key, plan) {
      previewPlanCache = { render: state.render, key, plan };
      return plan;
    }

    async function renderPreviewAnimationFrame() {
      if (!els.pdfPreview || !state.render || !state.structure) return;
      const previewEnabled = previewAnimationEnabled();
      const plan = getPreviewAnimationPlan();
      if (!plan || !plan.totalFrames) {
        updatePreviewPlaybackControls(null);
        return;
      }
      state.previewAnimation.frame = Math.max(0, Math.min(plan.totalFrames - 1, Number(state.previewAnimation.frame) || 0));
      updatePreviewPlaybackControls(plan);

      els.pdfPreview.className = 'pdf-preview';
      els.pdfPreview.innerHTML = '';
      const zoom = options.getCurrentPngPreviewZoom(plan.layout);
      state.pngPreviewZoom = zoom;
      const stage = documentRef.createElement('div');
      stage.className = 'preview-animation-stage';
      stage.style.width = `${Math.max(1, Math.round(plan.layout.page_width * zoom))}px`;
      stage.style.height = `${Math.max(1, Math.round(plan.layout.page_height * zoom))}px`;
      const realtimeDot = documentRef.createElement('span');
      realtimeDot.className = 'style-preview-realtime-dot ' + (state.previewAnimation.realTime ? 'ok' : 'late');
      const video = state.showPreviewReferenceVideo ? options.makeReferenceVideoElement(plan, zoom) : null;
      if (video) stage.appendChild(video);

      const canvas = documentRef.createElement('canvas');
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

      if (!previewEnabled) {
        const page = options.getCurrentPhysicalPages()[state.pdfPageIndex];
        if (page) {
          await options.drawCanvasPage(ctx, page, plan.layout, {});
          if (state.showMarginOverlay) {
            options.drawCanvasMarginOverlay(ctx, options.layoutForCartela(plan.layout, page.cartela), zoom);
          }
        }
      } else if (plan.mode === 'scroll') {
        await options.drawCanvasScrollFrame(ctx, plan.scrollPlan, state.previewAnimation.frame, plan.layout);
        syncPdfPageToAnimationFrame(plan, state.previewAnimation.frame);
        if (state.showMarginOverlay) options.drawCanvasMarginOverlay(ctx, plan.layout, zoom);
      } else {
        const pageState = options.pageFrameStateForAnimationFrame
          ? options.pageFrameStateForAnimationFrame(plan, state.previewAnimation.frame)
          : { page: options.pageForAnimationFrame(plan, state.previewAnimation.frame), localFrame: 0, frameCount: 1, fps: plan.fps };
        const page = pageState && pageState.page;
        if (page) {
          syncPdfPageToAnimationFrame(plan, state.previewAnimation.frame);
          await options.drawCanvasPage(ctx, page, plan.layout, { animationFrame: pageState });
          if (state.showMarginOverlay) {
            options.drawCanvasMarginOverlay(ctx, options.layoutForCartela(plan.layout, page.cartela), zoom);
          }
        }
      }
      stage.appendChild(canvas);
      stage.appendChild(realtimeDot);
      els.pdfPreview.appendChild(stage);
    }

    function syncPdfPageToAnimationFrame(plan, frame) {
      const pageIndex = options.pageIndexForAnimationFrame(plan, frame, options.getCurrentPhysicalPages());
      if (pageIndex === null || pageIndex === state.pdfPageIndex) return;
      state.pdfPageIndex = pageIndex;
      options.updatePdfToolbar(state.pdfPageIndex + 1, options.getCurrentPhysicalPages().length);
    }

    function updatePreviewPlaybackControls(plan) {
      const totalFrames = plan && plan.totalFrames ? Math.max(1, plan.totalFrames) : 0;
      const disabled = !totalFrames || !previewAnimationEnabled();
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
        if (!previewAnimationEnabled()) {
          els.previewFrameStatus.textContent = 'Animación desactivada';
          return;
        }
        const speedText = plan && plan.mode === 'scroll' && plan.scrollPlan
          ? ` · ${options.formatScrollSpeed(plan.scrollPlan.bodySpeed)} px/frame`
          : '';
        els.previewFrameStatus.textContent = totalFrames
          ? `${options.formatFrameDuration(state.previewAnimation.frame, plan.fps)} / ${options.formatFrameDuration(totalFrames, plan.fps)}${speedText}`
          : '0/0';
      }
    }

    function togglePreviewAnimation() {
      if (!previewAnimationEnabled()) return;
      if (state.previewAnimation.playing) {
        stopPreviewAnimation();
        renderPreviewAnimationFrame();
        return;
      }
      const plan = getPreviewAnimationPlan();
      if (!plan || !plan.totalFrames) return;
      if (state.previewAnimation.frame >= plan.totalFrames - 1) state.previewAnimation.frame = 0;
      state.previewAnimation.playing = true;
      state.previewAnimation.lastTickTime = 0;
      state.previewAnimation.realTime = true;
      state.previewAnimation.startedAt = performance.now();
      state.previewAnimation.startFrame = state.previewAnimation.frame;
      updatePreviewPlaybackControls(plan);
      state.previewAnimation.raf = windowRef.requestAnimationFrame(tickPreviewAnimation);
    }

    function stopPreviewAnimation() {
      state.previewAnimation.playing = false;
      if (state.previewAnimation.raf) windowRef.cancelAnimationFrame(state.previewAnimation.raf);
      state.previewAnimation.raf = null;
      state.previewAnimation.lastTickTime = 0;
      state.previewAnimation.realTime = true;
      updatePreviewPlaybackControls(getPreviewAnimationPlan());
    }

    async function tickPreviewAnimation(now) {
      if (!state.previewAnimation.playing) return;
      const plan = getPreviewAnimationPlan();
      if (!plan || !plan.totalFrames) {
        stopPreviewAnimation();
        return;
      }
      const frameMs = 1000 / Math.max(1, Number(plan.fps) || 25);
      const tickDelta = state.previewAnimation.lastTickTime ? now - state.previewAnimation.lastTickTime : frameMs;
      state.previewAnimation.realTime = tickDelta <= frameMs * 1.5;
      state.previewAnimation.lastTickTime = now;
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
      state.previewAnimation.raf = windowRef.requestAnimationFrame(tickPreviewAnimation);
    }

    function seekPreviewAnimation(frame) {
      if (!previewAnimationEnabled()) return;
      stopPreviewAnimation();
      state.previewAnimation.frame = Math.max(0, Math.round(Number(frame) || 0));
      renderPreviewAnimationFrame();
    }

    function previewAnimationEnabled() {
      return typeof options.previewAnimationEnabled === 'function' ? options.previewAnimationEnabled() : true;
    }

    return {
      getPreviewAnimationPlan,
      renderPreviewAnimationFrame,
      seekPreviewAnimation,
      stopPreviewAnimation,
      togglePreviewAnimation,
    };
  }

  root.CreditosAppPreviewAnimation = {
    createAppPreviewAnimation,
  };
})(globalThis);
