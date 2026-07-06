(function (root) {
  function createAppPreferences(options = {}) {
    const documentRef = options.documentRef || root.document;
    const windowRef = options.windowRef || root;
    const state = options.state;
    const storageKeys = options.storageKeys || {};
    const clamp = options.clamp;
    const directoryFromPath = options.directoryFromPath || (() => '');
    const writeNativePreference = options.writeNativePreference || (() => {});
    const renderVisiblePanelPreviews = options.renderVisiblePanelPreviews || (() => {});

    function readLocalPreference(key) {
      if (state.preferences && state.preferences[key]) return state.preferences[key];
      try {
        return windowRef.localStorage.getItem(key) || '';
      } catch (_error) {
        return '';
      }
    }

    function writeLocalPreference(key, value) {
      if (!value) return;
      state.preferences = state.preferences || {};
      state.preferences[key] = value;
      writeNativePreference(key, value);
      try {
        windowRef.localStorage.setItem(key, value);
      } catch (_error) {
        // Local persistence is a convenience only.
      }
    }

    function readLocalJsonPreference(key, fallback) {
      if (state.preferences && state.preferences[key] !== undefined) return state.preferences[key];
      try {
        const value = windowRef.localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
      } catch (_error) {
        return fallback;
      }
    }

    function writeLocalJsonPreference(key, value) {
      state.preferences = state.preferences || {};
      state.preferences[key] = value;
      writeNativePreference(key, value);
      try {
        windowRef.localStorage.setItem(key, JSON.stringify(value));
      } catch (_error) {
        // Local persistence is a convenience only.
      }
    }

    function setupResizablePanels() {
      const stylesWorkspace = documentRef.querySelector('.styles-workspace');
      const savedStyles = readLocalJsonPreference(storageKeys.stylesPanels, null);
      if (savedStyles) applyPanelWidths('styles', {
        left: clamp(Number(savedStyles.left) || 320, 300, 620),
        preview: clamp(Number(savedStyles.preview) || 360, 160, 1400),
      });
      setupWorkspaceResizers(stylesWorkspace, 'styles', storageKeys.stylesPanels, {
        left: [300, 620],
        preview: [160, 1400],
      });

      const cartelasWorkspace = documentRef.querySelector('.cartelas-workspace');
      const savedCartelas = readLocalJsonPreference(storageKeys.cartelasPanels, null);
      if (savedCartelas) applyPanelWidths('cartelas', savedCartelas);
      setupWorkspaceResizers(cartelasWorkspace, 'cartelas', storageKeys.cartelasPanels, {
        left: [140, 520],
        preview: [160, 1400],
      });
    }

    function setupWorkspaceResizers(workspace, namespace, storageKey, limits) {
      if (!workspace) return;
      workspace.querySelectorAll('.panel-resizer').forEach((handle) => {
        handle.addEventListener('pointerdown', (event) => {
          event.preventDefault();
          handle.setPointerCapture(event.pointerId);
          const startX = event.clientX;
          const current = getPanelWidths(namespace);
          const side = handle.dataset.resizer;
          const onMove = (moveEvent) => {
            const delta = moveEvent.clientX - startX;
            const next = { ...current };
            if (side === `${namespace}-left`) {
              next.left = clamp(current.left + delta, limits.left[0], limits.left[1]);
            } else if (side === `${namespace}-right`) {
              next.preview = clamp(current.preview - delta, limits.preview[0], limits.preview[1]);
            }
            applyPanelWidths(namespace, next);
            renderVisiblePanelPreviews();
          };
          const onUp = () => {
            writeLocalJsonPreference(storageKey, getPanelWidths(namespace));
            handle.removeEventListener('pointermove', onMove);
            handle.removeEventListener('pointerup', onUp);
            handle.removeEventListener('pointercancel', onUp);
          };
          handle.addEventListener('pointermove', onMove);
          handle.addEventListener('pointerup', onUp);
          handle.addEventListener('pointercancel', onUp);
        });
      });
    }

    function getPanelWidths(namespace) {
      const documentElement = documentRef.documentElement;
      const fallbackLeft = namespace === 'cartelas' ? 260 : 320;
      const fallbackPreview = namespace === 'cartelas' ? 360 : 360;
      return {
        left: Number.parseFloat(documentElement.style.getPropertyValue(`--${namespace}-left-width`)) || fallbackLeft,
        preview: Number.parseFloat(documentElement.style.getPropertyValue(`--${namespace}-preview-width`)) || fallbackPreview,
      };
    }

    function applyPanelWidths(namespace, widths) {
      const documentElement = documentRef.documentElement;
      documentElement.style.setProperty(`--${namespace}-left-width`, `${Number(widths.left) || 240}px`);
      documentElement.style.setProperty(`--${namespace}-preview-width`, `${Number(widths.preview) || 360}px`);
    }

    function rememberFileDirectory(key, filePath) {
      const directory = directoryFromPath(filePath);
      if (directory) writeLocalPreference(key, directory);
    }

    return {
      readLocalJsonPreference,
      readLocalPreference,
      rememberFileDirectory,
      setupResizablePanels,
      writeLocalJsonPreference,
      writeLocalPreference,
    };
  }

  root.CreditosAppPreferences = {
    createAppPreferences,
  };
})(globalThis);
