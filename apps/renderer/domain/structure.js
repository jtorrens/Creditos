(function (root) {
  function createStructureDomain(dependencies = {}) {
    const {
      defaultLayoutForMaterial,
      defaultOrientationForMaterial,
      getMaterialContentItems,
      groupMusicLicenseThemes,
      normalizePreviewSettings,
      normalizeTypographyOverrides,
      normalizeVerticalAlign,
    } = dependencies;

    function createStructureFromSource(source, materials, previousStructure, settings) {
      const previous = migrateStructure(previousStructure);
      const materialIds = new Set(materials.map((material) => material.id));
      const previousByRef = new Map();
      const previousOverrides = previous && previous.overrides ? previous.overrides : {};
      const sourcePageBreaks = pageBreaksFromMaterials(materials);
      const previousPreviewSettings = normalizePreviewSettings(previous && previous.preview_settings ? previous.preview_settings : {});

      if (previous && Array.isArray(previous.cartelas)) {
        previous.cartelas.forEach((cartela) => {
          const refs = getCartelaRefs(cartela);
          refs.forEach((ref) => previousByRef.set(ref, cartela));
        });
      }

      const usedPrevious = new Set();
      const cartelas = [];
      materials.forEach((material, index) => {
        const previousCartela = previousByRef.get(material.id);
        if (!previousCartela && !materialHasRenderableContent(material)) {
          return;
        }
        if (previousCartela && usedPrevious.has(previousCartela.id)) {
          return;
        }
        if (previousCartela) usedPrevious.add(previousCartela.id);
        cartelas.push(
          previousCartela
            ? normalizeCartela(previousCartela, material, index)
            : defaultCartelaForMaterial(material, index, settings)
        );
      });

      if (previous && Array.isArray(previous.cartelas)) {
        previous.cartelas.forEach((cartela) => {
          if (!usedPrevious.has(cartela.id)) {
            cartelas.push(cartela);
          }
        });
      }
      cartelas.forEach((cartela) => {
        cartela.pages = (cartela.pages || []).map((page) => normalizeCartelaPage(page));
        if (hasMissingMaterialRefs(cartela, materialIds)) {
          cartela.enabled = false;
        }
      });
      enforceUniqueMaterialRefs({ cartelas });
      addMissingMaterialsToStructure(cartelas, materials, settings);
      enforceUniqueCartelaIds(cartelas);
      ensureCartelaOrders(cartelas);
      const cleanCartelas = removeDefaultEmptyCartelas(cartelas, materials);

      return {
        schema: 'credits_structure_json',
        version: 12,
        source_sheet: source.sheet || '',
        source_file: source.meta && source.meta.loaded_file ? source.meta.loaded_file : source.source || '',
        cartelas: cleanCartelas,
        settings,
        overrides: previousOverrides,
        page_breaks: sourcePageBreaks,
        page_line_adjustments: previous && previous.page_line_adjustments ? previous.page_line_adjustments : {},
        preview_settings: previousPreviewSettings,
      };
    }

    function transferStructurePresentation(
      targetStructure,
      targetMaterials,
      sourceStructure,
      sourceMaterials,
      applyStyleSettings,
      sourceRawStructure = sourceStructure
    ) {
      const target = JSON.parse(JSON.stringify(targetStructure || {}));
      const source = migrateStructure(JSON.parse(JSON.stringify(sourceStructure || {})));
      if (!target.cartelas || !source || !source.cartelas) {
        return { structure: target, report: emptyTransferReport(targetMaterials) };
      }
      const sourceCartelaByRef = new Map();
      const sourceRawById = new Map(((sourceRawStructure && sourceRawStructure.cartelas) || [])
        .map((cartela) => [cartela.id, cartela]));
      getVisualCartelas(source.cartelas).forEach((cartela, cartelaIndex) => {
        getCartelaRefs(cartela).forEach((ref, refIndex) => {
          sourceCartelaByRef.set(ref, { cartela, cartelaIndex, refIndex });
        });
      });
      const matches = [];
      (targetMaterials || []).forEach((targetMaterial) => {
        const best = bestMaterialTransferMatch(targetMaterial, sourceMaterials || [], sourceCartelaByRef);
        if (best) matches.push({ targetMaterial, ...best });
      });
      const matchByTargetRef = new Map(matches.map((match) => [match.targetMaterial.id, match]));
      let styledCartelas = 0;
      target.cartelas.forEach((cartela) => {
        const candidates = getCartelaRefs(cartela)
          .map((ref) => matchByTargetRef.get(ref))
          .filter(Boolean);
        if (!candidates.length || typeof applyStyleSettings !== 'function') return;
        const sourceCartela = dominantSourceCartela(candidates);
        if (!sourceCartela) return;
        applyStyleSettings(cartela, sourceCartela, sourceRawById.get(sourceCartela.id) || sourceCartela);
        copyExactSourceRefSettings(cartela, candidates);
        styledCartelas += 1;
      });

      const exactGroups = new Map();
      target.cartelas.forEach((cartela) => {
        const refs = getCartelaRefs(cartela);
        if (!refs.length) return;
        const exactMatches = refs.map((ref) => matchByTargetRef.get(ref));
        if (exactMatches.some((match) => !match || match.confidence !== 'exact')) return;
        const sourceIds = new Set(exactMatches.map((match) => match.sourceCartela.id));
        if (sourceIds.size !== 1) return;
        const sourceId = exactMatches[0].sourceCartela.id;
        if (!exactGroups.has(sourceId)) exactGroups.set(sourceId, []);
        exactGroups.get(sourceId).push({ cartela, matches: exactMatches });
      });
      const removedCartelaIds = new Set();
      let groupedCartelas = 0;
      let protectedImageCartelas = 0;
      exactGroups.forEach((entries) => {
        if (entries.length < 2) return;
        if (entries.some((entry) => cartelaImages(entry.cartela).length)) {
          protectedImageCartelas += entries.filter((entry) => cartelaImages(entry.cartela).length).length;
          return;
        }
        const sourceCartela = entries[0].matches[0].sourceCartela;
        const sourceRefs = getCartelaRefs(sourceCartela);
        const matchedSourceRefs = entries.flatMap((entry) => entry.matches.map((match) => match.sourceMaterial.id));
        if (matchedSourceRefs.length !== sourceRefs.length
          || new Set(matchedSourceRefs).size !== sourceRefs.length
          || sourceRefs.some((ref) => !matchedSourceRefs.includes(ref))) return;
        entries.sort((left, right) => Math.min(...left.matches.map((match) => match.sourceRefIndex))
          - Math.min(...right.matches.map((match) => match.sourceRefIndex)));
        const destination = entries[0].cartela;
        destination.pages = mergeExactCartelaPages(destination, entries, sourceCartela);
        entries.slice(1).forEach((entry) => removedCartelaIds.add(entry.cartela.id));
        groupedCartelas += entries.length - 1;
      });
      target.cartelas = target.cartelas.filter((cartela) => !removedCartelaIds.has(cartela.id));
      const imageSourceByTarget = new Map();
      const targetsByImageSource = new Map();
      target.cartelas.forEach((cartela) => {
        if (cartelaImages(cartela).length) return;
        const candidates = getCartelaRefs(cartela)
          .map((ref) => matchByTargetRef.get(ref))
          .filter(Boolean);
        const sourceCartela = dominantSourceCartela(candidates);
        if (!sourceCartela || !cartelaImages(sourceCartela).length) return;
        imageSourceByTarget.set(cartela.id, sourceCartela);
        targetsByImageSource.set(sourceCartela.id, (targetsByImageSource.get(sourceCartela.id) || 0) + 1);
      });
      let copiedImageCartelas = 0;
      let copiedImages = 0;
      let ambiguousImageCartelas = 0;
      imageSourceByTarget.forEach((sourceCartela, targetId) => {
        if (targetsByImageSource.get(sourceCartela.id) !== 1) {
          ambiguousImageCartelas += 1;
          return;
        }
        const targetCartela = target.cartelas.find((cartela) => cartela.id === targetId);
        if (!targetCartela) return;
        targetCartela.images = JSON.parse(JSON.stringify(cartelaImages(sourceCartela)));
        copiedImageCartelas += 1;
        copiedImages += targetCartela.images.length;
      });
      const anchoredImages = transferAnchoredImageCartelas(target, source, matches);
      copiedImageCartelas += anchoredImages.copiedImageCartelas;
      copiedImages += anchoredImages.copiedImages;
      enforceUniqueMaterialRefs(target);
      addMissingMaterialsToStructure(target.cartelas, targetMaterials || [], target.settings || {});
      ensureCartelaOrders(target.cartelas);
      return {
        structure: target,
        report: {
          matched_materials: matches.length,
          exact_matches: matches.filter((match) => match.confidence === 'exact').length,
          approximate_matches: matches.filter((match) => match.confidence !== 'exact').length,
          unmatched_materials: Math.max(0, (targetMaterials || []).length - matches.length),
          styled_cartelas: styledCartelas,
          grouped_cartelas: groupedCartelas,
          protected_image_cartelas: protectedImageCartelas,
          copied_image_cartelas: copiedImageCartelas,
          copied_images: copiedImages,
          created_image_cartelas: anchoredImages.createdImageCartelas,
          ambiguous_image_cartelas: ambiguousImageCartelas,
          resulting_cartelas: target.cartelas.length,
        },
      };
    }

    function emptyTransferReport(materials) {
      return {
        matched_materials: 0,
        exact_matches: 0,
        approximate_matches: 0,
        unmatched_materials: (materials || []).length,
        styled_cartelas: 0,
        grouped_cartelas: 0,
        protected_image_cartelas: 0,
        copied_image_cartelas: 0,
        copied_images: 0,
        created_image_cartelas: 0,
        ambiguous_image_cartelas: 0,
        resulting_cartelas: 0,
      };
    }

    function dominantSourceCartela(matches) {
      const candidates = new Map();
      matches.forEach((match) => {
        const current = candidates.get(match.sourceCartela.id) || { cartela: match.sourceCartela, score: 0 };
        current.score += match.score;
        candidates.set(match.sourceCartela.id, current);
      });
      return [...candidates.values()].sort((left, right) => right.score - left.score)[0]?.cartela || null;
    }

    function transferAnchoredImageCartelas(target, source, matches) {
      const exactBySourceRef = new Map();
      matches.filter((match) => match.confidence === 'exact').forEach((match) => {
        if (!exactBySourceRef.has(match.sourceMaterial.id)) exactBySourceRef.set(match.sourceMaterial.id, []);
        exactBySourceRef.get(match.sourceMaterial.id).push(match);
      });
      let copiedImageCartelas = 0;
      let copiedImages = 0;
      let createdImageCartelas = 0;
      const sourceCartelas = getVisualCartelas(source.cartelas);
      sourceCartelas.forEach((sourceCartela, sourceIndex) => {
        const images = cartelaImages(sourceCartela);
        if (!images.length || getCartelaRefs(sourceCartela).length) return;
        const sourceAnchor = previousCartelaWithRefs(sourceCartelas, sourceIndex);
        const sourceAnchorRefs = getCartelaRefs(sourceAnchor);
        if (!sourceAnchorRefs.length) return;
        const anchorMatches = sourceAnchorRefs.flatMap((ref) => exactBySourceRef.get(ref) || []);
        if (anchorMatches.length !== sourceAnchorRefs.length
          || new Set(anchorMatches.map((match) => match.targetMaterial.id)).size !== sourceAnchorRefs.length) return;
        const targetAnchors = target.cartelas.filter((cartela) => {
          const refs = new Set(getCartelaRefs(cartela));
          return anchorMatches.every((match) => refs.has(match.targetMaterial.id));
        });
        if (targetAnchors.length !== 1) return;
        const targetAnchor = targetAnchors[0];
        if (cartelaImages(targetAnchor).length) return;
        const sourceName = normalizeTransferText(sourceCartela.manual_name || sourceCartela.title);
        const namedTarget = sourceName
          ? target.cartelas.find((cartela) => !getCartelaRefs(cartela).length
            && normalizeTransferText(cartela.manual_name || cartela.title) === sourceName)
          : null;
        const targetVisualCartelas = getVisualCartelas(target.cartelas);
        const targetAnchorIndex = targetVisualCartelas.findIndex((cartela) => cartela.id === targetAnchor.id);
        const adjacentTarget = targetVisualCartelas[targetAnchorIndex + 1];
        const targetImageCartela = namedTarget || (
          adjacentTarget && adjacentTarget.manual && !getCartelaRefs(adjacentTarget).length
            ? adjacentTarget
            : null
        );
        if (targetImageCartela) {
          if (!cartelaImages(targetImageCartela).length) {
            targetImageCartela.images = JSON.parse(JSON.stringify(images));
            copiedImageCartelas += 1;
            copiedImages += images.length;
          }
          return;
        }
        const clone = JSON.parse(JSON.stringify(sourceCartela));
        clone.id = uniqueCartelaId(target.cartelas, target.cartelas.length + 1);
        clone.manual = true;
        clone.images = JSON.parse(JSON.stringify(images));
        clone.source_order = Math.max(0, ...target.cartelas.map((cartela) => Number(cartela.source_order) || 0)) + 1;
        const anchorOrder = Number(targetAnchor.visual_order) || 1;
        target.cartelas.forEach((cartela) => {
          if (Number(cartela.visual_order) > anchorOrder) cartela.visual_order = Number(cartela.visual_order) + 1;
        });
        clone.visual_order = anchorOrder + 1;
        clone.pages = [{ id: `${clone.id}_page_001`, title: '', source_refs: [], source_ref_settings: {} }];
        target.cartelas.push(clone);
        copiedImageCartelas += 1;
        copiedImages += images.length;
        createdImageCartelas += 1;
      });
      return { copiedImageCartelas, copiedImages, createdImageCartelas };
    }

    function previousCartelaWithRefs(cartelas, index) {
      for (let candidateIndex = index - 1; candidateIndex >= 0; candidateIndex -= 1) {
        if (getCartelaRefs(cartelas[candidateIndex]).length) return cartelas[candidateIndex];
      }
      return null;
    }

    function copyExactSourceRefSettings(cartela, matches) {
      matches.filter((match) => match.confidence === 'exact').forEach((match) => {
        const targetPage = findPageWithRef(cartela, match.targetMaterial.id);
        const sourcePage = findPageWithRef(match.sourceCartela, match.sourceMaterial.id);
        const sourceSettings = sourcePage && sourcePage.source_ref_settings && sourcePage.source_ref_settings[match.sourceMaterial.id];
        if (!targetPage || !sourceSettings) return;
        const settings = JSON.parse(JSON.stringify(sourceSettings));
        delete settings.locked;
        delete settings.frozen_material;
        targetPage.source_ref_settings = targetPage.source_ref_settings || {};
        targetPage.source_ref_settings[match.targetMaterial.id] = settings;
      });
    }

    function mergeExactCartelaPages(destination, entries, sourceCartela) {
      const targetRefBySourceRef = new Map();
      const targetSettingsByRef = new Map();
      entries.forEach((entry) => {
        entry.matches.forEach((match) => targetRefBySourceRef.set(match.sourceMaterial.id, match.targetMaterial.id));
        (entry.cartela.pages || []).forEach((page) => {
          (page.source_refs || []).forEach((ref) => {
            targetSettingsByRef.set(ref, JSON.parse(JSON.stringify(
              page.source_ref_settings && page.source_ref_settings[ref] || { columns: 1 }
            )));
          });
        });
      });
      return (sourceCartela.pages || []).map((sourcePage, pageIndex) => {
        const refs = (sourcePage.source_refs || []).map((ref) => targetRefBySourceRef.get(ref)).filter(Boolean);
        const settings = {};
        refs.forEach((ref) => {
          settings[ref] = targetSettingsByRef.get(ref) || { columns: 1 };
        });
        return {
          id: `${destination.id}_page_${String(pageIndex + 1).padStart(3, '0')}`,
          title: sourcePage.title || '',
          source_refs: refs,
          source_ref_settings: settings,
        };
      }).filter((page) => page.source_refs.length);
    }

    function bestMaterialTransferMatch(targetMaterial, sourceMaterials, sourceCartelaByRef) {
      const targetEvidence = materialTransferEvidence(targetMaterial);
      let best = null;
      (sourceMaterials || []).forEach((sourceMaterial) => {
        const location = sourceCartelaByRef.get(sourceMaterial.id);
        if (!location) return;
        const sourceEvidence = materialTransferEvidence(sourceMaterial);
        const exactTitle = !!targetEvidence.title && targetEvidence.title === sourceEvidence.title;
        const rowOverlap = intersectionSize(targetEvidence.rows, sourceEvidence.rows);
        const termOverlap = intersectionSize(targetEvidence.terms, sourceEvidence.terms);
        const score = (exactTitle ? 10000 : 0) + (rowOverlap * 50) + (termOverlap * 8);
        const reasonableMatch = exactTitle || rowOverlap >= 2 || termOverlap >= 2 || (rowOverlap >= 1 && termOverlap >= 1);
        if (!reasonableMatch || (best && best.score >= score)) return;
        best = {
          score,
          confidence: exactTitle ? 'exact' : 'approximate',
          sourceMaterial,
          sourceCartela: location.cartela,
          sourceCartelaIndex: location.cartelaIndex,
          sourceRefIndex: location.refIndex,
        };
      });
      return best;
    }

    function materialTransferEvidence(material) {
      const rows = new Set();
      const terms = new Set();
      addTransferTerm(terms, material && material.title);
      (material && material.items || []).forEach((item) => {
        [item.row, item.source_row].forEach((row) => addTransferRow(rows, row));
        ['role', 'name', 'actor', 'character', 'value', 'title'].forEach((key) => addTransferTerm(terms, item[key]));
        (item.names || []).forEach((name) => {
          [name.row, name.source_row].forEach((row) => addTransferRow(rows, row));
          addTransferTerm(terms, name.name || name.value);
        });
      });
      addTransferRow(rows, material && material.start_row);
      return { rows, terms, title: normalizeTransferText(material && material.title) };
    }

    function addTransferRow(rows, value) {
      const row = Number(value);
      if (Number.isFinite(row) && row > 0) rows.add(row);
    }

    function addTransferTerm(terms, value) {
      const normalized = normalizeTransferText(value);
      if (normalized) terms.add(normalized);
    }

    function normalizeTransferText(value) {
      return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()
        .toLowerCase();
    }

    function intersectionSize(left, right) {
      let count = 0;
      left.forEach((value) => {
        if (right.has(value)) count += 1;
      });
      return count;
    }

    function materialHasRenderableContent(material) {
      if (!material) return false;
      if (material.type === 'logos') return true;
      if (material.type === 'music_licenses') return groupMusicLicenseThemes(getMaterialContentItems(material), {}).length > 0;
      return getMaterialContentItems(material).some((item) => {
        if (item.kind === 'section') return false;
        if (item.kind === 'crew_credit' || item.kind === 'credit') return (item.names || []).length > 0 || item.role;
        if (item.kind === 'cast') return item.actor || item.character;
        if (item.kind === 'list_item' || item.kind === 'closing_line') return item.value;
        if (item.kind === 'logo') return item.value || item.title;
        return Object.keys(item || {}).some((key) => !['id', 'kind', 'row', 'section'].includes(key) && item[key]);
      });
    }

    function pageBreaksFromMaterials(materials) {
      const result = {};
      (materials || []).forEach((material) => {
        const indexes = material.page_break_after_item_indexes || [];
        const breaks = indexes.map((index) => {
          const item = (material.items || [])[Number(index)];
          if (!item) return null;
          const names = Array.isArray(item.names) ? item.names : [];
          if (names.length) {
            const lastName = names[names.length - 1];
            return `${item.id}__${lastName.id}`;
          }
          return `${item.id}__${item.id}_empty_name`;
        }).filter(Boolean);
        if (breaks.length) result[material.id] = breaks;
      });
      return result;
    }

    function removeDefaultEmptyCartelas(cartelas, materials) {
      const materialById = new Map((materials || []).map((material) => [material.id, material]));
      return (cartelas || []).filter((cartela) => {
        if (cartela.manual) return true;
        const refs = getCartelaRefs(cartela);
        if (!refs.length) return false;
        const hasContent = refs.some((ref) => materialHasRenderableContent(materialById.get(ref)));
        return hasContent || cartela.enabled !== false;
      });
    }

    function structureJsonForOutput(structure, materials) {
      if (!structure) return null;
      const output = JSON.parse(JSON.stringify(structure));
      delete output.settings;
      output.cartelas = removeDefaultEmptyCartelas(output.cartelas || [], materials || []);
      output.cartelas.forEach(removeLegacyCartelaScaleFields);
      return output;
    }

    function removeLegacyCartelaScaleFields(cartela) {
      delete cartela.font_size_multiplier;
      delete cartela.line_spacing_multiplier;
      delete cartela.block_gap_multiplier;
      return cartela;
    }

    function cartelaHasRenderableRefs(cartela, materialById) {
      if (cartelaHasManualRenderableContent(cartela) || cartelaHasImages(cartela)) return true;
      const refs = getCartelaRefs(cartela);
      if (!refs.length) return false;
      return refs.some((ref) => materialHasRenderableContent(materialById.get(ref)));
    }

    function cartelaHasManualRenderableContent(cartela) {
      return !!(cartela && cartela.manual);
    }

    function addMissingMaterialsToStructure(cartelas, materials, settings) {
      const existingRefs = new Set();
      (cartelas || []).forEach((cartela) => {
        getCartelaRefs(cartela).forEach((ref) => existingRefs.add(ref));
      });

      (materials || []).forEach((material) => {
        if (existingRefs.has(material.id) || !materialHasRenderableContent(material)) return;
        const cartela = defaultCartelaForMaterial(material, cartelas.length, settings);
        cartela.pages = (cartela.pages || []).map((page) => normalizeCartelaPage(page));
        cartelas.push(cartela);
        existingRefs.add(material.id);
      });
    }

    function hasMissingMaterialRefs(cartela, materialIds) {
      return getCartelaRefs(cartela).some((ref) => !materialIds.has(ref));
    }

    function enforceUniqueCartelaIds(cartelas) {
      const seen = new Map();
      (cartelas || []).forEach((cartela, index) => {
        const base = cartela.id || `cartela_${String(index + 1).padStart(3, '0')}`;
        const count = (seen.get(base) || 0) + 1;
        seen.set(base, count);
        if (count === 1) {
          cartela.id = base;
          return;
        }
        cartela.id = `${base}_${String(count).padStart(2, '0')}`;
        (cartela.pages || []).forEach((page, pageIndex) => {
          page.id = `${cartela.id}_page_${String(pageIndex + 1).padStart(3, '0')}`;
        });
      });
    }

    function ensureCartelaOrders(cartelas) {
      (cartelas || []).forEach((cartela, index) => {
        if (!Number.isFinite(Number(cartela.source_order))) cartela.source_order = index + 1;
        if (!Number.isFinite(Number(cartela.visual_order))) cartela.visual_order = Number(cartela.source_order) || index + 1;
      });
      normalizeVisualOrders(cartelas);
    }

    function normalizeVisualOrders(cartelas) {
      getVisualCartelas(cartelas).forEach((cartela, index) => {
        cartela.visual_order = index + 1;
      });
    }

    function getVisualCartelas(cartelas = []) {
      return [...(cartelas || [])].sort((a, b) => {
        const orderA = Number.isFinite(Number(a.visual_order)) ? Number(a.visual_order) : Number(a.source_order) || 0;
        const orderB = Number.isFinite(Number(b.visual_order)) ? Number(b.visual_order) : Number(b.source_order) || 0;
        if (orderA !== orderB) return orderA - orderB;
        const sourceA = Number.isFinite(Number(a.source_order)) ? Number(a.source_order) : 0;
        const sourceB = Number.isFinite(Number(b.source_order)) ? Number(b.source_order) : 0;
        if (sourceA !== sourceB) return sourceA - sourceB;
        return String(a.id || '').localeCompare(String(b.id || ''));
      });
    }

    function uniqueCartelaId(cartelas, seedIndex = 1) {
      const existing = new Set((cartelas || []).map((cartela) => cartela.id));
      let index = Math.max(1, Number(seedIndex) || 1);
      let candidate = `cartela_${String(index).padStart(3, '0')}`;
      while (existing.has(candidate)) {
        index += 1;
        candidate = `cartela_${String(index).padStart(3, '0')}`;
      }
      return candidate;
    }

    function moveCartelaVisualOrder(cartelas, cartelaId, delta) {
      if (!Array.isArray(cartelas)) return false;
      ensureCartelaOrders(cartelas);
      const ordered = getVisualCartelas(cartelas);
      const index = ordered.findIndex((cartela) => cartela.id === cartelaId);
      const nextIndex = index + delta;
      if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) return false;
      const currentOrder = ordered[index].visual_order;
      ordered[index].visual_order = ordered[nextIndex].visual_order;
      ordered[nextIndex].visual_order = currentOrder;
      normalizeVisualOrders(cartelas);
      return true;
    }

    function insertManualCartela(cartelas, selectedCartelaId) {
      if (!Array.isArray(cartelas)) return null;
      const index = cartelas.length + 1;
      const cartelaId = uniqueCartelaId(cartelas, index);
      ensureCartelaOrders(cartelas);
      const visualCartelas = getVisualCartelas(cartelas);
      const selectedVisualIndex = visualCartelas.findIndex((cartela) => cartela.id === selectedCartelaId);
      const nextVisualOrder = selectedVisualIndex >= 0 ? selectedVisualIndex + 2 : visualCartelas.length + 1;
      visualCartelas.forEach((cartela) => {
        if (Number(cartela.visual_order) >= nextVisualOrder) cartela.visual_order = Number(cartela.visual_order) + 1;
      });
      const cartela = {
        id: cartelaId,
        manual_name: `Cartela manual ${index}`,
        title: '',
        manual: true,
        source_order: index,
        visual_order: nextVisualOrder,
        type: 'card',
        duration: 4,
        orientation: 'vertical',
        columns: 1,
        vertical_offset: 0,
        enabled: true,
        notes: '',
        pages: [{ id: `${cartelaId}_page_001`, source_refs: [], source_ref_settings: {} }],
      };
      cartelas.push(cartela);
      return cartela;
    }

    function deleteManualCartela(cartelas, cartelaId) {
      if (!Array.isArray(cartelas)) return { deleted: false, nextCartelaId: null };
      const ordered = getVisualCartelas(cartelas);
      const index = ordered.findIndex((cartela) => cartela.id === cartelaId);
      const cartela = index >= 0 ? ordered[index] : null;
      if (!cartela || !cartela.manual) return { deleted: false, nextCartelaId: null };
      const sourceIndex = cartelas.findIndex((candidate) => candidate.id === cartela.id);
      if (sourceIndex < 0) return { deleted: false, nextCartelaId: null };
      cartelas.splice(sourceIndex, 1);
      normalizeVisualOrders(cartelas);
      const nextCartela = getVisualCartelas(cartelas)[Math.max(0, Math.min(index, cartelas.length - 1))] || null;
      return {
        deleted: true,
        nextCartelaId: nextCartela ? nextCartela.id : null,
      };
    }

    function migrateStructure(structure) {
      if (!structure) return null;
      if (Array.isArray(structure.cartelas)) {
        structure.version = Math.max(Number(structure.version) || 0, 12);
        structure.page_breaks = structure.page_breaks || {};
        structure.page_line_adjustments = structure.page_line_adjustments || {};
        structure.preview_settings = normalizePreviewSettings(structure.preview_settings || {});
        delete structure.settings;
        structure.cartelas.forEach((cartela) => {
          migrateCartelaImages(cartela);
          cartela.pages = (cartela.pages || []).map((page) => normalizeCartelaPage(page));
        });
        ensureCartelaOrders(structure.cartelas);
        return structure;
      }

      if (Array.isArray(structure.pages)) {
        return {
          schema: 'credits_structure_json',
          version: 12,
          source_sheet: structure.source_sheet || '',
          source_file: structure.source_file || '',
          cartelas: structure.pages.map((page, index) => ({
            id: `cartela_${String(index + 1).padStart(3, '0')}`,
            title: page.title || `Cartela ${index + 1}`,
            source_order: index + 1,
            visual_order: index + 1,
            style_id: page.style_id || '',
            type: page.layout || 'card',
            orientation: page.orientation || 'horizontal',
            columns: page.columns || (page.distribution === 'columns' ? 2 : 1),
            duration: 4,
            enabled: page.enabled !== false,
            notes: page.notes || '',
            pages: [
              {
                id: page.id || `page_${String(index + 1).padStart(3, '0')}`,
                source_refs: page.block_ref ? [page.block_ref] : [],
                title: '',
                source_ref_settings: page.block_ref ? { [page.block_ref]: { columns: 1 } } : {},
              },
            ],
          })),
          overrides: structure.overrides || {},
          page_breaks: structure.page_breaks || {},
          page_line_adjustments: structure.page_line_adjustments || {},
          preview_settings: normalizePreviewSettings(structure.preview_settings || {}),
        };
      }

      structure.version = Math.max(Number(structure.version) || 0, 12);
      structure.page_breaks = structure.page_breaks || {};
      structure.page_line_adjustments = structure.page_line_adjustments || {};
      delete structure.settings;
      (structure.cartelas || []).forEach((cartela) => {
        migrateCartelaImages(cartela);
        cartela.pages = (cartela.pages || []).map((page) => normalizeCartelaPage(page));
      });
      ensureCartelaOrders(structure.cartelas || []);
      return structure;
    }

    function defaultCartelaForMaterial(material, index, settings) {
      return {
        id: `cartela_${String(index + 1).padStart(3, '0')}`,
        title: '',
        source_order: index + 1,
        visual_order: index + 1,
        type: defaultLayoutForMaterial(material),
        orientation: defaultOrientationForMaterial(material),
        columns: 1,
        vertical_offset: 0,
        duration: Number(settings.default_cartela_duration) || 4,
        enabled: true,
        notes: '',
        pages: [
          {
            id: `page_${String(index + 1).padStart(3, '0')}_001`,
            source_refs: [material.id],
            source_ref_settings: { [material.id]: { columns: 1 } },
          },
        ],
      };
    }

    function normalizeCartela(cartela, material, index) {
      const normalized = JSON.parse(JSON.stringify(cartela));
      const hasStyle = !!normalized.style_id;
      normalized.id = normalized.id || `cartela_${String(index + 1).padStart(3, '0')}`;
      normalized.source_order = Number.isFinite(Number(normalized.source_order)) ? Number(normalized.source_order) : index + 1;
      normalized.visual_order = Number.isFinite(Number(normalized.visual_order)) ? Number(normalized.visual_order) : Number(normalized.source_order) || index + 1;
      normalized.title = normalized.title || '';
      normalized.style_id = normalized.style_id || '';
      normalized.type = normalized.type || defaultLayoutForMaterial(material);
      if (hasStyle) {
        if (normalized.orientation !== undefined) normalized.orientation = normalized.orientation || defaultOrientationForMaterial(material);
        if (normalized.columns !== undefined) normalized.columns = normalized.columns || (normalized.distribution === 'columns' ? 2 : 1);
        if (normalized.vertical_offset !== undefined) normalized.vertical_offset = Number(normalized.vertical_offset) || 0;
        if (normalized.duration !== undefined) normalized.duration = Number(normalized.duration) || 0;
      } else {
        normalized.orientation = normalized.orientation || defaultOrientationForMaterial(material);
        normalized.columns = normalized.columns || (normalized.distribution === 'columns' ? 2 : 1);
        normalized.vertical_offset = Number(normalized.vertical_offset) || 0;
        normalized.duration = normalized.duration === undefined ? 4 : normalized.duration;
      }
      delete normalized.distribution;
      delete normalized.font_size_multiplier;
      delete normalized.line_spacing_multiplier;
      delete normalized.block_gap_multiplier;
      normalized.enabled = normalized.enabled !== false;
      migrateCartelaImages(normalized);
      normalized.pages = normalized.pages && normalized.pages.length
        ? normalized.pages
        : [{ id: `${normalized.id}_page_001`, source_refs: [material.id] }];
      normalized.pages = normalized.pages.map((page) => normalizeCartelaPage(page));
      return normalized;
    }

    function normalizeCartelaPage(page) {
      const normalized = {
        ...page,
        title: page.title || '',
        source_refs: page.source_refs || [],
        source_ref_settings: page.source_ref_settings || {},
      };
      normalized.source_refs.forEach((ref) => {
        normalized.source_ref_settings[ref] = normalized.source_ref_settings[ref] || {};
        normalized.source_ref_settings[ref].columns = Math.max(1, Number(normalized.source_ref_settings[ref].columns) || 1);
        normalized.source_ref_settings[ref].alignment = normalized.source_ref_settings[ref].alignment || {};
        normalized.source_ref_settings[ref].vertical_align = normalizeVerticalAlign(normalized.source_ref_settings[ref].vertical_align);
        const typography = normalizeTypographyOverrides(normalized.source_ref_settings[ref].typography);
        if (Object.keys(typography).length) {
          normalized.source_ref_settings[ref].typography = typography;
        } else {
          delete normalized.source_ref_settings[ref].typography;
        }
        normalized.source_ref_settings[ref].locked = !!normalized.source_ref_settings[ref].locked;
        if (normalized.source_ref_settings[ref].locked && normalized.source_ref_settings[ref].frozen_material) {
          normalized.source_ref_settings[ref].frozen_material = normalizeFrozenMaterial(normalized.source_ref_settings[ref].frozen_material);
        } else {
          delete normalized.source_ref_settings[ref].frozen_material;
        }
      });
      return normalized;
    }

    function normalizeFrozenMaterial(material) {
      if (!material || !material.id) return null;
      return JSON.parse(JSON.stringify(material));
    }

    function applyLockedMaterials(materials, structure) {
      const nextMaterials = (materials || []).map((material) => JSON.parse(JSON.stringify(material)));
      const indexById = new Map(nextMaterials.map((material, index) => [material.id, index]));
      getLockedSourceRefSettings(structure).forEach(({ ref, settings }) => {
        const frozen = normalizeFrozenMaterial(settings.frozen_material);
        if (!frozen) return;
        frozen.id = ref;
        frozen.source_block_id = frozen.source_block_id || ref;
        if (indexById.has(ref)) {
          nextMaterials[indexById.get(ref)] = frozen;
        } else {
          indexById.set(ref, nextMaterials.length);
          nextMaterials.push(frozen);
        }
      });
      return nextMaterials;
    }

    function getLockedSourceRefSettings(structure) {
      const locked = [];
      (structure && structure.cartelas || []).forEach((cartela) => {
        (cartela.pages || []).forEach((page) => {
          Object.entries(page.source_ref_settings || {}).forEach(([ref, settings]) => {
            if (settings && settings.locked) locked.push({ ref, settings, page, cartela });
          });
        });
      });
      return locked;
    }

    function normalizeCartelaImage(image, index = 0) {
      if (!image || !image.data_url) return null;
      return {
        id: String(image.id || `image_${String(index + 1).padStart(3, '0')}`),
        name: String(image.name || 'imagen'),
        file_path: String(image.file_path || image.filePath || ''),
        mime: String(image.mime || ''),
        data_url: String(image.data_url),
        scale: Math.max(0.01, Number(image.scale) || 1),
        offset_x: Number(image.offset_x) || 0,
        offset_y: Number(image.offset_y) || 0,
      };
    }

    function normalizeCartelaImages(images) {
      const source = Array.isArray(images) ? images : (images ? [images] : []);
      return source.map((image, index) => normalizeCartelaImage(image, index)).filter(Boolean);
    }

    function migrateCartelaImages(cartela) {
      if (!cartela) return;
      const source = Array.isArray(cartela.images) ? cartela.images : (cartela.image ? [cartela.image] : []);
      cartela.images = normalizeCartelaImages(source);
      delete cartela.image;
    }

    function cartelaImages(cartela) {
      if (!cartela) return [];
      return normalizeCartelaImages(Array.isArray(cartela.images) ? cartela.images : cartela.image);
    }

    function cartelaHasImages(cartela) {
      return cartelaImages(cartela).length > 0;
    }

    function uniqueCartelaImageId(images) {
      const existing = new Set((images || []).map((image) => image.id));
      let index = existing.size + 1;
      let candidate = `image_${String(index).padStart(3, '0')}`;
      while (existing.has(candidate)) {
        index += 1;
        candidate = `image_${String(index).padStart(3, '0')}`;
      }
      return candidate;
    }

    function updateCartela(cartela, fields) {
      if (!cartela) return false;
      Object.assign(cartela, fields || {});
      if (fields && fields.image === null) delete cartela.image;
      if (fields && fields.images) cartela.images = normalizeCartelaImages(fields.images);
      return true;
    }

    function resetCartelaOverride(cartela, key) {
      if (!cartela) return false;
      delete cartela[key];
      return true;
    }

    function getCartelaRefs(cartela) {
      return (cartela && cartela.pages || []).flatMap((page) => page.source_refs || []);
    }

    function getCartelaDisplayName(cartela, materials, index = 0) {
      if (cartela && cartela.manual && String(cartela.manual_name || '').trim()) return cartela.manual_name;
      const materialById = new Map((materials || []).map((material) => [material.id, material]));
      const titles = getCartelaRefs(cartela)
        .map((ref) => materialById.get(ref))
        .filter(Boolean)
        .map((material) => material.title || material.id);
      return titles.length ? titles.join(' + ') : `Cartela ${index + 1}`;
    }

    function findPageWithRef(cartela, ref) {
      if (!cartela) return null;
      return (cartela.pages || []).find((page) => (page.source_refs || []).includes(ref)) || null;
    }

    function ensureFirstPage(cartela) {
      cartela.pages = cartela.pages || [];
      if (!cartela.pages[0]) cartela.pages.push({ id: `${cartela.id}_page_001`, source_refs: [], source_ref_settings: {} });
      cartela.pages[0].source_refs = cartela.pages[0].source_refs || [];
      cartela.pages[0].source_ref_settings = cartela.pages[0].source_ref_settings || {};
      return cartela.pages[0];
    }

    function moveMaterialToCartela(structure, materialId, targetCartela) {
      if (!structure || !targetCartela) return false;
      (structure.cartelas || []).forEach((cartela) => {
        (cartela.pages || []).forEach((page) => {
          page.source_refs = (page.source_refs || []).filter((ref) => ref !== materialId);
        });
      });
      const page = ensureFirstPage(targetCartela);
      page.source_ref_settings = page.source_ref_settings || {};
      page.source_ref_settings[materialId] = page.source_ref_settings[materialId] || { columns: 1 };
      page.source_refs.push(materialId);
      return true;
    }

    function enforceUniqueMaterialRefs(structure) {
      const seen = new Set();
      (structure.cartelas || []).forEach((cartela) => {
        (cartela.pages || []).forEach((page) => {
          page.source_refs = (page.source_refs || []).filter((ref) => {
            if (seen.has(ref)) return false;
            seen.add(ref);
            page.source_ref_settings = page.source_ref_settings || {};
            page.source_ref_settings[ref] = page.source_ref_settings[ref] || { columns: 1 };
            return true;
          });
          Object.keys(page.source_ref_settings || {}).forEach((ref) => {
            if (!(page.source_refs || []).includes(ref)) delete page.source_ref_settings[ref];
          });
        });
      });
    }

    return {
      applyLockedMaterials,
      cartelaHasImages,
      cartelaHasRenderableRefs,
      cartelaImages,
      createStructureFromSource,
      deleteManualCartela,
      enforceUniqueMaterialRefs,
      ensureCartelaOrders,
      findPageWithRef,
      getCartelaDisplayName,
      getCartelaRefs,
      getVisualCartelas,
      insertManualCartela,
      migrateStructure,
      moveMaterialToCartela,
      moveCartelaVisualOrder,
      normalizeCartelaImages,
      normalizeFrozenMaterial,
      normalizeVisualOrders,
      removeDefaultEmptyCartelas,
      resetCartelaOverride,
      structureJsonForOutput,
      transferStructurePresentation,
      updateCartela,
      uniqueCartelaImageId,
      uniqueCartelaId,
    };
  }

  root.CreditosDomainStructure = {
    createStructureDomain,
  };
})(globalThis);
