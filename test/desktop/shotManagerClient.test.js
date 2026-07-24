const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createShotManagerClient,
  validateConnection,
} = require('../../apps/desktop/native/shotManagerClient');

const TOKEN = 'a'.repeat(64);
const CONNECTION = {
  version: 1,
  apiVersion: 1,
  baseUrl: 'http://127.0.0.1:43123/api/v1',
  token: TOKEN,
  updatedAt: '2026-07-24T12:00:00.000Z',
};

function response(body, ok = true) {
  return {
    ok,
    async json() {
      return body;
    },
  };
}

test('acepta únicamente el discovery actual, local y versionado', () => {
  assert.equal(validateConnection(CONNECTION).baseUrl, CONNECTION.baseUrl);
  assert.throws(
    () => validateConnection({ ...CONNECTION, baseUrl: 'http://localhost:43123/api/v1' }),
    (error) => error.code === 'DISCOVERY_INVALID',
  );
  assert.throws(
    () => validateConnection({ ...CONNECTION, apiVersion: 2 }),
    (error) => error.code === 'API_VERSION_UNSUPPORTED',
  );
});

test('informa que Shot Manager no está abierto sin adivinar puertos', async () => {
  let fetchCount = 0;
  const client = createShotManagerClient({
    fetchImpl: async () => {
      fetchCount += 1;
      throw new Error('No debería consultar la red.');
    },
    getAppDataPath: () => '/app-data',
    readFile: async () => {
      const error = new Error('missing');
      error.code = 'ENOENT';
      throw error;
    },
  });

  const status = await client.getStatus();

  assert.equal(status.connected, false);
  assert.equal(status.error.code, 'SHOT_MANAGER_NOT_RUNNING');
  assert.equal(fetchCount, 0);
  assert.match(client.discoveryPath(), /VFX Shot Manager[\\/]integration-api\.json$/);
});

test('lee el catálogo con bearer en main y no devuelve la credencial al renderer', async () => {
  let request = null;
  const client = createShotManagerClient({
    fetchImpl: async (url, options) => {
      request = { url, options };
      return response({
        apiVersion: 1,
        data: {
          productions: [{
            rootPath: '/production',
            lastOpenedAt: '2026-07-24T12:00:00.000Z',
            available: true,
            production: { id: 'prod-1', name: 'Trazos' },
            error: null,
          }],
        },
      });
    },
    getAppDataPath: () => '/app-data',
    readFile: async () => JSON.stringify(CONNECTION),
  });

  const result = await client.listProductions();

  assert.equal(result.ok, true);
  assert.equal(request.url, `${CONNECTION.baseUrl}/productions`);
  assert.equal(request.options.headers.Authorization, `Bearer ${TOKEN}`);
  assert.equal(JSON.stringify(result).includes(TOKEN), false);
});

test('rechaza snapshots que no correspondan al ID solicitado', async () => {
  const client = createShotManagerClient({
    fetchImpl: async () => response({
      apiVersion: 1,
      data: {
        location: { rootPath: '/production' },
        production: {
          id: 'another-production',
          structureEntries: [],
        },
        seasons: [],
        episodes: [],
        sequences: [],
        shots: [],
      },
    }),
    getAppDataPath: () => '/app-data',
    readFile: async () => JSON.stringify(CONNECTION),
  });

  const result = await client.getProduction('prod-1');

  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'INVALID_RESPONSE');
});
