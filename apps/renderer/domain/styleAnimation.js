(function (root) {
  function createStyleAnimationDomain(dependencies = {}) {
    const {
      normalizeBoolean = (value, fallback) => value === undefined ? fallback : Boolean(value),
    } = dependencies;

    const transitionModes = ['together', 'cascade'];
    const transitionDirections = ['topToBottom', 'bottomToTop', 'leftToRight', 'rightToLeft'];
    const transitionEasings = ['linear', 'easeIn', 'easeOut', 'easeInOut', 'emphasized'];
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
      }),
      out: Object.freeze({
        durationMs: 500,
        delayMs: 0,
        easing: 'easeIn',
        mode: 'cascade',
        direction: 'topToBottom',
        featherPx: 80,
      }),
      properties: Object.freeze({}),
    });

    function normalizeStyleAnimation(value = {}) {
      const input = value && typeof value === 'object' ? value : {};
      const properties = normalizeAnimatedProperties(input.properties || {});
      return {
        enabled: normalizeBoolean(input.enabled, Object.keys(properties).length > 0),
        in: normalizeAnimationPhase(input.in, defaultStyleAnimation.in),
        out: normalizeAnimationPhase(input.out, defaultStyleAnimation.out),
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
      return !!value.enabled || Object.keys(properties).length > 0;
    }

    function normalizeAnimationPhase(value = {}, defaults = defaultStyleAnimation.in) {
      const input = value && typeof value === 'object' ? value : {};
      return {
        durationMs: normalizeMs(input.durationMs, defaults.durationMs),
        delayMs: normalizeMs(input.delayMs, defaults.delayMs),
        easing: normalizeEasing(input.easing, defaults.easing),
        mode: transitionModes.includes(input.mode) ? input.mode : defaults.mode,
        direction: transitionDirections.includes(input.direction) ? input.direction : defaults.direction,
        featherPx: Math.max(0, Number(input.featherPx !== undefined ? input.featherPx : defaults.featherPx) || 0),
      };
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
      if (key.endsWith('_gap') || key.endsWith('_margin')) return Math.max(0, numeric);
      return numeric;
    }

    function defaultAnimatedPropertyValue(key) {
      if (key === 'opacity') return 0;
      if (key === 'scale') return 1;
      if (key === 'line_spacing') return 1.12;
      return 0;
    }

    function normalizeMs(value, fallback) {
      const number = Number(value !== undefined ? value : fallback);
      if (!Number.isFinite(number)) return Math.max(0, Number(fallback) || 0);
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
      transitionDirections,
      transitionEasings,
      transitionModes,
    };
  }

  root.CreditosDomainStyleAnimation = {
    createStyleAnimationDomain,
  };
})(globalThis);
