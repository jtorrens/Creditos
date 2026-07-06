(function (root) {
  function createTextFieldControl(dependencies = {}) {
    const {
      documentRef = root.document,
    } = dependencies;

    function create(options = {}) {
      const input = options.multiline ? documentRef.createElement('textarea') : documentRef.createElement('input');
      input.className = options.className || 'text-input';
      if (!options.multiline) input.type = 'text';
      input.value = options.value || '';
      const commit = () => (options.onInput || (() => {}))(input.value);
      if (options.commitOnChange) {
        input.addEventListener('change', commit);
      } else {
        input.addEventListener('input', commit);
      }
      return input;
    }

    return { create };
  }

  root.CreditosTextFieldControl = {
    createTextFieldControl,
  };
})(globalThis);
