(function (root) {
  function createStyleDomain(dependencies = {}) {
    const {
      normalizeBoolean,
      normalizeTextCapitalization,
      normalizeTypographyOverrides,
      normalizeVerticalAlign,
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

    return {
      normalizeStyleCartela,
      normalizeStyleBlock,
      sanitizeStyleCartelaOverrides,
      sanitizeStyleBlockOverrides,
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
