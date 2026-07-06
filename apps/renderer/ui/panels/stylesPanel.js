(function (root) {
  function createStylesPanel(options = {}) {
    const documentRef = options.documentRef || root.document;
    const els = options.els;
    const state = options.state;
    const fieldControlRegistry = options.fieldControlRegistry;

    function renderStylePreview(style) {
      if (!els.stylePreview) return;
      els.stylePreview.innerHTML = '';
      if (!style) {
        els.stylePreview.className = 'style-preview empty-state';
        els.stylePreview.textContent = 'Sin estilo seleccionado.';
        return;
      }
      els.stylePreview.className = 'style-preview';
      const layout = options.getRenderLayout();
      const settings = options.getProductionSettings();
      const pages = options.buildPhysicalPages(options.makeSampleStyleRender(style).cartelas, {}, {
        settings,
        pageLineAdjustments: {},
      });
      const page = pages[0];
      if (!page) {
        els.stylePreview.className = 'style-preview empty-state';
        els.stylePreview.textContent = 'Sin contenido de preview.';
        return;
      }
      const zoom = options.previewZoomForContainer(els.stylePreview, layout);
      const frame = documentRef.createElement('div');
      frame.className = 'png-preview-frame';
      frame.style.width = `${layout.page_width * zoom}px`;
      frame.style.height = `${layout.page_height * zoom}px`;
      const sheet = options.makePdfSheetElement(page, layout, {
        settings,
      });
      sheet.style.transform = `scale(${zoom})`;
      frame.appendChild(sheet);
      if (state.showPanelMarginOverlay) {
        frame.appendChild(options.makeMarginOverlay(options.layoutForCartela(layout, page.cartela), zoom));
      }
      els.stylePreview.appendChild(frame);
      options.updatePanelMarginButtons();
    }

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
        renderStylePreview(null);
        return;
      }

      els.styleEditorTitle.textContent = style.name;
      els.styleEditorMeta.textContent = '';
      els.styleEditorBody.className = 'editor-body';
      els.styleEditorBody.innerHTML = '';
      els.styleEditorBody.appendChild(options.renderStyleEditor(style));
      renderStylePreview(style);
    }

    return {
      renderStylePreview,
      renderStylesPane,
    };
  }

  root.CreditosStylesPanel = {
    createStylesPanel,
  };
})(globalThis);
