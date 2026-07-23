const assert = require('node:assert/strict');
const test = require('node:test');

require('../../apps/renderer/appEpisodeLoader');

test('una revisión nueva del modelo reconstruye y persiste el episodio', async () => {
  const freshRender = { id: 'fresh-render' };
  const state = {
    databasePath: '/tmp/creditos.db',
    materials: [],
    selectedEpisodeId: 2,
    selectedProductionId: 1,
  };
  let persisted = 0;
  let previousStructureSeen = null;
  const loader = globalThis.CreditosAppEpisodeLoader.createAppEpisodeLoader({
    applyPreviewSettingsToUi: () => {},
    buildCurrentRenderJson: () => freshRender,
    createMaterialsFromSource: () => [{ id: 'block_1' }],
    createStructureFromSource: (_source, _materials, previousStructure) => {
      previousStructureSeen = previousStructure;
      return {
        cartelas: [{ id: 'cartela_1', style_id: previousStructure.cartelas[0].style_id }],
        preview_settings: {},
      };
    },
    currentImportModelId: () => 'rule_model_test',
    dbPost: async () => ({
      source: {
        source: 'credits.ods',
        import_rule_model: { id: 'rule_model_test', revision: 4 },
      },
      source_refresh: {
        status: 'refreshed',
        from_revision: 3,
        to_revision: 4,
      },
      structure: { cartelas: [{ id: 'cartela_1', style_id: 'equipo' }] },
      render: { id: 'stale-render' },
      styles: [],
    }),
    defaultPreviewSettings: () => ({}),
    loadStyleObjects: () => {},
    migrateStructure: (value) => value,
    normalizeReferenceVideo: (value) => value,
    normalizeSource: (value) => value,
    persistCurrentEpisode: async () => { persisted += 1; },
    rebuild: () => {},
    selectedProduction: () => ({}),
    selectedProductionHasStoredSettings: () => true,
    state,
    updateReferenceVideoStatus: () => {},
    updateXlsxStatus: () => {},
    windowRef: { alert: () => assert.fail('No debe avisar cuando la actualización funciona.') },
  });

  await loader.loadCurrentEpisode();

  assert.equal(state.render, freshRender);
  assert.equal(state.selectedCartelaId, 'cartela_1');
  assert.equal(previousStructureSeen.cartelas[0].style_id, 'equipo');
  assert.equal(state.structure.cartelas[0].style_id, 'equipo');
  assert.equal(persisted, 1);
  assert.equal(state.isLoadingEpisode, false);
});
