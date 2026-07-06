(function (root) {
  function createAppReferenceVideo(options = {}) {
    const els = options.els;
    const state = options.state;
    const storageKeys = options.storageKeys || {};
    const windowRef = options.windowRef || root;

    function updateReferenceVideoStatus() {
      const video = state.referenceVideo;
      const hasEpisode = !!(state.selectedProductionId && state.selectedEpisodeId);
      if (els.referenceVideoStatus) {
        els.referenceVideoStatus.textContent = video && video.name
          ? `Vídeo referencia: ${video.name}`
          : 'Sin vídeo de referencia';
      }
      if (els.openReferenceVideoBtn) {
        els.openReferenceVideoBtn.disabled = !hasEpisode;
        els.openReferenceVideoBtn.textContent = video ? 'Cambiar vídeo' : 'Asociar vídeo';
      }
      if (els.clearReferenceVideoBtn) {
        els.clearReferenceVideoBtn.disabled = !hasEpisode || !video;
      }
      if (els.showPreviewReferenceVideoInput) {
        els.showPreviewReferenceVideoInput.disabled = !video;
        els.showPreviewReferenceVideoInput.checked = !!(video && state.showPreviewReferenceVideo);
      }
      if (els.showCartelaReferenceVideoInput) {
        els.showCartelaReferenceVideoInput.disabled = !video;
        els.showCartelaReferenceVideoInput.checked = !!(video && state.showCartelaReferenceVideo);
      }
      if (els.exportIncludeVideoInput) {
        els.exportIncludeVideoInput.disabled = !video;
        els.exportIncludeVideoInput.checked = !!(video && state.exportIncludeVideo);
      }
      updateReferenceVideoDurationField();
      if (video && state.referenceVideoDuration === null) loadReferenceVideoDuration().catch((error) => console.warn(error));
    }

    function updateReferenceVideoDurationField() {
      if (!els.referenceVideoDurationInput) return;
      const duration = Number(state.referenceVideoDuration);
      if (!state.referenceVideo || !Number.isFinite(duration) || duration <= 0) {
        els.referenceVideoDurationInput.value = '--:--:--';
        return;
      }
      els.referenceVideoDurationInput.value = options.formatSecondsAsFrameDuration(duration, options.currentMovieFps());
    }

    function clearReferenceVideoState() {
      state.referenceVideoElement = null;
      state.referenceVideoSrc = '';
      state.referenceVideoCanvasElement = null;
      state.referenceVideoCanvasSrc = '';
      state.referenceVideoDuration = null;
    }

    async function associateReferenceVideo() {
      if (!state.databasePath || !state.selectedProductionId || !state.selectedEpisodeId) {
        windowRef.alert('Selecciona producción y episodio antes de asociar un vídeo.');
        return;
      }
      const native = options.nativeBridge();
      if (!native || !native.openReferenceVideo) {
        windowRef.alert('El selector de vídeo solo está disponible desde la app de escritorio.');
        return;
      }
      try {
        const result = await native.openReferenceVideo({ defaultPath: options.readLocalPreference(storageKeys.referenceVideoDir) });
        if (!result || result.canceled) return;
        options.rememberFileDirectory(storageKeys.referenceVideoDir, result.filePath);
        state.referenceVideo = options.normalizeReferenceVideo({
          schema: 'credits_reference_video',
          version: 1,
          name: result.name || 'video',
          file_path: result.filePath,
        });
        clearReferenceVideoState();
        await persistReferenceVideo();
        updateReferenceVideoStatus();
        options.renderPreview();
        options.refreshPdfIfActive();
      } catch (error) {
        windowRef.alert('No se pudo asociar el vídeo de referencia: ' + error.message);
      }
    }

    async function clearReferenceVideo() {
      if (!state.databasePath || !state.selectedProductionId || !state.selectedEpisodeId) return;
      state.referenceVideo = null;
      clearReferenceVideoState();
      await persistReferenceVideo();
      updateReferenceVideoStatus();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    async function loadReferenceVideoDuration() {
      const video = options.normalizeReferenceVideo(state.referenceVideo);
      if (!video || !video.file_path) {
        state.referenceVideoDuration = null;
        updateReferenceVideoDurationField();
        return null;
      }
      const videoEl = await options.referenceVideoForCanvas();
      const duration = Number(videoEl.duration);
      state.referenceVideoDuration = Number.isFinite(duration) && duration > 0 ? duration : null;
      updateReferenceVideoDurationField();
      return state.referenceVideoDuration;
    }

    async function persistReferenceVideo() {
      await options.dbPost('/api/db/save-document', {
        production_id: state.selectedProductionId,
        episode_id: state.selectedEpisodeId,
        kind: 'reference',
        data: state.referenceVideo || {},
      });
    }

    return {
      associateReferenceVideo,
      clearReferenceVideo,
      loadReferenceVideoDuration,
      persistReferenceVideo,
      updateReferenceVideoDurationField,
      updateReferenceVideoStatus,
    };
  }

  root.CreditosAppReferenceVideo = {
    createAppReferenceVideo,
  };
})(globalThis);
