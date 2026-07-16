(function (root) {
  function createAppFormRows(options = {}) {
    const documentRef = options.documentRef || root.document;
    const fieldControlRegistry = options.fieldControlRegistry;
    const windowRef = options.windowRef || root;

    function localInputRow(label, value, onInput, rowOptions) {
      const row = documentRef.createElement('div');
      row.className = 'field-grid' + (rowHasOverride(rowOptions) ? ' override-field' : '');
      const labelEl = documentRef.createElement('label');
      labelEl.textContent = label;
      const input = fieldControlRegistry.create('text', {
        value,
        multiline: rowOptions && rowOptions.multiline,
        commitOnChange: rowOptions && rowOptions.commitOnChange,
        onInput,
      });
      row.appendChild(labelEl);
      row.appendChild(wrapFieldControl(input, rowOptions));
      return row;
    }

    function localSelectRow(label, value, selectOptions, onInput, meta = {}) {
      const row = documentRef.createElement('div');
      row.className = 'field-grid' + (rowHasOverride(meta) ? ' override-field' : '');
      const labelEl = documentRef.createElement('label');
      labelEl.textContent = label;
      const select = fieldControlRegistry.create('select', {
        value,
        options: selectOptions,
        onInput,
      });
      row.appendChild(labelEl);
      row.appendChild(wrapFieldControl(select, meta));
      return row;
    }

    function localDurationRow(label, secondsValue, onInput, meta = {}) {
      const row = documentRef.createElement('div');
      row.className = 'field-grid' + (rowHasOverride(meta) ? ' override-field' : '');
      const labelEl = documentRef.createElement('label');
      labelEl.textContent = label;
      const input = fieldControlRegistry.create('duration', {
        secondsValue,
        currentFps: options.currentMovieFps,
        formatFrameDuration: options.formatFrameDuration,
        formatSecondsAsFrameDuration: options.formatSecondsAsFrameDuration,
        parseFrameDuration: options.parseFrameDuration,
        alertFn: (message) => windowRef.alert(message),
        onInput,
      });
      row.appendChild(labelEl);
      row.appendChild(wrapFieldControl(input, meta));
      return row;
    }

    function localNumberRow(label, value, min, max, onInput, step = 1, meta = {}) {
      const row = documentRef.createElement('div');
      row.className = 'field-grid' + (rowHasOverride(meta) ? ' override-field' : '');
      const labelEl = documentRef.createElement('label');
      labelEl.textContent = label;
      const input = fieldControlRegistry.create('number', {
        value,
        min,
        max,
        step,
        onInput,
      });
      row.appendChild(labelEl);
      row.appendChild(wrapFieldControl(input, meta));
      return row;
    }

    function wrapFieldControl(control, meta = {}) {
      if (!meta || (!meta.override && !meta.beforeControl && !meta.afterControl)) return control;
      if (!meta.override) {
        const inlineWrap = documentRef.createElement('div');
        inlineWrap.className = 'field-control-inline';
        if (meta.beforeControl) inlineWrap.appendChild(meta.beforeControl);
        inlineWrap.appendChild(control);
        if (meta.afterControl) inlineWrap.appendChild(meta.afterControl);
        return inlineWrap;
      }

      const overrideWrap = documentRef.createElement('div');
      overrideWrap.className = 'override-control';
      overrideWrap.appendChild(control);

      const reset = documentRef.createElement('button');
      reset.type = 'button';
      reset.className = 'override-reset-button';
      reset.textContent = '↻';
      reset.title = 'Restablecer';
      reset.setAttribute('aria-label', 'Restablecer');
      reset.addEventListener('click', () => runResetAction(reset, meta.reset));
      overrideWrap.appendChild(reset);

      if (!meta.beforeControl && !meta.afterControl) return overrideWrap;

      const inlineWrap = documentRef.createElement('div');
      inlineWrap.className = 'field-control-inline';
      if (meta.beforeControl) inlineWrap.appendChild(meta.beforeControl);
      inlineWrap.appendChild(overrideWrap);
      if (meta.afterControl) inlineWrap.appendChild(meta.afterControl);
      return inlineWrap;
    }

    function rowHasOverride(meta) {
      return !!(meta && meta.override);
    }

    function runResetAction(trigger, action) {
      const busyAction = root.CreditosBusyAction;
      if (busyAction && typeof busyAction.run === 'function') {
        return busyAction.run({ trigger, action, documentRef, windowRef });
      }
      return (action || (() => {}))();
    }

    function localCheckboxRow(label, value, onInput) {
      const row = documentRef.createElement('div');
      row.className = 'field-grid';
      const labelEl = documentRef.createElement('label');
      labelEl.textContent = label;
      const inputWrap = fieldControlRegistry.create('checkbox', {
        value,
        onInput,
      });
      row.appendChild(labelEl);
      row.appendChild(inputWrap);
      return row;
    }

    function sectionLabel(text) {
      const label = documentRef.createElement('div');
      label.className = 'section-title';
      label.textContent = text;
      return label;
    }

    return {
      localCheckboxRow,
      localDurationRow,
      localInputRow,
      localNumberRow,
      localSelectRow,
      sectionLabel,
    };
  }

  root.CreditosAppFormRows = {
    createAppFormRows,
  };
})(globalThis);
