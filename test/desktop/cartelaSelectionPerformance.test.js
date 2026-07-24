const assert = require('node:assert/strict');
const test = require('node:test');

require('../../apps/renderer/appLifecycle');

test('seleccionar una cartela no reconstruye el render ni los paneles generales', () => {
  const calls = [];
  const animationFrames = [];
  const lifecycle = globalThis.CreditosAppLifecycle.createAppLifecycle({
    buildCurrentRenderJson: () => {
      calls.push('build-render');
      return {};
    },
    els: {},
    renderCartelaList: () => calls.push('cartela-list'),
    renderCartelaPreview: (options) => calls.push(['cartela-preview', options]),
    renderEditor: (options) => calls.push(['editor', options]),
    renderSettings: () => calls.push('settings'),
    state: { source: {}, structure: {}, materials: [] },
    windowRef: {
      requestAnimationFrame(callback) {
        animationFrames.push(callback);
      },
    },
  });

  lifecycle.rebuild({ selectionOnly: true });

  assert.deepEqual(calls, [
    'cartela-list',
    ['cartela-preview', { deferred: true }],
  ]);
  assert.equal(animationFrames.length, 1);

  animationFrames[0]();
  assert.deepEqual(calls[2], ['editor', { renderPreview: false }]);
  assert.equal(calls.includes('build-render'), false);
  assert.equal(calls.includes('settings'), false);
});

test('al salir de Parser guarda la regla antes de recargar el capítulo', async () => {
  const calls = [];
  const tabButtons = ['parserLab', 'structure'].map((tab) => ({
    dataset: { tab },
    classList: { toggle() {} },
  }));
  const tabPanes = ['parserLabPane', 'structurePane'].map((id) => ({
    id,
    classList: { toggle() {} },
  }));
  const lifecycle = globalThis.CreditosAppLifecycle.createAppLifecycle({
    documentRef: {
      getElementById(id) {
        return tabPanes.find((pane) => pane.id === id) || null;
      },
    },
    els: { tabButtons, tabPanes },
    reloadCurrentEpisode: async () => calls.push('recargar-capítulo'),
    renderCartelaPreview: () => calls.push('mostrar-cartelas'),
    state: { activeTab: 'parserLab' },
    windowRef: {
      CreditosParserLabUi: {
        instance: {
          flushPendingBlockEdit: async () => calls.push('guardar-parser'),
        },
      },
      alert: (message) => assert.fail(message),
      requestAnimationFrame(callback) {
        callback();
      },
    },
  });

  await lifecycle.setActiveTab('structure');

  assert.deepEqual(calls, [
    'mostrar-cartelas',
    'mostrar-cartelas',
    'guardar-parser',
    'recargar-capítulo',
  ]);
});
