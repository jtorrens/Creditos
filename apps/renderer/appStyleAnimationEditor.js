(function (root) {
  function createAppStyleAnimationEditor(options = {}) {
    const documentRef = options.documentRef || root.document;
    const fieldControlRegistry = options.fieldControlRegistry;

    const modeOptions = [
      ['together', 'Full Frame'],
      ['cascade', 'En cascada'],
      ['relativeCascade', 'Cascada relativa'],
      ['symmetricCascade', 'Cascada simétrica'],
    ];
    const fadeModeOptions = [
      ['fullFrame', 'Full Frame'],
      ['cascade', 'Cascada'],
    ];
    const fadeBoundsOptions = [
      ['screen', 'Screen'],
      ['visibleFrame', 'Frame visible'],
    ].filter(([key]) => !options.styleFadeBounds || options.styleFadeBounds.includes(key));
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
      'typography.block_title.font_size': 'Título bloque tamaño',
      'typography.block_title.letter_spacing': 'Título bloque spacing',
      'typography.role.font_size': 'Cargo tamaño',
      'typography.role.letter_spacing': 'Cargo spacing',
      'typography.name.font_size': 'Nombre tamaño',
      'typography.name.letter_spacing': 'Nombre spacing',
    };

    function renderStyleAnimationControls(style, controlOptions = {}) {
      return renderAnimationControls({
        subject: style,
        title: 'Animacion',
        animation: options.normalizeStyleAnimation(style.animation || {}),
        updateAnimation: (animation) => options.updateEditableStyleAnimation(style, animation),
        includeTitle: controlOptions.includeTitle !== false,
      });
    }

    function renderCartelaAnimationControls(cartela, controlOptions = {}) {
      const wrap = documentRef.createElement('div');
      wrap.className = 'style-animation-settings';
      if (controlOptions.includeTitle !== false) wrap.appendChild(options.sectionLabel('Animacion'));
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
      return wrap;
    }

    function renderPhaseControls(subject, animation, phase, label, updateAnimation) {
      const wrap = documentRef.createElement('div');
      wrap.className = 'style-animation-phase';
      wrap.appendChild(options.sectionLabel(label));
      const phaseValue = animation[phase] || {};
      wrap.appendChild(options.localNumberRow(`${label} duracion frames`, phaseFrames(phaseValue, 'duration'), 0, null, (value) => updatePhaseFrames(subject, animation, phase, 'duration', value, updateAnimation)));
      wrap.appendChild(options.localNumberRow(`${label} delay frames`, phaseFrames(phaseValue, 'delay'), 0, null, (value) => updatePhaseFrames(subject, animation, phase, 'delay', value, updateAnimation)));
      wrap.appendChild(options.localSelectRow(`${label} curva`, phaseValue.easing, easingOptions, (value) => updatePhase(subject, animation, phase, { easing: value }, updateAnimation)));
      wrap.appendChild(options.localSelectRow(`${label} modo`, phaseValue.mode, modeOptions, (value) => updatePhase(subject, animation, phase, { mode: value }, updateAnimation)));
      wrap.appendChild(options.localSelectRow(`${label} direccion`, phaseValue.direction, directionOptions, (value) => updatePhase(subject, animation, phase, { direction: value }, updateAnimation)));
      wrap.appendChild(options.localNumberRow(`${label} feather px`, phaseValue.featherPx, 0, null, (value) => updatePhase(subject, animation, phase, { featherPx: value }, updateAnimation)));
      wrap.appendChild(options.localNumberRow(`${label} fade frames`, phaseFrames(phaseValue, 'fadeDuration'), 0, null, (value) => updatePhaseFrames(subject, animation, phase, 'fadeDuration', value, updateAnimation)));
      wrap.appendChild(options.localSelectRow(`${label} fade curva`, phaseValue.fadeEasing || phaseValue.easing, easingOptions, (value) => updatePhase(subject, animation, phase, { fadeEasing: value }, updateAnimation)));
      wrap.appendChild(options.localSelectRow(`${label} fade modo`, phaseValue.fadeMode, fadeModeOptions, (value) => updatePhase(subject, animation, phase, { fadeMode: value }, updateAnimation)));
      wrap.appendChild(options.localSelectRow(`${label} fade direccion`, phaseValue.fadeDirection, directionOptions, (value) => updatePhase(subject, animation, phase, { fadeDirection: value }, updateAnimation)));
      wrap.appendChild(options.localSelectRow(`${label} fade alcance`, phaseValue.fadeBounds, fadeBoundsOptions, (value) => updatePhase(subject, animation, phase, { fadeBounds: value }, updateAnimation)));
      return wrap;
    }

    function styleAnimationRowMeta(style, key, meta = {}) {
      return animationRowMeta({
        animation: options.normalizeStyleAnimation(style.animation || {}),
        key,
        meta,
        subject: style,
        updateAnimation: (animation) => options.updateEditableStyleAnimation(style, animation),
      });
    }

    function cartelaAnimationRowMeta(cartela, key, meta = {}) {
      const effective = options.getEffectiveCartelaAnimation
        ? options.getEffectiveCartelaAnimation(cartela)
        : options.normalizeStyleAnimation(cartela.animation || {});
      return animationRowMeta({
        animation: effective,
        key,
        meta,
        subject: options.getEffectiveCartela ? { ...cartela, ...options.getEffectiveCartela(cartela) } : cartela,
        updateAnimation: (animation) => options.updateSelectedCartelaAnimation(animation),
      });
    }

    function animationRowMeta({ subject, key, animation, updateAnimation, meta = {} }) {
      if (!canAnimateProperty(key)) return meta;
      const property = animation.properties && animation.properties[key] ? animation.properties[key] : {};
      return {
        ...meta,
        beforeControl: renderKeyframeToggle(subject, animation, key, property, updateAnimation, meta),
        afterControl: property.animate ? renderInlinePropertyValues(subject, animation, key, property, updateAnimation, meta) : null,
      };
    }

    function renderKeyframeToggle(subject, animation, key, property, updateAnimation, meta = {}) {
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
        }, updateAnimation, meta);
      });
      return toggle;
    }

    function renderInlinePropertyValues(subject, animation, key, property, updateAnimation, meta = {}) {
      const wrap = documentRef.createElement('div');
      wrap.className = 'style-animation-inline-values';
      wrap.appendChild(renderInlineNumber('In', property.inValue, (value) => updateProperty(subject, animation, key, { inValue: value }, updateAnimation, meta), stepForProperty(key)));
      wrap.appendChild(renderInlineNumber('Out', property.outValue, (value) => updateProperty(subject, animation, key, { outValue: value }, updateAnimation, meta), stepForProperty(key)));
      return wrap;
    }

    function renderInlineNumber(labelText, value, onInput, step) {
      const wrap = documentRef.createElement('label');
      wrap.className = 'style-animation-inline-value';
      const label = documentRef.createElement('span');
      label.textContent = labelText;
      const input = fieldControlRegistry.create('number', {
        value,
        step,
        onInput,
        onAfterCommit: options.renderEditor,
      });
      wrap.appendChild(label);
      wrap.appendChild(input);
      return wrap;
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

    function updatePhaseFrames(subject, animation, phase, field, value, updateAnimation) {
      const frames = Math.max(0, Math.round(Number(value) || 0));
      const fields = {};
      if (field === 'duration') {
        fields.durationFrames = frames;
        fields.durationMs = framesToMs(frames);
      } else if (field === 'delay') {
        fields.delayFrames = frames;
        fields.delayMs = framesToMs(frames);
      } else if (field === 'fadeDuration') {
        fields.fadeDurationFrames = frames;
        fields.fadeDurationMs = framesToMs(frames);
      }
      updatePhase(subject, animation, phase, fields, updateAnimation);
    }

    function phaseFrames(phaseValue = {}, field) {
      const frameKey = field === 'fadeDuration' ? 'fadeDurationFrames' : `${field}Frames`;
      const msKey = field === 'fadeDuration' ? 'fadeDurationMs' : `${field}Ms`;
      const frames = Number(phaseValue[frameKey]);
      if (Number.isFinite(frames)) return Math.max(0, Math.round(frames));
      return msToFrames(phaseValue[msKey]);
    }

    function framesToMs(frames) {
      return Math.max(0, Math.round((Math.max(0, Number(frames) || 0) / currentFps()) * 1000));
    }

    function msToFrames(ms) {
      return Math.max(0, Math.round((Math.max(0, Number(ms) || 0) / 1000) * currentFps()));
    }

    function currentFps() {
      return Math.max(1, Math.round(typeof options.currentMovieFps === 'function' ? Number(options.currentMovieFps()) || 25 : 25));
    }

    function updateProperty(subject, animation, key, fields, updateAnimation, meta = {}) {
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
        const defaultValue = defaultValueForProperty(subject, key, meta);
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
      if (String(key || '').endsWith('.letter_spacing')) return 0.1;
      return 1;
    }

    function defaultValueForProperty(subject, key, meta = {}) {
      if (meta && meta.animationDefaultValue !== undefined) return meta.animationDefaultValue;
      if (subject && subject.cartela && subject.cartela[key] !== undefined) return subject.cartela[key];
      if (subject && subject[key] !== undefined) return subject[key];
      if (key === 'opacity') return 0;
      if (key === 'scale') return 1;
      if (key === 'line_spacing') return 1.12;
      return 0;
    }

    function canAnimateProperty(key) {
      return (options.animatableStyleProperties || []).includes(key);
    }

    return {
      cartelaAnimationRowMeta,
      renderCartelaAnimationControls,
      renderStyleAnimationControls,
      styleAnimationRowMeta,
    };
  }

  root.CreditosAppStyleAnimationEditor = {
    createAppStyleAnimationEditor,
  };
})(globalThis);
