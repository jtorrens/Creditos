(function (root) {
  const TYPE_ORDER = {
    WORK_AREA: 0,
    INPUT: 1,
    OUTPUT: 2,
  };
  const TYPE_LABELS = {
    WORK_AREA: 'Área de trabajo',
    INPUT: 'Input',
    OUTPUT: 'Output',
  };

  function availableProductions(catalog) {
    const records = catalog && Array.isArray(catalog.productions)
      ? catalog.productions
      : [];
    return records
      .filter((record) => record && record.available === true && record.production)
      .slice()
      .sort((left, right) => String(left.production.name).localeCompare(
        String(right.production.name),
        'es',
      ));
  }

  function structureEntryOptions(snapshot) {
    const entries = snapshot && snapshot.production &&
      Array.isArray(snapshot.production.structureEntries)
      ? snapshot.production.structureEntries
      : [];
    return entries
      .filter((entry) => entry && typeof entry.id === 'string')
      .slice()
      .sort((left, right) => {
        const typeDifference = (TYPE_ORDER[left.type] ?? 99) - (TYPE_ORDER[right.type] ?? 99);
        if (typeDifference) return typeDifference;
        return String(left.name).localeCompare(String(right.name), 'es');
      })
      .map((entry) => ({
        ...entry,
        id: String(entry.id),
        label: `${TYPE_LABELS[entry.type] || entry.type} · ${entry.name} · ${entry.folderName}/`,
      }));
  }

  function validateStoredSelection(snapshot, association, localProductionType) {
    if (!snapshot || !association) {
      return { valid: false, message: 'No hay una asociación que comprobar.' };
    }
    if (String(snapshot.production.id) !== String(association.shotManagerProductionId)) {
      return {
        valid: false,
        message: 'La producción guardada ya no coincide con el contexto recibido.',
      };
    }
    if (snapshot.production.productionType !== localProductionType) {
      return {
        valid: false,
        message: 'El tipo de producción no coincide entre Créditos y Shot Manager.',
      };
    }
    if (!structureEntryOptions(snapshot).some(
      (entry) => entry.id === String(association.structureEntryId),
    )) {
      return {
        valid: false,
        message: 'El elemento de estructura guardado ya no existe en Shot Manager.',
      };
    }
    return { valid: true, message: '' };
  }

  root.CreditosDomainShotManagerAssociation = {
    availableProductions,
    structureEntryOptions,
    validateStoredSelection,
  };
})(globalThis);
