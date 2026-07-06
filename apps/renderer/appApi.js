(function (root) {
  function createAppApi(options = {}) {
    const host = options.host || root;
    const getDatabasePath = options.getDatabasePath || (() => null);

    function nativeBridge() {
      return host.creditosNative || null;
    }

    async function readNativePreferences() {
      const native = nativeBridge();
      if (!native || !native.readPreferences) return {};
      return await native.readPreferences() || {};
    }

    function writeNativePreference(key, value) {
      const native = nativeBridge();
      if (!native || !native.writePreference) return;
      native.writePreference({ key, value }).catch((error) => {
        console.warn('No se pudo guardar preferencia:', error.message);
      });
    }

    async function dbPost(endpoint, payload = {}) {
      const databasePath = getDatabasePath();
      if (!databasePath && endpoint !== '/api/db/init') {
        throw new Error('Selecciona primero una base de datos.');
      }
      const response = await host.fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db_path: databasePath, ...payload }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error de base de datos.');
      return result;
    }

    return {
      dbPost,
      nativeBridge,
      readNativePreferences,
      writeNativePreference,
    };
  }

  root.CreditosAppApi = {
    createAppApi,
  };
})(globalThis);
