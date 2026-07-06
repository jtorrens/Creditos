(function (root) {
  function createStyleDomain(dependencies = {}) {
    const {
      blockTypographyFields,
      getEffectiveCartelaBlockStyle,
      normalizeBoolean,
      normalizeColor,
      normalizeTextCapitalization,
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
        typography: mergeBlockTypography(base.typography, overrides.typography),
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

    function explicitCartelaTitleTypography(rawTypography, upperTypography = {}) {
      const output = {};
      const normalized = normalizeTitleTypographyOverrides(rawTypography);
      const value = normalized.page_header || {};
      Object.keys(value).forEach((key) => {
        if (sameStyleValue(value[key], upperTypography && upperTypography[key])) return;
        output.page_header = output.page_header || {};
        output.page_header[key] = clonePlainValue(value[key]);
      });
      return output;
    }

    function explicitCartelaBlockStyle(rawBlockStyle, upperBlockStyle = {}) {
      const output = {};
      if (!rawBlockStyle) return output;
      const normalized = sanitizeStyleBlockOverrides(rawBlockStyle);
      if (Object.prototype.hasOwnProperty.call(rawBlockStyle, 'columns') && !sameStyleValue(normalized.columns, upperBlockStyle.columns)) {
        output.columns = normalized.columns;
      }
      if (Object.prototype.hasOwnProperty.call(rawBlockStyle, 'vertical_align') && !sameStyleValue(normalized.vertical_align, upperBlockStyle.vertical_align)) {
        output.vertical_align = normalized.vertical_align;
      }
      Object.keys(normalized.alignment || {}).forEach((key) => {
        if (sameStyleValue(normalized.alignment[key], upperBlockStyle.alignment && upperBlockStyle.alignment[key])) return;
        output.alignment = output.alignment || {};
        output.alignment[key] = normalized.alignment[key];
      });
      Object.keys(normalized.typography || {}).forEach((key) => {
        if (sameStyleValue(normalized.typography[key], upperBlockStyle.typography && upperBlockStyle.typography[key])) return;
        output.typography = output.typography || {};
        output.typography[key] = clonePlainValue(normalized.typography[key]);
      });
      return output;
    }

    function explicitSourceRefSettings(rawSettings, upperBlockStyle = {}) {
      const output = {};
      if (!rawSettings) return output;
      const normalized = normalizeStyleBlock(rawSettings);
      if (Object.prototype.hasOwnProperty.call(rawSettings, 'columns') && !sameStyleValue(normalized.columns, upperBlockStyle.columns)) {
        output.columns = normalized.columns;
      }
      if (Object.prototype.hasOwnProperty.call(rawSettings, 'vertical_align') && !sameStyleValue(normalized.vertical_align, upperBlockStyle.vertical_align)) {
        output.vertical_align = normalized.vertical_align;
      }
      Object.keys(rawSettings.alignment || {}).forEach((key) => {
        const value = normalized.alignment[key];
        if (sameStyleValue(value, upperBlockStyle.alignment && upperBlockStyle.alignment[key])) return;
        output.alignment = output.alignment || {};
        output.alignment[key] = value;
      });
      Object.keys(normalized.typography || {}).forEach((key) => {
        if (sameStyleValue(normalized.typography[key], upperBlockStyle.typography && upperBlockStyle.typography[key])) return;
        output.typography = output.typography || {};
        output.typography[key] = clonePlainValue(normalized.typography[key]);
      });
      return output;
    }

    function normalizeTypographyOverrides(typography) {
      const normalized = {};
      blockTypographyFields.forEach(([key]) => {
        if (!typography || !typography[key]) return;
        const value = typography[key];
        const item = {};
        if (value.font_size !== undefined && value.font_size !== '') item.font_size = Math.max(1, Number(value.font_size) || 1);
        if (value.font_family) item.font_family = value.font_family;
        if (value.font_style) item.font_style = value.font_style;
        if (value.font_postscript_name) item.font_postscript_name = value.font_postscript_name;
        if (value.color) item.color = normalizeColor(value.color);
        if (Object.keys(item).length) normalized[key] = item;
      });
      return normalized;
    }

    function normalizeTitleTypographyOverrides(typography) {
      const normalized = {};
      const value = typography && typography.page_header ? typography.page_header : null;
      if (!value) return normalized;
      const item = {};
      if (value.font_size !== undefined && value.font_size !== '') item.font_size = Math.max(1, Number(value.font_size) || 1);
      if (value.font_family) item.font_family = value.font_family;
      if (value.font_style) item.font_style = value.font_style;
      if (value.font_postscript_name) item.font_postscript_name = value.font_postscript_name;
      if (value.color) item.color = normalizeColor(value.color);
      if (Object.keys(item).length) normalized.page_header = item;
      return normalized;
    }

    function normalizeBlockAlignment(alignment, material, cartela) {
      const defaults = defaultBlockAlignment(material, cartela);
      return {
        ...defaults,
        ...(alignment || {}),
      };
    }

    function defaultBlockAlignment(material, cartela) {
      const orientation = cartela && cartela.orientation ? cartela.orientation : 'horizontal';
      const paired = materialHasPairedText(material);
      if (!paired) {
        return { text: orientation === 'vertical' ? 'center' : 'left' };
      }
      if (orientation === 'vertical') {
        return { role: 'center', name: 'center' };
      }
      return { role: 'right', name: 'left' };
    }

    function materialHasPairedText(material) {
      return !!(material && (material.items || []).some((item) => item.kind === 'credit' || item.kind === 'crew_credit' || item.kind === 'cast'));
    }

    function normalizeVerticalAlign(value) {
      return ['top', 'center', 'bottom'].includes(value) ? value : 'top';
    }

    function getSourceRefColumns(page, ref, cartela) {
      const styleBlock = getEffectiveCartelaBlockStyle(cartela);
      if (styleBlock) return Math.max(1, Number(styleBlock.columns) || 1);
      const settings = sourceRefSettings(page, ref);
      return Math.max(1, Number(settings.columns) || 1);
    }

    function getSourceRefAlignment(page, ref, material, effectiveCartela, sourceCartela) {
      const styleBlock = getEffectiveCartelaBlockStyle(sourceCartela);
      if (styleBlock) return normalizeBlockAlignment(styleBlock.alignment, material, effectiveCartela);
      const settings = sourceRefSettings(page, ref);
      return normalizeBlockAlignment(settings.alignment, material, effectiveCartela);
    }

    function getSourceRefVerticalAlign(page, ref, cartela) {
      const styleBlock = getEffectiveCartelaBlockStyle(cartela);
      if (styleBlock) return normalizeVerticalAlign(styleBlock.vertical_align);
      const settings = sourceRefSettings(page, ref);
      return normalizeVerticalAlign(settings.vertical_align);
    }

    function getSourceRefTypography(page, ref, cartela) {
      const styleBlock = getEffectiveCartelaBlockStyle(cartela);
      if (styleBlock) return normalizeTypographyOverrides(styleBlock.typography);
      const settings = sourceRefSettings(page, ref);
      return normalizeTypographyOverrides(settings.typography);
    }

    function sourceRefSettings(page, ref) {
      return page && page.source_ref_settings && page.source_ref_settings[ref]
        ? page.source_ref_settings[ref]
        : {};
    }

    function mergeBlockTypography(baseTypography = {}, overrideTypography = {}) {
      const keys = new Set([
        ...blockTypographyFields.map(([key]) => key),
        ...Object.keys(baseTypography || {}),
        ...Object.keys(overrideTypography || {}),
      ]);
      const output = {};
      keys.forEach((key) => {
        const base = baseTypography && baseTypography[key] ? baseTypography[key] : {};
        const override = overrideTypography && overrideTypography[key] ? overrideTypography[key] : {};
        const merged = {
          ...base,
          ...override,
        };
        if (Object.keys(merged).length) output[key] = merged;
      });
      return output;
    }

    function hasStyleCartelaOverride(style, key) {
      return !!(style && style.cartela && Object.prototype.hasOwnProperty.call(style.cartela, key));
    }

    function hasStyleBlockOverride(style, key) {
      return !!(style && style.block && Object.prototype.hasOwnProperty.call(style.block, key));
    }

    function hasStyleBlockAlignmentOverride(style, key) {
      return !!(style && style.block && style.block.alignment && Object.prototype.hasOwnProperty.call(style.block.alignment, key));
    }

    function hasStyleTypographyOverride(style, key) {
      return !!(style && style.block && style.block.typography && style.block.typography[key] && Object.keys(style.block.typography[key]).length);
    }

    function hasStyleTitleTypographyOverride(style) {
      return !!(style && style.title_typography && style.title_typography.page_header && Object.keys(style.title_typography.page_header).length);
    }

    function hasCartelaOverride(cartela, key) {
      return !!(cartela && cartela.style_id && Object.prototype.hasOwnProperty.call(cartela, key));
    }

    function hasCartelaBlockAlignmentOverride(cartela, key) {
      return !!(
        cartela
        && cartela.block_style
        && cartela.block_style.alignment
        && cartela.block_style.alignment[key] !== undefined
      );
    }

    function hasCartelaBlockTypographyOverride(cartela, key) {
      return !!(
        cartela
        && cartela.block_style
        && cartela.block_style.typography
        && cartela.block_style.typography[key]
        && Object.keys(cartela.block_style.typography[key]).length
      );
    }

    function hasCartelaTitleTypographyOverride(cartela) {
      return !!(
        cartela
        && cartela.title_typography
        && cartela.title_typography.page_header
        && Object.keys(cartela.title_typography.page_header).length
      );
    }

    function mergeStyleBlockOverrides(current = {}, fields = {}) {
      const currentOverrides = sanitizeStyleBlockOverrides(current);
      const fieldOverrides = sanitizeStyleBlockOverrides(fields);
      const output = {
        ...currentOverrides,
        ...fieldOverrides,
      };
      if (fields.alignment !== undefined) {
        output.alignment = {
          ...((currentOverrides && currentOverrides.alignment) || {}),
          ...((fieldOverrides && fieldOverrides.alignment) || {}),
        };
      }
      if (fields.typography !== undefined) {
        output.typography = mergeBlockTypography(currentOverrides.typography, fieldOverrides.typography);
      }
      if (output.alignment && !Object.keys(output.alignment).length) delete output.alignment;
      if (output.typography && !Object.keys(output.typography).length) delete output.typography;
      return output;
    }

    return {
      baseStyleCartelaFromSettings,
      clonePlainValue,
      explicitCartelaBlockStyle,
      explicitCartelaTitleTypography,
      explicitSourceRefSettings,
      getEffectiveCartelaTitleTypography,
      getEffectiveStyleBlock,
      getEffectiveStyleCartela,
      getEffectiveStyleTitleTypography,
      getSourceRefAlignment,
      getSourceRefColumns,
      getSourceRefTypography,
      getSourceRefVerticalAlign,
      hasCartelaBlockAlignmentOverride,
      hasCartelaBlockTypographyOverride,
      hasCartelaOverride,
      hasCartelaTitleTypographyOverride,
      hasStyleBlockAlignmentOverride,
      hasStyleBlockOverride,
      hasStyleCartelaOverride,
      hasStyleTitleTypographyOverride,
      hasStyleTypographyOverride,
      mergeBlockTypography,
      mergeStyleBlockOverrides,
      normalizeBlockAlignment,
      normalizeCartelaStyle,
      normalizeStyleCartela,
      normalizeStyleBlock,
      normalizeTitleTypographyOverrides,
      normalizeTypographyOverrides,
      normalizeVerticalAlign,
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

  function clonePlainValue(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  root.CreditosDomainStyles = {
    clonePlainValue,
    createStyleDomain,
    sameStyleValue,
  };
})(globalThis);
