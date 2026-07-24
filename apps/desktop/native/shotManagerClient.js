const fs = require('fs/promises');
const path = require('path');

const API_VERSION = 1;
const DISCOVERY_FILE_NAME = 'integration-api.json';
const SHOT_MANAGER_USER_DATA_DIRECTORY = 'VFX Shot Manager';

class ShotManagerIntegrationError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ShotManagerIntegrationError';
    this.code = code;
    this.details = details;
  }
}

function assertObject(value, code, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ShotManagerIntegrationError(code, message);
  }
  return value;
}

function validateConnection(value) {
  const connection = assertObject(
    value,
    'DISCOVERY_INVALID',
    'El archivo de conexión de Shot Manager no es válido.',
  );
  if (connection.version !== 1 || connection.apiVersion !== API_VERSION) {
    throw new ShotManagerIntegrationError(
      'API_VERSION_UNSUPPORTED',
      'La versión de conexión de Shot Manager no es compatible con esta versión de Créditos.',
      {
        apiVersion: connection.apiVersion,
        version: connection.version,
      },
    );
  }
  if (typeof connection.token !== 'string' || !/^[a-f0-9]{64}$/.test(connection.token)) {
    throw new ShotManagerIntegrationError(
      'DISCOVERY_INVALID',
      'La credencial local de Shot Manager no es válida.',
    );
  }
  if (typeof connection.updatedAt !== 'string' || !Number.isFinite(Date.parse(connection.updatedAt))) {
    throw new ShotManagerIntegrationError(
      'DISCOVERY_INVALID',
      'La fecha del archivo de conexión de Shot Manager no es válida.',
    );
  }

  let baseUrl;
  try {
    baseUrl = new URL(connection.baseUrl);
  } catch (_error) {
    throw new ShotManagerIntegrationError(
      'DISCOVERY_INVALID',
      'La dirección local publicada por Shot Manager no es válida.',
    );
  }
  if (
    baseUrl.protocol !== 'http:' ||
    baseUrl.hostname !== '127.0.0.1' ||
    !baseUrl.port ||
    baseUrl.pathname.replace(/\/+$/, '') !== '/api/v1' ||
    baseUrl.username ||
    baseUrl.password ||
    baseUrl.search ||
    baseUrl.hash
  ) {
    throw new ShotManagerIntegrationError(
      'DISCOVERY_INVALID',
      'Shot Manager publicó una dirección que no pertenece a su API local v1.',
    );
  }
  return {
    apiVersion: API_VERSION,
    baseUrl: baseUrl.toString().replace(/\/+$/, ''),
    token: connection.token,
    updatedAt: connection.updatedAt,
    version: 1,
  };
}

function validateEnvelope(value) {
  const envelope = assertObject(
    value,
    'INVALID_RESPONSE',
    'Shot Manager devolvió una respuesta no válida.',
  );
  if (envelope.apiVersion !== API_VERSION) {
    throw new ShotManagerIntegrationError(
      'API_VERSION_UNSUPPORTED',
      'La versión de la API de Shot Manager no es compatible con esta versión de Créditos.',
      { apiVersion: envelope.apiVersion },
    );
  }
  return envelope;
}

function validateCatalog(value) {
  const catalog = assertObject(
    value,
    'INVALID_RESPONSE',
    'El catálogo de producciones de Shot Manager no es válido.',
  );
  if (!Array.isArray(catalog.productions)) {
    throw new ShotManagerIntegrationError(
      'INVALID_RESPONSE',
      'Shot Manager no devolvió una lista de producciones válida.',
    );
  }
  for (const record of catalog.productions) {
    assertObject(record, 'INVALID_RESPONSE', 'Una producción de Shot Manager no es válida.');
    if (typeof record.available !== 'boolean' || typeof record.rootPath !== 'string') {
      throw new ShotManagerIntegrationError(
        'INVALID_RESPONSE',
        'Una producción de Shot Manager está incompleta.',
      );
    }
    if (record.available) {
      const production = assertObject(
        record.production,
        'INVALID_RESPONSE',
        'Una producción disponible de Shot Manager no contiene sus datos.',
      );
      if (typeof production.id !== 'string' || typeof production.name !== 'string') {
        throw new ShotManagerIntegrationError(
          'INVALID_RESPONSE',
          'Una producción de Shot Manager no contiene identidad estable.',
        );
      }
    }
  }
  return catalog;
}

function validateSnapshot(value, productionId) {
  const snapshot = assertObject(
    value,
    'INVALID_RESPONSE',
    'El contexto de producción de Shot Manager no es válido.',
  );
  const production = assertObject(
    snapshot.production,
    'INVALID_RESPONSE',
    'Shot Manager no devolvió la producción solicitada.',
  );
  const location = assertObject(
    snapshot.location,
    'INVALID_RESPONSE',
    'Shot Manager no devolvió la ubicación de la producción.',
  );
  if (
    production.id !== productionId ||
    typeof location.rootPath !== 'string' ||
    !Array.isArray(production.structureEntries) ||
    !Array.isArray(snapshot.seasons) ||
    !Array.isArray(snapshot.episodes) ||
    !Array.isArray(snapshot.sequences) ||
    !Array.isArray(snapshot.shots)
  ) {
    throw new ShotManagerIntegrationError(
      'INVALID_RESPONSE',
      'El contexto de producción devuelto por Shot Manager está incompleto.',
    );
  }
  return snapshot;
}

function publicError(error) {
  if (error instanceof ShotManagerIntegrationError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }
  return {
    code: 'SHOT_MANAGER_ERROR',
    message: error instanceof Error ? error.message : String(error),
    details: {},
  };
}

function createShotManagerClient({
  fetchImpl = globalThis.fetch,
  getAppDataPath,
  readFile = fs.readFile,
  timeoutMs = 2500,
}) {
  if (typeof getAppDataPath !== 'function') {
    throw new Error('Shot Manager integration requires getAppDataPath.');
  }
  if (typeof fetchImpl !== 'function') {
    throw new Error('Shot Manager integration requires fetch.');
  }

  function discoveryPath() {
    return path.join(
      getAppDataPath(),
      SHOT_MANAGER_USER_DATA_DIRECTORY,
      DISCOVERY_FILE_NAME,
    );
  }

  async function readConnection() {
    let raw;
    try {
      raw = await readFile(discoveryPath(), 'utf8');
    } catch (error) {
      if (error && error.code === 'ENOENT') {
        throw new ShotManagerIntegrationError(
          'SHOT_MANAGER_NOT_RUNNING',
          'Abre Shot Manager para conectar esta producción.',
        );
      }
      throw new ShotManagerIntegrationError(
        'DISCOVERY_READ_FAILED',
        'No se pudo leer la conexión local de Shot Manager.',
      );
    }
    let value;
    try {
      value = JSON.parse(raw);
    } catch (_error) {
      throw new ShotManagerIntegrationError(
        'DISCOVERY_INVALID',
        'El archivo de conexión de Shot Manager contiene datos no válidos.',
      );
    }
    return validateConnection(value);
  }

  async function request(endpoint, { authenticated = true } = {}) {
    const connection = await readConnection();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetchImpl(`${connection.baseUrl}${endpoint}`, {
        headers: authenticated
          ? { Authorization: `Bearer ${connection.token}` }
          : {},
        method: 'GET',
        signal: controller.signal,
      });
    } catch (error) {
      const timedOut = error && error.name === 'AbortError';
      throw new ShotManagerIntegrationError(
        timedOut ? 'SHOT_MANAGER_TIMEOUT' : 'SHOT_MANAGER_UNAVAILABLE',
        timedOut
          ? 'Shot Manager no respondió a tiempo.'
          : 'Shot Manager no está disponible en este equipo.',
      );
    } finally {
      clearTimeout(timeout);
    }

    let body;
    try {
      body = await response.json();
    } catch (_error) {
      throw new ShotManagerIntegrationError(
        'INVALID_RESPONSE',
        'Shot Manager devolvió una respuesta que Créditos no puede leer.',
      );
    }
    const envelope = validateEnvelope(body);
    if (!response.ok || envelope.error) {
      const remoteError = envelope.error && typeof envelope.error === 'object'
        ? envelope.error
        : {};
      throw new ShotManagerIntegrationError(
        typeof remoteError.code === 'string' ? remoteError.code : 'SHOT_MANAGER_REQUEST_FAILED',
        typeof remoteError.message === 'string'
          ? remoteError.message
          : 'Shot Manager no pudo completar la consulta.',
        remoteError.details && typeof remoteError.details === 'object'
          ? remoteError.details
          : {},
      );
    }
    if (!Object.prototype.hasOwnProperty.call(envelope, 'data')) {
      throw new ShotManagerIntegrationError(
        'INVALID_RESPONSE',
        'Shot Manager devolvió una respuesta sin datos.',
      );
    }
    return envelope.data;
  }

  async function getStatus() {
    try {
      const data = assertObject(
        await request('/health', { authenticated: false }),
        'INVALID_RESPONSE',
        'La respuesta de estado de Shot Manager no es válida.',
      );
      return {
        connected: true,
        apiVersion: API_VERSION,
        readOnly: data.readOnly === true,
        service: typeof data.service === 'string' ? data.service : 'VFX Shot Manager',
      };
    } catch (error) {
      return {
        connected: false,
        error: publicError(error),
      };
    }
  }

  async function listProductions() {
    try {
      return {
        ok: true,
        data: validateCatalog(await request('/productions')),
      };
    } catch (error) {
      return { ok: false, error: publicError(error) };
    }
  }

  async function getProduction(productionId) {
    const normalizedId = typeof productionId === 'string' ? productionId.trim() : '';
    if (!normalizedId) {
      return {
        ok: false,
        error: publicError(new ShotManagerIntegrationError(
          'PRODUCTION_ID_REQUIRED',
          'Selecciona una producción de Shot Manager.',
        )),
      };
    }
    try {
      return {
        ok: true,
        data: validateSnapshot(
          await request(`/productions/${encodeURIComponent(normalizedId)}`),
          normalizedId,
        ),
      };
    } catch (error) {
      return { ok: false, error: publicError(error) };
    }
  }

  return {
    discoveryPath,
    getProduction,
    getStatus,
    listProductions,
    readConnection,
  };
}

module.exports = {
  API_VERSION,
  ShotManagerIntegrationError,
  createShotManagerClient,
  publicError,
  validateConnection,
};
