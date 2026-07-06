(function (root) {
  function createAppMaterialEditor(options = {}) {
    const documentRef = options.documentRef || root.document;
    const state = options.state;

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
        cartela.pages = (cartela.pages || []).map((page) => ({
          ...page,
          source_refs: (page.source_refs || []).filter((sourceRef) => sourceRef !== ref),
        }));
        cartela.pages.forEach((page) => {
          if (page.source_ref_settings) delete page.source_ref_settings[ref];
        });
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
      breakUnits.forEach((item, index) => {
        const isLastItem = index === breakUnits.length - 1;
        wrap.appendChild(renderItemEditor(item, material.id, isLastItem));
      });
      return wrap;
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
          const row = documentRef.createElement('div');
          row.className = 'preview-line music-line' + (lineIndex === 0 ? ' theme-title' : '');
          row.innerHTML = `<div class="row-label">Fila ${line.row}</div>`;
          row.appendChild(options.makePreviewInput(line.id, 'value', line.value || '', 'line-input'));
          themeWrap.appendChild(row);
        });
        wrap.appendChild(themeWrap);
      });
      return wrap;
    }

    function renderItemEditor(item) {
      const row = documentRef.createElement('div');
      const cartela = options.getSelectedCartela();
      const orientation = cartela && cartela.orientation ? cartela.orientation : 'horizontal';

      if (item.kind === 'credit' || item.kind === 'crew_credit') {
        row.className = `preview-credit ${orientation}`;
        row.innerHTML = `<div class="row-label">Fila ${item.row}</div>`;
        const roleWrap = documentRef.createElement('div');
        roleWrap.className = 'preview-role';
        roleWrap.appendChild(options.makePreviewInput(item.id, 'role', item.role || '', 'role-input'));

        const namesWrap = documentRef.createElement('div');
        namesWrap.className = 'preview-names';
        (item.names || []).forEach((name) => {
          const nameLine = documentRef.createElement('div');
          nameLine.className = 'preview-name-line';
          nameLine.appendChild(options.makePreviewInput(name.id, 'name', name.name || '', 'name-input'));
          namesWrap.appendChild(nameLine);
        });

        row.appendChild(roleWrap);
        row.appendChild(namesWrap);
        return row;
      }

      if (item.kind === 'cast') {
        row.className = `preview-credit ${orientation}`;
        row.innerHTML = `<div class="row-label">Fila ${item.row}</div>`;
        const actorWrap = documentRef.createElement('div');
        actorWrap.className = 'preview-role';
        actorWrap.appendChild(options.makePreviewInput(item.id, 'actor', item.actor || '', 'role-input'));
        const characterWrap = documentRef.createElement('div');
        characterWrap.className = 'preview-names';
        characterWrap.appendChild(options.makePreviewInput(item.id, 'character', item.character || '', 'name-input'));
        row.appendChild(actorWrap);
        row.appendChild(characterWrap);
        return row;
      }

      if (item.kind === 'section') {
        row.className = 'preview-section';
        row.innerHTML = `<div class="row-label">Fila ${item.row}</div>`;
        row.appendChild(options.makePreviewInput(item.id, 'title', item.title || '', 'section-input'));
        return row;
      }

      if (item.kind === 'list_item' || item.kind === 'closing_line') {
        row.className = 'preview-line';
        row.innerHTML = `<div class="row-label">Fila ${item.row}</div>`;
        row.appendChild(options.makePreviewInput(item.id, 'value', item.value || '', 'line-input'));
        return row;
      }

      row.className = 'line-row';
      row.innerHTML = `<div class="row-label">Fila ${item.row || '-'}<br>${options.escapeHtml(item.kind || 'item')}</div><pre>${options.escapeHtml(JSON.stringify(item, null, 2))}</pre>`;
      return row;
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
