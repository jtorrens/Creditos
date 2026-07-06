(function (root) {
  function createDomPreview(dependencies = {}) {
    const {
      applyTypography = () => {},
      cartelaImages = () => [],
      contentAreaRect = () => ({ x: 0, y: 0, width: 0, height: 0 }),
      documentRef = root.document,
      normalizeBoolean = (value, fallback) => value === undefined ? fallback : Boolean(value),
      roleNameGapForOrientation = (layout) => layout.role_name_gap,
      transformCartelaText = (text) => text,
    } = dependencies;

    function makeMarginOverlay(layout, zoom = 1) {
      const overlay = documentRef.createElement('div');
      overlay.className = 'margin-overlay';
      const area = contentAreaRect(layout);
      const guides = [
        ['vertical', layout.page_left_margin * zoom, false],
        ['vertical', (layout.page_width - layout.page_right_margin) * zoom, false],
        ['horizontal', layout.page_top_margin * zoom, false],
        ['horizontal', (layout.page_height - layout.page_bottom_margin) * zoom, false],
        ['vertical', (area.x + (area.width / 2)) * zoom, true],
        ['horizontal', (area.y + (area.height / 2)) * zoom, true],
      ];

      guides.forEach(([direction, position, center]) => {
        const guide = documentRef.createElement('div');
        guide.className = `margin-guide ${direction}${center ? ' center' : ''}`;
        if (direction === 'vertical') guide.style.left = `${position}px`;
        else guide.style.top = `${position}px`;
        if (center && direction === 'vertical') {
          guide.style.top = `${area.y * zoom}px`;
          guide.style.height = `${area.height * zoom}px`;
        } else if (center) {
          guide.style.left = `${area.x * zoom}px`;
          guide.style.width = `${area.width * zoom}px`;
        }
        overlay.appendChild(guide);
      });

      return overlay;
    }

    function makePdfCartelaImages(cartela, layout) {
      const area = contentAreaRect(layout);
      return cartelaImages(cartela).map((image) => {
        const imageEl = documentRef.createElement('img');
        imageEl.className = 'pdf-cartela-image';
        imageEl.alt = '';
        imageEl.src = image.data_url;
        imageEl.style.left = `${area.x + (area.width / 2) + (Number(image.offset_x) || 0)}px`;
        imageEl.style.top = `${area.y + (area.height / 2) + (Number(image.offset_y) || 0)}px`;
        imageEl.style.transform = `translate(-50%, -50%) scale(${Math.max(0.01, Number(image.scale) || 1)})`;
        return imageEl;
      });
    }

    function makePdfPageTitle(page, options = {}) {
      const title = page && page.cartela_physical_index === 0 ? page.title : '';
      const text = String(title || '').trim();
      if (!text) return null;
      const titleEl = documentRef.createElement('div');
      titleEl.className = 'pdf-page-title';
      titleEl.textContent = transformCartelaText(text, page.cartela, options.settings);
      applyTypography(titleEl, 'page_header', {
        multiplier: page.cartela.font_size_multiplier,
        lineMultiplier: page.cartela.line_spacing_multiplier,
        typography: page.cartela.title_typography,
        settings: options.settings,
      });
      return titleEl;
    }

    function applyTextWrapStyle(element, cartela) {
      const autoWrap = normalizeBoolean(cartela && cartela.auto_text_wrap, false);
      element.style.whiteSpace = autoWrap ? 'pre-wrap' : 'pre';
      element.style.overflowWrap = autoWrap ? 'break-word' : 'normal';
    }

    function makePdfText(text, styleKey, options) {
      const el = documentRef.createElement('div');
      el.className = options.className;
      el.textContent = options.textAlreadyTransformed
        ? String(text || '')
        : transformCartelaText(text, options.cartela, options.settings);
      applyTextWrapStyle(el, options.cartela);
      if (options.textAlreadyTransformed) {
        el.style.whiteSpace = 'pre';
        el.style.overflowWrap = 'normal';
      }
      el.style.textAlign = options.textAlign;
      applyTypography(el, styleKey, {
        multiplier: options.cartela.font_size_multiplier,
        lineMultiplier: options.cartela.line_spacing_multiplier,
        typography: options.typography,
        settings: options.settings,
      });
      return el;
    }

    function makePdfOptionalTitle(value, className, styleKey, cartela, typography, options = {}) {
      const text = String(value || '').trim();
      if (!text) return null;
      const title = documentRef.createElement('div');
      title.className = className;
      title.textContent = transformCartelaText(text, cartela, options.settings);
      applyTextWrapStyle(title, cartela);
      applyTypography(title, styleKey, {
        multiplier: cartela.font_size_multiplier,
        lineMultiplier: cartela.line_spacing_multiplier,
        typography,
        settings: options.settings,
      });
      return title;
    }

    function renderPdfTheme(theme, block, cartela, layout, options = {}) {
      const themeEl = documentRef.createElement('div');
      themeEl.className = 'pdf-theme';
      if (options.gapBefore) themeEl.style.marginTop = `${options.gapBefore}px`;
      (theme.lines || []).forEach((line, index) => {
        themeEl.appendChild(makePdfText(line.value || '', index === 0 ? 'role' : 'name', {
          className: index === 0 ? 'pdf-theme-title' : 'pdf-line',
          cartela,
          typography: block.typography,
          textAlign: block.alignment && block.alignment.text ? block.alignment.text : 'center',
          settings: options.settings,
        }));
      });
      return themeEl;
    }

    function renderPdfUnit(unit, block, cartela, layout, options = {}) {
      const orientation = cartela.orientation || 'horizontal';
      const alignment = block.alignment || {};
      const unitEl = documentRef.createElement('div');
      unitEl.className = `pdf-unit ${orientation}`;
      if (options.gapBefore) unitEl.style.marginTop = `${options.gapBefore}px`;
      if (orientation === 'horizontal') {
        unitEl.style.gap = `${layout.role_name_gap}px`;
      } else {
        unitEl.style.gap = `${roleNameGapForOrientation(layout, orientation)}px`;
      }

      if (unit.kind === 'credit' || unit.kind === 'crew_credit') {
        if (!options.repeatedNameRow) {
          unitEl.appendChild(makePdfText(options.hideRole ? '' : unit.role || '', 'role', {
            className: 'pdf-role',
            cartela,
            typography: block.typography,
            textAlign: alignment.role || (orientation === 'vertical' ? 'center' : 'right'),
            settings: options.settings,
          }));
        }
        unitEl.appendChild(makePdfText(unit.name || '', 'name', {
          className: 'pdf-name',
          cartela,
          typography: block.typography,
          textAlign: alignment.name || (orientation === 'vertical' ? 'center' : 'left'),
          settings: options.settings,
        }));
        return unitEl;
      }

      if (unit.kind === 'cast') {
        unitEl.appendChild(makePdfText(unit.actor || '', 'role', {
          className: 'pdf-role',
          cartela,
          typography: block.typography,
          textAlign: alignment.role || (orientation === 'vertical' ? 'center' : 'right'),
          settings: options.settings,
        }));
        unitEl.appendChild(makePdfText(unit.character || '', 'name', {
          className: 'pdf-name',
          cartela,
          typography: block.typography,
          textAlign: alignment.name || (orientation === 'vertical' ? 'center' : 'left'),
          settings: options.settings,
        }));
        return unitEl;
      }

      return makePdfText(unit.title || unit.value || '', unit.title !== undefined ? 'block_title' : 'name', {
        className: 'pdf-line',
        cartela,
        typography: block.typography,
        textAlign: alignment.text || (orientation === 'vertical' ? 'center' : 'left'),
        settings: options.settings,
        textAlreadyTransformed: !!unit.text_already_transformed,
      });
    }

    return {
      applyTextWrapStyle,
      makeMarginOverlay,
      makePdfCartelaImages,
      makePdfOptionalTitle,
      makePdfPageTitle,
      makePdfText,
      renderPdfTheme,
      renderPdfUnit,
    };
  }

  root.CreditosPreviewDom = {
    createDomPreview,
  };
})(globalThis);
