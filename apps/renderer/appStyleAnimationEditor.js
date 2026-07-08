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
      return renderAnimationControls({
        subject: style,
        title: 'Animacion',
        animation: options.normalizeStyleAnimation(style.animation || {}),
        updateAnimation: (animation) => options.updateEditableStyleAnimation(style, animation),
      });
    }

    function renderCartelaAnimationControls(cartela) {
      const wrap = documentRef.createElement('div');
      wrap.className = 'style-animation-settings';
      wrap.appendChild(options.sectionLabel('Animacion'));
      const hasOverride = options.hasCartelaAnimationOverride && options.hasCartelaAnimationOverride(cartela);
      const effective = options.getEffectiveCartelaAnimation
        ? options.getEffectiveCartelaAnimation(cartela)
        : options.normalizeStyleAnimation(cartela.animation || {});
      wrap.appendChild(options.localSelectRow('Override animacion', options.boolSelectValue(hasOverride), options.yesNoOptions, (value) => {
        const enabled = options.normalizeBoolean(value, false);
        if (enabled) {
          options.updateSelectedCartelaAnimation(effective);
        } else {
          options.resetSelectedCartelaAnimationOverride();
        }
      }, {
        override: hasOverride,
        reset: options.resetSelectedCartelaAnimationOverride,
      }));

      if (!hasOverride) return wrap;
      wrap.appendChild(renderAnimationControls({
        subject: cartela,
        title: '',
        animation: effective,
        updateAnimation: (animation) => options.updateSelectedCartelaAnimation(animation),
        includeTitle: false,
      }));
      return wrap;
    }

    function renderAnimationControls({ subject, title, animation, updateAnimation, includeTitle = true }) {
      const wrap = documentRef.createElement('div');
      wrap.className = 'style-animation-settings';
      if (includeTitle && title) wrap.appendChild(options.sectionLabel(title));

      wrap.appendChild(options.localSelectRow('Activar animacion', options.boolSelectValue(animation.enabled), options.yesNoOptions, (value) => {
        updateAnimation({
          ...animation,
          enabled: options.normalizeBoolean(value, false),
        });
      }));

      wrap.appendChild(renderPhaseControls(subject, animation, 'in', 'Entrada', updateAnimation));
      wrap.appendChild(renderPhaseControls(subject, animation, 'out', 'Salida', updateAnimation));
      wrap.appendChild(renderPropertyControls(subject, animation, updateAnimation));
      return wrap;
    }

    function renderPhaseControls(subject, animation, phase, label, updateAnimation) {
      const wrap = documentRef.createElement('div');
      wrap.className = 'style-animation-phase';
      wrap.appendChild(options.sectionLabel(label));
      const phaseValue = animation[phase] || {};
      wrap.appendChild(options.localNumberRow(`${label} duracion ms`, phaseValue.durationMs, 0, null, (value) => updatePhase(subject, animation, phase, { durationMs: value }, updateAnimation)));
      wrap.appendChild(options.localNumberRow(`${label} delay ms`, phaseValue.delayMs, 0, null, (value) => updatePhase(subject, animation, phase, { delayMs: value }, updateAnimation)));
      wrap.appendChild(options.localInputRow(`${label} curva`, phaseValue.easing, (value) => updatePhase(subject, animation, phase, { easing: value }, updateAnimation), { commitOnChange: true }));
      wrap.appendChild(options.localSelectRow(`${label} modo`, phaseValue.mode, modeOptions, (value) => updatePhase(subject, animation, phase, { mode: value }, updateAnimation)));
      wrap.appendChild(options.localSelectRow(`${label} direccion`, phaseValue.direction, directionOptions, (value) => updatePhase(subject, animation, phase, { direction: value }, updateAnimation)));
      wrap.appendChild(options.localNumberRow(`${label} feather px`, phaseValue.featherPx, 0, null, (value) => updatePhase(subject, animation, phase, { featherPx: value }, updateAnimation)));
      return wrap;
    }

    function renderPropertyControls(subject, animation, updateAnimation) {
      const wrap = documentRef.createElement('div');
      wrap.className = 'style-animation-properties';
      wrap.appendChild(options.sectionLabel('Propiedades animables'));
      (options.animatableStyleProperties || []).forEach((key) => {
        wrap.appendChild(renderPropertyControl(subject, animation, key, updateAnimation));
      });
      return wrap;
    }

    function renderPropertyControl(subject, animation, key, updateAnimation) {
      const property = animation.properties && animation.properties[key] ? animation.properties[key] : {};
      const block = documentRef.createElement('div');
      block.className = 'style-animation-property';
      block.appendChild(options.localSelectRow(propertyLabels[key] || key, options.boolSelectValue(!!property.animate), options.yesNoOptions, (value) => {
        updateProperty(subject, animation, key, { animate: options.normalizeBoolean(value, false) }, updateAnimation);
      }));
      if (property.animate) {
        block.appendChild(options.localNumberRow('Valor entrada', property.inValue, null, null, (value) => updateProperty(subject, animation, key, { inValue: value }, updateAnimation), stepForProperty(key)));
        block.appendChild(options.localNumberRow('Valor salida', property.outValue, null, null, (value) => updateProperty(subject, animation, key, { outValue: value }, updateAnimation), stepForProperty(key)));
      }
      return block;
    }

    function updatePhase(subject, animation, phase, fields, updateAnimation) {
      const current = options.normalizeStyleAnimation(animation || subject.animation || {});
      updateAnimation({
        ...current,
        [phase]: {
          ...(current[phase] || {}),
          ...(fields || {}),
        },
      });
    }

    function updateProperty(subject, animation, key, fields, updateAnimation) {
      const current = options.normalizeStyleAnimation(animation || subject.animation || {});
      updateAnimation({
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

    function stepForProperty(key) {
      if (key === 'opacity') return 0.01;
      if (key === 'scale' || key === 'line_spacing') return 0.01;
      return 1;
    }

    return {
      renderCartelaAnimationControls,
      renderStyleAnimationControls,
    };
  }

  root.CreditosAppStyleAnimationEditor = {
    createAppStyleAnimationEditor,
  };
})(globalThis);
