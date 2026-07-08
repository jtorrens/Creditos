(function (root) {
  function createStyleAnimationDomain(dependencies = {}) {
    const {
      normalizeBoolean = (value, fallback) => value === undefined ? fallback : Boolean(value),
    } = dependencies;

    const transitionModes = ['together', 'cascade', 'relativeCascade'];
    const transitionDirections = ['topToBottom', 'bottomToTop', 'leftToRight', 'rightToLeft'];
    const transitionEasings = ['linear', 'easeIn', 'easeOut', 'easeInOut', 'emphasized'];
    const fadeModes = ['fullFrame', 'cascade'];
    const fadeBounds = ['screen', 'visibleFrame'];
    const animatableProperties = [
      'line_spacing',
      'column_gap',
      'role_name_gap',
      'source_group_gap',
      'block_gap',
      'block_title_gap',
      'vertical_offset',
      'page_top_margin',
      'page_bottom_margin',
      'page_left_margin',
      'page_right_margin',
      'opacity',
      'scale',
      'translate_x',
      'translate_y',
      'typography.block_title.font_size',
      'typography.block_title.letter_spacing',
      'typography.role.font_size',
      'typography.role.letter_spacing',
      'typography.name.font_size',
      'typography.name.letter_spacing',
    ];

    const defaultStyleAnimation = Object.freeze({
      enabled: false,
      in: Object.freeze({
        durationMs: 600,
        delayMs: 0,
        easing: 'easeOut',
        mode: 'cascade',
        direction: 'topToBottom',
        featherPx: 80,
        fadeDurationMs: 0,
        fadeMode: 'fullFrame',
        fadeDirection: 'topToBottom',
        fadeBounds: 'screen',
      }),
      out: Object.freeze({
        durationMs: 500,
        delayMs: 0,
        easing: 'easeIn',
        mode: 'cascade',
        direction: 'topToBottom',
        featherPx: 80,
        fadeDurationMs: 0,
        fadeMode: 'fullFrame',
        fadeDirection: 'topToBottom',
        fadeBounds: 'screen',
      }),
      properties: Object.freeze({}),
    });

    function normalizeStyleAnimation(value = {}) {
      const input = value && typeof value === 'object' ? value : {};
      const properties = normalizeAnimatedProperties(input.properties || {});
      const inputPhase = normalizeAnimationPhase(input.in, defaultStyleAnimation.in);
      const outputPhase = normalizeAnimationPhase(input.out, defaultStyleAnimation.out);
      return {
        enabled: normalizeBoolean(input.enabled, Object.keys(properties).length > 0 || phaseHasFade(inputPhase) || phaseHasFade(outputPhase)),
        in: inputPhase,
        out: outputPhase,
        properties,
      };
    }

    function serializeStyleAnimation(value = {}) {
      const animation = normalizeStyleAnimation(value);
      if (!hasStyleAnimation(animation)) return undefined;
      return animation;
    }

    function mergeStyleAnimation(base = {}, override = {}) {
      const normalizedBase = normalizeStyleAnimation(base || {});
      const input = override && typeof override === 'object' ? override : {};
      if (!Object.keys(input).length) return normalizedBase;
      return {
        enabled: Object.prototype.hasOwnProperty.call(input, 'enabled')
          ? normalizeBoolean(input.enabled, normalizedBase.enabled)
          : normalizedBase.enabled,
        in: input.in
          ? normalizeAnimationPhase({ ...normalizedBase.in, ...input.in }, normalizedBase.in)
          : normalizedBase.in,
        out: input.out
          ? normalizeAnimationPhase({ ...normalizedBase.out, ...input.out }, normalizedBase.out)
          : normalizedBase.out,
        properties: input.properties
          ? normalizeAnimatedProperties({
            ...(normalizedBase.properties || {}),
            ...(input.properties || {}),
          })
          : normalizedBase.properties,
      };
    }

    function hasStyleAnimation(value) {
      if (!value || typeof value !== 'object') return false;
      const properties = value.properties && typeof value.properties === 'object' ? value.properties : {};
      return !!value.enabled
        || Object.keys(properties).length > 0
        || !!(value.in && (value.in.fade || phaseHasFade(value.in)))
        || !!(value.out && (value.out.fade || phaseHasFade(value.out)));
    }

    function phaseHasFade(phase = {}) {
      return Number(phase.fadeDurationFrames) > 0 || Number(phase.fadeDurationMs) > 0;
    }

    function normalizeAnimationPhase(value = {}, defaults = defaultStyleAnimation.in) {
      const input = value && typeof value === 'object' ? value : {};
      return {
        durationMs: normalizeMs(input.durationMs, defaults.durationMs),
        delayMs: normalizeMs(input.delayMs, defaults.delayMs),
        durationFrames: normalizeOptionalFrames(input.durationFrames, defaults.durationFrames),
        delayFrames: normalizeOptionalFrames(input.delayFrames, defaults.delayFrames),
        easing: normalizeEasing(input.easing, defaults.easing),
        mode: transitionModes.includes(input.mode) ? input.mode : defaults.mode,
        direction: transitionDirections.includes(input.direction) ? input.direction : defaults.direction,
        featherPx: Math.max(0, Number(input.featherPx !== undefined ? input.featherPx : defaults.featherPx) || 0),
        fadeDurationMs: normalizeFadeDurationMs(input, defaults),
        fadeDurationFrames: normalizeOptionalFrames(input.fadeDurationFrames, defaults.fadeDurationFrames),
        fadeMode: normalizeFadeMode(input.fadeMode, input, defaults),
        fadeDirection: normalizeFadeDirection(input.fadeDirection, input, defaults),
        fadeBounds: normalizeFadeBounds(input.fadeBounds, defaults),
      };
    }

    function normalizeFadeDurationMs(input, defaults) {
      if (input.fadeDurationMs !== undefined) return normalizeMs(input.fadeDurationMs, defaults.fadeDurationMs || 0);
      if (input.fadeMs !== undefined) return normalizeMs(input.fadeMs, defaults.fadeDurationMs || 0);
      if (input.fade !== undefined) return normalizeBoolean(input.fade, false) ? normalizeMs(input.durationMs, defaults.durationMs) : 0;
      return normalizeMs(defaults.fadeDurationMs, 0);
    }

    function normalizeFadeMode(value, input = {}, defaults = {}) {
      if (value === 'cascadeUp' || value === 'cascadeDown') return 'cascade';
      if (fadeModes.includes(value)) return value;
      if (input.fade !== undefined && input.mode === 'cascade') {
        return 'cascade';
      }
      if (fadeModes.includes(defaults.fadeMode)) return defaults.fadeMode;
      return 'fullFrame';
    }

    function normalizeFadeDirection(value, input = {}, defaults = {}) {
      if (transitionDirections.includes(value)) return value;
      if (input.fadeMode === 'cascadeUp') return 'bottomToTop';
      if (input.fadeMode === 'cascadeDown') return 'topToBottom';
      if (input.fade !== undefined && input.mode === 'cascade' && transitionDirections.includes(input.direction)) return input.direction;
      if (transitionDirections.includes(defaults.fadeDirection)) return defaults.fadeDirection;
      return 'topToBottom';
    }

    function normalizeFadeBounds(value, defaults = {}) {
      if (fadeBounds.includes(value)) return value;
      if (fadeBounds.includes(defaults.fadeBounds)) return defaults.fadeBounds;
      return 'screen';
    }

    function normalizeAnimatedProperties(properties = {}) {
      const output = {};
      animatableProperties.forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(properties, key)) return;
        const normalized = normalizeAnimatedProperty(key, properties[key]);
        if (normalized) output[key] = normalized;
      });
      return output;
    }

    function normalizeAnimatedProperty(key, value = {}) {
      const input = value && typeof value === 'object' ? value : {};
      const hasIn = Object.prototype.hasOwnProperty.call(input, 'inValue');
      const hasOut = Object.prototype.hasOwnProperty.call(input, 'outValue');
      const animate = normalizeBoolean(input.animate, hasIn || hasOut);
      if (!animate && !hasIn && !hasOut) return null;

      const output = { animate };
      if (hasIn) output.inValue = normalizeAnimatedPropertyValue(key, input.inValue);
      if (hasOut) output.outValue = normalizeAnimatedPropertyValue(key, input.outValue);
      return output;
    }

    function normalizeAnimatedPropertyValue(key, value) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return defaultAnimatedPropertyValue(key);
      if (key === 'opacity') return Math.max(0, Math.min(1, numeric));
      if (key === 'scale') return Math.max(0, numeric);
      if (key === 'line_spacing') return Math.max(0.1, numeric);
      if (key.endsWith('.font_size')) return Math.max(1, numeric);
      if (key.endsWith('.letter_spacing')) return numeric;
      if (key.endsWith('_gap') || key.endsWith('_margin')) return Math.max(0, numeric);
      return numeric;
    }

    function defaultAnimatedPropertyValue(key) {
      if (key === 'opacity') return 0;
      if (key === 'scale') return 1;
      if (key === 'line_spacing') return 1.12;
      if (key.endsWith('.font_size')) return 1;
      if (key.endsWith('.letter_spacing')) return 0;
      return 0;
    }

    function normalizeMs(value, fallback) {
      const number = Number(value !== undefined ? value : fallback);
      if (!Number.isFinite(number)) return Math.max(0, Number(fallback) || 0);
      return Math.max(0, Math.round(number));
    }

    function normalizeOptionalFrames(value, fallback) {
      if (value === undefined && fallback === undefined) return undefined;
      const number = Number(value !== undefined ? value : fallback);
      if (!Number.isFinite(number)) return undefined;
      return Math.max(0, Math.round(number));
    }

    function normalizeEasing(value, fallback) {
      const easing = String(value || '').trim();
      const legacyMap = {
        linear: 'linear',
        'cubic-bezier(0.4, 0, 1, 1)': 'easeIn',
        'cubic-bezier(0, 0, 0.2, 1)': 'easeOut',
        'cubic-bezier(0.4, 0, 0.2, 1)': 'easeInOut',
        'cubic-bezier(0.2, 0, 0, 1)': 'emphasized',
      };
      const normalized = legacyMap[easing] || easing;
      return transitionEasings.includes(normalized) ? normalized : fallback;
    }

    return {
      animatableProperties,
      defaultStyleAnimation,
      hasStyleAnimation,
      mergeStyleAnimation,
      normalizeAnimationPhase,
      normalizeAnimatedProperties,
      normalizeStyleAnimation,
      serializeStyleAnimation,
      fadeBounds,
      fadeModes,
      transitionDirections,
      transitionEasings,
      transitionModes,
    };
  }

  root.CreditosDomainStyleAnimation = {
    createStyleAnimationDomain,
  };
})(globalThis);
