(function (root) {
  function createNumberFieldControl(dependencies = {}) {
    const {
      documentRef = root.document,
    } = dependencies;

    function create(options = {}) {
      const input = documentRef.createElement('input');
      input.className = options.className || 'text-input compact-number-input';
      input.type = 'number';
      if (options.min !== null && options.min !== undefined) input.min = String(options.min);
      if (options.max !== null && options.max !== undefined) input.max = String(options.max);
      input.step = String(options.step === undefined ? 1 : options.step);
      input.value = String(options.value);
      input.addEventListener('change', () => {
        const raw = Number(input.value);
        let next = Number.isFinite(raw) ? raw : (options.min !== null && options.min !== undefined ? options.min : 0);
        if (options.min !== null && options.min !== undefined) next = Math.max(options.min, next);
        if (options.max !== null && options.max !== undefined) next = Math.min(options.max, next);
        input.value = String(next);
        (options.onInput || (() => {}))(next);
        (options.onAfterCommit || (() => {}))();
      });
      return input;
    }

    return { create };
  }

  root.CreditosNumberFieldControl = {
    createNumberFieldControl,
  };
})(globalThis);
