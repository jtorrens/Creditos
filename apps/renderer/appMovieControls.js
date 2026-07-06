(function (root) {
  function createAppMovieControls(options = {}) {
    const state = options.state;
    const els = options.els;
    const windowRef = options.windowRef || root;

    function currentMovieFps() {
      return options.getMovieFps(options.getProductionSettings());
    }

    function normalizeDurationInputElement(input, fps) {
      const result = options.normalizeDurationInputValueInDomain(input && input.value, fps);
      if (result === null) return null;
      if (input) input.value = result.value;
      return result.frames;
    }

    function readMovieSegmentSettings(fps) {
      return options.normalizeMovieSegmentSettings(selectedMovieGroupCount(), {
        preCount: els.moviePrerollCountInput && els.moviePrerollCountInput.value,
        postCount: els.moviePostrollCountInput && els.moviePostrollCountInput.value,
        preFrames: normalizeDurationInputElement(els.moviePrerollDurationInput, fps) || 0,
        postFrames: normalizeDurationInputElement(els.moviePostrollDurationInput, fps) || 0,
      });
    }

    function updateMovieSegmentInputs() {
      const fps = currentMovieFps();
      const groupCount = Math.max(0, selectedMovieGroupCount());
      const settings = readMovieSegmentSettings(fps);
      if (els.moviePrerollCountInput) els.moviePrerollCountInput.value = String(settings.preCount);
      if (els.moviePostrollCountInput) els.moviePostrollCountInput.value = String(settings.postCount);
      if (els.moviePrerollDurationInput) {
        els.moviePrerollDurationInput.disabled = settings.preCount === 0 || groupCount === 0;
        els.moviePrerollDurationInput.value = options.formatFrameDuration(settings.preFrames, fps);
      }
      if (els.moviePostrollDurationInput) {
        els.moviePostrollDurationInput.disabled = settings.postCount === 0 || groupCount === 0;
        els.moviePostrollDurationInput.value = options.formatFrameDuration(settings.postFrames, fps);
      }
      updateMovieDurationFields();
      options.renderPdfPreview();
      options.savePreviewSettingsFromUi();
    }

    function getSelectedMoviePages() {
      if (!state.render || !state.structure) return [];
      const pages = options.getCurrentPhysicalPages();
      const selection = options.readExportPageSelection(pages);
      return options.moviePageItems(selection.pages, selection.start);
    }

    function getSelectedMoviePageGroups() {
      return options.groupMoviePageItemsByCartela(getSelectedMoviePages());
    }

    function getSelectedMovieGroupFrameCounts(fps) {
      return options.movieGroupFrameCounts(getSelectedMoviePageGroups(), fps);
    }

    function getMovieMode() {
      return els.movieModeSelect && els.movieModeSelect.value === 'scroll' ? 'scroll' : 'pages';
    }

    function getSelectedScrollCartelaGroups() {
      if (!state.render || !state.structure) return [];
      return options.groupPhysicalPagesByCartela(options.getCurrentPhysicalPages());
    }

    function selectedMovieGroupCount() {
      return getMovieMode() === 'scroll'
        ? getSelectedScrollCartelaGroups().length
        : getSelectedMoviePageGroups().length;
    }

    function getSelectedScrollSourceFrames(fps) {
      return options.scrollSourceFrameCounts(getSelectedScrollCartelaGroups(), fps);
    }

    function updateMovieDurationFields(commandOptions = {}) {
      if (!els.movieRangeDurationInput || !els.movieTargetDurationInput) return;
      const fps = currentMovieFps();
      const frames = getMovieMode() === 'scroll' ? getSelectedScrollSourceFrames(fps) : getSelectedMovieGroupFrameCounts(fps);
      const segments = readMovieSegmentSettings(fps);
      const summary = options.movieDurationFrameSummary(frames, segments);
      const formatted = options.formatFrameDuration(summary.totalFrames, fps);
      const bodyFormatted = options.formatFrameDuration(summary.bodyFrames, fps);
      const disabled = frames.length === 0;
      els.movieRangeDurationInput.disabled = disabled;
      els.movieTargetDurationInput.disabled = disabled;
      els.movieRangeDurationInput.value = formatted;
      if (commandOptions.resetTarget || disabled || !els.movieTargetDurationInput.value || els.movieTargetDurationInput.dataset.auto !== '0') {
        els.movieTargetDurationInput.value = bodyFormatted;
        els.movieTargetDurationInput.dataset.auto = '1';
      }
      options.updateReferenceVideoDurationField();
    }

    function validateMovieTargetDuration() {
      if (!els.movieTargetDurationInput || !state.render || !state.structure) return;
      const fps = currentMovieFps();
      const targetFrames = options.parseFrameDuration(els.movieTargetDurationInput.value, fps);
      if (targetFrames === null) {
        windowRef.alert(`Introduce la duración como mm:ss:ff. Para ${fps} fps, ff debe estar entre 00 y ${String(fps - 1).padStart(2, '0')}.`);
        updateMovieDurationFields({ resetTarget: true });
        return;
      }
      const segments = readMovieSegmentSettings(fps);
      const fittedTargetFrames = options.fitMovieTargetFrames(targetFrames, selectedMovieGroupCount(), segments);
      els.movieTargetDurationInput.value = options.formatFrameDuration(fittedTargetFrames, fps);
      const sourceFrames = getMovieMode() === 'scroll' ? getSelectedScrollSourceFrames(fps) : getSelectedMovieGroupFrameCounts(fps);
      els.movieTargetDurationInput.dataset.auto = fittedTargetFrames === options.movieBodySourceTotal(sourceFrames, segments) ? '1' : '0';
      options.savePreviewSettingsFromUi();
    }

    function movieTargetDurationFrames(fps) {
      return els.movieTargetDurationInput ? options.parseFrameDuration(els.movieTargetDurationInput.value, fps) : null;
    }

    function movieUsesCustomTargetDuration() {
      return !!(els.movieTargetDurationInput && els.movieTargetDurationInput.dataset.auto === '0');
    }

    return {
      currentMovieFps,
      getMovieMode,
      getSelectedMovieGroupFrameCounts,
      getSelectedMoviePageGroups,
      getSelectedMoviePages,
      getSelectedScrollCartelaGroups,
      getSelectedScrollSourceFrames,
      movieTargetDurationFrames,
      movieUsesCustomTargetDuration,
      normalizeDurationInputElement,
      readMovieSegmentSettings,
      selectedMovieGroupCount,
      updateMovieDurationFields,
      updateMovieSegmentInputs,
      validateMovieTargetDuration,
    };
  }

  root.CreditosAppMovieControls = {
    createAppMovieControls,
  };
})(globalThis);
