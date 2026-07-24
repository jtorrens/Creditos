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
    dispatch(type) { if (listeners[type]) listeners[type](); },
    setAttribute() {},
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

test('el editor de materiales muestra el repartidor Cargo/Nombre', () => {
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
    sourceRefIsLocked: () => false,
    state: { materials: [], structure: { overrides: {} } },
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

  const control = findByClass(panel, 'material-column-split-control');
  const row = findByClass(panel, 'preview-credit');
  const fields = findByClass(panel, 'preview-credit-fields');
  assert.ok(control);
  assert.ok(row.className.includes('horizontal'));
  assert.ok(fields);

  const slider = control.children.find((child) => child.tagName === 'INPUT');
  slider.value = '60';
  slider.dispatch('input');
  assert.equal(panel.style.values['--material-role-column-width'], '60%');
});
