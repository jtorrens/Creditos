(function (root) {
  const COLUMNS = ['A', 'B', 'C', 'D'];

  function initializeParserLab(documentRef = root.document, fetchRef = root.fetch.bind(root)) {
    const rootElement = documentRef.getElementById('parserLabRoot');
    if (!rootElement) return null;

    rootElement.innerHTML = `
      <div class="parser-lab-shell">
        <div class="parser-lab-toolbar">
          <div class="parser-lab-file-actions">
            <button id="parserLabOpenBtn" type="button">Cargar ODS/XLSX</button>
            <button id="parserLabClearBtn" type="button" disabled>Limpiar</button>
            <input id="parserLabFileInput" class="hidden-input" type="file" accept=".ods,.xlsx,application/vnd.oasis.opendocument.spreadsheet,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">
          </div>
          <label class="parser-lab-filter" for="parserLabFilterInput">
            <span>Filtrar</span>
            <input id="parserLabFilterInput" class="text-input" type="search" placeholder="Fila, contenido, negrita o combinada…" disabled>
          </label>
          <div id="parserLabSummary" class="parser-lab-summary">Sin archivo cargado</div>
        </div>
        <div class="parser-lab-body">
          <section class="parser-lab-table-panel" aria-label="Filas normalizadas">
            <div class="parser-lab-panel-heading">
              <h2>Filas normalizadas</h2>
              <span id="parserLabSheetMeta">El lector todavía no ha procesado ningún archivo.</span>
            </div>
            <div id="parserLabTableEmpty" class="parser-lab-empty">Carga un archivo para inspeccionar las columnas A–D antes de aplicar reglas de modelo.</div>
            <div id="parserLabTableWrap" class="parser-lab-table-wrap" hidden>
              <table class="parser-lab-table">
                <thead>
                  <tr>
                    <th scope="col">Fila</th>
                    <th scope="col">A</th>
                    <th scope="col">B</th>
                    <th scope="col">C</th>
                    <th scope="col">D</th>
                    <th class="parser-lab-flag" scope="col">Negrita</th>
                    <th class="parser-lab-flag" scope="col">B:D</th>
                  </tr>
                </thead>
                <tbody id="parserLabTableBody"></tbody>
              </table>
            </div>
          </section>
          <aside class="parser-lab-json-panel" aria-label="JSON de la fila seleccionada">
            <div class="parser-lab-panel-heading">
              <h2>JSON de la fila</h2>
              <span id="parserLabSelectionMeta">Sin selección</span>
            </div>
            <pre id="parserLabJson" class="parser-lab-json">Selecciona una fila para ver todos sus atributos.</pre>
          </aside>
        </div>
      </div>
    `;

    const elements = {
      openButton: documentRef.getElementById('parserLabOpenBtn'),
      clearButton: documentRef.getElementById('parserLabClearBtn'),
      fileInput: documentRef.getElementById('parserLabFileInput'),
      filterInput: documentRef.getElementById('parserLabFilterInput'),
      summary: documentRef.getElementById('parserLabSummary'),
      sheetMeta: documentRef.getElementById('parserLabSheetMeta'),
      tableEmpty: documentRef.getElementById('parserLabTableEmpty'),
      tableWrap: documentRef.getElementById('parserLabTableWrap'),
      tableBody: documentRef.getElementById('parserLabTableBody'),
      selectionMeta: documentRef.getElementById('parserLabSelectionMeta'),
      json: documentRef.getElementById('parserLabJson'),
    };
    const state = { inspection: null, selectedRowNumber: null, filter: '' };

    function sourceKindForFile(file) {
      const match = String(file && file.name || '').toLowerCase().match(/\.([^.]+)$/);
      const kind = match ? match[1] : '';
      if (!['ods', 'xlsx'].includes(kind)) throw new Error('Parser Lab solo admite archivos .ods y .xlsx.');
      return kind;
    }

    async function inspectFile(file) {
      const sourceKind = sourceKindForFile(file);
      elements.openButton.disabled = true;
      elements.summary.classList.remove('parser-lab-error');
      elements.summary.textContent = `Leyendo ${file.name}…`;
      try {
        const form = new root.FormData();
        form.append('file', file);
        form.append('source_kind', sourceKind);
        const response = await fetchRef('/api/parser-lab/inspect-source', { method: 'POST', body: form });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'No se pudo inspeccionar el archivo.');
        state.inspection = payload;
        state.selectedRowNumber = payload.rows && payload.rows[0] ? payload.rows[0].row : null;
        state.filter = '';
        elements.filterInput.value = '';
        render();
      } catch (error) {
        state.inspection = null;
        state.selectedRowNumber = null;
        render();
        elements.summary.classList.add('parser-lab-error');
        elements.summary.textContent = error.message;
      } finally {
        elements.openButton.disabled = false;
        elements.fileInput.value = '';
      }
    }

    function filteredRows() {
      const rows = state.inspection ? state.inspection.rows || [] : [];
      const query = state.filter.trim().toLocaleLowerCase('es');
      if (!query) return rows;
      return rows.filter((row) => {
        const boldColumns = COLUMNS.filter((column) => row.bold && row.bold[column]);
        const searchable = [
          row.row,
          ...COLUMNS.map((column) => row.values && row.values[column]),
          boldColumns.length ? `negrita ${boldColumns.join(' ')}` : '',
          row.merged_b_to_d ? 'combinada b:d' : '',
        ].join(' ').toLocaleLowerCase('es');
        return searchable.includes(query);
      });
    }

    function render() {
      const inspection = state.inspection;
      const rows = filteredRows();
      elements.clearButton.disabled = !inspection;
      elements.filterInput.disabled = !inspection;
      elements.tableBody.replaceChildren();

      if (!inspection) {
        elements.summary.textContent = 'Sin archivo cargado';
        elements.sheetMeta.textContent = 'El lector todavía no ha procesado ningún archivo.';
        elements.tableEmpty.hidden = false;
        elements.tableWrap.hidden = true;
        elements.selectionMeta.textContent = 'Sin selección';
        elements.json.textContent = 'Selecciona una fila para ver todos sus atributos.';
        return;
      }

      elements.summary.textContent = `${inspection.source_kind.toUpperCase()} · ${rows.length}/${inspection.rows.length} filas`;
      elements.sheetMeta.textContent = `${inspection.source} · hoja ${inspection.sheet}`;
      elements.tableEmpty.hidden = rows.length > 0;
      elements.tableEmpty.textContent = state.filter
        ? 'Ninguna fila coincide con el filtro.'
        : 'El archivo no contiene filas normalizadas con datos.';
      elements.tableWrap.hidden = rows.length === 0;

      const fragment = documentRef.createDocumentFragment();
      rows.forEach((row) => fragment.appendChild(renderRow(row)));
      elements.tableBody.appendChild(fragment);
      renderSelection();
    }

    function renderRow(row) {
      const tr = documentRef.createElement('tr');
      tr.tabIndex = 0;
      tr.dataset.row = String(row.row);
      tr.classList.toggle('selected', row.row === state.selectedRowNumber);
      tr.setAttribute('aria-selected', row.row === state.selectedRowNumber ? 'true' : 'false');
      tr.addEventListener('click', () => selectRow(row.row));
      tr.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectRow(row.row);
        }
      });

      appendCell(tr, row.row);
      COLUMNS.forEach((column) => appendCell(tr, row.values && row.values[column] || ''));
      const boldColumns = COLUMNS.filter((column) => row.bold && row.bold[column]);
      appendCell(tr, boldColumns.join(', ') || '—', 'parser-lab-flag');
      appendCell(tr, row.merged_b_to_d ? 'Sí' : 'No', 'parser-lab-flag');
      return tr;
    }

    function appendCell(rowElement, value, className = '') {
      const cell = documentRef.createElement('td');
      if (className) cell.className = className;
      cell.textContent = String(value);
      rowElement.appendChild(cell);
    }

    function selectRow(rowNumber) {
      state.selectedRowNumber = rowNumber;
      Array.from(elements.tableBody.rows).forEach((rowElement) => {
        const selected = Number(rowElement.dataset.row) === rowNumber;
        rowElement.classList.toggle('selected', selected);
        rowElement.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
      renderSelection();
    }

    function renderSelection() {
      const selected = state.inspection && (state.inspection.rows || []).find((row) => row.row === state.selectedRowNumber);
      if (!selected) {
        elements.selectionMeta.textContent = 'Sin selección';
        elements.json.textContent = 'Selecciona una fila para ver todos sus atributos.';
        return;
      }
      elements.selectionMeta.textContent = `Fila ${selected.row}`;
      elements.json.textContent = JSON.stringify(selected, null, 2);
    }

    function clearInspection() {
      state.inspection = null;
      state.selectedRowNumber = null;
      state.filter = '';
      elements.filterInput.value = '';
      elements.summary.classList.remove('parser-lab-error');
      render();
    }

    elements.openButton.addEventListener('click', () => elements.fileInput.click());
    elements.clearButton.addEventListener('click', clearInspection);
    elements.fileInput.addEventListener('change', () => {
      const file = elements.fileInput.files && elements.fileInput.files[0];
      if (file) inspectFile(file);
    });
    elements.filterInput.addEventListener('input', () => {
      state.filter = elements.filterInput.value;
      render();
    });
    render();

    return { clearInspection, inspectFile, render, state };
  }

  root.CreditosParserLabUi = { initializeParserLab };
  initializeParserLab();
})(globalThis);
