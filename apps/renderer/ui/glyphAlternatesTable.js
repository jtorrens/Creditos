(function (root) {
  function createGlyphAlternatesTable(options = {}) {
    const documentRef = options.documentRef || root.document;
    let radioSequence = 0;

    function groupedEntries(entries = []) {
      const groups = new Map();
      entries.forEach((entry) => {
        const base = entry.base_character || entry.character;
        const key = `${entry.case}\u0000${base}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(entry);
      });
      return Array.from(groups.values()).map((related) => {
        const base = related[0].base_character || related[0].character;
        const representative = related.find((entry) => entry.character === base);
        if (!representative || !representative.alternatives.length) return null;
        return {
          ...representative,
          related_characters: related.map((entry) => entry.character),
          related_entries: related,
        };
      }).filter(Boolean);
    }

    function render(category, typography) {
      const section = documentRef.createElement('details');
      section.className = 'glyph-alternates-section';
      const heading = documentRef.createElement('summary');
      heading.textContent = 'Formas alternativas';
      const content = documentRef.createElement('div');
      content.className = 'glyph-alternates-content';
      content.textContent = 'Abre esta sección para consultar las formas disponibles.';
      section.appendChild(heading);
      section.appendChild(content);

      let loaded = false;
      function loadInventory() {
        if (loaded) return;
        loaded = true;
        content.textContent = 'Buscando alternativas…';
        options.analyzeInventory(typography).then((inventory) => {
          if (!section.isConnected) return;
          const entries = groupedEntries(inventory.entries || []);
          content.innerHTML = '';
          if (!entries.length) {
            content.className = 'glyph-alternates-content glyph-alternates-empty';
            content.textContent = 'Esta fuente no contiene letras alternativas.';
            return;
          }
          ['uppercase', 'lowercase'].forEach((letterCase) => {
            const caseEntries = entries.filter((entry) => entry.case === letterCase);
            if (!caseEntries.length) return;
            content.appendChild(renderCaseGroup(
              category,
              typography,
              letterCase === 'uppercase' ? 'Mayúsculas' : 'Minúsculas',
              caseEntries
            ));
          });
        }).catch((error) => {
          if (!section.isConnected) return;
          content.className = 'glyph-alternates-content glyph-alternates-empty';
          content.textContent = error.message;
        });
      }
      section.addEventListener('toggle', () => {
        if (section.open) loadInventory();
      });
      return section;
    }

    function renderCaseGroup(category, typography, title, entries) {
      const group = documentRef.createElement('div');
      group.className = 'glyph-alternates-case';
      const titleElement = documentRef.createElement('h5');
      titleElement.textContent = title;
      group.appendChild(titleElement);
      entries.forEach((entry) => group.appendChild(renderCharacterRow(category, typography, entry)));
      return group;
    }

    function renderCharacterRow(category, typography, entry) {
      const row = documentRef.createElement('div');
      row.className = 'glyph-alternate-row';
      const reference = documentRef.createElement('div');
      reference.className = 'glyph-alternate-reference';
      reference.textContent = entry.character;
      reference.title = 'Carácter';
      row.appendChild(reference);

      const current = options.rulesForTypography(category, typography)
        .find((rule) => rule.character === entry.character);
      const currentIsAvailable = !!current
        && entry.alternatives.some((alternative) => alternative.feature === current.feature);
      const radioName = `glyph-alternate-${category}-${radioSequence += 1}`;
      row.appendChild(optionCell({
        checked: !currentIsAvailable,
        feature: '',
        label: 'Base',
        radioName,
        typography,
        entry,
        category,
      }));
      entry.alternatives.forEach((alternative, index) => {
        row.appendChild(optionCell({
          checked: !!current && current.feature === alternative.feature,
          feature: alternative.feature,
          label: `Alternativa ${index + 1}`,
          radioName,
          typography,
          entry,
          category,
        }));
      });
      return row;
    }

    function optionCell({ category, checked, entry, feature, label, radioName, typography }) {
      const cell = documentRef.createElement('label');
      cell.className = 'glyph-alternate-option';
      const caption = documentRef.createElement('span');
      caption.className = 'glyph-alternate-option-label';
      caption.textContent = label;
      const glyph = documentRef.createElement('strong');
      glyph.textContent = entry.character;
      glyph.style.fontFamily = options.quoteFontFamily(typography.font_family);
      glyph.style.fontStyle = options.fontStyleFromStyle(typography.font_style);
      glyph.style.fontWeight = options.fontWeightFromTypography(typography);
      glyph.style.fontFeatureSettings = feature ? `"${feature}" 1` : 'normal';
      const radio = documentRef.createElement('input');
      radio.type = 'radio';
      radio.name = radioName;
      radio.checked = checked;
      radio.setAttribute('aria-label', `${entry.character}: ${label}`);
      radio.addEventListener('change', () => {
        if (!radio.checked) return;
        const compatibleCharacters = entry.related_characters.filter((character) => {
          const related = entry.related_entries.find((item) => item.character === character);
          return !feature || (related && related.alternatives.some((alternative) => alternative.feature === feature));
        });
        options.saveRule(category, typography, entry.character, feature, compatibleCharacters);
      });
      cell.appendChild(caption);
      cell.appendChild(glyph);
      cell.appendChild(radio);
      return cell;
    }

    return { render };
  }

  root.CreditosGlyphAlternatesTable = { createGlyphAlternatesTable };
})(globalThis);
