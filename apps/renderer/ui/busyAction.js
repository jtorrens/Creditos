(function (root) {
  let activeAction = null;

  function run(options = {}) {
    if (activeAction) return activeAction;
    const documentRef = options.documentRef || root.document;
    const windowRef = options.windowRef || root;
    const trigger = options.trigger || null;
    const action = typeof options.action === 'function' ? options.action : () => {};
    const startedAt = performance.now();

    if (trigger) {
      trigger.disabled = true;
      trigger.style.visibility = 'hidden';
    }

    const overlay = createOverlay(documentRef, options.label || 'Actualizando renders…');
    documentRef.body.appendChild(overlay);
    documentRef.body.classList.add('app-busy');
    documentRef.body.setAttribute('aria-busy', 'true');
    overlay.focus({ preventScroll: true });

    activeAction = (async () => {
      await nextFrame(windowRef);
      await nextFrame(windowRef);
      await action();
      if (documentRef.fonts && documentRef.fonts.ready) {
        await documentRef.fonts.ready.catch(() => {});
      }
      await nextFrame(windowRef);
      await nextFrame(windowRef);
      const remaining = 180 - (performance.now() - startedAt);
      if (remaining > 0) await delay(windowRef, remaining);
    })().catch((error) => {
      console.error(error);
    }).finally(() => {
      overlay.remove();
      documentRef.body.classList.remove('app-busy');
      documentRef.body.removeAttribute('aria-busy');
      activeAction = null;
    });

    return activeAction;
  }

  function createOverlay(documentRef, label) {
    const overlay = documentRef.createElement('div');
    overlay.className = 'app-busy-overlay';
    overlay.tabIndex = -1;
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');

    const card = documentRef.createElement('div');
    card.className = 'app-busy-card';
    const spinner = documentRef.createElement('span');
    spinner.className = 'app-busy-spinner';
    spinner.setAttribute('aria-hidden', 'true');
    const text = documentRef.createElement('span');
    text.textContent = label;
    card.appendChild(spinner);
    card.appendChild(text);
    overlay.appendChild(card);
    return overlay;
  }

  function nextFrame(windowRef) {
    return new Promise((resolve) => windowRef.requestAnimationFrame(resolve));
  }

  function delay(windowRef, duration) {
    return new Promise((resolve) => windowRef.setTimeout(resolve, duration));
  }

  root.CreditosBusyAction = { run };
})(globalThis);
