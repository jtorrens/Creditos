(function (root) {
  function createAppPageExport(options = {}) {
    const documentRef = options.documentRef || root.document;
    const windowRef = options.windowRef || root;
    const els = options.els;
    const state = options.state;

    async function exportScrollMovSequence({
      native,
      filePath,
      fps,
      layout,
      encodingProfile,
      preventOverwrite = false,
      renderOptions = {},
    }) {
      const groups = options.getSelectedScrollCartelaGroups();
      if (!groups.length) return;
      const sourceFrames = options.getSelectedScrollSourceFrames(fps);
      const segments = options.readMovieSegmentSettings(fps);
      const moviePlan = options.buildScrollMoviePlan({
        fps,
        groups,
        layout,
        segments,
        sourceFrames,
        targetFrames: options.movieTargetDurationFrames(fps),
        useTargetFrames: options.movieUsesCustomTargetDuration(),
      });
      const plan = moviePlan.scrollPlan;
      options.updateMovExportProgress(0, moviePlan.totalFrames);
      await options.exportMovFramesIncrementally(native, filePath, fps, encodingProfile, async (writeFrame) => {
        await options.writeAnimatedFrames({
          frameCount: moviePlan.totalFrames,
          onFramesWritten: (_count, frame) => options.updateMovExportProgress(frame + 1, moviePlan.totalFrames),
          renderFrameBytes: async (frame) => {
            const blob = await renderScrollFrameToPngBlob(plan, frame, layout, {
              ...renderOptions,
              videoTime: frame >= moviePlan.videoStartFrame ? (frame - moviePlan.videoStartFrame) / fps : null,
            });
            return options.blobToBytes(blob);
          },
          writeFrame,
        });
        options.updateMovExportProgress(moviePlan.totalFrames, moviePlan.totalFrames);
      }, { preventOverwrite });
    }

    async function renderScrollFrameToPngBlob(plan, frame, layout, renderOptions = {}) {
      if (typeof options.ensureGlyphAlternateFontsReady === 'function') await options.ensureGlyphAlternateFontsReady();
      const canvas = documentRef.createElement('canvas');
      canvas.width = layout.page_width;
      canvas.height = layout.page_height;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      await drawExportBackground(ctx, layout, renderOptions);
      await options.drawCanvasScrollFrame(ctx, plan, frame, layout);
      if (renderOptions.includeMargins) options.drawCanvasMarginOverlay(ctx, layout, 1);
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('No se pudo crear el frame de scroll.'));
        }, 'image/png');
      });
    }

    async function exportPngPages(mode) {
      if (!state.render || !state.structure) return;
      const layout = options.getRenderLayout();
      const pages = options.getCurrentPhysicalPages();
      if (!pages.length) return;
      const selectedPages = mode === 'current'
        ? [{ page: pages[state.pdfPageIndex], pageNumber: state.pdfPageIndex + 1 }]
        : readExportPageSelection(pages).pages.map((page, index) => ({
          page,
          pageNumber: index + 1,
        }));
      const settings = options.getProductionSettings();
      const baseName = options.safeFilePart(settings.pdf_base_name || 'creditos');
      const renderOptions = currentExportRenderOptions();
      const native = options.nativeBridge();
      try {
        if (native && mode === 'all' && native.exportPngSequence) {
          const exportedPages = [];
          for (const item of selectedPages.filter((candidate) => candidate.page)) {
            const fileName = `${baseName}_${String(item.pageNumber).padStart(3, '0')}.png`;
            const blob = await renderPageToPngBlob(item.page, layout, {
              ...renderOptions,
              videoTime: currentVideoTimeForPage(item.page),
            });
            exportedPages.push({ fileName, bytes: await options.blobToBytes(blob) });
          }
          await native.exportPngSequence({ pages: exportedPages });
          return;
        }

        if (mode === 'all' && windowRef.showDirectoryPicker) {
          const directory = await windowRef.showDirectoryPicker({ mode: 'readwrite' });
          for (const item of selectedPages.filter((candidate) => candidate.page)) {
            const fileName = `${baseName}_${String(item.pageNumber).padStart(3, '0')}.png`;
            const blob = await renderPageToPngBlob(item.page, layout, {
              ...renderOptions,
              videoTime: currentVideoTimeForPage(item.page),
            });
            await options.writeBlobToDirectory(directory, fileName, blob);
          }
          return;
        }

        for (const item of selectedPages.filter((candidate) => candidate.page)) {
          const fileName = `${baseName}_${String(item.pageNumber).padStart(3, '0')}.png`;
          const blob = await renderPageToPngBlob(item.page, layout, {
            ...renderOptions,
            videoTime: currentVideoTimeForPage(item.page),
          });
          if (mode === 'current') {
            await options.saveBlobAs(blob, fileName);
          } else {
            options.downloadBlob(blob, fileName);
          }
          await options.wait(120);
        }
      } catch (error) {
        if (error.name === 'AbortError') return;
        windowRef.alert('No se pudo exportar PNG: ' + error.message);
      }
    }

    async function exportMov() {
      if (!state.render || !state.structure) return;
      const native = options.nativeBridge();
      if (!native || !native.chooseMovPath || !native.exportMovSequence) {
        windowRef.alert('La exportacion MOV necesita la app Electron.');
        return;
      }

      const layout = options.getRenderLayout();
      const pages = options.getCurrentPhysicalPages();
      if (!pages.length) return;

      const selectedPages = options.getSelectedMoviePages();
      if (!selectedPages.length) return;

      const settings = options.getProductionSettings();
      const fps = Math.max(1, Math.round(Number(settings.movie_fps) || 25));
      const baseName = options.safeFilePart(settings.pdf_base_name || 'creditos');
      const encodingProfile = options.selectedRenderProfile();

      try {
        const saveResult = await resolveMovDestination(
          native,
          baseName,
          encodingProfile,
        );
        if (!saveResult || saveResult.canceled) return;
        if (!saveResult.preventOverwrite) {
          options.rememberFileDirectory(
            options.storageKeys.renderDir,
            saveResult.filePath,
          );
        }

        els.exportMovBtn.disabled = true;
        state.movExportProgress = options.openMovExportProgressModal();
        if (options.getMovieMode() === 'scroll') {
          await exportScrollMovSequence({
            native,
            filePath: saveResult.filePath,
            fps,
            layout,
            encodingProfile,
            preventOverwrite: saveResult.preventOverwrite,
            renderOptions: currentExportRenderOptions(),
          });
          return;
        }

        const moviePlan = options.buildPageMoviePlan({
          fps,
          groups: options.getSelectedMoviePageGroups(),
          layout,
          segments: options.readMovieSegmentSettings(fps),
          selectedPages,
          sourceFrames: options.getSelectedMovieGroupFrameCounts(fps),
          targetFrames: options.movieTargetDurationFrames(fps),
          useTargetFrames: options.movieUsesCustomTargetDuration(),
        });
        const exportFrameCounts = moviePlan.frameCounts;
        const totalExportFrames = moviePlan.totalFrames;
        const renderOptions = currentExportRenderOptions();
        options.updateMovExportProgress(0, totalExportFrames);
        await options.exportMovFramesIncrementally(native, saveResult.filePath, fps, encodingProfile, async (writeFrame) => {
          let renderedFrames = 0;
          for (const [index, item] of selectedPages.entries()) {
            options.throwIfMovExportCancelled();
            options.updateMovExportProgress(renderedFrames, totalExportFrames);
            await options.wait(0);
            const duration = Math.max(0, Number(item.page.cartela && item.page.cartela.duration) || 0);
            const frameCount = exportFrameCounts[index] || Math.max(1, Math.round(duration * fps));
            if (renderOptions.includeVideo || (renderOptions.includeAnimation && pageHasActiveAnimation(item.page))) {
              const startFrame = renderedFrames;
              await options.writeAnimatedFrames({
                frameCount,
                onFramesWritten: () => {
                  renderedFrames += 1;
                  options.updateMovExportProgress(renderedFrames, totalExportFrames);
                },
                renderFrameBytes: async (frame) => {
                  const animationFrame = renderOptions.includeAnimation
                    ? {
                      index,
                      page: item.page,
                      localFrame: frame,
                      frameCount,
                      fps,
                    }
                    : null;
                  const blob = await renderPageToPngBlob(item.page, layout, {
                    ...renderOptions,
                    animationFrame,
                    videoTime: startFrame + frame >= moviePlan.videoStartFrame ? (startFrame + frame - moviePlan.videoStartFrame) / fps : null,
                  });
                  return options.blobToBytes(blob);
                },
                writeFrame,
              });
            } else {
              const blob = await renderPageToPngBlob(item.page, layout, renderOptions);
              const bytes = await options.blobToBytes(blob);
              await options.writeRepeatedFrames({
                bytes,
                frameCount,
                onFramesWritten: (chunk) => {
                  renderedFrames += chunk;
                  options.updateMovExportProgress(renderedFrames, totalExportFrames);
                },
                writeFrame,
              });
            }
          }
          options.updateMovExportProgress(totalExportFrames, totalExportFrames);
        }, { preventOverwrite: saveResult.preventOverwrite });
      } catch (error) {
        if (error.name === 'AbortError' || (state.movExportProgress && state.movExportProgress.isCancellationRequested())) return;
        windowRef.alert('No se pudo exportar MOV: ' + error.message);
      } finally {
        if (state.movExportProgress) state.movExportProgress.close();
        state.movExportProgress = null;
        els.exportMovBtn.textContent = 'Exportar MOV';
        options.updatePdfToolbar(state.pdfPageIndex + 1, pages.length);
      }
    }

    async function resolveMovDestination(native, baseName, encodingProfile) {
      const production = options.selectedProduction();
      if (!production || production.governance_mode !== 'SHOT_MANAGER') {
        return native.chooseMovPath({
          defaultPath: options.joinPath(
            options.readLocalPreference(options.storageKeys.renderDir),
            `${baseName}.mov`,
          ),
          encodingProfile,
        });
      }
      if (!native.resolveShotManagerOutput) {
        throw new Error(
          'Esta versión de Créditos no puede resolver salidas oficiales de Shot Manager.',
        );
      }
      const episode = options.selectedEpisode();
      if (
        !production.shot_manager_production_id ||
        !production.final_render_structure_entry_id ||
        (
          production.production_type === 'SERIES' &&
          (!episode || !episode.shot_manager_episode_id)
        )
      ) {
        throw new Error(
          'La producción gobernada no tiene completa su salida de render final. Revísala en Producciones.',
        );
      }
      const result = await native.resolveShotManagerOutput({
        productionId: production.shot_manager_production_id,
        artifactKind: 'FINAL_RENDER',
        structureEntryId:
          production.final_render_structure_entry_id,
        episodeId:
          production.production_type === 'SERIES'
            ? episode.shot_manager_episode_id
            : null,
        extension: 'mov',
      });
      if (!result || !result.ok) {
        throw new Error(
          result && result.error
            ? result.error.message
            : 'Shot Manager no pudo resolver la salida oficial.',
        );
      }
      const confirmation = native.confirm
        ? await native.confirm({
          title: 'Render final oficial',
          message:
            `Se renderizará la versión v${result.data.version} en:\n\n` +
            result.data.filePath,
          confirmLabel: 'Renderizar',
        })
        : { confirmed: true };
      if (!confirmation.confirmed) return { canceled: true };
      return {
        canceled: false,
        filePath: result.data.filePath,
        preventOverwrite: true,
      };
    }

    function readExportPageSelection(pages) {
      const selection = options.exportPageSelection(
        pages,
        els.exportFromPageInput && els.exportFromPageInput.value,
        els.exportToPageInput && els.exportToPageInput.value
      );
      const { start, end } = selection;
      els.exportFromPageInput.value = String(start);
      els.exportToPageInput.value = String(end);
      return selection;
    }

    function currentExportRenderOptions() {
      return options.getExportRenderOptionsInDomain({
        includeBackground: state.exportIncludeBackground,
        includeVideo: state.exportIncludeVideo,
        includeMargins: state.exportIncludeMargins,
        includeAnimation: state.exportIncludeAnimation,
      }, state.referenceVideo);
    }

    function currentVideoTimeForPage(page) {
      const plan = options.getPreviewAnimationPlan();
      if (!plan || !page) return null;
      return options.videoTimeForPage(plan, page, options.getCurrentPhysicalPages());
    }

    async function drawExportBackground(ctx, layout, renderOptions = {}) {
      if (renderOptions.includeBackground) {
        ctx.fillStyle = layout.page_background || '#ffffff';
        ctx.fillRect(0, 0, layout.page_width, layout.page_height);
      }
      const videoTime = Number(renderOptions.videoTime);
      if (renderOptions.includeVideo && Number.isFinite(videoTime) && videoTime >= 0) {
        await options.drawReferenceVideoFrame(ctx, layout, videoTime);
      }
    }

    function pageHasActiveAnimation(page) {
      const animation = page && page.cartela && page.cartela.animation;
      if (!animation || animation.enabled === false) return false;
      const properties = animation.properties && typeof animation.properties === 'object' ? animation.properties : {};
      return Object.values(properties).some((property) => property && property.animate !== false);
    }

    async function renderPageToPngBlob(page, layout, renderOptions = {}) {
      if (typeof options.ensureGlyphAlternateFontsReady === 'function') await options.ensureGlyphAlternateFontsReady();
      const canvas = documentRef.createElement('canvas');
      canvas.width = layout.page_width;
      canvas.height = layout.page_height;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      await drawExportBackground(ctx, layout, renderOptions);
      await options.drawCanvasPage(ctx, page, layout, renderOptions);
      if (renderOptions.includeMargins) {
        options.drawCanvasMarginOverlay(ctx, options.layoutForCartela(layout, page && page.cartela), 1);
      }
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('No se pudo crear el PNG.'));
        }, 'image/png');
      });
    }

    return {
      currentExportRenderOptions,
      currentVideoTimeForPage,
      exportMov,
      exportPngPages,
      exportScrollMovSequence,
      readExportPageSelection,
      resolveMovDestination,
      renderPageToPngBlob,
      renderScrollFrameToPngBlob,
    };
  }

  root.CreditosAppPageExport = {
    createAppPageExport,
  };
})(globalThis);
