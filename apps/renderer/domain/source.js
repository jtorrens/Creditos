(function (root) {
  function createSourceDomain(dependencies = {}) {
    const { safeFilePart } = dependencies;

    function normalizeSource(source, fileName) {
      const normalized = JSON.parse(JSON.stringify(source));
      normalized.meta = normalized.meta || {};
      normalized.meta.loaded_file = fileName;
      normalized.blocks = (normalized.blocks || []).map((block, blockIndex) => {
        const blockId = block.id || makeBlockId(block, blockIndex);
        return {
          ...block,
          id: blockId,
          items: (block.items || []).map((item, itemIndex) => ({
            ...item,
            id: item.id || makeItemId(blockId, item, itemIndex),
            names: Array.isArray(item.names)
              ? item.names.map((name, nameIndex) => ({
                  ...name,
                  id: name.id || makeNameId(blockId, item, name, nameIndex),
                }))
              : item.names,
          })),
        };
      });
      return normalized;
    }

    function makeBlockId(block, index) {
      return `block_${safeFilePart(block.group || index + 1)}_${safeFilePart(block.title || 'block')}`;
    }

    function makeItemId(blockId, item, index) {
      const label = item.role || item.title || item.actor || item.value || item.kind || 'item';
      return `${blockId}_item_${String(index + 1).padStart(3, '0')}_${safeFilePart(label)}`;
    }

    function makeNameId(blockId, item, name, index) {
      const label = item.role || item.title || item.actor || item.value || item.kind || 'item';
      return `${blockId}_name_${safeFilePart(label)}_${String(index + 1).padStart(3, '0')}_${safeFilePart(name.name || 'name')}`;
    }

    return {
      normalizeSource,
      makeBlockId,
      makeItemId,
      makeNameId,
    };
  }

  root.CreditosDomainSource = {
    createSourceDomain,
  };
})(globalThis);
