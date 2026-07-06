(function (root) {
  function createColorFieldControl(dependencies = {}) {
    const {
      documentRef = root.document,
    } = dependencies;

    function create(options = {}) {
      const input = documentRef.createElement('input');
      input.className = options.className || 'color-input';
      input.type = 'color';
      input.value = options.value || '#ffffff';
      input.addEventListener(options.eventName || 'input', () => {
        (options.onInput || (() => {}))(input.value);
        (options.onAfterCommit || (() => {}))();
      });
      return input;
    }

    return { create };
  }

  root.CreditosColorFieldControl = {
    createColorFieldControl,
  };
})(globalThis);
