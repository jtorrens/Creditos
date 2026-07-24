(function (root) {
  function createCartelaListPanel(options = {}) {
    const documentRef = options.documentRef || root.document;
    const els = options.els;
    const state = options.state;
    let draggedCartelaId = null;

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
        button.draggable = true;
        button.dataset.cartelaId = cartela.id;
        button.title = 'Arrastra esta cartela sobre otra para copiar su estilo y sus overrides.';
        button.className = 'block-button'
          + (isActive ? ' active' : '')
          + (hasOverrides ? ' has-overrides' : '')
          + (cartela.enabled === false ? ' excluded' : '')
          + (enabledWithoutStyle ? ' missing-style' : '');
        button.addEventListener('click', () => options.selectCartela(cartela.id));
        button.addEventListener('dragstart', (event) => {
          draggedCartelaId = cartela.id;
          button.classList.add('dragging');
          if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'copy';
            event.dataTransfer.setData('text/plain', cartela.id);
          }
        });
        button.addEventListener('dragover', (event) => {
          if (!draggedCartelaId || draggedCartelaId === cartela.id) return;
          event.preventDefault();
          button.classList.add('drop-target');
          if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
        });
        button.addEventListener('dragleave', () => button.classList.remove('drop-target'));
        button.addEventListener('drop', (event) => {
          event.preventDefault();
          button.classList.remove('drop-target');
          options.copyCartelaStyle(draggedCartelaId, cartela.id);
        });
        button.addEventListener('dragend', () => {
          draggedCartelaId = null;
          els.blockList.querySelectorAll('.dragging, .drop-target').forEach((item) => {
            item.classList.remove('dragging', 'drop-target');
          });
        });

        button.innerHTML = `
          <div class="block-group">${String(index + 1).padStart(2, '0')}</div>
          <div class="block-name">${options.escapeHtml(options.getCartelaDisplayName(cartela, state.materials, index))}</div>
          <div class="block-meta">${cartela.enabled === false ? 'excluida · ' : ''}${style ? options.escapeHtml(style.name) + ' · ' : ''}${options.escapeHtml(effectiveCartela.orientation || 'horizontal')} · ${Number(effectiveCartela.columns) || 1} col · ${refs.length} bloque${refs.length === 1 ? '' : 's'}</div>
        `;
        const orderControls = documentRef.createElement('div');
        orderControls.className = 'cartela-order-controls';
        const upButton = documentRef.createElement('button');
        upButton.type = 'button';
        upButton.draggable = false;
        upButton.textContent = '↑';
        upButton.title = 'Mover cartela arriba';
        upButton.disabled = index === 0;
        upButton.addEventListener('click', (event) => {
          event.stopPropagation();
          options.moveSelectedCartelaVisualOrder(cartela.id, -1);
        });
        const downButton = documentRef.createElement('button');
        downButton.type = 'button';
        downButton.draggable = false;
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
