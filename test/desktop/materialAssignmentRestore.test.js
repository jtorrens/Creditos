const assert = require('node:assert/strict');
const test = require('node:test');

require('../../apps/renderer/domain/structure');

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

test('quitar un bloque movido recupera su cartela, página y posición anteriores', () => {
  const domain = createDomain();
  const original = {
    id: 'cartela_original',
    source_order: 2,
    visual_order: 2,
    style_id: 'estilo_original',
    pages: [{
      id: 'pagina_original',
      source_refs: ['bloque'],
      source_ref_settings: {
        bloque: { columns: 2, typography: { role: { font_size: 42 } } },
      },
    }],
  };
  const target = {
    id: 'cartela_destino',
    source_order: 3,
    visual_order: 3,
    pages: [{ id: 'pagina_destino', source_refs: [], source_ref_settings: {} }],
  };
  const structure = {
    version: 12,
    cartelas: [
      {
        id: 'cartela_anterior',
        source_order: 1,
        visual_order: 1,
        pages: [{
          id: 'pagina_anterior',
          source_refs: ['otro_bloque'],
          source_ref_settings: { otro_bloque: { columns: 1 } },
        }],
      },
      original,
      target,
    ],
  };

  assert.equal(domain.moveMaterialToCartela(structure, 'bloque', target), true);
  assert.deepEqual(target.pages[0].source_refs, ['bloque']);
  assert.deepEqual(original.pages[0].source_refs, []);

  const persisted = domain.structureJsonForOutput(structure, [
    { id: 'otro_bloque', items: [{}] },
    { id: 'bloque', items: [{}] },
  ]);
  assert.equal(persisted.cartelas.some((cartela) => cartela.id === 'cartela_original'), false);
  const reloaded = domain.migrateStructure(JSON.parse(JSON.stringify(persisted)));

  assert.equal(domain.restoreMaterialAssignment(reloaded, 'bloque'), true);
  assert.deepEqual(reloaded.cartelas.map((cartela) => cartela.id), [
    'cartela_anterior',
    'cartela_original',
    'cartela_destino',
  ]);
  assert.deepEqual(reloaded.cartelas[1].pages[0].source_refs, ['bloque']);
  assert.equal(reloaded.cartelas[1].style_id, 'estilo_original');
  assert.deepEqual(reloaded.cartelas[1].pages[0].source_ref_settings.bloque, {
    columns: 2,
    typography: { role: { font_size: 42 } },
  });
  assert.deepEqual(reloaded.cartelas[2].pages[0].source_refs, []);
  assert.equal(reloaded.material_assignment_history, undefined);
});

test('quitar un bloque sin historial lo deja sin cartela', () => {
  const domain = createDomain();
  const structure = {
    cartelas: [{
      id: 'cartela',
      pages: [{
        id: 'pagina',
        source_refs: ['bloque'],
        source_ref_settings: { bloque: { columns: 1 } },
      }],
    }],
  };

  assert.equal(domain.restoreMaterialAssignment(structure, 'bloque'), true);
  assert.deepEqual(structure.cartelas[0].pages[0].source_refs, []);
  assert.equal(structure.cartelas[0].pages[0].source_ref_settings.bloque, undefined);
});
