(function (root) {
  function createAppSourceImport(options = {}) {
    const els = options.els;
    const state = options.state;
    const storageKeys = options.storageKeys || {};
    const windowRef = options.windowRef || root;

    async function loadXlsxFile(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      if (!state.databasePath || !state.selectedProductionId || !state.selectedEpisodeId) {
        windowRef.alert('Selecciona producción y episodio antes de importar un archivo de créditos.');
        event.target.value = '';
        return;
      }
      await parseXlsxFile(file);
      event.target.value = '';
    }

    async function openXlsxFile() {
      if (!state.databasePath || !state.selectedProductionId || !state.selectedEpisodeId) {
        windowRef.alert('Selecciona producción y episodio antes de importar un archivo de créditos.');
        return;
      }
      const native = options.nativeBridge();
      if (native && native.openXlsx) {
        try {
          const result = await native.openXlsx({ defaultPath: options.readLocalPreference(storageKeys.xlsxDir) });
          if (!result || result.canceled) return;
          options.rememberFileDirectory(storageKeys.xlsxDir, result.filePath);
          const bytes = Uint8Array.from(windowRef.atob(result.base64), (char) => char.charCodeAt(0));
          const fileName = result.name || 'creditos.xlsx';
          const file = new windowRef.File([bytes], fileName, {
            type: /\.ods$/i.test(fileName)
              ? 'application/vnd.oasis.opendocument.spreadsheet'
              : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          await parseXlsxFile(file);
        } catch (error) {
          windowRef.alert('No se pudo abrir el archivo de créditos: ' + error.message);
        }
        return;
      }
      els.xlsxInput.click();
    }

    async function parseXlsxFile(file) {
      try {
        els.sourceMeta.textContent = `Parseando ${file.name}...`;
        const form = new windowRef.FormData();
        form.append('file', file);
        form.append('import_model_id', currentSelectedImportModelId());

        const response = await windowRef.fetch('/api/parse-xlsx', { method: 'POST', body: form });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Error al interpretar el archivo de créditos.');
        await loadSourceJson(payload, file.name);
        options.updateXlsxStatus();
      } catch (error) {
        windowRef.alert(
          'No se pudo interpretar el archivo de créditos: ' +
            error.message +
            '\n\nPara asociar archivos, inicia la app desde Electron con npm start en apps/desktop, o arranca el renderer manualmente con python3 apps/renderer/server.py en macOS y py apps\\renderer\\server.py en Windows.'
        );
        options.renderMeta();
      }
    }

    function currentSelectedImportModelId() {
      return options.selectedImportModelIdInDomain(options.selectedProduction(), state.importModels);
    }

    async function loadSourceJson(json, fileName) {
      state.source = options.normalizeSource(json, fileName);
      state.materials = options.applyLockedMaterials(options.createMaterialsFromSource(state.source), state.structure);
      state.structure = options.createStructureFromSource(state.source, state.materials, state.structure);
      state.selectedCartelaId = state.structure.cartelas[0] ? state.structure.cartelas[0].id : null;
      options.rebuild();
      if (state.databasePath && state.selectedProductionId && state.selectedEpisodeId) {
        await options.dbPost('/api/db/save-document', {
          production_id: state.selectedProductionId,
          episode_id: state.selectedEpisodeId,
          kind: 'source',
          data: state.source,
        });
        await options.dbPost('/api/db/save-document', {
          production_id: state.selectedProductionId,
          episode_id: state.selectedEpisodeId,
          kind: 'structure',
          data: options.getStructureJsonForOutput(),
        });
      }
    }

    return {
      loadXlsxFile,
      openXlsxFile,
    };
  }

  root.CreditosAppSourceImport = {
    createAppSourceImport,
  };
})(globalThis);
