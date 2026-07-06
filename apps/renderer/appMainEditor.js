(function (root) {
  function createAppMainEditor(options = {}) {
    const documentRef = options.documentRef || root.document;
    const els = options.els;
    const state = options.state;

    function renderEditor() {
      if (!state.source || !state.selectedCartelaId) {
        els.editorTitle.textContent = 'Sin cartela seleccionada';
        els.editorKind.textContent = '';
        els.editorBody.className = 'editor-body empty-state';
        els.editorBody.textContent = 'Asocia un archivo de créditos y selecciona una cartela.';
        options.renderCartelaPreview();
        return;
      }

      const cartela = options.getSelectedCartela();
      if (!cartela) return;

      els.editorTitle.textContent = options.getCartelaDisplayName(cartela, state.materials);
      els.editorKind.innerHTML = `<span class="tag cards">${options.escapeHtml(cartela.type || 'cartela')}</span>`;
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
      options.renderCartelaPreview();
    }

    return {
      renderEditor,
    };
  }

  root.CreditosAppMainEditor = {
    createAppMainEditor,
  };
})(globalThis);
