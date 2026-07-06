const fs = require('fs/promises');
const path = require('path');

function createPreferenceStore({ getUserDataPath }) {
  let preferenceWriteQueue = Promise.resolve();

  function windowStatePath() {
    return path.join(getUserDataPath(), 'window-state.json');
  }

  function preferencesPath() {
    return path.join(getUserDataPath(), 'preferences.json');
  }

  async function readWindowState() {
    try {
      const data = await fs.readFile(windowStatePath(), 'utf8');
      return JSON.parse(data);
    } catch (_error) {
      return {};
    }
  }

  async function readPreferences() {
    try {
      const data = await fs.readFile(preferencesPath(), 'utf8');
      return JSON.parse(data);
    } catch (_error) {
      return {};
    }
  }

  async function writePreference(key, value) {
    if (!key) return {};
    const preferences = await readPreferences();
    preferences[key] = value;
    await fs.mkdir(path.dirname(preferencesPath()), { recursive: true });
    await fs.writeFile(preferencesPath(), JSON.stringify(preferences, null, 2));
    return preferences;
  }

  function queuedWritePreference(key, value) {
    preferenceWriteQueue = preferenceWriteQueue
      .catch(() => ({}))
      .then(() => writePreference(key, value));
    return preferenceWriteQueue;
  }

  async function writeWindowState(window) {
    if (!window || window.isDestroyed()) return;
    const bounds = window.getBounds();
    const state = {
      ...bounds,
      isMaximized: window.isMaximized(),
    };
    try {
      await fs.writeFile(windowStatePath(), JSON.stringify(state, null, 2));
    } catch (error) {
      console.warn('No se pudo guardar el tamano de ventana:', error.message);
    }
  }

  return {
    readWindowState,
    readPreferences,
    queuedWritePreference,
    writeWindowState,
  };
}

module.exports = { createPreferenceStore };
