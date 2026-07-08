(function (root) {
  function createStyleDomain(dependencies = {}) {
    const {
      blockTypographyFields,
      baseStyleCartela = () => ({}),
      effectiveStyleBlockForStyle = () => ({}),
      effectiveStyleCartelaForStyle = () => ({}),
      effectiveStyleTitleTypographyForStyle = () => ({ page_header: {} }),
      findPageWithRef = () => null,
      getCartelaRefs = () => [],
      getCartelaStyleBlock = () => null,
      getStyleById = () => null,
      mergeStyleAnimation = (base) => base || {},
      normalizeBoolean,
      normalizeColor,
      normalizeStyleAnimation = (value) => value || {},
      normalizeTextCapitalization,
      safeStyleId,
      serializeStyleAnimation = () => undefined,
      styleCartelaFields = [],
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
        animation: normalizeStyleAnimation(json.animation || {}),
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

    function getEffectiveStyleAnimation(style) {
      return normalizeStyleAnimation(style && style.animation ? style.animation : {});
    }

    function getEffectiveCartelaAnimation(cartela) {
      const style = getStyleById(cartela && cartela.style_id);
      const styleAnimation = getEffectiveStyleAnimation(style);
      if (!cartela || !Object.prototype.hasOwnProperty.call(cartela, 'animation')) return styleAnimation;
      return mergeStyleAnimation(styleAnimation, cartela.animation || {});
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
      const output = {
        schema: 'credits_cartela_style_json',
        version: 2,
        id: style.id,
        name: style.name,
        cartela: sanitizeStyleCartelaOverrides(style.cartela || {}),
        title_typography: normalizeTitleTypographyOverrides(style.title_typography || {}),
        block: sanitizeStyleBlockOverrides(style.block || {}),
      };
      const animation = serializeStyleAnimation(style.animation || {});
      if (animation !== undefined) output.animation = animation;
      return output;
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

    function applyExplicitCartelaOverridesFromSource(target, source, sourceRaw = source) {
      if (!target || !source) return false;
      const styleId = sourceRaw && sourceRaw.style_id !== undefined ? sourceRaw.style_id : source.style_id;
      target.style_id = styleId || '';

      const style = getStyleById(target.style_id);
      const upperCartela = target.style_id ? effectiveStyleCartelaForStyle(style) : baseStyleCartela();
      styleCartelaFields.forEach((key) => {
        delete target[key];
        if (!sourceRaw || !Object.prototype.hasOwnProperty.call(sourceRaw, key)) return;
        const normalized = sanitizeStyleCartelaOverrides({ [key]: sourceRaw[key] });
        if (normalized[key] === undefined) return;
        if (!sameStyleValue(normalized[key], upperCartela[key])) target[key] = clonePlainValue(normalized[key]);
      });

      const explicitBlockStyle = explicitCartelaBlockStyle(
        sourceRaw && sourceRaw.block_style,
        effectiveStyleBlockForStyle(style)
      );
      if (Object.keys(explicitBlockStyle).length) {
        target.block_style = explicitBlockStyle;
      } else {
        delete target.block_style;
      }

      const explicitTitleTypography = explicitCartelaTitleTypography(
        sourceRaw && sourceRaw.title_typography,
        effectiveStyleTitleTypographyForStyle(style).page_header
      );
      if (Object.keys(explicitTitleTypography).length) {
        target.title_typography = explicitTitleTypography;
      } else {
        delete target.title_typography;
      }

      if (sourceRaw && Object.prototype.hasOwnProperty.call(sourceRaw, 'animation')) {
        target.animation = clonePlainValue(sourceRaw.animation);
      } else {
        delete target.animation;
      }

      applyExplicitSourceRefSettings(target, source, sourceRaw);
      return true;
    }

    function applyExplicitSourceRefSettings(target, source, sourceRaw = source) {
      const explicitByRef = collectExplicitSourceRefSettings(source, sourceRaw);
      (target.pages || []).forEach((page) => {
        const nextSettings = {};
        (page.source_refs || []).forEach((ref) => {
          if (!explicitByRef.has(ref)) return;
          nextSettings[ref] = clonePlainValue(explicitByRef.get(ref));
        });
        page.source_ref_settings = nextSettings;
      });
      return true;
    }

    function collectExplicitSourceRefSettings(source, sourceRaw = source) {
      const output = new Map();
      const sourceUpperBlock = getEffectiveCartelaBlockStyle(source);
      const rawPages = sourceRaw && Array.isArray(sourceRaw.pages) ? sourceRaw.pages : [];
      rawPages.forEach((page) => {
        const settingsByRef = page && page.source_ref_settings ? page.source_ref_settings : {};
        Object.keys(settingsByRef).forEach((ref) => {
          const explicit = explicitSourceRefSettings(settingsByRef[ref], sourceUpperBlock);
          if (Object.keys(explicit).length) output.set(ref, explicit);
        });
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
        if (value.letter_spacing !== undefined && value.letter_spacing !== '') item.letter_spacing = Number(value.letter_spacing) || 0;
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
      if (value.letter_spacing !== undefined && value.letter_spacing !== '') item.letter_spacing = Number(value.letter_spacing) || 0;
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

    function getEffectiveCartelaBlockStyle(cartela) {
      const styleBlock = getCartelaStyleBlock(cartela) || {};
      if (cartela && cartela.block_style) {
        return normalizeStyleBlock({
          ...styleBlock,
          ...cartela.block_style,
          alignment: {
            ...((styleBlock && styleBlock.alignment) || {}),
            ...((cartela.block_style && cartela.block_style.alignment) || {}),
          },
          typography: mergeBlockTypography(styleBlock.typography, cartela.block_style.typography),
        });
      }
      if (Object.keys(styleBlock).length) return normalizeStyleBlock(styleBlock);
      const firstRef = getCartelaRefs(cartela)[0];
      const firstPage = firstRef ? findPageWithRef(cartela, firstRef) : null;
      const settings = firstPage && firstPage.source_ref_settings && firstPage.source_ref_settings[firstRef]
        ? firstPage.source_ref_settings[firstRef]
        : {};
      return normalizeStyleBlock(settings);
    }

    function sourceRefSettings(page, ref) {
      return page && page.source_ref_settings && page.source_ref_settings[ref]
        ? page.source_ref_settings[ref]
        : {};
    }

    function ensureSourceRefSettings(page, ref) {
      page.source_ref_settings = page.source_ref_settings || {};
      page.source_ref_settings[ref] = page.source_ref_settings[ref] || {};
      return page.source_ref_settings[ref];
    }

    function ensureCartelaSourceRefSettings(cartela, ref) {
      const page = findPageWithRef(cartela, ref);
      if (!page) return null;
      page.source_ref_settings = page.source_ref_settings || {};
      page.source_ref_settings[ref] = page.source_ref_settings[ref] || { columns: 1 };
      return page.source_ref_settings[ref];
    }

    function sourceRefIsLocked(cartela, ref) {
      const settings = ensureCartelaSourceRefSettings(cartela, ref);
      return !!(settings && settings.locked);
    }

    function makeSampleStyleRender(style) {
      const cartela = {
        id: 'style_preview',
        title: style.name,
        ...effectiveStyleCartelaForStyle(style),
        title_typography: effectiveStyleTitleTypographyForStyle(style),
        animation: getEffectiveStyleAnimation(style),
        style_id: style.id,
      };
      const block = effectiveStyleBlockForStyle(style);
      return {
        cartelas: [{
          ...cartela,
          pages: [{
            id: 'style_preview_page',
            title: '',
            blocks: [{
              id: 'style_preview_block',
              title: 'Dirección de producción',
              type: 'credits',
              columns: block.columns,
              alignment: block.alignment,
              vertical_align: block.vertical_align,
              typography: block.typography,
              items: [
                { id: 'style_preview_unit_1', source_item_id: 'sample_1', kind: 'credit', role: 'Productora Ejecutiva', name: 'Nombre Apellido' },
                { id: 'style_preview_unit_2', source_item_id: 'sample_2', kind: 'credit', role: 'Dirección de Producción', name: 'Nombre Apellido' },
                { id: 'style_preview_unit_3', source_item_id: 'sample_3', kind: 'credit', role: 'Una producción de', name: 'Lorem Ipsum Studio' },
              ],
            }],
          }],
        }],
      };
    }

    function updateSourceRefAlignment(page, ref, fields) {
      if (!page) return false;
      const settings = ensureSourceRefSettings(page, ref);
      settings.alignment = {
        ...(settings.alignment || {}),
        ...(fields || {}),
      };
      return true;
    }

    function updateSourceRefVerticalAlign(page, ref, value) {
      if (!page) return false;
      ensureSourceRefSettings(page, ref).vertical_align = normalizeVerticalAlign(value);
      return true;
    }

    function updateSourceRefTypography(page, ref, key, fields) {
      if (!page) return false;
      const settings = ensureSourceRefSettings(page, ref);
      const typography = {
        ...(settings.typography || {}),
        [key]: {
          ...(settings.typography && settings.typography[key] ? settings.typography[key] : {}),
          ...(fields || {}),
        },
      };
      settings.typography = normalizeTypographyOverrides(typography);
      return true;
    }

    function resetSourceRefTypography(page, ref) {
      if (!page || !page.source_ref_settings || !page.source_ref_settings[ref]) return false;
      delete page.source_ref_settings[ref].typography;
      return true;
    }

    function updateSourceRefColumns(page, ref, columns) {
      if (!page) return false;
      ensureSourceRefSettings(page, ref).columns = Math.max(1, Number(columns) || 1);
      return true;
    }

    function applyBlockStyleToCartelaRefs(cartela, fields) {
      (cartela && cartela.pages || []).forEach((page) => {
        page.source_ref_settings = page.source_ref_settings || {};
        (page.source_refs || []).forEach((ref) => {
          const current = page.source_ref_settings[ref] || {};
          page.source_ref_settings[ref] = normalizeStyleBlock({
            ...current,
            ...fields,
            alignment: fields.alignment || current.alignment || {},
            typography: fields.typography || current.typography || {},
          });
        });
      });
    }

    function updateCartelaBlockStyle(cartela, fields) {
      if (!cartela) return false;
      if (cartela.style_id) {
        const nextBlockStyle = mergeStyleBlockOverrides(cartela.block_style || {}, fields);
        if (Object.keys(nextBlockStyle).length) {
          cartela.block_style = nextBlockStyle;
        } else {
          delete cartela.block_style;
        }
      } else {
        applyBlockStyleToCartelaRefs(cartela, fields);
      }
      return true;
    }

    function updateCartelaBlockAlignment(cartela, key, value) {
      if (!cartela) return false;
      const current = cartela.block_style && cartela.block_style.alignment ? cartela.block_style.alignment : {};
      return updateCartelaBlockStyle(cartela, {
        alignment: {
          ...current,
          [key]: value,
        },
      });
    }

    function updateCartelaBlockTypography(cartela, key, fields) {
      if (!cartela) return false;
      const current = cartela.block_style && cartela.block_style.typography ? cartela.block_style.typography : {};
      const typography = normalizeTypographyOverrides({
        ...current,
        [key]: {
          ...(current[key] || {}),
          ...(fields || {}),
        },
      });
      return updateCartelaBlockStyle(cartela, { typography });
    }

    function updateCartelaTitleTypography(cartela, fields, base = {}) {
      if (!cartela) return false;
      const current = cartela.title_typography && cartela.title_typography.page_header ? cartela.title_typography.page_header : {};
      const typography = normalizeTitleTypographyOverrides({
        page_header: {
          ...current,
          ...(fields || {}),
        },
      });
      if (typography.page_header) {
        Object.keys(typography.page_header).forEach((key) => {
          if (sameStyleValue(typography.page_header[key], base && base[key])) delete typography.page_header[key];
        });
        if (!Object.keys(typography.page_header).length) delete typography.page_header;
      }
      if (typography.page_header) {
        cartela.title_typography = typography;
      } else {
        delete cartela.title_typography;
      }
      return true;
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

    function hasCartelaAnimationOverride(cartela) {
      return !!(cartela && cartela.style_id && Object.prototype.hasOwnProperty.call(cartela, 'animation'));
    }

    function hasCartelaStyleOverrides(cartela) {
      if (!cartela || !cartela.style_id) return false;
      if (styleCartelaFields.some((key) => cartela[key] !== undefined)) return true;
      return hasCartelaTitleTypographyOverride(cartela)
        || hasCartelaAnimationOverride(cartela)
        || !!(cartela.block_style && Object.keys(cartela.block_style).length);
    }

    function clearCartelaStyleOverrides(cartela) {
      if (!cartela) return false;
      styleCartelaFields.forEach((key) => {
        delete cartela[key];
      });
      delete cartela.title_typography;
      delete cartela.block_style;
      delete cartela.animation;
      return true;
    }

    function pruneEmptyCartelaBlockStyle(cartela) {
      if (cartela && cartela.block_style && !Object.keys(cartela.block_style).length) delete cartela.block_style;
    }

    function resetCartelaBlockOverride(cartela, key) {
      if (!cartela || !cartela.block_style) return false;
      delete cartela.block_style[key];
      pruneEmptyCartelaBlockStyle(cartela);
      return true;
    }

    function resetCartelaBlockAlignmentOverride(cartela, key) {
      if (!cartela || !cartela.block_style || !cartela.block_style.alignment) return false;
      delete cartela.block_style.alignment[key];
      if (!Object.keys(cartela.block_style.alignment).length) delete cartela.block_style.alignment;
      pruneEmptyCartelaBlockStyle(cartela);
      return true;
    }

    function resetCartelaBlockTypographyOverride(cartela, key) {
      if (!cartela || !cartela.block_style || !cartela.block_style.typography) return false;
      delete cartela.block_style.typography[key];
      if (!Object.keys(cartela.block_style.typography).length) delete cartela.block_style.typography;
      pruneEmptyCartelaBlockStyle(cartela);
      return true;
    }

    function resetCartelaTitleTypographyOverride(cartela) {
      if (!cartela || !cartela.title_typography) return false;
      delete cartela.title_typography.page_header;
      if (!Object.keys(cartela.title_typography).length) delete cartela.title_typography;
      return true;
    }

    function uniqueStyleId(styles, baseId) {
      const base = baseId || 'estilo';
      let candidate = base;
      let index = 2;
      const existing = new Set((styles || []).map((style) => style.id));
      while (existing.has(candidate)) {
        candidate = `${base}_${index}`;
        index += 1;
      }
      return candidate;
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

    function updateStyleCartela(style, fields) {
      if (!style) return false;
      style.cartela = sanitizeStyleCartelaOverrides({ ...(style.cartela || {}), ...(fields || {}) });
      return true;
    }

    function resetStyleCartelaOverride(style, key) {
      if (!style || !style.cartela) return false;
      delete style.cartela[key];
      if (!Object.keys(style.cartela).length) style.cartela = {};
      return true;
    }

    function updateStyleBlock(style, fields) {
      if (!style) return false;
      style.block = sanitizeStyleBlockOverrides({
        ...(style.block || {}),
        ...(fields || {}),
        alignment: fields && fields.alignment || (style.block && style.block.alignment) || {},
        typography: fields && fields.typography || (style.block && style.block.typography) || {},
      });
      return true;
    }

    function updateStyleBlockAlignment(style, key, value) {
      if (!style) return false;
      const current = style.block && style.block.alignment ? style.block.alignment : {};
      return updateStyleBlock(style, { alignment: { ...current, [key]: value } });
    }

    function resetStyleBlockOverride(style, key) {
      if (!style || !style.block) return false;
      delete style.block[key];
      if (!Object.keys(style.block).length) style.block = {};
      return true;
    }

    function resetStyleBlockAlignmentOverride(style, key) {
      if (!style || !style.block || !style.block.alignment) return false;
      delete style.block.alignment[key];
      if (!Object.keys(style.block.alignment).length) delete style.block.alignment;
      if (!Object.keys(style.block).length) style.block = {};
      return true;
    }

    function updateStyleTitleTypography(style, fields, base = {}) {
      if (!style) return false;
      const current = style.title_typography && style.title_typography.page_header ? style.title_typography.page_header : {};
      const next = normalizeTitleTypographyOverrides({ page_header: { ...current, ...(fields || {}) } });
      Object.keys(next.page_header || {}).forEach((key) => {
        if (sameStyleValue(next.page_header[key], base && base[key])) delete next.page_header[key];
      });
      style.title_typography = next.page_header && Object.keys(next.page_header).length ? next : {};
      return true;
    }

    function resetStyleTitleTypographyOverride(style) {
      if (!style) return false;
      style.title_typography = {};
      return true;
    }

    function updateStyleTypography(style, key, fields) {
      if (!style) return false;
      const block = sanitizeStyleBlockOverrides(style.block || {});
      block.typography = normalizeTypographyOverrides({
        ...(block.typography || {}),
        [key]: {
          ...(block.typography && block.typography[key] ? block.typography[key] : {}),
          ...(fields || {}),
        },
      });
      return updateStyleBlock(style, { typography: block.typography });
    }

    function resetStyleTypographyOverride(style, key) {
      if (!style || !style.block || !style.block.typography) return false;
      delete style.block.typography[key];
      if (!Object.keys(style.block.typography).length) delete style.block.typography;
      if (!Object.keys(style.block).length) style.block = {};
      return true;
    }

    function pruneRedundantStyleOverrides(structure) {
      if (!structure || !Array.isArray(structure.cartelas)) return false;
      structure.cartelas.forEach((cartela) => {
        const style = getStyleById(cartela.style_id);
        const titleTypography = explicitCartelaTitleTypography(
          cartela.title_typography,
          effectiveStyleTitleTypographyForStyle(style).page_header
        );
        if (Object.keys(titleTypography).length) {
          cartela.title_typography = titleTypography;
        } else {
          delete cartela.title_typography;
        }

        if (!style) return;
        const styleCartela = effectiveStyleCartelaForStyle(style);
        styleCartelaFields.forEach((key) => {
          if (!Object.prototype.hasOwnProperty.call(cartela, key)) return;
          if (sameStyleValue(cartela[key], styleCartela[key])) delete cartela[key];
        });

        if (cartela.animation && sameStyleValue(getEffectiveCartelaAnimation(cartela), getEffectiveStyleAnimation(style))) {
          delete cartela.animation;
        }

        if (!cartela.block_style) return;
        const styleBlock = effectiveStyleBlockForStyle(style);
        if (sameStyleValue(cartela.block_style.columns, styleBlock.columns)) delete cartela.block_style.columns;
        if (sameStyleValue(cartela.block_style.concatenate_rows, styleBlock.concatenate_rows)) delete cartela.block_style.concatenate_rows;
        if (sameStyleValue(cartela.block_style.force_role_name_columns, styleBlock.force_role_name_columns)) delete cartela.block_style.force_role_name_columns;
        if (sameStyleValue(cartela.block_style.vertical_align, styleBlock.vertical_align)) delete cartela.block_style.vertical_align;
        Object.keys(cartela.block_style.alignment || {}).forEach((key) => {
          if (sameStyleValue(cartela.block_style.alignment[key], styleBlock.alignment && styleBlock.alignment[key])) {
            delete cartela.block_style.alignment[key];
          }
        });
        if (cartela.block_style.alignment && !Object.keys(cartela.block_style.alignment).length) delete cartela.block_style.alignment;

        Object.keys(cartela.block_style.typography || {}).forEach((key) => {
          if (sameStyleValue(cartela.block_style.typography[key], styleBlock.typography && styleBlock.typography[key])) {
            delete cartela.block_style.typography[key];
          }
        });
        if (cartela.block_style.typography && !Object.keys(cartela.block_style.typography).length) delete cartela.block_style.typography;
        if (!Object.keys(cartela.block_style).length) delete cartela.block_style;
      });
      return true;
    }

    function pruneRedundantStyleDefaults(styles, settings = {}) {
      const defaultCartelaFields = [
        'duration',
        'line_spacing',
        'column_gap',
        'role_name_gap',
        'source_group_gap',
        'block_gap',
        'block_title_gap',
        'page_top_margin',
        'page_bottom_margin',
        'page_left_margin',
        'page_right_margin',
        'repeat_block_titles',
        'auto_text_wrap',
        'text_capitalization',
        'use_protected_capitalization',
      ];
      (styles || []).forEach((style) => {
        const defaultCartela = baseStyleCartela();
        defaultCartelaFields.forEach((key) => {
          if (style.cartela && Object.prototype.hasOwnProperty.call(style.cartela, key) && sameStyleValue(style.cartela[key], defaultCartela[key])) {
            delete style.cartela[key];
          }
        });
        if (style.cartela && !Object.keys(style.cartela).length) style.cartela = {};

        const defaultTitle = settings.typography && settings.typography.page_header;
        const titleTypography = normalizeTitleTypographyOverrides(style.title_typography || {});
        Object.keys(titleTypography.page_header || {}).forEach((key) => {
          if (sameStyleValue(titleTypography.page_header[key], defaultTitle && defaultTitle[key])) delete titleTypography.page_header[key];
        });
        style.title_typography = titleTypography.page_header && Object.keys(titleTypography.page_header).length ? titleTypography : {};

        if (!style.block) return;
        const defaultBlock = normalizeStyleBlock({
          typography: Object.fromEntries(blockTypographyFields.map(([key]) => [key, settings.typography && settings.typography[key]])),
        });
        if (style.block.concatenate_rows !== undefined && sameStyleValue(style.block.concatenate_rows, defaultBlock.concatenate_rows)) {
          delete style.block.concatenate_rows;
        }
        if (style.block.force_role_name_columns !== undefined && sameStyleValue(style.block.force_role_name_columns, defaultBlock.force_role_name_columns)) {
          delete style.block.force_role_name_columns;
        }
        Object.keys(style.block.typography || {}).forEach((key) => {
          if (sameStyleValue(style.block.typography[key], defaultBlock.typography && defaultBlock.typography[key])) {
            delete style.block.typography[key];
          }
        });
        if (style.block.typography && !Object.keys(style.block.typography).length) delete style.block.typography;
        if (!Object.keys(style.block).length) style.block = {};
      });
      return true;
    }

    return {
      applyBlockStyleToCartelaRefs,
      applyExplicitCartelaOverridesFromSource,
      applyExplicitSourceRefSettings,
      baseStyleCartelaFromSettings,
      clearCartelaStyleOverrides,
      collectExplicitSourceRefSettings,
      clonePlainValue,
      explicitCartelaBlockStyle,
      explicitCartelaTitleTypography,
      explicitSourceRefSettings,
      ensureCartelaSourceRefSettings,
      getEffectiveCartelaTitleTypography,
      getEffectiveCartelaBlockStyle,
      getEffectiveCartelaAnimation,
      getEffectiveStyleBlock,
      getEffectiveStyleAnimation,
      getEffectiveStyleCartela,
      getEffectiveStyleTitleTypography,
      getSourceRefAlignment,
      getSourceRefColumns,
      getSourceRefTypography,
      getSourceRefVerticalAlign,
      hasCartelaBlockAlignmentOverride,
      hasCartelaBlockTypographyOverride,
      hasCartelaOverride,
      hasCartelaAnimationOverride,
      hasCartelaStyleOverrides,
      hasCartelaTitleTypographyOverride,
      hasStyleBlockAlignmentOverride,
      hasStyleBlockOverride,
      hasStyleCartelaOverride,
      hasStyleTitleTypographyOverride,
      hasStyleTypographyOverride,
      mergeBlockTypography,
      mergeStyleBlockOverrides,
      makeSampleStyleRender,
      normalizeBlockAlignment,
      normalizeCartelaStyle,
      normalizeStyleCartela,
      normalizeStyleBlock,
      normalizeTitleTypographyOverrides,
      normalizeTypographyOverrides,
      normalizeVerticalAlign,
      pruneRedundantStyleDefaults,
      pruneRedundantStyleOverrides,
      resetCartelaBlockAlignmentOverride,
      resetCartelaBlockOverride,
      resetCartelaBlockTypographyOverride,
      resetCartelaTitleTypographyOverride,
      resetSourceRefTypography,
      resetStyleBlockAlignmentOverride,
      resetStyleBlockOverride,
      resetStyleCartelaOverride,
      resetStyleTitleTypographyOverride,
      resetStyleTypographyOverride,
      sanitizeStyleCartelaOverrides,
      sanitizeStyleBlockOverrides,
      serializeCartelaStyle,
      sameStyleValue,
      sourceRefIsLocked,
      uniqueStyleId,
      updateCartelaBlockAlignment,
      updateCartelaBlockStyle,
      updateCartelaBlockTypography,
      updateCartelaTitleTypography,
      updateSourceRefAlignment,
      updateSourceRefColumns,
      updateSourceRefTypography,
      updateSourceRefVerticalAlign,
      updateStyleBlock,
      updateStyleBlockAlignment,
      updateStyleCartela,
      updateStyleTitleTypography,
      updateStyleTypography,
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
