(function (root) {
  function createStructureDomain(dependencies = {}) {
    const {
      defaultLayoutForMaterial,
      defaultOrientationForMaterial,
      groupMusicLicenseThemes,
      normalizePreviewSettings,
      normalizeText,
      normalizeTypographyOverrides,
      normalizeVerticalAlign,
    } = dependencies;

    function createStructureFromSource(source, materials, previousStructure, settings) {
      const previous = migrateStructure(previousStructure);
      const materialIds = new Set(materials.map((material) => material.id));
      const previousByRef = new Map();
      const previousOverrides = previous && previous.overrides ? previous.overrides : {};
      const previousPageBreaks = previous && previous.page_breaks ? previous.page_breaks : {};
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
        page_breaks: previousPageBreaks,
        page_line_adjustments: previous && previous.page_line_adjustments ? previous.page_line_adjustments : {},
        preview_settings: previousPreviewSettings,
      };
    }

    function getMaterialContentItems(material) {
      const items = material && material.items ? material.items : [];
      if (!items.length) return items;
      const first = items[0];
      if (first.kind === 'section' && normalizeText(first.title) === normalizeText(material.title)) {
        return items.slice(1);
      }
      return items;
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

    function getCartelaRefs(cartela) {
      return (cartela && cartela.pages || []).flatMap((page) => page.source_refs || []);
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
      enforceUniqueMaterialRefs,
      ensureCartelaOrders,
      getCartelaRefs,
      getMaterialContentItems,
      getVisualCartelas,
      migrateStructure,
      normalizeCartelaImages,
      normalizeFrozenMaterial,
      normalizeVisualOrders,
      removeDefaultEmptyCartelas,
    };
  }

  root.CreditosDomainStructure = {
    createStructureDomain,
  };
})(globalThis);
