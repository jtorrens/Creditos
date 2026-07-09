(function (root) {
  function createTypographyDomain() {
    const FONT_WEIGHT_OPTIONS = [200, 300, 400, 500, 600, 700, 800, 900];

    function normalizeFontWeight(value, fallback = 400) {
      const numeric = Number(value);
      const hasValue = value !== undefined && value !== null && value !== '';
      const source = Number.isFinite(numeric) && numeric > 0
        ? numeric
        : (hasValue ? Number(fontWeightFromStyle(value)) : NaN);
      const fallbackNumeric = Number.isFinite(Number(fallback)) ? Number(fallback) : Number(fontWeightFromStyle(fallback));
      const resolved = Number.isFinite(source) && source > 0 ? source : fallbackNumeric;
      return FONT_WEIGHT_OPTIONS.reduce((closest, option) => (
        Math.abs(option - resolved) < Math.abs(closest - resolved) ? option : closest
      ), FONT_WEIGHT_OPTIONS[0]);
    }

    function fontWeightFromStyle(style) {
      const numeric = Number(style);
      if (Number.isFinite(numeric) && numeric > 0) return String(normalizeFontWeight(numeric));
      const value = String(style || '');
      if (/thin/i.test(value)) return '200';
      if (/extra\s*light|ultra\s*light/i.test(value)) return '200';
      if (/light/i.test(value)) return '300';
      if (/medium/i.test(value)) return '500';
      if (/semi\s*bold|demi\s*bold/i.test(value)) return '600';
      if (/extra\s*bold|ultra\s*bold/i.test(value)) return '800';
      if (/black|heavy/i.test(value)) return '900';
      if (/bold/i.test(value)) return '700';
      return '400';
    }

    function fontWeightFromTypography(typography = {}) {
      return String(normalizeFontWeight(
        typography.font_weight,
        typography.font_style || 'Regular'
      ));
    }

    function fontStyleFromStyle(style) {
      return /italic|oblique/i.test(style || '') ? 'italic' : 'normal';
    }

    function quoteFontFamily(family) {
      return `"${String(family || 'Arial').replace(/"/g, '\\"')}"`;
    }

    function dedupeFontStyles(styles) {
      const byStyle = new Map();
      (styles || []).forEach((fontStyle) => {
        if (!byStyle.has(fontStyle.style)) byStyle.set(fontStyle.style, fontStyle);
      });
      return Array.from(byStyle.values()).sort((a, b) => a.style.localeCompare(b.style));
    }

    function styleFromFullName(fullName, family) {
      return String(fullName || '').replace(String(family || ''), '').trim() || 'Regular';
    }

    function buildFontCatalog(fonts) {
      const byFamily = new Map();
      (fonts || []).forEach((font) => {
        const family = font.family || font.fullName || font.postscriptName;
        if (!family) return;
        const style = font.style || styleFromFullName(font.fullName, family);
        const entry = {
          family,
          style: style || 'Regular',
          full_name: font.fullName || '',
          postscript_name: font.postscriptName || '',
        };
        if (!byFamily.has(family)) byFamily.set(family, []);
        byFamily.get(family).push(entry);
      });
      return {
        families: Array.from(byFamily.keys()).sort((a, b) => a.localeCompare(b)),
        stylesByFamily: Object.fromEntries(
          Array.from(byFamily.entries()).map(([family, styles]) => [
            family,
            dedupeFontStyles(styles),
          ])
        ),
      };
    }

    function fallbackFontCatalog(fontOptions) {
      const families = fontOptions || [];
      return {
        families,
        stylesByFamily: Object.fromEntries(families.map((font) => [font, [{ style: 'Regular', postscript_name: '' }]])),
      };
    }

    function fontStylesForFamily(catalog, family) {
      return (catalog && catalog.stylesByFamily && catalog.stylesByFamily[family]) || [{ style: 'Regular', postscript_name: '' }];
    }

    function resolveFontStyleForWeight(catalog, family, weight, currentStyle) {
      const styles = fontStylesForFamily(catalog, family);
      const targetWeight = normalizeFontWeight(weight, currentStyle || 'Regular');
      const targetItalic = /italic|oblique/i.test(currentStyle || '');
      const samePosture = styles.filter((fontStyle) => /italic|oblique/i.test(fontStyle.style || '') === targetItalic);
      const candidates = samePosture.length ? samePosture : styles;
      return candidates
        .slice()
        .sort((a, b) => {
          const weightScore = Math.abs(Number(fontWeightFromStyle(a.style)) - targetWeight) - Math.abs(Number(fontWeightFromStyle(b.style)) - targetWeight);
          if (weightScore !== 0) return weightScore;
          const aRegular = /regular|book|normal/i.test(a.style || '') ? 0 : 1;
          const bRegular = /regular|book|normal/i.test(b.style || '') ? 0 : 1;
          return aRegular - bRegular;
        })[0] || { style: 'Regular', postscript_name: '' };
    }

    return {
      buildFontCatalog,
      dedupeFontStyles,
      fallbackFontCatalog,
      fontWeightOptions: () => FONT_WEIGHT_OPTIONS.slice(),
      fontStyleFromStyle,
      fontStylesForFamily,
      fontWeightFromStyle,
      fontWeightFromTypography,
      normalizeFontWeight,
      quoteFontFamily,
      resolveFontStyleForWeight,
      styleFromFullName,
    };
  }

  root.CreditosDomainTypography = {
    createTypographyDomain,
  };
})(globalThis);
