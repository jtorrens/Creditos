(function (root) {
  function createOverridesDomain(dependencies = {}) {
    const {
      normalizeEditableValue = (value) => Array.isArray(value) ? JSON.stringify(value) : String(value || ''),
    } = dependencies;

    function resolveOverride(overrides, refId, field, fallback) {
      return overrides && overrides[refId] && Object.prototype.hasOwnProperty.call(overrides[refId], field)
        ? overrides[refId][field]
        : fallback;
    }

    function setOverride(structure, refId, field, value, fallback) {
      if (!structure) return false;
      structure.overrides = structure.overrides || {};
      const hasChanged = normalizeEditableValue(value) !== normalizeEditableValue(fallback);

      if (!hasChanged) {
        if (structure.overrides[refId]) {
          delete structure.overrides[refId][field];
          if (!Object.keys(structure.overrides[refId]).length) delete structure.overrides[refId];
        }
        return true;
      }

      structure.overrides[refId] = structure.overrides[refId] || {};
      structure.overrides[refId][field] = value;
      return true;
    }

    return {
      resolveOverride,
      setOverride,
    };
  }

  root.CreditosDomainOverrides = {
    createOverridesDomain,
  };
})(globalThis);
