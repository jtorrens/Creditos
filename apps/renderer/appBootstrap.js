(function (root) {
  function createAppBootstrap(options = {}) {
    const appApi = options.appApi;
    const els = options.els;
    const state = options.state;
    const nativeBridge = options.nativeBridge;

    async function initializeAppInfo() {
      const native = nativeBridge();
      if (!native || !native.getAppInfo || !els.appVersion) return;
      try {
        const info = await native.getAppInfo();
        if (info && info.version) {
          els.appVersion.textContent = `v${info.version}`;
          els.appVersion.title = `${info.name || 'Créditos'} ${info.version} (${info.platform || ''} ${info.arch || ''})`.trim();
        }
      } catch (_error) {
        els.appVersion.textContent = '';
      }
    }

    async function loadNativePreferences() {
      try {
        state.preferences = await appApi.readNativePreferences();
      } catch (error) {
        console.warn('No se pudieron cargar preferencias:', error.message);
        state.preferences = {};
      }
    }

    async function initializeAppPreferences() {
      await loadNativePreferences();
      options.setupResizablePanels();
      await options.initializeDatabaseWithSyncCheck();

      options.loadSystemFonts({ silent: true });
      options.renderProjectSelectors();
    }

    return {
      initializeAppInfo,
      initializeAppPreferences,
      loadNativePreferences,
    };
  }

  root.CreditosAppBootstrap = {
    createAppBootstrap,
  };
})(globalThis);
