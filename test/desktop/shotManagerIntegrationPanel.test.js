const assert = require('node:assert/strict');
const test = require('node:test');

require('../../apps/renderer/domain/shotManagerAssociation');
require('../../apps/renderer/ui/panels/shotManagerIntegrationPanel');

class FakeElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.className = '';
    this.dataset = {};
    this.disabled = false;
    this.listeners = new Map();
    this.textContent = '';
    this._value = '';
  }

  addEventListener(name, listener) {
    this.listeners.set(name, listener);
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  get options() {
    return this.children;
  }

  get selectedIndex() {
    return this.children.findIndex((child) => child.value === this._value);
  }

  get value() {
    return this._value;
  }

  set value(value) {
    this._value = String(value || '');
  }

  set innerHTML(value) {
    if (value === '') this.children = [];
  }
}

function elements() {
  return {
    context: new FakeElement(),
    deleteButton: new FakeElement('button'),
    episodeSelect: new FakeElement('select'),
    localEpisodeSelect: Object.assign(new FakeElement('select'), { value: '22' }),
    productionSelect: new FakeElement('select'),
    refreshButton: new FakeElement('button'),
    saveButton: new FakeElement('button'),
    sourceEpisodeSelect: new FakeElement('select'),
    sourceProductionSelect: Object.assign(new FakeElement('select'), { value: '6' }),
    status: new FakeElement(),
    structureSelect: new FakeElement('select'),
  };
}

test('la carga del capítulo local no cancela el catálogo que está arrancando', async () => {
  let resolveStatus;
  const statusReady = new Promise((resolve) => {
    resolveStatus = resolve;
  });
  const els = elements();
  const panel = globalThis.CreditosShotManagerIntegrationPanel.createShotManagerIntegrationPanel({
    associationApi: {
      delete: async () => ({ ok: true }),
      read: async () => ({ ok: true, association: null }),
      write: async () => ({ ok: true }),
    },
    bridge: {
      getShotManagerStatus: () => statusReady,
      listShotManagerProductions: async () => ({
        ok: true,
        data: {
          productions: [{
            available: true,
            production: {
              code: 'TRZ',
              id: 'production-traz',
              name: 'Trazos Ocultos',
            },
          }],
        },
      }),
    },
    documentRef: {
      createElement: (tagName) => new FakeElement(tagName),
    },
    domain: globalThis.CreditosDomainShotManagerAssociation,
    els,
    windowRef: {
      queueMicrotask,
    },
  });

  const connectionLoad = panel.refreshConnection();
  const associationLoad = panel.loadLocalAssociation();
  resolveStatus({
    connected: true,
    apiVersion: 1,
    readOnly: true,
    service: 'VFX Shot Manager',
  });
  await Promise.all([connectionLoad, associationLoad]);

  assert.deepEqual(
    els.productionSelect.options.map((option) => option.value),
    ['', 'production-traz'],
  );
  assert.equal(
    els.status.textContent,
    'Este capítulo todavía no está asociado con Shot Manager.',
  );
});
