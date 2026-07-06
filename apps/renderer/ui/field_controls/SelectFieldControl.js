(function (root) {
  function createSelectFieldControl(dependencies = {}) {
    const {
      documentRef = root.document,
    } = dependencies;

    function create(options = {}) {
      const select = documentRef.createElement('select');
      select.className = options.className || 'text-input compact-select';
      (options.options || []).forEach(([optionValue, optionLabel]) => {
        const option = documentRef.createElement('option');
        option.value = optionValue;
        option.textContent = optionLabel;
        select.appendChild(option);
      });
      select.value = options.value;
      select.addEventListener('change', () => {
        (options.onInput || (() => {}))(select.value);
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
