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
    fontCatalog: null,
    pdfPageIndex: 0,
    pngPreviewZoom: 0.25,
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
    pdfPreview: document.getElementById('pdfPreview'),
    defaultDurationInput: document.getElementById('defaultDurationInput'),
    defaultAutoLinesInput: document.getElementById('defaultAutoLinesInput'),
    loadSystemFontsBtn: document.getElementById('loadSystemFontsBtn'),
    fontStatus: document.getElementById('fontStatus'),
    typographySettings: document.getElementById('typographySettings'),
    tabButtons: Array.from(document.querySelectorAll('.app-tabs button')),
    tabPanes: Array.from(document.querySelectorAll('.tab-pane')),
    structureTab: document.getElementById('structureTab'),
    renderTab: document.getElementById('renderTab'),
    saveStructureBtn: document.getElementById('saveStructureBtn'),
    saveStructureAsBtn: document.getElementById('saveStructureAsBtn'),
    saveRenderBtn: document.getElementById('saveRenderBtn'),
    saveRenderAsBtn: document.getElementById('saveRenderAsBtn'),
    pdfFirstPageBtn: document.getElementById('pdfFirstPageBtn'),
    pdfPrevPageBtn: document.getElementById('pdfPrevPageBtn'),
    pdfNextPageBtn: document.getElementById('pdfNextPageBtn'),
    pdfLastPageBtn: document.getElementById('pdfLastPageBtn'),
    pdfMinusLinesBtn: document.getElementById('pdfMinusLinesBtn'),
    pdfPlusLinesBtn: document.getElementById('pdfPlusLinesBtn'),
    pdfPageNumberInput: document.getElementById('pdfPageNumberInput'),
    pdfTotalPages: document.getElementById('pdfTotalPages'),
    pdfPageTitleInput: document.getElementById('pdfPageTitleInput'),
    pdfBaseNameInput: document.getElementById('pdfBaseNameInput'),
    pdfLineStatus: document.getElementById('pdfLineStatus'),
    pngZoomOutBtn: document.getElementById('pngZoomOutBtn'),
    pngZoomInBtn: document.getElementById('pngZoomInBtn'),
    pngZoomStatus: document.getElementById('pngZoomStatus'),
    exportCurrentPdfBtn: document.getElementById('exportCurrentPdfBtn'),
    exportAllPdfBtn: document.getElementById('exportAllPdfBtn'),
  };

  const TYPOGRAPHY_FIELDS = [
    ['page_header', 'Cabecera'],
    ['block_title', 'Titulo bloque'],
    ['role', 'Cargo'],
    ['name', 'Nombre'],
  ];
  const BLOCK_TYPOGRAPHY_FIELDS = TYPOGRAPHY_FIELDS.filter(([key]) => key !== 'page_header');

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
  els.loadSystemFontsBtn.addEventListener('click', loadSystemFonts);
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
  els.pdfFirstPageBtn.addEventListener('click', () => goToPdfPage(0));
  els.pdfPrevPageBtn.addEventListener('click', () => changePdfPage(-1));
  els.pdfNextPageBtn.addEventListener('click', () => changePdfPage(1));
  els.pdfLastPageBtn.addEventListener('click', () => goToPdfPage(Number.POSITIVE_INFINITY));
  els.pdfPageNumberInput.addEventListener('change', () => goToPdfPage((Number(els.pdfPageNumberInput.value) || 1) - 1));
  els.pdfMinusLinesBtn.addEventListener('click', () => adjustCurrentPdfPageLines(-1));
  els.pdfPlusLinesBtn.addEventListener('click', () => adjustCurrentPdfPageLines(1));
  els.pdfPageTitleInput.addEventListener('input', updateCurrentPdfPageTitle);
  els.pdfBaseNameInput.addEventListener('input', updatePdfBaseName);
  els.pngZoomOutBtn.addEventListener('click', () => updatePngPreviewZoom(-0.1));
  els.pngZoomInBtn.addEventListener('click', () => updatePngPreviewZoom(0.1));
  els.exportCurrentPdfBtn.addEventListener('click', () => exportPngPages('current'));
  els.exportAllPdfBtn.addEventListener('click', () => exportPngPages('all'));

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
          default_title: defaultBlockTitleForMaterial(block.title, block.items || []),
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
    const items = normalizeCrewItemsForMaterials(block.items || []);

    items.forEach((item) => {
      if (item.kind === 'section') {
        current = {
          id: `${block.id}_section_${item.row}_${safeFilePart(item.title || 'section')}`,
          source_block_id: block.id,
          source_section_id: item.id,
          group: block.group,
          title: item.title,
          default_title: item.title,
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
          default_title: block.title || 'RODILLO FINAL',
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

  function normalizeCrewItemsForMaterials(items) {
    let inMusicLicenses = false;
    return (items || []).map((item) => {
      if (item.kind === 'section' && normalizeText(item.title) === normalizeText('Licencias Musicales')) {
        inMusicLicenses = true;
        return item;
      }

      if (inMusicLicenses && item.kind === 'section') {
        if (isSectionAfterMusicLicenses(item)) {
          inMusicLicenses = false;
          return item;
        }
        return {
          ...item,
          kind: 'list_item',
          section: 'Licencias Musicales',
          value: item.title || '',
        };
      }

      if (inMusicLicenses && item.kind === 'list_item') {
        return {
          ...item,
          section: 'Licencias Musicales',
        };
      }

      return item;
    });
  }

  function isSectionAfterMusicLicenses(item) {
    if (item.source_column === 'C' && item.source_bold) return true;
    const title = normalizeText(item.title);
    return [
      'doblaje de figuracion',
      'doblaje de figuración',
      'empresas de servicios',
      'logos',
      'agradecimientos',
      'vestuario',
      'closing_copy',
    ].includes(title);
  }

  function crewMaterialType(title) {
    if (title === 'Licencias Musicales') return 'music_licenses';
    if (title === 'AGRADECIMIENTOS' || title === 'Vestuario') return 'thanks';
    if (title === 'Logos') return 'logos';
    if (title === 'closing_copy') return 'closing';
    return 'crew_section';
  }

  function defaultBlockTitleForMaterial(title, items) {
    const firstCredit = (items || []).find((item) => item.kind === 'credit' || item.kind === 'crew_credit');
    if (firstCredit && normalizeText(firstCredit.role) === normalizeText(title)) return '';
    return title || '';
  }

  function getMaterialContentItems(material) {
    const items = material && material.items ? material.items : [];
    if (!items.length) return items;
    const first = items[0];
    if (first.kind === 'section' && normalizeText(first.title) === normalizeText(material.title)) {
      return items.slice(1);
    }
    return items;
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
      if (!previousCartela && !materialHasRenderableContent(material)) {
        return;
      }
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
    addMissingMaterialsToStructure(cartelas, materials, settings);
    const cleanCartelas = removeDefaultEmptyCartelas(cartelas, materials);

    return {
      schema: 'credits_structure_json',
      version: 10,
      source_sheet: source.sheet || '',
      source_file: source.meta && source.meta.loaded_file ? source.meta.loaded_file : source.source || '',
      cartelas: cleanCartelas,
      settings,
      overrides: previousOverrides,
      page_breaks: previousPageBreaks,
      page_line_adjustments: previous && previous.page_line_adjustments ? previous.page_line_adjustments : {},
    };
  }

  function materialHasRenderableContent(material) {
    if (!material) return false;
    if (material.type === 'music_licenses') return groupMusicLicenseThemes(getMaterialContentItems(material), {}).length > 0;
    return getMaterialContentItems(material).some((item) => {
      if (item.kind === 'section') return false;
      if (item.kind === 'crew_credit' || item.kind === 'credit') return (item.names || []).length > 0 || item.role;
      if (item.kind === 'cast') return item.actor || item.character;
      if (item.kind === 'list_item' || item.kind === 'closing_line') return item.value;
      if (item.kind === 'logo') return item.value || item.title;
      return Object.keys(item || {}).some((key) => !['id', 'kind', 'row', 'section'].includes(key) && item[key]);
    });
  }

  function removeDefaultEmptyCartelas(cartelas, materials) {
    const materialById = new Map((materials || []).map((material) => [material.id, material]));
    return (cartelas || []).filter((cartela) => {
      const refs = getCartelaRefs(cartela);
      if (!refs.length) return true;
      const hasContent = refs.some((ref) => materialHasRenderableContent(materialById.get(ref)));
      return hasContent || cartela.enabled !== false;
    });
  }

  function addMissingMaterialsToStructure(cartelas, materials, settings) {
    const existingRefs = new Set();
    (cartelas || []).forEach((cartela) => {
      getCartelaRefs(cartela).forEach((ref) => existingRefs.add(ref));
    });

    (materials || []).forEach((material) => {
      if (existingRefs.has(material.id) || !materialHasRenderableContent(material)) return;
      const cartela = defaultCartelaForMaterial(material, cartelas.length, settings);
      cartela.pages = (cartela.pages || []).map((page) => normalizeCartelaPage(page));
      cartelas.push(cartela);
      existingRefs.add(material.id);
    });
  }

  function hasMissingMaterialRefs(cartela, materialIds) {
    return getCartelaRefs(cartela).some((ref) => !materialIds.has(ref));
  }

  function migrateStructure(structure) {
    if (!structure) return null;
    if (Array.isArray(structure.cartelas)) {
      structure.version = Math.max(Number(structure.version) || 0, 10);
      structure.page_breaks = structure.page_breaks || {};
      structure.page_line_adjustments = structure.page_line_adjustments || {};
      structure.settings = normalizeSettings(structure.settings || {});
      structure.cartelas.forEach((cartela) => {
        cartela.pages = (cartela.pages || []).map((page) => normalizeCartelaPage(page));
      });
      return structure;
    }

    if (Array.isArray(structure.pages)) {
      return {
        schema: 'credits_structure_json',
        version: 10,
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
              title: '',
              source_ref_settings: page.block_ref ? { [page.block_ref]: { columns: 1 } } : {},
            },
          ],
        })),
        settings: normalizeSettings(structure.settings || {}),
        overrides: structure.overrides || {},
        page_breaks: structure.page_breaks || {},
        page_line_adjustments: structure.page_line_adjustments || {},
      };
    }

    structure.version = Math.max(Number(structure.version) || 0, 10);
    structure.page_breaks = structure.page_breaks || {};
    structure.page_line_adjustments = structure.page_line_adjustments || {};
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
      pdf_base_name: 'creditos',
      typography: {
        page_header: { font_size: 12, font_family: 'Arial', font_style: 'Regular', font_postscript_name: '', color: '#58616a' },
        block_title: { font_size: 16, font_family: 'Arial', font_style: 'Regular', font_postscript_name: '', color: '#24545f' },
        role: { font_size: 14, font_family: 'Arial', font_style: 'Regular', font_postscript_name: '', color: '#171b1f' },
        name: { font_size: 14, font_family: 'Arial', font_style: 'Regular', font_postscript_name: '', color: '#171b1f' },
      },
      layout: {
        line_spacing: 1.12,
        column_gap: 14,
        role_name_gap: 6,
        page_top_margin: 80,
        page_bottom_margin: 58,
        page_width: 1920,
        page_height: 1080,
        page_background: '#ffffff',
        block_gap: 10,
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
      normalized.typography[key].font_style = normalized.typography[key].font_style || defaults.typography[key].font_style;
      normalized.typography[key].font_postscript_name = normalized.typography[key].font_postscript_name || '';
      normalized.typography[key].color = normalized.typography[key].color || defaults.typography[key].color;
    });
    normalized.layout.line_spacing = Math.max(0.1, Number(normalized.layout.line_spacing) || defaults.layout.line_spacing);
    normalized.layout.column_gap = Math.max(0, Number(normalized.layout.column_gap) || defaults.layout.column_gap);
    normalized.layout.role_name_gap = Math.max(0, Number(normalized.layout.role_name_gap) || defaults.layout.role_name_gap);
    normalized.layout.page_top_margin = Math.max(0, Number(normalized.layout.page_top_margin) || defaults.layout.page_top_margin);
    normalized.layout.page_bottom_margin = Math.max(0, Number(normalized.layout.page_bottom_margin) || defaults.layout.page_bottom_margin);
    normalized.layout.page_width = Math.max(1, Number(normalized.layout.page_width) || defaults.layout.page_width);
    normalized.layout.page_height = Math.max(1, Number(normalized.layout.page_height) || defaults.layout.page_height);
    normalized.layout.page_background = normalizeColor(normalized.layout.page_background || defaults.layout.page_background);
    normalized.layout.block_gap = Math.max(0, Number(normalized.layout.block_gap) || defaults.layout.block_gap);
    normalized.pdf_base_name = safeFilePart(normalized.pdf_base_name || defaults.pdf_base_name);
    return normalized;
  }

  function defaultCartelaForMaterial(material, index, settings) {
    return {
      id: `cartela_${String(index + 1).padStart(3, '0')}`,
      title: '',
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
    normalized.title = normalized.title || '';
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
      title: page.title || '',
      source_refs: page.source_refs || [],
      source_ref_settings: page.source_ref_settings || {},
    };
    normalized.source_refs.forEach((ref) => {
      normalized.source_ref_settings[ref] = normalized.source_ref_settings[ref] || {};
      normalized.source_ref_settings[ref].columns = Math.max(1, Number(normalized.source_ref_settings[ref].columns) || 1);
      normalized.source_ref_settings[ref].alignment = normalized.source_ref_settings[ref].alignment || {};
      normalized.source_ref_settings[ref].vertical_align = normalizeVerticalAlign(normalized.source_ref_settings[ref].vertical_align);
      const typography = normalizeTypographyOverrides(normalized.source_ref_settings[ref].typography);
      if (Object.keys(typography).length) {
        normalized.source_ref_settings[ref].typography = typography;
      } else {
        delete normalized.source_ref_settings[ref].typography;
      }
    });
    return normalized;
  }

  function buildRenderJson(source, materials, structure) {
    const materialById = new Map(materials.map((material) => [material.id, material]));
    const overrides = structure.overrides || {};
    const maxAutoLines = Number(structure.settings && structure.settings.default_auto_page_lines) || 0;

    const render = {
      schema: 'credits_render_json',
      version: 7,
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
          label: cartela.title || '',
          type: cartela.type,
          orientation: cartela.orientation || 'horizontal',
          columns: Number(cartela.columns) || 1,
          font_size_multiplier: Number(cartela.font_size_multiplier) || 1,
          line_spacing_multiplier: Number(cartela.line_spacing_multiplier) || 1,
          duration: Number(cartela.duration) || 0,
          pages: (cartela.pages || []).map((page, pageIndex) => ({
            id: page.id,
            page_number: pageIndex + 1,
            title: resolveOverride(overrides, page.id, 'title', page.title || ''),
            blocks: (page.source_refs || []).map((ref) => {
              const material = materialById.get(ref);
              const lineAdjustments = structure.page_line_adjustments || {};
              const block = renderMaterial(material, ref, overrides, structure.page_breaks || {}, 0, lineAdjustments);
              block.columns = getSourceRefColumns(page, ref);
              block.alignment = getSourceRefAlignment(page, ref, material, cartela);
              block.vertical_align = getSourceRefVerticalAlign(page, ref);
              block.typography = getSourceRefTypography(page, ref);
              return block;
            }),
          })),
        })),
    };
    render.physical_pages = buildPhysicalPages(render.cartelas, overrides, {
      settings: structure.settings,
      pageLineAdjustments: structure.page_line_adjustments,
    }).map((page, index) => ({
      id: page.id,
      page_number: index + 1,
      title: page.title || '',
      line_count: page.line_count || 0,
      line_limit: page.line_limit || 0,
      cartela_id: page.cartela.id,
      cartela_page_id: page.cartela_page.id,
      blocks: page.blocks,
    }));
    return render;
  }

  function renderMaterial(material, ref, overrides, pageBreaks, maxAutoLines, lineAdjustments) {
    if (!material) return { missing_source: ref };
    const breaks = pageBreaks[material.id] || [];
    const pageLineAdjustments = lineAdjustments[material.id] || {};
    const rendered = {
      id: material.id,
      source_block_id: material.source_block_id,
      group: material.group,
      type: material.type,
      title: resolveOverride(overrides, material.id, 'title', material.default_title),
      titles: resolveOverride(overrides, material.id, 'titles', material.titles || [material.title]),
    };

    if (material.type === 'music_licenses') {
      rendered.themes = groupMusicLicenseThemes(getMaterialContentItems(material), overrides);
      rendered.pages = splitRenderedUnitsByBreaks(rendered.themes, breaks, (theme) => theme.lines[theme.lines.length - 1].id, maxAutoLines, countThemeLines, pageLineAdjustments);
    } else {
      rendered.items = flattenRenderedItems(getMaterialContentItems(material), overrides);
      rendered.pages = splitRenderedUnitsByBreaks(rendered.items, breaks, (item) => item.id, maxAutoLines, countItemLines, pageLineAdjustments);
    }

    rendered.pages = rendered.pages.map((page) => ({
      ...page,
      title: rendered.title,
    }));

    return rendered;
  }

  function splitRenderedUnitsByBreaks(units, breaks, idForUnit, maxAutoLines, lineCounter, pageLineAdjustments = {}) {
    const breakSet = new Set(breaks || []);
    const pages = [];
    let currentPage = { id: `block_page_${String(pages.length + 1).padStart(2, '0')}`, items: [], start_index: 0 };
    let currentLines = 0;

    units.forEach((unit, index) => {
      if (!currentPage.items.length) currentPage.start_index = index;
      const unitLines = Math.max(1, lineCounter(unit));
      currentPage.items.push(unit);
      currentLines += unitLines;
      const pageIndex = pages.length;
      const lineAdjustment = Number(pageLineAdjustments[pageIndex]) || 0;
      const lineLimit = Math.max(1, maxAutoLines + lineAdjustment);
      const shouldAutoBreak = maxAutoLines > 0 && lineLimit > 0 && currentLines >= lineLimit && index < units.length - 1;
      if (breakSet.has(idForUnit(unit)) || shouldAutoBreak) {
        currentPage.end_index = index;
        currentPage.line_count = currentLines;
        currentPage.break_after_id = idForUnit(unit);
        pages.push(currentPage);
        currentPage = { id: `block_page_${String(pages.length + 1).padStart(2, '0')}`, items: [], start_index: index + 1 };
        currentLines = 0;
      }
    });

    if (currentPage.items.length || !pages.length) {
      currentPage.end_index = currentPage.items.length ? units.length - 1 : -1;
      currentPage.line_count = currentLines;
      currentPage.break_after_id = currentPage.items.length ? idForUnit(currentPage.items[currentPage.items.length - 1]) : '';
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
    refreshPdfIfActive();
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
    if (tabName === 'pdf') renderPdfPreview();
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
    updateFontStatus();
    const fontCatalog = getFontCatalog();

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
      fontCatalog.families.forEach((font) => {
        const option = document.createElement('option');
        option.value = font;
        option.textContent = font;
        fontSelect.appendChild(option);
      });
      if (!fontCatalog.families.includes(value.font_family)) {
        const option = document.createElement('option');
        option.value = value.font_family;
        option.textContent = value.font_family;
        fontSelect.appendChild(option);
      }
      fontSelect.value = value.font_family;
      fontSelect.addEventListener('change', () => {
        const nextStyle = getFontStyles(fontSelect.value)[0] || { style: 'Regular', postscript_name: '' };
        updateTypographySetting(key, {
          font_family: fontSelect.value,
          font_style: nextStyle.style,
          font_postscript_name: nextStyle.postscript_name,
        });
        renderSettings();
      });
      row.appendChild(fontSelect);

      const styleSelect = document.createElement('select');
      styleSelect.className = 'text-input';
      const styles = getFontStyles(value.font_family);
      styles.forEach((fontStyle) => {
        const option = document.createElement('option');
        option.value = fontStyle.style;
        option.textContent = fontStyle.style;
        option.dataset.postscriptName = fontStyle.postscript_name || '';
        styleSelect.appendChild(option);
      });
      if (!styles.some((fontStyle) => fontStyle.style === value.font_style)) {
        const option = document.createElement('option');
        option.value = value.font_style;
        option.textContent = value.font_style;
        option.dataset.postscriptName = value.font_postscript_name || '';
        styleSelect.appendChild(option);
      }
      styleSelect.value = value.font_style;
      styleSelect.addEventListener('change', () => {
        const selected = styleSelect.selectedOptions[0];
        updateTypographySetting(key, {
          font_style: styleSelect.value,
          font_postscript_name: selected ? selected.dataset.postscriptName || '' : '',
        });
      });
      row.appendChild(styleSelect);

      const colorInput = document.createElement('input');
      colorInput.className = 'color-input';
      colorInput.type = 'color';
      colorInput.value = normalizeColor(value.color);
      colorInput.addEventListener('input', () => updateTypographySetting(key, { color: colorInput.value }));
      row.appendChild(colorInput);

      els.typographySettings.appendChild(row);
    });
  }

  async function loadSystemFonts() {
    if (!window.queryLocalFonts) {
      window.alert('Chrome no permite leer fuentes del sistema en este entorno. Se usara la lista basica.');
      updateFontStatus();
      return;
    }

    try {
      const fonts = await window.queryLocalFonts();
      const byFamily = new Map();
      fonts.forEach((font) => {
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
      state.fontCatalog = {
        families: Array.from(byFamily.keys()).sort((a, b) => a.localeCompare(b)),
        stylesByFamily: Object.fromEntries(
          Array.from(byFamily.entries()).map(([family, styles]) => [
            family,
            dedupeFontStyles(styles),
          ])
        ),
      };
      renderSettings();
      renderEditor();
      renderPreview();
      refreshPdfIfActive();
    } catch (error) {
      if (error.name !== 'AbortError') {
        window.alert('No se pudieron cargar las fuentes del sistema: ' + error.message);
      }
    }
  }

  function getFontCatalog() {
    if (state.fontCatalog) return state.fontCatalog;
    return {
      families: FONT_OPTIONS,
      stylesByFamily: Object.fromEntries(FONT_OPTIONS.map((font) => [font, [{ style: 'Regular', postscript_name: '' }]])),
    };
  }

  function getFontStyles(family) {
    const catalog = getFontCatalog();
    return catalog.stylesByFamily[family] || [{ style: 'Regular', postscript_name: '' }];
  }

  function dedupeFontStyles(styles) {
    const byStyle = new Map();
    styles.forEach((fontStyle) => {
      if (!byStyle.has(fontStyle.style)) byStyle.set(fontStyle.style, fontStyle);
    });
    return Array.from(byStyle.values()).sort((a, b) => a.style.localeCompare(b.style));
  }

  function styleFromFullName(fullName, family) {
    return String(fullName || '').replace(String(family || ''), '').trim() || 'Regular';
  }

  function updateFontStatus() {
    if (!els.fontStatus) return;
    if (state.fontCatalog) {
      els.fontStatus.textContent = `${state.fontCatalog.families.length} familias cargadas`;
    } else if (window.queryLocalFonts) {
      els.fontStatus.textContent = 'Fuentes basicas cargadas; puedes cargar fuentes del sistema';
    } else {
      els.fontStatus.textContent = 'Fuentes basicas cargadas';
    }
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
    refreshPdfIfActive();
  }

  function renderLayoutSettings(settings) {
    const existing = document.getElementById('layoutSettings');
    if (existing) existing.remove();

    const wrap = document.createElement('div');
    wrap.id = 'layoutSettings';
    wrap.className = 'layout-settings';
    wrap.appendChild(sectionLabel('Layout base'));
    wrap.appendChild(settingsNumberRow('Interlineado', settings.layout.line_spacing, 0.1, null, 0.01, (value) => updateLayoutSetting({ line_spacing: value })));
    wrap.appendChild(settingsNumberRow('Gap columnas', settings.layout.column_gap, 0, null, 1, (value) => updateLayoutSetting({ column_gap: value })));
    wrap.appendChild(settingsNumberRow('Gap cargo/nombre', settings.layout.role_name_gap, 0, null, 1, (value) => updateLayoutSetting({ role_name_gap: value })));
    wrap.appendChild(settingsNumberRow('Gap bloques', settings.layout.block_gap, 0, null, 1, (value) => updateLayoutSetting({ block_gap: value })));
    wrap.appendChild(settingsNumberRow('Ancho pagina px', settings.layout.page_width, 1, null, 1, (value) => updateLayoutSetting({ page_width: value })));
    wrap.appendChild(settingsNumberRow('Alto pagina px', settings.layout.page_height, 1, null, 1, (value) => updateLayoutSetting({ page_height: value })));
    wrap.appendChild(settingsNumberRow('Margen superior pagina', settings.layout.page_top_margin, 0, null, 1, (value) => updateLayoutSetting({ page_top_margin: value })));
    wrap.appendChild(settingsNumberRow('Margen inferior pagina', settings.layout.page_bottom_margin, 0, null, 1, (value) => updateLayoutSetting({ page_bottom_margin: value })));
    wrap.appendChild(settingsColorRow('Fondo pagina', settings.layout.page_background, (value) => updateLayoutSetting({ page_background: value })));
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
    if (max !== null && max !== undefined) input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.addEventListener('change', () => {
      const raw = Number(input.value);
      let next = Math.max(min, Number.isFinite(raw) ? raw : min);
      if (max !== null && max !== undefined) next = Math.min(max, next);
      input.value = String(next);
      onInput(next);
    });
    row.appendChild(labelEl);
    row.appendChild(input);
    return row;
  }

  function settingsColorRow(label, value, onInput) {
    const row = document.createElement('div');
    row.className = 'field-grid';
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    const input = document.createElement('input');
    input.className = 'color-input';
    input.type = 'color';
    input.value = normalizeColor(value);
    input.addEventListener('input', () => onInput(input.value));
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
    refreshPdfIfActive();
  }

  function updateSettings(fields) {
    if (!state.structure) {
      state.structure = {
        schema: 'credits_structure_json',
        version: 10,
        source_sheet: '',
        source_file: '',
        cartelas: [],
        settings: normalizeSettings({}),
        overrides: {},
        page_breaks: {},
        page_line_adjustments: {},
      };
    }
    state.structure.settings = normalizeSettings(state.structure.settings || {});
    Object.assign(state.structure.settings, fields);
    if (state.source) {
      state.render = buildRenderJson(state.source, state.materials, state.structure);
    }
    renderSettings();
    renderPreview();
    refreshPdfIfActive();
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
        <div class="block-name">${escapeHtml(getCartelaDisplayName(cartela, index))}</div>
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

    els.editorTitle.textContent = getCartelaDisplayName(cartela);
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
    wrap.appendChild(localSelectRow('Alineacion vertical bloque', getSelectedBlockVerticalAlign(ref), [
      ['top', 'Arriba'],
      ['center', 'Centrado'],
      ['bottom', 'Abajo'],
    ], (value) => updateSelectedBlockVerticalAlign(ref, value)));
    wrap.appendChild(renderBlockTypographyControls(ref));
    wrap.appendChild(inputRow('Titulo bloque', material.id, 'title', material.default_title || ''));

    if (material.type === 'music_licenses') {
      wrap.appendChild(renderMusicThemesEditor(material));
      return wrap;
    }

    const breakUnits = getMaterialContentItems(material);
    breakUnits.forEach((item, index) => {
      const isLastItem = index === breakUnits.length - 1;
      wrap.appendChild(renderItemEditor(item, material.id, isLastItem));
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

  function renderBlockTypographyControls(ref) {
    const wrap = document.createElement('div');
    wrap.className = 'block-typography-settings';
    wrap.appendChild(sectionLabel('Tipografia bloque'));

    const settings = normalizeSettings(state.structure && state.structure.settings ? state.structure.settings : {});
    const overrides = getSelectedBlockTypography(ref);
    const fontCatalog = getFontCatalog();

    BLOCK_TYPOGRAPHY_FIELDS.forEach(([key, label]) => {
      const base = settings.typography[key];
      const override = overrides[key] || {};
      const value = { ...base, ...override };
      const row = document.createElement('div');
      row.className = 'typography-row block-typography-row';

      const labelEl = document.createElement('label');
      labelEl.textContent = label;
      row.appendChild(labelEl);

      const sizeInput = document.createElement('input');
      sizeInput.className = 'text-input';
      sizeInput.type = 'number';
      sizeInput.min = '1';
      sizeInput.step = '1';
      sizeInput.value = String(value.font_size);
      sizeInput.placeholder = String(base.font_size);
      sizeInput.addEventListener('change', () => updateSelectedBlockTypography(ref, key, { font_size: Math.max(1, Number(sizeInput.value) || base.font_size) }));
      row.appendChild(sizeInput);

      const fontSelect = document.createElement('select');
      fontSelect.className = 'text-input';
      fontCatalog.families.forEach((font) => {
        const option = document.createElement('option');
        option.value = font;
        option.textContent = font;
        fontSelect.appendChild(option);
      });
      if (!fontCatalog.families.includes(value.font_family)) {
        const option = document.createElement('option');
        option.value = value.font_family;
        option.textContent = value.font_family;
        fontSelect.appendChild(option);
      }
      fontSelect.value = value.font_family;
      fontSelect.addEventListener('change', () => {
        const nextStyle = getFontStyles(fontSelect.value)[0] || { style: 'Regular', postscript_name: '' };
        updateSelectedBlockTypography(ref, key, {
          font_family: fontSelect.value,
          font_style: nextStyle.style,
          font_postscript_name: nextStyle.postscript_name,
        }, { rerenderEditor: true });
      });
      row.appendChild(fontSelect);

      const styleSelect = document.createElement('select');
      styleSelect.className = 'text-input';
      const styles = getFontStyles(value.font_family);
      styles.forEach((fontStyle) => {
        const option = document.createElement('option');
        option.value = fontStyle.style;
        option.textContent = fontStyle.style;
        option.dataset.postscriptName = fontStyle.postscript_name || '';
        styleSelect.appendChild(option);
      });
      if (!styles.some((fontStyle) => fontStyle.style === value.font_style)) {
        const option = document.createElement('option');
        option.value = value.font_style;
        option.textContent = value.font_style;
        option.dataset.postscriptName = value.font_postscript_name || '';
        styleSelect.appendChild(option);
      }
      styleSelect.value = value.font_style;
      styleSelect.addEventListener('change', () => {
        const selected = styleSelect.selectedOptions[0];
        updateSelectedBlockTypography(ref, key, {
          font_style: styleSelect.value,
          font_postscript_name: selected ? selected.dataset.postscriptName || '' : '',
        });
      });
      row.appendChild(styleSelect);

      const colorInput = document.createElement('input');
      colorInput.className = 'color-input';
      colorInput.type = 'color';
      colorInput.value = normalizeColor(value.color);
      colorInput.addEventListener('input', () => updateSelectedBlockTypography(ref, key, { color: colorInput.value }));
      row.appendChild(colorInput);

      wrap.appendChild(row);
    });

    const resetButton = document.createElement('button');
    resetButton.type = 'button';
    resetButton.textContent = 'Restablecer tipografia bloque';
    resetButton.addEventListener('click', () => resetSelectedBlockTypography(ref));
    wrap.appendChild(resetButton);
    return wrap;
  }

  function renderMusicThemesEditor(material) {
    const wrap = document.createElement('div');
    wrap.className = 'music-themes';
    const themes = groupMusicLicenseThemes(getMaterialContentItems(material), state.structure.overrides || {});
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
    });
    return wrap;
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
      title: '',
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
    refreshPdfIfActive();
  }

  function getSelectedCartela() {
    return state.structure && state.structure.cartelas
      ? state.structure.cartelas.find((cartela) => cartela.id === state.selectedCartelaId)
      : null;
  }

  function getCartelaRefs(cartela) {
    return (cartela.pages || []).flatMap((page) => page.source_refs || []);
  }

  function getCartelaDisplayName(cartela, index = 0) {
    const refs = getCartelaRefs(cartela);
    const titles = refs
      .map((ref) => state.materials.find((material) => material.id === ref))
      .filter(Boolean)
      .map((material) => material.title || material.id);
    return titles.length ? titles.join(' + ') : `Cartela ${index + 1}`;
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

  function getSourceRefVerticalAlign(page, ref) {
    const settings = page && page.source_ref_settings && page.source_ref_settings[ref]
      ? page.source_ref_settings[ref]
      : {};
    return normalizeVerticalAlign(settings.vertical_align);
  }

  function getSourceRefTypography(page, ref) {
    const settings = page && page.source_ref_settings && page.source_ref_settings[ref]
      ? page.source_ref_settings[ref]
      : {};
    return normalizeTypographyOverrides(settings.typography);
  }

  function normalizeTypographyOverrides(typography) {
    const normalized = {};
    BLOCK_TYPOGRAPHY_FIELDS.forEach(([key]) => {
      if (!typography || !typography[key]) return;
      const value = typography[key];
      const item = {};
      if (value.font_size !== undefined && value.font_size !== '') item.font_size = Math.max(1, Number(value.font_size) || 1);
      if (value.font_family) item.font_family = value.font_family;
      if (value.font_style) item.font_style = value.font_style;
      if (value.font_postscript_name) item.font_postscript_name = value.font_postscript_name;
      if (value.color) item.color = normalizeColor(value.color);
      if (Object.keys(item).length) normalized[key] = item;
    });
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
    refreshPdfIfActive();
  }

  function getSelectedBlockVerticalAlign(ref) {
    const cartela = getSelectedCartela();
    const page = findPageWithRef(cartela, ref);
    return getSourceRefVerticalAlign(page, ref);
  }

  function updateSelectedBlockVerticalAlign(ref, value) {
    const cartela = getSelectedCartela();
    const page = findPageWithRef(cartela, ref);
    if (!page) return;
    page.source_ref_settings = page.source_ref_settings || {};
    page.source_ref_settings[ref] = page.source_ref_settings[ref] || {};
    page.source_ref_settings[ref].vertical_align = normalizeVerticalAlign(value);
    state.render = buildRenderJson(state.source, state.materials, state.structure);
    renderPreview();
    refreshPdfIfActive();
  }

  function getSelectedBlockTypography(ref) {
    const cartela = getSelectedCartela();
    const page = findPageWithRef(cartela, ref);
    return getSourceRefTypography(page, ref);
  }

  function updateSelectedBlockTypography(ref, key, fields, options = {}) {
    const cartela = getSelectedCartela();
    const page = findPageWithRef(cartela, ref);
    if (!page) return;
    page.source_ref_settings = page.source_ref_settings || {};
    page.source_ref_settings[ref] = page.source_ref_settings[ref] || {};
    const typography = {
      ...(page.source_ref_settings[ref].typography || {}),
      [key]: {
        ...(page.source_ref_settings[ref].typography && page.source_ref_settings[ref].typography[key] ? page.source_ref_settings[ref].typography[key] : {}),
        ...fields,
      },
    };
    page.source_ref_settings[ref].typography = normalizeTypographyOverrides(typography);
    state.render = buildRenderJson(state.source, state.materials, state.structure);
    if (options.rerenderEditor) renderEditor();
    renderPreview();
    refreshPdfIfActive();
  }

  function resetSelectedBlockTypography(ref) {
    const cartela = getSelectedCartela();
    const page = findPageWithRef(cartela, ref);
    if (!page || !page.source_ref_settings || !page.source_ref_settings[ref]) return;
    delete page.source_ref_settings[ref].typography;
    state.render = buildRenderJson(state.source, state.materials, state.structure);
    renderEditor();
    renderPreview();
    refreshPdfIfActive();
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
    refreshPdfIfActive();
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

  function makeVisualStaticText(value, className, styleKey, options = {}) {
    const text = String(value || '').trim();
    if (!text) return null;
    const element = document.createElement('div');
    element.className = `visual-static ${className}`;
    element.textContent = text;
    applyTypography(element, styleKey, options);
    if (options.textAlign) element.style.textAlign = options.textAlign;
    return element;
  }

  function applyTypography(element, key, options = {}) {
    const settings = normalizeSettings(state.structure && state.structure.settings ? state.structure.settings : {});
    const typography = {
      ...settings.typography[key],
      ...((options.typography && options.typography[key]) || {}),
    };
    const scale = Number(options.multiplier) || 1;
    const lineScale = Number(options.lineMultiplier) || 1;
    element.style.fontFamily = typography.font_family;
    element.style.fontSize = `${Math.max(1, Number(typography.font_size) || 1) * scale}px`;
    element.style.lineHeight = String(settings.layout.line_spacing * lineScale);
    element.style.fontWeight = fontWeightFromStyle(typography.font_style);
    element.style.fontStyle = /italic|oblique/i.test(typography.font_style || '') ? 'italic' : 'normal';
    element.style.color = typography.color;
  }

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

  function getRenderLayout() {
    return normalizeSettings(state.structure && state.structure.settings ? state.structure.settings : {}).layout;
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
    els.jsonPreview.value = JSON.stringify(state.preview === 'structure' ? getStructureJsonForOutput() : state.render, null, 2);
  }

  function getStructureJsonForOutput() {
    if (!state.structure) return null;
    const output = JSON.parse(JSON.stringify(state.structure));
    output.cartelas = removeDefaultEmptyCartelas(output.cartelas || [], state.materials || []);
    return output;
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
      const labelEl = document.createElement('strong');
      labelEl.textContent = cartela.label || cartela.id;
      headerEl.appendChild(labelEl);
      const metaEl = document.createElement('span');
      metaEl.textContent = `${cartela.orientation || 'horizontal'} · ${cartela.columns || 1} col · ${cartela.duration || 0}s`;
      headerEl.appendChild(metaEl);
      cartelaEl.appendChild(headerEl);

      (cartela.pages || []).forEach((cartelaPage) => {
        const pageEl = document.createElement('div');
        pageEl.className = 'render-page';
        const pageLabelEl = document.createElement('div');
        pageLabelEl.className = 'render-page-label';
        pageLabelEl.appendChild(makeVisualInput(cartelaPage.id, 'title', cartelaPage.title || '', 'render-page-title-input', {
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

  function refreshPdfIfActive() {
    if (state.activeTab === 'pdf') renderPdfPreview();
  }

  function renderPdfPreview() {
    if (!state.render) {
      els.pdfPreview.className = 'pdf-preview empty-state';
      els.pdfPreview.textContent = 'Carga un XLSX para ver las paginas.';
      updatePdfToolbar(0, 0);
      return;
    }

    const layout = getRenderLayout();
    const pages = buildPhysicalPages(state.render.cartelas || [], state.structure.overrides || {});
    if (state.pdfPageIndex >= pages.length) state.pdfPageIndex = Math.max(0, pages.length - 1);
    if (state.pdfPageIndex < 0) state.pdfPageIndex = 0;
    const page = pages[state.pdfPageIndex];
    updatePdfToolbar(state.pdfPageIndex + 1, pages.length);

    els.pdfPreview.className = 'pdf-preview';
    els.pdfPreview.innerHTML = '';

    if (!page) {
      els.pdfPreview.className = 'pdf-preview empty-state';
      els.pdfPreview.textContent = 'No hay paginas activas.';
      return;
    }

    const frameEl = document.createElement('div');
    frameEl.className = 'png-preview-frame';
    frameEl.style.width = `${layout.page_width * state.pngPreviewZoom}px`;
    frameEl.style.height = `${layout.page_height * state.pngPreviewZoom}px`;

    const sheetEl = makePdfSheetElement(page, layout);
    sheetEl.style.transform = `scale(${state.pngPreviewZoom})`;
    frameEl.appendChild(sheetEl);
    els.pdfPreview.appendChild(frameEl);
    updatePngZoomStatus();
  }

  function makePdfSheetElement(page, layout, options = {}) {
    const sheetEl = document.createElement('section');
    sheetEl.className = 'pdf-sheet';
    sheetEl.style.width = `${layout.page_width}px`;
    sheetEl.style.height = `${layout.page_height}px`;
    sheetEl.style.background = options.transparent ? 'transparent' : layout.page_background;
    if (options.transparent) sheetEl.classList.add('transparent-export');

    const pageInner = document.createElement('div');
    pageInner.className = 'pdf-page-inner';
    pageInner.style.padding = `${layout.page_top_margin}px 68px ${layout.page_bottom_margin}px`;

    const pageBody = document.createElement('div');
    pageBody.className = 'pdf-page-body';
    pageBody.style.gap = `${layout.block_gap}px`;
    pageBody.style.justifyContent = pdfPageVerticalJustify(page);

    const pageTitle = makePdfPageTitle(page);
    if (pageTitle) pageBody.appendChild(pageTitle);

    page.blocks.forEach((block) => {
      pageBody.appendChild(renderPdfBlock(block, page.cartela, layout));
    });

    pageInner.appendChild(pageBody);
    sheetEl.appendChild(pageInner);
    return sheetEl;
  }

  function buildPhysicalPages(cartelas, overrides = {}, options = {}) {
    const physicalPages = [];
    const settings = normalizeSettings(options.settings || (state.structure && state.structure.settings) || {});
    const defaultLines = Math.max(1, Number(settings.default_auto_page_lines) || 1);
    const pageLineAdjustments = options.pageLineAdjustments || (state.structure && state.structure.page_line_adjustments) || {};
    const physicalAdjustments = pageLineAdjustments.__physical || {};

    cartelas.forEach((cartela) => {
      (cartela.pages || []).forEach((cartelaPage) => {
        const blocks = cartelaPage.blocks || [];
        const blockPageIndexes = new Map();
        let pageIndex = 0;
        let currentPage = null;

        const startPage = () => {
          const physicalPageId = `${cartela.id}_${cartelaPage.id}_physical_${String(pageIndex + 1).padStart(2, '0')}`;
          const title = resolveOverride(overrides, physicalPageId, 'title', '');
          const lineLimit = Math.max(1, defaultLines + (Number(physicalAdjustments[physicalPageId]) || 0));
          currentPage = {
            id: physicalPageId,
            page_index: pageIndex,
            title,
            line_count: countTitleLine(title),
            line_limit: lineLimit,
            cartela,
            cartela_page: cartelaPage,
            blocks: [],
          };
          pageIndex += 1;
        };

        const pageHasBlocks = () => currentPage && currentPage.blocks.length > 0;
        const finishPage = () => {
          if (currentPage && (currentPage.blocks.length || String(currentPage.title || '').trim())) {
            physicalPages.push(currentPage);
          }
          currentPage = null;
        };
        const nextBlockPageIndex = (block) => {
          const current = blockPageIndexes.get(block.id) || 0;
          blockPageIndexes.set(block.id, current + 1);
          return current;
        };
        const ensureBlockOnPage = (block) => {
          const lastBlock = currentPage.blocks[currentPage.blocks.length - 1];
          if (lastBlock && lastBlock.id === block.id) return lastBlock;
          const blockPageIndex = nextBlockPageIndex(block);
          const physicalBlock = {
            ...block,
            block_page_index: blockPageIndex,
            pages: [{
              id: `block_page_${String(blockPageIndex + 1).padStart(2, '0')}`,
              items: [],
              start_index: 0,
              line_count: 0,
            }],
          };
          currentPage.blocks.push(physicalBlock);
          return physicalBlock;
        };
        const addUnitToPage = (block, unit, unitIndex) => {
          if (!currentPage) startPage();
          let physicalBlock = currentPage.blocks[currentPage.blocks.length - 1];
          const existingItems = physicalBlock && physicalBlock.id === block.id && physicalBlock.pages[0]
            ? physicalBlock.pages[0].items
            : [];
          const existingBlockLines = physicalBlock && physicalBlock.id === block.id && physicalBlock.pages[0]
            ? Number(physicalBlock.pages[0].line_count) || 0
            : 0;
          const candidateBlockLines = countBlockVisualLines(block, cartela, existingItems.concat(unit));
          const addedLines = candidateBlockLines - existingBlockLines;
          if (pageHasBlocks() && currentPage.line_count + addedLines > currentPage.line_limit) {
            finishPage();
            startPage();
            physicalBlock = null;
          }

          physicalBlock = ensureBlockOnPage(block);
          const page = physicalBlock.pages[0];
          const previousBlockLines = Number(page.line_count) || 0;
          if (!page.items.length) {
            page.start_index = unitIndex;
          }
          const forcePageBreakAfter = unit.__force_page_break_after;
          const cleanUnit = { ...unit };
          delete cleanUnit.__force_page_break_after;
          page.items.push(cleanUnit);
          page.end_index = unitIndex;
          page.break_after_id = cleanUnit.id || '';
          page.line_count = countBlockVisualLines(block, cartela, page.items);
          currentPage.line_count += page.line_count - previousBlockLines;
          if (forcePageBreakAfter) finishPage();
        };

        blocks.forEach((block) => {
          if (block.missing_source) {
            addUnitToPage(block, { id: `${block.id}_missing`, kind: 'missing_source' }, 0);
            return;
          }
          const units = getRenderedBlockUnits(block);
          if (!units.length && String(block.title || '').trim()) {
            if (!currentPage) startPage();
            if (pageHasBlocks() && currentPage.line_count + countTitleLine(block.title) > currentPage.line_limit) {
              finishPage();
              startPage();
            }
            const physicalBlock = ensureBlockOnPage(block);
            const page = physicalBlock.pages[0];
            const previousBlockLines = Number(page.line_count) || 0;
            page.line_count = countTitleLine(block.title);
            currentPage.line_count += page.line_count - previousBlockLines;
            return;
          }
          units.forEach((unit, unitIndex) => addUnitToPage(block, unit, unitIndex));
        });

        finishPage();
        if (!blocks.length) {
          startPage();
          finishPage();
        }
      });
    });
    return physicalPages;
  }

  function getRenderedBlockUnits(block) {
    if (!block) return [];
    if (block.pages && block.pages.length) {
      return block.pages.flatMap((page, pageIndex) => {
        const items = page.items || [];
        return items.map((item, itemIndex) => ({
          ...item,
          __force_page_break_after: pageIndex < block.pages.length - 1 && itemIndex === items.length - 1,
        }));
      });
    }
    if (block.type === 'music_licenses') return block.themes || [];
    return block.items || [];
  }

  function countBlockVisualLines(block, cartela, units) {
    const items = units || [];
    const columns = Math.max(1, Number(block.columns) || 1);
    const rowHeights = [];
    items.forEach((unit, index) => {
      const row = Math.floor(index / columns);
      rowHeights[row] = Math.max(rowHeights[row] || 0, countRenderedUnitLines(unit, block, cartela));
    });
    return countTitleLine(block.title) + rowHeights.reduce((total, value) => total + value, 0);
  }

  function countRenderedUnitLines(unit, block, cartela) {
    if (!unit) return 1;
    if (unit.lines) return Math.max(1, unit.lines.length);
    if (unit.kind === 'credit' || unit.kind === 'crew_credit' || unit.kind === 'cast') {
      return cartela && cartela.orientation === 'vertical' ? 2 : 1;
    }
    return 1;
  }

  function countTitleLine(title) {
    return String(title || '').trim() ? 1 : 0;
  }

  function updatePdfToolbar(current, total) {
    if (!els.pdfPageNumberInput) return;
    const page = state.render ? buildPhysicalPages(state.render.cartelas || [], state.structure.overrides || {})[state.pdfPageIndex] : null;
    els.pdfPageNumberInput.disabled = !page;
    els.pdfPageNumberInput.max = String(Math.max(1, total));
    els.pdfPageNumberInput.value = String(Math.max(1, current));
    els.pdfTotalPages.textContent = `/ ${total}`;
    els.pdfFirstPageBtn.disabled = current <= 1;
    els.pdfPrevPageBtn.disabled = current <= 1;
    els.pdfNextPageBtn.disabled = current >= total;
    els.pdfLastPageBtn.disabled = current >= total;
    els.pdfMinusLinesBtn.disabled = total === 0;
    els.pdfPlusLinesBtn.disabled = total === 0;
    els.pdfPageTitleInput.disabled = !page;
    els.pdfPageTitleInput.value = page ? resolveOverride(state.structure.overrides || {}, page.id, 'title', '') : '';
    els.pdfBaseNameInput.disabled = !state.structure;
    els.pdfBaseNameInput.value = normalizeSettings(state.structure && state.structure.settings ? state.structure.settings : {}).pdf_base_name;
    els.exportCurrentPdfBtn.disabled = !page;
    els.exportAllPdfBtn.disabled = total === 0;
    els.pdfLineStatus.textContent = page ? getPdfLineStatus(page) : '0/0';
  }

  function changePdfPage(delta) {
    const total = state.render ? buildPhysicalPages(state.render.cartelas || [], state.structure.overrides || {}).length : 0;
    state.pdfPageIndex = Math.max(0, Math.min(total - 1, state.pdfPageIndex + delta));
    renderPdfPreview();
  }

  function goToPdfPage(index) {
    const total = state.render ? buildPhysicalPages(state.render.cartelas || [], state.structure.overrides || {}).length : 0;
    if (!total) {
      state.pdfPageIndex = 0;
    } else {
      state.pdfPageIndex = Math.max(0, Math.min(total - 1, index));
    }
    renderPdfPreview();
  }

  function adjustCurrentPdfPageLines(delta) {
    if (!state.render || !state.structure) return;
    const page = buildPhysicalPages(state.render.cartelas || [], state.structure.overrides || {})[state.pdfPageIndex];
    if (!page) return;
    state.structure.page_line_adjustments = state.structure.page_line_adjustments || {};
    state.structure.page_line_adjustments.__physical = state.structure.page_line_adjustments.__physical || {};
    const current = Number(state.structure.page_line_adjustments.__physical[page.id]) || 0;
    const defaultLines = Number(state.structure.settings && state.structure.settings.default_auto_page_lines) || 1;
    const next = Math.max(1 - defaultLines, current + delta);
    if (next === 0) {
      delete state.structure.page_line_adjustments.__physical[page.id];
    } else {
      state.structure.page_line_adjustments.__physical[page.id] = next;
    }
    state.render = buildRenderJson(state.source, state.materials, state.structure);
    renderPreview();
    renderPdfPreview();
  }

  function getPdfLineStatus(page) {
    const defaultLines = Number(state.structure && state.structure.settings && state.structure.settings.default_auto_page_lines) || 1;
    const adjustment = Number(
      state.structure &&
      state.structure.page_line_adjustments &&
      state.structure.page_line_adjustments.__physical &&
      state.structure.page_line_adjustments.__physical[page.id]
    ) || 0;
    return `${defaultLines}/${Math.max(1, defaultLines + adjustment)}`;
  }

  function updatePdfBaseName() {
    if (!state.structure) updateSettings({});
    state.structure.settings = normalizeSettings(state.structure.settings || {});
    state.structure.settings.pdf_base_name = safeFilePart(els.pdfBaseNameInput.value || 'creditos');
    renderPreview();
  }

  function updatePngPreviewZoom(delta) {
    state.pngPreviewZoom = Math.max(0.05, Math.min(2, Math.round((state.pngPreviewZoom + delta) * 20) / 20));
    renderPdfPreview();
  }

  function updatePngZoomStatus() {
    if (!els.pngZoomStatus) return;
    els.pngZoomStatus.textContent = `${Math.round(state.pngPreviewZoom * 100)}%`;
  }

  function pdfPageVerticalJustify(page) {
    const align = page.blocks && page.blocks[0] ? page.blocks[0].vertical_align : 'top';
    if (align === 'center') return 'center';
    if (align === 'bottom') return 'flex-end';
    return 'flex-start';
  }

  function updateCurrentPdfPageTitle() {
    if (!state.render || !state.structure) return;
    const page = buildPhysicalPages(state.render.cartelas || [], state.structure.overrides || {})[state.pdfPageIndex];
    if (!page) return;
    setOverride(page.id, 'title', els.pdfPageTitleInput.value, '');
    state.render = buildRenderJson(state.source, state.materials, state.structure);
    renderPreview();
    renderPdfPreview();
  }

  function makePdfPageTitle(page) {
    const title = resolveOverride(state.structure.overrides || {}, page.id, 'title', '');
    const text = String(title || '').trim();
    if (!text) return null;
    const titleEl = document.createElement('div');
    titleEl.className = 'pdf-page-title';
    titleEl.textContent = text;
    applyTypography(titleEl, 'page_header', {
      multiplier: page.cartela.font_size_multiplier,
      lineMultiplier: page.cartela.line_spacing_multiplier,
    });
    return titleEl;
  }

  async function exportPngPages(mode) {
    if (!state.render || !state.structure) return;
    const layout = getRenderLayout();
    const pages = buildPhysicalPages(state.render.cartelas || [], state.structure.overrides || {});
    if (!pages.length) return;
    const selectedPages = mode === 'current'
      ? [{ page: pages[state.pdfPageIndex], pageNumber: state.pdfPageIndex + 1 }]
      : pages.map((page, index) => ({ page, pageNumber: index + 1 }));
    const settings = normalizeSettings(state.structure.settings || {});
    const baseName = safeFilePart(settings.pdf_base_name || 'creditos');
    try {
      if (mode === 'all' && window.showDirectoryPicker) {
        const directory = await window.showDirectoryPicker({ mode: 'readwrite' });
        for (const item of selectedPages.filter((candidate) => candidate.page)) {
          const fileName = `${baseName}_${String(item.pageNumber).padStart(3, '0')}.png`;
          const blob = await renderPageToPngBlob(item.page, layout);
          await writeBlobToDirectory(directory, fileName, blob);
        }
        return;
      }

      for (const item of selectedPages.filter((candidate) => candidate.page)) {
        const fileName = `${baseName}_${String(item.pageNumber).padStart(3, '0')}.png`;
        const blob = await renderPageToPngBlob(item.page, layout);
        if (mode === 'current') {
          await saveBlobAs(blob, fileName);
        } else {
          downloadBlob(blob, fileName);
        }
        await wait(120);
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      window.alert('No se pudo exportar PNG: ' + error.message);
    }
  }

  function renderPageToPngBlob(page, layout) {
    const canvas = document.createElement('canvas');
    canvas.width = layout.page_width;
    canvas.height = layout.page_height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCanvasPage(ctx, page, layout);
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('No se pudo crear el PNG.'));
      }, 'image/png');
    });
  }

  function drawCanvasPage(ctx, page, layout) {
    const x = 68;
    const y = layout.page_top_margin;
    const width = layout.page_width - (x * 2);
    const height = layout.page_height - layout.page_top_margin - layout.page_bottom_margin;
    const blocks = page.blocks.filter((block) => !block.missing_source);
    const heights = blocks.map((block) => measureCanvasBlock(ctx, block, page.cartela, layout, width));
    const titleText = String(resolveOverride(state.structure.overrides || {}, page.id, 'title', '') || '').trim();
    const titleMetrics = titleText ? canvasTextMetrics('page_header', page.cartela, layout) : null;
    const titleHeight = titleMetrics ? titleMetrics.lineHeight : 0;
    const totalBlocksHeight = heights.reduce((total, value) => total + value, 0);
    const gaps = Math.max(0, blocks.length - 1) * layout.block_gap;
    const totalHeight = titleHeight + (titleHeight && blocks.length ? layout.block_gap : 0) + totalBlocksHeight + gaps;
    let cursorY = y + verticalOffset(height, totalHeight, pdfPageVerticalJustify(page));

    if (titleText && titleMetrics) {
      drawCanvasText(ctx, titleText, x, cursorY, width, titleMetrics, 'center');
      cursorY += titleMetrics.lineHeight + (blocks.length ? layout.block_gap : 0);
    }

    blocks.forEach((block, index) => {
      drawCanvasBlock(ctx, block, page.cartela, layout, x, cursorY, width);
      cursorY += heights[index] + layout.block_gap;
    });
  }

  function verticalOffset(availableHeight, contentHeight, justify) {
    if (justify === 'center') return Math.max(0, (availableHeight - contentHeight) / 2);
    if (justify === 'flex-end') return Math.max(0, availableHeight - contentHeight);
    return 0;
  }

  function measureCanvasBlock(ctx, block, cartela, layout, width) {
    let height = 0;
    const title = String(block.title || '').trim();
    const units = block.pages && block.pages[0] ? block.pages[0].items || [] : [];
    if (title) {
      height += canvasTextMetrics('block_title', cartela, layout, block.typography).lineHeight;
      if (units.length) height += layout.block_gap;
    }
    const columns = Math.max(1, Number(block.columns) || 1);
    const columnWidth = (width - layout.column_gap * (columns - 1)) / columns;
    const rowHeights = [];
    units.forEach((unit, index) => {
      const row = Math.floor(index / columns);
      const unitHeight = measureCanvasUnit(unit, block, cartela, layout, columnWidth);
      rowHeights[row] = Math.max(rowHeights[row] || 0, unitHeight);
    });
    height += rowHeights.reduce((total, value) => total + value, 0);
    height += Math.max(0, rowHeights.length - 1) * layout.block_gap;
    return height;
  }

  function drawCanvasBlock(ctx, block, cartela, layout, x, y, width) {
    let cursorY = y;
    const title = String(block.title || '').trim();
    const units = block.pages && block.pages[0] ? block.pages[0].items || [] : [];
    if (title) {
      const metrics = canvasTextMetrics('block_title', cartela, layout, block.typography);
      drawCanvasText(ctx, title, x, cursorY, width, metrics, 'center');
      cursorY += metrics.lineHeight + (units.length ? layout.block_gap : 0);
    }
    const columns = Math.max(1, Number(block.columns) || 1);
    const columnWidth = (width - layout.column_gap * (columns - 1)) / columns;
    const rowHeights = [];
    units.forEach((unit, index) => {
      const row = Math.floor(index / columns);
      rowHeights[row] = Math.max(rowHeights[row] || 0, measureCanvasUnit(unit, block, cartela, layout, columnWidth));
    });
    let previousCreditSourceId = null;
    units.forEach((unit, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      const unitX = x + col * (columnWidth + layout.column_gap);
      const unitY = cursorY + rowHeights.slice(0, row).reduce((total, value) => total + value, 0) + row * layout.block_gap;
      const isCredit = unit.kind === 'credit' || unit.kind === 'crew_credit';
      drawCanvasUnit(ctx, unit, block, cartela, layout, unitX, unitY, columnWidth, {
        hideRole: isCredit && unit.source_item_id && unit.source_item_id === previousCreditSourceId,
      });
      previousCreditSourceId = isCredit ? unit.source_item_id || null : null;
    });
  }

  function measureCanvasUnit(unit, block, cartela, layout, width) {
    if (block.type === 'music_licenses' && unit.lines) {
      return (unit.lines || []).reduce((total, line, index) => {
        return total + canvasTextMetrics(index === 0 ? 'block_title' : 'name', cartela, layout, block.typography).lineHeight;
      }, 0);
    }
    if (unit.kind === 'credit' || unit.kind === 'crew_credit' || unit.kind === 'cast') {
      const orientation = cartela.orientation || 'horizontal';
      const roleHeight = canvasTextMetrics('role', cartela, layout, block.typography).lineHeight;
      const nameHeight = canvasTextMetrics('name', cartela, layout, block.typography).lineHeight;
      return orientation === 'vertical' ? roleHeight + layout.block_gap + nameHeight : Math.max(roleHeight, nameHeight);
    }
    return canvasTextMetrics(unit.title !== undefined ? 'block_title' : 'name', cartela, layout, block.typography).lineHeight;
  }

  function drawCanvasUnit(ctx, unit, block, cartela, layout, x, y, width, options = {}) {
    const orientation = cartela.orientation || 'horizontal';
    const alignment = block.alignment || {};
    if (block.type === 'music_licenses' && unit.lines) {
      let cursorY = y;
      (unit.lines || []).forEach((line, index) => {
        const metrics = canvasTextMetrics(index === 0 ? 'block_title' : 'name', cartela, layout, block.typography);
        drawCanvasText(ctx, line.value || '', x, cursorY, width, metrics, alignment.text || 'center');
        cursorY += metrics.lineHeight;
      });
      return;
    }
    if (unit.kind === 'credit' || unit.kind === 'crew_credit') {
      drawCanvasPair(ctx, options.hideRole ? '' : unit.role || '', unit.name || '', cartela, layout, x, y, width, alignment, orientation, block.typography);
      return;
    }
    if (unit.kind === 'cast') {
      drawCanvasPair(ctx, unit.actor || '', unit.character || '', cartela, layout, x, y, width, alignment, orientation, block.typography);
      return;
    }
    const metrics = canvasTextMetrics(unit.title !== undefined ? 'block_title' : 'name', cartela, layout, block.typography);
    drawCanvasText(ctx, unit.title || unit.value || '', x, y, width, metrics, alignment.text || (orientation === 'vertical' ? 'center' : 'left'));
  }

  function drawCanvasPair(ctx, role, name, cartela, layout, x, y, width, alignment, orientation, typography) {
    const roleMetrics = canvasTextMetrics('role', cartela, layout, typography);
    const nameMetrics = canvasTextMetrics('name', cartela, layout, typography);
    if (orientation === 'vertical') {
      drawCanvasText(ctx, role, x, y, width, roleMetrics, alignment.role || 'center');
      drawCanvasText(ctx, name, x, y + roleMetrics.lineHeight + layout.block_gap, width, nameMetrics, alignment.name || 'center');
      return;
    }
    const halfWidth = (width - layout.role_name_gap) / 2;
    drawCanvasText(ctx, role, x, y, halfWidth, roleMetrics, alignment.role || 'right');
    drawCanvasText(ctx, name, x + halfWidth + layout.role_name_gap, y, halfWidth, nameMetrics, alignment.name || 'left');
  }

  function canvasTextMetrics(styleKey, cartela, layout, typographyOverrides = {}) {
    const settings = normalizeSettings(state.structure && state.structure.settings ? state.structure.settings : {});
    const typography = {
      ...settings.typography[styleKey],
      ...((typographyOverrides && typographyOverrides[styleKey]) || {}),
    };
    const fontSize = Math.max(1, Number(typography.font_size) || 1) * (Number(cartela.font_size_multiplier) || 1);
    return {
      color: typography.color,
      font: `${fontStyleFromStyle(typography.font_style)} ${fontWeightFromStyle(typography.font_style)} ${fontSize}px ${quoteFontFamily(typography.font_family)}`,
      fontSize,
      lineHeight: fontSize * settings.layout.line_spacing * (Number(cartela.line_spacing_multiplier) || 1),
    };
  }

  function drawCanvasText(ctx, text, x, y, width, metrics, align) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, metrics.lineHeight);
    ctx.clip();
    ctx.font = metrics.font;
    ctx.fillStyle = metrics.color;
    ctx.textBaseline = 'top';
    ctx.textAlign = align;
    const textX = align === 'center' ? x + width / 2 : align === 'right' ? x + width : x;
    ctx.fillText(String(text || ''), textX, y);
    ctx.restore();
  }

  function fontStyleFromStyle(style) {
    return /italic|oblique/i.test(style || '') ? 'italic' : 'normal';
  }

  function quoteFontFamily(family) {
    return `"${String(family || 'Arial').replace(/"/g, '\\"')}"`;
  }

  function downloadBlob(blob, fileName) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  async function saveBlobAs(blob, fileName) {
    if (!window.showSaveFilePicker) {
      downloadBlob(blob, fileName);
      return;
    }
    const handle = await window.showSaveFilePicker({
      suggestedName: fileName,
      types: [
        {
          description: 'PNG',
          accept: { 'image/png': ['.png'] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  }

  async function writeBlobToDirectory(directory, fileName, blob) {
    const handle = await directory.getFileHandle(fileName, { create: true });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function renderPdfBlock(block, cartela, layout) {
    const blockEl = document.createElement('div');
    blockEl.className = 'pdf-block';
    blockEl.style.setProperty('--block-gap', `${layout.block_gap}px`);
    if (block.missing_source) {
      blockEl.textContent = `Fuente no encontrada: ${block.missing_source}`;
      return blockEl;
    }

    const blockTitle = makePdfOptionalTitle(block.title, 'pdf-block-title', 'block_title', cartela, block.typography);
    if (blockTitle) blockEl.appendChild(blockTitle);

    const contentEl = document.createElement('div');
    contentEl.className = 'pdf-block-content';
    contentEl.style.gridTemplateColumns = `repeat(${Math.max(1, Number(block.columns) || 1)}, minmax(0, 1fr))`;
    contentEl.style.columnGap = `${layout.column_gap}px`;
    contentEl.style.rowGap = `${layout.block_gap}px`;
    contentEl.style.setProperty('--block-gap', `${layout.block_gap}px`);

    const units = block.pages && block.pages[0] ? block.pages[0].items || [] : [];
    let previousCreditSourceId = null;
    units.forEach((unit) => {
      if (block.type === 'music_licenses' && unit.lines) {
        contentEl.appendChild(renderPdfTheme(unit, block, cartela));
      } else {
        const isCredit = unit.kind === 'credit' || unit.kind === 'crew_credit';
        const hideRepeatedRole = isCredit && unit.source_item_id && unit.source_item_id === previousCreditSourceId;
        contentEl.appendChild(renderPdfUnit(unit, block, cartela, layout, { hideRole: hideRepeatedRole }));
        previousCreditSourceId = isCredit ? unit.source_item_id || null : null;
      }
    });

    blockEl.appendChild(contentEl);
    return blockEl;
  }

  function makePdfOptionalTitle(value, className, styleKey, cartela, typography) {
    const text = String(value || '').trim();
    if (!text) return null;
    const title = document.createElement('div');
    title.className = className;
    title.textContent = text;
    applyTypography(title, styleKey, {
      multiplier: cartela.font_size_multiplier,
      lineMultiplier: cartela.line_spacing_multiplier,
      typography,
    });
    return title;
  }

  function renderPdfTheme(theme, block, cartela) {
    const themeEl = document.createElement('div');
    themeEl.className = 'pdf-theme';
    (theme.lines || []).forEach((line, index) => {
      const lineEl = document.createElement('div');
      lineEl.className = index === 0 ? 'pdf-theme-title' : 'pdf-line';
      lineEl.textContent = line.value || '';
      lineEl.style.textAlign = block.alignment && block.alignment.text ? block.alignment.text : 'center';
      applyTypography(lineEl, index === 0 ? 'block_title' : 'name', {
        multiplier: cartela.font_size_multiplier,
        lineMultiplier: cartela.line_spacing_multiplier,
        typography: block.typography,
      });
      themeEl.appendChild(lineEl);
    });
    themeEl.style.setProperty('--block-gap', `${getRenderLayout().block_gap}px`);
    return themeEl;
  }

  function renderPdfUnit(unit, block, cartela, layout, options = {}) {
    const orientation = cartela.orientation || 'horizontal';
    const alignment = block.alignment || {};
    const unitEl = document.createElement('div');
    unitEl.className = `pdf-unit ${orientation}`;
    if (orientation === 'horizontal') {
      unitEl.style.gap = `${layout.role_name_gap}px`;
    } else {
      unitEl.style.gap = `${layout.block_gap}px`;
    }

    if (unit.kind === 'credit' || unit.kind === 'crew_credit') {
      unitEl.appendChild(makePdfText(options.hideRole ? '' : unit.role || '', 'role', {
        className: 'pdf-role',
        cartela,
        typography: block.typography,
        textAlign: alignment.role || (orientation === 'vertical' ? 'center' : 'right'),
      }));
      unitEl.appendChild(makePdfText(unit.name || '', 'name', {
        className: 'pdf-name',
        cartela,
        typography: block.typography,
        textAlign: alignment.name || (orientation === 'vertical' ? 'center' : 'left'),
      }));
      return unitEl;
    }

    if (unit.kind === 'cast') {
      unitEl.appendChild(makePdfText(unit.actor || '', 'role', {
        className: 'pdf-role',
        cartela,
        typography: block.typography,
        textAlign: alignment.role || (orientation === 'vertical' ? 'center' : 'right'),
      }));
      unitEl.appendChild(makePdfText(unit.character || '', 'name', {
        className: 'pdf-name',
        cartela,
        typography: block.typography,
        textAlign: alignment.name || (orientation === 'vertical' ? 'center' : 'left'),
      }));
      return unitEl;
    }

    return makePdfText(unit.title || unit.value || '', unit.title !== undefined ? 'block_title' : 'name', {
      className: 'pdf-line',
      cartela,
      typography: block.typography,
      textAlign: alignment.text || (orientation === 'vertical' ? 'center' : 'left'),
    });
  }

  function makePdfText(text, styleKey, options) {
    const el = document.createElement('div');
    el.className = options.className;
    el.textContent = text;
    el.style.textAlign = options.textAlign;
    applyTypography(el, styleKey, {
      multiplier: options.cartela.font_size_multiplier,
      lineMultiplier: options.cartela.line_spacing_multiplier,
      typography: options.typography,
    });
    return el;
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

      const blockTitle = makeVisualStaticText(block.title, 'render-block-title-input', 'block_title', {
        multiplier: cartela.font_size_multiplier,
        lineMultiplier: cartela.line_spacing_multiplier,
        typography: block.typography,
        textAlign: 'center',
      });
      if (blockTitle) blockPageEl.appendChild(blockTitle);

      const contentEl = document.createElement('div');
      contentEl.className = 'render-block-content';
      contentEl.style.gridTemplateColumns = `repeat(${Math.max(1, Number(block.columns) || 1)}, minmax(0, 1fr))`;
      contentEl.style.columnGap = `${layout.column_gap}px`;
      contentEl.style.rowGap = `${layout.block_gap}px`;

      const units = blockPage.items || [];
      let previousCreditSourceId = null;
      units.forEach((unit) => {
        if (block.type === 'music_licenses' && unit.lines) {
          const themeEl = document.createElement('div');
          themeEl.className = 'render-theme';
          themeEl.style.paddingTop = `${layout.block_gap / 2}px`;
          themeEl.style.paddingBottom = `${layout.block_gap / 2}px`;
          unit.lines.forEach((line, lineIndex) => {
            themeEl.appendChild(makeVisualInput(line.id, 'value', line.value || '', lineIndex === 0 ? 'render-theme-title-input' : 'render-line-input', {
              styleKey: lineIndex === 0 ? 'block_title' : 'name',
              multiplier: cartela.font_size_multiplier,
              lineMultiplier: cartela.line_spacing_multiplier,
              typography: block.typography,
              textAlign: block.alignment && block.alignment.text ? block.alignment.text : 'center',
            }));
          });
          contentEl.appendChild(themeEl);
        } else {
          const isCredit = unit.kind === 'credit' || unit.kind === 'crew_credit';
          const hideRepeatedRole = isCredit && unit.source_item_id && unit.source_item_id === previousCreditSourceId;
          contentEl.appendChild(renderVisualUnit(unit, cartela, block.alignment || {}, layout, {
            hideRole: hideRepeatedRole,
            typography: block.typography,
          }));
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
    } else {
      unitEl.style.gap = `${layout.block_gap}px`;
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
          typography: options.typography,
          textAlign: alignment.role || (orientation === 'vertical' ? 'center' : 'right'),
        }));
      }
      unitEl.appendChild(makeVisualInput(unit.source_name_id || unit.id, 'name', unit.name || '', 'render-name-input', {
        styleKey: 'name',
        multiplier: cartela.font_size_multiplier,
        lineMultiplier: cartela.line_spacing_multiplier,
        typography: options.typography,
        textAlign: alignment.name || (orientation === 'vertical' ? 'center' : 'left'),
      }));
      return unitEl;
    }
    if (unit.kind === 'cast') {
      unitEl.appendChild(makeVisualInput(unit.id, 'actor', unit.actor || '', 'render-role-input', {
        styleKey: 'role',
        multiplier: cartela.font_size_multiplier,
        lineMultiplier: cartela.line_spacing_multiplier,
        typography: options.typography,
        textAlign: alignment.role || (orientation === 'vertical' ? 'center' : 'right'),
      }));
      unitEl.appendChild(makeVisualInput(unit.id, 'character', unit.character || '', 'render-name-input', {
        styleKey: 'name',
        multiplier: cartela.font_size_multiplier,
        lineMultiplier: cartela.line_spacing_multiplier,
        typography: options.typography,
        textAlign: alignment.name || (orientation === 'vertical' ? 'center' : 'left'),
      }));
      return unitEl;
    }
    const value = unit.title || unit.value || '';
    unitEl.appendChild(makeVisualInput(unit.id, unit.title !== undefined ? 'title' : 'value', value, 'render-line-input', {
      styleKey: unit.title !== undefined ? 'block_title' : 'name',
      multiplier: cartela.font_size_multiplier,
      lineMultiplier: cartela.line_spacing_multiplier,
      typography: options.typography,
      textAlign: alignment.text || (orientation === 'vertical' ? 'center' : 'left'),
    }));
    return unitEl;
  }

  async function saveJsonFile(kind, forceSaveAs = false) {
    const data = kind === 'structure_json' ? getStructureJsonForOutput() : state.render;
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
    const data = kind === 'structure_json' ? getStructureJsonForOutput() : state.render;
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

  function normalizeText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
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
