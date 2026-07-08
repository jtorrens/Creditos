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
    const easingOptions = [
      ['linear', 'Lineal'],
      ['easeIn', 'Ease in'],
      ['easeOut', 'Ease out'],
      ['easeInOut', 'Ease in/out'],
      ['emphasized', 'Enfática'],
    ].filter(([key]) => !options.styleTransitionEasings || options.styleTransitionEasings.includes(key));
    const propertyLabels = {
      line_spacing: 'Interlineado',
      column_gap: 'Separacion entre columnas',
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
      wrap.appendChild(options.localSelectRow(`${label} curva`, phaseValue.easing, easingOptions, (value) => updatePhase(subject, animation, phase, { easing: value }, updateAnimation)));
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
      block.className = 'style-animation-property' + (property.animate ? ' active' : '');
      const header = documentRef.createElement('div');
      header.className = 'style-animation-property-header';
      const toggle = documentRef.createElement('button');
      toggle.type = 'button';
      toggle.className = 'keyframe-toggle' + (property.animate ? ' active' : '');
      toggle.textContent = property.animate ? '●' : '○';
      toggle.title = property.animate ? 'Desactivar animacion de propiedad' : 'Animar propiedad';
      toggle.setAttribute('aria-label', toggle.title);
      toggle.setAttribute('aria-pressed', property.animate ? 'true' : 'false');
      toggle.addEventListener('click', () => {
        updateProperty(subject, animation, key, {
          animate: !property.animate,
        }, updateAnimation);
      });
      const label = documentRef.createElement('span');
      label.className = 'style-animation-property-label';
      label.textContent = propertyLabels[key] || key;
      header.appendChild(toggle);
      header.appendChild(label);
      block.appendChild(header);
      if (property.animate) {
        const values = documentRef.createElement('div');
        values.className = 'style-animation-property-values';
        values.appendChild(options.localNumberRow('Valor entrada', property.inValue, null, null, (value) => updateProperty(subject, animation, key, { inValue: value }, updateAnimation), stepForProperty(key)));
        values.appendChild(options.localNumberRow('Valor salida', property.outValue, null, null, (value) => updateProperty(subject, animation, key, { outValue: value }, updateAnimation), stepForProperty(key)));
        block.appendChild(values);
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
      const properties = { ...(current.properties || {}) };
      if (fields && fields.animate === false) {
        delete properties[key];
        updateAnimation({
          ...current,
          properties,
        });
        return;
      }
      const nextProperty = {
        ...((current.properties && current.properties[key]) || {}),
        ...(fields || {}),
      };
      if (fields && fields.animate === true) {
        const defaultValue = defaultValueForProperty(subject, key);
        if (nextProperty.inValue === undefined) nextProperty.inValue = defaultValue;
        if (nextProperty.outValue === undefined) nextProperty.outValue = defaultValue;
      }
      properties[key] = nextProperty;
      updateAnimation({
        ...current,
        properties,
      });
    }

    function stepForProperty(key) {
      if (key === 'opacity') return 0.01;
      if (key === 'scale' || key === 'line_spacing') return 0.01;
      return 1;
    }

    function defaultValueForProperty(subject, key) {
      if (subject && subject.cartela && subject.cartela[key] !== undefined) return subject.cartela[key];
      if (subject && subject[key] !== undefined) return subject[key];
      if (key === 'opacity') return 0;
      if (key === 'scale') return 1;
      if (key === 'line_spacing') return 1.12;
      return 0;
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
