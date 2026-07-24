const assert = require('node:assert/strict');
const test = require('node:test');

require('../../apps/renderer/domain/structure');
require('../../apps/renderer/appCommands');

function createDomain() {
  return globalThis.CreditosDomainStructure.createStructureDomain({
    defaultLayoutForMaterial: () => 'card',
    defaultOrientationForMaterial: () => 'vertical',
    getMaterialContentItems: (material) => material.items || [],
    groupMusicLicenseThemes: (items) => items,
    normalizePreviewSettings: (settings) => settings,
    normalizeTypographyOverrides: (typography) => typography || {},
    normalizeVerticalAlign: (value) => value || 'center',
  });
}

function cartela(id, refs, fields = {}) {
  return {
    id,
    source_order: fields.source_order || 1,
    visual_order: fields.visual_order || 1,
    enabled: true,
    style_id: fields.style_id || '',
    images: fields.images || [],
    pages: (fields.pages || [refs]).map((pageRefs, index) => ({
      id: `${id}_page_${index + 1}`,
      source_refs: pageRefs,
      source_ref_settings: Object.fromEntries(pageRefs.map((ref) => [ref, { columns: 1 }])),
    })),
  };
}

function material(id, title, rows = []) {
  return {
    id,
    title,
    items: rows.map((row) => ({ row, role: `Cargo ${row}`, name: `Nombre ${row}` })),
  };
}

test('actualiza los saltos de página desde el origen aunque la estructura conserve cortes antiguos', () => {
  const domain = createDomain();
  const sourceMaterial = {
    ...material('team', 'Jefes de Equipo', [2, 4, 6]),
    page_break_after_item_indexes: [0, 1],
  };
  sourceMaterial.items = sourceMaterial.items.map((item, index) => ({
    ...item,
    id: `item_${index + 1}`,
    names: [{ id: `name_${index + 1}`, name: `Nombre ${index + 1}` }],
  }));
  const previousStructure = {
    version: 12,
    cartelas: [cartela('team_cartela', ['team'])],
    page_breaks: {
      team: ['item_1__name_1'],
    },
  };

  const structure = domain.createStructureFromSource(
    { sheet: 'Créditos' },
    [sourceMaterial],
    previousStructure,
    { default_cartela_duration: 4 }
  );

  assert.deepEqual(structure.page_breaks.team, [
    'item_1__name_1',
    'item_2__name_2',
  ]);
});

test('traslada presentación conservadoramente y solo agrupa correspondencias exactas completas', () => {
  const domain = createDomain();
  const targetMaterials = [
    material('target_a', 'Pequeñas Partes', [10]),
    material('target_b', 'Meditempus', [20]),
    material('target_c', 'Equipo destino', [30, 31]),
    material('target_d', 'Sin equivalente', [90]),
    material('target_e', 'Emplazamiento publicitario', [100]),
  ];
  const sourceMaterials = [
    material('source_a', 'Pequeñas Partes', [10]),
    material('source_b', 'Meditempus', [20]),
    material('source_c', 'Equipo origen', [30, 31]),
    material('source_e', 'Emplazamiento publicitario', [100]),
  ];
  const destinationImage = {
    id: 'destination_image',
    name: 'Destino',
    data_url: 'data:image/png;base64,destination',
    scale: 0.8,
  };
  const sourceImage = {
    id: 'source_image',
    name: 'Origen',
    data_url: 'data:image/png;base64,source',
    scale: 1.2,
    offset_x: 12,
  };
  const targetStructure = {
    version: 12,
    cartelas: [
      cartela('target_cartela_a', ['target_a'], { source_order: 1, visual_order: 1 }),
      cartela('target_cartela_b', ['target_b'], { source_order: 2, visual_order: 2 }),
      cartela('target_cartela_c', ['target_c'], { source_order: 3, visual_order: 3 }),
      cartela('target_cartela_d', ['target_d'], { source_order: 4, visual_order: 4, style_id: 'keep' }),
      cartela('target_cartela_e', ['target_e'], {
        source_order: 5,
        visual_order: 5,
        images: [destinationImage],
      }),
    ],
  };
  const sourceStructure = {
    version: 12,
    cartelas: [
      cartela('source_cartela_ab', ['source_a', 'source_b'], {
        source_order: 1,
        visual_order: 1,
        style_id: 'grouped_style',
        images: [sourceImage],
        pages: [['source_a'], ['source_b']],
      }),
      cartela('source_cartela_c', ['source_c'], {
        source_order: 2,
        visual_order: 2,
        style_id: 'approximate_style',
      }),
      cartela('source_cartela_e', ['source_e'], {
        source_order: 3,
        visual_order: 3,
        style_id: 'image_style',
        images: [sourceImage],
      }),
    ],
  };
  const originalTarget = JSON.parse(JSON.stringify(targetStructure));
  const transferred = domain.transferStructurePresentation(
    targetStructure,
    targetMaterials,
    sourceStructure,
    sourceMaterials,
    (target, source) => {
      target.style_id = source.style_id;
    },
    sourceStructure
  );

  assert.deepEqual(targetStructure, originalTarget);
  assert.equal(transferred.report.exact_matches, 3);
  assert.equal(transferred.report.approximate_matches, 1);
  assert.equal(transferred.report.unmatched_materials, 1);
  assert.equal(transferred.report.grouped_cartelas, 1);
  assert.equal(transferred.report.copied_images, 1);
  assert.equal(transferred.report.protected_image_cartelas, 0);
  assert.equal(transferred.structure.cartelas.length, 4);

  const grouped = transferred.structure.cartelas.find((item) => item.id === 'target_cartela_a');
  assert.equal(grouped.style_id, 'grouped_style');
  assert.deepEqual(grouped.pages.map((page) => page.source_refs), [['target_a'], ['target_b']]);
  assert.equal(grouped.images[0].data_url, sourceImage.data_url);
  assert.equal(transferred.structure.cartelas.some((item) => item.id === 'target_cartela_b'), false);

  const approximate = transferred.structure.cartelas.find((item) => item.id === 'target_cartela_c');
  assert.equal(approximate.style_id, 'approximate_style');
  assert.deepEqual(approximate.pages[0].source_refs, ['target_c']);

  const unmatched = transferred.structure.cartelas.find((item) => item.id === 'target_cartela_d');
  assert.equal(unmatched.style_id, 'keep');

  const withImage = transferred.structure.cartelas.find((item) => item.id === 'target_cartela_e');
  assert.equal(withImage.style_id, 'image_style');
  assert.equal(withImage.images[0].data_url, destinationImage.data_url);
});

test('no duplica una imagen de origen cuando varios destinos solo coinciden de forma aproximada', () => {
  const domain = createDomain();
  const sourceImage = { id: 'logo', name: 'Logo', data_url: 'data:image/png;base64,logo' };
  const targetMaterials = [
    material('target_1', 'Destino uno', [40, 41]),
    material('target_2', 'Destino dos', [40, 41]),
  ];
  const sourceMaterials = [material('source_1', 'Origen', [40, 41])];
  const targetStructure = {
    version: 12,
    cartelas: [
      cartela('target_cartela_1', ['target_1'], { source_order: 1, visual_order: 1 }),
      cartela('target_cartela_2', ['target_2'], { source_order: 2, visual_order: 2 }),
    ],
  };
  const sourceStructure = {
    version: 12,
    cartelas: [
      cartela('source_cartela', ['source_1'], {
        source_order: 1,
        visual_order: 1,
        images: [sourceImage],
      }),
    ],
  };

  const transferred = domain.transferStructurePresentation(
    targetStructure,
    targetMaterials,
    sourceStructure,
    sourceMaterials,
    () => {},
    sourceStructure
  );

  assert.equal(transferred.report.approximate_matches, 2);
  assert.equal(transferred.report.copied_images, 0);
  assert.equal(transferred.report.ambiguous_image_cartelas, 2);
  assert.equal(transferred.structure.cartelas.every((item) => item.images.length === 0), true);
});

test('recrea una cartela gráfica independiente tras un bloque ancla exacto', () => {
  const domain = createDomain();
  const sourceImage = {
    id: 'placement',
    name: 'Emplazamiento',
    data_url: 'data:image/png;base64,placement',
    scale: 1.4,
    offset_y: 18,
  };
  const targetStructure = {
    version: 12,
    cartelas: [cartela('target_logo', ['target_logo_material'], { source_order: 1, visual_order: 1 })],
  };
  const sourceImageCartela = cartela('source_images', [], {
    source_order: 2,
    visual_order: 2,
    images: [sourceImage],
  });
  sourceImageCartela.manual = true;
  sourceImageCartela.manual_name = 'Emplazamiento Publicitario';
  const sourceStructure = {
    version: 12,
    cartelas: [
      cartela('source_logo', ['source_logo_material'], { source_order: 1, visual_order: 1 }),
      sourceImageCartela,
    ],
  };

  const transferred = domain.transferStructurePresentation(
    targetStructure,
    [material('target_logo_material', 'LOGO EMPLAZAMIENTO PUBLICITARIO', [523])],
    sourceStructure,
    [material('source_logo_material', 'LOGO EMPLAZAMIENTO PUBLICITARIO', [523])],
    () => {},
    sourceStructure
  );

  assert.equal(transferred.report.created_image_cartelas, 1);
  assert.equal(transferred.report.copied_images, 1);
  assert.equal(transferred.structure.cartelas.length, 2);
  const graphic = transferred.structure.cartelas.find((item) => item.manual_name === 'Emplazamiento Publicitario');
  assert.equal(graphic.manual, true);
  assert.equal(graphic.visual_order, 2);
  assert.deepEqual(graphic.pages[0].source_refs, []);
  assert.equal(graphic.images[0].data_url, sourceImage.data_url);
  assert.equal(graphic.images[0].scale, sourceImage.scale);
  assert.equal(graphic.images[0].offset_y, sourceImage.offset_y);
});

test('permite elegir otro modelo del mismo capítulo y confirma el resultado antes de aplicarlo', async () => {
  const requests = [];
  const alerts = [];
  const confirmations = [];
  let modalSources = [];
  let rebuilds = 0;
  const transferredStructure = { cartelas: [{ id: 'transferred', pages: [] }] };
  const state = {
    databasePath: '/tmp/creditos.db',
    selectedProductionId: 1,
    selectedEpisodeId: 10,
    selectedCartelaId: 'old',
    importModels: [
      { id: 'current_model', label: 'Actual' },
      { id: 'other_model', label: 'Otro modelo' },
    ],
    source: { blocks: [] },
    materials: [],
    structure: { cartelas: [{ id: 'old', pages: [] }] },
  };
  const commands = globalThis.CreditosAppCommands.createAppCommands({
    applyExplicitCartelaOverridesFromSource: () => {},
    createMaterialsFromSource: () => [{ id: 'source_material' }],
    currentProductionEpisodes: () => [{ id: 10, episode_number: 1, name: 'Capítulo 01' }],
    dbPost: async (path, payload) => {
      requests.push([path, payload]);
      if (path === '/api/db/list-structure-sources') {
        return {
          sources: [
            { episode_id: 10, import_model_id: 'current_model' },
            { episode_id: 10, import_model_id: 'other_model' },
          ],
        };
      }
      return {
        source: { meta: { loaded_file: 'creditos.ods' }, blocks: [] },
        structure: { cartelas: [{ id: 'source', pages: [] }] },
      };
    },
    migrateStructure: (structure) => structure,
    nativeBridge: () => ({
      confirm: async (data) => {
        confirmations.push(data);
        return { confirmed: true };
      },
    }),
    normalizeSource: (source) => source,
    rebuild: () => { rebuilds += 1; },
    selectedImportModelIdInDomain: () => 'current_model',
    selectedProduction: () => ({ id: 1, import_model_id: 'current_model' }),
    showEpisodeStyleSourceModal: async (sources) => {
      modalSources = sources;
      return sources[0].id;
    },
    state,
    transferStructurePresentation: () => ({
      structure: transferredStructure,
      report: {
        matched_materials: 1,
        exact_matches: 1,
        approximate_matches: 0,
        unmatched_materials: 0,
        styled_cartelas: 1,
        grouped_cartelas: 0,
        protected_image_cartelas: 0,
        copied_image_cartelas: 0,
        copied_images: 0,
        created_image_cartelas: 0,
        ambiguous_image_cartelas: 0,
      },
    }),
    windowRef: {
      alert: (message) => alerts.push(message),
      confirm: () => false,
    },
  });

  await commands.copyStylesFromEpisodeFlow();

  assert.equal(modalSources.length, 1);
  assert.equal(modalSources[0].import_model_id, 'other_model');
  assert.match(modalSources[0].label, /Capítulo 01 · Otro modelo/);
  assert.deepEqual(requests[1], [
    '/api/db/load-episode',
    { production_id: 1, episode_id: 10, import_model_id: 'other_model' },
  ]);
  assert.equal(confirmations.length, 1);
  assert.equal(state.structure, transferredStructure);
  assert.equal(state.selectedCartelaId, 'transferred');
  assert.equal(rebuilds, 1);
  assert.match(alerts[0], /Presentación aplicada/);
});
