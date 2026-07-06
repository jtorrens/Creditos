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

    return {
      dedupeFontStyles,
      fontStyleFromStyle,
      fontWeightFromStyle,
      quoteFontFamily,
      styleFromFullName,
    };
  }

  root.CreditosDomainTypography = {
    createTypographyDomain,
  };
})(globalThis);
