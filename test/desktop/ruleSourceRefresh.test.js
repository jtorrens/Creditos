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
  let migrationOptionsSeen = null;
  const loader = globalThis.CreditosAppEpisodeLoader.createAppEpisodeLoader({
    applyPreviewSettingsToUi: () => {},
    buildCurrentRenderJson: () => freshRender,
    createMaterialsFromSource: () => [{ id: 'new_material', group: 'new_group' }],
    createStructureFromSource: (_source, _materials, previousStructure, migrationOptions) => {
      previousStructureSeen = previousStructure;
      migrationOptionsSeen = migrationOptions;
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
        added_block_groups: ['new_group'],
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
  assert.deepEqual(migrationOptionsSeen, { detached_material_ids: ['new_material'] });
  assert.equal(persisted, 1);
  assert.equal(state.isLoadingEpisode, false);
});

test('reconstruye y persiste el render cuando cambian los saltos procedentes del modelo', async () => {
  const freshRender = { id: 'fresh-page-break-render' };
  const state = {
    databasePath: '/tmp/creditos.db',
    materials: [],
    selectedEpisodeId: 2,
    selectedProductionId: 1,
  };
  let persisted = 0;
  const loader = globalThis.CreditosAppEpisodeLoader.createAppEpisodeLoader({
    applyPreviewSettingsToUi: () => {},
    buildCurrentRenderJson: () => freshRender,
    createMaterialsFromSource: () => [{ id: 'team' }],
    createStructureFromSource: (_source, _materials, previousStructure) => ({
      ...previousStructure,
      page_breaks: { team: ['item_1', 'item_2'] },
      preview_settings: {},
    }),
    currentImportModelId: () => 'rule_model_test',
    dbPost: async () => ({
      source: { source: 'credits.ods' },
      source_refresh: { status: 'current' },
      structure: {
        cartelas: [{ id: 'cartela_1' }],
        page_breaks: { team: ['item_1'] },
      },
      render: { id: 'stale-page-break-render' },
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
    windowRef: { alert: () => assert.fail('No debe mostrar una alerta.') },
  });

  await loader.loadCurrentEpisode();

  assert.equal(state.render, freshRender);
  assert.deepEqual(state.structure.page_breaks.team, ['item_1', 'item_2']);
  assert.equal(persisted, 1);
});
