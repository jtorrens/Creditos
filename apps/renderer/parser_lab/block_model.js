(function (root) {
  const COLUMNS = ['A', 'B', 'C', 'D'];
  const OPERATORS = ['equals', 'contains', 'regex', 'nonempty'];
  const REQUIREMENTS = ['ignore', 'required', 'forbidden'];
  const SEPARATOR_MEANINGS = ['item', 'group', 'page'];
  const COMPOSITION_SCOPES = ['item', 'block'];
  const COMPOSITION_TARGETS = ['group', 'page', 'cartela'];

  function defaultInterpretation() {
    return {
      type: 'principal_with_associated_values',
      traversal: 'row_major',
      split_cell_lines: true,
      separator: {
        condition: 'empty_row',
        meaning: 'item',
        collapse_consecutive: true,
      },
    };
  }

  function normalizeDefinition(definition) {
    const source = definition || {};
    const defaults = defaultInterpretation();
    const interpretation = source.interpretation || {};
    return {
      ...JSON.parse(JSON.stringify(source)),
      interpretation: {
        ...defaults,
        ...interpretation,
        separator: {
          ...defaults.separator,
          ...(interpretation.separator || {}),
        },
      },
    };
  }

  function definitionFromRow(row, index = 0) {
    const column = preferredColumn(row);
    const value = String(row && row.values && row.values[column] || '').trim();
    return {
      id: uniqueDefinitionId(value || `block_${index + 1}`, index),
      name: value || `Bloque ${index + 1}`,
      header: {
        column,
        operator: value ? 'equals' : 'nonempty',
        value,
        bold: row && row.bold && row.bold[column] ? 'required' : 'ignore',
        merged_b_to_d: row && row.merged_b_to_d ? 'required' : 'ignore',
      },
      interpretation: defaultInterpretation(),
    };
  }

  function validateDefinition(definition) {
    const errors = [];
    const header = definition && definition.header || {};
    if (!String(definition && definition.name || '').trim()) errors.push('El bloque necesita un nombre.');
    if (!COLUMNS.includes(header.column)) errors.push('Selecciona una columna válida.');
    if (!OPERATORS.includes(header.operator)) errors.push('Selecciona una condición válida.');
    if (!REQUIREMENTS.includes(header.bold)) errors.push('La condición de negrita no es válida.');
    if (!REQUIREMENTS.includes(header.merged_b_to_d)) errors.push('La condición de combinación no es válida.');
    if (header.operator !== 'nonempty' && !String(header.value || '').trim()) {
      errors.push('La condición necesita un valor.');
    }
    if (header.operator === 'regex') {
      try {
        new RegExp(header.value, 'iu');
      } catch (_error) {
        errors.push('La expresión regular no es válida.');
      }
    }
    const interpretation = normalizeDefinition(definition).interpretation;
    if (interpretation.type !== 'principal_with_associated_values') {
      errors.push('El tipo de interpretación no es válido.');
    }
    if (interpretation.traversal !== 'row_major') {
      errors.push('El orden de lectura no es válido.');
    }
    if (interpretation.separator.condition !== 'empty_row') {
      errors.push('La condición del separador no es válida.');
    }
    if (!SEPARATOR_MEANINGS.includes(interpretation.separator.meaning)) {
      errors.push('El significado del separador no es válido.');
    }
    return errors;
  }

  function rowMatchesDefinition(row, definition) {
    if (validateDefinition(definition).length) return false;
    const header = definition.header;
    const value = String(row && row.values && row.values[header.column] || '').trim();
    if (!matchesValue(value, header.operator, header.value)) return false;
    if (!matchesRequirement(Boolean(row && row.bold && row.bold[header.column]), header.bold)) return false;
    if (!matchesRequirement(Boolean(row && row.merged_b_to_d), header.merged_b_to_d)) return false;
    return true;
  }

  function findBlockInstances(rows, definitions) {
    const sourceRows = rows || [];
    const instances = [];
    let cursor = 0;

    (definitions || []).forEach((definition, definitionIndex) => {
      let matchIndex = -1;
      for (let index = cursor; index < sourceRows.length; index += 1) {
        if (rowMatchesDefinition(sourceRows[index], definition)) {
          matchIndex = index;
          break;
        }
      }
      if (matchIndex < 0) {
        instances.push({
          definition_id: definition.id,
          definition_index: definitionIndex,
          name: definition.name,
          matched: false,
          start_row: null,
          end_row: null,
          row_count: 0,
        });
        return;
      }
      instances.push({
        definition_id: definition.id,
        definition_index: definitionIndex,
        name: definition.name,
        matched: true,
        source_index: matchIndex,
        start_row: sourceRows[matchIndex].row,
        end_row: sourceRows[matchIndex].row,
        row_count: 1,
      });
      cursor = matchIndex + 1;
    });

    const matched = instances.filter((instance) => instance.matched);
    matched.forEach((instance, index) => {
      const next = matched[index + 1];
      const endIndex = next ? next.source_index - 1 : sourceRows.length - 1;
      const rangeRows = sourceRows.slice(instance.source_index, endIndex + 1);
      instance.end_row = rangeRows.length ? rangeRows[rangeRows.length - 1].row : instance.start_row;
      instance.row_count = rangeRows.length;
    });
    return instances;
  }

  function modelDocument(definitions, compositionRules = []) {
    return {
      schema: 'parser_lab_block_model',
      version: 1,
      blocks: (definitions || []).map(normalizeDefinition),
      composition_rules: (compositionRules || []).map(normalizeCompositionRule),
    };
  }

  function normalizeCompositionRule(rule, index = 0) {
    const source = rule || {};
    const scope = source.scope || 'item';
    const defaultField = scope === 'block' ? 'name' : 'principal';
    return {
      id: String(source.id || `composition_${String(index + 1).padStart(2, '0')}`),
      scope,
      match: {
        field: source.match && source.match.field || defaultField,
        operator: source.match && source.match.operator || 'equals',
        value: String(source.match && source.match.value || ''),
      },
      action: {
        type: source.action && source.action.type || 'group_next',
        count: Number(source.action && source.action.count !== undefined ? source.action.count : 1),
        target: source.action && source.action.target || 'cartela',
      },
    };
  }

  function validateCompositionRule(rule) {
    const normalized = normalizeCompositionRule(rule);
    const errors = [];
    if (!COMPOSITION_SCOPES.includes(normalized.scope)) errors.push('El ámbito de composición no es válido.');
    const expectedField = normalized.scope === 'block' ? 'name' : 'principal';
    if (normalized.match.field !== expectedField) errors.push(`El campo debe ser ${expectedField}.`);
    if (!OPERATORS.includes(normalized.match.operator) || normalized.match.operator === 'nonempty') {
      errors.push('El operador de composición no es válido.');
    }
    if (!normalized.match.value.trim()) errors.push('La regla de composición necesita un valor.');
    if (normalized.match.operator === 'regex') {
      try {
        new RegExp(normalized.match.value, 'iu');
      } catch (_error) {
        errors.push('La expresión regular de composición no es válida.');
      }
    }
    if (normalized.action.type !== 'group_next') errors.push('La acción de composición no es válida.');
    if (!Number.isInteger(normalized.action.count) || normalized.action.count < 1) {
      errors.push('Indica cuántos elementos siguientes deben agruparse.');
    }
    if (!COMPOSITION_TARGETS.includes(normalized.action.target)) {
      errors.push('El destino de composición no es válido.');
    }
    return errors;
  }

  function interpretModel(rows, instances, definitions) {
    const definitionsById = new Map((definitions || []).map((definition) => [definition.id, definition]));
    return {
      schema: 'parser_lab_semantic_preview',
      version: 1,
      blocks: (instances || []).map((instance) => interpretBlock(
        rows || [],
        instance,
        definitionsById.get(instance.definition_id)
      )),
    };
  }

  function interpretBlock(rows, instance, definition) {
    const normalized = normalizeDefinition(definition);
    const result = {
      definition_id: instance && instance.definition_id || normalized.id,
      name: instance && instance.name || normalized.name,
      matched: Boolean(instance && instance.matched),
      start_row: instance && instance.start_row || null,
      end_row: instance && instance.end_row || null,
      items: [],
    };
    if (!instance || !instance.matched) return result;

    const bodyStart = instance.source_index + 1;
    const bodyEnd = instance.source_index + instance.row_count;
    const bodyRows = (rows || []).slice(bodyStart, bodyEnd);
    let values = [];
    let sourceRows = [];

    const flush = (endedBySeparator) => {
      if (!values.length) return;
      result.items.push({
        principal: values[0].value,
        associated: values.slice(1).map((entry) => entry.value),
        separator_after: endedBySeparator ? normalized.interpretation.separator.meaning : null,
        source_rows: sourceRows.slice(),
        source_values: values.slice(),
      });
      values = [];
      sourceRows = [];
    };

    bodyRows.forEach((row) => {
      if (isEmptyRow(row)) {
        flush(true);
        return;
      }
      const rowValues = flattenRowValues(row, normalized.interpretation.split_cell_lines);
      if (!rowValues.length) return;
      sourceRows.push(row.row);
      values.push(...rowValues);
    });
    flush(false);
    return result;
  }

  function composePreview(semanticPreview, compositionRules) {
    const rules = (compositionRules || []).map(normalizeCompositionRule);
    const itemRules = rules.filter((rule) => rule.scope === 'item' && !validateCompositionRule(rule).length);
    const blockRules = rules.filter((rule) => rule.scope === 'block' && !validateCompositionRule(rule).length);
    const blocks = ((semanticPreview && semanticPreview.blocks) || []).filter((block) => block.matched).map((block) => ({
      ...block,
      item_groups: composeSequence(block.items || [], itemRules, (item) => item.principal),
    }));
    return {
      schema: 'parser_lab_composed_preview',
      version: 1,
      block_groups: composeSequence(blocks, blockRules, (block) => block.name),
    };
  }

  function composeSequence(nodes, rules, fieldValue) {
    const groups = [];
    let index = 0;
    while (index < nodes.length) {
      const node = nodes[index];
      const rule = rules.find((candidate) => matchesValue(
        fieldValue(node),
        candidate.match.operator,
        candidate.match.value
      ));
      if (!rule) {
        groups.push({ target: null, rule_id: null, members: [node] });
        index += 1;
        continue;
      }
      const end = Math.min(nodes.length, index + rule.action.count + 1);
      groups.push({
        target: rule.action.target,
        rule_id: rule.id,
        members: nodes.slice(index, end),
      });
      index = end;
    }
    return groups;
  }

  function isEmptyRow(row) {
    if (row && row.empty) return true;
    return !COLUMNS.some((column) => String(row && row.values && row.values[column] || '').trim());
  }

  function flattenRowValues(row, splitCellLines) {
    const entries = [];
    COLUMNS.forEach((column) => {
      const rawValue = String(row && row.values && row.values[column] || '');
      const parts = splitCellLines ? rawValue.split(/\r?\n/) : [rawValue];
      parts.forEach((part, lineIndex) => {
        const value = part.trim();
        if (!value) return;
        entries.push({ row: row.row, column, line: lineIndex + 1, value });
      });
    });
    return entries;
  }

  function preferredColumn(row) {
    const values = row && row.values || {};
    return ['C', 'B', 'D', 'A'].find((column) => String(values[column] || '').trim()) || 'C';
  }

  function matchesValue(actual, operator, expected) {
    const normalizedActual = normalizeText(actual);
    const normalizedExpected = normalizeText(expected);
    if (operator === 'nonempty') return Boolean(normalizedActual);
    if (operator === 'equals') return normalizedActual === normalizedExpected;
    if (operator === 'contains') return normalizedActual.includes(normalizedExpected);
    if (operator === 'regex') return new RegExp(expected, 'iu').test(actual);
    return false;
  }

  function matchesRequirement(actual, requirement) {
    if (requirement === 'ignore') return true;
    if (requirement === 'required') return actual;
    if (requirement === 'forbidden') return !actual;
    return false;
  }

  function normalizeText(value) {
    return String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
  }

  function uniqueDefinitionId(value, index) {
    const slug = String(value || 'block')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'block';
    return `block_${String(index + 1).padStart(2, '0')}_${slug}`;
  }

  root.CreditosParserLabBlockModel = {
    definitionFromRow,
    composePreview,
    findBlockInstances,
    interpretBlock,
    interpretModel,
    modelDocument,
    normalizeCompositionRule,
    normalizeDefinition,
    rowMatchesDefinition,
    validateCompositionRule,
    validateDefinition,
  };
})(globalThis);
