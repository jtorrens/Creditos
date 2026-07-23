(function (root) {
  function createProjectPanel(options = {}) {
    const documentRef = options.documentRef || root.document;
    const els = options.els;
    const state = options.state;
    const fieldControlRegistry = options.fieldControlRegistry;

    function renderProjectSelectors() {
      renderSelect(els.productionSelect, state.productions, state.selectedProductionId, 'Sin producciones', (production) => production.name);
      renderProductionList();
      renderSelect(els.episodeSelect, options.currentProductionEpisodes(), state.selectedEpisodeId, 'Sin episodios', (episode) => episode.name);
      renderProductionLayoutControls();
      renderProductionImportModelControl();
      options.updateDatabaseStatus();
    }

    function renderProductionList() {
      if (!els.productionList) return;
      els.productionList.innerHTML = '';
      if (!state.productions.length) {
        els.productionList.className = 'production-list empty-state';
        els.productionList.textContent = 'Sin producciones.';
      } else {
        els.productionList.className = 'production-list';
        const table = documentRef.createElement('table');
        table.className = 'data-table';
        table.innerHTML = '<thead><tr><th></th><th>Producción</th><th>Capítulos</th><th>Formato</th><th>Importación</th></tr></thead>';
        const tbody = documentRef.createElement('tbody');
        state.productions.forEach((production) => {
          const row = documentRef.createElement('tr');
          row.className = String(production.id) === String(state.selectedProductionId) ? 'selected' : '';
          row.addEventListener('click', (event) => {
            if (event.target && event.target.closest('input')) return;
            options.selectProductionById(production.id);
          });
          const selectCell = documentRef.createElement('td');
          selectCell.className = 'table-select-cell';
          const selectButton = documentRef.createElement('button');
          selectButton.type = 'button';
          selectButton.className = 'table-select-button';
          selectButton.textContent = String(production.id) === String(state.selectedProductionId) ? '●' : '○';
          selectButton.addEventListener('click', () => options.selectProductionById(production.id));
          selectCell.appendChild(selectButton);
          row.appendChild(selectCell);

          const nameCell = documentRef.createElement('td');
          const nameInput = fieldControlRegistry.create('text', {
            className: 'table-input',
            value: production.name,
            commitOnChange: true,
            onInput: (value) => options.updateProductionName(production.id, value),
          });
          nameCell.appendChild(nameInput);
          row.appendChild(nameCell);

          const episodesCell = documentRef.createElement('td');
          const episodesInput = fieldControlRegistry.create('number', {
            className: 'table-input compact-number',
            min: 1,
            step: 1,
            value: Number(production.episode_count) || options.currentProductionEpisodes(production.id).length || 1,
            onInput: (value) => options.updateProductionEpisodeCount(production.id, value),
          });
          episodesCell.appendChild(episodesInput);
          row.appendChild(episodesCell);

          const formatCell = documentRef.createElement('td');
          formatCell.textContent = `${Number(production.page_width) || 1920}x${Number(production.page_height) || 1080}`;
          row.appendChild(formatCell);

          const importCell = documentRef.createElement('td');
          importCell.textContent = options.labelForImportModel(state.importModels, production.import_model_id);
          row.appendChild(importCell);
          tbody.appendChild(row);
        });
        table.appendChild(tbody);
        els.productionList.appendChild(table);
      }
      const hasProduction = !!options.selectedProduction();
      if (els.duplicateProductionBtn) els.duplicateProductionBtn.disabled = !hasProduction;
      if (els.deleteProductionBtn) els.deleteProductionBtn.disabled = !hasProduction;
    }

    function renderProductionLayoutControls() {
      const production = options.selectedProduction();
      const layout = options.getProductionLayout();
      if (els.productionPageWidthInput) {
        els.productionPageWidthInput.value = String(layout.page_width);
        els.productionPageWidthInput.disabled = !production;
      }
      if (els.productionPageHeightInput) {
        els.productionPageHeightInput.value = String(layout.page_height);
        els.productionPageHeightInput.disabled = !production;
      }
      if (els.productionPreviewBackgroundInput) {
        els.productionPreviewBackgroundInput.value = options.normalizeColor(layout.preview_background);
        els.productionPreviewBackgroundInput.disabled = !production;
      }
    }

    function renderProductionImportModelControl() {
      if (!els.productionImportModelSelect) return;
      const production = options.selectedProduction();
      els.productionImportModelSelect.innerHTML = '';
      const models = options.importModelOptions(state.importModels);
      models.forEach((model) => {
        const option = documentRef.createElement('option');
        option.value = model.id;
        option.textContent = model.label || model.id;
        els.productionImportModelSelect.appendChild(option);
      });
      els.productionImportModelSelect.value = production && production.import_model_id
        ? production.import_model_id
        : models[0].id;
      els.productionImportModelSelect.disabled = !production || !models.length;
    }

    function updateXlsxStatus() {
      if (!els.xlsxFileStatus) return;
      const name = options.currentXlsxName(state.source, state.structure);
      els.xlsxFileStatus.textContent = name ? `Archivo asociado: ${name}` : 'Sin archivo asociado';
      if (els.openXlsxBtn) els.openXlsxBtn.textContent = name ? 'Cambiar archivo' : 'Asociar archivo';
      options.updateReferenceVideoStatus();
      if (els.copyEpisodeStylesBtn) {
        els.copyEpisodeStylesBtn.disabled = !state.selectedProductionId || !state.selectedEpisodeId || !state.structure;
      }
    }

    function showEpisodeStyleSourceModal(sources) {
      return new Promise((resolve) => {
        const overlay = documentRef.createElement('div');
        overlay.className = 'modal-overlay';
        const modal = documentRef.createElement('div');
        modal.className = 'app-modal';
        const title = documentRef.createElement('h2');
        title.textContent = 'Aplicar presentación de otro modelo o capítulo';
        const text = documentRef.createElement('p');
        text.textContent = 'Se buscarán bloques equivalentes. Los estilos y overrides se copiarán cuando exista una coincidencia razonable; las agrupaciones solo cambiarán si la correspondencia es exacta y completa. Las imágenes del capítulo actual se conservarán.';
        const select = fieldControlRegistry.create('select', {
          className: 'text-input',
          options: sources.map((source) => ({
            value: source.id,
            label: source.label,
          })),
        });
        const actions = documentRef.createElement('div');
        actions.className = 'modal-actions';
        const cancelButton = documentRef.createElement('button');
        cancelButton.type = 'button';
        cancelButton.textContent = 'Cancelar';
        const applyButton = documentRef.createElement('button');
        applyButton.type = 'button';
        applyButton.className = 'primary';
        applyButton.textContent = 'Continuar';
        const close = (value) => {
          overlay.remove();
          resolve(value);
        };
        cancelButton.addEventListener('click', () => close(null));
        applyButton.addEventListener('click', () => close(select.value));
        overlay.addEventListener('click', (event) => {
          if (event.target === overlay) close(null);
        });
        actions.appendChild(cancelButton);
        actions.appendChild(applyButton);
        modal.appendChild(title);
        modal.appendChild(text);
        modal.appendChild(select);
        modal.appendChild(actions);
        overlay.appendChild(modal);
        documentRef.body.appendChild(overlay);
        select.focus();
      });
    }

    function renderSelect(select, items, selectedId, emptyLabel, labelForItem) {
      if (!select) return;
      select.innerHTML = '';
      if (!items.length) {
        const option = documentRef.createElement('option');
        option.value = '';
        option.textContent = emptyLabel;
        select.appendChild(option);
        select.disabled = true;
        return;
      }
      select.disabled = false;
      items.forEach((item) => {
        const option = documentRef.createElement('option');
        option.value = String(item.id);
        option.textContent = labelForItem(item);
        select.appendChild(option);
      });
      select.value = selectedId ? String(selectedId) : String(items[0].id);
    }

    return {
      renderProductionList,
      renderProjectSelectors,
      showEpisodeStyleSourceModal,
      updateXlsxStatus,
    };
  }

  root.CreditosProjectPanel = {
    createProjectPanel,
  };
})(globalThis);
