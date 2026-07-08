(function (root) {
  function createStyleAnimationFrameDomain(dependencies = {}) {
    const {
      normalizeStyleAnimation = (value) => value || {},
    } = dependencies;

    const numericCartelaProperties = new Set([
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
    ]);
    const typographyFields = new Set(['font_size', 'letter_spacing']);

    function cartelaWithResolvedRowAnimation(cartela, frameState = {}, rowState = {}) {
      if (!cartela) return cartela;
      const animation = normalizeStyleAnimation(cartela.animation || {});
      if (!animation.enabled) return cartela;
      const localFrame = Math.max(0, Math.round(Number(frameState.localFrame) || 0));
      const frameCount = Math.max(1, Math.round(Number(frameState.frameCount) || 1));
      const fps = Math.max(1, Math.round(Number(frameState.fps) || 25));
      const phase = animationPhase(animation, localFrame, frameCount, fps, rowState);
      if (!phase) return cartela;
      const properties = animation.properties || {};
      let changed = false;
      const output = { ...cartela };
      Object.keys(properties).forEach((key) => {
        if (!numericCartelaProperties.has(key)) return;
        const property = properties[key];
        if (!property || !property.animate) return;
        const stable = Number(cartela[key]);
        if (!Number.isFinite(stable)) return;
        const edgeValue = Number(phase.name === 'in' ? property.inValue : property.outValue);
        if (!Number.isFinite(edgeValue)) return;
        const nextValue = phase.name === 'in'
          ? interpolate(edgeValue, stable, phase.progress)
          : interpolate(stable, edgeValue, phase.progress);
        output[key] = normalizeCartelaPropertyValue(key, nextValue);
        changed = true;
      });
      return changed ? output : cartela;
    }

    function typographyWithResolvedRowAnimation(cartela, typography = {}, frameState = {}, rowState = {}) {
      if (!cartela || !typography) return typography;
      const animation = normalizeStyleAnimation(cartela.animation || {});
      if (!animation.enabled) return typography;
      const localFrame = Math.max(0, Math.round(Number(frameState.localFrame) || 0));
      const frameCount = Math.max(1, Math.round(Number(frameState.frameCount) || 1));
      const fps = Math.max(1, Math.round(Number(frameState.fps) || 25));
      const phase = animationPhase(animation, localFrame, frameCount, fps, rowState);
      if (!phase) return typography;

      const properties = animation.properties || {};
      let changed = false;
      const output = { ...typography };
      Object.keys(properties).forEach((key) => {
        const typographyKey = parseTypographyPropertyKey(key);
        if (!typographyKey) return;
        const property = properties[key];
        if (!property || !property.animate) return;
        const stable = Number(typography[typographyKey.styleKey] && typography[typographyKey.styleKey][typographyKey.field]);
        if (!Number.isFinite(stable)) return;
        const edgeValue = Number(phase.name === 'in' ? property.inValue : property.outValue);
        if (!Number.isFinite(edgeValue)) return;
        const nextValue = phase.name === 'in'
          ? interpolate(edgeValue, stable, phase.progress)
          : interpolate(stable, edgeValue, phase.progress);
        output[typographyKey.styleKey] = {
          ...(output[typographyKey.styleKey] || {}),
          [typographyKey.field]: normalizeTypographyPropertyValue(typographyKey.field, nextValue),
        };
        changed = true;
      });
      return changed ? output : typography;
    }

    function animationPhase(animation, localFrame, frameCount, fps, rowState = {}) {
      const out = phaseFrameInfo(animation.out, fps);
      const outRow = rowPhaseWindow(animation.out, out, frameCount, rowState);
      if (localFrame >= outRow.startFrame && localFrame < outRow.endFrame) {
        return {
          name: 'out',
          progress: phaseProgress(localFrame, outRow, animation.out && animation.out.easing),
        };
      }
      if (localFrame >= outRow.endFrame) {
        return {
          name: 'out',
          progress: 1,
        };
      }

      const input = phaseFrameInfo(animation.in, fps);
      const inRow = rowPhaseWindow(animation.in, input, frameCount, rowState, true);
      if (localFrame < inRow.startFrame && input.durationFrames > 0) {
        return { name: 'in', progress: 0 };
      }
      if (localFrame >= inRow.startFrame && localFrame < inRow.endFrame) {
        return {
          name: 'in',
          progress: phaseProgress(localFrame, inRow, animation.in && animation.in.easing),
        };
      }
      return null;
    }

    function rowPhaseWindow(phase = {}, info, frameCount, rowState = {}, isIn = false) {
      const rowCount = Math.max(1, Math.round(Number(rowState.rowCount) || 1));
      const orderedIndex = orderedRowIndex(rowState.rowIndex, rowCount, phase.direction);
      const mode = phase.mode || 'together';
      const durationFrames = mode === 'cascade'
        ? Math.max(0.0001, info.durationFrames / rowCount)
        : Math.max(1, info.durationFrames);
      const offset = mode === 'cascade' ? orderedIndex * durationFrames : 0;
      const baseStart = isIn
        ? info.delayFrames
        : Math.max(0, frameCount - info.delayFrames - info.durationFrames);
      const startFrame = baseStart + offset;
      return {
        durationFrames,
        startFrame,
        endFrame: Math.min(frameCount, startFrame + durationFrames),
      };
    }

    function phaseProgress(localFrame, window, easing) {
      const duration = Math.max(0.0001, Number(window && window.durationFrames) || 1);
      const denominator = Math.max(0.0001, duration - 1);
      return easeProgress((localFrame - window.startFrame) / denominator, easing);
    }

    function orderedRowIndex(rowIndex, rowCount, direction) {
      const index = Math.max(0, Math.min(rowCount - 1, Math.round(Number(rowIndex) || 0)));
      if (direction === 'bottomToTop' || direction === 'rightToLeft') return rowCount - 1 - index;
      return index;
    }

    function phaseFrameInfo(phase = {}, fps) {
      return {
        delayFrames: msToFrames(phase.delayMs, fps),
        durationFrames: Math.max(1, msToFrames(phase.durationMs, fps)),
      };
    }

    function msToFrames(ms, fps) {
      return Math.max(0, Math.round((Math.max(0, Number(ms) || 0) / 1000) * fps));
    }

    function easeProgress(progress, easing) {
      const t = Math.max(0, Math.min(1, Number(progress) || 0));
      if (easing === 'easeIn') return t * t * t;
      if (easing === 'easeOut') return 1 - ((1 - t) * (1 - t) * (1 - t));
      if (easing === 'easeInOut') return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      if (easing === 'emphasized') return 1 - Math.pow(1 - t, 4);
      return t;
    }

    function interpolate(from, to, progress) {
      return from + ((to - from) * Math.max(0, Math.min(1, Number(progress) || 0)));
    }

    function normalizeCartelaPropertyValue(key, value) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return 0;
      if (key === 'line_spacing') return Math.max(0.1, numeric);
      if (key.endsWith('_gap') || key.endsWith('_margin')) return Math.max(0, numeric);
      return numeric;
    }

    function parseTypographyPropertyKey(key) {
      const match = String(key || '').match(/^typography\.(block_title|role|name)\.(font_size|letter_spacing)$/);
      if (!match || !typographyFields.has(match[2])) return null;
      return {
        field: match[2],
        styleKey: match[1],
      };
    }

    function normalizeTypographyPropertyValue(field, value) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return field === 'font_size' ? 1 : 0;
      if (field === 'font_size') return Math.max(1, numeric);
      return numeric;
    }

    return {
      cartelaWithResolvedRowAnimation,
      typographyWithResolvedRowAnimation,
    };
  }

  root.CreditosDomainStyleAnimationFrame = {
    createStyleAnimationFrameDomain,
  };
})(globalThis);
