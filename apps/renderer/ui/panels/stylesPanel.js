(function (root) {
  function createStylesPanel(options = {}) {
    const documentRef = options.documentRef || root.document;
    const els = options.els;
    const state = options.state;
    const fieldControlRegistry = options.fieldControlRegistry;

    function renderStylesPane() {
      if (!els.styleList) return;
      els.styleList.innerHTML = '';
      els.styleCount.textContent = String(state.styles.length);
      if (!state.selectedStyleId || !options.getStyleById(state.selectedStyleId)) {
        state.selectedStyleId = state.styles[0] ? state.styles[0].id : null;
      }
      if (!state.styles.length) {
        els.styleList.className = 'style-list empty-state';
        els.styleList.textContent = options.selectedProduction() ? 'Sin estilos.' : 'Selecciona una producción.';
      } else {
        els.styleList.className = 'style-list';
        const table = documentRef.createElement('table');
        table.className = 'data-table';
        table.innerHTML = '<thead><tr><th></th><th>Estilo</th></tr></thead>';
        const tbody = documentRef.createElement('tbody');
        state.styles.forEach((style) => {
          const row = documentRef.createElement('tr');
          row.className = style.id === state.selectedStyleId ? 'selected' : '';
          row.addEventListener('click', (event) => {
            if (event.target && event.target.closest('input')) return;
            state.selectedStyleId = style.id;
            renderStylesPane();
          });
          const selectCell = documentRef.createElement('td');
          selectCell.className = 'table-select-cell';
          const selectButton = documentRef.createElement('button');
          selectButton.type = 'button';
          selectButton.className = 'table-select-button';
          selectButton.textContent = style.id === state.selectedStyleId ? '●' : '○';
          selectButton.addEventListener('click', () => {
            state.selectedStyleId = style.id;
            renderStylesPane();
          });
          selectCell.appendChild(selectButton);
          row.appendChild(selectCell);
          const nameCell = documentRef.createElement('td');
          const nameInput = fieldControlRegistry.create('text', {
            className: 'table-input',
            value: style.name,
            commitOnChange: true,
            onInput: (value) => options.updateStyleName(style, value),
          });
          nameCell.appendChild(nameInput);
          row.appendChild(nameCell);
          tbody.appendChild(row);
        });
        table.appendChild(tbody);
        els.styleList.appendChild(table);
      }
      if (els.duplicateStyleBtn) els.duplicateStyleBtn.disabled = !options.getStyleById(state.selectedStyleId);
      if (els.deleteStyleBtn) els.deleteStyleBtn.disabled = !options.getStyleById(state.selectedStyleId);

      const style = options.getStyleById(state.selectedStyleId);
      if (!style) {
        els.styleEditorTitle.textContent = 'Sin estilo seleccionado';
        els.styleEditorMeta.textContent = '';
        els.styleEditorBody.className = 'editor-body empty-state';
        els.styleEditorBody.textContent = options.selectedProduction() ? 'Crea o importa un estilo.' : 'Selecciona una producción.';
        options.renderStylePreview(null);
        return;
      }

      els.styleEditorTitle.textContent = style.name;
      els.styleEditorMeta.textContent = '';
      els.styleEditorBody.className = 'editor-body';
      els.styleEditorBody.innerHTML = '';
      els.styleEditorBody.appendChild(options.renderStyleEditor(style));
      options.renderStylePreview(style);
    }

    return {
      renderStylesPane,
    };
  }

  root.CreditosStylesPanel = {
    createStylesPanel,
  };
})(globalThis);
