(function (root) {
  const COLUMNS = ['A', 'B', 'C', 'D'];
  const OPERATORS = ['equals', 'contains', 'regex', 'nonempty'];
  const HEADER_SOURCES = ['match', 'sheet_start', 'after_previous', 'sheet_end'];
  const REQUIREMENTS = ['ignore', 'required', 'forbidden'];
  const EMPTY_ROW_EFFECTS = ['continue', 'item', 'group', 'page'];
  const EMPTY_ROW_DISPLAYS = ['ignore', 'compact', 'preserve'];
  const ORIENTATIONS = ['vertical', 'horizontal'];
  const ITEM_GROUPINGS = ['empty_rows', 'row', 'first_term'];
  const CONTENT_STARTS = ['after_header', 'header'];
  const TERM_ROLES = ['principal', 'secondary'];
  const COMPOSITION_SCOPES = ['item', 'block'];
  const COMPOSITION_TARGETS = ['group', 'page', 'cartela'];

  function defaultInterpretation() {
    return {
      type: 'principal_with_associated_values',
      orientation: 'vertical',
      content_start: 'after_header',
      item_grouping: 'empty_rows',
      item_start_column: 'B',
      item_start_merged_b_to_d: 'ignore',
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
        source: 'match',
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
    if (!HEADER_SOURCES.includes(header.source)) errors.push('Selecciona un inicio de bloque válido.');
    if (!COLUMNS.includes(header.column)) errors.push('Selecciona una columna válida.');
    if (!OPERATORS.includes(header.operator)) errors.push('Selecciona una condición válida.');
    if (!REQUIREMENTS.includes(header.bold)) errors.push('La condición de negrita no es válida.');
    if (!REQUIREMENTS.includes(header.merged_b_to_d)) errors.push('La condición de combinación no es válida.');
    if (header.source === 'match' && header.operator !== 'nonempty' && !String(header.value || '').trim()) {
      errors.push('La condición necesita un valor.');
    }
    if (header.source === 'match' && header.operator === 'regex') {
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
    if (!CONTENT_STARTS.includes(interpretation.content_start)) {
      errors.push('El inicio del contenido del bloque no es válido.');
    }
    if (!ITEM_GROUPINGS.includes(interpretation.item_grouping)) {
      errors.push('La forma de crear los ítems no es válida.');
    }
    if (!COLUMNS.includes(interpretation.item_start_column)) {
      errors.push('La columna que inicia cada ítem no es válida.');
    }
    if (!REQUIREMENTS.includes(interpretation.item_start_merged_b_to_d)) {
      errors.push('La condición de combinación del primer término no es válida.');
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
    return compileDefinitionMatcher(definition)(row);
  }

  function compileDefinitionMatcher(definition, validationErrors = validateDefinition(definition)) {
    if (validationErrors.length) return () => false;
    const header = definition.header;
    if (header.source !== 'match') return () => false;
    const expected = normalizeText(header.value);
    const expression = header.operator === 'regex' ? new RegExp(header.value, 'iu') : null;
    return (row) => {
      const value = String(row && row.values && row.values[header.column] || '').trim();
      const normalizedValue = normalizeText(value);
      const valueMatches = header.operator === 'nonempty'
        ? Boolean(normalizedValue)
        : header.operator === 'equals'
          ? normalizedValue === expected
          : header.operator === 'contains'
            ? normalizedValue.includes(expected)
            : expression.test(value);
      if (!valueMatches) return false;
      if (!matchesRequirement(Boolean(row && row.bold && row.bold[header.column]), header.bold)) return false;
      if (!matchesRequirement(Boolean(row && row.merged_b_to_d), header.merged_b_to_d)) return false;
      return true;
    };
  }

  function findBlockInstances(rows, definitions) {
    const sourceRows = rows || [];
    const sourceDefinitions = definitions || [];
    const definitionValidationErrors = sourceDefinitions.map(validateDefinition);
    const definitionMatchers = sourceDefinitions.map((definition, definitionIndex) => (
      compileDefinitionMatcher(definition, definitionValidationErrors[definitionIndex])
    ));
    const matchedCandidatesByDefinition = sourceDefinitions.map((definition, definitionIndex) => (
      sourceRows.reduce((indexes, row, index) => {
        if (definitionMatchers[definitionIndex](row)) indexes.push(index);
        return indexes;
      }, [])
    ));
    let cursor = 0;
    const instances = sourceDefinitions.map((definition, definitionIndex) => {
      const validationErrors = definitionValidationErrors[definitionIndex];
      const headerSource = definition && definition.header && definition.header.source;
      const candidateIndexes = structuralCandidateIndexes(
        sourceRows,
        headerSource,
        cursor,
        matchedCandidatesByDefinition[definitionIndex]
      );
      const orderedCandidates = candidateIndexes.filter((index) => index >= cursor);
      const precedingCandidates = candidateIndexes.filter((index) => index < cursor);
      const candidateRows = candidateIndexes.map((index) => sourceRows[index].row);
      const scannedFromRow = sourceRows[cursor] ? sourceRows[cursor].row : null;
      let matchStatus = 'matched';
      let matchIndex = orderedCandidates[0];
      const diagnostics = [];

      if (validationErrors.length) {
        matchStatus = 'invalid';
        matchIndex = undefined;
        diagnostics.push(diagnostic(
          'invalid_definition',
          'error',
          validationErrors.join(' '),
          candidateRows
        ));
      } else if (matchIndex === undefined) {
        matchStatus = precedingCandidates.length ? 'out_of_order' : 'missing';
        diagnostics.push(diagnostic(
          matchStatus,
          'error',
          precedingCandidates.length
            ? `La frontera solo aparece antes de la posición esperada: ${rowList(candidateRows)}.`
            : 'La frontera no aparece en la hoja.',
          candidateRows
        ));
      } else if (orderedCandidates.length > 1) {
        matchStatus = 'ambiguous';
        diagnostics.push(diagnostic(
          'ambiguous_header',
          'warning',
          `La regla coincide con varias filas: ${rowList(orderedCandidates.map((index) => sourceRows[index].row))}.`,
          orderedCandidates.map((index) => sourceRows[index].row)
        ));
      }

      if (matchIndex === undefined) {
        return {
          definition_id: definition.id,
          definition_index: definitionIndex,
          name: definition.name,
          matched: false,
          match_status: matchStatus,
          candidate_rows: candidateRows,
          diagnostics,
          match_trace: {
            scanned_from_row: scannedFromRow,
            candidate_rows: candidateRows,
            selected_row: null,
            reason: diagnostics[0] ? diagnostics[0].message : 'Sin coincidencia.',
          },
          start_row: null,
          end_row: null,
          row_count: 0,
          range_status: 'unresolved',
          range_diagnostics: [],
        };
      }

      const instance = {
        definition_id: definition.id,
        definition_index: definitionIndex,
        name: definition.name,
        matched: true,
        match_status: matchStatus,
        candidate_rows: candidateRows,
        diagnostics,
        match_trace: {
          scanned_from_row: scannedFromRow,
          candidate_rows: candidateRows,
          selected_row: sourceRows[matchIndex].row,
          reason: matchStatus === 'ambiguous'
            ? `Se usa provisionalmente la primera coincidencia ordenada, fila ${sourceRows[matchIndex].row}.`
            : structuralMatchReason(headerSource, sourceRows[matchIndex].row),
        },
        source_index: matchIndex,
        start_row: sourceRows[matchIndex].row,
        end_row: sourceRows[matchIndex].row,
        row_count: 1,
        range_status: 'resolved',
        range_diagnostics: [],
      };
      cursor = matchIndex + 1;
      return instance;
    });

    const matched = instances.filter((instance) => instance.matched);
    matched.forEach((instance, index) => {
      const next = matched[index + 1];
      const endIndex = next ? next.source_index - 1 : sourceRows.length - 1;
      const rangeRows = sourceRows.slice(instance.source_index, endIndex + 1);
      instance.end_row = rangeRows.length ? rangeRows[rangeRows.length - 1].row : instance.start_row;
      instance.row_count = rangeRows.length;
      const unresolvedEnd = next ? next.definition_index : instances.length;
      const unresolved = instances.slice(instance.definition_index + 1, unresolvedEnd).filter((candidate) => (
        !candidate.matched
      ));
      const rangeDiagnostics = [];
      if (instance.match_status === 'ambiguous') {
        rangeDiagnostics.push(diagnostic(
          'ambiguous_start',
          'warning',
          'El comienzo del bloque es provisional porque su cabecera es ambigua.',
          instance.candidate_rows
        ));
      }
      if (next && next.match_status === 'ambiguous') {
        rangeDiagnostics.push(diagnostic(
          'ambiguous_end',
          'warning',
          `El final depende de la cabecera ambigua “${next.name}”.`,
          next.candidate_rows
        ));
      }
      unresolved.forEach((candidate) => {
        rangeDiagnostics.push(diagnostic(
          'unresolved_boundary',
          'warning',
          `No se ha podido usar “${candidate.name}” como frontera (${candidate.match_status}).`,
          candidate.candidate_rows
        ));
      });
      instance.range_diagnostics = rangeDiagnostics;
      instance.range_status = rangeDiagnostics.length ? 'warning' : 'resolved';
    });
    return instances;
  }

  function structuralCandidateIndexes(rows, source, cursor, matchedCandidates) {
    if (!rows.length) return [];
    if (source === 'sheet_start') return [0];
    if (source === 'sheet_end') return [rows.length - 1];
    if (source === 'after_previous') return cursor < rows.length ? [cursor] : [];
    return matchedCandidates;
  }

  function structuralMatchReason(source, rowNumber) {
    if (source === 'sheet_start') return `Inicio de hoja en la fila ${rowNumber}.`;
    if (source === 'sheet_end') return `Última fila de la hoja, fila ${rowNumber}.`;
    if (source === 'after_previous') return `Fila siguiente a la frontera anterior, fila ${rowNumber}.`;
    return `Coincidencia única y ordenada en la fila ${rowNumber}.`;
  }

  function diagnostic(code, severity, message, rows = []) {
    return { code, severity, message, rows: rows.slice() };
  }

  function rowList(rows) {
    return rows.map((row) => `fila ${row}`).join(', ');
  }

  function modelDocument(definitions, compositionRules, normalizedRowsView) {
    return {
      schema: 'parser_lab_block_model',
      version: 8,
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
    const blocks = (instances || []).map((instance) => interpretBlock(
      rows || [],
      instance,
      definitionsById.get(instance.definition_id)
    ));
    return {
      schema: 'parser_lab_semantic_preview',
      version: 1,
      blocks,
      row_decisions: buildModelRowDecisions(rows || [], instances || [], blocks),
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
      content_start: normalized.interpretation.content_start,
      items: [],
      leading_empty_rows: null,
      trailing_empty_rows: null,
      detection: {
        match_status: instance && instance.match_status || 'missing',
        candidate_rows: instance && instance.candidate_rows || [],
        diagnostics: instance && instance.diagnostics || [],
        range_status: instance && instance.range_status || 'unresolved',
        range_diagnostics: instance && instance.range_diagnostics || [],
        trace: instance && instance.match_trace || null,
      },
      row_trace: [],
    };
    if (!instance || !instance.matched || !normalized.enabled) {
      return finalizeBlockTrace(rows || [], instance, normalized.interpretation, result);
    }

    const bodyStart = normalized.interpretation.content_start === 'header'
      ? instance.source_index
      : instance.source_index + 1;
    const bodyEnd = instance.source_index + instance.row_count;
    const bodyRows = (rows || []).slice(bodyStart, bodyEnd);
    const populatedIndexes = bodyRows.reduce((indexes, row, index) => {
      if (!isEmptyRow(row)) indexes.push(index);
      return indexes;
    }, []);
    if (!populatedIndexes.length) {
      result.leading_empty_rows = emptyRowBoundary(
        normalized.interpretation.empty_rows.leading,
        bodyRows
      );
      return finalizeBlockTrace(rows || [], instance, normalized.interpretation, result);
    }
    const firstPopulatedIndex = populatedIndexes[0];
    const lastPopulatedIndex = populatedIndexes[populatedIndexes.length - 1];
    result.leading_empty_rows = emptyRowBoundary(
      normalized.interpretation.empty_rows.leading,
      bodyRows.slice(0, firstPopulatedIndex)
    );
    result.trailing_empty_rows = emptyRowBoundary(
      normalized.interpretation.empty_rows.trailing,
      bodyRows.slice(lastPopulatedIndex + 1)
    );
    if (normalized.interpretation.item_grouping === 'row') {
      interpretHorizontalRows(
        bodyRows,
        firstPopulatedIndex,
        lastPopulatedIndex,
        normalized.interpretation,
        result
      );
      return finalizeBlockTrace(rows || [], instance, normalized.interpretation, result);
    }
    if (normalized.interpretation.item_grouping === 'first_term') {
      interpretHorizontalGroupedRows(
        bodyRows,
        firstPopulatedIndex,
        lastPopulatedIndex,
        normalized.interpretation,
        result
      );
      return finalizeBlockTrace(rows || [], instance, normalized.interpretation, result);
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
        const emptyRows = [row];
        while (index + 1 <= lastPopulatedIndex && isEmptyRow(bodyRows[index + 1])) {
          emptyRows.push(bodyRows[index + 1]);
          index += 1;
        }
        const boundary = emptyRowBoundary(normalized.interpretation.empty_rows.between_items, emptyRows);
        if (boundary.effect === 'continue') {
          boundary.after_term_index = values.length;
          internalEmptyRows.push(boundary);
        }
        else flush(boundary);
        continue;
      }
      const rowValues = flattenRowValues(row, normalized.interpretation.split_cell_lines);
      if (!rowValues.length) continue;
      sourceRows.push(row.row);
      values.push(...rowValues);
    }
    flush();
    return finalizeBlockTrace(rows || [], instance, normalized.interpretation, result);
  }

  function interpretHorizontalRows(bodyRows, firstIndex, lastIndex, interpretation, result) {
    for (let index = firstIndex; index <= lastIndex; index += 1) {
      const row = bodyRows[index];
      if (isEmptyRow(row)) {
        const emptyRows = [row];
        while (index + 1 <= lastIndex && isEmptyRow(bodyRows[index + 1])) {
          emptyRows.push(bodyRows[index + 1]);
          index += 1;
        }
        const previousItem = result.items[result.items.length - 1];
        if (previousItem) {
          const boundary = emptyRowBoundary(interpretation.empty_rows.between_items, emptyRows);
          boundary.context = 'between_row_items';
          boundary.effective_effect = 'item';
          boundary.reason = 'La agrupación por fila ya crea un ítem independiente a cada lado del hueco.';
          applyEmptyBoundary(previousItem, boundary);
        }
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
        const emptyRows = [row];
        while (index + 1 <= lastIndex && isEmptyRow(bodyRows[index + 1])) {
          emptyRows.push(bodyRows[index + 1]);
          index += 1;
        }
        const boundary = emptyRowBoundary(interpretation.empty_rows.between_items, emptyRows);
        if (boundary.effect === 'continue') {
          boundary.after_term_index = values.length;
          internalEmptyRows.push(boundary);
        }
        else flush(boundary);
        continue;
      }
      const rowValues = flattenRowValues(
        row,
        interpretation.split_cell_lines,
        interpretation.content_start === 'header' && index === firstIndex
          ? 'A'
          : interpretation.item_start_column
      );
      if (!rowValues.length) continue;
      const startsItem = Boolean(String(
        row.values && row.values[interpretation.item_start_column] || ''
      ).trim()) && matchesRequirement(
        Boolean(row.merged_b_to_d),
        interpretation.item_start_merged_b_to_d
      );
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
    const principalTerm = principalTerms[0] || terms[0] || null;
    const principal = principalTerm ? principalTerm.value : null;
    const item = {
      principal,
      role: terms[0] ? terms[0].role : interpretation.term_roles.first,
      associated: terms.filter((term) => term !== principalTerm).map((term) => term.value),
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
    const effect = boundary && (boundary.effective_effect || boundary.effect);
    item.separator_after = effect && effect !== 'continue' ? effect : null;
    if (boundary) item.empty_rows_after = boundary;
  }

  function emptyRowBoundary(policy, source) {
    const sourceRows = Array.isArray(source)
      ? source.map((row) => typeof row === 'number' ? row : row.row)
      : [];
    const sourceCount = Array.isArray(source) ? source.length : Number(source || 0);
    if (!sourceCount) return null;
    const boundary = {
      effect: policy.effect,
      display: policy.display,
      source_count: sourceCount,
      output_count: policy.display === 'preserve' ? sourceCount : policy.display === 'compact' ? 1 : 0,
    };
    if (sourceRows.length) boundary.source_rows = sourceRows;
    return boundary;
  }

  function finalizeBlockTrace(rows, instance, interpretation, result) {
    if (!instance || !instance.matched) return result;
    const rangeRows = rows.slice(instance.source_index, instance.source_index + instance.row_count);
    const itemByRow = new Map();
    const boundaryByRow = new Map();

    result.items.forEach((item, itemIndex) => {
      const reason = itemDecisionReason(interpretation, item, itemIndex);
      item.decision_trace = {
        item_index: itemIndex,
        grouping: interpretation.item_grouping,
        reason,
        first_term_column: interpretation.item_grouping === 'first_term'
          ? interpretation.item_start_column
          : null,
        term_roles: { ...interpretation.term_roles },
        source_rows: item.source_rows.slice(),
      };
      item.source_rows.forEach((rowNumber) => itemByRow.set(rowNumber, { item, itemIndex, reason }));
      (item.internal_empty_rows || []).forEach((boundary) => registerBoundaryRows(
        boundaryByRow,
        boundary,
        'between_items_empty_continued',
        itemIndex,
        'La política intermedia conserva el hueco dentro del mismo ítem.'
      ));
      if (item.empty_rows_after) {
        const rowGrouping = item.empty_rows_after.context === 'between_row_items';
        registerBoundaryRows(
          boundaryByRow,
          item.empty_rows_after,
          rowGrouping ? 'between_row_items_empty' : 'between_items_empty_boundary',
          itemIndex,
          rowGrouping
            ? item.empty_rows_after.reason
            : `La política intermedia aplica “${item.empty_rows_after.effect}” después del ítem ${itemIndex + 1}.`
        );
      }
    });
    registerBoundaryRows(
      boundaryByRow,
      result.leading_empty_rows,
      'leading_empty',
      null,
      'Fila vacía entre la cabecera y el primer ítem; se aplica la política inicial.'
    );
    registerBoundaryRows(
      boundaryByRow,
      result.trailing_empty_rows,
      'trailing_empty',
      null,
      'Fila vacía después del último ítem; se aplica la política final.'
    );

    result.row_trace = rangeRows.map((row) => {
      const itemEntry = itemByRow.get(row.row);
      const boundaryEntry = boundaryByRow.get(row.row);
      const header = row.row === instance.start_row;
      const warnings = [
        ...(instance.diagnostics || []),
        ...(instance.range_diagnostics || []),
      ];
      if (header) {
        return {
          row: row.row,
          definition_id: result.definition_id,
          block_name: result.name,
          decision: itemEntry ? 'header_and_item' : 'header',
          item_index: itemEntry ? itemEntry.itemIndex : null,
          reason: itemEntry
            ? `${instance.match_trace.reason} La configuración incluye la cabecera como primer contenido.`
            : instance.match_trace.reason,
          warnings,
        };
      }
      if (!result.enabled) {
        return {
          row: row.row,
          definition_id: result.definition_id,
          block_name: result.name,
          decision: 'ignored_block',
          item_index: null,
          reason: 'La fila está dentro del rango, pero el bloque está excluido del previo.',
          warnings: [],
          range_status: instance.range_status,
        };
      }
      if (boundaryEntry) {
        return {
          row: row.row,
          definition_id: result.definition_id,
          block_name: result.name,
          decision: boundaryEntry.decision,
          item_index: boundaryEntry.itemIndex,
          reason: boundaryEntry.reason,
          boundary: boundaryEntry.boundary,
          warnings: [],
          range_status: instance.range_status,
        };
      }
      if (itemEntry) {
        const terms = itemEntry.item.terms.filter((term) => term.row === row.row).map((term) => ({
          column: term.column,
          line: term.line,
          value: term.value,
          role: term.role,
        }));
        return {
          row: row.row,
          definition_id: result.definition_id,
          block_name: result.name,
          decision: 'item_content',
          item_index: itemEntry.itemIndex,
          reason: itemEntry.reason,
          terms,
          warnings: [],
          range_status: instance.range_status,
        };
      }
      return {
        row: row.row,
        definition_id: result.definition_id,
        block_name: result.name,
        decision: isEmptyRow(row) ? 'empty_unclassified' : 'content_without_item',
        item_index: null,
        reason: isEmptyRow(row)
          ? 'La fila está vacía, pero no forma parte de una frontera interpretada.'
          : 'La fila pertenece al rango, pero no produjo términos después de aplicar la configuración.',
        warnings: [],
        range_status: instance.range_status,
      };
    });
    return result;
  }

  function registerBoundaryRows(target, boundary, decision, itemIndex, reason) {
    if (!boundary || !boundary.source_rows) return;
    boundary.source_rows.forEach((rowNumber) => target.set(rowNumber, {
      boundary,
      decision,
      itemIndex,
      reason,
    }));
  }

  function itemDecisionReason(interpretation, item, itemIndex) {
    if (interpretation.item_grouping === 'row') {
      return `Ítem ${itemIndex + 1}: cada fila con contenido crea un ítem independiente.`;
    }
    if (interpretation.item_grouping === 'first_term') {
      const startRow = item.source_rows[0];
      const merged = {
        required: ' y requiere una combinación B–D',
        forbidden: ' y requiere celdas B–D separadas',
        ignore: '',
      }[interpretation.item_start_merged_b_to_d] || '';
      return `Ítem ${itemIndex + 1}: la fila ${startRow} inicia un término en ${interpretation.item_start_column}${merged}; las filas siguientes continúan hasta el próximo inicio.`;
    }
    return `Ítem ${itemIndex + 1}: las filas con contenido se agrupan hasta la siguiente frontera de fila vacía.`;
  }

  function buildModelRowDecisions(rows, instances, blocks) {
    const traceByRow = new Map();
    blocks.forEach((block) => block.row_trace.forEach((entry) => traceByRow.set(entry.row, entry)));
    return rows.map((row) => {
      const headerCandidates = instances.filter((instance) => (
        (instance.candidate_rows || []).includes(row.row)
      )).map((instance) => ({
        definition_id: instance.definition_id,
        block_name: instance.name,
        selected: instance.start_row === row.row,
        match_status: instance.match_status,
      }));
      const traced = traceByRow.get(row.row);
      const decision = traced ? { ...traced } : {
        row: row.row,
        definition_id: null,
        block_name: null,
        decision: isEmptyRow(row) ? 'outside_empty' : 'outside_model',
        item_index: null,
        reason: 'La fila no pertenece a ningún rango de bloque encontrado.',
        warnings: [],
      };
      decision.header_candidates = headerCandidates;
      const alternativeCandidates = headerCandidates.filter((candidate) => !candidate.selected);
      if (alternativeCandidates.length) {
        decision.warnings = [
          ...(decision.warnings || []),
          diagnostic(
            'alternative_header_candidate',
            'warning',
            `La fila también coincide con ${alternativeCandidates.map((candidate) => `“${candidate.block_name}”`).join(', ')}.`,
            [row.row]
          ),
        ];
      }
      return decision;
    });
  }

  function composePreview(semanticPreview, compositionRules) {
    const rules = (compositionRules || []).map(normalizeCompositionRule);
    const itemRules = rules.filter((rule) => rule.scope === 'item' && !validateCompositionRule(rule).length);
    const blockRules = rules.filter((rule) => rule.scope === 'block' && !validateCompositionRule(rule).length);
    const blocks = ((semanticPreview && semanticPreview.blocks) || []).filter((block) => (
      block.matched && block.enabled
    )).map((block) => ({
      ...block,
      item_groups: composeSequence(
        block.items || [],
        itemRules,
        (item) => item.principal,
        { scope: 'item', owner_id: block.definition_id, owner_name: block.name }
      ),
    }));
    const blockGroups = composeSequence(
      blocks,
      blockRules,
      (block) => block.name,
      { scope: 'block', owner_id: null, owner_name: null }
    );
    const diagnostics = [
      ...blocks.flatMap((block) => block.item_groups.flatMap((group) => group.diagnostics || [])),
      ...blockGroups.flatMap((group) => group.diagnostics || []),
    ];
    return {
      schema: 'parser_lab_composed_preview',
      version: 1,
      block_groups: blockGroups,
      diagnostics,
    };
  }

  function composeSequence(nodes, rules, fieldValue, context = {}) {
    const groups = [];
    let index = 0;
    while (index < nodes.length) {
      const node = nodes[index];
      const value = fieldValue(node);
      const matchingRules = rules.filter((candidate) => matchesValue(
        value,
        candidate.match.operator,
        candidate.match.value
      ));
      const rule = matchingRules[0];
      if (!rule) {
        groups.push({
          target: null,
          rule_id: null,
          members: [node],
          diagnostics: [],
          decision_trace: {
            scope: context.scope || null,
            owner_id: context.owner_id || null,
            owner_name: context.owner_name || null,
            field_value: value,
            matching_rule_ids: [],
            selected_rule_id: null,
            reason: 'Ninguna regla de composición coincide; el elemento se conserva individual.',
          },
        });
        index += 1;
        continue;
      }
      const end = Math.min(nodes.length, index + rule.action.count + 1);
      const actualCount = end - index;
      const requestedCount = rule.action.count + 1;
      const diagnostics = [];
      if (matchingRules.length > 1) {
        diagnostics.push(diagnostic(
          'composition_conflict',
          'warning',
          `Coinciden ${matchingRules.length} reglas; se aplica “${rule.id}” por prioridad de orden.`,
          []
        ));
      }
      if (actualCount < requestedCount) {
        diagnostics.push(diagnostic(
          'composition_truncated',
          'warning',
          `La regla “${rule.id}” pidió ${requestedCount} elementos, pero solo había ${actualCount}.`,
          []
        ));
      }
      groups.push({
        target: rule.action.target,
        rule_id: rule.id,
        members: nodes.slice(index, end),
        diagnostics,
        decision_trace: {
          scope: context.scope || null,
          owner_id: context.owner_id || null,
          owner_name: context.owner_name || null,
          field_value: value,
          matching_rule_ids: matchingRules.map((candidate) => candidate.id),
          selected_rule_id: rule.id,
          requested_member_count: requestedCount,
          actual_member_count: actualCount,
          reason: `Se aplica “${rule.id}” y se agrupan ${actualCount} elementos como ${rule.action.target}.`,
        },
      });
      index = end;
    }
    return groups;
  }

  function isEmptyRow(row) {
    if (row && row.empty) return true;
    return !COLUMNS.some((column) => String(row && row.values && row.values[column] || '').trim());
  }

  function flattenRowValues(row, splitCellLines, startColumn = 'A') {
    const entries = [];
    const startIndex = Math.max(0, COLUMNS.indexOf(startColumn));
    COLUMNS.slice(startIndex).forEach((column) => {
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
