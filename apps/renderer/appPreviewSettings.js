(function (root) {
  function createAppPreviewSettings(options = {}) {
    const els = options.els;
    const state = options.state;

    function selectedRenderCodec() {
      return options.normalizeRenderCodec(els.movieCodecSelect && els.movieCodecSelect.value);
    }

    function selectedRenderProfile() {
      return options.normalizeRenderProfile(
        els.movieEncodingProfileSelect && els.movieEncodingProfileSelect.value,
        selectedRenderCodec()
      );
    }

    function currentPreviewSettingsFromUi() {
      const settings = options.normalizePreviewSettings(state.structure && state.structure.preview_settings ? state.structure.preview_settings : {});
      return options.normalizePreviewSettings({
        ...settings,
        movie_mode: options.getMovieMode(),
        render_codec: selectedRenderCodec(),
        render_profile: selectedRenderProfile(),
        range_from: Number(els.exportFromPageInput && els.exportFromPageInput.value) || settings.range_from,
        range_to: Number(els.exportToPageInput && els.exportToPageInput.value) || settings.range_to,
        range_manual: !!(els.exportFromPageInput && els.exportFromPageInput.dataset.manual === '1') || !!(els.exportToPageInput && els.exportToPageInput.dataset.manual === '1'),
        target_duration: els.movieTargetDurationInput ? els.movieTargetDurationInput.value : settings.target_duration,
        target_duration_manual: !!(els.movieTargetDurationInput && els.movieTargetDurationInput.dataset.auto === '0'),
        preroll_count: Number(els.moviePrerollCountInput && els.moviePrerollCountInput.value) || 0,
        preroll_duration: els.moviePrerollDurationInput ? els.moviePrerollDurationInput.value : settings.preroll_duration,
        postroll_count: Number(els.moviePostrollCountInput && els.moviePostrollCountInput.value) || 0,
        postroll_duration: els.moviePostrollDurationInput ? els.moviePostrollDurationInput.value : settings.postroll_duration,
        show_reference_video: !!state.showPreviewReferenceVideo,
        include_background: !!state.exportIncludeBackground,
        include_video: !!state.exportIncludeVideo,
        include_margins: !!state.exportIncludeMargins,
        show_margins: !!state.showMarginOverlay,
      });
    }

    function savePreviewSettingsFromUi() {
      if (!state.structure) return;
      state.structure.preview_settings = currentPreviewSettingsFromUi();
      options.scheduleAutosave();
    }

    function applyPreviewSettingsToUi(settingsValue) {
      const settings = options.normalizePreviewSettings(settingsValue);
      if (els.movieModeSelect) els.movieModeSelect.value = settings.movie_mode;
      if (els.movieCodecSelect) els.movieCodecSelect.value = settings.render_codec;
      renderMovieEncodingProfiles(settings.render_codec, settings.render_profile);
      if (els.exportFromPageInput) {
        els.exportFromPageInput.value = String(settings.range_from);
        els.exportFromPageInput.dataset.manual = settings.range_manual ? '1' : '0';
      }
      if (els.exportToPageInput) {
        els.exportToPageInput.value = String(settings.range_to);
        els.exportToPageInput.dataset.manual = settings.range_manual ? '1' : '0';
      }
      if (els.movieTargetDurationInput) {
        els.movieTargetDurationInput.value = settings.target_duration || '';
        els.movieTargetDurationInput.dataset.auto = settings.target_duration_manual ? '0' : '1';
      }
      if (els.moviePrerollCountInput) els.moviePrerollCountInput.value = String(settings.preroll_count);
      if (els.moviePrerollDurationInput) els.moviePrerollDurationInput.value = settings.preroll_duration;
      if (els.moviePostrollCountInput) els.moviePostrollCountInput.value = String(settings.postroll_count);
      if (els.moviePostrollDurationInput) els.moviePostrollDurationInput.value = settings.postroll_duration;
      state.showPreviewReferenceVideo = !!settings.show_reference_video;
      state.exportIncludeBackground = !!settings.include_background;
      state.exportIncludeVideo = !!settings.include_video;
      state.exportIncludeMargins = !!settings.include_margins;
      state.showMarginOverlay = !!settings.show_margins;
      if (els.showPreviewReferenceVideoInput) els.showPreviewReferenceVideoInput.checked = state.showPreviewReferenceVideo;
      if (els.exportIncludeBackgroundInput) els.exportIncludeBackgroundInput.checked = state.exportIncludeBackground;
      if (els.exportIncludeVideoInput) els.exportIncludeVideoInput.checked = state.exportIncludeVideo;
      if (els.exportIncludeMarginsInput) els.exportIncludeMarginsInput.checked = state.exportIncludeMargins;
      ensureBackgroundForEncodingProfile();
      if (els.toggleMarginsBtn) {
        els.toggleMarginsBtn.classList.toggle('active-toggle', state.showMarginOverlay);
        els.toggleMarginsBtn.textContent = state.showMarginOverlay ? 'Ocultar márgenes' : 'Mostrar márgenes';
      }
    }

    function renderMovieEncodingProfiles(codecValue, selectedValue) {
      if (!els.movieEncodingProfileSelect) return;
      const codec = options.normalizeRenderCodec(codecValue);
      const selected = options.normalizeRenderProfile(selectedValue, codec);
      els.movieEncodingProfileSelect.innerHTML = '';
      options.encodingProfilesForCodec(codec).forEach(([value, label]) => {
        const option = options.documentRef.createElement('option');
        option.value = value;
        option.textContent = label;
        els.movieEncodingProfileSelect.appendChild(option);
      });
      els.movieEncodingProfileSelect.value = selected;
    }

    function ensureBackgroundForEncodingProfile() {
      if (options.renderProfileSupportsAlpha(selectedRenderProfile())) return;
      state.exportIncludeBackground = true;
      if (els.exportIncludeBackgroundInput) els.exportIncludeBackgroundInput.checked = true;
    }

    return {
      applyPreviewSettingsToUi,
      currentPreviewSettingsFromUi,
      ensureBackgroundForEncodingProfile,
      renderMovieEncodingProfiles,
      savePreviewSettingsFromUi,
      selectedRenderCodec,
      selectedRenderProfile,
    };
  }

  root.CreditosAppPreviewSettings = {
    createAppPreviewSettings,
  };
})(globalThis);
