(function (root) {
  function createCheckboxFieldControl(dependencies = {}) {
    const {
      documentRef = root.document,
    } = dependencies;

    function create(options = {}) {
      const inputWrap = documentRef.createElement('label');
      inputWrap.className = options.className || 'check-row';
      const input = documentRef.createElement('input');
      input.type = 'checkbox';
      input.checked = !!options.value;
      const status = documentRef.createTextNode('');
      const updateStatus = () => {
        status.textContent = input.checked
          ? (options.activeLabel || 'Activa')
          : (options.inactiveLabel || 'Excluida');
      };
      input.addEventListener('change', () => {
        updateStatus();
        (options.onInput || (() => {}))(input.checked, input);
      });
      updateStatus();
      inputWrap.appendChild(input);
      inputWrap.appendChild(status);
      return inputWrap;
    }

    return { create };
  }

  root.CreditosCheckboxFieldControl = {
    createCheckboxFieldControl,
  };
})(globalThis);
