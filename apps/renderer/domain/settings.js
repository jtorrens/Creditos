(function (root) {
  function createSettingsDomain(dependencies = {}) {
    const {
      languageLocales,
      languageOptions,
      normalizeBoolean,
      normalizeColor,
      safeFilePart,
      textCapitalizationOptions,
      titleMinorWords,
      typographyFields,
    } = dependencies;

    function defaultSettings() {
      return {
        default_cartela_duration: 4,
        default_auto_page_lines: 18,
        movie_fps: 25,
        pdf_base_name: 'creditos',
        language: 'es',
        text_capitalization: 'source',
        protected_capitalizations: '',
        use_protected_capitalization: true,
        typography: {
          page_header: { font_size: 12, font_family: 'Arial', font_style: 'Regular', font_postscript_name: '', color: '#58616a' },
          block_title: { font_size: 16, font_family: 'Arial', font_style: 'Regular', font_postscript_name: '', color: '#24545f' },
          role: { font_size: 14, font_family: 'Arial', font_style: 'Regular', font_postscript_name: '', color: '#171b1f' },
          name: { font_size: 14, font_family: 'Arial', font_style: 'Regular', font_postscript_name: '', color: '#171b1f' },
        },
        layout: {
          line_spacing: 1.12,
          column_gap: 14,
          role_name_gap: 6,
          source_group_gap: 0,
          page_top_margin: 80,
          page_bottom_margin: 58,
          page_left_margin: 68,
          page_right_margin: 68,
          page_width: 1920,
          page_height: 1080,
          page_background: '#ffffff',
          block_gap: 10,
          block_title_gap: 10,
          scroll_page_gap: 0,
          scroll_last_page_gap: 0,
          scroll_fade_up: 0,
          scroll_fade_down: 0,
          repeat_block_titles: true,
          auto_text_wrap: false,
        },
      };
    }

    function normalizeSettings(settings = {}) {
      const defaults = defaultSettings();
      const hasBlockTitleGap = !!(settings && settings.layout && settings.layout.block_title_gap !== undefined);
      const normalized = {
        ...defaults,
        ...settings,
        typography: {
          ...defaults.typography,
          ...(settings.typography || {}),
        },
        layout: {
          ...defaults.layout,
          ...(settings.layout || {}),
        },
      };
      typographyFields.forEach(([key]) => {
        normalized.typography[key] = {
          ...defaults.typography[key],
          ...(settings.typography && settings.typography[key] ? settings.typography[key] : {}),
        };
        normalized.typography[key].font_size = Math.max(1, Number(normalized.typography[key].font_size) || defaults.typography[key].font_size);
        normalized.typography[key].font_family = normalized.typography[key].font_family || defaults.typography[key].font_family;
        normalized.typography[key].font_style = normalized.typography[key].font_style || defaults.typography[key].font_style;
        normalized.typography[key].font_postscript_name = normalized.typography[key].font_postscript_name || '';
        normalized.typography[key].color = normalized.typography[key].color || defaults.typography[key].color;
      });
      normalized.layout.line_spacing = Math.max(0.1, Number(normalized.layout.line_spacing) || defaults.layout.line_spacing);
      normalized.layout.column_gap = Math.max(0, Number(normalized.layout.column_gap) || defaults.layout.column_gap);
      normalized.layout.role_name_gap = Math.max(0, Number(normalized.layout.role_name_gap) || defaults.layout.role_name_gap);
      normalized.layout.source_group_gap = Math.max(0, Number.isFinite(Number(normalized.layout.source_group_gap)) ? Number(normalized.layout.source_group_gap) : defaults.layout.source_group_gap);
      normalized.layout.page_top_margin = Math.max(0, Number(normalized.layout.page_top_margin) || defaults.layout.page_top_margin);
      normalized.layout.page_bottom_margin = Math.max(0, Number(normalized.layout.page_bottom_margin) || defaults.layout.page_bottom_margin);
      normalized.layout.page_left_margin = Math.max(0, Number.isFinite(Number(normalized.layout.page_left_margin)) ? Number(normalized.layout.page_left_margin) : defaults.layout.page_left_margin);
      normalized.layout.page_right_margin = Math.max(0, Number.isFinite(Number(normalized.layout.page_right_margin)) ? Number(normalized.layout.page_right_margin) : defaults.layout.page_right_margin);
      normalized.layout.page_width = Math.max(1, Number(normalized.layout.page_width) || defaults.layout.page_width);
      normalized.layout.page_height = Math.max(1, Number(normalized.layout.page_height) || defaults.layout.page_height);
      normalized.layout.page_background = normalizeColor(normalized.layout.page_background || defaults.layout.page_background);
      normalized.layout.block_gap = Math.max(0, Number.isFinite(Number(normalized.layout.block_gap)) ? Number(normalized.layout.block_gap) : defaults.layout.block_gap);
      normalized.layout.block_title_gap = hasBlockTitleGap
        ? Math.max(0, Number.isFinite(Number(normalized.layout.block_title_gap)) ? Number(normalized.layout.block_title_gap) : defaults.layout.block_title_gap)
        : normalized.layout.block_gap;
      normalized.layout.scroll_page_gap = Math.max(0, Number.isFinite(Number(normalized.layout.scroll_page_gap)) ? Number(normalized.layout.scroll_page_gap) : defaults.layout.scroll_page_gap);
      normalized.layout.scroll_last_page_gap = Math.max(0, Number.isFinite(Number(normalized.layout.scroll_last_page_gap)) ? Number(normalized.layout.scroll_last_page_gap) : defaults.layout.scroll_last_page_gap);
      normalized.layout.scroll_fade_up = Math.max(0, Number.isFinite(Number(normalized.layout.scroll_fade_up)) ? Number(normalized.layout.scroll_fade_up) : defaults.layout.scroll_fade_up);
      normalized.layout.scroll_fade_down = Math.max(0, Number.isFinite(Number(normalized.layout.scroll_fade_down)) ? Number(normalized.layout.scroll_fade_down) : defaults.layout.scroll_fade_down);
      normalized.layout.repeat_block_titles = normalizeBoolean(normalized.layout.repeat_block_titles, defaults.layout.repeat_block_titles);
      normalized.layout.auto_text_wrap = normalizeBoolean(normalized.layout.auto_text_wrap, defaults.layout.auto_text_wrap);
      normalized.language = normalizeLanguage(normalized.language);
      normalized.text_capitalization = normalizeTextCapitalization(normalized.text_capitalization);
      normalized.protected_capitalizations = normalizeProtectedCapitalizationText(normalized.protected_capitalizations);
      normalized.use_protected_capitalization = normalizeBoolean(normalized.use_protected_capitalization, defaults.use_protected_capitalization);
      normalized.movie_fps = Math.max(1, Math.round(Number(normalized.movie_fps) || defaults.movie_fps));
      normalized.pdf_base_name = safeFilePart(normalized.pdf_base_name || defaults.pdf_base_name);
      return normalized;
    }

    function settingsWithProductionLayout(settings = {}, productionLayout = {}) {
      const normalized = normalizeSettings(settings || {});
      return {
        ...normalized,
        layout: {
          ...normalized.layout,
          page_width: Math.max(1, Number(productionLayout.page_width) || normalized.layout.page_width),
          page_height: Math.max(1, Number(productionLayout.page_height) || normalized.layout.page_height),
          page_background: normalizeColor(productionLayout.preview_background || productionLayout.page_background || normalized.layout.page_background),
        },
      };
    }

    function stripProductionLayoutFromSettings(settings) {
      const output = normalizeSettings(settings || {});
      if (output.layout) {
        delete output.layout.page_width;
        delete output.layout.page_height;
        delete output.layout.page_background;
      }
      return output;
    }

    function selectedProductionHasStoredSettings(production) {
      return !!(production && production.settings && Object.keys(production.settings).length);
    }

    function transformCartelaText(text, cartela, settings) {
      const normalizedSettings = normalizeSettings(settings || {});
      const capitalization = normalizeTextCapitalization(
        cartela && cartela.text_capitalization !== undefined
          ? cartela.text_capitalization
          : normalizedSettings.text_capitalization
      );
      return applyTextCapitalization(
        text,
        capitalization,
        normalizedSettings.language,
        normalizedSettings.protected_capitalizations,
        cartela && cartela.use_protected_capitalization !== undefined
          ? cartela.use_protected_capitalization
          : normalizedSettings.use_protected_capitalization
      );
    }

    function normalizeLanguage(value) {
      const key = String(value || 'es').toLowerCase();
      return languageOptions.some(([option]) => option === key) ? key : 'es';
    }

    function normalizeTextCapitalization(value) {
      const key = String(value || 'source').toLowerCase();
      return textCapitalizationOptions.some(([option]) => option === key) ? key : 'source';
    }

    function localeForLanguage(language) {
      return languageLocales[normalizeLanguage(language)] || languageLocales.es;
    }

    function normalizeProtectedCapitalizationTerms(value) {
      const source = Array.isArray(value) ? value : String(value || '').split(/[\n,]+/);
      const seen = new Set();
      return source
        .map((term) => String(term || '').trim())
        .filter(Boolean)
        .filter((term) => {
          const key = term.toLocaleLowerCase('es-ES');
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a, b) => b.length - a.length);
    }

    function normalizeProtectedCapitalizationText(value) {
      return normalizeProtectedCapitalizationTerms(value).join(', ');
    }

    function applyProtectedCapitalizations(text, terms, enabled = true) {
      if (!enabled) return String(text || '');
      return normalizeProtectedCapitalizationTerms(terms).reduce((output, term) => {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'giu');
        return output.replace(pattern, term);
      }, String(text || ''));
    }

    function applyTextCapitalization(text, capitalization, language, protectedTerms = [], useProtected = true) {
      const source = String(text || '');
      const mode = normalizeTextCapitalization(capitalization);
      const locale = localeForLanguage(language);
      if (mode === 'uppercase') return applyProtectedCapitalizations(source.toLocaleUpperCase(locale), protectedTerms, useProtected);
      if (mode === 'lowercase') return applyProtectedCapitalizations(source.toLocaleLowerCase(locale), protectedTerms, useProtected);
      if (mode === 'title' || mode === 'title_editorial') {
        const minorWords = mode === 'title_editorial' ? titleMinorWords[normalizeLanguage(language)] || new Set() : new Set();
        let wordIndex = 0;
        const capitalized = source.replace(/\p{L}[\p{L}\p{M}'’.]*/gu, (word) => {
          const lower = word.toLocaleLowerCase(locale);
          const isMinor = wordIndex > 0 && minorWords.has(lower);
          wordIndex += 1;
          if (isDottedInitialism(word)) return word.toLocaleUpperCase(locale);
          return isMinor ? lower : capitalizeWord(lower, locale);
        });
        return applyProtectedCapitalizations(capitalized, protectedTerms, useProtected);
      }
      return applyProtectedCapitalizations(source, protectedTerms, useProtected);
    }

    function capitalizeWord(word, locale) {
      return String(word || '').replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase(locale));
    }

    function isDottedInitialism(word) {
      return /^\p{L}(?:\.\p{L})+\.?$/u.test(String(word || ''));
    }

    return {
      applyProtectedCapitalizations,
      applyTextCapitalization,
      defaultSettings,
      localeForLanguage,
      normalizeLanguage,
      normalizeProtectedCapitalizationTerms,
      normalizeProtectedCapitalizationText,
      normalizeSettings,
      selectedProductionHasStoredSettings,
      normalizeTextCapitalization,
      settingsWithProductionLayout,
      stripProductionLayoutFromSettings,
      transformCartelaText,
    };
  }

  root.CreditosDomainSettings = {
    createSettingsDomain,
  };
})(globalThis);
