(function (root) {
  function createSelectFieldControl(dependencies = {}) {
    const {
      documentRef = root.document,
    } = dependencies;

    function create(options = {}) {
      const select = documentRef.createElement('select');
      select.className = options.className || 'text-input compact-select';
      (options.options || []).forEach((optionDef) => {
        const [optionValue, optionLabel, optionMeta = {}] = Array.isArray(optionDef)
          ? optionDef
          : [optionDef.value, optionDef.label, optionDef];
        const option = documentRef.createElement('option');
        option.value = optionValue;
        option.textContent = optionLabel;
        if (optionMeta.postscriptName !== undefined) option.dataset.postscriptName = optionMeta.postscriptName || '';
        select.appendChild(option);
      });
      select.value = options.value;
      select.addEventListener('change', () => {
        (options.onInput || (() => {}))(select.value, select);
        (options.onAfterCommit || (() => {}))();
      });
      return select;
    }

    return { create };
  }

  root.CreditosSelectFieldControl = {
    createSelectFieldControl,
  };
})(globalThis);
