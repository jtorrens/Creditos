(function (root) {
  function createAppFormRows(options = {}) {
    const documentRef = options.documentRef || root.document;
    const fieldControlRegistry = options.fieldControlRegistry;
    const windowRef = options.windowRef || root;

    function localInputRow(label, value, onInput, rowOptions) {
      const row = documentRef.createElement('div');
      row.className = 'field-grid' + (rowOptions && rowOptions.override ? ' override-field' : '');
      const labelEl = documentRef.createElement('label');
      labelEl.textContent = label;
      const input = fieldControlRegistry.create('text', {
        value,
        multiline: rowOptions && rowOptions.multiline,
        commitOnChange: rowOptions && rowOptions.commitOnChange,
        onInput,
      });
      row.appendChild(labelEl);
      row.appendChild(wrapOverrideControl(input, rowOptions));
      return row;
    }

    function localSelectRow(label, value, selectOptions, onInput, meta = {}) {
      const row = documentRef.createElement('div');
      row.className = 'field-grid' + (meta.override ? ' override-field' : '');
      const labelEl = documentRef.createElement('label');
      labelEl.textContent = label;
      const select = fieldControlRegistry.create('select', {
        value,
        options: selectOptions,
        onInput,
        onAfterCommit: options.renderEditor,
      });
      row.appendChild(labelEl);
      row.appendChild(wrapOverrideControl(select, meta));
      return row;
    }

    function localDurationRow(label, secondsValue, onInput, meta = {}) {
      const row = documentRef.createElement('div');
      row.className = 'field-grid' + (meta.override ? ' override-field' : '');
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
        onAfterCommit: options.renderEditor,
      });
      row.appendChild(labelEl);
      row.appendChild(wrapOverrideControl(input, meta));
      return row;
    }

    function localNumberRow(label, value, min, max, onInput, step = 1, meta = {}) {
      const row = documentRef.createElement('div');
      row.className = 'field-grid' + (meta.override ? ' override-field' : '');
      const labelEl = documentRef.createElement('label');
      labelEl.textContent = label;
      const input = fieldControlRegistry.create('number', {
        value,
        min,
        max,
        step,
        onInput,
        onAfterCommit: options.renderEditor,
      });
      row.appendChild(labelEl);
      row.appendChild(wrapOverrideControl(input, meta));
      return row;
    }

    function wrapOverrideControl(control, meta = {}) {
      if (!meta.override) return control;
      const wrap = documentRef.createElement('div');
      wrap.className = 'override-control';
      wrap.appendChild(control);
      const reset = documentRef.createElement('button');
      reset.type = 'button';
      reset.textContent = 'Restablecer';
      reset.addEventListener('click', meta.reset || (() => {}));
      wrap.appendChild(reset);
      return wrap;
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
