(function () {
  const state = {
    source: null,
    materials: [],
    structure: null,
    render: null,
    selectedCartelaId: null,
    preview: 'structure',
    activeTab: 'settings',
    structureFileHandle: null,
    renderFileHandle: null,
  };

  const els = {
    xlsxInput: document.getElementById('xlsxInput'),
    openStructureBtn: document.getElementById('openStructureBtn'),
    structureInput: document.getElementById('structureInput'),
    sourceMeta: document.getElementById('sourceMeta'),
    blockCount: document.getElementById('blockCount'),
    blockList: document.getElementById('blockList'),
    editorTitle: document.getElementById('editorTitle'),
    editorKind: document.getElementById('editorKind'),
    editorBody: document.getElementById('editorBody'),
    jsonPreview: document.getElementById('jsonPreview'),
    visualPreview: document.getElementById('visualPreview'),
    defaultDurationInput: document.getElementById('defaultDurationInput'),
    defaultAutoLinesInput: document.getElementById('defaultAutoLinesInput'),
    typographySettings: document.getElementById('typographySettings'),
    tabButtons: Array.from(document.querySelectorAll('.app-tabs button')),
    tabPanes: Array.from(document.querySelectorAll('.tab-pane')),
    structureTab: document.getElementById('structureTab'),
    renderTab: document.getElementById('renderTab'),
    saveStructureBtn: document.getElementById('saveStructureBtn'),
    saveStructureAsBtn: document.getElementById('saveStructureAsBtn'),
    saveRenderBtn: document.getElementById('saveRenderBtn'),
    saveRenderAsBtn: document.getElementById('saveRenderAsBtn'),
  };

  const TYPOGRAPHY_FIELDS = [
    ['page_header', 'Cabecera'],
    ['block_title', 'Titulo bloque'],
    ['role', 'Cargo'],
    ['name', 'Nombre'],
  ];

  const FONT_OPTIONS = [
    'Arial',
    'Helvetica',
    'Georgia',
    'Times New Roman',
    'Courier New',
    'Verdana',
    'Trebuchet MS',
  ];

  els.xlsxInput.addEventListener('change', loadXlsxFile);
  els.openStructureBtn.addEventListener('click', openStructureJsonFile);
  els.structureInput.addEventListener('change', (event) => loadJsonFile(event, loadStructureJson));
  els.tabButtons.forEach((button) => {
    button.addEventListener('click', () => setActiveTab(button.dataset.tab));
  });
  els.defaultDurationInput.addEventListener('change', () => updateSettings({
    default_cartela_duration: Number(els.defaultDurationInput.value) || 0,
  }));
  els.defaultAutoLinesInput.addEventListener('change', () => updateSettings({
    default_auto_page_lines: Math.max(1, Number(els.defaultAutoLinesInput.value) || 1),
  }));
  els.structureTab.addEventListener('click', () => setPreview('structure'));
  els.renderTab.addEventListener('click', () => setPreview('render'));
  els.saveStructureBtn.addEventListener('click', () => saveJsonFile('structure_json'));
  els.saveStructureAsBtn.addEventListener('click', () => saveJsonFile('structure_json', true));
  els.saveRenderBtn.addEventListener('click', () => saveJsonFile('render_json'));
  els.saveRenderAsBtn.addEventListener('click', () => saveJsonFile('render_json', true));

  async function loadXlsxFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    try {
      els.sourceMeta.textContent = `Parseando ${file.name}...`;
      const form = new FormData();
      form.append('file', file);

      const response = await fetch('/api/parse-xlsx', { method: 'POST', body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Error al parsear el XLSX.');
      loadSourceJson(payload, file.name);
    } catch (error) {
      window.alert(
        'No se pudo parsear el XLSX: ' +
          error.message +
          '\n\nPara abrir XLSX, inicia la app con:\npython3 web_app/server.py'
      );
      renderMeta();
    } finally {
      event.target.value = '';
    }
  }

  function loadJsonFile(event, handler) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        handler(JSON.parse(reader.result), file.name);
      } catch (error) {
        window.alert('No se pudo leer el JSON: ' + error.message);
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  async function openStructureJsonFile() {
    if (!window.showOpenFilePicker) {
      els.structureInput.click();
      return;
    }

    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: 'JSON',
            accept: { 'application/json': ['.json'] },
          },
        ],
      });
      if (!handle) return;
      const file = await handle.getFile();
      const text = await file.text();
      loadStructureJson(JSON.parse(text), file.name);
      state.structureFileHandle = handle;
    } catch (error) {
      if (error.name !== 'AbortError') {
        window.alert('No se pudo abrir el structure_json: ' + error.message);
      }
    }
  }

  function loadSourceJson(json, fileName) {
    state.source = normalizeSource(json, fileName);
    state.materials = createMaterialsFromSource(state.source);
    state.structure = createStructureFromSource(state.source, state.materials, state.structure);
    state.structureFileHandle = null;
    state.renderFileHandle = null;
    state.selectedCartelaId = state.structure.cartelas[0] ? state.structure.cartelas[0].id : null;
    rebuild();
  }

  function loadStructureJson(json) {
    state.structure = migrateStructure(json);
    state.structureFileHandle = null;
    state.renderFileHandle = null;
    if (state.source) {
      state.structure = createStructureFromSource(state.source, state.materials, state.structure);
      state.selectedCartelaId = state.structure.cartelas[0] ? state.structure.cartelas[0].id : null;
    }
    rebuild();
  }

  function normalizeSource(source, fileName) {
    const normalized = JSON.parse(JSON.stringify(source));
    normalized.meta = normalized.meta || {};
    normalized.meta.loaded_file = fileName;
    normalized.blocks = (normalized.blocks || []).map((block, blockIndex) => {
      const blockId = block.id || makeBlockId(block, blockIndex);
      return {
        ...block,
        id: blockId,
        items: (block.items || []).map((item, itemIndex) => ({
          ...item,
          id: item.id || makeItemId(blockId, item, itemIndex),
          names: Array.isArray(item.names)
            ? item.names.map((name, nameIndex) => ({
                ...name,
                id: name.id || makeNameId(blockId, item, name, nameIndex),
              }))
            : item.names,
        })),
      };
    });
    return normalized;
  }

  function createMaterialsFromSource(source) {
    const materials = [];

    (source.blocks || []).forEach((block) => {
      if (block.type !== 'crew') {
        materials.push({
          id: block.id,
          source_block_id: block.id,
          group: block.group,
          title: block.title,
          titles: block.titles || [block.title],
          type: block.type,
          items: block.items || [],
        });
        return;
      }

      splitCrewBlockIntoMaterials(block).forEach((material) => materials.push(material));
    });

    return materials;
  }

  function splitCrewBlockIntoMaterials(block) {
    const materials = [];
    let current = null;

    (block.items || []).forEach((item) => {
      if (item.kind === 'section') {
        current = {
          id: `${block.id}_section_${item.row}_${safeFilePart(item.title || 'section')}`,
          source_block_id: block.id,
          source_section_id: item.id,
          group: block.group,
          title: item.title,
          titles: [item.title],
          type: crewMaterialType(item.title),
          items: [item],
        };
        materials.push(current);
        return;
      }

      if (!current) {
        current = {
          id: `${block.id}_section_intro`,
          source_block_id: block.id,
          group: block.group,
          title: block.title || 'RODILLO FINAL',
          titles: [block.title || 'RODILLO FINAL'],
          type: 'crew_section',
          items: [],
        };
        materials.push(current);
      }

      current.items.push(item);
    });

    return materials;
  }

  function crewMaterialType(title) {
    if (title === 'Licencias Musicales') return 'music_licenses';
    if (title === 'AGRADECIMIENTOS' || title === 'Vestuario') return 'thanks';
    if (title === 'Logos') return 'logos';
    if (title === 'closing_copy') return 'closing';
    return 'crew_section';
  }

  function createStructureFromSource(source, materials, previousStructure) {
    const previous = migrateStructure(previousStructure);
    const materialIds = new Set(materials.map((material) => material.id));
    const previousByRef = new Map();
    const previousById = new Map();
    const previousOverrides = previous && previous.overrides ? previous.overrides : {};
    const previousPageBreaks = previous && previous.page_breaks ? previous.page_breaks : {};
    const settings = normalizeSettings(previous && previous.settings ? previous.settings : {});

    if (previous && Array.isArray(previous.cartelas)) {
      previous.cartelas.forEach((cartela) => {
        previousById.set(cartela.id, cartela);
        const refs = getCartelaRefs(cartela);
        refs.forEach((ref) => previousByRef.set(ref, cartela));
      });
    }

    const usedPrevious = new Set();
    const cartelas = [];
    materials.forEach((material, index) => {
      const previousCartela = previousByRef.get(material.id);
      if (previousCartela && usedPrevious.has(previousCartela.id)) {
        return;
      }
      if (previousCartela) usedPrevious.add(previousCartela.id);
      cartelas.push(
        previousCartela
          ? normalizeCartela(previousCartela, material, index)
          : defaultCartelaForMaterial(material, index, settings)
      );
    });

    if (previous && Array.isArray(previous.cartelas)) {
      previous.cartelas.forEach((cartela) => {
        if (!usedPrevious.has(cartela.id)) {
          cartelas.push(cartela);
        }
      });
    }
    cartelas.forEach((cartela) => {
      cartela.pages = (cartela.pages || []).map((page) => normalizeCartelaPage(page));
      if (hasMissingMaterialRefs(cartela, materialIds)) {
        cartela.enabled = false;
      }
    });
    enforceUniqueMaterialRefs({ cartelas });

    return {
      schema: 'credits_structure_json',
      version: 6,
      source_sheet: source.sheet || '',
      source_file: source.meta && source.meta.loaded_file ? source.meta.loaded_file : source.source || '',
      cartelas,
      settings,
      overrides: previousOverrides,
      page_breaks: previousPageBreaks,
    };
  }

  function hasMissingMaterialRefs(cartela, materialIds) {
    return getCartelaRefs(cartela).some((ref) => !materialIds.has(ref));
  }

  function migrateStructure(structure) {
    if (!structure) return null;
    if (Array.isArray(structure.cartelas)) {
      structure.version = Math.max(Number(structure.version) || 0, 6);
      structure.page_breaks = structure.page_breaks || {};
      structure.settings = normalizeSettings(structure.settings || {});
      structure.cartelas.forEach((cartela) => {
        cartela.pages = (cartela.pages || []).map((page) => normalizeCartelaPage(page));
      });
      return structure;
    }

    if (Array.isArray(structure.pages)) {
      return {
        schema: 'credits_structure_json',
        version: 6,
        source_sheet: structure.source_sheet || '',
        source_file: structure.source_file || '',
        cartelas: structure.pages.map((page, index) => ({
          id: `cartela_${String(index + 1).padStart(3, '0')}`,
          title: page.title || `Cartela ${index + 1}`,
          type: page.layout || 'card',
          orientation: page.orientation || 'horizontal',
          columns: page.columns || (page.distribution === 'columns' ? 2 : 1),
          font_size_multiplier: Number(page.font_size_multiplier) || 1,
          line_spacing_multiplier: Number(page.line_spacing_multiplier) || 1,
          duration: 4,
          enabled: page.enabled !== false,
          notes: page.notes || '',
          pages: [
            {
              id: page.id || `page_${String(index + 1).padStart(3, '0')}`,
              source_refs: page.block_ref ? [page.block_ref] : [],
              source_ref_settings: page.block_ref ? { [page.block_ref]: { columns: 1 } } : {},
            },
          ],
        })),
        settings: normalizeSettings(structure.settings || {}),
        overrides: structure.overrides || {},
        page_breaks: structure.page_breaks || {},
      };
    }

    structure.version = Math.max(Number(structure.version) || 0, 6);
    structure.page_breaks = structure.page_breaks || {};
    structure.settings = normalizeSettings(structure.settings || {});
    (structure.cartelas || []).forEach((cartela) => {
      cartela.pages = (cartela.pages || []).map((page) => normalizeCartelaPage(page));
    });
    return structure;
  }

  function defaultSettings() {
    return {
      default_cartela_duration: 4,
      default_auto_page_lines: 18,
      typography: {
        page_header: { font_size: 12, font_family: 'Arial', color: '#58616a' },
        block_title: { font_size: 16, font_family: 'Arial', color: '#24545f' },
        role: { font_size: 14, font_family: 'Arial', color: '#171b1f' },
        name: { font_size: 14, font_family: 'Arial', color: '#171b1f' },
      },
      layout: {
        line_spacing: 1.12,
        column_gap: 14,
        role_name_gap: 6,
      },
    };
  }

  function normalizeSettings(settings) {
    const defaults = defaultSettings();
    const normalized = {
      ...defaults,
      ...settings,
      typography: {
        ...defaults.typography,
        ...(settings.typography || {}),
      },
      layout: {
        ...defaults.layout,
        ...(settings.layout || {}),
      },
    };
    TYPOGRAPHY_FIELDS.forEach(([key]) => {
      normalized.typography[key] = {
        ...defaults.typography[key],
        ...(settings.typography && settings.typography[key] ? settings.typography[key] : {}),
      };
      normalized.typography[key].font_size = Math.max(1, Number(normalized.typography[key].font_size) || defaults.typography[key].font_size);
      normalized.typography[key].font_family = normalized.typography[key].font_family || defaults.typography[key].font_family;
      normalized.typography[key].color = normalized.typography[key].color || defaults.typography[key].color;
    });
    normalized.layout.line_spacing = Math.max(0.1, Number(normalized.layout.line_spacing) || defaults.layout.line_spacing);
    normalized.layout.column_gap = Math.max(0, Number(normalized.layout.column_gap) || defaults.layout.column_gap);
    normalized.layout.role_name_gap = Math.max(0, Number(normalized.layout.role_name_gap) || defaults.layout.role_name_gap);
    return normalized;
  }

  function defaultCartelaForMaterial(material, index, settings) {
    return {
      id: `cartela_${String(index + 1).padStart(3, '0')}`,
      title: material.title || `Cartela ${index + 1}`,
      type: defaultLayoutForMaterial(material),
      orientation: defaultOrientationForMaterial(material),
      columns: 1,
      font_size_multiplier: 1,
      line_spacing_multiplier: 1,
      duration: Number(settings.default_cartela_duration) || 4,
      enabled: true,
      notes: '',
      pages: [
        {
          id: `page_${String(index + 1).padStart(3, '0')}_001`,
          source_refs: [material.id],
          source_ref_settings: { [material.id]: { columns: 1 } },
        },
      ],
    };
  }

  function normalizeCartela(cartela, material, index) {
    const normalized = JSON.parse(JSON.stringify(cartela));
    normalized.id = normalized.id || `cartela_${String(index + 1).padStart(3, '0')}`;
    normalized.title = normalized.title || material.title || `Cartela ${index + 1}`;
    normalized.type = normalized.type || defaultLayoutForMaterial(material);
    normalized.orientation = normalized.orientation || defaultOrientationForMaterial(material);
    normalized.columns = normalized.columns || (normalized.distribution === 'columns' ? 2 : 1);
    normalized.font_size_multiplier = Number(normalized.font_size_multiplier) || 1;
    normalized.line_spacing_multiplier = Number(normalized.line_spacing_multiplier) || 1;
    delete normalized.distribution;
    normalized.duration = normalized.duration === undefined ? 4 : normalized.duration;
    normalized.enabled = normalized.enabled !== false;
    normalized.pages = normalized.pages && normalized.pages.length
      ? normalized.pages
      : [{ id: `${normalized.id}_page_001`, source_refs: [material.id] }];
    normalized.pages = normalized.pages.map((page) => normalizeCartelaPage(page));
    return normalized;
  }

  function normalizeCartelaPage(page) {
    const normalized = {
      ...page,
      source_refs: page.source_refs || [],
      source_ref_settings: page.source_ref_settings || {},
    };
    normalized.source_refs.forEach((ref) => {
      normalized.source_ref_settings[ref] = normalized.source_ref_settings[ref] || {};
      normalized.source_ref_settings[ref].columns = Math.max(1, Number(normalized.source_ref_settings[ref].columns) || 1);
      normalized.source_ref_settings[ref].alignment = normalized.source_ref_settings[ref].alignment || {};
    });
    return normalized;
  }

  function buildRenderJson(source, materials, structure) {
    const materialById = new Map(materials.map((material) => [material.id, material]));
    const overrides = structure.overrides || {};
    const maxAutoLines = Number(structure.settings && structure.settings.default_auto_page_lines) || 0;

    return {
      schema: 'credits_render_json',
      version: 3,
      source_sheet: source.sheet || '',
      settings: {
        typography: normalizeSettings(structure.settings || {}).typography,
        layout: normalizeSettings(structure.settings || {}).layout,
      },
      cartelas: (structure.cartelas || [])
        .filter((cartela) => cartela.enabled !== false)
        .map((cartela, cartelaIndex) => ({
          id: cartela.id,
          cartela_number: cartelaIndex + 1,
          title: resolveOverride(overrides, cartela.id, 'title', cartela.title),
          type: cartela.type,
          orientation: cartela.orientation || 'horizontal',
          columns: Number(cartela.columns) || 1,
          font_size_multiplier: Number(cartela.font_size_multiplier) || 1,
          line_spacing_multiplier: Number(cartela.line_spacing_multiplier) || 1,
          duration: Number(cartela.duration) || 0,
          pages: (cartela.pages || []).map((page, pageIndex) => ({
            id: page.id,
            page_number: pageIndex + 1,
            title: resolveOverride(overrides, page.id, 'title', `Pagina ${pageIndex + 1}`),
            blocks: (page.source_refs || []).map((ref) => {
              const material = materialById.get(ref);
              const block = renderMaterial(material, ref, overrides, structure.page_breaks || {}, maxAutoLines);
              block.columns = getSourceRefColumns(page, ref);
              block.alignment = getSourceRefAlignment(page, ref, material, cartela);
              return block;
            }),
          })),
        })),
    };
  }

  function renderMaterial(material, ref, overrides, pageBreaks, maxAutoLines) {
    if (!material) return { missing_source: ref };
    const breaks = pageBreaks[material.id] || [];
    const rendered = {
      id: material.id,
      source_block_id: material.source_block_id,
      group: material.group,
      type: material.type,
      title: resolveOverride(overrides, material.id, 'title', material.title),
      titles: resolveOverride(overrides, material.id, 'titles', material.titles || [material.title]),
    };

    if (material.type === 'music_licenses') {
      rendered.themes = groupMusicLicenseThemes(material.items || [], overrides);
      rendered.pages = splitRenderedUnitsByBreaks(rendered.themes, breaks, (theme) => theme.lines[theme.lines.length - 1].id, maxAutoLines, countThemeLines);
    } else {
      rendered.items = flattenRenderedItems(material.items || [], overrides);
      rendered.pages = splitRenderedUnitsByBreaks(rendered.items, breaks, (item) => item.id, maxAutoLines, countItemLines);
    }

    rendered.pages = rendered.pages.map((page) => ({
      ...page,
      title: resolveOverride(overrides, blockPageTitleRef(material.id, page.id), 'title', rendered.title),
    }));

    return rendered;
  }

  function splitRenderedUnitsByBreaks(units, breaks, idForUnit, maxAutoLines, lineCounter) {
    const breakSet = new Set(breaks || []);
    const pages = [];
    let currentPage = { id: `block_page_${String(pages.length + 1).padStart(2, '0')}`, items: [] };
    let currentLines = 0;

    units.forEach((unit, index) => {
      const unitLines = Math.max(1, lineCounter(unit));
      currentPage.items.push(unit);
      currentLines += unitLines;
      const shouldAutoBreak = maxAutoLines > 0 && currentLines >= maxAutoLines && index < units.length - 1;
      if (breakSet.has(idForUnit(unit)) || shouldAutoBreak) {
        pages.push(currentPage);
        currentPage = { id: `block_page_${String(pages.length + 1).padStart(2, '0')}`, items: [] };
        currentLines = 0;
      }
    });

    if (currentPage.items.length || !pages.length) {
      pages.push(currentPage);
    }

    return pages;
  }

  function countThemeLines(theme) {
    return theme.lines ? theme.lines.length : 1;
  }

  function countItemLines(item) {
    return 1;
  }

  function blockPageTitleRef(blockId, pageId) {
    return `${blockId}__${pageId}`;
  }

  function flattenRenderedItems(items, overrides) {
    const flattened = [];
    items.forEach((item) => {
      if (item.kind === 'credit' || item.kind === 'crew_credit') {
        const names = item.names && item.names.length ? item.names : [{ id: `${item.id}_empty_name`, row: item.row, name: '' }];
        names.forEach((name) => {
          flattened.push({
            id: `${item.id}__${name.id}`,
            source_item_id: item.id,
            source_name_id: name.id,
            kind: item.kind,
            row: name.row || item.row,
            section: resolveOverride(overrides, item.id, 'section', item.section),
            role: resolveOverride(overrides, item.id, 'role', item.role),
            name: resolveOverride(overrides, name.id, 'name', name.name),
          });
        });
        return;
      }
      flattened.push(renderItem(item, overrides));
    });
    return flattened;
  }

  function groupMusicLicenseThemes(items, overrides) {
    const lines = items
      .filter((item) => item.kind === 'list_item')
      .map((item) => ({
        id: item.id,
        row: item.row,
        value: resolveOverride(overrides, item.id, 'value', item.value),
      }));

    const themes = [];
    let currentTheme = null;
    let previousRow = null;

    lines.forEach((line) => {
      if (!currentTheme || (previousRow !== null && line.row - previousRow > 1)) {
        currentTheme = {
          id: `theme_${line.id}`,
          title: line.value,
          start_row: line.row,
          lines: [line],
        };
        themes.push(currentTheme);
      } else {
        currentTheme.lines.push(line);
      }
      previousRow = line.row;
    });

    return themes;
  }

  function renderItem(item, overrides) {
    const base = { id: item.id, kind: item.kind, row: item.row };

    if (item.kind === 'credit' || item.kind === 'crew_credit') {
      return {
        ...base,
        section: resolveOverride(overrides, item.id, 'section', item.section),
        role: resolveOverride(overrides, item.id, 'role', item.role),
        names: (item.names || []).map((name) => ({
          id: name.id,
          row: name.row,
          name: resolveOverride(overrides, name.id, 'name', name.name),
        })),
      };
    }

    if (item.kind === 'cast') {
      return {
        ...base,
        actor: resolveOverride(overrides, item.id, 'actor', item.actor),
        character: resolveOverride(overrides, item.id, 'character', item.character),
      };
    }

    if (item.kind === 'section') {
      return { ...base, title: resolveOverride(overrides, item.id, 'title', item.title) };
    }

    if (item.kind === 'list_item' || item.kind === 'closing_line') {
      return {
        ...base,
        section: resolveOverride(overrides, item.id, 'section', item.section),
        value: resolveOverride(overrides, item.id, 'value', item.value),
      };
    }

    return { ...item, ...base };
  }

  function rebuild() {
    if (state.source && state.structure) {
      state.render = buildRenderJson(state.source, state.materials, state.structure);
    }

    renderMeta();
    renderSettings();
    renderCartelaList();
    renderEditor();
    renderPreview();
    renderVisualPreview();
  }

  function renderMeta() {
    if (!state.source) {
      els.sourceMeta.textContent = 'Carga un XLSX o structure_json para empezar.';
      return;
    }

    const sheet = state.source.sheet || 'sin hoja';
    els.sourceMeta.textContent = `${sheet} · ${state.materials.length} bloques de diseño · ${state.source.meta.loaded_file || ''}`;
  }

  function setActiveTab(tabName) {
    state.activeTab = tabName;
    els.tabButtons.forEach((button) => button.classList.toggle('active', button.dataset.tab === tabName));
    els.tabPanes.forEach((pane) => pane.classList.toggle('active', pane.id === `${tabName}Pane`));
    if (tabName === 'visual') renderVisualPreview();
    if (tabName === 'json') renderPreview();
  }

  function renderSettings() {
    const settings = normalizeSettings(state.structure && state.structure.settings ? state.structure.settings : {});
    els.defaultDurationInput.value = String(settings.default_cartela_duration);
    els.defaultAutoLinesInput.value = String(settings.default_auto_page_lines);
    renderTypographySettings(settings);
    renderLayoutSettings(settings);
  }

  function renderTypographySettings(settings) {
    els.typographySettings.innerHTML = '';
    els.typographySettings.appendChild(sectionLabel('Tipografia base'));

    TYPOGRAPHY_FIELDS.forEach(([key, label]) => {
      const value = settings.typography[key];
      const row = document.createElement('div');
      row.className = 'typography-row';

      const labelEl = document.createElement('label');
      labelEl.textContent = label;
      row.appendChild(labelEl);

      const sizeInput = document.createElement('input');
      sizeInput.className = 'text-input';
      sizeInput.type = 'number';
      sizeInput.min = '1';
      sizeInput.step = '1';
      sizeInput.value = String(value.font_size);
      sizeInput.addEventListener('change', () => updateTypographySetting(key, { font_size: Math.max(1, Number(sizeInput.value) || 1) }));
      row.appendChild(sizeInput);

      const fontSelect = document.createElement('select');
      fontSelect.className = 'text-input';
      FONT_OPTIONS.forEach((font) => {
        const option = document.createElement('option');
        option.value = font;
        option.textContent = font;
        fontSelect.appendChild(option);
      });
      if (!FONT_OPTIONS.includes(value.font_family)) {
        const option = document.createElement('option');
        option.value = value.font_family;
        option.textContent = value.font_family;
        fontSelect.appendChild(option);
      }
      fontSelect.value = value.font_family;
      fontSelect.addEventListener('change', () => updateTypographySetting(key, { font_family: fontSelect.value }));
      row.appendChild(fontSelect);

      const colorInput = document.createElement('input');
      colorInput.className = 'color-input';
      colorInput.type = 'color';
      colorInput.value = normalizeColor(value.color);
      colorInput.addEventListener('input', () => updateTypographySetting(key, { color: colorInput.value }));
      row.appendChild(colorInput);

      els.typographySettings.appendChild(row);
    });
  }

  function updateTypographySetting(key, fields) {
    if (!state.structure) {
      updateSettings({});
    }
    state.structure.settings = normalizeSettings(state.structure.settings || {});
    state.structure.settings.typography[key] = {
      ...state.structure.settings.typography[key],
      ...fields,
    };
    state.render = state.source ? buildRenderJson(state.source, state.materials, state.structure) : state.render;
    renderPreview();
    renderVisualPreview();
  }

  function renderLayoutSettings(settings) {
    const existing = document.getElementById('layoutSettings');
    if (existing) existing.remove();

    const wrap = document.createElement('div');
    wrap.id = 'layoutSettings';
    wrap.className = 'layout-settings';
    wrap.appendChild(sectionLabel('Layout base'));
    wrap.appendChild(settingsNumberRow('Interlineado', settings.layout.line_spacing, 0.1, 5, 0.01, (value) => updateLayoutSetting({ line_spacing: value })));
    wrap.appendChild(settingsNumberRow('Gap columnas', settings.layout.column_gap, 0, 200, 1, (value) => updateLayoutSetting({ column_gap: value })));
    wrap.appendChild(settingsNumberRow('Gap cargo/nombre', settings.layout.role_name_gap, 0, 100, 1, (value) => updateLayoutSetting({ role_name_gap: value })));
    els.typographySettings.after(wrap);
  }

  function settingsNumberRow(label, value, min, max, step, onInput) {
    const row = document.createElement('div');
    row.className = 'field-grid';
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    const input = document.createElement('input');
    input.className = 'text-input';
    input.type = 'number';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.addEventListener('change', () => {
      const next = Math.max(min, Math.min(max, Number(input.value) || min));
      input.value = String(next);
      onInput(next);
    });
    row.appendChild(labelEl);
    row.appendChild(input);
    return row;
  }

  function updateLayoutSetting(fields) {
    if (!state.structure) {
      updateSettings({});
    }
    state.structure.settings = normalizeSettings(state.structure.settings || {});
    state.structure.settings.layout = {
      ...state.structure.settings.layout,
      ...fields,
    };
    state.render = state.source ? buildRenderJson(state.source, state.materials, state.structure) : state.render;
    renderPreview();
    renderVisualPreview();
  }

  function updateSettings(fields) {
    if (!state.structure) {
      state.structure = {
        schema: 'credits_structure_json',
        version: 6,
        source_sheet: '',
        source_file: '',
        cartelas: [],
        settings: normalizeSettings({}),
        overrides: {},
        page_breaks: {},
      };
    }
    state.structure.settings = normalizeSettings(state.structure.settings || {});
    Object.assign(state.structure.settings, fields);
    if (state.source) {
      state.render = buildRenderJson(state.source, state.materials, state.structure);
    }
    renderSettings();
    renderPreview();
    renderVisualPreview();
  }

  function renderCartelaList() {
    els.blockList.innerHTML = '';
    const cartelas = state.structure && state.structure.cartelas ? state.structure.cartelas : [];
    els.blockCount.textContent = String(cartelas.length);

    const newButton = document.createElement('button');
    newButton.className = 'wide-action';
    newButton.type = 'button';
    newButton.textContent = 'Nueva cartela';
    newButton.addEventListener('click', addEmptyCartela);
    els.blockList.appendChild(newButton);

    cartelas.forEach((cartela, index) => {
      const refs = getCartelaRefs(cartela);
      const button = document.createElement('div');
      button.className = 'block-button' + (cartela.id === state.selectedCartelaId ? ' active' : '');
      button.addEventListener('click', () => {
        state.selectedCartelaId = cartela.id;
        rebuild();
      });

      button.innerHTML = `
        <div class="block-group">${String(index + 1).padStart(2, '0')}</div>
        <div class="block-name">${escapeHtml(cartela.title || 'Sin titulo')}</div>
        <div class="block-meta">${cartela.enabled === false ? 'excluida · ' : ''}${escapeHtml(cartela.orientation || 'horizontal')} · ${Number(cartela.columns) || 1} col · ${refs.length} bloque${refs.length === 1 ? '' : 's'}</div>
      `;
      els.blockList.appendChild(button);
    });
  }

  function renderEditor() {
    if (!state.source || !state.selectedCartelaId) {
      els.editorTitle.textContent = 'Sin cartela seleccionada';
      els.editorKind.textContent = '';
      els.editorBody.className = 'editor-body empty-state';
      els.editorBody.textContent = 'Carga un XLSX y selecciona una cartela.';
      return;
    }

    const cartela = getSelectedCartela();
    if (!cartela) return;

    els.editorTitle.textContent = cartela.title || 'Sin titulo';
    els.editorKind.innerHTML = `<span class="tag cards">${escapeHtml(cartela.type || 'cartela')}</span>`;
    els.editorBody.className = 'editor-body preview-mode';
    els.editorBody.innerHTML = '';
    els.editorBody.appendChild(renderCartelaFields(cartela));
    els.editorBody.appendChild(sectionLabel('Bloques en esta cartela'));
    els.editorBody.appendChild(renderSourceRefControls(cartela));

    const materialsGrid = document.createElement('div');
    materialsGrid.className = 'cartela-materials-grid';
    materialsGrid.style.gridTemplateColumns = `repeat(${Math.max(1, Number(cartela.columns) || 1)}, minmax(0, 1fr))`;
    getCartelaRefs(cartela).forEach((ref) => {
      const material = state.materials.find((candidate) => candidate.id === ref);
      materialsGrid.appendChild(renderMaterialEditor(material, ref));
    });
    els.editorBody.appendChild(materialsGrid);
  }

  function renderCartelaFields(cartela) {
    const wrap = document.createElement('div');
    wrap.appendChild(sectionLabel('Cartela'));
    wrap.appendChild(localCheckboxRow('Incluir en salida', cartela.enabled !== false, (value) => updateCartela({ enabled: value })));
    wrap.appendChild(localInputRow('Titulo cartela', cartela.title || '', (value) => updateCartela({ title: value })));
    wrap.appendChild(localSelectRow('Orientacion', cartela.orientation || 'horizontal', [
      ['horizontal', 'Horizontal'],
      ['vertical', 'Vertical'],
    ], (value) => updateCartela({ orientation: value })));
    wrap.appendChild(localNumberRow('Columnas', Number(cartela.columns) || 1, 1, 6, (value) => updateCartela({ columns: value })));
    wrap.appendChild(localNumberRow('Multiplicador letra', Number(cartela.font_size_multiplier) || 1, 0.1, 5, (value) => updateCartela({ font_size_multiplier: value }), 0.1));
    wrap.appendChild(localNumberRow('Multiplicador interlineado', Number(cartela.line_spacing_multiplier) || 1, 0.1, 5, (value) => updateCartela({ line_spacing_multiplier: value }), 0.1));
    wrap.appendChild(localInputRow('Duracion', String(cartela.duration || 0), (value) => updateCartela({ duration: Number(value) || 0 })));
    wrap.appendChild(localInputRow('Notas', cartela.notes || '', (value) => updateCartela({ notes: value }), { multiline: true }));
    return wrap;
  }

  function renderSourceRefControls(cartela) {
    const wrap = document.createElement('div');
    wrap.className = 'source-controls';

    const select = document.createElement('select');
    select.className = 'text-input';
    state.materials.forEach((material) => {
      const option = document.createElement('option');
      option.value = material.id;
      option.textContent = `${material.group || '-'} · ${material.title || material.id}`;
      select.appendChild(option);
    });

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.textContent = 'Añadir bloque';
    addButton.addEventListener('click', () => {
      moveMaterialToCartela(select.value, cartela);
      rebuild();
    });

    wrap.appendChild(select);
    wrap.appendChild(addButton);
    return wrap;
  }

  function renderMaterialEditor(material, ref) {
    const wrap = document.createElement('div');
    wrap.className = 'material-panel';

    if (!material) {
      wrap.innerHTML = `<div class="material-header"><strong>Fuente no encontrada</strong><span>${escapeHtml(ref)}</span></div>`;
      return wrap;
    }

    const header = document.createElement('div');
    header.className = 'material-header';
    header.innerHTML = `
      <div>
        <strong>${escapeHtml(material.title || 'Sin titulo')}</strong>
        <span>${escapeHtml(material.type || '')} · ${(material.items || []).length} items</span>
      </div>
    `;

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.textContent = 'Quitar';
    removeButton.addEventListener('click', () => {
      const cartela = getSelectedCartela();
      if (!cartela) return;
      cartela.pages = (cartela.pages || []).map((page) => ({
        ...page,
        source_refs: (page.source_refs || []).filter((sourceRef) => sourceRef !== ref),
      }));
      cartela.pages.forEach((page) => {
        if (page.source_ref_settings) delete page.source_ref_settings[ref];
      });
      rebuild();
    });
    header.appendChild(removeButton);
    wrap.appendChild(header);

    wrap.appendChild(localNumberRow('Columnas bloque', getSelectedBlockColumns(ref), 1, 6, (value) => updateSelectedBlockColumns(ref, value)));
    wrap.appendChild(renderBlockAlignmentControls(material, ref));
    wrap.appendChild(inputRow('Titulo bloque', material.id, 'title', material.title || ''));
    wrap.appendChild(inputRow('Titulos bloque', material.id, 'titles', (material.titles || [material.title]).join('\n'), {
      multiline: true,
      parse: (value) => value.split('\n').map((line) => line.trim()).filter(Boolean),
      fallback: material.titles || [material.title],
    }));

    if (material.type === 'music_licenses') {
      wrap.appendChild(renderMusicThemesEditor(material));
      return wrap;
    }

    const breakUnits = material.items || [];
    breakUnits.forEach((item, index) => {
      const isLastItem = index === breakUnits.length - 1;
      wrap.appendChild(renderItemEditor(item, material.id, isLastItem));
      if (index < breakUnits.length - 1 && item.kind !== 'credit' && item.kind !== 'crew_credit') {
        wrap.appendChild(renderPageBreakControl(material.id, item.id));
      }
    });
    return wrap;
  }

  function renderBlockAlignmentControls(material, ref) {
    const wrap = document.createElement('div');
    const alignment = getSelectedBlockAlignment(ref, material);
    const options = [
      ['left', 'Izquierda'],
      ['center', 'Centro'],
      ['right', 'Derecha'],
    ];

    if (!materialHasPairedText(material)) {
      wrap.appendChild(localSelectRow('Alineacion texto', alignment.text || 'center', options, (value) => updateSelectedBlockAlignment(ref, { text: value })));
      return wrap;
    }

    wrap.appendChild(localSelectRow('Alineacion cargo', alignment.role || 'right', options, (value) => updateSelectedBlockAlignment(ref, { role: value })));
    wrap.appendChild(localSelectRow('Alineacion nombre', alignment.name || 'left', options, (value) => updateSelectedBlockAlignment(ref, { name: value })));
    return wrap;
  }

  function renderMusicThemesEditor(material) {
    const wrap = document.createElement('div');
    wrap.className = 'music-themes';
    const themes = groupMusicLicenseThemes(material.items || [], state.structure.overrides || {});
    themes.forEach((theme, index) => {
      const themeWrap = document.createElement('div');
      themeWrap.className = 'music-theme';
      const header = document.createElement('div');
      header.className = 'music-theme-header';
      header.textContent = `Tema ${index + 1}`;
      themeWrap.appendChild(header);
      theme.lines.forEach((line, lineIndex) => {
        const row = document.createElement('div');
        row.className = 'preview-line music-line' + (lineIndex === 0 ? ' theme-title' : '');
        row.innerHTML = `<div class="row-label">Fila ${line.row}</div>`;
        row.appendChild(makePreviewInput(line.id, 'value', line.value || '', 'line-input'));
        themeWrap.appendChild(row);
      });
      wrap.appendChild(themeWrap);
      if (index < themes.length - 1) {
        wrap.appendChild(renderPageBreakControl(material.id, theme.lines[theme.lines.length - 1].id));
      }
    });
    return wrap;
  }

  function renderPageBreakControl(materialId, afterItemId) {
    const isActive = getPageBreaks(materialId).includes(afterItemId);
    const wrap = document.createElement('div');
    wrap.className = 'page-break-control' + (isActive ? ' active' : '');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = isActive ? 'Quitar salto de página' : 'Añadir salto de página';
    button.addEventListener('click', () => {
      togglePageBreak(materialId, afterItemId);
      rebuild();
    });
    wrap.appendChild(button);
    return wrap;
  }

  function getPageBreaks(materialId) {
    state.structure.page_breaks = state.structure.page_breaks || {};
    state.structure.page_breaks[materialId] = state.structure.page_breaks[materialId] || [];
    return state.structure.page_breaks[materialId];
  }

  function togglePageBreak(materialId, afterItemId) {
    const breaks = getPageBreaks(materialId);
    const index = breaks.indexOf(afterItemId);
    if (index >= 0) {
      breaks.splice(index, 1);
    } else {
      breaks.push(afterItemId);
    }
  }

  function renderItemEditor(item, materialId, isLastItem) {
    const row = document.createElement('div');
    const cartela = getSelectedCartela();
    const orientation = cartela && cartela.orientation ? cartela.orientation : 'horizontal';

    if (item.kind === 'credit' || item.kind === 'crew_credit') {
      row.className = `preview-credit ${orientation}`;
      row.innerHTML = `<div class="row-label">Fila ${item.row}</div>`;
      const roleWrap = document.createElement('div');
      roleWrap.className = 'preview-role';
      roleWrap.appendChild(makePreviewInput(item.id, 'role', item.role || '', 'role-input'));

      const namesWrap = document.createElement('div');
      namesWrap.className = 'preview-names';
      (item.names || []).forEach((name, nameIndex) => {
        const nameLine = document.createElement('div');
        nameLine.className = 'preview-name-line';
        nameLine.appendChild(makePreviewInput(name.id, 'name', name.name || '', 'name-input'));
        namesWrap.appendChild(nameLine);
        const isLastName = nameIndex === item.names.length - 1;
        if (!isLastItem || !isLastName) {
          namesWrap.appendChild(renderPageBreakControl(materialId, `${item.id}__${name.id}`));
        }
      });

      row.appendChild(roleWrap);
      row.appendChild(namesWrap);
      return row;
    }

    if (item.kind === 'cast') {
      row.className = `preview-credit ${orientation}`;
      row.innerHTML = `<div class="row-label">Fila ${item.row}</div>`;
      const actorWrap = document.createElement('div');
      actorWrap.className = 'preview-role';
      actorWrap.appendChild(makePreviewInput(item.id, 'actor', item.actor || '', 'role-input'));
      const characterWrap = document.createElement('div');
      characterWrap.className = 'preview-names';
      characterWrap.appendChild(makePreviewInput(item.id, 'character', item.character || '', 'name-input'));
      row.appendChild(actorWrap);
      row.appendChild(characterWrap);
      return row;
    }

    if (item.kind === 'section') {
      row.className = 'preview-section';
      row.innerHTML = `<div class="row-label">Fila ${item.row}</div>`;
      row.appendChild(makePreviewInput(item.id, 'title', item.title || '', 'section-input'));
      return row;
    }

    if (item.kind === 'list_item' || item.kind === 'closing_line') {
      row.className = 'preview-line';
      row.innerHTML = `<div class="row-label">Fila ${item.row}</div>`;
      row.appendChild(makePreviewInput(item.id, 'value', item.value || '', 'line-input'));
      return row;
    }

    row.className = 'line-row';
    row.innerHTML = `<div class="row-label">Fila ${item.row || '-'}<br>${escapeHtml(item.kind || 'item')}</div><pre>${escapeHtml(JSON.stringify(item, null, 2))}</pre>`;
    return row;
  }

  function renderNames(names) {
    const wrap = document.createElement('div');
    wrap.className = 'names-list';
    names.forEach((name) => {
      const item = document.createElement('div');
      item.className = 'chip';
      item.innerHTML = `<span>Fila ${name.row}</span>`;
      item.appendChild(makeInput(name.id, 'name', name.name || ''));
      wrap.appendChild(item);
    });
    return wrap;
  }

  function addEmptyCartela() {
    if (!state.structure) return;
    const index = state.structure.cartelas.length + 1;
    const cartela = {
      id: `cartela_${String(index).padStart(3, '0')}`,
      title: `Cartela ${index}`,
      type: 'card',
      duration: 4,
      orientation: 'vertical',
      columns: 1,
      font_size_multiplier: 1,
      line_spacing_multiplier: 1,
      enabled: true,
      notes: '',
      pages: [{ id: `page_${String(index).padStart(3, '0')}_001`, source_refs: [], source_ref_settings: {} }],
    };
    state.structure.cartelas.push(cartela);
    state.selectedCartelaId = cartela.id;
    rebuild();
  }

  function updateCartela(fields) {
    const cartela = getSelectedCartela();
    if (!cartela) return;
    Object.assign(cartela, fields);
    state.render = buildRenderJson(state.source, state.materials, state.structure);
    renderCartelaList();
    renderPreview();
    renderVisualPreview();
  }

  function getSelectedCartela() {
    return state.structure && state.structure.cartelas
      ? state.structure.cartelas.find((cartela) => cartela.id === state.selectedCartelaId)
      : null;
  }

  function getCartelaRefs(cartela) {
    return (cartela.pages || []).flatMap((page) => page.source_refs || []);
  }

  function getSourceRefColumns(page, ref) {
    const settings = page && page.source_ref_settings && page.source_ref_settings[ref]
      ? page.source_ref_settings[ref]
      : {};
    return Math.max(1, Number(settings.columns) || 1);
  }

  function getSourceRefAlignment(page, ref, material, cartela) {
    const settings = page && page.source_ref_settings && page.source_ref_settings[ref]
      ? page.source_ref_settings[ref]
      : {};
    return normalizeBlockAlignment(settings.alignment, material, cartela);
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

  function getSelectedBlockAlignment(ref, material) {
    const cartela = getSelectedCartela();
    const page = findPageWithRef(cartela, ref);
    return getSourceRefAlignment(page, ref, material, cartela);
  }

  function updateSelectedBlockAlignment(ref, fields) {
    const cartela = getSelectedCartela();
    const page = findPageWithRef(cartela, ref);
    if (!page) return;
    page.source_ref_settings = page.source_ref_settings || {};
    page.source_ref_settings[ref] = page.source_ref_settings[ref] || {};
    page.source_ref_settings[ref].alignment = {
      ...(page.source_ref_settings[ref].alignment || {}),
      ...fields,
    };
    state.render = buildRenderJson(state.source, state.materials, state.structure);
    renderPreview();
    renderVisualPreview();
  }

  function getSelectedBlockColumns(ref) {
    const cartela = getSelectedCartela();
    const page = findPageWithRef(cartela, ref);
    return getSourceRefColumns(page, ref);
  }

  function updateSelectedBlockColumns(ref, columns) {
    const cartela = getSelectedCartela();
    const page = findPageWithRef(cartela, ref);
    if (!page) return;
    page.source_ref_settings = page.source_ref_settings || {};
    page.source_ref_settings[ref] = page.source_ref_settings[ref] || {};
    page.source_ref_settings[ref].columns = Math.max(1, Number(columns) || 1);
    state.render = buildRenderJson(state.source, state.materials, state.structure);
    renderPreview();
    renderVisualPreview();
  }

  function findPageWithRef(cartela, ref) {
    if (!cartela) return null;
    return (cartela.pages || []).find((page) => (page.source_refs || []).includes(ref)) || null;
  }

  function moveMaterialToCartela(materialId, targetCartela) {
    if (!state.structure || !targetCartela) return;
    state.structure.cartelas.forEach((cartela) => {
      (cartela.pages || []).forEach((page) => {
        page.source_refs = (page.source_refs || []).filter((ref) => ref !== materialId);
      });
    });
    const page = ensureFirstPage(targetCartela);
    page.source_ref_settings = page.source_ref_settings || {};
    page.source_ref_settings[materialId] = page.source_ref_settings[materialId] || { columns: 1 };
    page.source_refs.push(materialId);
  }

  function enforceUniqueMaterialRefs(structure) {
    const seen = new Set();
    (structure.cartelas || []).forEach((cartela) => {
      (cartela.pages || []).forEach((page) => {
        page.source_refs = (page.source_refs || []).filter((ref) => {
          if (seen.has(ref)) return false;
          seen.add(ref);
          page.source_ref_settings = page.source_ref_settings || {};
          page.source_ref_settings[ref] = page.source_ref_settings[ref] || { columns: 1 };
          return true;
        });
        Object.keys(page.source_ref_settings || {}).forEach((ref) => {
          if (!(page.source_refs || []).includes(ref)) delete page.source_ref_settings[ref];
        });
      });
    });
  }

  function ensureFirstPage(cartela) {
    cartela.pages = cartela.pages || [];
    if (!cartela.pages[0]) cartela.pages.push({ id: `${cartela.id}_page_001`, source_refs: [], source_ref_settings: {} });
    cartela.pages[0].source_refs = cartela.pages[0].source_refs || [];
    cartela.pages[0].source_ref_settings = cartela.pages[0].source_ref_settings || {};
    return cartela.pages[0];
  }

  function inputRow(label, refId, field, fallback, options) {
    const row = document.createElement('div');
    row.className = 'field-grid';
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    row.appendChild(labelEl);
    row.appendChild(makeInput(refId, field, fallback, options));
    return row;
  }

  function localInputRow(label, value, onInput, options) {
    const row = document.createElement('div');
    row.className = 'field-grid';
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    const input = options && options.multiline ? document.createElement('textarea') : document.createElement('input');
    input.className = 'text-input';
    if (!(options && options.multiline)) input.type = 'text';
    input.value = value;
    input.addEventListener('input', () => onInput(input.value));
    row.appendChild(labelEl);
    row.appendChild(input);
    return row;
  }

  function localSelectRow(label, value, options, onInput) {
    const row = document.createElement('div');
    row.className = 'field-grid';
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    const select = document.createElement('select');
    select.className = 'text-input';
    options.forEach(([optionValue, optionLabel]) => {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = optionLabel;
      select.appendChild(option);
    });
    select.value = value;
    select.addEventListener('change', () => {
      onInput(select.value);
      renderEditor();
    });
    row.appendChild(labelEl);
    row.appendChild(select);
    return row;
  }

  function localNumberRow(label, value, min, max, onInput, step = 1) {
    const row = document.createElement('div');
    row.className = 'field-grid';
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    const input = document.createElement('input');
    input.className = 'text-input';
    input.type = 'number';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.addEventListener('change', () => {
      const next = Math.max(min, Math.min(max, Number(input.value) || min));
      input.value = String(next);
      onInput(next);
      renderEditor();
    });
    row.appendChild(labelEl);
    row.appendChild(input);
    return row;
  }

  function localCheckboxRow(label, value, onInput) {
    const row = document.createElement('div');
    row.className = 'field-grid';
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    const inputWrap = document.createElement('label');
    inputWrap.className = 'check-row';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = value;
    input.addEventListener('change', () => onInput(input.checked));
    inputWrap.appendChild(input);
    inputWrap.appendChild(document.createTextNode(value ? 'Activa' : 'Excluida'));
    input.addEventListener('change', () => {
      inputWrap.lastChild.textContent = input.checked ? 'Activa' : 'Excluida';
    });
    row.appendChild(labelEl);
    row.appendChild(inputWrap);
    return row;
  }

  function makeInput(refId, field, fallback, options) {
    const opts = options || {};
    const current = resolveOverride(state.structure.overrides || {}, refId, field, fallback);
    const input = opts.multiline ? document.createElement('textarea') : document.createElement('input');
    input.className = 'text-input';
    input.value = Array.isArray(current) ? current.join('\n') : (current || '');
    if (!opts.multiline) input.type = 'text';
    input.addEventListener('input', () => {
      const rawValue = input.value;
      const parsedValue = opts.parse ? opts.parse(rawValue) : rawValue;
      const parsedFallback = opts.fallback !== undefined ? opts.fallback : fallback;
      setOverride(refId, field, parsedValue, parsedFallback);
      state.render = buildRenderJson(state.source, state.materials, state.structure);
      renderPreview();
    });
    return input;
  }

  function makePreviewInput(refId, field, fallback, className) {
    const input = makeInput(refId, field, fallback);
    input.classList.add('preview-input', className);
    return input;
  }

  function makeVisualInput(refId, field, fallback, className, options = {}) {
    const input = makeInput(refId, field, fallback);
    input.classList.add('visual-input', className);
    input.setAttribute('aria-label', field);
    if (options.styleKey) applyTypography(input, options.styleKey, options);
    if (options.textAlign) input.style.textAlign = options.textAlign;
    return input;
  }

  function applyTypography(element, key, options = {}) {
    const settings = normalizeSettings(state.structure && state.structure.settings ? state.structure.settings : {});
    const typography = settings.typography[key];
    const scale = Number(options.multiplier) || 1;
    const lineScale = Number(options.lineMultiplier) || 1;
    element.style.fontFamily = typography.font_family;
    element.style.fontSize = `${Math.max(1, Number(typography.font_size) || 1) * scale}px`;
    element.style.lineHeight = String(settings.layout.line_spacing * lineScale);
    element.style.color = typography.color;
  }

  function getRenderLayout() {
    return normalizeSettings(state.structure && state.structure.settings ? state.structure.settings : {}).layout;
  }

  function getCartelaBaseTitle(cartelaId, fallback) {
    const cartela = state.structure && state.structure.cartelas
      ? state.structure.cartelas.find((candidate) => candidate.id === cartelaId)
      : null;
    return cartela ? cartela.title || 'Sin titulo' : fallback || 'Sin titulo';
  }

  function setOverride(refId, field, value, fallback) {
    state.structure.overrides = state.structure.overrides || {};
    const hasChanged = normalizeEditableValue(value) !== normalizeEditableValue(fallback);

    if (!hasChanged) {
      if (state.structure.overrides[refId]) {
        delete state.structure.overrides[refId][field];
        if (!Object.keys(state.structure.overrides[refId]).length) delete state.structure.overrides[refId];
      }
      return;
    }

    state.structure.overrides[refId] = state.structure.overrides[refId] || {};
    state.structure.overrides[refId][field] = value;
  }

  function resolveOverride(overrides, refId, field, fallback) {
    return overrides[refId] && Object.prototype.hasOwnProperty.call(overrides[refId], field)
      ? overrides[refId][field]
      : fallback;
  }

  function sectionLabel(text) {
    const label = document.createElement('div');
    label.className = 'section-title';
    label.textContent = text;
    return label;
  }

  function setPreview(kind) {
    state.preview = kind;
    els.structureTab.classList.toggle('active', kind === 'structure');
    els.renderTab.classList.toggle('active', kind === 'render');
    renderPreview();
  }

  function renderPreview() {
    if (!state.source && !state.structure && !state.render) {
      els.jsonPreview.value = '';
      return;
    }
    els.jsonPreview.value = JSON.stringify(state.preview === 'structure' ? state.structure : state.render, null, 2);
  }

  function renderVisualPreview() {
    if (!state.render) {
      els.visualPreview.className = 'visual-preview empty-state';
      els.visualPreview.textContent = 'Carga un XLSX para ver el preview.';
      return;
    }

    els.visualPreview.className = 'visual-preview';
    els.visualPreview.innerHTML = '';
    (state.render.cartelas || []).forEach((cartela) => {
      const layout = getRenderLayout();
      const cartelaEl = document.createElement('section');
      cartelaEl.className = 'render-cartela';

      const headerEl = document.createElement('div');
      headerEl.className = 'render-cartela-header';
      headerEl.appendChild(makeVisualInput(cartela.id, 'title', getCartelaBaseTitle(cartela.id, cartela.title), 'render-cartela-title-input', {
        styleKey: 'page_header',
        multiplier: cartela.font_size_multiplier,
        lineMultiplier: cartela.line_spacing_multiplier,
      }));
      const metaEl = document.createElement('span');
      metaEl.textContent = `${cartela.orientation || 'horizontal'} · ${cartela.columns || 1} col · ${cartela.duration || 0}s`;
      headerEl.appendChild(metaEl);
      cartelaEl.appendChild(headerEl);

      (cartela.pages || []).forEach((cartelaPage) => {
        const pageEl = document.createElement('div');
        pageEl.className = 'render-page';
        const pageLabelEl = document.createElement('div');
        pageLabelEl.className = 'render-page-label';
        pageLabelEl.appendChild(makeVisualInput(cartelaPage.id, 'title', `Pagina ${cartelaPage.page_number}`, 'render-page-title-input', {
          styleKey: 'page_header',
          multiplier: cartela.font_size_multiplier,
          lineMultiplier: cartela.line_spacing_multiplier,
        }));
        pageEl.appendChild(pageLabelEl);

        (cartelaPage.blocks || []).forEach((block) => {
          pageEl.appendChild(renderVisualBlock(block, cartela, layout));
        });

        cartelaEl.appendChild(pageEl);
      });

      els.visualPreview.appendChild(cartelaEl);
    });
  }

  function renderVisualBlock(block, cartela, layout) {
    const blockEl = document.createElement('div');
    blockEl.className = 'render-block';
    if (block.missing_source) {
      blockEl.textContent = `Fuente no encontrada: ${block.missing_source}`;
      return blockEl;
    }

    (block.pages || []).forEach((blockPage, index) => {
      const blockPageEl = document.createElement('div');
      blockPageEl.className = 'render-block-page';

      blockPageEl.appendChild(
        makeVisualInput(blockPageTitleRef(block.id, blockPage.id), 'title', block.title || '', 'render-block-title-input', {
          styleKey: 'block_title',
          multiplier: cartela.font_size_multiplier,
          lineMultiplier: cartela.line_spacing_multiplier,
          textAlign: 'center',
        })
      );

      const contentEl = document.createElement('div');
      contentEl.className = 'render-block-content';
      contentEl.style.gridTemplateColumns = `repeat(${Math.max(1, Number(block.columns) || 1)}, minmax(0, 1fr))`;
      contentEl.style.columnGap = `${layout.column_gap}px`;

      const units = blockPage.items || [];
      let previousCreditSourceId = null;
      units.forEach((unit) => {
        if (block.type === 'music_licenses' && unit.lines) {
          const themeEl = document.createElement('div');
          themeEl.className = 'render-theme';
          unit.lines.forEach((line, lineIndex) => {
            themeEl.appendChild(makeVisualInput(line.id, 'value', line.value || '', lineIndex === 0 ? 'render-theme-title-input' : 'render-line-input', {
              styleKey: lineIndex === 0 ? 'block_title' : 'name',
              multiplier: cartela.font_size_multiplier,
              lineMultiplier: cartela.line_spacing_multiplier,
              textAlign: block.alignment && block.alignment.text ? block.alignment.text : 'center',
            }));
          });
          contentEl.appendChild(themeEl);
        } else {
          const isCredit = unit.kind === 'credit' || unit.kind === 'crew_credit';
          const hideRepeatedRole = isCredit && unit.source_item_id && unit.source_item_id === previousCreditSourceId;
          contentEl.appendChild(renderVisualUnit(unit, cartela, block.alignment || {}, layout, { hideRole: hideRepeatedRole }));
          previousCreditSourceId = isCredit ? unit.source_item_id || null : null;
        }
      });
      blockPageEl.appendChild(contentEl);
      blockEl.appendChild(blockPageEl);
    });
    return blockEl;
  }

  function renderVisualUnit(unit, cartela, alignment, layout, options = {}) {
    const orientation = cartela.orientation || 'horizontal';
    const unitEl = document.createElement('div');
    unitEl.className = `render-unit ${orientation}`;
    if (orientation === 'horizontal') {
      unitEl.style.gap = `${layout.role_name_gap}px`;
    }
    if (unit.kind === 'credit' || unit.kind === 'crew_credit') {
      if (options.hideRole) {
        const roleEl = document.createElement('div');
        roleEl.className = 'render-role repeated-role';
        unitEl.appendChild(roleEl);
      } else {
        unitEl.appendChild(makeVisualInput(unit.source_item_id || unit.id, 'role', unit.role || '', 'render-role-input', {
          styleKey: 'role',
          multiplier: cartela.font_size_multiplier,
          lineMultiplier: cartela.line_spacing_multiplier,
          textAlign: alignment.role || (orientation === 'vertical' ? 'center' : 'right'),
        }));
      }
      unitEl.appendChild(makeVisualInput(unit.source_name_id || unit.id, 'name', unit.name || '', 'render-name-input', {
        styleKey: 'name',
        multiplier: cartela.font_size_multiplier,
        lineMultiplier: cartela.line_spacing_multiplier,
        textAlign: alignment.name || (orientation === 'vertical' ? 'center' : 'left'),
      }));
      return unitEl;
    }
    if (unit.kind === 'cast') {
      unitEl.appendChild(makeVisualInput(unit.id, 'actor', unit.actor || '', 'render-role-input', {
        styleKey: 'role',
        multiplier: cartela.font_size_multiplier,
        lineMultiplier: cartela.line_spacing_multiplier,
        textAlign: alignment.role || (orientation === 'vertical' ? 'center' : 'right'),
      }));
      unitEl.appendChild(makeVisualInput(unit.id, 'character', unit.character || '', 'render-name-input', {
        styleKey: 'name',
        multiplier: cartela.font_size_multiplier,
        lineMultiplier: cartela.line_spacing_multiplier,
        textAlign: alignment.name || (orientation === 'vertical' ? 'center' : 'left'),
      }));
      return unitEl;
    }
    const value = unit.title || unit.value || '';
    unitEl.appendChild(makeVisualInput(unit.id, unit.title !== undefined ? 'title' : 'value', value, 'render-line-input', {
      styleKey: unit.title !== undefined ? 'block_title' : 'name',
      multiplier: cartela.font_size_multiplier,
      lineMultiplier: cartela.line_spacing_multiplier,
      textAlign: alignment.text || (orientation === 'vertical' ? 'center' : 'left'),
    }));
    return unitEl;
  }

  async function saveJsonFile(kind, forceSaveAs = false) {
    const data = kind === 'structure_json' ? state.structure : state.render;
    if (!data) {
      window.alert(kind === 'structure_json' ? 'Carga primero un XLSX o structure_json.' : 'Genera primero un render_json.');
      return;
    }

    const handleKey = kind === 'structure_json' ? 'structureFileHandle' : 'renderFileHandle';
    let handle = state[handleKey];
    if (forceSaveAs || !handle) {
      handle = await requestSaveHandle(kind);
      if (!handle) return;
      state[handleKey] = handle;
    }

    try {
      await writeJsonToHandle(handle, data);
    } catch (error) {
      window.alert('No se pudo guardar el JSON: ' + error.message);
    }
  }

  async function requestSaveHandle(kind) {
    const sheet = safeFilePart((state.source && state.source.sheet) || 'credits');
    const suggestedName = `${sheet}_${kind}.json`;
    if (!window.showSaveFilePicker) {
      fallbackDownloadJson(kind);
      return null;
    }

    try {
      return await window.showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: 'JSON',
            accept: { 'application/json': ['.json'] },
          },
        ],
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        window.alert('No se pudo elegir archivo: ' + error.message);
      }
      return null;
    }
  }

  async function writeJsonToHandle(handle, data) {
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
  }

  function fallbackDownloadJson(kind) {
    const data = kind === 'structure_json' ? state.structure : state.render;
    const sheet = safeFilePart((state.source && state.source.sheet) || 'credits');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${sheet}_${kind}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  function defaultLayoutForMaterial(material) {
    if (material.type === 'crew_section') return 'roll_section';
    if (material.type === 'cast') return 'cast_page';
    if (material.type === 'music_licenses') return 'music_licenses';
    if (material.type === 'thanks') return 'thanks';
    if (material.type === 'logos') return 'logos';
    return 'card';
  }

  function defaultOrientationForMaterial(material) {
    if (material.type === 'cards') return 'vertical';
    if (material.type === 'music_licenses') return 'vertical';
    if (material.type === 'thanks') return 'vertical';
    if (material.type === 'logos') return 'vertical';
    if (material.type === 'closing') return 'vertical';
    if (material.type === 'crew_section') {
      const hasRoleAndName = (material.items || []).some((item) => item.kind === 'crew_credit');
      return hasRoleAndName ? 'horizontal' : 'vertical';
    }
    return 'horizontal';
  }

  function makeBlockId(block, index) {
    return `block_${safeFilePart(block.group || index + 1)}_${block.start_row || index + 1}_${safeFilePart(block.title || 'block')}`;
  }

  function makeItemId(blockId, item, index) {
    const label = item.role || item.title || item.actor || item.value || item.kind || 'item';
    return `${blockId}_item_${item.row || index + 1}_${safeFilePart(label)}`;
  }

  function makeNameId(blockId, item, name, index) {
    const itemRow = item.row || 'x';
    return `${blockId}_name_${itemRow}_${name.row || index + 1}_${safeFilePart(name.name || 'name')}`;
  }

  function safeFilePart(value) {
    return String(value || 'item')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\\/:*?"<>|]+/g, '_')
      .replace(/[^a-zA-Z0-9_ -]+/g, '')
      .replace(/\s+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) || 'item';
  }

  function normalizeEditableValue(value) {
    return Array.isArray(value) ? JSON.stringify(value) : String(value || '');
  }

  function normalizeColor(value) {
    return /^#[0-9a-fA-F]{6}$/.test(String(value || '')) ? value : '#171b1f';
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}());
