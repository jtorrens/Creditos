const assert = require('node:assert/strict');
const test = require('node:test');

require('../../apps/renderer/domain/styles');
require('../../apps/renderer/appCommands');
require('../../apps/renderer/ui/panels/cartelaListPanel');

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(value) {
    this.values.add(value);
  }

  remove(...values) {
    values.forEach((value) => this.values.delete(value));
  }

  toggle(value, enabled) {
    if (enabled) this.add(value);
    else this.remove(value);
  }
}

class FakeElement {
  constructor() {
    this.children = [];
    this.classList = new FakeClassList();
    this.dataset = {};
    this.listeners = new Map();
  }

  addEventListener(name, listener) {
    this.listeners.set(name, listener);
  }

  appendChild(child) {
    this.children.push(child);
  }

  dispatch(name, event = {}) {
    const listener = this.listeners.get(name);
    if (listener) listener(event);
  }

  querySelectorAll() {
    return [];
  }

  set innerHTML(value) {
    if (value === '') this.children = [];
  }
}

test('copiar estilo de cartela conserva contenido, identidad y bloques del destino', () => {
  const stylesById = new Map([[
    'equipo',
    {
      id: 'equipo',
      cartela: { orientation: 'horizontal', columns: 1, line_spacing: 1.1 },
      block: { columns: 1, alignment: {}, typography: {} },
      title_typography: { page_header: {} },
    },
  ]]);
  const domain = globalThis.CreditosDomainStyles.createStyleDomain({
    baseStyleCartela: () => ({ orientation: 'vertical', columns: 1, line_spacing: 1.12 }),
    blockTypographyFields: [['role'], ['name']],
    effectiveStyleBlockForStyle: (style) => style && style.block ? style.block : {},
    effectiveStyleCartelaForStyle: (style) => style && style.cartela ? style.cartela : {},
    effectiveStyleTitleTypographyForStyle: (style) => style && style.title_typography ? style.title_typography : { page_header: {} },
    getStyleById: (id) => stylesById.get(id) || null,
    normalizeBoolean: (value, fallback) => value === undefined ? fallback : Boolean(value),
    normalizeColor: (value) => value,
    normalizeTextCapitalization: (value) => value || 'source',
    safeStyleId: (value) => String(value || ''),
    styleCartelaFields: ['orientation', 'columns', 'line_spacing'],
  });
  const source = {
    id: 'source',
    title: 'Origen',
    style_id: 'equipo',
    columns: 2,
    line_spacing: 1.35,
    block_style: { alignment: { role: 'right' } },
    title_typography: { page_header: { font_size: 52 } },
    animation: { in: { type: 'fade' } },
    pages: [{ id: 'source_page', source_refs: ['source_block'] }],
  };
  const target = {
    id: 'target',
    title: 'Destino',
    enabled: false,
    notes: 'No modificar',
    visual_order: 7,
    style_id: 'otro',
    columns: 3,
    pages: [{
      id: 'target_page',
      source_refs: ['target_block'],
      source_ref_settings: { target_block: { columns: 4 } },
    }],
  };
  const preserved = {
    id: target.id,
    title: target.title,
    enabled: target.enabled,
    notes: target.notes,
    visual_order: target.visual_order,
    pages: JSON.parse(JSON.stringify(target.pages)),
  };

  assert.equal(domain.applyCartelaStyleSettingsFromSource(target, source, source), true);
  assert.equal(target.style_id, 'equipo');
  assert.equal(target.columns, 2);
  assert.equal(target.line_spacing, 1.35);
  assert.deepEqual(target.block_style, { alignment: { role: 'right' } });
  assert.deepEqual(target.title_typography, { page_header: { font_size: 52 } });
  assert.deepEqual(target.animation, { in: { type: 'fade' } });
  assert.deepEqual({
    id: target.id,
    title: target.title,
    enabled: target.enabled,
    notes: target.notes,
    visual_order: target.visual_order,
    pages: target.pages,
  }, preserved);
});

test('arrastrar una cartela sobre otra solicita copiar el estilo en esa dirección', () => {
  const blockList = new FakeElement();
  const copied = [];
  const panel = globalThis.CreditosCartelaListPanel.createCartelaListPanel({
    copyCartelaStyle: (sourceId, targetId) => copied.push([sourceId, targetId]),
    documentRef: { createElement: () => new FakeElement() },
    els: { blockCount: new FakeElement(), blockList },
    escapeHtml: (value) => value,
    getCartelaDisplayName: (cartela) => cartela.title,
    getCartelaRefs: () => [],
    getEffectiveCartela: () => ({ orientation: 'vertical', columns: 1 }),
    getStyleById: () => null,
    getVisualCartelas: (cartelas) => cartelas,
    hasCartelaStyleOverrides: () => false,
    moveSelectedCartelaVisualOrder: () => {},
    selectCartela: () => {},
    selectedEpisode: () => null,
    state: {
      materials: [],
      selectedCartelaId: 'source',
      structure: {
        cartelas: [
          { id: 'source', title: 'Origen', enabled: false },
          { id: 'target', title: 'Destino', enabled: false },
        ],
      },
    },
  });

  panel.renderCartelaList();
  const source = blockList.children[0];
  const target = blockList.children[1];
  const dataTransfer = { setData() {} };
  source.dispatch('dragstart', { dataTransfer });
  target.dispatch('dragover', { dataTransfer, preventDefault() {} });
  target.dispatch('drop', { preventDefault() {} });

  assert.deepEqual(copied, [['source', 'target']]);
});

test('la confirmación copia solo ajustes de estilo y activa la cartela destino', async () => {
  const source = { id: 'source', title: 'Origen', pages: [] };
  const target = { id: 'target', title: 'Destino', pages: [] };
  const applied = [];
  let autosaves = 0;
  const state = {
    materials: [],
    selectedCartelaId: 'source',
    source: {},
    structure: { cartelas: [source, target] },
  };
  const commands = globalThis.CreditosAppCommands.createAppCommands({
    applyExplicitCartelaOverridesFromSource: (...args) => applied.push(args),
    buildCurrentRenderJson: () => ({ cartelas: [] }),
    nativeBridge: () => ({
      confirm: async () => ({ confirmed: true }),
    }),
    refreshPdfIfActive: () => {},
    renderCartelaList: () => {},
    renderEditor: () => {},
    renderPreview: () => {},
    scheduleAutosave: () => { autosaves += 1; },
    state,
    windowRef: { confirm: () => false },
  });

  await commands.copyCartelaStyle('source', 'target');

  assert.deepEqual(applied, [[target, source, source, { includeSourceRefs: false }]]);
  assert.equal(state.selectedCartelaId, 'target');
  assert.equal(autosaves, 1);
});
