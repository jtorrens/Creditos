const assert = require('node:assert/strict');
const test = require('node:test');

require('../../apps/renderer/appMaterialEditor');

function element(tagName) {
  const listeners = {};
  return {
    append(...nodes) { this.children.push(...nodes); },
    appendChild(node) { this.children.push(node); return node; },
    children: [],
    className: '',
    addEventListener(type, handler) { listeners[type] = handler; },
    dataset: {},
    dispatch(type, event = {}) { if (listeners[type]) listeners[type](event); },
    querySelectorAll(selector) {
      const className = selector.startsWith('.') ? selector.slice(1) : '';
      const matches = [];
      const visit = (node) => {
        if (String(node.className || '').split(/\s+/).includes(className)) matches.push(node);
        (node.children || []).forEach(visit);
      };
      visit(this);
      return matches;
    },
    setAttribute(name, value) { this[name] = value; },
    style: {
      values: {},
      setProperty(name, value) { this.values[name] = value; },
    },
    tagName: tagName.toUpperCase(),
    textContent: '',
    type: '',
    value: '',
  };
}

function findByClass(node, className) {
  if (String(node.className || '').split(/\s+/).includes(className)) return node;
  for (const child of node.children || []) {
    const match = findByClass(child, className);
    if (match) return match;
  }
  return null;
}

test('el editor de materiales permite arrastrar las columnas Fila/Cargo/Nombre', () => {
  let autosaves = 0;
  const state = { materials: [], structure: { overrides: {} } };
  const editor = globalThis.CreditosAppMaterialEditor.createAppMaterialEditor({
    documentRef: { createElement: element },
    ensureCartelaSourceRefSettings: () => ({}),
    escapeHtml: (value) => String(value),
    getMaterialContentItems: (material) => material.items,
    getSelectedCartela: () => ({ id: 'cartela_1', orientation: 'vertical' }),
    groupMusicLicenseThemes: () => [],
    hasEditableOverride: () => false,
    inputRow: () => element('div'),
    makePreviewInput: () => element('textarea'),
    normalizeFrozenMaterial: (value) => value,
    rebuild: () => {},
    resetEditableOverrides: () => {},
    scheduleAutosave: () => { autosaves += 1; },
    sourceRefIsLocked: () => false,
    state,
  });
  const panel = editor.renderMaterialEditor({
    id: 'team',
    title: 'Jefes de Equipo',
    type: 'rule_block',
    items: [{
      id: 'credit_1',
      kind: 'credit',
      role: 'Dirección de Fotografía',
      row: 2,
      names: [{ id: 'name_1', name: 'Alfonso Segura' }],
    }],
  }, 'team');

  const control = findByClass(panel, 'material-table-header');
  const row = findByClass(panel, 'preview-credit');
  assert.ok(control);
  assert.ok(row.className.includes('horizontal'));
  assert.deepEqual(control.children.slice(0, 3).map((child) => child.textContent), ['Fila', 'Cargo', 'Nombre']);
  assert.equal(control.children.some((child) => child.tagName === 'INPUT'), false);
  const resizers = control.querySelectorAll('.material-column-resizer');
  assert.equal(resizers.length, 2);
  assert.equal(findByClass(row, 'preview-credit-fields'), null);
  assert.deepEqual(row.children.map((child) => child.className), [
    'row-label',
    'preview-role',
    'preview-names',
  ]);

  resizers[1].dispatch('keydown', {
    key: 'ArrowRight',
    preventDefault() {},
  });
  assert.equal(panel.style.values['--material-role-column-width'], '44%');
  assert.deepEqual(state.structure.editor_column_widths.team, {
    row_percent: 9,
    role_percent: 44,
  });
  assert.equal(autosaves, 1);
});
