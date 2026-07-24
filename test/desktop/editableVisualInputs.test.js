const assert = require('node:assert/strict');
const test = require('node:test');

require('../../apps/renderer/appEditableInputs');

test('el editor visual no hace wrap y solo crece con saltos de línea manuales', () => {
  let inputHandler = null;
  const input = {
    classList: { add: () => {}, toggle: () => {} },
    rows: 1,
    setAttribute: () => {},
    style: {},
    tagName: 'TEXTAREA',
    value: 'Un cargo muy largo que debe permanecer en una sola línea',
  };
  const windowRef = {
    getComputedStyle: () => ({
      borderBottomWidth: '1',
      borderTopWidth: '1',
      fontSize: '14',
      lineHeight: '16',
      paddingBottom: '2',
      paddingTop: '2',
    }),
    requestAnimationFrame: (callback) => callback(),
  };
  const editable = globalThis.CreditosAppEditableInputs.createAppEditableInputs({
    buildCurrentRenderJson: () => ({}),
    fieldControlRegistry: {
      create: (_type, options) => {
        inputHandler = options.onInput;
        return input;
      },
    },
    getEffectiveCartela: () => ({ auto_text_wrap: true }),
    getSelectedCartela: () => ({}),
    normalizeBoolean: (value) => Boolean(value),
    renderCartelaPreview: () => {},
    renderPreview: () => {},
    resolveOverride: (_overrides, _refId, _field, fallback) => fallback,
    setEditableOverride: () => {},
    state: { materials: [], overrides: {}, source: {}, structure: { overrides: {} } },
    windowRef,
  });

  editable.makeVisualInput('item_1', 'role', input.value, 'render-role-input', {
    autoWrap: true,
  });

  assert.equal(input.wrap, 'off');
  assert.equal(input.style.whiteSpace, 'pre');
  assert.equal(input.rows, 1);
  assert.equal(input.style.height, '30px');

  input.value = 'Primera línea\nSegunda línea';
  inputHandler(input.value, input);

  assert.equal(input.rows, 2);
  assert.equal(input.style.height, '38px');
});
