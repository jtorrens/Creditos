(function (root) {
  function createCartelaListPanel(options = {}) {
    const documentRef = options.documentRef || root.document;
    const els = options.els;
    const state = options.state;

    function renderCartelaList() {
      els.blockList.innerHTML = '';
      const cartelas = state.structure && state.structure.cartelas ? options.getVisualCartelas(state.structure.cartelas) : [];
      const episode = options.selectedEpisode();
      els.blockCount.textContent = episode ? `${episode.name} · ${cartelas.length}` : String(cartelas.length);

      cartelas.forEach((cartela, index) => {
        const refs = options.getCartelaRefs(cartela);
        const effectiveCartela = options.getEffectiveCartela(cartela);
        const style = options.getStyleById(cartela.style_id);
        const hasOverrides = typeof options.hasCartelaStyleOverrides === 'function' && options.hasCartelaStyleOverrides(cartela);
        const isActive = cartela.id === state.selectedCartelaId;
        const enabledWithoutStyle = cartela.enabled !== false && !style;
        const button = documentRef.createElement('div');
        button.className = 'block-button'
          + (isActive ? ' active' : '')
          + (hasOverrides ? ' has-overrides' : '')
          + (enabledWithoutStyle ? ' missing-style' : '');
        button.addEventListener('click', () => options.selectCartela(cartela.id));

        button.innerHTML = `
          <div class="block-group">${String(index + 1).padStart(2, '0')}</div>
          <div class="block-name">${options.escapeHtml(options.getCartelaDisplayName(cartela, state.materials, index))}</div>
          <div class="block-meta">${cartela.enabled === false ? 'excluida · ' : ''}${style ? options.escapeHtml(style.name) + ' · ' : ''}${options.escapeHtml(effectiveCartela.orientation || 'horizontal')} · ${Number(effectiveCartela.columns) || 1} col · ${refs.length} bloque${refs.length === 1 ? '' : 's'}</div>
        `;
        const orderControls = documentRef.createElement('div');
        orderControls.className = 'cartela-order-controls';
        const upButton = documentRef.createElement('button');
        upButton.type = 'button';
        upButton.textContent = '↑';
        upButton.title = 'Mover cartela arriba';
        upButton.disabled = index === 0;
        upButton.addEventListener('click', (event) => {
          event.stopPropagation();
          options.moveSelectedCartelaVisualOrder(cartela.id, -1);
        });
        const downButton = documentRef.createElement('button');
        downButton.type = 'button';
        downButton.textContent = '↓';
        downButton.title = 'Mover cartela abajo';
        downButton.disabled = index >= cartelas.length - 1;
        downButton.addEventListener('click', (event) => {
          event.stopPropagation();
          options.moveSelectedCartelaVisualOrder(cartela.id, 1);
        });
        orderControls.appendChild(upButton);
        orderControls.appendChild(downButton);
        button.appendChild(orderControls);
        els.blockList.appendChild(button);
      });
    }

    return {
      renderCartelaList,
    };
  }

  root.CreditosCartelaListPanel = {
    createCartelaListPanel,
  };
})(globalThis);
