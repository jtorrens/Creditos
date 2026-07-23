(function (root) {
  function buildRowIndexes(rows, blockInstances, rowDecisions, columns) {
    const sourceRows = rows || [];
    const instances = blockInstances || [];
    const rowByNumber = new Map(sourceRows.map((row) => [row.row, row]));
    const blockInstanceByRow = new Map();
    const headerCandidatesByRow = new Map();
    const rowDecisionByNumber = new Map((rowDecisions || []).map((entry) => [entry.row, entry]));
    const matchedInstances = instances.filter((instance) => instance.matched);
    let instanceIndex = 0;

    sourceRows.forEach((row) => {
      while (
        matchedInstances[instanceIndex]
        && row.row > matchedInstances[instanceIndex].end_row
      ) instanceIndex += 1;
      const instance = matchedInstances[instanceIndex];
      if (instance && row.row >= instance.start_row && row.row <= instance.end_row) {
        blockInstanceByRow.set(row.row, instance);
      }
    });

    instances.forEach((instance) => {
      (instance.candidate_rows || []).forEach((rowNumber) => {
        const candidates = headerCandidatesByRow.get(rowNumber) || [];
        candidates.push(instance);
        headerCandidatesByRow.set(rowNumber, candidates);
      });
    });

    const searchTextByRow = new Map(sourceRows.map((row) => {
      const boldColumns = columns.filter((column) => row.bold && row.bold[column]);
      const block = blockInstanceByRow.get(row.row);
      return [row.row, [
        row.row,
        ...columns.map((column) => row.values && row.values[column]),
        block && block.name,
        row.empty ? 'fila vacía división separador' : '',
        boldColumns.length ? `negrita ${boldColumns.join(' ')}` : '',
        row.merged_b_to_d ? 'combinada b:d' : '',
      ].join(' ').toLocaleLowerCase('es')];
    }));

    return {
      rowByNumber,
      blockInstanceByRow,
      headerCandidatesByRow,
      searchTextByRow,
      rowDecisionByNumber,
    };
  }

  function ensureRovingTabStop(container) {
    const tabs = Array.from(container.querySelectorAll('[role="tab"]'));
    if (!tabs.length || tabs.some((tab) => tab.tabIndex === 0)) return;
    tabs[0].tabIndex = 0;
  }

  function navigateTablist(container, event) {
    const tab = event.target.closest && event.target.closest('[role="tab"]');
    if (!tab || event.target !== tab || !container.contains(tab)) return;
    const tabs = Array.from(container.querySelectorAll('[role="tab"]')).filter((candidate) => !candidate.disabled);
    const currentIndex = tabs.indexOf(tab);
    let nextIndex;
    if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    else return;
    event.preventDefault();
    const identity = {
      blockId: tabs[nextIndex].dataset.blockId,
      rightTab: tabs[nextIndex].dataset.rightTab,
      jsonTab: tabs[nextIndex].dataset.jsonTab,
    };
    tabs[nextIndex].click();
    root.requestAnimationFrame(() => {
      const candidates = Array.from(container.querySelectorAll('[role="tab"]'));
      const selected = candidates.find((candidate) => (
        (identity.blockId && candidate.dataset.blockId === identity.blockId)
        || (identity.rightTab && candidate.dataset.rightTab === identity.rightTab)
        || (identity.jsonTab && candidate.dataset.jsonTab === identity.jsonTab)
      )) || candidates.find((candidate) => candidate.getAttribute('aria-selected') === 'true');
      if (selected) selected.focus({ preventScroll: true });
    });
  }

  function setupSplitters({ documentRef, elements, clamp }) {
    const splitTarget = (split) => (
      split === 'workspace' ? elements.workspace : split === 'left' ? elements.leftPane : elements.inspectorPane
    );
    const splitVariable = (split) => (
      split === 'workspace'
        ? '--parser-lab-left-size'
        : split === 'left'
          ? '--parser-lab-table-size'
          : '--parser-lab-selection-size'
    );
    const currentPercentage = (split) => {
      const target = splitTarget(split);
      const inlineValue = Number.parseFloat(target.style.getPropertyValue(splitVariable(split)));
      if (Number.isFinite(inlineValue)) return inlineValue;
      const targetRect = target.getBoundingClientRect();
      const firstPanel = split === 'workspace'
        ? elements.leftPane
        : split === 'left'
          ? target.querySelector('.parser-lab-table-panel')
          : target.querySelector('.parser-lab-selection-panel');
      const panelRect = firstPanel.getBoundingClientRect();
      const total = split === 'workspace' ? targetRect.width : targetRect.height;
      const size = split === 'workspace' ? panelRect.width : panelRect.height;
      return total > 0 ? (size / total) * 100 : (split === 'workspace' ? 68 : split === 'left' ? 62 : 30);
    };
    const updateAria = (splitter, percentage = currentPercentage(splitter.dataset.split)) => {
      const rounded = Math.round(percentage);
      splitter.setAttribute('aria-valuenow', String(rounded));
      splitter.setAttribute('aria-valuetext', `${rounded}% para el primer panel`);
    };
    const applyPercentage = (split, percentage, splitter) => {
      const minimum = split === 'workspace' ? 38 : 22;
      const value = clamp(percentage, minimum, 78);
      splitTarget(split).style.setProperty(splitVariable(split), `${value}%`);
      updateAria(splitter, value);
    };
    const resizeWithKeyboard = (splitter, event) => {
      const split = splitter.dataset.split;
      const decrease = split === 'workspace' ? 'ArrowLeft' : 'ArrowUp';
      const increase = split === 'workspace' ? 'ArrowRight' : 'ArrowDown';
      if (event.key !== decrease && event.key !== increase) return;
      event.preventDefault();
      const announcedValue = Number.parseFloat(splitter.getAttribute('aria-valuenow'));
      const currentValue = Number.isFinite(announcedValue) ? announcedValue : currentPercentage(split);
      applyPercentage(split, currentValue + (event.key === increase ? 2 : -2), splitter);
    };
    const beginResize = (splitter, event) => {
      event.preventDefault();
      const split = splitter.dataset.split;
      const target = splitTarget(split);
      const rect = target.getBoundingClientRect();
      const move = (moveEvent) => applyPercentage(
        split,
        split === 'workspace'
          ? ((moveEvent.clientX - rect.left) / rect.width) * 100
          : ((moveEvent.clientY - rect.top) / rect.height) * 100,
        splitter
      );
      const stop = () => {
        documentRef.removeEventListener('pointermove', move);
        documentRef.removeEventListener('pointerup', stop);
        documentRef.removeEventListener('pointercancel', stop);
      };
      documentRef.addEventListener('pointermove', move);
      documentRef.addEventListener('pointerup', stop);
      documentRef.addEventListener('pointercancel', stop);
    };

    documentRef.querySelectorAll('.parser-lab-splitter').forEach((splitter) => {
      splitter.addEventListener('pointerdown', (event) => beginResize(splitter, event));
      splitter.addEventListener('keydown', (event) => resizeWithKeyboard(splitter, event));
      const bounds = splitter.dataset.split === 'workspace' ? [38, 78] : [22, 78];
      splitter.setAttribute('aria-valuemin', String(bounds[0]));
      splitter.setAttribute('aria-valuemax', String(bounds[1]));
      root.requestAnimationFrame(() => updateAria(splitter));
    });
  }

  root.CreditosParserLabUiSupport = {
    buildRowIndexes,
    ensureRovingTabStop,
    navigateTablist,
    setupSplitters,
  };
})(globalThis);
