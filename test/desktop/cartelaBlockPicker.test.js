const assert = require('node:assert/strict');
const test = require('node:test');

require('../../apps/renderer/appCartelaEditor');

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.listeners = new Map();
    this.parentNode = null;
    this.className = '';
    this.textContent = '';
    this.checked = false;
    this.disabled = false;
    this.value = '';
    this.classList = {
      toggle: (name, enabled) => {
        const classes = new Set(this.className.split(/\s+/).filter(Boolean));
        if (enabled) classes.add(name);
        else classes.delete(name);
        this.className = [...classes].join(' ');
      },
    };
  }

  append(...nodes) {
    nodes.forEach((node) => this.appendChild(node));
  }

  appendChild(node) {
    node.parentNode = this;
    this.children.push(node);
    return node;
  }

  addEventListener(name, listener) {
    this.listeners.set(name, listener);
  }

  dispatch(name) {
    const listener = this.listeners.get(name);
    return listener ? listener({ target: this, preventDefault() {} }) : undefined;
  }

  click() {
    return this.dispatch('click');
  }

  focus() {}

  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
    this.parentNode = null;
  }

  setAttribute() {}
}

class FakeDocument {
  constructor() {
    this.body = new FakeElement('body');
  }

  createElement(tagName) {
    return new FakeElement(tagName);
  }
}

function findAll(root, predicate, matches = []) {
  if (predicate(root)) matches.push(root);
  (root.children || []).forEach((child) => findAll(child, predicate, matches));
  return matches;
}

test('el selector de bloques no modifica la cartela hasta aceptar y confirmar', async () => {
  const documentRef = new FakeDocument();
  const current = { id: 'cartela_1', pages: [{ source_refs: ['block_a'] }] };
  const other = { id: 'cartela_2', pages: [{ source_refs: ['block_b'] }] };
  const moved = [];
  let rebuilds = 0;
  let confirmations = 0;
  const editor = globalThis.CreditosAppCartelaEditor.createAppCartelaEditor({
    documentRef,
    moveMaterialToCartela: (_structure, materialId, cartela) => moved.push([materialId, cartela.id]),
    nativeBridge: () => ({
      confirm: async () => {
        confirmations += 1;
        return { confirmed: true };
      },
    }),
    rebuild: () => { rebuilds += 1; },
    state: {
      materials: [
        { id: 'block_a', title: 'Bloque actual' },
        { id: 'block_b', title: 'Bloque disponible' },
      ],
      structure: { cartelas: [current, other] },
    },
    windowRef: { confirm: () => assert.fail('Debe usar la confirmación nativa') },
  });

  const controls = editor.renderSourceRefControls(current);
  const openButton = findAll(controls, (node) => node.tagName === 'BUTTON')[0];
  assert.equal(openButton.textContent, 'Seleccionar bloques…');

  openButton.click();
  let overlay = documentRef.body.children[0];
  const cancelButton = findAll(overlay, (node) => node.tagName === 'BUTTON' && node.textContent === 'Cancelar')[0];
  const included = findAll(overlay, (node) => String(node.className).includes('included'))[0];
  assert.ok(included);
  assert.equal(findAll(included, (node) => node.tagName === 'INPUT')[0].disabled, true);
  cancelButton.click();
  assert.deepEqual(moved, []);
  assert.equal(rebuilds, 0);
  assert.equal(documentRef.body.children.length, 0);

  openButton.click();
  overlay = documentRef.body.children[0];
  const checkboxes = findAll(overlay, (node) => node.tagName === 'INPUT');
  const availableCheckbox = checkboxes.find((checkbox) => checkbox.value === 'block_b');
  availableCheckbox.checked = true;
  availableCheckbox.dispatch('change');
  const acceptButton = findAll(overlay, (node) => node.tagName === 'BUTTON' && node.textContent === 'Aceptar')[0];
  assert.equal(acceptButton.disabled, false);
  await acceptButton.click();

  assert.equal(confirmations, 1);
  assert.deepEqual(moved, [['block_b', 'cartela_1']]);
  assert.equal(rebuilds, 1);
  assert.equal(documentRef.body.children.length, 0);
});
