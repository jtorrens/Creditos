(function (root) {
  function createSourceDomain(dependencies = {}) {
    const { safeFilePart } = dependencies;
    const defaultImportModel = { id: 'standard_credits_xls', label: 'XLS Créditos Buendía' };

    function importModelOptions(importModels) {
      return importModels && importModels.length ? importModels : [{ ...defaultImportModel }];
    }

    function defaultImportModelId(importModels) {
      const models = importModelOptions(importModels);
      return models[0] ? models[0].id : defaultImportModel.id;
    }

    function labelForImportModel(importModels, importModelId) {
      const model = (importModels || []).find((candidate) => candidate.id === importModelId);
      if (model) return model.label;
      if (importModelId === defaultImportModel.id) return defaultImportModel.label;
      return importModelId || 'Por defecto';
    }

    function selectedImportModelId(production, importModels) {
      return (production && production.import_model_id) || defaultImportModelId(importModels);
    }

    function currentXlsxName(source, structure) {
      if (source && source.meta && source.meta.loaded_file) return source.meta.loaded_file;
      if (structure && structure.source_file) return structure.source_file;
      return '';
    }

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
      currentXlsxName,
      defaultImportModelId,
      importModelOptions,
      labelForImportModel,
      normalizeSource,
      makeBlockId,
      makeItemId,
      makeNameId,
      selectedImportModelId,
    };
  }

  root.CreditosDomainSource = {
    createSourceDomain,
  };
})(globalThis);
