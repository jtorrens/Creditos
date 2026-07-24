#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');

require(path.resolve(__dirname, '../apps/renderer/parser_lab/block_model.js'));
require(path.resolve(__dirname, '../apps/renderer/parser_lab/ui_support.js'));

const model = globalThis.CreditosParserLabBlockModel;
const uiSupport = globalThis.CreditosParserLabUiSupport;
const row = (number, values, options = {}) => ({
  row: number,
  values: { A: '', B: '', C: '', D: '', ...values },
  bold: options.bold || {},
  borders: options.borders || {},
  merged_b_to_d: Boolean(options.merged),
});
const borderRow = (top, bottom) => ({
  B: { top, right: false, bottom, left: true },
  C: { top, right: false, bottom, left: false },
  D: { top, right: true, bottom, left: false },
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
assert.strictEqual(direction.header.source, 'match');
assert.strictEqual(direction.header.column, 'C');
assert.strictEqual(direction.header.bold, 'required');
assert.strictEqual(direction.interpretation.content_start, 'after_header');
assert.strictEqual(crew.header.column, 'B');
assert.strictEqual(crew.header.merged_b_to_d, 'required');
assert.strictEqual(model.rowMatchesDefinition(rows[0], direction), true);
assert.strictEqual(model.rowMatchesDefinition(rows[1], direction), false);

const regexDirection = model.normalizeDefinition(direction);
regexDirection.header.operator = 'regex';
regexDirection.header.value = '^Dirección$';
const NativeRegExp = globalThis.RegExp;
let regexCompilationCount = 0;
function CountingRegExp(pattern, flags) {
  regexCompilationCount += 1;
  return new NativeRegExp(pattern, flags);
}
Object.setPrototypeOf(CountingRegExp, NativeRegExp);
CountingRegExp.prototype = NativeRegExp.prototype;
globalThis.RegExp = CountingRegExp;
try {
  model.findBlockInstances([
    ...Array.from({ length: 1500 }, (_, index) => row(index + 1, { C: `Fila ${index + 1}` })),
    row(1501, { C: 'Dirección' }, { bold: { C: true } }),
  ], [regexDirection]);
} finally {
  globalThis.RegExp = NativeRegExp;
}
assert.strictEqual(regexCompilationCount, 2, 'la expresión regular se valida y compila una vez por regla');

const stressRows = Array.from({ length: 5000 }, (_, index) => row(
  index + 1,
  { C: index % 50 === 0 ? `Cabecera ${Math.floor(index / 50) + 1}` : `Contenido ${index + 1}` }
));
const stressDefinitions = Array.from({ length: 100 }, (_, index) => (
  model.definitionFromRow(stressRows[index * 50], index)
));
const stressInstances = model.findBlockInstances(stressRows, stressDefinitions);
assert.strictEqual(stressInstances.length, 100);
assert(stressInstances.every((instance) => instance.matched));
assert.strictEqual(stressInstances[99].start_row, 4951);

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
assert.strictEqual(withMissing[0].range_status, 'warning');
assert(withMissing[0].range_diagnostics.some((entry) => entry.code === 'unresolved_boundary'));

const outOfOrder = model.findBlockInstances(rows, [cast, direction, crew]);
assert.strictEqual(outOfOrder[0].start_row, 5);
assert.strictEqual(outOfOrder[1].match_status, 'out_of_order');
assert.deepStrictEqual(outOfOrder[1].candidate_rows, [1]);
assert.strictEqual(outOfOrder[0].range_status, 'warning');

const ambiguousRows = [
  row(1, { C: 'Cabecera repetida' }),
  row(2, { B: 'Contenido' }),
  row(3, { C: 'Cabecera repetida' }),
  row(4, { C: 'Bloque siguiente' }),
];
const ambiguousDefinition = model.definitionFromRow(ambiguousRows[0], 0);
const ambiguousFollowing = model.definitionFromRow(ambiguousRows[3], 1);
const ambiguousInstances = model.findBlockInstances(
  ambiguousRows,
  [ambiguousDefinition, ambiguousFollowing]
);
assert.strictEqual(ambiguousInstances[0].match_status, 'ambiguous');
assert.deepStrictEqual(ambiguousInstances[0].candidate_rows, [1, 3]);
assert.strictEqual(ambiguousInstances[0].start_row, 1);
assert.strictEqual(ambiguousInstances[0].range_status, 'warning');
const sheetStart = model.normalizeDefinition(direction);
sheetStart.id = 'block_sheet_start';
sheetStart.name = 'Inicio de hoja';
sheetStart.header.source = 'sheet_start';
const afterPrevious = model.normalizeDefinition(cast);
afterPrevious.id = 'block_after_previous';
afterPrevious.name = 'Después de la frontera';
afterPrevious.header.source = 'after_previous';
const sheetEnd = model.normalizeDefinition(crew);
sheetEnd.id = 'block_sheet_end';
sheetEnd.name = 'Final de hoja';
sheetEnd.header.source = 'sheet_end';
const structuralInstances = model.findBlockInstances(rows, [sheetStart, afterPrevious, sheetEnd]);
assert.deepStrictEqual(
  structuralInstances.map((instance) => ({
    name: instance.name,
    start: instance.start_row,
    end: instance.end_row,
    status: instance.match_status,
  })),
  [
    { name: 'Inicio de hoja', start: 1, end: 1, status: 'matched' },
    { name: 'Después de la frontera', start: 2, end: 9, status: 'matched' },
    { name: 'Final de hoja', start: 10, end: 10, status: 'matched' },
  ]
);
assert.strictEqual(
  structuralInstances[0].match_trace.reason,
  'Inicio de hoja en la fila 1.'
);
assert.strictEqual(
  structuralInstances[1].match_trace.reason,
  'Fila siguiente a la frontera anterior, fila 2.'
);
assert.strictEqual(
  structuralInstances[2].match_trace.reason,
  'Última fila de la hoja, fila 10.'
);
const misplacedSheetStart = model.findBlockInstances(rows, [cast, sheetStart]);
assert.strictEqual(misplacedSheetStart[1].match_status, 'out_of_order');
const invalidHeaderSource = model.normalizeDefinition(direction);
delete invalidHeaderSource.header.source;
assert(model.validateDefinition(invalidHeaderSource).length > 0);
const normalizedRowsView = {
  column_widths: { block: 140, A: 100, B: 240, C: 220, D: 260 },
};
assert.strictEqual(model.modelDocument([direction], [], normalizedRowsView).schema, 'parser_lab_block_model');
assert.strictEqual(model.modelDocument([direction], [], normalizedRowsView).version, 9);
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
const missingContentStart = model.normalizeDefinition(direction);
delete missingContentStart.interpretation.content_start;
assert(model.validateDefinition(missingContentStart).length > 0);

const headerContentRows = [
  row(1, { B: 'Una producción de Buendía Estudios Canarias' }, { merged: true }),
  row(2, { B: 'con la participación de Atresmedia' }, { merged: true }),
  { ...row(3, {}), empty: true },
  row(4, { C: 'Bloque siguiente' }),
];
const headerContentDefinition = model.definitionFromRow(headerContentRows[0], 0);
headerContentDefinition.interpretation.content_start = 'header';
headerContentDefinition.interpretation.item_grouping = 'row';
headerContentDefinition.interpretation.term_roles = { first: 'secondary', following: 'secondary' };
const headerContentFollowing = model.definitionFromRow(headerContentRows[3], 1);
const headerContentInstances = model.findBlockInstances(
  headerContentRows,
  [headerContentDefinition, headerContentFollowing]
);
const headerContentBlock = model.interpretModel(
  headerContentRows,
  headerContentInstances,
  [headerContentDefinition, headerContentFollowing]
).blocks[0];
assert.strictEqual(headerContentBlock.content_start, 'header');
assert.deepStrictEqual(headerContentBlock.items.map((item) => item.principal), [
  'Una producción de Buendía Estudios Canarias',
  'con la participación de Atresmedia',
]);
assert.deepStrictEqual(headerContentBlock.items.map((item) => item.role), ['secondary', 'secondary']);
assert.deepStrictEqual(headerContentBlock.items[0].source_rows, [1]);

const borderedRows = [
  row(1, { C: 'Cabecera con borde' }, { borders: borderRow(true, true) }),
  row(2, { B: 'Cargo uno', D: 'Nombre uno' }, { borders: borderRow(true, false) }),
  { ...row(3, {}, { borders: borderRow(false, false) }), empty: true },
  row(4, { B: 'Cargo dos', D: 'Nombre dos' }, { borders: borderRow(false, true) }),
  row(5, { C: 'Siguiente bloque' }),
];
const borderedDefinition = model.definitionFromRow(borderedRows[0], 0);
borderedDefinition.interpretation.item_grouping = 'row';
borderedDefinition.interpretation.term_roles = { first: 'secondary', following: 'principal' };
borderedDefinition.interpretation.empty_rows.between_items.effect = 'page';
borderedDefinition.interpretation.border_enclosure = {
  mode: 'enclosed',
  start_column: 'B',
  end_column: 'D',
  effect: 'page',
};
const borderedFollowing = model.definitionFromRow(borderedRows[4], 1);
const borderedInstances = model.findBlockInstances(
  borderedRows,
  [borderedDefinition, borderedFollowing]
);
const borderedBlock = model.interpretModel(
  borderedRows,
  borderedInstances,
  [borderedDefinition, borderedFollowing]
).blocks[0];
assert.strictEqual(borderedBlock.items.length, 2);
assert.strictEqual(borderedBlock.items[0].separator_after, 'item');
assert.strictEqual(borderedBlock.items[0].empty_rows_after.effective_effect, 'item');
assert.strictEqual(borderedBlock.items[0].border_enclosure_member.effect, 'item');
assert.strictEqual(borderedBlock.items[1].separator_after, 'page');
assert.deepStrictEqual(borderedBlock.items[1].border_enclosure_after, {
  start_row: 2,
  end_row: 4,
  start_column: 'B',
  end_column: 'D',
  effect: 'page',
});

const directionPage = model.normalizeDefinition(direction);
directionPage.interpretation.empty_rows.between_items.effect = 'page';
const semantic = model.interpretModel(rows, instances, [directionPage, cast, crew]);
assert.deepStrictEqual(
  semantic.blocks[0].items.map(({ decision_trace, ...item }) => item),
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
  effect: 'continue', display: 'ignore', source_count: 2, output_count: 0, source_rows: [7, 8],
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
  effect: 'continue', display: 'ignore', source_count: 1, output_count: 0, source_rows: [2],
});
assert.strictEqual(boundaryBlock.items.length, 2);
assert.strictEqual(boundaryBlock.items[0].separator_after, 'page');
assert.deepStrictEqual(boundaryBlock.items[0].empty_rows_after, {
  effect: 'page', display: 'preserve', source_count: 2, output_count: 2, source_rows: [4, 5],
});
assert.deepStrictEqual(boundaryBlock.trailing_empty_rows, {
  effect: 'continue', display: 'compact', source_count: 1, output_count: 1, source_rows: [7],
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
  effect: 'continue', display: 'ignore', source_count: 1, output_count: 0, source_rows: [5],
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
assert.strictEqual(groupedHorizontalBlock.items[0].separator_after, null);

const mergedStartRows = [
  row(1, { C: 'Jefes de Equipo' }),
  row(2, { B: 'Productoras Ejecutivas Creativas' }, { merged: true }),
  row(3, { B: 'Sara Cano', D: 'Paula Fabra' }),
  { ...row(4, {}), empty: true },
  row(5, { B: 'Directora General', D: '' }, { merged: true }),
  row(6, { C: 'Concha Jaime' }),
  row(7, { B: 'Jefe de Producción' }, { merged: true }),
  row(8, { C: 'Pedro Ripper' }),
  row(9, { C: 'Bloque siguiente' }),
];
const mergedStartDefinition = model.definitionFromRow(mergedStartRows[0], 0);
mergedStartDefinition.interpretation.item_grouping = 'first_term';
mergedStartDefinition.interpretation.item_start_column = 'B';
mergedStartDefinition.interpretation.item_start_merged_b_to_d = 'required';
mergedStartDefinition.interpretation.empty_rows.between_items.effect = 'page';
mergedStartDefinition.interpretation.term_roles = { first: 'secondary', following: 'principal' };
const mergedStartFollowing = model.definitionFromRow(mergedStartRows[8], 1);
const mergedStartInstances = model.findBlockInstances(
  mergedStartRows,
  [mergedStartDefinition, mergedStartFollowing]
);
const mergedStartBlock = model.interpretModel(
  mergedStartRows,
  mergedStartInstances,
  [mergedStartDefinition, mergedStartFollowing]
).blocks[0];
assert.strictEqual(mergedStartBlock.items.length, 3);
assert.deepStrictEqual(mergedStartBlock.items[0].terms.map((term) => [term.value, term.role]), [
  ['Productoras Ejecutivas Creativas', 'secondary'],
  ['Sara Cano', 'principal'],
  ['Paula Fabra', 'principal'],
]);
assert.strictEqual(mergedStartBlock.items[0].separator_after, 'page');
assert.deepStrictEqual(mergedStartBlock.items[1].source_rows, [5, 6]);
assert.deepStrictEqual(mergedStartBlock.items[2].source_rows, [7, 8]);
assert.strictEqual(mergedStartBlock.items[1].separator_after, null);

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
assert.deepStrictEqual(singleValueBlock.items.map((item) => item.associated), [[], []]);

const anchoredRows = [
  row(1, { C: 'Equipo con metadatos' }),
  row(2, { A: '01', B: 'Atrecistas', D: 'Óscar Mesa' }),
  row(3, { A: 'nota', D: 'Iván Moran' }),
  row(4, { C: 'Bloque siguiente' }),
];
const anchoredDefinition = model.definitionFromRow(anchoredRows[0], 0);
anchoredDefinition.interpretation.item_grouping = 'first_term';
anchoredDefinition.interpretation.item_start_column = 'B';
anchoredDefinition.interpretation.term_roles = { first: 'secondary', following: 'principal' };
const anchoredFollowing = model.definitionFromRow(anchoredRows[3], 1);
const anchoredInstances = model.findBlockInstances(anchoredRows, [anchoredDefinition, anchoredFollowing]);
const anchoredBlock = model.interpretModel(
  anchoredRows,
  anchoredInstances,
  [anchoredDefinition, anchoredFollowing]
).blocks[0];
assert.deepStrictEqual(anchoredBlock.items[0].terms.map((term) => term.value), [
  'Atrecistas', 'Óscar Mesa', 'Iván Moran',
]);
assert.strictEqual(anchoredBlock.items[0].principal, 'Óscar Mesa');
assert(!anchoredBlock.items[0].source_values.some((entry) => entry.column === 'A'));

const headerFirstTermRows = [
  row(1, { A: 'Cabecera que también es ítem' }),
  row(2, { B: 'Cargo', D: 'Nombre' }),
  row(3, { C: 'Bloque siguiente' }),
];
const headerFirstTermDefinition = model.definitionFromRow(headerFirstTermRows[0], 0);
headerFirstTermDefinition.interpretation.content_start = 'header';
headerFirstTermDefinition.interpretation.item_grouping = 'first_term';
headerFirstTermDefinition.interpretation.item_start_column = 'B';
const headerFirstTermFollowing = model.definitionFromRow(headerFirstTermRows[2], 1);
const headerFirstTermInstances = model.findBlockInstances(
  headerFirstTermRows,
  [headerFirstTermDefinition, headerFirstTermFollowing]
);
const headerFirstTermBlock = model.interpretModel(
  headerFirstTermRows,
  headerFirstTermInstances,
  [headerFirstTermDefinition, headerFirstTermFollowing]
).blocks[0];
assert.deepStrictEqual(headerFirstTermBlock.items.map((item) => item.principal), [
  'Cabecera que también es ítem',
  'Cargo',
]);
assert.strictEqual(headerFirstTermBlock.row_trace[0].decision, 'header_and_item');

const continuedRows = [
  row(1, { C: 'Bloque con hueco interno' }),
  row(2, { B: 'Cargo', D: 'Nombre' }),
  { ...row(3, {}), empty: true },
  row(4, { D: 'Nombre dos' }),
  row(5, { C: 'Bloque siguiente' }),
];
const continuedDefinition = model.definitionFromRow(continuedRows[0], 0);
continuedDefinition.interpretation.empty_rows.between_items = { effect: 'continue', display: 'preserve' };
const continuedFollowing = model.definitionFromRow(continuedRows[4], 1);
const continuedInstances = model.findBlockInstances(continuedRows, [continuedDefinition, continuedFollowing]);
const continuedSemantic = model.interpretModel(
  continuedRows,
  continuedInstances,
  [continuedDefinition, continuedFollowing]
);
const continuedBlock = continuedSemantic.blocks[0];
assert.strictEqual(continuedBlock.items.length, 1);
assert.deepStrictEqual(continuedBlock.items[0].internal_empty_rows, [{
  effect: 'continue',
  display: 'preserve',
  source_count: 1,
  output_count: 1,
  source_rows: [3],
  after_term_index: 2,
}]);
assert.strictEqual(
  continuedSemantic.row_decisions.find((entry) => entry.row === 3).decision,
  'between_items_empty_continued'
);
assert.strictEqual(
  continuedSemantic.row_decisions.find((entry) => entry.row === 4).item_index,
  0
);

const rowGroupingDefinition = model.normalizeDefinition(continuedDefinition);
rowGroupingDefinition.interpretation.item_grouping = 'row';
const rowGroupingBlock = model.interpretModel(
  continuedRows,
  continuedInstances,
  [rowGroupingDefinition, continuedFollowing]
).blocks[0];
assert.strictEqual(rowGroupingBlock.items.length, 2);
assert.strictEqual(rowGroupingBlock.items[0].separator_after, 'item');
assert.strictEqual(rowGroupingBlock.items[0].empty_rows_after.context, 'between_row_items');
assert.strictEqual(rowGroupingBlock.items[0].empty_rows_after.effective_effect, 'item');

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

const conflictingRules = [
  compositionRules[0],
  {
    ...compositionRules[0],
    id: 'rule_items_conflict',
    action: { type: 'group_next', count: 8, target: 'cartela' },
  },
];
const conflictingComposed = model.composePreview({
  blocks: [{
    definition_id: 'block_a',
    name: 'Bloque A',
    matched: true,
    enabled: true,
    items: [{ principal: 'Cargo A' }, { principal: 'Cargo B' }],
  }],
}, conflictingRules);
assert(conflictingComposed.diagnostics.some((entry) => entry.code === 'composition_conflict'));
assert(!conflictingComposed.diagnostics.some((entry) => entry.code === 'composition_truncated'));
assert.deepStrictEqual(
  conflictingComposed.block_groups[0].members[0].item_groups[0].decision_trace.matching_rule_ids,
  ['rule_items', 'rule_items_conflict']
);

const truncatedComposed = model.composePreview({
  blocks: [{
    definition_id: 'block_a',
    name: 'Bloque A',
    matched: true,
    enabled: true,
    items: [{ principal: 'Cargo A' }],
  }],
}, [conflictingRules[1]]);
assert(truncatedComposed.diagnostics.some((entry) => entry.code === 'composition_truncated'));

const rowIndexes = uiSupport.buildRowIndexes(
  rows,
  instances,
  semantic.row_decisions,
  ['A', 'B', 'C', 'D']
);
assert.strictEqual(rowIndexes.rowByNumber.get(2), rows[1]);
assert.strictEqual(rowIndexes.blockInstanceByRow.get(3).definition_id, direction.id);
assert.strictEqual(rowIndexes.blockInstanceByRow.get(6).definition_id, cast.id);
assert.deepStrictEqual(
  rowIndexes.headerCandidatesByRow.get(1).map((instance) => instance.definition_id),
  [direction.id]
);
assert(rowIndexes.searchTextByRow.get(4).includes('fila vacía'));
assert(rowIndexes.searchTextByRow.get(1).includes('negrita c'));
assert.strictEqual(rowIndexes.rowDecisionByNumber.get(2).definition_id, direction.id);

const uiSource = fs.readFileSync(path.resolve(__dirname, '../apps/renderer/parser_lab/ui.js'), 'utf8');
const uiSupportSource = fs.readFileSync(path.resolve(__dirname, '../apps/renderer/parser_lab/ui_support.js'), 'utf8');
const cssSource = fs.readFileSync(path.resolve(__dirname, '../apps/renderer/parser_lab/parser_lab.css'), 'utf8');
const responsiveCssSource = fs.readFileSync(
  path.resolve(__dirname, '../apps/renderer/parser_lab/parser_lab_responsive.css'),
  'utf8'
);
assert(uiSource.includes('data-right-tab="inspector"'));
assert(uiSource.includes('data-right-tab="jsons"'));
assert(uiSource.includes('data-json-tab="composed"'));
assert(uiSource.includes('parserLabBlockOrientationSelect'));
assert(uiSource.includes('parserLabBlockContentStartSelect'));
assert(uiSource.includes('En la propia fila de cabecera'));
assert(uiSource.includes('parserLabModelSelect'));
assert(uiSource.includes('parserLabCreateModelBtn'));
assert(uiSource.includes('parserLabDuplicateModelBtn'));
assert(uiSource.includes('parserLabRenameModelBtn'));
assert(uiSource.includes('parserLabDeleteModelBtn'));
assert(uiSource.includes('parserLabModelDialogBackdrop'));
assert(uiSource.includes('function openModelDialog('));
assert(!uiSource.includes('root.prompt('));
assert(!uiSource.includes('root.confirm('));
assert(uiSource.includes('/api/parser-lab/model-library'));
assert(!uiSource.includes('/api/parser-lab/block-model'));
assert(!uiSource.includes('parser-lab-workflow'));
assert(!uiSource.includes('renderWorkflow'));
assert(uiSource.includes('parserLabNormalizedTable'));
assert(uiSource.includes('data-normalized-column-resizer'));
assert(uiSource.includes('function beginNormalizedColumnResize(column, event)'));
assert(uiSource.includes('function currentNormalizedColumnWidths()'));
assert(uiSource.includes('function updateNormalizedBlockHighlight()'));
assert(uiSource.includes('function updateNormalizedRowSelection('));
assert(uiSource.includes('function updateBlockNavigationSelection()'));
assert(uiSource.includes('function updatePreviewItemSelection()'));
assert(uiSource.includes("'parser-lab-active-block-range'"));
assert(uiSource.includes('normalized_rows_view'));
assert(uiSource.includes('parserLabBlockGroupingSelect'));
assert(uiSource.includes('first_term'));
assert(uiSource.includes('parserLabBlockStartColumnSelect'));
assert(uiSource.includes("startButton.textContent = '↑ Inicio'"));
assert(uiSource.includes("endButton.textContent = '↓ Final'"));
assert(uiSource.includes('selectRow(block.start_row, true)'));
assert(uiSource.includes('selectRow(block.end_row, true)'));
assert(uiSource.includes("tabs.setAttribute('aria-orientation', horizontalTabs ? 'horizontal' : 'vertical')"));
assert(uiSource.includes('function previewScrollPosition()'));
assert(uiSource.includes('function restorePreviewScrollPosition(position)'));
assert(uiSource.includes('renderParserPreview({ preserveScroll: true })'));
assert(uiSource.includes('function commitBlockFormToState()'));
assert(uiSource.includes('if (!commitBlockFormToState())'));
assert(uiSource.includes('function flushPendingBlockEdit()'));
assert(uiSource.includes("root.addEventListener('pagehide', flushBlockModelOnPageHide)"));
assert(uiSource.includes('const selectionHiddenByFilter'));
assert(uiSource.includes('function restoreNavigationFocus(request)'));
assert(uiSource.includes('function rowDecision(rowNumber)'));
assert(uiSource.includes('const insertionIndex = state.blockDefinitions.findIndex'));
assert(uiSource.includes("renderPreviewSeparator(boundary, 'Hueco interno', true)"));
assert(uiSource.includes('parserLabBlockHeaderSourceSelect'));
assert(uiSource.includes('updateBoundaryFields'));
assert(uiSource.includes('revealEditingBlockStart'));
assert(uiSource.includes('Primera fila de la hoja'));
assert(uiSource.includes('Fila siguiente a la frontera anterior'));
assert(uiSource.includes('Última fila de la hoja'));
assert(uiSource.includes('parserLabMoveBlockUpBtn'));
assert(uiSource.includes('parser-lab-composition-tab'));
assert(uiSource.includes("definition.enabled = include.checked"));
assert(uiSource.includes("elements.defineBlockButton.textContent = header ? 'Eliminar cabecera' : 'Definir como cabecera'"));
assert(uiSource.includes('state.activePreviewBlockId = instance.definition_id'));
const selectRowSource = uiSource.slice(
  uiSource.indexOf('function selectRow('),
  uiSource.indexOf('function updateNormalizedRowSelection(')
);
assert(!selectRowSource.includes('renderBlockModel();'));
assert(selectRowSource.includes('updateBlockNavigationSelection();'));
assert(selectRowSource.includes('updatePreviewItemSelection();'));
assert(selectRowSource.includes('updateNormalizedRowSelection(previousRowNumber, rowNumber, reveal);'));
assert(uiSource.includes("status.textContent = block.enabled ? `${block.items.length} ítems` : 'Ignorado'"));
assert(uiSource.includes("item.addEventListener('dragstart'"));
assert(uiSource.includes('copyBlockSettings(draggedBlockId, definition.id)'));
assert(uiSource.includes('blockModel.copyDefinitionSettings(target, source)'));
assert(uiSource.includes('¿Copiar los ajustes de'));
assert(uiSource.includes('parserLabBlockFilterInput'));
assert(uiSource.includes('parserLabCopyBlockTargetSelect'));
assert(uiSource.includes("loadParserLabDependency('CreditosParserLabUiSupport', './parser_lab/ui_support.js')"));
assert(uiSource.includes('uiSupport.navigateTablist(tablist, event)'));
assert(uiSource.includes('function navigateTableRows(rowNumber, event)'));
assert(uiSource.includes('uiSupport.setupSplitters({'));
assert(uiSource.includes('aria-label="Redimensionar filas y previo"'));
assert(uiSource.includes('function rebuildRowIndexes()'));
assert(uiSource.includes('uiSupport.buildRowIndexes('));
assert(uiSource.includes('renderNormalizedRows();'));
assert(uiSource.includes("button.tabIndex = active ? 0 : -1"));
assert(uiSource.includes("include.tabIndex = active ? 0 : -1"));
assert(!uiSource.includes("icon.textContent = '▦'"));
assert(!uiSource.includes('compositionIcon'));
assert(!uiSource.includes('parserLabClearModelBtn'));
assert(!uiSource.includes('parserLabCancelBlockBtn'));
assert(!uiSource.includes('parserLabDeleteBlockBtn'));
assert((uiSource.match(/data-split=/g) || []).length >= 3);
assert(uiSupportSource.includes('function buildRowIndexes('));
assert(uiSupportSource.includes('function navigateTablist(container, event)'));
assert(uiSupportSource.includes('function setupSplitters('));
assert(uiSupportSource.includes("splitter.setAttribute('aria-valuenow'"));
assert(cssSource.includes('#parserLabJsonsPane[hidden]'));
assert(cssSource.startsWith("@import url('./parser_lab_responsive.css');"));
assert(cssSource.includes('.parser-lab-block-editor-workspace'));
assert(cssSource.includes('.parser-lab-block-tab.drop-target'));
assert(cssSource.includes('min-height: 58px'));
assert(cssSource.includes('.parser-lab-preview-block-navigation'));
assert(cssSource.includes('grid-template-columns: minmax(155px, 22%) minmax(0, 1fr)'));
assert(cssSource.includes('.parser-lab-preview-tab.ignored .parser-lab-block-tab-copy'));
assert(cssSource.includes('.parser-lab-table-panel .parser-lab-table th'));
assert(cssSource.includes('.parser-lab-active-block-range'));
assert(cssSource.includes('.parser-lab-column-resizer'));
assert(cssSource.includes('.parser-lab-table.resizing-columns'));
assert(cssSource.includes('.parser-lab-block-navigation'));
assert(cssSource.includes('.parser-lab-block-filter'));
assert(cssSource.includes('.parser-lab-splitter:focus-visible'));
assert(cssSource.includes('.parser-lab-preview-warning'));
assert(cssSource.includes('.parser-lab-preview-trace'));
assert(cssSource.includes('--parser-lab-empty-row-count'));
assert(responsiveCssSource.includes('@media (max-width: 980px)'));
assert(responsiveCssSource.includes('@media (max-width: 700px)'));
assert(responsiveCssSource.includes('grid-template-columns: 1fr;'));
assert(responsiveCssSource.includes('grid-template-rows: minmax(700px, 82vh) minmax(720px, 86vh)'));
assert(responsiveCssSource.includes('height: auto;'));

console.log('ok parser lab manual block model');
