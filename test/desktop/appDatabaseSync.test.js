const assert = require('node:assert/strict');
const test = require('node:test');

require('../../apps/renderer/appDatabaseSync');

class FakeClassList {
  toggle() {}
}

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.classList = new FakeClassList();
    this.listeners = new Map();
    this.parentNode = null;
    this.textContent = '';
  }

  addEventListener(name, listener) {
    this.listeners.set(name, listener);
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  click() {
    const listener = this.listeners.get('click');
    if (listener) listener();
  }

  focus() {}

  remove() {
    if (!this.parentNode) return;
    const index = this.parentNode.children.indexOf(this);
    if (index >= 0) this.parentNode.children.splice(index, 1);
    this.parentNode = null;
  }

  removeAttribute() {}

  setAttribute() {}

  set innerHTML(value) {
    if (value === '') {
      for (const child of this.children) child.parentNode = null;
      this.children = [];
    }
  }
}

class FakeDocument {
  constructor() {
    this.body = new FakeElement('body');
  }

  createElement(tagName) {
    return new FakeElement(tagName);
  }
}

function findByTag(root, tagName) {
  if (root.tagName === tagName.toUpperCase()) return root;
  for (const child of root.children) {
    const match = findByTag(child, tagName);
    if (match) return match;
  }
  return null;
}

async function waitUntil(predicate) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const result = predicate();
    if (result) return result;
    await new Promise((resolve) => setTimeout(resolve, 2));
  }
  throw new Error('La condición de prueba no se alcanzó a tiempo.');
}

function testWindow() {
  return {
    setTimeout(callback, delay) {
      return setTimeout(callback, delay === 450 ? 0 : delay);
    },
  };
}

test('el arranque muestra por separado la apertura local y la consulta a GitHub', async () => {
  const documentRef = new FakeDocument();
  let resolveDatabase;
  let resolveRemote;
  const databaseReady = new Promise((resolve) => { resolveDatabase = resolve; });
  const remoteReady = new Promise((resolve) => { resolveRemote = resolve; });
  const sync = globalThis.CreditosAppDatabaseSync.createAppDatabaseSync({
    documentRef,
    els: {},
    initializeDatabase: () => databaseReady,
    nativeBridge: () => ({ getDatabaseSyncStatus: () => remoteReady }),
    state: {},
    windowRef: testWindow(),
  });

  const initialization = sync.initializeDatabaseWithSyncCheck();
  let title = findByTag(documentRef.body, 'h2');
  let message = findByTag(documentRef.body, 'p');
  assert.equal(title.textContent, 'Abriendo base de datos local');
  assert.match(message.textContent, /data\/creditos\.db/);

  resolveDatabase();
  await waitUntil(() => {
    title = findByTag(documentRef.body, 'h2');
    return title && title.textContent === 'Consultando GitHub';
  });
  message = findByTag(documentRef.body, 'p');
  assert.match(message.textContent, /base de datos local ya está abierta/);
  assert.match(message.textContent, /origin\/main/);

  resolveRemote({ available: true, statusKind: 'synced' });
  await initialization;
  assert.equal(documentRef.body.children.length, 0);
});

test('un timeout remoto permite continuar y confirma que la DB local sigue abierta', async () => {
  const documentRef = new FakeDocument();
  const timeoutMessage = 'GitHub no respondio en 20 segundos. Se cancelo la comprobacion remota.';
  const sync = globalThis.CreditosAppDatabaseSync.createAppDatabaseSync({
    documentRef,
    els: {},
    initializeDatabase: async () => {},
    nativeBridge: () => ({
      getDatabaseSyncStatus: async () => ({
        available: true,
        error: timeoutMessage,
        errorCode: 'GIT_REMOTE_TIMEOUT',
        message: timeoutMessage,
        statusKind: 'error',
      }),
    }),
    state: {},
    windowRef: testWindow(),
  });

  const initialization = sync.initializeDatabaseWithSyncCheck();
  const button = await waitUntil(() => findByTag(documentRef.body, 'button'));
  const title = findByTag(documentRef.body, 'h2');
  const message = findByTag(documentRef.body, 'p');
  assert.equal(title.textContent, 'No se pudo consultar GitHub');
  assert.match(message.textContent, /base de datos local está abierta y no se ha modificado/);
  assert.equal(button.textContent, 'Continuar');

  button.click();
  await initialization;
  assert.equal(documentRef.body.children.length, 0);
});

test('una bajada explícita no se bloquea por la consulta remota acotada', async () => {
  let forceDownloadCount = 0;
  let statusRefreshCount = 0;
  const state = {};
  const sync = globalThis.CreditosAppDatabaseSync.createAppDatabaseSync({
    documentRef: new FakeDocument(),
    els: {},
    initializeDatabase: async () => {},
    nativeBridge: () => ({
      forceDatabaseFromGitHub: async () => {
        forceDownloadCount += 1;
        return { available: true, statusKind: 'synced', syncTarget: 'origin/main' };
      },
      getDatabaseSyncStatus: async () => {
        statusRefreshCount += 1;
        return {
          available: true,
          error: 'GitHub no respondió a la consulta acotada.',
          statusKind: 'error',
        };
      },
    }),
    state,
    windowRef: testWindow(),
  });

  const actionStatus = await sync.applyDatabaseSyncAction('download');

  assert.equal(forceDownloadCount, 1);
  assert.equal(statusRefreshCount, 1);
  assert.equal(actionStatus.statusKind, 'synced');
  assert.equal(state.databaseSyncStatus.statusKind, 'error');
});
