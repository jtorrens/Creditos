(function (root) {
  function createTypographyDomain() {
    function fontWeightFromStyle(style) {
      const value = String(style || '');
      if (/thin/i.test(value)) return '100';
      if (/extra\s*light|ultra\s*light/i.test(value)) return '200';
      if (/light/i.test(value)) return '300';
      if (/medium/i.test(value)) return '500';
      if (/semi\s*bold|demi\s*bold/i.test(value)) return '600';
      if (/extra\s*bold|ultra\s*bold/i.test(value)) return '800';
      if (/black|heavy/i.test(value)) return '900';
      if (/bold/i.test(value)) return '700';
      return '400';
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

    return {
      buildFontCatalog,
      dedupeFontStyles,
      fallbackFontCatalog,
      fontStyleFromStyle,
      fontStylesForFamily,
      fontWeightFromStyle,
      quoteFontFamily,
      styleFromFullName,
    };
  }

  root.CreditosDomainTypography = {
    createTypographyDomain,
  };
})(globalThis);
