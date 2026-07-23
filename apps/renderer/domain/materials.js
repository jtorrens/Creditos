(function (root) {
  function createMaterialsDomain(dependencies = {}) {
    const { normalizeText, safeFilePart } = dependencies;

    function createMaterialsFromSource(source) {
      const materials = [];

      (source.blocks || []).forEach((block) => {
        if (block.type !== 'crew') {
          materials.push({
            id: block.id,
            source_block_id: block.id,
            group: block.group,
            title: block.title,
            default_title: defaultBlockTitleForMaterial(block.title, block.items || []),
            titles: block.titles || [block.title],
            type: block.type,
            items: block.items || [],
            layout_hint: block.layout_hint || '',
            orientation_hint: block.orientation_hint || '',
            page_break_after_item_indexes: Array.isArray(block.page_break_after_item_indexes)
              ? block.page_break_after_item_indexes.slice()
              : [],
          });
          return;
        }

        splitCrewBlockIntoMaterials(block).forEach((material) => materials.push(material));
      });

      return materials;
    }

    function splitCrewBlockIntoMaterials(block) {
      const materials = [];
      let current = null;
      const seenSectionIds = new Map();
      const items = normalizeCrewItemsForMaterials(block.items || []);

      items.forEach((item) => {
        if (item.kind === 'section') {
          const materialId = uniqueMaterialId(makeCrewMaterialId(block.id, item.title || 'section'), seenSectionIds);
          current = {
            id: materialId,
            source_block_id: block.id,
            source_section_id: item.id,
            group: block.group,
            title: item.title,
            default_title: item.title,
            titles: [item.title],
            type: crewMaterialType(item.title),
            items: [item],
          };
          materials.push(current);
          return;
        }

        if (item.kind === 'closing_line' && (!current || current.type !== 'closing')) {
          const materialId = uniqueMaterialId(makeCrewMaterialId(block.id, 'closing_copy'), seenSectionIds);
          current = {
            id: materialId,
            source_block_id: block.id,
            group: block.group,
            title: 'Copy serie',
            default_title: '',
            titles: ['Copy serie'],
            type: 'closing',
            items: [],
          };
          materials.push(current);
        }

        if (!current) {
          current = {
            id: `${block.id}_section_intro`,
            source_block_id: block.id,
            group: block.group,
            title: block.title || 'RODILLO FINAL',
            default_title: block.title || 'RODILLO FINAL',
            titles: [block.title || 'RODILLO FINAL'],
            type: 'crew_section',
            items: [],
          };
          materials.push(current);
        }

        current.items.push(item);
      });

      return materials;
    }

    function normalizeCrewItemsForMaterials(items) {
      let inMusicLicenses = false;
      return (items || []).map((item) => {
        if (item.kind === 'section' && normalizeText(item.title) === normalizeText('Licencias Musicales')) {
          inMusicLicenses = true;
          return item;
        }

        if (inMusicLicenses && item.kind === 'section') {
          if (isSectionAfterMusicLicenses(item)) {
            inMusicLicenses = false;
            return item;
          }
          return {
            ...item,
            kind: 'list_item',
            section: 'Licencias Musicales',
            value: item.title || '',
          };
        }

        if (inMusicLicenses && item.kind === 'list_item') {
          return {
            ...item,
            section: 'Licencias Musicales',
          };
        }

        return item;
      });
    }

    function isSectionAfterMusicLicenses(item) {
      if (item.source_column === 'C' && item.source_bold) return true;
      const title = normalizeText(item.title);
      return [
        'doblaje de figuracion',
        'doblaje de figuración',
        'empresas de servicios',
        'logos',
        'agradecimientos',
        'vestuario',
        'closing_copy',
      ].includes(title);
    }

    function crewMaterialType(title) {
      if (title === 'Licencias Musicales') return 'music_licenses';
      if (['AGRADECIMIENTOS', 'Localizaciones', 'Arte', 'Vestuario', 'Maquillaje/Peluquería'].includes(title)) return 'thanks';
      if (title === 'Logos' || /logo.*emplazamiento/i.test(String(title || ''))) return 'logos';
      if (title === 'closing_copy') return 'closing';
      return 'crew_section';
    }

    function defaultBlockTitleForMaterial(title, items) {
      const firstCredit = (items || []).find((item) => item.kind === 'credit' || item.kind === 'crew_credit');
      if (firstCredit && normalizeText(firstCredit.role) === normalizeText(title)) return '';
      return title || '';
    }

    function makeCrewMaterialId(blockId, title) {
      return `${blockId}_section_${safeFilePart(title || 'section')}`;
    }

    function uniqueMaterialId(baseId, seenIds) {
      const count = (seenIds.get(baseId) || 0) + 1;
      seenIds.set(baseId, count);
      return count === 1 ? baseId : `${baseId}_${String(count).padStart(2, '0')}`;
    }

    function defaultLayoutForMaterial(material) {
      if (material.layout_hint) return material.layout_hint;
      if (material.type === 'crew_section') return 'roll_section';
      if (material.type === 'cast') return 'cast_page';
      if (material.type === 'music_licenses') return 'music_licenses';
      if (material.type === 'thanks') return 'thanks';
      if (material.type === 'logos') return 'logos';
      if (material.type === 'closing') return 'closing';
      return 'card';
    }

    function defaultOrientationForMaterial(material) {
      if (material.orientation_hint) return material.orientation_hint;
      if (material.type === 'cards') return 'vertical';
      if (material.type === 'music_licenses') return 'vertical';
      if (material.type === 'thanks') return 'vertical';
      if (material.type === 'logos') return 'vertical';
      if (material.type === 'closing') return 'vertical';
      if (material.type === 'crew_section') {
        const hasRoleAndName = (material.items || []).some((item) => item.kind === 'crew_credit');
        return hasRoleAndName ? 'horizontal' : 'vertical';
      }
      return 'horizontal';
    }

    return {
      createMaterialsFromSource,
      splitCrewBlockIntoMaterials,
      normalizeCrewItemsForMaterials,
      crewMaterialType,
      defaultBlockTitleForMaterial,
      defaultLayoutForMaterial,
      defaultOrientationForMaterial,
    };
  }

  root.CreditosDomainMaterials = {
    createMaterialsDomain,
  };
})(globalThis);
