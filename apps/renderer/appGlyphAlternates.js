(function (root) {
  function createAppGlyphAlternates(options = {}) {
    const documentRef = options.documentRef || root.document;
    const fontSources = new Map();
    const analysisCache = new Map();
    const inventoryCache = new Map();
    let cssSignature = '';

    function fontIdentity(font = {}) {
      return {
        family: String(font.family || font.font_family || ''),
        style: String(font.style || font.font_style || 'Regular'),
        postscript_name: String(font.postscript_name || font.postscriptName || font.font_postscript_name || ''),
      };
    }

    function fontIdentityKey(font = {}) {
      const normalized = fontIdentity(font);
      if (normalized.postscript_name) return `ps:${normalized.postscript_name.trim().toLowerCase()}`;
      return `family:${normalized.family.trim().toLowerCase()}\u0000${normalized.style.trim().toLowerCase()}`;
    }

    function sameFontIdentity(left, right) {
      const a = fontIdentity(left);
      const b = fontIdentity(right);
      if (a.postscript_name && b.postscript_name) {
        return a.postscript_name.toLowerCase() === b.postscript_name.toLowerCase();
      }
      return !!a.family
        && a.family.toLowerCase() === b.family.toLowerCase()
        && a.style.toLowerCase() === b.style.toLowerCase();
    }

    function setFontSources(fonts = []) {
      fontSources.clear();
      fonts.forEach((font) => fontSources.set(fontIdentityKey(font), font));
      analysisCache.clear();
      inventoryCache.clear();
    }

    function fontSourceForTypography(typography = {}) {
      const direct = fontSources.get(fontIdentityKey(typography));
      if (direct) return direct;
      const target = fontIdentity(typography);
      for (const source of fontSources.values()) {
        if (sameFontIdentity(source, target)) return source;
      }
      return null;
    }

    function rulesForTypography(category, typography, settings = options.getProductionSettings()) {
      return options.normalizeGlyphAlternates(settings.glyph_alternates)
        .filter((rule) => rule.category === category && sameFontIdentity(rule.font, typography));
    }

    async function analyzeCharacter(typography, character) {
      const native = options.nativeBridge();
      if (!native || !native.analyzeFontAlternates) {
        throw new Error('El análisis de alternativas está disponible en la aplicación de escritorio.');
      }
      const source = fontSourceForTypography(typography);
      if (!source || typeof source.blob !== 'function') {
        throw new Error('No se puede leer el archivo de esta fuente. Carga las fuentes y vuelve a intentarlo.');
      }
      const key = `${fontIdentityKey(typography)}\u0000${character}`;
      if (analysisCache.has(key)) return analysisCache.get(key);
      const blob = await source.blob();
      const result = await native.analyzeFontAlternates({
        bytes: await blob.arrayBuffer(),
        character,
        postscript_name: typography.font_postscript_name || '',
      });
      analysisCache.set(key, result);
      return result;
    }

    async function analyzeInventory(typography) {
      const native = options.nativeBridge();
      if (!native || !native.analyzeFontAlternateInventory) {
        throw new Error('El análisis de alternativas está disponible en la aplicación de escritorio.');
      }
      const source = fontSourceForTypography(typography);
      if (!source || typeof source.blob !== 'function') {
        throw new Error('No se puede leer el archivo de esta fuente. Carga las fuentes y vuelve a intentarlo.');
      }
      const key = fontIdentityKey(typography);
      if (inventoryCache.has(key)) return inventoryCache.get(key);
      const pending = (async () => {
        const blob = await source.blob();
        return native.analyzeFontAlternateInventory({
          bytes: await blob.arrayBuffer(),
          postscript_name: typography.font_postscript_name || '',
        });
      })();
      inventoryCache.set(key, pending);
      try {
        return await pending;
      } catch (error) {
        inventoryCache.delete(key);
        throw error;
      }
    }

    function saveRule(category, typography, character, feature, characters = [character]) {
      const settings = options.getProductionSettings();
      const font = fontIdentity(typography);
      const rules = options.normalizeGlyphAlternates(settings.glyph_alternates).filter((rule) => (
        rule.category !== category || !sameFontIdentity(rule.font, font) || rule.character !== character
      ));
      if (feature) rules.push({ category, font, character, characters, feature });
      cssSignature = '';
      options.updateSettings({ glyph_alternates: rules });
    }

    function aliasForRule(rule) {
      const source = `${rule.category}\u0000${fontIdentityKey(rule.font)}\u0000${rule.character}\u0000${rule.feature}`;
      let hash = 2166136261;
      for (let index = 0; index < source.length; index += 1) {
        hash ^= source.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      return `CreditosGlyphAlt${(hash >>> 0).toString(36)}`;
    }

    function cssString(value) {
      return `"${String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }

    function syncFontFaces(settings = options.getProductionSettings()) {
      const rules = options.normalizeGlyphAlternates(settings.glyph_alternates);
      const signature = JSON.stringify(rules);
      if (signature === cssSignature) return;
      cssSignature = signature;
      let style = documentRef.getElementById('glyphAlternateFontFaces');
      if (!style) {
        style = documentRef.createElement('style');
        style.id = 'glyphAlternateFontFaces';
        documentRef.head.appendChild(style);
      }
      style.textContent = rules.map((rule) => {
        const sources = [rule.font.postscript_name, rule.font.family]
          .filter(Boolean)
          .map((name) => `local(${cssString(name)})`)
          .join(', ');
        const unicode = rule.characters
          .map((character) => `U+${character.codePointAt(0).toString(16).toUpperCase()}`)
          .join(', ');
        return `@font-face { font-family: ${cssString(aliasForRule(rule))}; src: ${sources}; font-style: ${options.fontStyleFromStyle(rule.font.style)}; font-weight: ${options.fontWeightFromStyle(rule.font.style)}; font-feature-settings: ${cssString(rule.feature)} 1; unicode-range: ${unicode}; }`;
      }).join('\n');
      if (typeof options.clearCanvasTextCaches === 'function') options.clearCanvasTextCaches();
    }

    function fontFamilyCss(category, typography, settings = options.getProductionSettings()) {
      syncFontFaces(settings);
      const aliases = rulesForTypography(category, typography, settings).map(aliasForRule);
      return [...aliases, typography.font_family || 'Arial'].map(options.quoteFontFamily).join(', ');
    }

    async function ensureFontsReady(settings = options.getProductionSettings()) {
      syncFontFaces(settings);
      if (!documentRef.fonts || !documentRef.fonts.load) return;
      const rules = options.normalizeGlyphAlternates(settings.glyph_alternates);
      await Promise.all(rules.map((rule) => documentRef.fonts.load(
        `16px ${options.quoteFontFamily(aliasForRule(rule))}`,
        rule.character
      )));
    }

    return {
      analyzeCharacter,
      analyzeInventory,
      ensureFontsReady,
      fontFamilyCss,
      fontIdentity,
      rulesForTypography,
      saveRule,
      setFontSources,
      syncFontFaces,
    };
  }

  root.CreditosAppGlyphAlternates = { createAppGlyphAlternates };
})(globalThis);
