(function (root) {
  function createAppMainEditor(options = {}) {
    const documentRef = options.documentRef || root.document;
    const els = options.els;
    const state = options.state;

    function renderEditor(renderOptions = {}) {
      const shouldRenderPreview = renderOptions.renderPreview !== false;
      if (!state.source || !state.selectedCartelaId) {
        els.editorTitle.textContent = 'Sin cartela seleccionada';
        els.editorKind.textContent = '';
        els.editorKind.className = '';
        els.editorBody.className = 'editor-body empty-state';
        els.editorBody.textContent = 'Asocia un archivo de créditos y selecciona una cartela.';
        if (shouldRenderPreview) options.renderCartelaPreview();
        return;
      }

      const cartela = options.getSelectedCartela();
      if (!cartela) return;

      els.editorTitle.textContent = options.getCartelaDisplayName(cartela, state.materials);
      renderEditorHeaderActions(cartela);
      els.editorBody.className = 'editor-body preview-mode';
      els.editorBody.innerHTML = '';
      els.editorBody.appendChild(options.renderCartelaFields(cartela));
      els.editorBody.appendChild(options.sectionLabel('Bloques en esta cartela'));
      els.editorBody.appendChild(options.renderSourceRefControls(cartela));

      const materialsGrid = documentRef.createElement('div');
      materialsGrid.className = 'cartela-materials-grid';
      materialsGrid.style.gridTemplateColumns = `repeat(${Math.max(1, Number(options.getEffectiveCartela(cartela).columns) || 1)}, minmax(0, 1fr))`;
      options.getCartelaRefs(cartela).forEach((ref) => {
        const material = state.materials.find((candidate) => candidate.id === ref);
        materialsGrid.appendChild(options.renderMaterialEditor(material, ref));
      });
      els.editorBody.appendChild(materialsGrid);
      if (shouldRenderPreview) options.renderCartelaPreview();
    }

    function renderEditorHeaderActions(cartela) {
      els.editorKind.innerHTML = '';
      els.editorKind.className = 'panel-heading-actions cartela-editor-heading-actions';

      const type = documentRef.createElement('span');
      type.className = 'tag cards';
      type.textContent = cartela.type || 'cartela';
      els.editorKind.appendChild(type);

      const filter = documentRef.createElement('label');
      filter.className = 'switch-row compact-switch';
      filter.title = 'Mostrar solo propiedades con override o animación activa';
      const input = documentRef.createElement('input');
      input.type = 'checkbox';
      input.checked = !!state.cartelaQuickFilterEnabled;
      input.addEventListener('change', () => {
        state.cartelaQuickFilterEnabled = !!input.checked;
        renderEditor();
      });
      const label = documentRef.createElement('span');
      label.textContent = 'Cambios';
      filter.appendChild(input);
      filter.appendChild(label);
      els.editorKind.appendChild(filter);
    }

    return {
      renderEditor,
    };
  }

  root.CreditosAppMainEditor = {
    createAppMainEditor,
  };
})(globalThis);
