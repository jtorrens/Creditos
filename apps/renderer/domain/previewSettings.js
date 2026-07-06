(function (root) {
  function createPreviewSettingsDomain(dependencies = {}) {
    const {
      movEncodingProfiles,
    } = dependencies;

    function defaultPreviewSettings() {
      return {
        movie_mode: 'pages',
        render_codec: 'prores',
        render_profile: 'prores_4444',
        range_from: 1,
        range_to: 1,
        range_manual: false,
        target_duration: '',
        target_duration_manual: false,
        preroll_count: 0,
        preroll_duration: '00:00:00',
        postroll_count: 0,
        postroll_duration: '00:00:00',
        show_reference_video: false,
        include_background: false,
        include_video: false,
        include_margins: false,
        show_margins: false,
      };
    }

    function normalizePreviewSettings(value = {}) {
      const defaults = defaultPreviewSettings();
      return {
        ...defaults,
        ...value,
        movie_mode: value.movie_mode === 'scroll' ? 'scroll' : 'pages',
        render_codec: normalizeRenderCodec(value.render_codec),
        render_profile: normalizeRenderProfile(value.render_profile, value.render_codec),
        range_from: Math.max(1, Math.round(Number(value.range_from) || defaults.range_from)),
        range_to: Math.max(1, Math.round(Number(value.range_to) || defaults.range_to)),
        range_manual: !!value.range_manual,
        target_duration: String(value.target_duration || ''),
        target_duration_manual: !!value.target_duration_manual,
        preroll_count: Math.max(0, Math.round(Number(value.preroll_count) || 0)),
        preroll_duration: String(value.preroll_duration || defaults.preroll_duration),
        postroll_count: Math.max(0, Math.round(Number(value.postroll_count) || 0)),
        postroll_duration: String(value.postroll_duration || defaults.postroll_duration),
        show_reference_video: !!value.show_reference_video,
        include_background: !!value.include_background,
        include_video: !!value.include_video,
        include_margins: !!value.include_margins,
        show_margins: !!value.show_margins,
      };
    }

    function normalizeRenderCodec(value) {
      return value === 'h264' ? 'h264' : 'prores';
    }

    function normalizeRenderProfile(value, codecValue) {
      const codec = normalizeRenderCodec(codecValue || (String(value || '').startsWith('h264_') ? 'h264' : 'prores'));
      const profiles = movEncodingProfiles[codec] || movEncodingProfiles.prores;
      return profiles.some(([profile]) => profile === value)
        ? value
        : (codec === 'h264' ? 'h264_standard' : 'prores_4444');
    }

    return {
      defaultPreviewSettings,
      normalizePreviewSettings,
      normalizeRenderCodec,
      normalizeRenderProfile,
    };
  }

  root.CreditosDomainPreviewSettings = {
    createPreviewSettingsDomain,
  };
})(globalThis);
