(function (root) {
  function createCommonDomain() {
    function safeFilePart(value) {
      return String(value || 'item')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\\/:*?"<>|]+/g, '_')
        .replace(/[^a-zA-Z0-9_ -]+/g, '')
        .replace(/\s+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 80) || 'item';
    }

    function normalizeEditableValue(value) {
      return Array.isArray(value) ? JSON.stringify(value) : String(value || '');
    }

    function normalizeText(value) {
      return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
    }

    function normalizeColor(value) {
      return /^#[0-9a-fA-F]{6}$/.test(String(value || '')) ? value : '#171b1f';
    }

    function normalizeBoolean(value, defaultValue = true) {
      if (value === undefined || value === null || value === '') return defaultValue;
      if (typeof value === 'string') return !['false', '0', 'no', 'off'].includes(value.trim().toLowerCase());
      return Boolean(value);
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function directoryFromPath(filePath) {
      const text = String(filePath || '');
      const index = Math.max(text.lastIndexOf('/'), text.lastIndexOf('\\'));
      return index > 0 ? text.slice(0, index) : '';
    }

    function joinPath(directory, fileName) {
      if (!directory) return fileName;
      const separator = directory.includes('\\') ? '\\' : '/';
      return `${directory.replace(/[\\/]+$/, '')}${separator}${fileName}`;
    }

    function styleNameFromFileName(fileName, fallback) {
      return String(fileName || '')
        .replace(/\.json$/i, '')
        .replace(/[_-]+/g, ' ')
        .trim() || fallback;
    }

    function safeStyleId(value) {
      return safeFilePart(String(value || 'estilo').toLowerCase().replace(/\s+/g, '_')) || `style_${Date.now()}`;
    }

    return {
      clamp,
      directoryFromPath,
      joinPath,
      normalizeBoolean,
      normalizeColor,
      normalizeEditableValue,
      normalizeText,
      safeFilePart,
      safeStyleId,
      styleNameFromFileName,
    };
  }

  root.CreditosDomainCommon = {
    createCommonDomain,
  };
})(globalThis);
