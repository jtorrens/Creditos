const assert = require('node:assert/strict');
const test = require('node:test');

require('../../apps/renderer/appPageExport');

function createResolver(production, episode = null) {
  return globalThis.CreditosAppPageExport.createAppPageExport({
    joinPath: (...segments) => segments.filter(Boolean).join('/'),
    readLocalPreference: () => '/local-renders',
    selectedEpisode: () => episode,
    selectedProduction: () => production,
    storageKeys: { renderDir: 'render-dir' },
  }).resolveMovDestination;
}

test('una producción independiente conserva el selector manual', async () => {
  let chosen = null;
  const resolve = createResolver({
    governance_mode: 'INDEPENDENT',
  });

  const result = await resolve({
    chooseMovPath: async (payload) => {
      chosen = payload;
      return { canceled: false, filePath: '/manual/output.mov' };
    },
  }, 'creditos', 'prores_4444');

  assert.equal(chosen.defaultPath, '/local-renders/creditos.mov');
  assert.equal(result.filePath, '/manual/output.mov');
});

test('una serie gobernada usa el destino oficial y nunca abre el selector manual', async () => {
  let manualSelections = 0;
  let request = null;
  const resolve = createResolver({
    governance_mode: 'SHOT_MANAGER',
    production_type: 'SERIES',
    shot_manager_production_id: 'production-1',
    final_render_structure_entry_id: 'credits-render',
  }, {
    shot_manager_episode_id: 'episode-1',
  });

  const result = await resolve({
    chooseMovPath: async () => {
      manualSelections += 1;
      return { canceled: true };
    },
    confirm: async () => ({ confirmed: true }),
    resolveShotManagerOutput: async (payload) => {
      request = payload;
      return {
        ok: true,
        data: {
          version: 2,
          filePath: '/official/TRZ_S01_E01_cred_v002.mov',
        },
      };
    },
  }, 'ignored', 'prores_4444');

  assert.deepEqual(request, {
    productionId: 'production-1',
    artifactKind: 'FINAL_RENDER',
    structureEntryId: 'credits-render',
    episodeId: 'episode-1',
    extension: 'mov',
  });
  assert.equal(manualSelections, 0);
  assert.deepEqual(result, {
    canceled: false,
    filePath: '/official/TRZ_S01_E01_cred_v002.mov',
    preventOverwrite: true,
  });
});

test('un fallo de Shot Manager detiene el render gobernado sin fallback local', async () => {
  let manualSelections = 0;
  const resolve = createResolver({
    governance_mode: 'SHOT_MANAGER',
    production_type: 'FILM',
    shot_manager_production_id: 'production-1',
    final_render_structure_entry_id: 'credits-render',
  });

  await assert.rejects(
    resolve({
      chooseMovPath: async () => {
        manualSelections += 1;
        return { canceled: false, filePath: '/manual/output.mov' };
      },
      resolveShotManagerOutput: async () => ({
        ok: false,
        error: { message: 'Shot Manager no está abierto.' },
      }),
    }, 'ignored', 'prores_4444'),
    /no está abierto/,
  );
  assert.equal(manualSelections, 0);
});
