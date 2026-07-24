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
    const listeners = this.listeners.get(name) || [];
    listeners.push(listener);
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
    for (const listener of this.listeners.get(event.type) || []) listener(event);
    return true;
  }
}

function elements() {
  const sourceProductionSelect = new FakeElement('select');
  const localProduction = new FakeElement('option');
  localProduction.value = '6';
  localProduction.dataset.productionType = 'SERIES';
  sourceProductionSelect.appendChild(localProduction);
  sourceProductionSelect.value = '6';
  return {
    context: new FakeElement(),
    createButton: new FakeElement('button'),
    deleteButton: new FakeElement('button'),
    productionSelect: new FakeElement('select'),
    refreshButton: new FakeElement('button'),
    saveButton: new FakeElement('button'),
    sourceProductionSelect,
    status: new FakeElement(),
    structureSelect: new FakeElement('select'),
  };
}

function remoteSnapshot() {
  return {
    location: { rootPath: '/production' },
    production: {
      id: 'production-traz',
      code: 'TRZ',
      name: 'Trazos Ocultos',
      productionType: 'SERIES',
      structureEntries: [{
        id: 'credits-render',
        type: 'OUTPUT',
        name: 'Render final',
        folderName: 'renders',
      }],
    },
    seasons: [{
      id: 'season-1',
      number: 1,
      code: 'S1',
      archivedAt: null,
    }],
    episodes: [{
      id: 'episode-1',
      seasonId: 'season-1',
      number: 1,
      code: 'E01',
      archivedAt: null,
    }],
  };
}

function windowStub(confirmResult = true) {
  return {
    confirm: () => confirmResult,
    CustomEvent: class {
      constructor(type, options) {
        this.type = type;
        this.detail = options.detail;
      }
    },
    dispatchEvent: () => true,
    MutationObserver: class {
      observe() {}
    },
    queueMicrotask,
  };
}

test('conserva el catálogo si la asociación local termina mientras conecta', async () => {
  let resolveStatus;
  const statusReady = new Promise((resolve) => {
    resolveStatus = resolve;
  });
  const els = elements();
  const panel = globalThis.CreditosShotManagerIntegrationPanel.createShotManagerIntegrationPanel({
    associationApi: {
      create: async () => ({ ok: true }),
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
    windowRef: windowStub(),
  });

  const connectionLoad = panel.refreshConnection();
  const associationLoad = panel.loadLocalAssociation();
  resolveStatus({ connected: true, apiVersion: 1, readOnly: true });
  await Promise.all([connectionLoad, associationLoad]);

  assert.deepEqual(
    els.productionSelect.options.map((option) => option.value),
    ['', 'production-traz'],
  );
  assert.equal(
    els.status.textContent,
    'Producción independiente. Puedes convertirla en gobernada o crear otra desde Shot Manager.',
  );
});

test('envía el snapshot y exige confirmación antes de borrar contenido', async () => {
  const els = elements();
  const snapshot = remoteSnapshot();
  const writes = [];
  const panel = globalThis.CreditosShotManagerIntegrationPanel.createShotManagerIntegrationPanel({
    associationApi: {
      create: async () => ({ ok: true }),
      delete: async () => ({ ok: true }),
      read: async () => ({ ok: true, association: null }),
      write: async (payload) => {
        writes.push(payload);
        if (!payload.confirmDestructive) {
          return {
            ok: true,
            confirmationRequired: true,
            plan: {
              contentDeletions: [{ code: 'E06', name: 'Episodio 06' }],
            },
          };
        }
        return {
          ok: true,
          confirmationRequired: false,
          association: { shotManagerProductionId: 'production-traz' },
        };
      },
    },
    bridge: {
      getShotManagerStatus: async () => ({ connected: true, readOnly: true }),
      listShotManagerProductions: async () => ({
        ok: true,
        data: {
          productions: [{
            available: true,
            production: snapshot.production,
          }],
        },
      }),
      getShotManagerProduction: async () => ({ ok: true, data: snapshot }),
    },
    documentRef: {
      createElement: (tagName) => new FakeElement(tagName),
    },
    domain: globalThis.CreditosDomainShotManagerAssociation,
    els,
    windowRef: windowStub(true),
  });
  await panel.initialize();
  els.productionSelect.value = 'production-traz';
  els.productionSelect.dispatchEvent({ type: 'change' });
  await Promise.resolve();
  await Promise.resolve();
  els.structureSelect.value = 'credits-render';

  await panel.saveAssociation(false);

  assert.equal(writes.length, 2);
  assert.equal(writes[0].snapshot, snapshot);
  assert.deepEqual(writes[0].outputBindings, {
    FINAL_RENDER: 'credits-render',
  });
  assert.equal(writes[0].confirmDestructive, false);
  assert.equal(writes[1].confirmDestructive, true);
  assert.equal(els.status.textContent, 'Producción gobernada y jerarquía sincronizada.');
});
