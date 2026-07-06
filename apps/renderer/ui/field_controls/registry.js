(function (root) {
  function createFieldControlRegistry() {
    const controls = new Map();

    function register(type, control) {
      if (!type || !control || typeof control.create !== 'function') {
        throw new Error('Invalid field control registration.');
      }
      controls.set(type, control);
    }

    function create(type, options = {}) {
      const control = controls.get(type);
      if (!control) throw new Error(`Field control not registered: ${type}`);
      return control.create(options);
    }

    function has(type) {
      return controls.has(type);
    }

    return {
      create,
      has,
      register,
    };
  }

  root.CreditosFieldControlRegistry = {
    createFieldControlRegistry,
  };
})(globalThis);
