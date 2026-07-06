(function (root) {
  function createTypographyFieldControl(dependencies = {}) {
    const {
      documentRef = root.document,
    } = dependencies;

    function create(options = {}) {
      const wrap = documentRef.createElement('div');
      wrap.className = options.className || 'typography-field-control';
      (options.controls || []).forEach((control) => {
        if (control) wrap.appendChild(control);
      });
      return wrap;
    }

    return { create };
  }

  root.CreditosTypographyFieldControl = {
    createTypographyFieldControl,
  };
})(globalThis);
