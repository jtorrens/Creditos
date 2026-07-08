(function (root) {
  function createAppStyleAnimationEditor(options = {}) {
    const documentRef = options.documentRef || root.document;

    const modeOptions = [
      ['together', 'Todo a la vez'],
      ['cascade', 'En cascada'],
    ];
    const directionOptions = [
      ['topToBottom', 'Arriba abajo'],
      ['bottomToTop', 'Abajo arriba'],
      ['leftToRight', 'Izquierda derecha'],
      ['rightToLeft', 'Derecha izquierda'],
    ];
    const propertyLabels = {
      line_spacing: 'Interlineado',
      column_gap: 'Separacion entre columnas',
      role_name_gap: 'Separacion cargo/nombre',
      source_group_gap: 'Separacion de grupos',
      block_gap: 'Separacion entre bloques',
      block_title_gap: 'Separacion titulo/primera fila',
      vertical_offset: 'Desplazamiento vertical',
      page_top_margin: 'Margen superior',
      page_bottom_margin: 'Margen inferior',
      page_left_margin: 'Margen izquierdo',
      page_right_margin: 'Margen derecho',
      opacity: 'Opacidad',
      scale: 'Escala',
      translate_x: 'Desplazamiento X',
      translate_y: 'Desplazamiento Y',
    };

    function renderStyleAnimationControls(style) {
      const wrap = documentRef.createElement('div');
      wrap.className = 'style-animation-settings';
      wrap.appendChild(options.sectionLabel('Animacion'));

      const animation = options.normalizeStyleAnimation(style.animation || {});
      wrap.appendChild(options.localSelectRow('Activar animacion', options.boolSelectValue(animation.enabled), options.yesNoOptions, (value) => {
        updateStyleAnimation(style, {
          ...animation,
          enabled: options.normalizeBoolean(value, false),
        });
      }));

      wrap.appendChild(renderPhaseControls(style, animation, 'in', 'Entrada'));
      wrap.appendChild(renderPhaseControls(style, animation, 'out', 'Salida'));
      wrap.appendChild(renderPropertyControls(style, animation));
      return wrap;
    }

    function renderPhaseControls(style, animation, phase, label) {
      const wrap = documentRef.createElement('div');
      wrap.className = 'style-animation-phase';
      wrap.appendChild(options.sectionLabel(label));
      const phaseValue = animation[phase] || {};
      wrap.appendChild(options.localNumberRow(`${label} duracion ms`, phaseValue.durationMs, 0, null, (value) => updatePhase(style, phase, { durationMs: value })));
      wrap.appendChild(options.localNumberRow(`${label} delay ms`, phaseValue.delayMs, 0, null, (value) => updatePhase(style, phase, { delayMs: value })));
      wrap.appendChild(options.localInputRow(`${label} curva`, phaseValue.easing, (value) => updatePhase(style, phase, { easing: value }), { commitOnChange: true }));
      wrap.appendChild(options.localSelectRow(`${label} modo`, phaseValue.mode, modeOptions, (value) => updatePhase(style, phase, { mode: value })));
      wrap.appendChild(options.localSelectRow(`${label} direccion`, phaseValue.direction, directionOptions, (value) => updatePhase(style, phase, { direction: value })));
      wrap.appendChild(options.localNumberRow(`${label} feather px`, phaseValue.featherPx, 0, null, (value) => updatePhase(style, phase, { featherPx: value })));
      return wrap;
    }

    function renderPropertyControls(style, animation) {
      const wrap = documentRef.createElement('div');
      wrap.className = 'style-animation-properties';
      wrap.appendChild(options.sectionLabel('Propiedades animables'));
      (options.animatableStyleProperties || []).forEach((key) => {
        wrap.appendChild(renderPropertyControl(style, animation, key));
      });
      return wrap;
    }

    function renderPropertyControl(style, animation, key) {
      const property = animation.properties && animation.properties[key] ? animation.properties[key] : {};
      const block = documentRef.createElement('div');
      block.className = 'style-animation-property';
      block.appendChild(options.localSelectRow(propertyLabels[key] || key, options.boolSelectValue(!!property.animate), options.yesNoOptions, (value) => {
        updateProperty(style, key, { animate: options.normalizeBoolean(value, false) });
      }));
      if (property.animate) {
        block.appendChild(options.localNumberRow('Valor entrada', property.inValue, null, null, (value) => updateProperty(style, key, { inValue: value }), stepForProperty(key)));
        block.appendChild(options.localNumberRow('Valor salida', property.outValue, null, null, (value) => updateProperty(style, key, { outValue: value }), stepForProperty(key)));
      }
      return block;
    }

    function updatePhase(style, phase, fields) {
      const current = options.normalizeStyleAnimation(style.animation || {});
      updateStyleAnimation(style, {
        ...current,
        [phase]: {
          ...(current[phase] || {}),
          ...(fields || {}),
        },
      });
    }

    function updateProperty(style, key, fields) {
      const current = options.normalizeStyleAnimation(style.animation || {});
      updateStyleAnimation(style, {
        ...current,
        properties: {
          ...(current.properties || {}),
          [key]: {
            ...((current.properties && current.properties[key]) || {}),
            ...(fields || {}),
          },
        },
      });
    }

    function updateStyleAnimation(style, animation) {
      options.updateEditableStyleAnimation(style, animation);
    }

    function stepForProperty(key) {
      if (key === 'opacity') return 0.01;
      if (key === 'scale' || key === 'line_spacing') return 0.01;
      return 1;
    }

    return {
      renderStyleAnimationControls,
    };
  }

  root.CreditosAppStyleAnimationEditor = {
    createAppStyleAnimationEditor,
  };
})(globalThis);
