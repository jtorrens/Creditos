(function (root) {
  function createAppGlyphAlternates(options = {}) {
    const documentRef = options.documentRef || root.document;
    const fontSources = new Map();
    const analysisCache = new Map();
    const inventoryCache = new Map();
    const resolvedFaceRules = new Map();
    let cssSignature = '';

    function fontIdentity(font = {}) {
      const style = String(font.style || font.font_style || 'Regular');
      return {
        family: String(font.family || font.font_family || ''),
        style,
        weight: Number(font.weight || font.font_weight) || options.fontWeightFromStyle(style),
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

    function sameFontFamily(left, right) {
      const a = fontIdentity(left);
      const b = fontIdentity(right);
      if (a.family && b.family) return a.family.toLowerCase() === b.family.toLowerCase();
      return sameFontIdentity(a, b);
    }

    function setFontSources(fonts = []) {
      fontSources.clear();
      fonts.forEach((font) => fontSources.set(fontIdentityKey(font), font));
      analysisCache.clear();
      inventoryCache.clear();
      resolvedFaceRules.clear();
    }

    function fontSourceForTypography(typography = {}) {
      const direct = fontSources.get(fontIdentityKey(typography));
      const target = fontIdentity(typography);
      if (direct && sameFontFamily(direct, target)) return direct;
      for (const source of fontSources.values()) {
        const candidate = fontIdentity(source);
        if (sameFontFamily(candidate, target) && candidate.style.toLowerCase() === target.style.toLowerCase()) return source;
      }
      for (const source of fontSources.values()) {
        if (sameFontFamily(source, target)) return source;
      }
      return null;
    }

    function resolvedFontForTypography(typography = {}) {
      const target = fontIdentity(typography);
      let source = fontSources.get(fontIdentityKey(target));
      if (source && !sameFontFamily(source, target)) source = null;
      if (!source) {
        const targetItalic = /italic|oblique/i.test(target.style);
        source = Array.from(fontSources.values())
          .filter((candidate) => sameFontFamily(candidate, target))
          .sort((left, right) => {
            const a = fontIdentity(left);
            const b = fontIdentity(right);
            const postureScore = Number(/italic|oblique/i.test(a.style) !== targetItalic)
              - Number(/italic|oblique/i.test(b.style) !== targetItalic);
            if (postureScore !== 0) return postureScore;
            const styleScore = Number(a.style.toLowerCase() !== target.style.toLowerCase())
              - Number(b.style.toLowerCase() !== target.style.toLowerCase());
            if (styleScore !== 0) return styleScore;
            return Math.abs(a.weight - target.weight) - Math.abs(b.weight - target.weight);
          })[0] || null;
      }
      return {
        ...target,
        postscript_name: source ? fontIdentity(source).postscript_name : '',
      };
    }

    function rulesForTypography(category, typography, settings = options.getProductionSettings()) {
      return options.normalizeGlyphAlternates(settings.glyph_alternates)
        .filter((rule) => rule.category === category && sameFontFamily(rule.font, typography));
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
        rule.category !== category || !sameFontFamily(rule.font, font) || rule.character !== character
      ));
      if (feature) rules.push({ category, font, character, characters, feature });
      resolvedFaceRules.clear();
      cssSignature = '';
      options.updateSettings({ glyph_alternates: rules });
    }

    function aliasForRule(rule) {
      const font = fontIdentity(rule.font);
      const source = `${rule.category}\u0000${fontIdentityKey(font)}\u0000${font.weight}\u0000${rule.character}\u0000${rule.feature}`;
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

    function fontLoadDescriptor(rule) {
      const font = fontIdentity(rule.font);
      return `${options.fontStyleFromStyle(font.style)} ${font.weight} 16px ${options.quoteFontFamily(aliasForRule(rule))}`;
    }

    function loadRuleFaces(rules) {
      if (!documentRef.fonts || !documentRef.fonts.load) return Promise.resolve();
      return Promise.all(rules.map((rule) => documentRef.fonts.load(
        fontLoadDescriptor(rule),
        rule.character
      )));
    }

    function faceRules(settings) {
      const rules = options.normalizeGlyphAlternates(settings.glyph_alternates);
      const byAlias = new Map(rules.map((rule) => [aliasForRule(rule), rule]));
      resolvedFaceRules.forEach((rule, alias) => byAlias.set(alias, rule));
      return Array.from(byAlias.values());
    }

    function syncFontFaces(settings = options.getProductionSettings()) {
      const rules = faceRules(settings);
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
        const font = fontIdentity(rule.font);
        return `@font-face { font-family: ${cssString(aliasForRule(rule))}; src: ${sources}; font-style: ${options.fontStyleFromStyle(font.style)}; font-weight: ${font.weight}; font-feature-settings: ${cssString(rule.feature)} 1; unicode-range: ${unicode}; }`;
      }).join('\n');
      if (typeof options.clearCanvasTextCaches === 'function') options.clearCanvasTextCaches();
      if (rules.length && typeof options.onFontFacesReady === 'function') {
        loadRuleFaces(rules).then(() => {
          if (signature !== cssSignature) return;
          if (typeof options.clearCanvasTextCaches === 'function') options.clearCanvasTextCaches();
          options.onFontFacesReady();
        }).catch(() => {});
      }
    }

    function fontFamilyCss(category, typography, settings = options.getProductionSettings()) {
      const resolvedRules = rulesForTypography(category, typography, settings).map((rule) => ({
        ...rule,
        font: resolvedFontForTypography(typography),
      }));
      resolvedRules.forEach((rule) => resolvedFaceRules.set(aliasForRule(rule), rule));
      syncFontFaces(settings);
      const aliases = resolvedRules.map(aliasForRule);
      return [...aliases, typography.font_family || 'Arial'].map(options.quoteFontFamily).join(', ');
    }

    async function ensureFontsReady(settings = options.getProductionSettings()) {
      syncFontFaces(settings);
      const rules = faceRules(settings);
      await loadRuleFaces(rules);
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
