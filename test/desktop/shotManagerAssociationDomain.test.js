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
          slug: 'prev',
          anchor: 'EPISODE',
          parentFolder: null,
        },
        {
          id: 'credits-work',
          type: 'WORK_AREA',
          name: 'Créditos',
          folderName: 'credits',
          slug: 'cred',
          anchor: 'EPISODE',
          parentFolder: null,
        },
      ],
    },
    seasons: [{ id: 'season-1', code: 'S01' }],
    episodes: [{
      id: 'episode-1',
      seasonId: 'season-1',
      code: 'E01',
      title: 'Piloto',
      archivedAt: null,
    }],
  };
}

test('presenta capítulos y estructura conservando sus IDs estables', () => {
  const value = snapshot();

  assert.deepEqual(domain.episodeOptions(value), [{
    id: 'episode-1',
    label: 'S01 · E01 · Piloto',
    seasonId: 'season-1',
  }]);
  assert.deepEqual(
    domain.structureEntryOptions(value).map((entry) => entry.id),
    ['credits-work', 'preview-output'],
  );
});

test('una asociación solo es válida cuando todos los IDs siguen existiendo', () => {
  const value = snapshot();
  const valid = {
    shotManagerProductionId: 'production-1',
    seasonId: 'season-1',
    episodeId: 'episode-1',
    structureEntryId: 'credits-work',
  };

  assert.equal(domain.validateStoredSelection(value, valid).valid, true);
  assert.equal(domain.validateStoredSelection(value, {
    ...valid,
    episodeId: 'episode-renamed-by-id',
  }).valid, false);
  assert.equal(domain.validateStoredSelection(value, {
    ...valid,
    structureEntryId: 'missing',
  }).valid, false);
});
