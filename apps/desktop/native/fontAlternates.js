const fontkit = require('fontkit');

function createFontAlternateAnalyzer() {
  function openFont(payload, bytes) {
    const parsedFont = fontkit.create(Buffer.from(bytes));
    const font = typeof parsedFont.layout === 'function'
      ? parsedFont
      : parsedFont.getFont(String(payload.postscript_name || '') || null);
    if (!font || typeof font.layout !== 'function') {
      throw new Error('No se pudo identificar la variante seleccionada dentro del archivo de fuente.');
    }
    return font;
  }

  function alternativesForCharacter(font, character) {
    const baseRun = font.layout(character);
    const baseGlyphIds = baseRun.glyphs.map((glyph) => glyph.id);
    const candidates = (font.availableFeatures || []).filter((tag) => /^(?:ss\d\d|cv\d\d|salt|aalt)$/.test(tag));
    const alternativesByGlyphs = new Map();

    candidates.forEach((feature) => {
      const run = font.layout(character, [feature]);
      const glyphIds = run.glyphs.map((glyph) => glyph.id);
      if (glyphIds.join(',') === baseGlyphIds.join(',')) return;
      const key = glyphIds.join(',');
      const candidate = {
        feature,
        glyph_ids: glyphIds,
        glyph_names: run.glyphs.map((glyph) => glyph.name || ''),
      };
      const existing = alternativesByGlyphs.get(key);
      if (!existing || existing.feature === 'aalt') alternativesByGlyphs.set(key, candidate);
    });

    return {
      character,
      base_glyph_ids: baseGlyphIds,
      base_glyph_names: baseRun.glyphs.map((glyph) => glyph.name || ''),
      alternatives: Array.from(alternativesByGlyphs.values()),
    };
  }

  function analyze(payload = {}) {
    const bytes = payload.bytes;
    const character = String(payload.character || '');
    if (!bytes) throw new Error('No se recibieron los datos de la fuente.');
    if (Array.from(character).length !== 1) throw new Error('Introduce una sola letra.');

    const font = openFont(payload, bytes);
    const result = alternativesForCharacter(font, character);

    return {
      postscript_name: font.postscriptName || '',
      family_name: font.familyName || '',
      ...result,
    };
  }

  function analyzeInventory(payload = {}) {
    const bytes = payload.bytes;
    if (!bytes) throw new Error('No se recibieron los datos de la fuente.');
    const font = openFont(payload, bytes);
    const characters = (font.characterSet || [])
      .map((codePoint) => String.fromCodePoint(codePoint))
      .filter((character) => /^\p{Letter}$/u.test(character) && /^\p{Script=Latin}$/u.test(character));
    const entries = characters
      .map((character) => alternativesForCharacter(font, character))
      .filter((entry) => entry.alternatives.length)
      .map((entry) => ({
        ...entry,
        base_character: entry.character.normalize('NFD').replace(/\p{Mark}/gu, ''),
        case: entry.character === entry.character.toUpperCase()
          && entry.character !== entry.character.toLowerCase() ? 'uppercase' : 'lowercase',
      }));
    return {
      postscript_name: font.postscriptName || '',
      family_name: font.familyName || '',
      entries,
    };
  }

  return { analyze, analyzeInventory };
}

module.exports = { createFontAlternateAnalyzer };
