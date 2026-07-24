(function (root) {
  function createAppMaterialEditor(options = {}) {
    const documentRef = options.documentRef || root.document;
    const state = options.state;
    const MIN_ROW_COLUMN_PERCENT = 6;
    const MAX_ROW_COLUMN_PERCENT = 25;
    const MIN_ROLE_COLUMN_PERCENT = 15;
    const MIN_NAME_COLUMN_PERCENT = 15;

    function renderMaterialEditor(material, ref) {
      const wrap = documentRef.createElement('div');
      wrap.className = 'material-panel';

      if (!material) {
        wrap.innerHTML = `<div class="material-header"><strong>Fuente no encontrada</strong><span>${options.escapeHtml(ref)}</span></div>`;
        return wrap;
      }

      const header = documentRef.createElement('div');
      header.className = 'material-header';
      const isLocked = options.sourceRefIsLocked(options.getSelectedCartela(), ref);
      header.innerHTML = `
        <div>
          <strong>${options.escapeHtml(material.title || 'Sin titulo')}</strong>
          <span>${options.escapeHtml(material.type || '')} · ${(material.items || []).length} items${isLocked ? ' · bloqueado' : ''}</span>
        </div>
      `;

      const lockButton = documentRef.createElement('button');
      lockButton.type = 'button';
      lockButton.className = 'icon-button block-lock-button' + (isLocked ? ' active' : '');
      lockButton.textContent = isLocked ? '🔒' : '🔓';
      lockButton.title = isLocked ? 'Desbloquear actualización desde XLS' : 'Bloquear actualización desde XLS';
      lockButton.setAttribute('aria-label', lockButton.title);
      lockButton.addEventListener('click', () => toggleSourceRefLock(ref));

      const removeButton = documentRef.createElement('button');
      removeButton.type = 'button';
      removeButton.textContent = 'Quitar';
      removeButton.addEventListener('click', () => {
        const cartela = options.getSelectedCartela();
        if (!cartela) return;
        options.restoreMaterialAssignment(state.structure, ref);
        options.rebuild();
      });
      const actions = documentRef.createElement('div');
      actions.className = 'material-actions';
      actions.appendChild(lockButton);
      actions.appendChild(removeButton);
      header.appendChild(actions);
      wrap.appendChild(header);

      wrap.appendChild(options.inputRow('Título del bloque', material.id, 'title', material.default_title || ''));

      if (material.type === 'music_licenses') {
        wrap.appendChild(renderMusicThemesEditor(material));
        return wrap;
      }

      const breakUnits = options.getMaterialContentItems(material);
      if (
        breakUnits.some((item) => ['credit', 'crew_credit', 'cast'].includes(item.kind))
      ) {
        const widths = normalizeEditorColumnWidths(
          state.structure.editor_column_widths && state.structure.editor_column_widths[ref]
        );
        applyEditorColumnWidths(wrap, widths);
        wrap.appendChild(makeMaterialTableHeader(wrap, ref, widths));
      }
      breakUnits.forEach((item, index) => {
        const isLastItem = index === breakUnits.length - 1;
        wrap.appendChild(renderItemEditor(item, material.id, isLastItem));
      });
      return wrap;
    }

    function normalizeEditorColumnWidths(value) {
      const row = Math.max(
        MIN_ROW_COLUMN_PERCENT,
        Math.min(MAX_ROW_COLUMN_PERCENT, Number(value && value.row_percent) || 9)
      );
      const role = Math.max(
        MIN_ROLE_COLUMN_PERCENT,
        Math.min(100 - row - MIN_NAME_COLUMN_PERCENT, Number(value && value.role_percent) || 42)
      );
      return { row_percent: row, role_percent: role };
    }

    function applyEditorColumnWidths(wrap, widths) {
      wrap.style.setProperty('--material-row-column-width', `${widths.row_percent}%`);
      wrap.style.setProperty('--material-role-column-width', `${widths.role_percent}%`);
      wrap.querySelectorAll && wrap.querySelectorAll('.material-column-resizer').forEach((resizer) => {
        const value = resizer.dataset.column === 'row' ? widths.row_percent : widths.role_percent;
        resizer.setAttribute('aria-valuenow', String(Math.round(value)));
        resizer.setAttribute('aria-valuetext', `${Math.round(value)} %`);
      });
    }

    function persistEditorColumnWidths(ref, widths) {
      state.structure.editor_column_widths = state.structure.editor_column_widths || {};
      state.structure.editor_column_widths[ref] = {
        row_percent: Math.round(widths.row_percent * 10) / 10,
        role_percent: Math.round(widths.role_percent * 10) / 10,
      };
    }

    function resizeEditorColumn(wrap, ref, widths, column, nextValue) {
      if (column === 'row') {
        widths.row_percent = Math.max(
          MIN_ROW_COLUMN_PERCENT,
          Math.min(MAX_ROW_COLUMN_PERCENT, nextValue)
        );
        widths.role_percent = Math.min(widths.role_percent, 100 - widths.row_percent - MIN_NAME_COLUMN_PERCENT);
      } else {
        widths.role_percent = Math.max(
          MIN_ROLE_COLUMN_PERCENT,
          Math.min(100 - widths.row_percent - MIN_NAME_COLUMN_PERCENT, nextValue)
        );
      }
      persistEditorColumnWidths(ref, widths);
      applyEditorColumnWidths(wrap, widths);
    }

    function beginEditorColumnResize(wrap, ref, widths, column, event) {
      event.preventDefault();
      event.stopPropagation();
      const width = Math.max(1, wrap.getBoundingClientRect().width);
      const startX = event.clientX;
      const startValue = column === 'row' ? widths.row_percent : widths.role_percent;
      wrap.classList.add('resizing-material-columns');
      const move = (moveEvent) => resizeEditorColumn(
        wrap,
        ref,
        widths,
        column,
        startValue + ((moveEvent.clientX - startX) / width) * 100
      );
      const stop = () => {
        documentRef.removeEventListener('pointermove', move);
        documentRef.removeEventListener('pointerup', stop);
        documentRef.removeEventListener('pointercancel', stop);
        wrap.classList.remove('resizing-material-columns');
        if (options.scheduleAutosave) options.scheduleAutosave();
      };
      documentRef.addEventListener('pointermove', move);
      documentRef.addEventListener('pointerup', stop);
      documentRef.addEventListener('pointercancel', stop);
    }

    function resizeEditorColumnWithKeyboard(wrap, ref, widths, column, event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const delta = event.key === 'ArrowRight' ? 2 : -2;
      const current = column === 'row' ? widths.row_percent : widths.role_percent;
      resizeEditorColumn(wrap, ref, widths, column, current + delta);
      if (options.scheduleAutosave) options.scheduleAutosave();
    }

    function makeMaterialTableHeader(wrap, ref, widths) {
      const header = documentRef.createElement('div');
      header.className = 'material-table-header';
      [
        ['Fila', 'row'],
        ['Cargo', 'role'],
        ['Nombre', 'name'],
      ].forEach(([label, column]) => {
        const cell = documentRef.createElement('span');
        cell.className = `material-column-header material-column-header-${column}`;
        cell.textContent = label;
        if (column !== 'name') {
          const resizer = documentRef.createElement('span');
          resizer.className = 'material-column-resizer';
          resizer.dataset.column = column;
          resizer.setAttribute('role', 'separator');
          resizer.setAttribute('aria-label', `Cambiar ancho de la columna ${label}`);
          resizer.setAttribute('aria-orientation', 'vertical');
          resizer.setAttribute('aria-valuenow', String(Math.round(
            column === 'row' ? widths.row_percent : widths.role_percent
          )));
          resizer.setAttribute('tabindex', '0');
          resizer.addEventListener('pointerdown', (event) => (
            beginEditorColumnResize(wrap, ref, widths, column, event)
          ));
          resizer.addEventListener('keydown', (event) => (
            resizeEditorColumnWithKeyboard(wrap, ref, widths, column, event)
          ));
          cell.appendChild(resizer);
        }
        header.appendChild(cell);
      });
      return header;
    }

    function renderMusicThemesEditor(material) {
      const wrap = documentRef.createElement('div');
      wrap.className = 'music-themes';
      const themes = options.groupMusicLicenseThemes(options.getMaterialContentItems(material), state.structure.overrides || {});
      themes.forEach((theme, index) => {
        const themeWrap = documentRef.createElement('div');
        themeWrap.className = 'music-theme';
        const header = documentRef.createElement('div');
        header.className = 'music-theme-header';
        header.textContent = `Tema ${index + 1}`;
        themeWrap.appendChild(header);
        theme.lines.forEach((line, lineIndex) => {
          const overrideEntries = [{ refId: line.id, field: 'value', fallback: line.value || '' }];
          const row = documentRef.createElement('div');
          row.className = 'preview-line music-line' + (lineIndex === 0 ? ' theme-title' : '');
          const rowLabel = renderRowLabel(line.row, overrideEntries);
          row.appendChild(rowLabel);
          row.appendChild(makeRowPreviewInput(line.id, 'value', line.value || '', 'line-input', rowLabel, line.row, overrideEntries));
          themeWrap.appendChild(row);
        });
        wrap.appendChild(themeWrap);
      });
      return wrap;
    }

    function renderItemEditor(item) {
      const row = documentRef.createElement('div');
      const orientation = 'horizontal';

      if (item.kind === 'credit' || item.kind === 'crew_credit') {
        const overrideEntries = [
          { refId: item.id, field: 'role', fallback: item.role || '' },
          ...(item.names || []).map((name) => ({ refId: name.id, field: 'name', fallback: name.name || '' })),
        ];
        row.className = `preview-credit ${orientation}`;
        const rowLabel = renderRowLabel(item.row, overrideEntries);
        row.appendChild(rowLabel);
        const roleWrap = documentRef.createElement('div');
        roleWrap.className = 'preview-role';
        roleWrap.appendChild(makeRowPreviewInput(item.id, 'role', item.role || '', 'role-input', rowLabel, item.row, overrideEntries));

        const namesWrap = documentRef.createElement('div');
        namesWrap.className = 'preview-names';
        (item.names || []).forEach((name) => {
          const nameLine = documentRef.createElement('div');
          nameLine.className = 'preview-name-line';
          nameLine.appendChild(makeRowPreviewInput(name.id, 'name', name.name || '', 'name-input', rowLabel, item.row, overrideEntries));
          namesWrap.appendChild(nameLine);
        });

        row.append(roleWrap, namesWrap);
        return row;
      }

      if (item.kind === 'cast') {
        const overrideEntries = [
          { refId: item.id, field: 'actor', fallback: item.actor || '' },
          { refId: item.id, field: 'character', fallback: item.character || '' },
        ];
        row.className = `preview-credit ${orientation}`;
        const rowLabel = renderRowLabel(item.row, overrideEntries);
        row.appendChild(rowLabel);
        const actorWrap = documentRef.createElement('div');
        actorWrap.className = 'preview-role';
        actorWrap.appendChild(makeRowPreviewInput(item.id, 'actor', item.actor || '', 'role-input', rowLabel, item.row, overrideEntries));
        const characterWrap = documentRef.createElement('div');
        characterWrap.className = 'preview-names';
        characterWrap.appendChild(makeRowPreviewInput(item.id, 'character', item.character || '', 'name-input', rowLabel, item.row, overrideEntries));
        row.append(actorWrap, characterWrap);
        return row;
      }

      if (item.kind === 'section') {
        const overrideEntries = [{ refId: item.id, field: 'title', fallback: item.title || '' }];
        row.className = 'preview-section';
        const rowLabel = renderRowLabel(item.row, overrideEntries);
        row.appendChild(rowLabel);
        row.appendChild(makeRowPreviewInput(item.id, 'title', item.title || '', 'section-input', rowLabel, item.row, overrideEntries));
        return row;
      }

      if (item.kind === 'list_item' || item.kind === 'closing_line') {
        const overrideEntries = [{ refId: item.id, field: 'value', fallback: item.value || '' }];
        row.className = 'preview-line';
        const rowLabel = renderRowLabel(item.row, overrideEntries);
        row.appendChild(rowLabel);
        row.appendChild(makeRowPreviewInput(item.id, 'value', item.value || '', 'line-input', rowLabel, item.row, overrideEntries));
        return row;
      }

      row.className = 'line-row';
      row.innerHTML = `<div class="row-label">Fila ${item.row || '-'}<br>${options.escapeHtml(item.kind || 'item')}</div><pre>${options.escapeHtml(JSON.stringify(item, null, 2))}</pre>`;
      return row;
    }

    function renderRowLabel(rowNumber, overrideEntries = []) {
      const label = documentRef.createElement('div');
      updateRowLabel(label, rowNumber, overrideEntries);
      return label;
    }

    function updateRowLabel(label, rowNumber, overrideEntries = []) {
      const hasOverride = overrideEntries.some((entry) => options.hasEditableOverride && options.hasEditableOverride(entry.refId, entry.field));
      label.className = 'row-label' + (hasOverride ? ' row-label-override' : '');
      label.innerHTML = '';
      const text = documentRef.createElement('span');
      text.textContent = `Fila ${rowNumber || '-'}`;
      label.appendChild(text);
      if (hasOverride) {
        const resetButton = documentRef.createElement('button');
        resetButton.type = 'button';
        resetButton.className = 'override-reset-button row-override-reset-button';
        resetButton.textContent = '↻';
        resetButton.title = 'Restablecer fila';
        resetButton.setAttribute('aria-label', resetButton.title);
        resetButton.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          const action = () => options.resetEditableOverrides(overrideEntries);
          const busyAction = root.CreditosBusyAction;
          if (busyAction && typeof busyAction.run === 'function') {
            busyAction.run({ trigger: resetButton, action, documentRef, windowRef: root });
          } else {
            action();
          }
        });
        label.appendChild(resetButton);
      }
    }

    function makeRowPreviewInput(refId, field, fallback, className, rowLabel, rowNumber, overrideEntries) {
      return options.makePreviewInput(refId, field, fallback, className, {
        onOverrideChange: () => updateRowLabel(rowLabel, rowNumber, overrideEntries),
      });
    }

    function toggleSourceRefLock(ref) {
      const settings = options.ensureCartelaSourceRefSettings(options.getSelectedCartela(), ref);
      if (!settings) return;
      if (settings.locked) {
        delete settings.locked;
        delete settings.frozen_material;
      } else {
        const material = state.materials.find((candidate) => candidate.id === ref);
        if (!material) return;
        settings.locked = true;
        settings.frozen_material = options.normalizeFrozenMaterial(material);
      }
      options.rebuild();
    }

    return {
      renderMaterialEditor,
    };
  }

  root.CreditosAppMaterialEditor = {
    createAppMaterialEditor,
  };
})(globalThis);
