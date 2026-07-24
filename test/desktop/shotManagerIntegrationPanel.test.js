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
    const capture = arguments[2] === true;
    const listeners = this.listeners.get(name) || [];
    listeners.push({ capture, listener });
    this.listeners.set(name, listeners);
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

  dispatchEvent(event) {
    const listeners = this.listeners.get(event.type) || [];
    for (const entry of [
      ...listeners.filter((candidate) => candidate.capture),
      ...listeners.filter((candidate) => !candidate.capture),
    ]) {
      entry.listener(event);
      if (event.immediatePropagationStopped) break;
    }
    return !event.defaultPrevented;
  }
}

class FakeEvent {
  constructor(type) {
    this.type = type;
    this.defaultPrevented = false;
    this.immediatePropagationStopped = false;
  }

  preventDefault() {
    this.defaultPrevented = true;
  }

  stopImmediatePropagation() {
    this.immediatePropagationStopped = true;
  }
}

function elements(options = {}) {
  const sourceEpisodeSelect = new FakeElement('select');
  for (const [value, text] of options.localEpisodes || []) {
    const option = new FakeElement('option');
    option.value = value;
    option.textContent = text;
    sourceEpisodeSelect.appendChild(option);
  }
  sourceEpisodeSelect.value = options.localEpisodeId || '';
  return {
    context: new FakeElement(),
    deleteButton: new FakeElement('button'),
    episodeSelect: new FakeElement('select'),
    localEpisodeSelect: Object.assign(
      new FakeElement('select'),
      { value: options.localEpisodeId || '22' },
    ),
    productionSelect: new FakeElement('select'),
    refreshButton: new FakeElement('button'),
    saveButton: new FakeElement('button'),
    sourceEpisodeSelect,
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

test('las dos pantallas comparten capítulo y protegen cambios sin guardar', async () => {
  let confirmResult = false;
  let confirmations = 0;
  let cartelasChanges = 0;
  const els = elements({
    localEpisodeId: '22',
    localEpisodes: [
      ['22', 'Episodio 01'],
      ['23', 'Episodio 02'],
    ],
  });
  els.sourceEpisodeSelect.addEventListener('change', () => {
    cartelasChanges += 1;
  });
  const panel = globalThis.CreditosShotManagerIntegrationPanel.createShotManagerIntegrationPanel({
    associationApi: {
      delete: async () => ({ ok: true }),
      read: async () => ({ ok: true, association: null }),
      write: async () => ({ ok: true }),
    },
    bridge: {
      getShotManagerStatus: async () => ({
        connected: false,
        error: {
          code: 'SHOT_MANAGER_NOT_RUNNING',
          message: 'Abre Shot Manager.',
        },
      }),
    },
    documentRef: {
      createElement: (tagName) => new FakeElement(tagName),
    },
    domain: globalThis.CreditosDomainShotManagerAssociation,
    els,
    windowRef: {
      confirm: () => {
        confirmations += 1;
        return confirmResult;
      },
      Event: FakeEvent,
      MutationObserver: class {
        observe() {}
      },
      queueMicrotask,
    },
  });
  await panel.initialize();

  els.structureSelect.dispatchEvent(new FakeEvent('change'));
  els.localEpisodeSelect.value = '23';
  els.localEpisodeSelect.dispatchEvent(new FakeEvent('change'));

  assert.equal(confirmations, 1);
  assert.equal(els.localEpisodeSelect.value, '22');
  assert.equal(els.sourceEpisodeSelect.value, '22');
  assert.equal(cartelasChanges, 0);

  confirmResult = true;
  els.localEpisodeSelect.value = '23';
  els.localEpisodeSelect.dispatchEvent(new FakeEvent('change'));
  await Promise.resolve();

  assert.equal(confirmations, 2);
  assert.equal(els.sourceEpisodeSelect.value, '23');
  assert.equal(cartelasChanges, 1);

  els.structureSelect.dispatchEvent(new FakeEvent('change'));
  confirmResult = false;
  els.sourceEpisodeSelect.value = '22';
  els.sourceEpisodeSelect.dispatchEvent(new FakeEvent('change'));

  assert.equal(confirmations, 3);
  assert.equal(els.sourceEpisodeSelect.value, '23');
  assert.equal(cartelasChanges, 1);
});
