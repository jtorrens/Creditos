const assert = require('node:assert/strict');
const test = require('node:test');

require('../../apps/renderer/domain/shotManagerAssociation');

const domain = globalThis.CreditosDomainShotManagerAssociation;

function snapshot() {
  return {
    location: { rootPath: '/production' },
    production: {
      id: 'production-1',
      productionType: 'SERIES',
      structureEntries: [
        {
          id: 'preview-output',
          type: 'OUTPUT',
          name: 'Preview',
          folderName: 'previews',
        },
        {
          id: 'credits-work',
          type: 'WORK_AREA',
          name: 'Créditos',
          folderName: 'credits',
        },
      ],
    },
    seasons: [{
      id: 'season-1',
      number: 1,
      code: 'S01',
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

function association() {
  return {
    shotManagerProductionId: 'production-1',
    structureEntryId: 'credits-work',
    localHierarchy: {
      productionType: 'SERIES',
      governanceMode: 'SHOT_MANAGER',
      seasons: [{
        shotManagerSeasonId: 'season-1',
        number: 1,
        code: 'S01',
      }],
      episodes: [{
        shotManagerEpisodeId: 'episode-1',
        shotManagerSeasonId: 'season-1',
        number: 1,
        code: 'E01',
      }],
    },
  };
}

test('ordena los elementos de estructura conservando sus IDs estables', () => {
  assert.deepEqual(
    domain.structureEntryOptions(snapshot()).map((entry) => entry.id),
    ['credits-work', 'preview-output'],
  );
});

test('valida producción, tipo y elemento de estructura', () => {
  const value = snapshot();
  const saved = association();

  assert.equal(
    domain.validateStoredSelection(value, saved, 'SERIES').valid,
    true,
  );
  assert.equal(
    domain.validateStoredSelection(value, saved, 'FILM').valid,
    false,
  );
  assert.equal(domain.validateStoredSelection(value, {
    ...saved,
    structureEntryId: 'missing',
  }, 'SERIES').valid, false);
});

test('detecta cambios en la jerarquía oficial', () => {
  const value = snapshot();
  const saved = association();

  assert.equal(domain.hierarchyComparison(value, saved).inSync, true);
  value.episodes[0].code = 'E001';
  assert.equal(domain.hierarchyComparison(value, saved).inSync, false);
});
