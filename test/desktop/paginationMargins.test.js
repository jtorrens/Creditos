const assert = require('node:assert/strict');
const test = require('node:test');

require('../../apps/renderer/domain/pagination');

function block(id, height, itemCount = 1) {
  return {
    id,
    title: id,
    measured_height: height,
    columns: 1,
    pages: [{
      id: `${id}_page`,
      items: Array.from({ length: itemCount }, (_, index) => ({
        id: `${id}_item_${index + 1}`,
        kind: 'list_item',
        value: `${id} ${index + 1}`,
      })),
    }],
  };
}

test('corta antes del bloque que cruzaría el margen inferior aunque queden líneas abstractas', () => {
  const domain = globalThis.CreditosDomainPagination.createPaginationDomain({
    blockForTitleRepeat: (candidate) => candidate,
    canvasTextHeight: () => 20,
    canvasTextMetrics: () => ({}),
    canvasWrappedTextLines: (value) => [String(value || '')],
    cartelaBlockGap: () => 10,
    cartelaHasImages: () => false,
    countTitleLine: (value) => String(value || '').trim() ? 1 : 0,
    creditSourceId: () => '',
    getEffectiveCartela: (cartela) => cartela,
    getRenderLayout: () => ({
      page_width: 400,
      page_height: 260,
      page_top_margin: 10,
      page_bottom_margin: 10,
      page_left_margin: 10,
      page_right_margin: 10,
      column_gap: 0,
      role_name_gap: 0,
    }),
    getRenderedBlockUnits: (candidate) => candidate.pages.flatMap((page) => page.items),
    layoutForCartela: (layout) => layout,
    measureCanvasBlock: (_ctx, candidate) => candidate.measured_height,
    normalizeSettings: (settings) => settings,
    sourceBlankRowCounts: () => [],
    unitRenderOptions: () => ({}),
  });
  const cartela = {
    id: 'thanks',
    title: 'Agradecimientos',
    pages: [{
      id: 'thanks_page',
      blocks: [
        block('Localizaciones', 100),
        block('Arte', 30),
        block('Vestuario', 30),
        block('Maquillaje/Peluquería', 30),
      ],
    }],
  };

  const pages = domain.buildPhysicalPages([cartela], {}, {
    settings: { default_auto_page_lines: 36 },
  });

  assert.equal(pages.length, 2);
  assert.deepEqual(pages[0].blocks.map((candidate) => candidate.id), [
    'Localizaciones',
    'Arte',
    'Vestuario',
  ]);
  assert.deepEqual(pages[1].blocks.map((candidate) => candidate.id), [
    'Maquillaje/Peluquería',
  ]);
  assert.equal(pages[0].line_count < pages[0].line_limit, true);
});

test('una ampliación manual de líneas prevalece sobre el margen físico', () => {
  const domain = globalThis.CreditosDomainPagination.createPaginationDomain({
    blockForTitleRepeat: (candidate) => candidate,
    canvasTextHeight: () => 20,
    canvasTextMetrics: () => ({}),
    canvasWrappedTextLines: (value) => [String(value || '')],
    cartelaBlockGap: () => 10,
    cartelaHasImages: () => false,
    countTitleLine: (value) => String(value || '').trim() ? 1 : 0,
    creditSourceId: () => '',
    getEffectiveCartela: (cartela) => cartela,
    getRenderLayout: () => ({
      page_width: 400,
      page_height: 260,
      page_top_margin: 10,
      page_bottom_margin: 10,
      page_left_margin: 10,
      page_right_margin: 10,
      column_gap: 0,
      role_name_gap: 0,
    }),
    getRenderedBlockUnits: (candidate) => candidate.pages.flatMap((page) => page.items),
    layoutForCartela: (layout) => layout,
    measureCanvasBlock: (_ctx, candidate) => candidate.measured_height,
    normalizeSettings: (settings) => settings,
    sourceBlankRowCounts: () => [],
    unitRenderOptions: () => ({}),
  });
  const cartela = {
    id: 'thanks',
    title: 'Agradecimientos',
    pages: [{
      id: 'thanks_page',
      blocks: [
        block('Localizaciones', 100),
        block('Arte', 30),
        block('Vestuario', 30),
        block('Maquillaje/Peluquería', 30),
      ],
    }],
  };

  const pages = domain.buildPhysicalPages([cartela], {}, {
    settings: { default_auto_page_lines: 36 },
    pageLineAdjustments: {
      __physical: {
        thanks_thanks_page_physical_01: 1,
      },
    },
  });

  assert.equal(pages.length, 1);
  assert.equal(pages[0].line_limit, 37);
  assert.deepEqual(pages[0].blocks.map((candidate) => candidate.id), [
    'Localizaciones',
    'Arte',
    'Vestuario',
    'Maquillaje/Peluquería',
  ]);
});

test('una línea manual no arrastra todos los nombres del mismo grupo', () => {
  const units = [
    { id: 'previous', kind: 'crew_credit', source_item_id: 'previous', role: 'Eléctricos', name: 'Edgar' },
    { id: 'name_1', kind: 'crew_credit', source_item_id: 'reinforcements', role: 'Refuerzos', name: 'Natan' },
    { id: 'name_2', kind: 'crew_credit', source_item_id: 'reinforcements', role: 'Refuerzos', name: 'Pascual' },
    { id: 'name_3', kind: 'crew_credit', source_item_id: 'reinforcements', role: 'Refuerzos', name: 'Hugo' },
  ];
  const domain = globalThis.CreditosDomainPagination.createPaginationDomain({
    blockForTitleRepeat: (candidate) => candidate,
    canvasTextHeight: () => 20,
    canvasTextMetrics: () => ({ lineHeight: 20 }),
    canvasWrappedTextLines: (value) => [String(value || '')],
    cartelaBlockGap: () => 0,
    cartelaHasImages: () => false,
    countTitleLine: () => 0,
    creditSourceId: (unit) => unit.source_item_id,
    getEffectiveCartela: (cartela) => cartela,
    getRenderLayout: () => ({
      page_width: 400,
      page_height: 260,
      page_top_margin: 10,
      page_bottom_margin: 10,
      page_left_margin: 10,
      page_right_margin: 10,
      column_gap: 0,
      role_name_gap: 0,
    }),
    getRenderedBlockUnits: () => units,
    layoutForCartela: (layout) => layout,
    measureCanvasBlock: (_ctx, candidate) => 190 + candidate.pages[0].items.length * 30,
    normalizeSettings: (settings) => settings,
    sourceBlankRowCounts: () => [],
    unitRenderOptions: (unit, previousSourceId) => ({
      repeatedNameRow: unit.source_item_id === previousSourceId,
    }),
  });
  const cartela = {
    id: 'crew',
    pages: [{
      id: 'crew_page',
      blocks: [{
        id: 'crew_block',
        columns: 1,
        pages: [{ id: 'source_page', items: units }],
      }],
    }],
  };

  const pages = domain.buildPhysicalPages([cartela], {}, {
    settings: { default_auto_page_lines: 36 },
    pageLineAdjustments: {
      __physical: {
        crew_crew_page_physical_01: 1,
      },
    },
  });

  assert.deepEqual(
    pages[0].blocks[0].pages[0].items.map((item) => item.id),
    ['previous', 'name_1']
  );
  assert.deepEqual(
    pages.slice(1).flatMap((page) => page.blocks[0].pages[0].items.map((item) => item.id)),
    ['name_2', 'name_3']
  );
});

test('cada fila vacía del origen ocupa exactamente una línea tipográfica', () => {
  const domain = globalThis.CreditosDomainPagination.createPaginationDomain({
    canvasTextMetrics: (styleKey) => ({ lineHeight: styleKey === 'role' ? 52 : 60 }),
    cartelaBlockGap: () => 25,
  });

  const gap = domain.unitGapBefore({
    itemGapBefore: false,
    sourceGroupBlankRows: 2,
  }, {}, {
    unit: { kind: 'crew_credit', role: 'Peones', name: 'Jose Castro' },
    block: { typography: {} },
    cartela: { orientation: 'horizontal' },
  });

  assert.equal(gap, 120);
});
