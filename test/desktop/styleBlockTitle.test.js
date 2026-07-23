const assert = require('node:assert/strict');
const test = require('node:test');

require('../../apps/renderer/domain/styles');
require('../../apps/renderer/domain/render');

const normalizeBoolean = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'string') return value === 'true';
  return Boolean(value);
};

test('el estilo conserva la visibilidad del título de bloque', () => {
  const styles = globalThis.CreditosDomainStyles.createStyleDomain({
    blockTypographyFields: [],
    normalizeBoolean,
    normalizeColor: (value) => value,
    normalizeTextCapitalization: (value) => value || 'source',
    safeStyleId: (value) => String(value || ''),
  });

  assert.equal(styles.normalizeStyleBlock({}).show_block_title, true);
  assert.equal(styles.normalizeStyleBlock({ show_block_title: false }).show_block_title, false);

  const normalized = styles.normalizeCartelaStyle({
    id: 'sin_titulo',
    name: 'Sin título',
    block: { show_block_title: false },
  });
  assert.equal(normalized.version, 3);
  assert.equal(normalized.block.show_block_title, false);
  assert.equal(styles.serializeCartelaStyle(normalized).block.show_block_title, false);
});

test('el render oculta el título sin modificar el material de origen', () => {
  const sourceBlock = {
    id: 'block_equipo',
    title: 'Equipo técnico',
    type: 'credits',
    pages: [{ id: 'block_page', items: [{ id: 'item_1', kind: 'credit', role: 'Montaje', name: 'Nombre' }] }],
  };
  const render = globalThis.CreditosDomainRender.createRenderDomain({
    buildPhysicalPages: () => [],
    cartelaHasRenderableRefs: () => true,
    getEffectiveCartela: (cartela) => cartela,
    getEffectiveCartelaBlockStyle: () => ({
      show_block_title: false,
      concatenate_rows: false,
      force_role_name_columns: false,
    }),
    getSourceRefAlignment: () => ({}),
    getSourceRefColumns: () => 1,
    getSourceRefTypography: () => ({}),
    getSourceRefVerticalAlign: () => 'top',
    getVisualCartelas: (cartelas) => cartelas,
    renderMaterial: () => JSON.parse(JSON.stringify(sourceBlock)),
  });

  const output = render.buildRenderJson(
    {},
    [{ id: 'material_equipo', title: sourceBlock.title }],
    {
      cartelas: [{
        id: 'cartela_equipo',
        title: '',
        enabled: true,
        pages: [{ id: 'page_equipo', source_refs: ['material_equipo'] }],
      }],
    }
  );

  const renderedBlock = output.cartelas[0].pages[0].blocks[0];
  assert.equal(renderedBlock.show_block_title, false);
  assert.equal(renderedBlock.title, '');
  assert.equal(sourceBlock.title, 'Equipo técnico');
});
