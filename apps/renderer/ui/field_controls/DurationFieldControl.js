(function (root) {
  function createDurationFieldControl(dependencies = {}) {
    const {
      documentRef = root.document,
    } = dependencies;

    function create(options = {}) {
      const input = documentRef.createElement('input');
      const fps = options.currentFps();
      input.className = options.className || 'text-input';
      input.type = 'text';
      input.inputMode = 'numeric';
      input.value = options.formatSecondsAsFrameDuration(options.secondsValue || 0, fps);
      input.addEventListener('change', () => {
        const currentFps = options.currentFps();
        const frames = options.parseFrameDuration(input.value, currentFps);
        if (frames === null) {
          options.alertFn(`Introduce la duración como mm:ss:ff. También puedes escribir solo números, por ejemplo 35 = ${options.formatFrameDuration(35, currentFps)}.`);
          input.value = options.formatSecondsAsFrameDuration(options.secondsValue || 0, currentFps);
          return;
        }
        input.value = options.formatFrameDuration(frames, currentFps);
        (options.onInput || (() => {}))(frames / currentFps);
        (options.onAfterCommit || (() => {}))();
      });
      return input;
    }

    return { create };
  }

  root.CreditosDurationFieldControl = {
    createDurationFieldControl,
  };
})(globalThis);
