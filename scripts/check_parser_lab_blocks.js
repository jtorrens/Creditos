#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');

require(path.resolve(__dirname, '../apps/renderer/parser_lab/block_model.js'));

const model = globalThis.CreditosParserLabBlockModel;
const row = (number, values, options = {}) => ({
  row: number,
  values: { A: '', B: '', C: '', D: '', ...values },
  bold: options.bold || {},
  merged_b_to_d: Boolean(options.merged),
});
const rows = [
  row(1, { C: 'Dirección' }, { bold: { C: true } }),
  row(2, { B: 'Dirección de Fotografía\nAlfonso Segura', D: 'Paula Fabra' }),
  row(3, { C: 'Nombre dos' }),
  { ...row(4, {}), empty: true },
  row(5, { C: 'Han intervenido' }),
  row(6, { B: 'Actor', D: 'Personaje' }),
  { ...row(7, {}), empty: true },
  { ...row(8, {}), empty: true },
  row(9, { B: 'Equipo técnico' }, { bold: { B: true }, merged: true }),
  row(10, { B: 'Montaje' }),
];

const direction = model.definitionFromRow(rows[0], 0);
const cast = model.definitionFromRow(rows[4], 1);
const crew = model.definitionFromRow(rows[8], 2);
assert.deepStrictEqual(model.validateDefinition(direction), []);
assert.strictEqual(direction.header.column, 'C');
assert.strictEqual(direction.header.bold, 'required');
assert.strictEqual(crew.header.column, 'B');
assert.strictEqual(crew.header.merged_b_to_d, 'required');
assert.strictEqual(model.rowMatchesDefinition(rows[0], direction), true);
assert.strictEqual(model.rowMatchesDefinition(rows[1], direction), false);

const copySource = model.normalizeDefinition(cast);
copySource.header.bold = 'forbidden';
copySource.header.merged_b_to_d = 'required';
copySource.interpretation.orientation = 'horizontal';
copySource.interpretation.term_roles = { first: 'secondary', following: 'principal' };
copySource.interpretation.empty_rows.between_items = { effect: 'page', display: 'compact' };
const copyTarget = model.normalizeDefinition({ ...crew, enabled: false });
const copiedSettings = model.copyDefinitionSettings(copyTarget, copySource);
assert.strictEqual(copiedSettings.id, copyTarget.id);
assert.strictEqual(copiedSettings.name, copyTarget.name);
assert.strictEqual(copiedSettings.enabled, false);
assert.strictEqual(copiedSettings.header.column, copyTarget.header.column);
assert.strictEqual(copiedSettings.header.operator, copyTarget.header.operator);
assert.strictEqual(copiedSettings.header.value, copyTarget.header.value);
assert.strictEqual(copiedSettings.header.bold, 'forbidden');
assert.strictEqual(copiedSettings.header.merged_b_to_d, 'required');
assert.deepStrictEqual(copiedSettings.interpretation, copySource.interpretation);
copiedSettings.interpretation.term_roles.first = 'principal';
assert.strictEqual(copySource.interpretation.term_roles.first, 'secondary');

const instances = model.findBlockInstances(rows, [direction, cast, crew]);
assert.deepStrictEqual(
  instances.map((instance) => ({ name: instance.name, start: instance.start_row, end: instance.end_row, count: instance.row_count })),
  [
    { name: 'Dirección', start: 1, end: 4, count: 4 },
    { name: 'Han intervenido', start: 5, end: 8, count: 4 },
    { name: 'Equipo técnico', start: 9, end: 10, count: 2 },
  ]
);

const ignoredCast = { ...cast, enabled: false };
const withIgnoredBoundary = model.findBlockInstances(rows, [direction, ignoredCast, crew]);
assert.strictEqual(withIgnoredBoundary[0].end_row, 4);
assert.strictEqual(withIgnoredBoundary[1].start_row, 5);
assert.strictEqual(withIgnoredBoundary[2].start_row, 9);
const ignoredSemantic = model.interpretModel(rows, withIgnoredBoundary, [direction, ignoredCast, crew]);
assert.strictEqual(ignoredSemantic.blocks[1].matched, true);
assert.strictEqual(ignoredSemantic.blocks[1].enabled, false);
assert.deepStrictEqual(ignoredSemantic.blocks[1].items, []);
const ignoredComposed = model.composePreview(ignoredSemantic, []);
assert.deepStrictEqual(
  ignoredComposed.block_groups.flatMap((group) => group.members).map((block) => block.name),
  [direction.name, crew.name]
);

const missing = { ...cast, header: { ...cast.header, value: 'No existe' } };
const withMissing = model.findBlockInstances(rows, [direction, missing, crew]);
assert.strictEqual(withMissing[1].matched, false);
assert.strictEqual(withMissing[2].start_row, 9);
const normalizedRowsView = {
  column_widths: { block: 140, A: 100, B: 240, C: 220, D: 260 },
};
assert.strictEqual(model.modelDocument([direction], [], normalizedRowsView).schema, 'parser_lab_block_model');
assert.strictEqual(model.modelDocument([direction], [], normalizedRowsView).version, 4);
assert.deepStrictEqual(
  model.modelDocument([direction], [], normalizedRowsView).normalized_rows_view,
  normalizedRowsView
);

const obsoleteDirection = model.normalizeDefinition(direction);
obsoleteDirection.interpretation.orientation = 'horizontal_grouped';
assert(model.validateDefinition(obsoleteDirection).length > 0);
const neutralDirection = model.normalizeDefinition(direction);
neutralDirection.interpretation.term_roles.first = 'neutral';
assert(model.validateDefinition(neutralDirection).length > 0);
const separatorDirection = model.normalizeDefinition(direction);
separatorDirection.interpretation.separator = { condition: 'empty_row', meaning: 'item' };
assert(model.validateDefinition(separatorDirection).length > 0);

const directionPage = model.normalizeDefinition(direction);
directionPage.interpretation.empty_rows.between_items.effect = 'page';
const semantic = model.interpretModel(rows, instances, [directionPage, cast, crew]);
assert.deepStrictEqual(
  semantic.blocks[0].items,
  [
    {
      principal: 'Dirección de Fotografía',
      role: 'principal',
      associated: ['Alfonso Segura', 'Paula Fabra', 'Nombre dos'],
      terms: [
        { row: 2, column: 'B', line: 1, value: 'Dirección de Fotografía', role: 'principal' },
        { row: 2, column: 'B', line: 2, value: 'Alfonso Segura', role: 'secondary' },
        { row: 2, column: 'D', line: 1, value: 'Paula Fabra', role: 'secondary' },
        { row: 3, column: 'C', line: 1, value: 'Nombre dos', role: 'secondary' },
      ],
      orientation: 'vertical',
      separator_after: null,
      source_rows: [2, 3],
      source_values: [
        { row: 2, column: 'B', line: 1, value: 'Dirección de Fotografía' },
        { row: 2, column: 'B', line: 2, value: 'Alfonso Segura' },
        { row: 2, column: 'D', line: 1, value: 'Paula Fabra' },
        { row: 3, column: 'C', line: 1, value: 'Nombre dos' },
      ],
    },
  ]
);
assert.deepStrictEqual(semantic.blocks[1].items[0].associated, ['Personaje']);
assert.strictEqual(semantic.blocks[1].items[0].separator_after, null);
assert.deepStrictEqual(semantic.blocks[1].trailing_empty_rows, {
  effect: 'continue', display: 'ignore', source_count: 2, output_count: 0,
});
assert.deepStrictEqual(semantic.blocks[2].items[0].associated, []);
assert.strictEqual(semantic.blocks[2].items[0].separator_after, null);

const boundaryRows = [
  row(1, { C: 'Bloque con fronteras' }),
  { ...row(2, {}), empty: true },
  row(3, { B: 'Cargo A' }),
  { ...row(4, {}), empty: true },
  { ...row(5, {}), empty: true },
  row(6, { B: 'Cargo B' }),
  { ...row(7, {}), empty: true },
  row(8, { C: 'Bloque siguiente' }),
];
const boundaryDefinition = model.definitionFromRow(boundaryRows[0], 0);
boundaryDefinition.interpretation.empty_rows = {
  leading: { effect: 'continue', display: 'ignore' },
  between_items: { effect: 'page', display: 'preserve' },
  trailing: { effect: 'continue', display: 'compact' },
};
const followingDefinition = model.definitionFromRow(boundaryRows[7], 1);
const boundaryInstances = model.findBlockInstances(boundaryRows, [boundaryDefinition, followingDefinition]);
const boundaryBlock = model.interpretModel(
  boundaryRows,
  boundaryInstances,
  [boundaryDefinition, followingDefinition]
).blocks[0];
assert.deepStrictEqual(boundaryBlock.leading_empty_rows, {
  effect: 'continue', display: 'ignore', source_count: 1, output_count: 0,
});
assert.strictEqual(boundaryBlock.items.length, 2);
assert.strictEqual(boundaryBlock.items[0].separator_after, 'page');
assert.deepStrictEqual(boundaryBlock.items[0].empty_rows_after, {
  effect: 'page', display: 'preserve', source_count: 2, output_count: 2,
});
assert.deepStrictEqual(boundaryBlock.trailing_empty_rows, {
  effect: 'continue', display: 'compact', source_count: 1, output_count: 1,
});

const horizontalRows = [
  row(1, { C: 'Han intervenido' }),
  { ...row(2, {}), empty: true },
  row(3, { B: 'INÉS', D: 'Toni Acosta' }),
  row(4, { B: 'MIGUEL', D: 'Rodolfo Sancho' }),
  { ...row(5, {}), empty: true },
  row(6, { C: 'Bloque siguiente' }),
];
const horizontalDefinition = model.definitionFromRow(horizontalRows[0], 0);
horizontalDefinition.interpretation.orientation = 'horizontal';
horizontalDefinition.interpretation.item_grouping = 'row';
horizontalDefinition.interpretation.term_roles = { first: 'secondary', following: 'principal' };
const horizontalFollowing = model.definitionFromRow(horizontalRows[5], 1);
const horizontalInstances = model.findBlockInstances(horizontalRows, [horizontalDefinition, horizontalFollowing]);
const horizontalBlock = model.interpretModel(
  horizontalRows,
  horizontalInstances,
  [horizontalDefinition, horizontalFollowing]
).blocks[0];
assert.strictEqual(horizontalBlock.items.length, 2);
assert.deepStrictEqual(horizontalBlock.items.map((item) => item.principal), ['Toni Acosta', 'Rodolfo Sancho']);
assert.deepStrictEqual(horizontalBlock.items[0].terms.map((term) => [term.value, term.role]), [
  ['INÉS', 'secondary'],
  ['Toni Acosta', 'principal'],
]);
assert.strictEqual(horizontalBlock.items[0].role, 'secondary');
assert.strictEqual(horizontalBlock.items[0].separator_after, null);
assert.deepStrictEqual(horizontalBlock.trailing_empty_rows, {
  effect: 'continue', display: 'ignore', source_count: 1, output_count: 0,
});

const groupedHorizontalRows = [
  row(1, { C: 'Equipo técnico' }),
  row(2, { B: 'Atrecistas de Avance', D: 'Óscar Mesa' }),
  row(3, { D: 'Iván Moran' }),
  row(4, { D: 'Josué Labrador' }),
  row(5, { D: 'Leo Brasile' }),
  row(6, { B: 'Atrecista de Avance y Refuerzo de Construcción', D: 'José Hernández' }),
  row(7, { C: 'Bloque siguiente' }),
];
const groupedHorizontalDefinition = model.definitionFromRow(groupedHorizontalRows[0], 0);
groupedHorizontalDefinition.interpretation.orientation = 'horizontal';
groupedHorizontalDefinition.interpretation.item_grouping = 'first_term';
groupedHorizontalDefinition.interpretation.item_start_column = 'B';
groupedHorizontalDefinition.interpretation.term_roles = { first: 'secondary', following: 'principal' };
const groupedHorizontalFollowing = model.definitionFromRow(groupedHorizontalRows[6], 1);
const groupedHorizontalInstances = model.findBlockInstances(
  groupedHorizontalRows,
  [groupedHorizontalDefinition, groupedHorizontalFollowing]
);
const groupedHorizontalBlock = model.interpretModel(
  groupedHorizontalRows,
  groupedHorizontalInstances,
  [groupedHorizontalDefinition, groupedHorizontalFollowing]
).blocks[0];
assert.strictEqual(groupedHorizontalBlock.items.length, 2);
assert.deepStrictEqual(groupedHorizontalBlock.items[0].source_rows, [2, 3, 4, 5]);
assert.deepStrictEqual(groupedHorizontalBlock.items[0].terms.map((term) => [term.value, term.role]), [
  ['Atrecistas de Avance', 'secondary'],
  ['Óscar Mesa', 'principal'],
  ['Iván Moran', 'principal'],
  ['Josué Labrador', 'principal'],
  ['Leo Brasile', 'principal'],
]);
assert.strictEqual(groupedHorizontalBlock.items[0].principal, 'Óscar Mesa');
assert.deepStrictEqual(groupedHorizontalBlock.items[1].source_rows, [6]);

const singleValueRows = [
  row(1, { C: 'Localizaciones' }),
  row(2, { B: 'AENA' }),
  row(3, { B: 'MUNDICOLOR' }),
  row(4, { C: 'Bloque siguiente' }),
];
const singleValueDefinition = model.definitionFromRow(singleValueRows[0], 0);
singleValueDefinition.interpretation.orientation = 'vertical';
singleValueDefinition.interpretation.item_grouping = 'row';
singleValueDefinition.interpretation.term_roles = { first: 'secondary', following: 'secondary' };
const singleValueFollowing = model.definitionFromRow(singleValueRows[3], 1);
const singleValueInstances = model.findBlockInstances(
  singleValueRows,
  [singleValueDefinition, singleValueFollowing]
);
const singleValueBlock = model.interpretModel(
  singleValueRows,
  singleValueInstances,
  [singleValueDefinition, singleValueFollowing]
).blocks[0];
assert.strictEqual(singleValueBlock.items.length, 2);
assert.deepStrictEqual(singleValueBlock.items.map((item) => item.role), ['secondary', 'secondary']);
assert.deepStrictEqual(singleValueBlock.items.map((item) => item.principal), ['AENA', 'MUNDICOLOR']);

const compositionRules = [
  {
    id: 'rule_items',
    scope: 'item',
    match: { field: 'principal', operator: 'equals', value: 'Cargo A' },
    action: { type: 'group_next', count: 1, target: 'page' },
  },
  {
    id: 'rule_blocks',
    scope: 'block',
    match: { field: 'name', operator: 'equals', value: 'Bloque A' },
    action: { type: 'group_next', count: 1, target: 'cartela' },
  },
];
compositionRules.forEach((rule) => assert.deepStrictEqual(model.validateCompositionRule(rule), []));
const composed = model.composePreview({
  blocks: [
    { name: 'Bloque A', matched: true, enabled: true, items: [{ principal: 'Cargo A' }, { principal: 'Cargo B' }, { principal: 'Cargo C' }] },
    { name: 'Bloque B', matched: true, enabled: true, items: [{ principal: 'Cargo D' }] },
    { name: 'Bloque C', matched: true, enabled: true, items: [] },
  ],
}, compositionRules);
assert.strictEqual(composed.block_groups[0].target, 'cartela');
assert.deepStrictEqual(composed.block_groups[0].members.map((block) => block.name), ['Bloque A', 'Bloque B']);
assert.strictEqual(composed.block_groups[0].members[0].item_groups[0].target, 'page');
assert.deepStrictEqual(
  composed.block_groups[0].members[0].item_groups[0].members.map((item) => item.principal),
  ['Cargo A', 'Cargo B']
);
assert.strictEqual(composed.block_groups[1].members[0].name, 'Bloque C');
assert.strictEqual(model.modelDocument([direction], compositionRules, normalizedRowsView).composition_rules.length, 2);

const uiSource = fs.readFileSync(path.resolve(__dirname, '../apps/renderer/parser_lab/ui.js'), 'utf8');
const cssSource = fs.readFileSync(path.resolve(__dirname, '../apps/renderer/parser_lab/parser_lab.css'), 'utf8');
assert(uiSource.includes('data-right-tab="inspector"'));
assert(uiSource.includes('data-right-tab="jsons"'));
assert(uiSource.includes('data-json-tab="composed"'));
assert(uiSource.includes('parserLabBlockOrientationSelect'));
assert(uiSource.includes('parserLabNormalizedTable'));
assert(uiSource.includes('data-normalized-column-resizer'));
assert(uiSource.includes('function beginNormalizedColumnResize(column, event)'));
assert(uiSource.includes('function currentNormalizedColumnWidths()'));
assert(uiSource.includes('normalized_rows_view'));
assert(uiSource.includes('parserLabBlockGroupingSelect'));
assert(uiSource.includes('first_term'));
assert(uiSource.includes('parserLabBlockStartColumnSelect'));
assert(uiSource.includes("startButton.textContent = '↑ Inicio'"));
assert(uiSource.includes("endButton.textContent = '↓ Final'"));
assert(uiSource.includes('selectRow(block.start_row, true)'));
assert(uiSource.includes('selectRow(block.end_row, true)'));
assert(uiSource.includes("tabs.setAttribute('aria-orientation', 'vertical')"));
assert(uiSource.includes('function previewScrollPosition()'));
assert(uiSource.includes('function restorePreviewScrollPosition(position)'));
assert(uiSource.includes('renderParserPreview({ preserveScroll: true })'));
assert(uiSource.includes('parserLabMoveBlockUpBtn'));
assert(uiSource.includes('parser-lab-composition-tab'));
assert(uiSource.includes("definition.enabled = include.checked"));
assert(uiSource.includes("elements.defineBlockButton.textContent = header ? 'Eliminar cabecera' : 'Definir como cabecera'"));
assert(uiSource.includes('state.activePreviewBlockId = instance.definition_id'));
assert(uiSource.includes("status.textContent = block.enabled ? `${block.items.length} ítems` : 'Ignorado'"));
assert(uiSource.includes("item.addEventListener('dragstart'"));
assert(uiSource.includes('copyBlockSettings(draggedBlockId, definition.id)'));
assert(uiSource.includes('blockModel.copyDefinitionSettings(target, source)'));
assert(uiSource.includes('¿Copiar los ajustes de'));
assert(!uiSource.includes("icon.textContent = '▦'"));
assert(!uiSource.includes('compositionIcon'));
assert(!uiSource.includes('parserLabClearModelBtn'));
assert(!uiSource.includes('parserLabCancelBlockBtn'));
assert(!uiSource.includes('parserLabDeleteBlockBtn'));
assert((uiSource.match(/data-split=/g) || []).length >= 3);
assert(cssSource.includes('#parserLabJsonsPane[hidden]'));
assert(cssSource.includes('.parser-lab-block-editor-workspace'));
assert(cssSource.includes('.parser-lab-block-tab.drop-target'));
assert(cssSource.includes('min-height: 58px'));
assert(cssSource.includes('.parser-lab-preview-block-navigation'));
assert(cssSource.includes('grid-template-columns: minmax(155px, 22%) minmax(0, 1fr)'));
assert(cssSource.includes('.parser-lab-preview-tab.ignored .parser-lab-block-tab-copy'));
assert(cssSource.includes('.parser-lab-table-panel .parser-lab-table th'));
assert(cssSource.includes('.parser-lab-column-resizer'));
assert(cssSource.includes('.parser-lab-table.resizing-columns'));

console.log('ok parser lab manual block model');
