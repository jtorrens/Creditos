(function (root) {
  function createAppCommands(options = {}) {
    const state = options.state;

    function updateTypographySetting(key, fields) {
      if (!options.selectedProduction()) return;
      const settings = options.getProductionSettings();
      settings.typography[key] = {
        ...settings.typography[key],
        ...fields,
      };
      options.setSelectedProductionLocalFields({ settings: options.stripProductionLayoutFromSettings(settings) });
      options.persistSelectedProductionFields({ settings: options.selectedProduction().settings }).catch((error) => console.warn(error));
      state.render = state.source ? options.buildCurrentRenderJson(state.source, state.materials, state.structure) : state.render;
      options.renderStylesPane();
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function updateLayoutSetting(fields) {
      if (!options.selectedProduction()) return;
      const settings = options.getProductionSettings();
      settings.layout = {
        ...settings.layout,
        ...fields,
      };
      options.setSelectedProductionLocalFields({ settings: options.stripProductionLayoutFromSettings(settings) });
      options.persistSelectedProductionFields({ settings: options.selectedProduction().settings }).catch((error) => console.warn(error));
      state.render = state.source ? options.buildCurrentRenderJson(state.source, state.materials, state.structure) : state.render;
      options.renderStylesPane();
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function updateSettings(fields) {
      if (!options.selectedProduction()) return;
      const settings = {
        ...options.getProductionSettings(),
        ...fields,
      };
      options.setSelectedProductionLocalFields({ settings: options.stripProductionLayoutFromSettings(settings) });
      options.persistSelectedProductionFields({ settings: options.selectedProduction().settings }).catch((error) => console.warn(error));
      if (state.source) {
        state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      }
      options.renderSettings();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function syncAnimationFrameToPdfPage() {
      const plan = options.getPreviewAnimationPlan();
      if (!plan || !plan.totalFrames) return;
      state.previewAnimation.frame = options.frameForPdfPageIndex(
        plan,
        state.pdfPageIndex,
        options.getCurrentPhysicalPages()
      );
      if (state.previewAnimation.playing) {
        state.previewAnimation.startedAt = performance.now();
        state.previewAnimation.startFrame = state.previewAnimation.frame;
      }
    }

    function changePdfPage(delta) {
      const total = state.render ? options.getCurrentPhysicalPages().length : 0;
      state.pdfPageIndex = Math.max(0, Math.min(total - 1, state.pdfPageIndex + delta));
      syncAnimationFrameToPdfPage();
      options.renderPdfPreview();
    }

    function goToPdfPage(index) {
      const total = state.render ? options.getCurrentPhysicalPages().length : 0;
      if (!total) {
        state.pdfPageIndex = 0;
      } else {
        state.pdfPageIndex = Math.max(0, Math.min(total - 1, index));
      }
      syncAnimationFrameToPdfPage();
      options.renderPdfPreview();
    }

    function adjustCurrentPdfPageLines(delta) {
      if (!state.render || !state.structure) return;
      const page = options.getCurrentPhysicalPages()[state.pdfPageIndex];
      if (!page) return;
      state.structure.page_line_adjustments = state.structure.page_line_adjustments || {};
      options.adjustPdfPageLineAdjustment(
        state.structure.page_line_adjustments,
        page.id,
        options.getProductionSettings().default_auto_page_lines,
        delta
      );
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderPreview();
      options.renderPdfPreview();
    }

    function updateCurrentPdfCartela(fields) {
      if (!state.render || !state.structure) return;
      const page = options.getCurrentPhysicalPages()[state.pdfPageIndex];
      if (!page || !page.cartela) return;
      const cartela = (state.structure.cartelas || []).find((candidate) => candidate.id === page.cartela.id);
      if (!cartela) return;
      const previousSelected = state.selectedCartelaId;
      state.selectedCartelaId = cartela.id;
      updateSelectedCartela(fields);
      state.selectedCartelaId = previousSelected;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderCartelaList();
      options.renderEditor();
      options.renderPreview();
      options.renderPdfPreview();
    }

    function addEmptyCartela() {
      if (!state.structure) return;
      const cartela = options.insertManualCartela(state.structure.cartelas, state.selectedCartelaId);
      if (!cartela) return;
      state.selectedCartelaId = cartela.id;
      options.rebuild();
    }

    function deleteSelectedManualCartela() {
      if (!state.structure || !Array.isArray(state.structure.cartelas)) return;
      const cartela = options.getSelectedCartela();
      if (!cartela || !cartela.manual) return;
      const confirmed = options.windowRef.confirm('Eliminar esta cartela manual?');
      if (!confirmed) return;
      const result = options.deleteManualCartela(state.structure.cartelas, cartela.id);
      if (!result.deleted) return;
      state.selectedCartelaId = result.nextCartelaId;
      options.rebuild();
    }

    function moveSelectedCartelaVisualOrder(cartelaId, delta) {
      if (!state.structure || !Array.isArray(state.structure.cartelas)) return;
      if (!options.moveCartelaVisualOrderInStructure(state.structure.cartelas, cartelaId, delta)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderCartelaList();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function updateSelectedCartela(fields) {
      const cartela = options.getSelectedCartela();
      if (!options.updateCartelaInStructure(cartela, fields)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderCartelaList();
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function resetSelectedCartelaOverride(key) {
      const cartela = options.getSelectedCartela();
      if (!options.resetCartelaOverrideInStructure(cartela, key)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderCartelaList();
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function updateSelectedCartelaBlockStyle(fields) {
      const cartela = options.getSelectedCartela();
      if (!options.updateCartelaBlockStyleInDomain(cartela, fields)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function resetSelectedCartelaBlockOverride(key) {
      const cartela = options.getSelectedCartela();
      if (!options.resetCartelaBlockOverrideInDomain(cartela, key)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function updateSelectedCartelaBlockAlignment(key, value) {
      const cartela = options.getSelectedCartela();
      if (!options.updateCartelaBlockAlignmentInDomain(cartela, key, value)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function resetSelectedCartelaBlockAlignmentOverride(key) {
      const cartela = options.getSelectedCartela();
      if (!options.resetCartelaBlockAlignmentOverrideInDomain(cartela, key)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function resetSelectedCartelaBlockTypographyOverride(key) {
      const cartela = options.getSelectedCartela();
      if (!options.resetCartelaBlockTypographyOverrideInDomain(cartela, key)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function updateSelectedCartelaBlockTypography(key, fields, commandOptions = {}) {
      const cartela = options.getSelectedCartela();
      if (!options.updateCartelaBlockTypographyInDomain(cartela, key, fields)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
      if (commandOptions.rerenderEditor) options.renderEditor();
    }

    function resetSelectedCartelaTitleTypographyOverride() {
      const cartela = options.getSelectedCartela();
      if (!options.resetCartelaTitleTypographyOverrideInDomain(cartela)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderEditor();
      options.renderPreview();
      options.renderCartelaPreview();
      options.refreshPdfIfActive();
    }

    function updateSelectedCartelaTitleTypography(fields, commandOptions = {}) {
      const cartela = options.getSelectedCartela();
      if (!cartela) return;
      const base = options.getEffectiveStyleTitleTypography(options.getStyleById(cartela.style_id)).page_header;
      if (!options.updateCartelaTitleTypographyInDomain(cartela, fields, base)) return;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderCartelaList();
      options.renderPreview();
      options.renderCartelaPreview();
      options.refreshPdfIfActive();
      if (commandOptions.rerenderEditor) options.renderEditor();
    }

    function updateStyleAfterOverrideChange(style) {
      options.pruneCurrentRedundantStyleDefaults();
      state.render = state.source && state.structure ? options.buildCurrentRenderJson(state.source, state.materials, state.structure) : state.render;
      options.scheduleStyleAutosave(style.id);
      options.renderStylesPane();
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function updateEditableStyleCartela(style, fields) {
      if (!options.updateStyleCartelaInDomain(style, fields)) return;
      options.pruneCurrentRedundantStyleDefaults();
      state.render = state.source && state.structure ? options.buildCurrentRenderJson(state.source, state.materials, state.structure) : state.render;
      options.scheduleStyleAutosave(style.id);
      options.renderStylesPane();
      options.renderCartelaList();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function resetEditableStyleCartelaOverride(style, key) {
      if (!options.resetStyleCartelaOverrideInDomain(style, key)) return;
      updateStyleAfterOverrideChange(style);
    }

    function updateEditableStyleBlock(style, fields) {
      if (!options.updateStyleBlockInDomain(style, fields)) return;
      options.pruneCurrentRedundantStyleDefaults();
      state.render = state.source && state.structure ? options.buildCurrentRenderJson(state.source, state.materials, state.structure) : state.render;
      options.scheduleStyleAutosave(style.id);
      options.renderStylesPane();
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function updateEditableStyleBlockAlignment(style, key, value) {
      if (!options.updateStyleBlockAlignmentInDomain(style, key, value)) return;
      options.pruneCurrentRedundantStyleDefaults();
      state.render = state.source && state.structure ? options.buildCurrentRenderJson(state.source, state.materials, state.structure) : state.render;
      options.scheduleStyleAutosave(style.id);
      options.renderStylesPane();
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function resetEditableStyleBlockOverride(style, key) {
      if (!options.resetStyleBlockOverrideInDomain(style, key)) return;
      updateStyleAfterOverrideChange(style);
    }

    function resetEditableStyleBlockAlignmentOverride(style, key) {
      if (!options.resetStyleBlockAlignmentOverrideInDomain(style, key)) return;
      updateStyleAfterOverrideChange(style);
    }

    function updateEditableStyleTitleTypography(style, fields) {
      const base = options.getProductionSettings().typography.page_header;
      if (!options.updateStyleTitleTypographyInDomain(style, fields, base)) return;
      updateStyleAfterOverrideChange(style);
    }

    function resetEditableStyleTitleTypographyOverride(style) {
      if (!options.resetStyleTitleTypographyOverrideInDomain(style)) return;
      updateStyleAfterOverrideChange(style);
    }

    function updateEditableStyleTypography(style, key, fields) {
      if (!options.updateStyleTypographyInDomain(style, key, fields)) return;
      options.pruneCurrentRedundantStyleDefaults();
      state.render = state.source && state.structure ? options.buildCurrentRenderJson(state.source, state.materials, state.structure) : state.render;
      options.scheduleStyleAutosave(style.id);
      options.renderStylesPane();
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function updateEditableStyleAnimation(style, animation) {
      if (!style) return;
      style.animation = options.normalizeStyleAnimation(animation || {});
      options.scheduleStyleAutosave(style.id);
      options.renderStylesPane();
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function resetEditableStyleTypographyOverride(style, key) {
      if (!options.resetStyleTypographyOverrideInDomain(style, key)) return;
      updateStyleAfterOverrideChange(style);
    }

    function updateStyleName(style, name) {
      if (!style) return;
      const cleanName = String(name || '').trim();
      if (!cleanName) {
        options.renderStylesPane();
        return;
      }
      style.name = cleanName;
      options.scheduleStyleAutosave(style.id);
      options.renderCartelaList();
      options.renderStylesPane();
    }

    async function createStyleFromUi() {
      if (!state.selectedProductionId) {
        options.windowRef.alert('Selecciona primero una producción.');
        return;
      }
      const id = options.uniqueStyleId(state.styles, 'nuevo_estilo');
      const style = {
        schema: 'credits_cartela_style_json',
        version: 2,
        id,
        name: 'Nuevo estilo',
        file_name: `${id}.json`,
        cartela: {},
        title_typography: {},
        block: {},
      };
      state.styles.push(style);
      state.selectedStyleId = id;
      await options.writeStyleFile(style);
      options.renderStylesPane();
    }

    async function duplicateSelectedStyle() {
      const source = options.getStyleById(state.selectedStyleId);
      if (!source || !state.selectedProductionId) return;
      const id = options.uniqueStyleId(state.styles, options.safeStyleId(`${source.id}_copia`));
      const style = {
        schema: 'credits_cartela_style_json',
        version: 2,
        id,
        name: `${source.name} copia`,
        file_name: `${id}.json`,
        cartela: options.sanitizeStyleCartelaOverrides(source.cartela || {}),
        title_typography: options.normalizeTitleTypographyOverrides(source.title_typography || {}),
        block: options.sanitizeStyleBlockOverrides(source.block || {}),
      };
      state.styles.push(style);
      state.styles.sort((a, b) => a.name.localeCompare(b.name));
      state.selectedStyleId = id;
      await options.writeStyleFile(style);
      options.renderStylesPane();
    }

    async function deleteSelectedStyle() {
      const style = options.getStyleById(state.selectedStyleId);
      if (!style || !state.selectedProductionId) return;
      const native = options.nativeBridge();
      let confirmed = false;
      if (native && native.confirm) {
        const result = await native.confirm({
          title: 'Borrar estilo',
          message: `Borrar el estilo "${style.name}"? Las cartelas que lo usen quedarán sin estilo.`,
          confirmLabel: 'Borrar',
        });
        confirmed = !!(result && result.confirmed);
      } else {
        confirmed = options.windowRef.confirm(`Borrar el estilo "${style.name}"? Las cartelas que lo usen quedarán sin estilo.`);
      }
      if (!confirmed) return;
      try {
        await options.dbPost('/api/db/delete-style', {
          production_id: state.selectedProductionId,
          style_id: style.id,
        });
        if (state.structure && Array.isArray(state.structure.cartelas)) {
          state.structure.cartelas.forEach((cartela) => {
            if (cartela.style_id === style.id) {
              cartela.style_id = '';
              options.clearCartelaStyleOverrides(cartela);
            }
          });
        }
        state.styles = state.styles.filter((candidate) => candidate.id !== style.id);
        state.selectedStyleId = state.styles[0] ? state.styles[0].id : null;
        if (state.source && state.structure) state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
        options.renderStylesPane();
        options.renderCartelaList();
        options.renderEditor();
        options.renderPreview();
        options.refreshPdfIfActive();
      } catch (error) {
        options.windowRef.alert('No se pudo borrar el estilo: ' + error.message);
      }
    }

    async function updateProductionName(productionId, name) {
      const cleanName = String(name || '').trim();
      if (!cleanName) {
        options.renderProjectSelectors();
        return;
      }
      try {
        const overview = await options.dbPost('/api/db/update-production', {
          production_id: productionId,
          fields: { name: cleanName },
        });
        options.applyDatabaseOverview(overview);
      } catch (error) {
        options.windowRef.alert('No se pudo renombrar la producción: ' + error.message);
        options.renderProjectSelectors();
      }
    }

    async function updateProductionEpisodeCount(productionId, value) {
      const production = state.productions.find((candidate) => String(candidate.id) === String(productionId));
      if (!production) return;
      const nextCount = Math.max(1, Math.round(Number(value) || 1));
      const currentEpisodes = options.currentProductionEpisodes(productionId);
      const currentCount = Math.max(
        Number(production.episode_count) || 0,
        ...currentEpisodes.map((episode) => Number(episode.episode_number) || 0),
        1
      );
      if (nextCount < currentCount) {
        const deletedEpisodes = currentEpisodes.filter((episode) => Number(episode.episode_number) > nextCount);
        const withDocuments = deletedEpisodes.filter((episode) => !!episode.has_documents);
        if (withDocuments.length) {
          const names = withDocuments.map((episode) => episode.name || `Episodio ${episode.episode_number}`).join(', ');
          const native = options.nativeBridge();
          let confirmed = false;
          if (native && native.confirm) {
            const result = await native.confirm({
              title: 'Reducir capítulos',
              message: `Vas a borrar capítulos con archivos/datos asociados: ${names}.`,
              confirmLabel: 'Borrar capítulos',
            });
            confirmed = !!(result && result.confirmed);
          } else {
            confirmed = options.windowRef.confirm(`Vas a borrar capítulos con archivos/datos asociados: ${names}. Continuar?`);
          }
          if (!confirmed) {
            options.renderProjectSelectors();
            return;
          }
        }
      }

      try {
        const overview = await options.dbPost('/api/db/update-production', {
          production_id: productionId,
          fields: { episode_count: nextCount },
        });
        options.applyDatabaseOverview(overview);
      } catch (error) {
        options.windowRef.alert('No se pudo actualizar el número de capítulos: ' + error.message);
        options.renderProjectSelectors();
      }
    }

    async function duplicateSelectedProduction() {
      const production = options.selectedProduction();
      if (!production) return;
      try {
        const overview = await options.dbPost('/api/db/duplicate-production', {
          production_id: production.id,
        });
        state.selectedProductionId = overview.production_id;
        state.selectedEpisodeId = null;
        options.applyDatabaseOverview(overview);
      } catch (error) {
        options.windowRef.alert('No se pudo duplicar la producción: ' + error.message);
      }
    }

    async function deleteSelectedProduction() {
      const production = options.selectedProduction();
      if (!production) return;
      const native = options.nativeBridge();
      let confirmed = false;
      if (native && native.confirm) {
        const result = await native.confirm({
          title: 'Borrar producción',
          message: `Borrar "${production.name}" y todos sus episodios, estilos y documentos?`,
          confirmLabel: 'Borrar',
        });
        confirmed = !!(result && result.confirmed);
      } else {
        confirmed = options.windowRef.confirm(`Borrar "${production.name}" y todos sus episodios, estilos y documentos?`);
      }
      if (!confirmed) return;
      try {
        const overview = await options.dbPost('/api/db/delete-production', {
          production_id: production.id,
        });
        state.selectedProductionId = null;
        state.selectedEpisodeId = null;
        state.source = null;
        state.referenceVideo = null;
        state.materials = [];
        state.structure = null;
        state.render = null;
        options.applyDatabaseOverview(overview);
        options.renderCartelaList();
        options.renderEditor();
        options.renderStylesPane();
        options.renderPreview();
        options.refreshPdfIfActive();
      } catch (error) {
        options.windowRef.alert('No se pudo borrar la producción: ' + error.message);
      }
    }

    async function createProductionFromUi() {
      if (!state.databasePath) {
        options.windowRef.alert('La base de datos todavía se está inicializando.');
        return;
      }
      const name = options.els.newProductionNameInput.value.trim();
      const episodeCount = Math.max(1, Math.round(Number(options.els.newProductionEpisodeCountInput.value) || 1));
      if (!name) {
        options.windowRef.alert('Escribe el nombre de la producción.');
        return;
      }
      try {
        const overview = await options.dbPost('/api/db/create-production', {
          name,
          episode_count: episodeCount,
          page_width: 1920,
          page_height: 1080,
          preview_background: '#ffffff',
          import_model_id: options.defaultImportModelIdInDomain(state.importModels),
        });
        state.selectedProductionId = overview.production_id;
        state.selectedEpisodeId = null;
        options.els.newProductionNameInput.value = '';
        if (options.els.productionCreateBox) options.els.productionCreateBox.classList.remove('open');
        options.applyDatabaseOverview(overview);
      } catch (error) {
        options.windowRef.alert('No se pudo crear la producción: ' + error.message);
      }
    }

    async function updateProductionLayoutFromUi() {
      if (!state.selectedProductionId) return;
      const fields = {
        page_width: Math.max(1, Number(options.els.productionPageWidthInput.value) || 1920),
        page_height: Math.max(1, Number(options.els.productionPageHeightInput.value) || 1080),
        preview_background: options.normalizeColor(options.els.productionPreviewBackgroundInput.value || '#ffffff'),
      };
      options.setSelectedProductionLocalFields(fields);
      try {
        await options.persistSelectedProductionFields(fields);
        if (state.source && state.structure) {
          state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
          options.renderSettings();
          options.renderEditor();
          options.renderStylesPane();
          options.renderPreview();
          options.refreshPdfIfActive();
        }
      } catch (error) {
        options.windowRef.alert('No se pudo actualizar el formato de producción: ' + error.message);
      }
    }

    async function updateProductionImportModelFromUi() {
      if (!state.selectedProductionId || !options.els.productionImportModelSelect) return;
      const fields = {
        import_model_id: options.els.productionImportModelSelect.value || options.defaultImportModelIdInDomain(state.importModels),
      };
      options.setSelectedProductionLocalFields(fields);
      options.renderProductionList();
      try {
        await options.persistSelectedProductionFields(fields);
      } catch (error) {
        options.windowRef.alert('No se pudo actualizar el modelo de importación: ' + error.message);
        await options.initializeDatabase({ silent: true });
      }
    }

    async function copyStylesFromEpisodeFlow() {
      if (!state.databasePath || !state.selectedProductionId || !state.selectedEpisodeId || !state.structure) {
        options.windowRef.alert('Selecciona una producción y un capítulo antes de copiar estilos.');
        return;
      }
      const candidates = options.currentProductionEpisodes().filter((episode) => String(episode.id) !== String(state.selectedEpisodeId));
      if (!candidates.length) {
        options.windowRef.alert('No hay otros capítulos en esta producción.');
        return;
      }
      const sourceEpisodeId = await options.showEpisodeStyleSourceModal(candidates);
      if (!sourceEpisodeId) return;
      const sourceEpisode = candidates.find((episode) => String(episode.id) === String(sourceEpisodeId));
      const native = options.nativeBridge();
      const message = `Asignar a este capítulo los estilos usados en "${sourceEpisode ? sourceEpisode.name : 'otro capítulo'}"? Se copiará la asignación de estilo y solo los overrides explícitos de cartelas con el mismo ID.`;
      let confirmed = false;
      if (native && native.confirm) {
        const result = await native.confirm({ title: 'Asignar estilos', message, confirmLabel: 'Asignar estilos' });
        confirmed = !!(result && result.confirmed);
      } else {
        confirmed = options.windowRef.confirm(message);
      }
      if (!confirmed) return;

      try {
        const result = await options.dbPost('/api/db/load-episode', {
          production_id: state.selectedProductionId,
          episode_id: sourceEpisodeId,
        });
        const sourceRawById = new Map(((result.structure && result.structure.cartelas) || []).map((cartela) => [cartela.id, cartela]));
        const sourceStructure = options.migrateStructure(result.structure);
        const sourceById = new Map((sourceStructure && sourceStructure.cartelas ? sourceStructure.cartelas : []).map((cartela) => [cartela.id, cartela]));
        let assigned = 0;
        (state.structure.cartelas || []).forEach((cartela) => {
          const sourceCartela = sourceById.get(cartela.id);
          if (!sourceCartela) return;
          options.applyExplicitCartelaOverridesFromSource(cartela, sourceCartela, sourceRawById.get(cartela.id) || sourceCartela);
          assigned += 1;
        });
        state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
        options.renderCartelaList();
        options.renderEditor();
        options.renderPreview();
        options.refreshPdfIfActive();
        options.scheduleAutosave();
        options.windowRef.alert(`Estilos asignados en ${assigned} cartela${assigned === 1 ? '' : 's'}.`);
      } catch (error) {
        options.windowRef.alert('No se pudieron asignar los estilos: ' + error.message);
      }
    }

    return {
      addEmptyCartela,
      adjustCurrentPdfPageLines,
      changePdfPage,
      copyStylesFromEpisodeFlow,
      createProductionFromUi,
      createStyleFromUi,
      deleteSelectedProduction,
      deleteSelectedStyle,
      deleteSelectedManualCartela,
      duplicateSelectedProduction,
      duplicateSelectedStyle,
      goToPdfPage,
      moveSelectedCartelaVisualOrder,
      resetEditableStyleBlockAlignmentOverride,
      resetEditableStyleBlockOverride,
      resetEditableStyleCartelaOverride,
      resetEditableStyleTitleTypographyOverride,
      resetEditableStyleTypographyOverride,
      resetSelectedCartelaBlockAlignmentOverride,
      resetSelectedCartelaBlockOverride,
      resetSelectedCartelaBlockTypographyOverride,
      resetSelectedCartelaTitleTypographyOverride,
      resetSelectedCartelaOverride,
      updateEditableStyleBlock,
      updateEditableStyleBlockAlignment,
      updateEditableStyleCartela,
      updateEditableStyleAnimation,
      updateEditableStyleTitleTypography,
      updateEditableStyleTypography,
      updateProductionEpisodeCount,
      updateProductionImportModelFromUi,
      updateProductionLayoutFromUi,
      updateProductionName,
      updateCurrentPdfCartela,
      updateStyleAfterOverrideChange,
      updateStyleName,
      updateSelectedCartelaBlockAlignment,
      updateSelectedCartelaBlockStyle,
      updateSelectedCartelaBlockTypography,
      updateSelectedCartelaTitleTypography,
      updateLayoutSetting,
      updateSelectedCartela,
      updateSettings,
      updateTypographySetting,
    };
  }

  root.CreditosAppCommands = {
    createAppCommands,
  };
})(globalThis);
