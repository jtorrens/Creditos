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

    function updateBaseTypographyFamily(fontFamily) {
      if (!options.selectedProduction()) return;
      const family = String(fontFamily || '').trim();
      if (!family) return;
      const settings = options.getProductionSettings();
      const typography = { ...(settings.typography || {}) };
      (options.typographyFields || []).forEach(([key]) => {
        const current = typography[key] || {};
        const currentWeight = typeof options.normalizeFontWeight === 'function'
          ? options.normalizeFontWeight(current.font_weight, current.font_style)
          : Number(current.font_weight) || 400;
        const nextStyle = closestFontStyle(family, currentWeight, current.font_style);
        typography[key] = {
          ...current,
          font_family: family,
          font_weight: currentWeight,
          font_style: nextStyle.style,
          font_postscript_name: nextStyle.postscript_name,
        };
      });
      settings.typography = typography;
      options.setSelectedProductionLocalFields({ settings: options.stripProductionLayoutFromSettings(settings) });
      options.persistSelectedProductionFields({ settings: options.selectedProduction().settings }).catch((error) => console.warn(error));
      state.render = state.source ? options.buildCurrentRenderJson(state.source, state.materials, state.structure) : state.render;
      options.renderSettings();
      options.renderStylesPane();
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function closestFontStyle(fontFamily, weight, currentStyle) {
      const styles = typeof options.getFontStyles === 'function' ? options.getFontStyles(fontFamily) : [];
      const targetWeight = typeof options.normalizeFontWeight === 'function'
        ? options.normalizeFontWeight(weight, currentStyle)
        : Number(weight) || 400;
      const targetItalic = /italic|oblique/i.test(currentStyle || '');
      const samePosture = styles.filter((fontStyle) => /italic|oblique/i.test(fontStyle.style || '') === targetItalic);
      const candidates = samePosture.length ? samePosture : styles;
      return candidates
        .slice()
        .sort((a, b) => {
          const aWeight = typeof options.fontWeightFromStyle === 'function' ? options.fontWeightFromStyle(a.style) : 400;
          const bWeight = typeof options.fontWeightFromStyle === 'function' ? options.fontWeightFromStyle(b.style) : 400;
          const weightScore = Math.abs(aWeight - targetWeight) - Math.abs(bWeight - targetWeight);
          if (weightScore !== 0) return weightScore;
          const aRegular = /regular|book|normal/i.test(a.style || '') ? 0 : 1;
          const bRegular = /regular|book|normal/i.test(b.style || '') ? 0 : 1;
          return aRegular - bRegular;
        })[0] || { style: 'Regular', postscript_name: '' };
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

    async function copyCartelaStyle(sourceId, targetId) {
      if (!state.structure || !Array.isArray(state.structure.cartelas) || sourceId === targetId) return;
      const source = state.structure.cartelas.find((cartela) => cartela.id === sourceId);
      const target = state.structure.cartelas.find((cartela) => cartela.id === targetId);
      if (!source || !target) return;
      const sourceName = cartelaName(source);
      const targetName = cartelaName(target);
      const message = `¿Copiar el estilo y sus overrides de “${sourceName}” a “${targetName}”? El nombre, los bloques y el contenido de “${targetName}” se conservarán.`;
      const native = options.nativeBridge();
      let confirmed = false;
      if (native && native.confirm) {
        const result = await native.confirm({ title: 'Copiar estilo de cartela', message, confirmLabel: 'Copiar estilo' });
        confirmed = !!(result && result.confirmed);
      } else {
        confirmed = options.windowRef.confirm(message);
      }
      if (!confirmed) return;

      options.applyExplicitCartelaOverridesFromSource(target, source, source, { includeSourceRefs: false });
      state.selectedCartelaId = target.id;
      state.render = options.buildCurrentRenderJson(state.source, state.materials, state.structure);
      options.renderCartelaList();
      options.renderEditor();
      options.renderPreview();
      options.refreshPdfIfActive();
      options.scheduleAutosave();
    }

    function cartelaName(cartela) {
      const ref = cartela && cartela.pages && cartela.pages[0] && cartela.pages[0].source_refs && cartela.pages[0].source_refs[0];
      const material = state.materials.find((candidate) => candidate.id === ref);
      return cartela.title || (material && material.title) || cartela.id;
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

    function resetSelectedCartelaBlockTypographyFieldOverride(key, fields) {
      const cartela = options.getSelectedCartela();
      if (!options.resetCartelaBlockTypographyFieldOverrideInDomain(cartela, key, fields)) return;
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

    function resetSelectedCartelaTitleTypographyFieldOverride(fields) {
      const cartela = options.getSelectedCartela();
      if (!options.resetCartelaTitleTypographyFieldOverrideInDomain(cartela, fields)) return;
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

    function updateSelectedCartelaAnimation(animation) {
      const cartela = options.getSelectedCartela();
      if (!cartela) return;
      cartela.animation = options.normalizeStyleAnimation(animation || {});
      state.render = state.source && state.structure ? options.buildCurrentRenderJson(state.source, state.materials, state.structure) : state.render;
      options.renderEditor();
      options.renderPreview();
      options.renderCartelaPreview();
      options.refreshPdfIfActive();
    }

    function resetSelectedCartelaAnimationOverride() {
      const cartela = options.getSelectedCartela();
      if (!cartela || !Object.prototype.hasOwnProperty.call(cartela, 'animation')) return;
      delete cartela.animation;
      state.render = state.source && state.structure ? options.buildCurrentRenderJson(state.source, state.materials, state.structure) : state.render;
      options.renderEditor();
      options.renderPreview();
      options.renderCartelaPreview();
      options.refreshPdfIfActive();
    }

    function updateStyleAfterOverrideChange(style) {
      options.pruneCurrentRedundantStyleDefaults();
      state.render = state.source && state.structure ? options.buildCurrentRenderJson(state.source, state.materials, state.structure) : state.render;
      options.scheduleStyleAutosave(style.id);
      const renderPromise = options.renderStylesPane();
      options.renderPreview();
      options.refreshPdfIfActive();
      return renderPromise;
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
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function updateEditableStyleBlockAlignment(style, key, value) {
      if (!options.updateStyleBlockAlignmentInDomain(style, key, value)) return;
      options.pruneCurrentRedundantStyleDefaults();
      state.render = state.source && state.structure ? options.buildCurrentRenderJson(state.source, state.materials, state.structure) : state.render;
      options.scheduleStyleAutosave(style.id);
      options.renderStylesPane();
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

    function resetEditableStyleTitleTypographyFieldOverride(style, fields) {
      if (!options.resetStyleTitleTypographyFieldOverrideInDomain(style, fields)) return;
      updateStyleAfterOverrideChange(style);
    }

    function updateEditableStyleTypography(style, key, fields) {
      if (!options.updateStyleTypographyInDomain(style, key, fields)) return;
      options.pruneCurrentRedundantStyleDefaults();
      state.render = state.source && state.structure ? options.buildCurrentRenderJson(state.source, state.materials, state.structure) : state.render;
      options.scheduleStyleAutosave(style.id);
      options.renderStylesPane();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function updateEditableStyleAnimation(style, animation) {
      if (!style) return;
      style.animation = options.normalizeStyleAnimation(animation || {});
      state.render = state.source && state.structure ? options.buildCurrentRenderJson(state.source, state.materials, state.structure) : state.render;
      options.scheduleStyleAutosave(style.id);
      options.renderStylesPane();
      options.renderPreview();
      options.refreshPdfIfActive();
    }

    function resetEditableStyleTypographyOverride(style, key) {
      if (!options.resetStyleTypographyOverrideInDomain(style, key)) return;
      updateStyleAfterOverrideChange(style);
    }

    function resetEditableStyleTypographyFieldOverride(style, key, fields) {
      if (!options.resetStyleTypographyFieldOverrideInDomain(style, key, fields)) return;
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
        version: 3,
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
        version: 3,
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
      const productionType = options.els.newProductionTypeSelect.value;
      const seasonCount = Math.max(1, Math.round(Number(options.els.newProductionSeasonCountInput.value) || 1));
      const episodeCount = Math.max(1, Math.round(Number(options.els.newProductionEpisodeCountInput.value) || 1));
      if (!name) {
        options.windowRef.alert('Escribe el nombre de la producción.');
        return;
      }
      try {
        const overview = await options.dbPost('/api/db/create-production', {
          name,
          production_type: productionType,
          season_count: productionType === 'SERIES' ? seasonCount : null,
          episodes_per_season: productionType === 'SERIES' ? episodeCount : null,
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
      const previousModelId = options.selectedImportModelIdInDomain(options.selectedProduction(), state.importModels);
      const fields = {
        import_model_id: options.els.productionImportModelSelect.value || options.defaultImportModelIdInDomain(state.importModels),
      };
      if (fields.import_model_id === previousModelId) return;
      try {
        await options.flushCurrentEpisode();
        options.setSelectedProductionLocalFields(fields);
        options.renderProductionList();
        await options.persistSelectedProductionFields(fields);
        await options.loadCurrentEpisode();
      } catch (error) {
        options.windowRef.alert('No se pudo actualizar el modelo de importación: ' + error.message);
        await options.initializeDatabase({ silent: true });
      }
    }

    async function copyStylesFromEpisodeFlow() {
      if (!state.databasePath || !state.selectedProductionId || !state.selectedEpisodeId || !state.structure) {
        options.windowRef.alert('Selecciona una producción y un capítulo antes de aplicar otra presentación.');
        return;
      }

      try {
        const available = await options.dbPost('/api/db/list-structure-sources', {
          production_id: state.selectedProductionId,
        });
        const currentModelId = options.selectedImportModelIdInDomain(options.selectedProduction(), state.importModels);
        const episodesById = new Map(options.currentProductionEpisodes().map((episode) => [String(episode.id), episode]));
        const modelsById = new Map((state.importModels || []).map((model) => [String(model.id), model]));
        const candidates = (available.sources || [])
          .filter((source) => String(source.episode_id) !== String(state.selectedEpisodeId)
            || String(source.import_model_id) !== String(currentModelId))
          .map((source, index) => {
            const episode = episodesById.get(String(source.episode_id));
            const model = modelsById.get(String(source.import_model_id));
            const episodeLabel = episode && episode.name
              ? episode.name
              : `Capítulo ${episode ? episode.episode_number : source.episode_id}`;
            return {
              ...source,
              id: `presentation_source_${index}`,
              label: `${episodeLabel} · ${model ? model.label : source.import_model_id}`,
            };
          });
        if (!candidates.length) {
          options.windowRef.alert('No hay otro modelo o capítulo con datos guardados en esta producción.');
          return;
        }
        const selectedSourceId = await options.showEpisodeStyleSourceModal(candidates);
        if (!selectedSourceId) return;
        const selectedSource = candidates.find((source) => source.id === selectedSourceId);
        if (!selectedSource) return;
        const result = await options.dbPost('/api/db/load-episode', {
          production_id: state.selectedProductionId,
          episode_id: selectedSource.episode_id,
          import_model_id: selectedSource.import_model_id,
        });
        if (!result.source || !result.structure) {
          options.windowRef.alert('El origen elegido no contiene una fuente y estructura utilizables.');
          return;
        }
        const source = options.normalizeSource(
          result.source,
          result.source.meta && result.source.meta.loaded_file
        );
        const sourceMaterials = options.createMaterialsFromSource(source);
        const sourceStructure = options.migrateStructure(result.structure);
        const transferred = options.transferStructurePresentation(
          state.structure,
          state.materials,
          sourceStructure,
          sourceMaterials,
          (target, sourceCartela, sourceRaw) => options.applyExplicitCartelaOverridesFromSource(
            target,
            sourceCartela,
            sourceRaw,
            { includeSourceRefs: false }
          ),
          result.structure
        );
        const report = transferred.report;
        if (!report.matched_materials) {
          options.windowRef.alert('No se encontraron bloques equivalentes. El capítulo actual no se ha modificado.');
          return;
        }
        const protection = report.protected_image_cartelas
          ? ` ${report.protected_image_cartelas} cartela(s) con imágenes conservarán también su agrupación.`
          : '';
        const images = report.copied_images
          ? ` Se copiarán ${report.copied_images} imagen(es) a ${report.copied_image_cartelas} cartela(s) vacías.`
          : '';
        const createdImageCartelas = report.created_image_cartelas
          ? ` Se crearán ${report.created_image_cartelas} cartela(s) gráfica(s) ancladas a un bloque exacto.`
          : '';
        const ambiguousImages = report.ambiguous_image_cartelas
          ? ` ${report.ambiguous_image_cartelas} posible(s) destino(s) de imagen se omitirán por ambigüedad.`
          : '';
        const message = `Se han encontrado ${report.exact_matches} coincidencia(s) exacta(s) y ${report.approximate_matches} aproximada(s). Se aplicará presentación a ${report.styled_cartelas} cartela(s) y se unirán ${report.grouped_cartelas} agrupación(es) exactas. ${report.unmatched_materials} bloque(s) quedarán sin cambios.${images}${createdImageCartelas}${ambiguousImages}${protection}`;
        const native = options.nativeBridge();
        let confirmed = false;
        if (native && native.confirm) {
          const confirmation = await native.confirm({
            title: 'Aplicar presentación',
            message,
            confirmLabel: 'Aplicar',
          });
          confirmed = !!(confirmation && confirmation.confirmed);
        } else {
          confirmed = options.windowRef.confirm(message);
        }
        if (!confirmed) return;
        state.structure = transferred.structure;
        if (!(state.structure.cartelas || []).some((cartela) => cartela.id === state.selectedCartelaId)) {
          state.selectedCartelaId = state.structure.cartelas[0] ? state.structure.cartelas[0].id : null;
        }
        options.rebuild();
        options.windowRef.alert(`Presentación aplicada desde "${selectedSource.label}". ${report.styled_cartelas} cartela(s) actualizadas; ${report.grouped_cartelas} agrupación(es) exactas y ${report.copied_images} imagen(es) copiadas.`);
      } catch (error) {
        options.windowRef.alert('No se pudo aplicar la presentación: ' + error.message);
      }
    }

    return {
      addEmptyCartela,
      adjustCurrentPdfPageLines,
      changePdfPage,
      copyCartelaStyle,
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
      resetEditableStyleTitleTypographyFieldOverride,
      resetEditableStyleTitleTypographyOverride,
      resetEditableStyleTypographyFieldOverride,
      resetEditableStyleTypographyOverride,
      resetSelectedCartelaBlockAlignmentOverride,
      resetSelectedCartelaBlockOverride,
      resetSelectedCartelaBlockTypographyFieldOverride,
      resetSelectedCartelaBlockTypographyOverride,
      resetSelectedCartelaAnimationOverride,
      resetSelectedCartelaTitleTypographyFieldOverride,
      resetSelectedCartelaTitleTypographyOverride,
      resetSelectedCartelaOverride,
      updateEditableStyleBlock,
      updateEditableStyleBlockAlignment,
      updateEditableStyleCartela,
      updateEditableStyleAnimation,
      updateEditableStyleTitleTypography,
      updateEditableStyleTypography,
      updateProductionImportModelFromUi,
      updateProductionLayoutFromUi,
      updateProductionName,
      updateCurrentPdfCartela,
      updateStyleAfterOverrideChange,
      updateStyleName,
      updateSelectedCartelaBlockAlignment,
      updateSelectedCartelaBlockStyle,
      updateSelectedCartelaBlockTypography,
      updateSelectedCartelaAnimation,
      updateSelectedCartelaTitleTypography,
      updateLayoutSetting,
      updateBaseTypographyFamily,
      updateSelectedCartela,
      updateSettings,
      updateTypographySetting,
    };
  }

  root.CreditosAppCommands = {
    createAppCommands,
  };
})(globalThis);
