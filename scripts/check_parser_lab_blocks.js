#!/usr/bin/env node
const assert = require('assert');
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

const instances = model.findBlockInstances(rows, [direction, cast, crew]);
assert.deepStrictEqual(
  instances.map((instance) => ({ name: instance.name, start: instance.start_row, end: instance.end_row, count: instance.row_count })),
  [
    { name: 'Dirección', start: 1, end: 4, count: 4 },
    { name: 'Han intervenido', start: 5, end: 8, count: 4 },
    { name: 'Equipo técnico', start: 9, end: 10, count: 2 },
  ]
);

const missing = { ...cast, header: { ...cast.header, value: 'No existe' } };
const withMissing = model.findBlockInstances(rows, [direction, missing, crew]);
assert.strictEqual(withMissing[1].matched, false);
assert.strictEqual(withMissing[2].start_row, 9);
assert.strictEqual(model.modelDocument([direction]).schema, 'parser_lab_block_model');

const legacyDirection = { id: direction.id, name: direction.name, header: direction.header };
assert.deepStrictEqual(model.validateDefinition(legacyDirection), []);
assert.strictEqual(model.normalizeDefinition(legacyDirection).interpretation.separator.meaning, 'item');

const directionPage = model.normalizeDefinition(direction);
directionPage.interpretation.separator.meaning = 'page';
const semantic = model.interpretModel(rows, instances, [directionPage, cast, crew]);
assert.deepStrictEqual(
  semantic.blocks[0].items,
  [
    {
      principal: 'Dirección de Fotografía',
      associated: ['Alfonso Segura', 'Paula Fabra', 'Nombre dos'],
      separator_after: 'page',
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
assert.strictEqual(semantic.blocks[1].items[0].separator_after, 'item');
assert.deepStrictEqual(semantic.blocks[2].items[0].associated, []);
assert.strictEqual(semantic.blocks[2].items[0].separator_after, null);

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
    { name: 'Bloque A', matched: true, items: [{ principal: 'Cargo A' }, { principal: 'Cargo B' }, { principal: 'Cargo C' }] },
    { name: 'Bloque B', matched: true, items: [{ principal: 'Cargo D' }] },
    { name: 'Bloque C', matched: true, items: [] },
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
assert.strictEqual(model.modelDocument([direction], compositionRules).composition_rules.length, 2);

console.log('ok parser lab manual block model');
