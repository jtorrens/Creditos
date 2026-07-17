(function (root) {
  const COLUMNS = ['A', 'B', 'C', 'D'];
  const OPERATORS = ['equals', 'contains', 'regex', 'nonempty'];
  const REQUIREMENTS = ['ignore', 'required', 'forbidden'];
  const EMPTY_ROW_EFFECTS = ['continue', 'item', 'group', 'page'];
  const EMPTY_ROW_DISPLAYS = ['ignore', 'compact', 'preserve'];
  const ORIENTATIONS = ['vertical', 'horizontal'];
  const ITEM_GROUPINGS = ['empty_rows', 'row', 'first_term'];
  const TERM_ROLES = ['principal', 'secondary'];
  const COMPOSITION_SCOPES = ['item', 'block'];
  const COMPOSITION_TARGETS = ['group', 'page', 'cartela'];

  function defaultInterpretation() {
    return {
      type: 'principal_with_associated_values',
      orientation: 'vertical',
      item_grouping: 'empty_rows',
      item_start_column: 'B',
      traversal: 'row_major',
      split_cell_lines: true,
      term_roles: {
        first: 'principal',
        following: 'secondary',
      },
      empty_rows: {
        leading: { effect: 'continue', display: 'ignore' },
        between_items: { effect: 'item', display: 'ignore' },
        trailing: { effect: 'continue', display: 'ignore' },
      },
    };
  }

  function normalizeDefinition(definition) {
    return JSON.parse(JSON.stringify(definition));
  }

  function definitionFromRow(row, index = 0) {
    const column = preferredColumn(row);
    const value = String(row && row.values && row.values[column] || '').trim();
    return {
      id: uniqueDefinitionId(value || `block_${index + 1}`, index),
      name: value || `Bloque ${index + 1}`,
      enabled: true,
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
    if (typeof (definition && definition.enabled) !== 'boolean') {
      errors.push('El estado de inclusión del bloque no es válido.');
    }
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
    const interpretation = definition && definition.interpretation || {};
    if (interpretation.type !== 'principal_with_associated_values') {
      errors.push('El tipo de interpretación no es válido.');
    }
    if (!ORIENTATIONS.includes(interpretation.orientation)) {
      errors.push('La orientación del bloque no es válida.');
    }
    if (!ITEM_GROUPINGS.includes(interpretation.item_grouping)) {
      errors.push('La forma de crear los ítems no es válida.');
    }
    if (!COLUMNS.includes(interpretation.item_start_column)) {
      errors.push('La columna que inicia cada ítem no es válida.');
    }
    const termRoles = interpretation.term_roles || {};
    if (!TERM_ROLES.includes(termRoles.first) || !TERM_ROLES.includes(termRoles.following)) {
      errors.push('La clasificación de los términos no es válida.');
    }
    if (interpretation.traversal !== 'row_major') {
      errors.push('El orden de lectura no es válido.');
    }
    if (interpretation.split_cell_lines !== true) {
      errors.push('La lectura de líneas de celda no es válida.');
    }
    if (Object.prototype.hasOwnProperty.call(interpretation, 'separator')) {
      errors.push('El contrato antiguo de separador ya no es válido.');
    }
    const emptyRows = interpretation.empty_rows || {};
    if (!emptyRows.leading || !emptyRows.between_items || !emptyRows.trailing) {
      errors.push('Falta la definición completa de filas vacías.');
    }
    Object.values(emptyRows).forEach((policy) => {
      if (!EMPTY_ROW_EFFECTS.includes(policy.effect)) errors.push('El efecto de las filas vacías no es válido.');
      if (!EMPTY_ROW_DISPLAYS.includes(policy.display)) errors.push('El tratamiento visual de las filas vacías no es válido.');
    });
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

  function modelDocument(definitions, compositionRules, normalizedRowsView) {
    return {
      schema: 'parser_lab_block_model',
      version: 4,
      blocks: definitions.map(normalizeDefinition),
      composition_rules: compositionRules.map(normalizeCompositionRule),
      normalized_rows_view: JSON.parse(JSON.stringify(normalizedRowsView)),
    };
  }

  function copyDefinitionSettings(targetDefinition, sourceDefinition) {
    const target = normalizeDefinition(targetDefinition);
    const source = normalizeDefinition(sourceDefinition);
    return normalizeDefinition({
      ...target,
      header: {
        ...target.header,
        bold: source.header.bold,
        merged_b_to_d: source.header.merged_b_to_d,
      },
      interpretation: JSON.parse(JSON.stringify(source.interpretation)),
    });
  }

  function normalizeCompositionRule(rule, index = 0) {
    return JSON.parse(JSON.stringify(rule));
  }

  function validateCompositionRule(rule) {
    const normalized = rule || {};
    const errors = [];
    if (!COMPOSITION_SCOPES.includes(normalized.scope)) errors.push('El ámbito de composición no es válido.');
    const match = normalized.match || {};
    const action = normalized.action || {};
    const expectedField = normalized.scope === 'block' ? 'name' : 'principal';
    if (match.field !== expectedField) errors.push(`El campo debe ser ${expectedField}.`);
    if (!OPERATORS.includes(match.operator) || match.operator === 'nonempty') {
      errors.push('El operador de composición no es válido.');
    }
    if (!String(match.value || '').trim()) errors.push('La regla de composición necesita un valor.');
    if (match.operator === 'regex') {
      try {
        new RegExp(match.value, 'iu');
      } catch (_error) {
        errors.push('La expresión regular de composición no es válida.');
      }
    }
    if (action.type !== 'group_next') errors.push('La acción de composición no es válida.');
    if (!Number.isInteger(action.count) || action.count < 1) {
      errors.push('Indica cuántos elementos siguientes deben agruparse.');
    }
    if (!COMPOSITION_TARGETS.includes(action.target)) {
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
      enabled: normalized.enabled,
      start_row: instance && instance.start_row || null,
      end_row: instance && instance.end_row || null,
      orientation: normalized.interpretation.orientation,
      items: [],
      leading_empty_rows: null,
      trailing_empty_rows: null,
    };
    if (!instance || !instance.matched || !normalized.enabled) return result;

    const bodyStart = instance.source_index + 1;
    const bodyEnd = instance.source_index + instance.row_count;
    const bodyRows = (rows || []).slice(bodyStart, bodyEnd);
    const populatedIndexes = bodyRows.reduce((indexes, row, index) => {
      if (!isEmptyRow(row)) indexes.push(index);
      return indexes;
    }, []);
    if (!populatedIndexes.length) {
      result.leading_empty_rows = emptyRowBoundary(
        normalized.interpretation.empty_rows.leading,
        bodyRows.length
      );
      return result;
    }
    const firstPopulatedIndex = populatedIndexes[0];
    const lastPopulatedIndex = populatedIndexes[populatedIndexes.length - 1];
    result.leading_empty_rows = emptyRowBoundary(
      normalized.interpretation.empty_rows.leading,
      firstPopulatedIndex
    );
    result.trailing_empty_rows = emptyRowBoundary(
      normalized.interpretation.empty_rows.trailing,
      bodyRows.length - lastPopulatedIndex - 1
    );
    if (normalized.interpretation.item_grouping === 'row') {
      interpretHorizontalRows(
        bodyRows,
        firstPopulatedIndex,
        lastPopulatedIndex,
        normalized.interpretation,
        result
      );
      return result;
    }
    if (normalized.interpretation.item_grouping === 'first_term') {
      interpretHorizontalGroupedRows(
        bodyRows,
        firstPopulatedIndex,
        lastPopulatedIndex,
        normalized.interpretation,
        result
      );
      return result;
    }
    let values = [];
    let sourceRows = [];
    let internalEmptyRows = [];

    const flush = (emptyBoundary = null) => {
      if (!values.length) return;
      const item = buildItem(values, sourceRows, normalized.interpretation, emptyBoundary);
      if (emptyBoundary) item.empty_rows_after = emptyBoundary;
      if (internalEmptyRows.length) item.internal_empty_rows = internalEmptyRows.slice();
      result.items.push(item);
      values = [];
      sourceRows = [];
      internalEmptyRows = [];
    };

    for (let index = firstPopulatedIndex; index <= lastPopulatedIndex; index += 1) {
      const row = bodyRows[index];
      if (isEmptyRow(row)) {
        let emptyCount = 1;
        while (index + 1 <= lastPopulatedIndex && isEmptyRow(bodyRows[index + 1])) {
          emptyCount += 1;
          index += 1;
        }
        const boundary = emptyRowBoundary(normalized.interpretation.empty_rows.between_items, emptyCount);
        if (boundary.effect === 'continue') internalEmptyRows.push(boundary);
        else flush(boundary);
        continue;
      }
      const rowValues = flattenRowValues(row, normalized.interpretation.split_cell_lines);
      if (!rowValues.length) continue;
      sourceRows.push(row.row);
      values.push(...rowValues);
    }
    flush();
    return result;
  }

  function interpretHorizontalRows(bodyRows, firstIndex, lastIndex, interpretation, result) {
    for (let index = firstIndex; index <= lastIndex; index += 1) {
      const row = bodyRows[index];
      if (isEmptyRow(row)) {
        let emptyCount = 1;
        while (index + 1 <= lastIndex && isEmptyRow(bodyRows[index + 1])) {
          emptyCount += 1;
          index += 1;
        }
        const previousItem = result.items[result.items.length - 1];
        if (previousItem) applyEmptyBoundary(previousItem, emptyRowBoundary(
          interpretation.empty_rows.between_items,
          emptyCount
        ));
        continue;
      }
      const values = flattenRowValues(row, interpretation.split_cell_lines);
      if (!values.length) continue;
      result.items.push(buildItem(values, [row.row], interpretation));
    }
  }

  function interpretHorizontalGroupedRows(bodyRows, firstIndex, lastIndex, interpretation, result) {
    let values = [];
    let sourceRows = [];
    let internalEmptyRows = [];
    const flush = (emptyBoundary = null) => {
      if (!values.length) return;
      const item = buildItem(values, sourceRows, interpretation, emptyBoundary);
      if (internalEmptyRows.length) item.internal_empty_rows = internalEmptyRows.slice();
      result.items.push(item);
      values = [];
      sourceRows = [];
      internalEmptyRows = [];
    };

    for (let index = firstIndex; index <= lastIndex; index += 1) {
      const row = bodyRows[index];
      if (isEmptyRow(row)) {
        let emptyCount = 1;
        while (index + 1 <= lastIndex && isEmptyRow(bodyRows[index + 1])) {
          emptyCount += 1;
          index += 1;
        }
        const boundary = emptyRowBoundary(interpretation.empty_rows.between_items, emptyCount);
        if (boundary.effect === 'continue') internalEmptyRows.push(boundary);
        else flush(boundary);
        continue;
      }
      const rowValues = flattenRowValues(row, interpretation.split_cell_lines);
      if (!rowValues.length) continue;
      const startsItem = Boolean(String(
        row.values && row.values[interpretation.item_start_column] || ''
      ).trim());
      if (startsItem && values.length) flush();
      sourceRows.push(row.row);
      values.push(...rowValues);
    }
    flush();
  }

  function buildItem(values, sourceRows, interpretation, emptyBoundary = null) {
    const terms = values.map((entry, index) => ({
      ...entry,
      role: index === 0 ? interpretation.term_roles.first : interpretation.term_roles.following,
    }));
    const principalTerms = terms.filter((term) => term.role === 'principal');
    const principal = principalTerms.length ? principalTerms[0].value : terms[0].value;
    const item = {
      principal,
      role: terms[0].role,
      associated: terms.filter((term) => term.value !== principal || term !== principalTerms[0]).map((term) => term.value),
      terms,
      orientation: interpretation.orientation,
      separator_after: null,
      source_rows: sourceRows.slice(),
      source_values: values.slice(),
    };
    if (emptyBoundary) applyEmptyBoundary(item, emptyBoundary);
    return item;
  }

  function applyEmptyBoundary(item, boundary) {
    item.separator_after = boundary && boundary.effect !== 'continue' ? boundary.effect : null;
    if (boundary) item.empty_rows_after = boundary;
  }

  function emptyRowBoundary(policy, sourceCount) {
    if (!sourceCount) return null;
    return {
      effect: policy.effect,
      display: policy.display,
      source_count: sourceCount,
      output_count: policy.display === 'preserve' ? sourceCount : policy.display === 'compact' ? 1 : 0,
    };
  }

  function composePreview(semanticPreview, compositionRules) {
    const rules = (compositionRules || []).map(normalizeCompositionRule);
    const itemRules = rules.filter((rule) => rule.scope === 'item' && !validateCompositionRule(rule).length);
    const blockRules = rules.filter((rule) => rule.scope === 'block' && !validateCompositionRule(rule).length);
    const blocks = ((semanticPreview && semanticPreview.blocks) || []).filter((block) => (
      block.matched && block.enabled
    )).map((block) => ({
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
    copyDefinitionSettings,
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
