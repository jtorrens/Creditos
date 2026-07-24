(function (root) {
  function createAppVisualPreview(options = {}) {
    const documentRef = options.documentRef || root.document;
    const els = options.els;
    const state = options.state;
    const visualColumnSplits = new Map();

    function makeVisualStaticText(value, className, styleKey, renderOptions = {}) {
      const text = String(value || '').trim();
      if (!text) return null;
      const element = documentRef.createElement('div');
      element.className = `visual-static ${className}`;
      element.textContent = options.transformCartelaText(
        text,
        renderOptions.cartela,
        renderOptions.settings || options.getProductionSettings(),
        styleKey,
        renderOptions.typography
      );
      options.applyTypography(element, styleKey, renderOptions);
      options.applyTextWrapStyle(element, renderOptions.cartela);
      if (renderOptions.textAlign) element.style.textAlign = renderOptions.textAlign;
      return element;
    }

    function renderVisualPreview() {
      if (!state.render) {
        els.visualPreview.className = 'visual-preview empty-state';
        els.visualPreview.textContent = 'Asocia un archivo de créditos para ver el Preview.';
        return;
      }

      els.visualPreview.className = 'visual-preview';
      els.visualPreview.innerHTML = '';
      (state.render.cartelas || []).forEach((cartela) => {
        const layout = options.getRenderLayout();
        const cartelaEl = documentRef.createElement('section');
        cartelaEl.className = 'render-cartela';

        const headerEl = documentRef.createElement('div');
        headerEl.className = 'render-cartela-header';
        const labelEl = documentRef.createElement('strong');
        labelEl.textContent = cartela.label || cartela.id;
        headerEl.appendChild(labelEl);
        const metaEl = documentRef.createElement('span');
        metaEl.textContent = `${cartela.orientation || 'horizontal'} · ${cartela.columns || 1} col · ${cartela.duration || 0}s`;
        headerEl.appendChild(metaEl);
        cartelaEl.appendChild(headerEl);

        (cartela.pages || []).forEach((cartelaPage) => {
          const pageEl = documentRef.createElement('div');
          pageEl.className = 'render-page';
          const pageLabelEl = documentRef.createElement('div');
          pageLabelEl.className = 'render-page-label';
          pageLabelEl.appendChild(options.makeVisualInput(cartelaPage.id, 'title', cartelaPage.title || '', 'render-page-title-input', {
            autoWrap: cartela.auto_text_wrap,
            styleKey: 'page_header',
            multiplier: cartela.font_size_multiplier,
            lineMultiplier: cartela.line_spacing_multiplier,
            typography: cartela.title_typography,
          }));
          pageEl.appendChild(pageLabelEl);

          (cartelaPage.blocks || []).forEach((block) => {
            pageEl.appendChild(renderVisualBlock(block, cartela, layout));
          });

          cartelaEl.appendChild(pageEl);
        });

        els.visualPreview.appendChild(cartelaEl);
      });
    }

    function renderVisualBlock(block, cartela, layout) {
      const blockEl = documentRef.createElement('div');
      blockEl.className = 'render-block';
      if (block.missing_source) {
        blockEl.textContent = `Fuente no encontrada: ${block.missing_source}`;
        return blockEl;
      }

      const repeatBlockTitles = options.repeatBlockTitlesForCartela(cartela);
      (block.pages || []).forEach((blockPage, index) => {
        const blockPageEl = documentRef.createElement('div');
        blockPageEl.className = 'render-block-page';
        const displayBlock = options.blockForTitleRepeat(block, repeatBlockTitles, index);

        const blockTitle = makeVisualStaticText(displayBlock.title, 'render-block-title-input', 'block_title', {
          multiplier: cartela.font_size_multiplier,
          lineMultiplier: cartela.line_spacing_multiplier,
          typography: block.typography,
          textAlign: 'center',
          cartela,
        });

        const contentEl = documentRef.createElement('div');
        contentEl.className = 'render-block-content';
        contentEl.style.gridTemplateColumns = `repeat(${Math.max(1, Number(block.columns) || 1)}, minmax(0, 1fr))`;
        contentEl.style.columnGap = `${layout.column_gap}px`;
        contentEl.style.rowGap = '0';

        const units = blockPage.items || [];
        let columnSplitControl = null;
        if (
          cartela.orientation === 'horizontal'
          && units.some((unit) => ['credit', 'crew_credit', 'cast'].includes(unit.kind))
        ) {
          const splitKey = `${cartela.id}:${block.id}:${blockPage.id}`;
          const split = visualColumnSplits.get(splitKey) || 45;
          contentEl.style.setProperty('--visual-role-column-width', `${split}%`);
          columnSplitControl = makeColumnSplitControl(contentEl, splitKey, split);
        }
        if (blockTitle) {
          if (units.length) blockTitle.style.marginBottom = `${options.cartelaBlockTitleGap(cartela, layout)}px`;
          blockPageEl.appendChild(blockTitle);
        }
        if (columnSplitControl) blockPageEl.appendChild(columnSplitControl);
        let previousCreditSourceId = null;
        units.forEach((unit, index) => {
          const unitOptions = options.unitRenderOptions(unit, previousCreditSourceId, cartela, index > 0, units[index - 1]);
          const gapBefore = options.unitGapBefore(unitOptions, layout, { unit, block, cartela });
          if (block.type === 'music_licenses' && unit.lines) {
            const themeEl = documentRef.createElement('div');
            themeEl.className = 'render-theme';
            if (gapBefore) themeEl.style.marginTop = `${gapBefore}px`;
            unit.lines.forEach((line, lineIndex) => {
              themeEl.appendChild(options.makeVisualInput(line.id, 'value', line.value || '', lineIndex === 0 ? 'render-theme-title-input' : 'render-line-input', {
                autoWrap: cartela.auto_text_wrap,
                styleKey: lineIndex === 0 ? 'role' : 'name',
                multiplier: cartela.font_size_multiplier,
                lineMultiplier: cartela.line_spacing_multiplier,
                typography: block.typography,
                textAlign: block.alignment && block.alignment.text ? block.alignment.text : 'center',
              }));
            });
            contentEl.appendChild(themeEl);
          } else {
            contentEl.appendChild(renderVisualUnit(unit, cartela, block.alignment || {}, layout, {
              ...unitOptions,
              gapBefore,
              typography: block.typography,
            }));
            previousCreditSourceId = options.creditSourceId(unit);
          }
        });
        blockPageEl.appendChild(contentEl);
        blockEl.appendChild(blockPageEl);
      });
      return blockEl;
    }

    function makeColumnSplitControl(contentEl, splitKey, value) {
      const control = documentRef.createElement('label');
      control.className = 'render-column-split-control';
      control.title = 'Repartir el ancho de edición entre cargo y nombre';
      const roleLabel = documentRef.createElement('span');
      roleLabel.textContent = 'Cargo';
      const slider = documentRef.createElement('input');
      slider.type = 'range';
      slider.min = '20';
      slider.max = '80';
      slider.step = '1';
      slider.value = String(value);
      slider.setAttribute('aria-label', 'Ancho de la columna de cargo');
      slider.addEventListener('input', () => {
        const split = Math.max(20, Math.min(80, Number(slider.value) || 45));
        visualColumnSplits.set(splitKey, split);
        contentEl.style.setProperty('--visual-role-column-width', `${split}%`);
      });
      const nameLabel = documentRef.createElement('span');
      nameLabel.textContent = 'Nombre';
      control.append(roleLabel, slider, nameLabel);
      return control;
    }

    function renderVisualUnit(unit, cartela, alignment, layout, renderOptions = {}) {
      const orientation = cartela.orientation || 'horizontal';
      const unitEl = documentRef.createElement('div');
      unitEl.className = `render-unit ${orientation}`;
      if (renderOptions.gapBefore) unitEl.style.marginTop = `${renderOptions.gapBefore}px`;
      if (orientation === 'horizontal') {
        unitEl.style.gap = `${layout.role_name_gap}px`;
      } else {
        unitEl.style.gap = `${options.roleNameGapForOrientation(layout, orientation)}px`;
      }
      if (unit.kind === 'credit' || unit.kind === 'crew_credit') {
        if (renderOptions.repeatedNameRow) {
          // Continuacion del mismo cargo: solo se pinta el nombre.
        } else if (renderOptions.hideRole) {
          const roleEl = documentRef.createElement('div');
          roleEl.className = 'render-role repeated-role';
          unitEl.appendChild(roleEl);
        } else {
          unitEl.appendChild(options.makeVisualInput(unit.source_item_id || unit.id, 'role', unit.role || '', 'render-role-input', {
            autoWrap: cartela.auto_text_wrap,
            styleKey: 'role',
            multiplier: cartela.font_size_multiplier,
            lineMultiplier: cartela.line_spacing_multiplier,
            typography: renderOptions.typography,
            textAlign: alignment.role || (orientation === 'vertical' ? 'center' : 'right'),
          }));
        }
        unitEl.appendChild(options.makeVisualInput(unit.source_name_id || unit.id, 'name', unit.name || '', 'render-name-input', {
          autoWrap: cartela.auto_text_wrap,
          styleKey: 'name',
          multiplier: cartela.font_size_multiplier,
          lineMultiplier: cartela.line_spacing_multiplier,
          typography: renderOptions.typography,
          textAlign: alignment.name || (orientation === 'vertical' ? 'center' : 'left'),
        }));
        return unitEl;
      }
      if (unit.kind === 'cast') {
        unitEl.appendChild(options.makeVisualInput(unit.id, 'actor', unit.actor || '', 'render-role-input', {
          autoWrap: cartela.auto_text_wrap,
          styleKey: 'role',
          multiplier: cartela.font_size_multiplier,
          lineMultiplier: cartela.line_spacing_multiplier,
          typography: renderOptions.typography,
          textAlign: alignment.role || (orientation === 'vertical' ? 'center' : 'right'),
        }));
        unitEl.appendChild(options.makeVisualInput(unit.id, 'character', unit.character || '', 'render-name-input', {
          autoWrap: cartela.auto_text_wrap,
          styleKey: 'name',
          multiplier: cartela.font_size_multiplier,
          lineMultiplier: cartela.line_spacing_multiplier,
          typography: renderOptions.typography,
          textAlign: alignment.name || (orientation === 'vertical' ? 'center' : 'left'),
        }));
        return unitEl;
      }
      const value = unit.title || unit.value || '';
      unitEl.appendChild(options.makeVisualInput(unit.id, unit.title !== undefined ? 'title' : 'value', value, 'render-line-input', {
        autoWrap: cartela.auto_text_wrap,
        styleKey: unit.title !== undefined ? 'block_title' : 'name',
        multiplier: cartela.font_size_multiplier,
        lineMultiplier: cartela.line_spacing_multiplier,
        typography: renderOptions.typography,
        textAlign: alignment.text || (orientation === 'vertical' ? 'center' : 'left'),
      }));
      return unitEl;
    }

    return {
      renderVisualPreview,
    };
  }

  root.CreditosAppVisualPreview = {
    createAppVisualPreview,
  };
})(globalThis);
