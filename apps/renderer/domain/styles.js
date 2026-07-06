(function (root) {
  function createStyleDomain(dependencies = {}) {
    const {
      blockTypographyFields,
      normalizeBoolean,
      normalizeTitleTypographyOverrides,
      normalizeTextCapitalization,
      normalizeTypographyOverrides,
      normalizeVerticalAlign,
      safeStyleId,
    } = dependencies;

    function normalizeStyleCartela(value = {}) {
      return {
        orientation: ['horizontal', 'vertical'].includes(value.orientation) ? value.orientation : 'vertical',
        columns: Math.max(1, Number(value.columns) || 1),
        vertical_offset: Number(value.vertical_offset) || 0,
        duration: Math.max(0, Number(value.duration) || 0),
        line_spacing: Math.max(0.1, Number(value.line_spacing) || 1.12),
        column_gap: Math.max(0, Number(value.column_gap) || 0),
        role_name_gap: Math.max(0, Number(value.role_name_gap) || 0),
        source_group_gap: Math.max(0, Number(value.source_group_gap) || 0),
        block_gap: Math.max(0, Number(value.block_gap) || 0),
        block_title_gap: Math.max(0, Number(value.block_title_gap) || 0),
        page_top_margin: Math.max(0, Number(value.page_top_margin) || 0),
        page_bottom_margin: Math.max(0, Number(value.page_bottom_margin) || 0),
        page_left_margin: Math.max(0, Number(value.page_left_margin) || 0),
        page_right_margin: Math.max(0, Number(value.page_right_margin) || 0),
        repeat_block_titles: normalizeBoolean(value.repeat_block_titles, true),
        auto_text_wrap: normalizeBoolean(value.auto_text_wrap, false),
        text_capitalization: normalizeTextCapitalization(value.text_capitalization),
        use_protected_capitalization: normalizeBoolean(value.use_protected_capitalization, true),
      };
    }

    function normalizeStyleBlock(value = {}) {
      return {
        columns: Math.max(1, Number(value.columns) || 1),
        concatenate_rows: normalizeBoolean(value.concatenate_rows, false),
        force_role_name_columns: normalizeBoolean(value.force_role_name_columns, false),
        alignment: {
          ...(value.alignment || {}),
        },
        vertical_align: normalizeVerticalAlign(value.vertical_align),
        typography: normalizeTypographyOverrides(value.typography),
      };
    }

    function sanitizeStyleCartelaOverrides(value = {}) {
      const output = {};
      if (value.orientation !== undefined) output.orientation = ['horizontal', 'vertical'].includes(value.orientation) ? value.orientation : 'vertical';
      if (value.columns !== undefined) output.columns = Math.max(1, Number(value.columns) || 1);
      if (value.vertical_offset !== undefined) output.vertical_offset = Number(value.vertical_offset) || 0;
      if (value.duration !== undefined) output.duration = Math.max(0, Number(value.duration) || 0);
      if (value.line_spacing !== undefined) output.line_spacing = Math.max(0.1, Number(value.line_spacing) || 1.12);
      if (value.column_gap !== undefined) output.column_gap = Math.max(0, Number(value.column_gap) || 0);
      if (value.role_name_gap !== undefined) output.role_name_gap = Math.max(0, Number(value.role_name_gap) || 0);
      if (value.source_group_gap !== undefined) output.source_group_gap = Math.max(0, Number(value.source_group_gap) || 0);
      if (value.block_gap !== undefined) output.block_gap = Math.max(0, Number(value.block_gap) || 0);
      if (value.block_title_gap !== undefined) output.block_title_gap = Math.max(0, Number(value.block_title_gap) || 0);
      if (value.page_top_margin !== undefined) output.page_top_margin = Math.max(0, Number(value.page_top_margin) || 0);
      if (value.page_bottom_margin !== undefined) output.page_bottom_margin = Math.max(0, Number(value.page_bottom_margin) || 0);
      if (value.page_left_margin !== undefined) output.page_left_margin = Math.max(0, Number(value.page_left_margin) || 0);
      if (value.page_right_margin !== undefined) output.page_right_margin = Math.max(0, Number(value.page_right_margin) || 0);
      if (value.repeat_block_titles !== undefined) output.repeat_block_titles = normalizeBoolean(value.repeat_block_titles, true);
      if (value.auto_text_wrap !== undefined) output.auto_text_wrap = normalizeBoolean(value.auto_text_wrap, false);
      if (value.text_capitalization !== undefined) output.text_capitalization = normalizeTextCapitalization(value.text_capitalization);
      if (value.use_protected_capitalization !== undefined) output.use_protected_capitalization = normalizeBoolean(value.use_protected_capitalization, true);
      return output;
    }

    function sanitizeStyleBlockOverrides(value = {}) {
      const output = {};
      if (value.columns !== undefined) output.columns = Math.max(1, Number(value.columns) || 1);
      if (value.concatenate_rows !== undefined) output.concatenate_rows = normalizeBoolean(value.concatenate_rows, false);
      if (value.force_role_name_columns !== undefined) output.force_role_name_columns = normalizeBoolean(value.force_role_name_columns, false);
      if (value.alignment !== undefined) output.alignment = { ...(value.alignment || {}) };
      if (value.vertical_align !== undefined) output.vertical_align = normalizeVerticalAlign(value.vertical_align);
      if (value.typography !== undefined) output.typography = normalizeTypographyOverrides(value.typography);
      return output;
    }

    function normalizeCartelaStyle(json, file = {}) {
      const fileBase = String(file.name || 'estilo.json').replace(/\.json$/i, '');
      const id = safeStyleId(json.id || fileBase);
      return {
        schema: 'credits_cartela_style_json',
        version: 2,
        id,
        name: String(json.name || fileBase || id),
        file_name: file.name || `${id}.json`,
        filePath: file.filePath || null,
        fileHandle: file.handle || null,
        cartela: sanitizeStyleCartelaOverrides(json.cartela || json),
        title_typography: normalizeTitleTypographyOverrides(json.title_typography || {}),
        block: sanitizeStyleBlockOverrides(json.block || {}),
      };
    }

    function getEffectiveStyleCartela(style, settings) {
      return {
        ...baseStyleCartelaFromSettings(settings),
        ...sanitizeStyleCartelaOverrides(style && style.cartela ? style.cartela : {}),
      };
    }

    function getEffectiveStyleTitleTypography(style, settings) {
      const base = settings.typography.page_header;
      const overrides = normalizeTitleTypographyOverrides(style && style.title_typography ? style.title_typography : {});
      return {
        page_header: {
          ...base,
          ...(overrides.page_header || {}),
        },
      };
    }

    function getEffectiveCartelaTitleTypography(cartela, style, settings) {
      const upper = getEffectiveStyleTitleTypography(style, settings).page_header;
      const overrides = normalizeTitleTypographyOverrides(cartela && cartela.title_typography ? cartela.title_typography : {});
      return {
        page_header: {
          ...upper,
          ...(overrides.page_header || {}),
        },
      };
    }

    function baseStyleCartelaFromSettings(settings) {
      return normalizeStyleCartela({
        orientation: 'vertical',
        columns: 1,
        vertical_offset: 0,
        duration: settings.default_cartela_duration,
        line_spacing: settings.layout.line_spacing,
        column_gap: settings.layout.column_gap,
        role_name_gap: settings.layout.role_name_gap,
        source_group_gap: settings.layout.source_group_gap,
        block_gap: settings.layout.block_gap,
        block_title_gap: settings.layout.block_title_gap,
        page_top_margin: settings.layout.page_top_margin,
        page_bottom_margin: settings.layout.page_bottom_margin,
        page_left_margin: settings.layout.page_left_margin,
        page_right_margin: settings.layout.page_right_margin,
        repeat_block_titles: settings.layout.repeat_block_titles,
        auto_text_wrap: settings.layout.auto_text_wrap,
        text_capitalization: settings.text_capitalization,
        use_protected_capitalization: settings.use_protected_capitalization,
      });
    }

    function getEffectiveStyleBlock(style, settings) {
      const base = normalizeStyleBlock({
        typography: Object.fromEntries(blockTypographyFields.map(([key]) => [key, settings.typography[key]])),
      });
      const overrides = sanitizeStyleBlockOverrides(style && style.block ? style.block : {});
      return normalizeStyleBlock({
        ...base,
        ...overrides,
        alignment: {
          ...(base.alignment || {}),
          ...(overrides.alignment || {}),
        },
        typography: {
          ...(base.typography || {}),
          ...(overrides.typography || {}),
        },
      });
    }

    function serializeCartelaStyle(style) {
      return {
        schema: 'credits_cartela_style_json',
        version: 2,
        id: style.id,
        name: style.name,
        cartela: sanitizeStyleCartelaOverrides(style.cartela || {}),
        title_typography: normalizeTitleTypographyOverrides(style.title_typography || {}),
        block: sanitizeStyleBlockOverrides(style.block || {}),
      };
    }

    return {
      baseStyleCartelaFromSettings,
      getEffectiveCartelaTitleTypography,
      getEffectiveStyleBlock,
      getEffectiveStyleCartela,
      getEffectiveStyleTitleTypography,
      normalizeCartelaStyle,
      normalizeStyleCartela,
      normalizeStyleBlock,
      sanitizeStyleCartelaOverrides,
      sanitizeStyleBlockOverrides,
      serializeCartelaStyle,
      sameStyleValue,
    };
  }

  function sameStyleValue(a, b) {
    if (a === undefined && b === undefined) return true;
    if (a === undefined || b === undefined) return false;
    return JSON.stringify(a) === JSON.stringify(b);
  }

  root.CreditosDomainStyles = {
    createStyleDomain,
    sameStyleValue,
  };
})(globalThis);
