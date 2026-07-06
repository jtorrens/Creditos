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

    return {
      normalizeBoolean,
      normalizeColor,
      normalizeEditableValue,
      normalizeText,
      safeFilePart,
    };
  }

  root.CreditosDomainCommon = {
    createCommonDomain,
  };
})(globalThis);
