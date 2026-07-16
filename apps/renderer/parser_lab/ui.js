(function (root) {
  const COLUMNS = ['A', 'B', 'C', 'D'];

  function initializeParserLab(documentRef = root.document, fetchRef = root.fetch.bind(root)) {
    const rootElement = documentRef.getElementById('parserLabRoot');
    if (!rootElement) return null;
    const blockModel = root.CreditosParserLabBlockModel;
    if (!blockModel) throw new Error('No se ha cargado el modelo aislado de bloques del Parser Lab.');

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
          <div class="parser-lab-workflow" aria-label="Flujo del laboratorio">
            <span id="parserLabSourceStep"><b>1</b> Fuente</span>
            <span id="parserLabBlocksStep"><b>2</b> Bloques</span>
            <span id="parserLabCompositionStep"><b>3</b> Composición</span>
            <span id="parserLabPreviewStep"><b>4</b> Previo</span>
          </div>
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
                <colgroup>
                  <col class="parser-lab-row-column">
                  <col class="parser-lab-block-column">
                  <col span="4">
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">Fila</th>
                    <th scope="col">Bloque</th>
                    <th scope="col">A</th>
                    <th scope="col">B</th>
                    <th scope="col">C</th>
                    <th scope="col">D</th>
                  </tr>
                </thead>
                <tbody id="parserLabTableBody"></tbody>
              </table>
            </div>
          </section>
          <div class="parser-lab-inspector-stack">
          <section class="parser-lab-block-panel" aria-label="Modelo manual de bloques">
            <div class="parser-lab-panel-heading">
              <h2>Modelo de bloques</h2>
              <span id="parserLabBlockCount">0 bloques</span>
            </div>
            <div class="parser-lab-block-toolbar">
              <button id="parserLabDefineBlockBtn" type="button" disabled>Definir fila como cabecera</button>
              <button id="parserLabClearModelBtn" type="button" disabled>Vaciar modelo</button>
              <span id="parserLabModelPersistence" class="parser-lab-model-persistence">Cargando JSON temporal…</span>
            </div>
            <div id="parserLabBlockList" class="parser-lab-block-list">
              <div class="parser-lab-block-empty">Selecciona una fila y define la primera cabecera.</div>
            </div>
            <div class="parser-lab-composition-heading">
              <div>
                <h3>Reglas de composición</h3>
                <span id="parserLabCompositionCount">0 reglas</span>
              </div>
              <button id="parserLabAddCompositionBtn" type="button">Añadir regla</button>
            </div>
            <div id="parserLabCompositionList" class="parser-lab-composition-list">
              <div class="parser-lab-block-empty">Sin agrupaciones adicionales.</div>
            </div>
            <form id="parserLabCompositionForm" class="parser-lab-block-form parser-lab-composition-form" hidden>
              <div class="parser-lab-form-title" id="parserLabCompositionFormTitle">Nueva regla de composición</div>
              <div class="parser-lab-form-grid">
                <label>
                  <span>Aplicar a</span>
                  <select id="parserLabCompositionScopeSelect" class="text-input">
                    <option value="item">Ítem</option>
                    <option value="block">Bloque</option>
                  </select>
                </label>
                <label>
                  <span>Condición</span>
                  <select id="parserLabCompositionOperatorSelect" class="text-input">
                    <option value="equals">Igual a</option>
                    <option value="contains">Contiene</option>
                    <option value="regex">Expresión regular</option>
                  </select>
                </label>
              </div>
              <label>
                <span id="parserLabCompositionValueLabel">Principal del ítem</span>
                <input id="parserLabCompositionValueInput" class="text-input" type="text">
              </label>
              <div class="parser-lab-form-grid">
                <label>
                  <span>Agrupar siguientes</span>
                  <input id="parserLabCompositionCountInput" class="text-input" type="number" min="1" step="1" value="1">
                </label>
                <label>
                  <span>En una misma</span>
                  <select id="parserLabCompositionTargetSelect" class="text-input">
                    <option value="group">Grupo</option>
                    <option value="page">Página</option>
                    <option value="cartela">Cartela</option>
                  </select>
                </label>
              </div>
              <div id="parserLabCompositionFormError" class="parser-lab-form-error" hidden></div>
              <div class="parser-lab-form-actions">
                <button type="submit">Guardar regla</button>
                <button id="parserLabCancelCompositionBtn" type="button">Cancelar</button>
                <button id="parserLabDeleteCompositionBtn" type="button" hidden>Eliminar</button>
              </div>
            </form>
            <form id="parserLabBlockForm" class="parser-lab-block-form" hidden>
              <div class="parser-lab-form-title" id="parserLabBlockFormTitle">Nueva cabecera</div>
              <label>
                <span>Nombre del bloque</span>
                <input id="parserLabBlockNameInput" class="text-input" type="text">
              </label>
              <div class="parser-lab-form-grid">
                <label>
                  <span>Columna</span>
                  <select id="parserLabBlockColumnSelect" class="text-input">
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </label>
                <label>
                  <span>Condición</span>
                  <select id="parserLabBlockOperatorSelect" class="text-input">
                    <option value="equals">Igual a</option>
                    <option value="contains">Contiene</option>
                    <option value="regex">Expresión regular</option>
                    <option value="nonempty">No vacía</option>
                  </select>
                </label>
              </div>
              <label>
                <span>Valor</span>
                <input id="parserLabBlockValueInput" class="text-input" type="text">
              </label>
              <div class="parser-lab-form-grid">
                <label>
                  <span>Negrita</span>
                  <select id="parserLabBlockBoldSelect" class="text-input">
                    <option value="ignore">Ignorar</option>
                    <option value="required">Requerida</option>
                    <option value="forbidden">Prohibida</option>
                  </select>
                </label>
                <label>
                  <span>Combinada B–D</span>
                  <select id="parserLabBlockMergedSelect" class="text-input">
                    <option value="ignore">Ignorar</option>
                    <option value="required">Requerida</option>
                    <option value="forbidden">Prohibida</option>
                  </select>
                </label>
              </div>
              <label>
                <span>Fila vacía significa</span>
                <select id="parserLabBlockSeparatorSelect" class="text-input">
                  <option value="item">Siguiente ítem</option>
                  <option value="group">Salto de grupo</option>
                  <option value="page">Salto de página</option>
                </select>
              </label>
              <p class="parser-lab-rule-note">Lectura: primer valor = principal; valores siguientes = asociados. Orden: izquierda a derecha y arriba abajo.</p>
              <div id="parserLabBlockFormError" class="parser-lab-form-error" hidden></div>
              <div class="parser-lab-form-actions">
                <button id="parserLabSaveBlockBtn" type="submit">Guardar cabecera</button>
                <button id="parserLabCancelBlockBtn" type="button">Cancelar</button>
                <button id="parserLabDeleteBlockBtn" type="button" hidden>Eliminar</button>
              </div>
            </form>
            <details class="parser-lab-model-json-details">
              <summary>JSON del modelo</summary>
              <pre id="parserLabModelJson" class="parser-lab-model-json"></pre>
            </details>
            <details class="parser-lab-model-json-details">
              <summary>Vista semántica interpretada</summary>
              <pre id="parserLabSemanticJson" class="parser-lab-model-json"></pre>
            </details>
          </section>
          <aside class="parser-lab-json-panel" aria-label="JSON de la fila seleccionada">
            <div class="parser-lab-panel-heading">
              <h2>JSON de la fila</h2>
              <span id="parserLabSelectionMeta">Sin selección</span>
            </div>
            <div id="parserLabFormatSummary" class="parser-lab-format-summary" hidden></div>
            <pre id="parserLabJson" class="parser-lab-json">Selecciona una fila para ver todos sus atributos.</pre>
          </aside>
          </div>
        </div>
        <section class="parser-lab-preview-panel" aria-label="Previo simple del parser">
          <div class="parser-lab-panel-heading">
            <h2>Previo del parser</h2>
            <span id="parserLabPreviewMeta">Sin archivo cargado</span>
          </div>
          <div id="parserLabPreviewEmpty" class="parser-lab-empty">Carga un archivo para ver las entidades interpretadas.</div>
          <div id="parserLabPreviewContent" class="parser-lab-preview-content" hidden></div>
        </section>
      </div>
    `;

    const elements = {
      openButton: documentRef.getElementById('parserLabOpenBtn'),
      clearButton: documentRef.getElementById('parserLabClearBtn'),
      fileInput: documentRef.getElementById('parserLabFileInput'),
      filterInput: documentRef.getElementById('parserLabFilterInput'),
      summary: documentRef.getElementById('parserLabSummary'),
      sourceStep: documentRef.getElementById('parserLabSourceStep'),
      blocksStep: documentRef.getElementById('parserLabBlocksStep'),
      compositionStep: documentRef.getElementById('parserLabCompositionStep'),
      previewStep: documentRef.getElementById('parserLabPreviewStep'),
      sheetMeta: documentRef.getElementById('parserLabSheetMeta'),
      tableEmpty: documentRef.getElementById('parserLabTableEmpty'),
      tableWrap: documentRef.getElementById('parserLabTableWrap'),
      tableBody: documentRef.getElementById('parserLabTableBody'),
      blockCount: documentRef.getElementById('parserLabBlockCount'),
      defineBlockButton: documentRef.getElementById('parserLabDefineBlockBtn'),
      clearModelButton: documentRef.getElementById('parserLabClearModelBtn'),
      modelPersistence: documentRef.getElementById('parserLabModelPersistence'),
      blockList: documentRef.getElementById('parserLabBlockList'),
      compositionCount: documentRef.getElementById('parserLabCompositionCount'),
      addCompositionButton: documentRef.getElementById('parserLabAddCompositionBtn'),
      compositionList: documentRef.getElementById('parserLabCompositionList'),
      compositionForm: documentRef.getElementById('parserLabCompositionForm'),
      compositionFormTitle: documentRef.getElementById('parserLabCompositionFormTitle'),
      compositionScopeSelect: documentRef.getElementById('parserLabCompositionScopeSelect'),
      compositionOperatorSelect: documentRef.getElementById('parserLabCompositionOperatorSelect'),
      compositionValueLabel: documentRef.getElementById('parserLabCompositionValueLabel'),
      compositionValueInput: documentRef.getElementById('parserLabCompositionValueInput'),
      compositionCountInput: documentRef.getElementById('parserLabCompositionCountInput'),
      compositionTargetSelect: documentRef.getElementById('parserLabCompositionTargetSelect'),
      compositionFormError: documentRef.getElementById('parserLabCompositionFormError'),
      cancelCompositionButton: documentRef.getElementById('parserLabCancelCompositionBtn'),
      deleteCompositionButton: documentRef.getElementById('parserLabDeleteCompositionBtn'),
      blockForm: documentRef.getElementById('parserLabBlockForm'),
      blockFormTitle: documentRef.getElementById('parserLabBlockFormTitle'),
      blockNameInput: documentRef.getElementById('parserLabBlockNameInput'),
      blockColumnSelect: documentRef.getElementById('parserLabBlockColumnSelect'),
      blockOperatorSelect: documentRef.getElementById('parserLabBlockOperatorSelect'),
      blockValueInput: documentRef.getElementById('parserLabBlockValueInput'),
      blockBoldSelect: documentRef.getElementById('parserLabBlockBoldSelect'),
      blockMergedSelect: documentRef.getElementById('parserLabBlockMergedSelect'),
      blockSeparatorSelect: documentRef.getElementById('parserLabBlockSeparatorSelect'),
      blockFormError: documentRef.getElementById('parserLabBlockFormError'),
      cancelBlockButton: documentRef.getElementById('parserLabCancelBlockBtn'),
      deleteBlockButton: documentRef.getElementById('parserLabDeleteBlockBtn'),
      modelJson: documentRef.getElementById('parserLabModelJson'),
      semanticJson: documentRef.getElementById('parserLabSemanticJson'),
      previewMeta: documentRef.getElementById('parserLabPreviewMeta'),
      previewEmpty: documentRef.getElementById('parserLabPreviewEmpty'),
      previewContent: documentRef.getElementById('parserLabPreviewContent'),
      selectionMeta: documentRef.getElementById('parserLabSelectionMeta'),
      formatSummary: documentRef.getElementById('parserLabFormatSummary'),
      json: documentRef.getElementById('parserLabJson'),
    };
    const state = {
      inspection: null,
      selectedRowNumber: null,
      filter: '',
      blockDefinitions: [],
      compositionRules: [],
      blockInstances: [],
      semanticPreview: null,
      composedPreview: null,
      editingBlockId: null,
      editingCompositionId: null,
    };
    let persistenceQueue = Promise.resolve();

    async function loadTemporaryBlockModel() {
      try {
        const response = await fetchRef('/api/parser-lab/block-model');
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'No se pudo cargar el JSON temporal.');
        const definitions = payload.model && payload.model.blocks;
        const compositionRules = payload.model && payload.model.composition_rules || [];
        if (!Array.isArray(definitions)) throw new Error('El JSON temporal no contiene una lista de bloques.');
        if (!Array.isArray(compositionRules)) throw new Error('El JSON temporal no contiene una lista válida de reglas.');
        const errors = definitions.flatMap((definition) => blockModel.validateDefinition(definition));
        errors.push(...compositionRules.flatMap((rule) => blockModel.validateCompositionRule(rule)));
        if (errors.length) throw new Error(errors.join(' '));
        state.blockDefinitions = definitions.map(blockModel.normalizeDefinition);
        state.compositionRules = compositionRules.map(blockModel.normalizeCompositionRule);
        setPersistenceStatus('JSON temporal cargado', payload.path);
        render();
      } catch (error) {
        setPersistenceStatus(`Sin persistencia temporal: ${error.message}`, '', true);
      }
    }

    function persistBlockModel() {
      const model = blockModel.modelDocument(state.blockDefinitions, state.compositionRules);
      setPersistenceStatus('Guardando JSON temporal…');
      persistenceQueue = persistenceQueue.catch(() => {}).then(async () => {
        const response = await fetchRef('/api/parser-lab/block-model', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(model),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'No se pudo guardar el JSON temporal.');
        setPersistenceStatus('JSON temporal guardado', payload.path);
        return payload;
      }).catch((error) => {
        setPersistenceStatus(`Error al guardar: ${error.message}`, '', true);
        return null;
      });
      return persistenceQueue;
    }

    function setPersistenceStatus(message, path = '', isError = false) {
      elements.modelPersistence.textContent = message;
      elements.modelPersistence.title = path || message;
      elements.modelPersistence.classList.toggle('error', isError);
    }

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
        const block = blockInstanceContainingRow(row.row);
        const searchable = [
          row.row,
          ...COLUMNS.map((column) => row.values && row.values[column]),
          block && block.name,
          row.empty ? 'fila vacía división separador' : '',
          boldColumns.length ? `negrita ${boldColumns.join(' ')}` : '',
          row.merged_b_to_d ? 'combinada b:d' : '',
        ].join(' ').toLocaleLowerCase('es');
        return searchable.includes(query);
      });
    }

    function render() {
      const inspection = state.inspection;
      state.blockInstances = blockModel.findBlockInstances(
        inspection ? inspection.rows || [] : [],
        state.blockDefinitions
      );
      state.semanticPreview = blockModel.interpretModel(
        inspection ? inspection.rows || [] : [],
        state.blockInstances,
        state.blockDefinitions
      );
      state.composedPreview = blockModel.composePreview(state.semanticPreview, state.compositionRules);
      const rows = filteredRows();
      elements.clearButton.disabled = !inspection;
      elements.filterInput.disabled = !inspection;
      elements.defineBlockButton.disabled = !selectedRow() || selectedRow().empty;
      elements.clearModelButton.disabled = state.blockDefinitions.length === 0;
      elements.tableBody.replaceChildren();
      renderBlockModel();
      renderParserPreview();
      renderWorkflow();

      if (!inspection) {
        elements.summary.textContent = 'Sin archivo cargado';
        elements.sheetMeta.textContent = 'El lector todavía no ha procesado ningún archivo.';
        elements.tableEmpty.hidden = false;
        elements.tableWrap.hidden = true;
        elements.selectionMeta.textContent = 'Sin selección';
        elements.formatSummary.hidden = true;
        elements.formatSummary.replaceChildren();
        elements.json.textContent = 'Selecciona una fila para ver todos sus atributos.';
        return;
      }

      const foundBlocks = state.blockInstances.filter((instance) => instance.matched).length;
      elements.summary.textContent = `${inspection.source_kind.toUpperCase()} · ${rows.length}/${inspection.rows.length} filas · ${foundBlocks}/${state.blockDefinitions.length} bloques`;
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
      const block = blockInstanceContainingRow(row.row);
      const isBlockHeader = block && block.start_row === row.row;
      tr.tabIndex = 0;
      tr.dataset.row = String(row.row);
      tr.classList.toggle('selected', row.row === state.selectedRowNumber);
      tr.classList.toggle('parser-lab-block-range-row', Boolean(block));
      tr.classList.toggle('parser-lab-block-header-row', Boolean(isBlockHeader));
      tr.classList.toggle('parser-lab-empty-source-row', Boolean(row.empty));
      tr.setAttribute('aria-selected', row.row === state.selectedRowNumber ? 'true' : 'false');
      tr.addEventListener('click', () => selectRow(row.row));
      tr.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectRow(row.row);
        }
      });

      appendCell(tr, row.row);
      appendBlockCell(tr, block, isBlockHeader);
      if (row.empty) {
        appendEmptySourceCell(tr);
      } else {
        appendSourceCell(tr, row, 'A');
      }
      if (!row.empty && row.merged_b_to_d) {
        appendMergedCell(tr, row);
      } else if (!row.empty) {
        ['B', 'C', 'D'].forEach((column) => appendSourceCell(tr, row, column));
      }
      return tr;
    }

    function appendBlockCell(rowElement, block, isHeader) {
      const cell = documentRef.createElement('td');
      cell.className = 'parser-lab-block-cell';
      if (block) {
        const label = documentRef.createElement('span');
        label.className = isHeader ? 'parser-lab-block-badge' : 'parser-lab-block-continuation';
        label.textContent = isHeader ? block.name : `↳ ${block.name}`;
        cell.appendChild(label);
      }
      rowElement.appendChild(cell);
    }

    function appendEmptySourceCell(rowElement) {
      const cell = documentRef.createElement('td');
      const label = documentRef.createElement('span');
      cell.colSpan = 4;
      cell.className = 'parser-lab-empty-row-cell';
      label.textContent = 'Fila vacía · división interna';
      cell.appendChild(label);
      rowElement.appendChild(cell);
    }

    function appendCell(rowElement, value, className = '') {
      const cell = documentRef.createElement('td');
      if (className) cell.className = className;
      cell.textContent = String(value);
      rowElement.appendChild(cell);
    }

    function appendSourceCell(rowElement, row, column) {
      const cell = documentRef.createElement('td');
      const isBold = !!(row.bold && row.bold[column]);
      const style = row.styles && row.styles[column];
      cell.dataset.column = column;
      cell.classList.toggle('parser-lab-cell-bold', isBold);
      cell.textContent = row.values && row.values[column] || '';
      cell.title = cellDescription(column, isBold, style);
      rowElement.appendChild(cell);
    }

    function appendMergedCell(rowElement, row) {
      const cell = documentRef.createElement('td');
      const sourceColumn = ['B', 'C', 'D'].find((column) => row.values && row.values[column]) || 'B';
      const isBold = !!(row.bold && row.bold[sourceColumn]);
      const style = row.styles && row.styles[sourceColumn];
      const value = row.values && row.values[sourceColumn] || '';
      const text = documentRef.createElement('span');
      const badge = documentRef.createElement('span');
      cell.colSpan = 3;
      cell.dataset.column = 'B:D';
      cell.className = 'parser-lab-merged-cell';
      cell.classList.toggle('parser-lab-cell-bold', isBold);
      cell.title = `${cellDescription(sourceColumn, isBold, style)} · combinada de B a D`;
      text.textContent = value;
      badge.className = 'parser-lab-merged-badge';
      badge.textContent = 'B–D combinada';
      cell.append(text, badge);
      rowElement.appendChild(cell);
    }

    function cellDescription(column, isBold, style) {
      const details = [`Columna ${column}`, isBold ? 'negrita' : 'peso normal'];
      if (style !== undefined && style !== null && style !== '') details.push(`estilo ${style}`);
      return details.join(' · ');
    }

    function selectedRow() {
      return state.inspection && (state.inspection.rows || []).find((row) => row.row === state.selectedRowNumber);
    }

    function blockInstanceContainingRow(rowNumber) {
      return state.blockInstances.find((instance) => (
        instance.matched && rowNumber >= instance.start_row && rowNumber <= instance.end_row
      )) || null;
    }

    function renderBlockModel() {
      const found = state.blockInstances.filter((instance) => instance.matched).length;
      elements.blockCount.textContent = `${state.blockDefinitions.length} bloques · ${found} encontrados`;
      elements.modelJson.textContent = JSON.stringify(
        blockModel.modelDocument(state.blockDefinitions, state.compositionRules),
        null,
        2
      );
      elements.semanticJson.textContent = JSON.stringify(state.semanticPreview, null, 2);
      renderCompositionRules();
      elements.blockList.replaceChildren();
      if (!state.blockDefinitions.length) {
        const empty = documentRef.createElement('div');
        empty.className = 'parser-lab-block-empty';
        empty.textContent = 'Selecciona una fila y define la primera cabecera.';
        elements.blockList.appendChild(empty);
        return;
      }

      state.blockDefinitions.forEach((definition, index) => {
        const instance = state.blockInstances.find((candidate) => candidate.definition_id === definition.id);
        const interpreted = state.semanticPreview.blocks.find((candidate) => candidate.definition_id === definition.id);
        const item = documentRef.createElement('div');
        const order = documentRef.createElement('div');
        const content = documentRef.createElement('button');
        const title = documentRef.createElement('strong');
        const rule = documentRef.createElement('span');
        const status = documentRef.createElement('span');
        const up = documentRef.createElement('button');
        const down = documentRef.createElement('button');
        item.className = 'parser-lab-block-definition';
        item.classList.toggle('missing', !instance || !instance.matched);
        order.className = 'parser-lab-block-order';
        content.className = 'parser-lab-block-definition-main';
        content.type = 'button';
        title.textContent = definition.name;
        rule.textContent = definitionSummary(definition);
        status.className = 'parser-lab-block-status';
        status.textContent = instance && instance.matched
          ? `Fila ${instance.start_row} · ${instance.row_count} filas · ${interpreted.items.length} ítems`
          : 'No encontrada';
        content.append(title, rule, status);
        content.addEventListener('click', () => {
          if (instance && instance.matched) selectRow(instance.start_row);
          openDefinitionEditor(definition);
        });
        up.type = 'button';
        up.textContent = '↑';
        up.title = 'Subir bloque';
        up.disabled = index === 0;
        up.addEventListener('click', () => moveDefinition(index, -1));
        down.type = 'button';
        down.textContent = '↓';
        down.title = 'Bajar bloque';
        down.disabled = index === state.blockDefinitions.length - 1;
        down.addEventListener('click', () => moveDefinition(index, 1));
        order.append(up, down);
        item.append(order, content);
        elements.blockList.appendChild(item);
      });
    }

    function renderWorkflow() {
      const found = state.blockInstances.filter((instance) => instance.matched).length;
      setWorkflowStep(elements.sourceStep, Boolean(state.inspection), !state.inspection);
      setWorkflowStep(elements.blocksStep, state.blockDefinitions.length > 0 && found > 0, Boolean(state.inspection));
      setWorkflowStep(elements.compositionStep, state.compositionRules.length > 0, found > 0);
      setWorkflowStep(elements.previewStep, Boolean(state.inspection && found > 0), false);
    }

    function setWorkflowStep(element, complete, active) {
      element.classList.toggle('complete', complete);
      element.classList.toggle('active', !complete && active);
    }

    function renderCompositionRules() {
      elements.compositionCount.textContent = `${state.compositionRules.length} reglas`;
      elements.compositionList.replaceChildren();
      if (!state.compositionRules.length) {
        const empty = documentRef.createElement('div');
        empty.className = 'parser-lab-block-empty';
        empty.textContent = 'Sin agrupaciones adicionales.';
        elements.compositionList.appendChild(empty);
        return;
      }
      state.compositionRules.forEach((rule, index) => {
        const item = documentRef.createElement('div');
        const order = documentRef.createElement('div');
        const content = documentRef.createElement('button');
        const title = documentRef.createElement('strong');
        const summary = documentRef.createElement('span');
        const up = documentRef.createElement('button');
        const down = documentRef.createElement('button');
        item.className = 'parser-lab-block-definition parser-lab-composition-definition';
        order.className = 'parser-lab-block-order';
        content.className = 'parser-lab-block-definition-main';
        content.type = 'button';
        title.textContent = compositionRuleTitle(rule);
        summary.textContent = compositionRuleSummary(rule);
        content.append(title, summary);
        content.addEventListener('click', () => openCompositionEditor(rule));
        up.type = 'button';
        up.textContent = '↑';
        up.title = 'Subir regla';
        up.disabled = index === 0;
        up.addEventListener('click', () => moveCompositionRule(index, -1));
        down.type = 'button';
        down.textContent = '↓';
        down.title = 'Bajar regla';
        down.disabled = index === state.compositionRules.length - 1;
        down.addEventListener('click', () => moveCompositionRule(index, 1));
        order.append(up, down);
        item.append(order, content);
        elements.compositionList.appendChild(item);
      });
    }

    function compositionRuleTitle(rule) {
      const normalized = blockModel.normalizeCompositionRule(rule);
      return normalized.scope === 'block' ? 'Agrupar bloques' : 'Agrupar ítems';
    }

    function compositionRuleSummary(rule) {
      const normalized = blockModel.normalizeCompositionRule(rule);
      const operatorLabels = { equals: '=', contains: 'contiene', regex: 'regex' };
      const targetLabels = { group: 'grupo', page: 'página', cartela: 'cartela' };
      const fieldLabel = normalized.scope === 'block' ? 'nombre' : 'principal';
      return `${fieldLabel} ${operatorLabels[normalized.match.operator]} “${normalized.match.value}” · +${normalized.action.count} → ${targetLabels[normalized.action.target]}`;
    }

    function openNewCompositionEditor() {
      state.editingCompositionId = null;
      populateCompositionForm(blockModel.normalizeCompositionRule({
        id: uniqueCompositionId(),
        scope: 'item',
        match: { field: 'principal', operator: 'equals', value: '' },
        action: { type: 'group_next', count: 1, target: 'page' },
      }), 'Nueva regla de composición');
    }

    function openCompositionEditor(rule) {
      state.editingCompositionId = rule.id;
      populateCompositionForm(rule, 'Editar regla de composición');
    }

    function populateCompositionForm(rule, title) {
      const normalized = blockModel.normalizeCompositionRule(rule);
      closeBlockEditor();
      elements.compositionForm.hidden = false;
      elements.compositionFormTitle.textContent = title;
      elements.compositionScopeSelect.value = normalized.scope;
      elements.compositionOperatorSelect.value = normalized.match.operator;
      elements.compositionValueInput.value = normalized.match.value;
      elements.compositionCountInput.value = String(normalized.action.count);
      elements.compositionTargetSelect.value = normalized.action.target;
      elements.deleteCompositionButton.hidden = !state.editingCompositionId;
      elements.compositionFormError.hidden = true;
      updateCompositionFieldLabel();
      elements.compositionValueInput.focus();
    }

    function closeCompositionEditor() {
      state.editingCompositionId = null;
      elements.compositionForm.hidden = true;
      elements.compositionFormError.hidden = true;
    }

    function updateCompositionFieldLabel() {
      const blockScope = elements.compositionScopeSelect.value === 'block';
      elements.compositionValueLabel.textContent = blockScope ? 'Nombre del bloque' : 'Principal del ítem';
    }

    function readCompositionForm() {
      const scope = elements.compositionScopeSelect.value;
      return blockModel.normalizeCompositionRule({
        id: state.editingCompositionId || uniqueCompositionId(),
        scope,
        match: {
          field: scope === 'block' ? 'name' : 'principal',
          operator: elements.compositionOperatorSelect.value,
          value: elements.compositionValueInput.value.trim(),
        },
        action: {
          type: 'group_next',
          count: Number(elements.compositionCountInput.value),
          target: elements.compositionTargetSelect.value,
        },
      });
    }

    function saveCompositionRule(event) {
      event.preventDefault();
      const rule = readCompositionForm();
      const errors = blockModel.validateCompositionRule(rule);
      if (errors.length) {
        elements.compositionFormError.hidden = false;
        elements.compositionFormError.textContent = errors.join(' ');
        return;
      }
      const index = state.compositionRules.findIndex((candidate) => candidate.id === state.editingCompositionId);
      if (index >= 0) state.compositionRules.splice(index, 1, rule);
      else state.compositionRules.push(rule);
      closeCompositionEditor();
      render();
      persistBlockModel();
    }

    function deleteCompositionRule() {
      if (!state.editingCompositionId) return;
      state.compositionRules = state.compositionRules.filter((rule) => rule.id !== state.editingCompositionId);
      closeCompositionEditor();
      render();
      persistBlockModel();
    }

    function moveCompositionRule(index, offset) {
      const nextIndex = index + offset;
      if (nextIndex < 0 || nextIndex >= state.compositionRules.length) return;
      const [rule] = state.compositionRules.splice(index, 1);
      state.compositionRules.splice(nextIndex, 0, rule);
      render();
      persistBlockModel();
    }

    function uniqueCompositionId() {
      const existing = new Set(state.compositionRules.map((rule) => rule.id));
      let index = state.compositionRules.length + 1;
      let candidate = `composition_${String(index).padStart(2, '0')}`;
      while (existing.has(candidate)) {
        index += 1;
        candidate = `composition_${String(index).padStart(2, '0')}`;
      }
      return candidate;
    }

    function renderParserPreview() {
      const preview = state.composedPreview;
      const blockGroups = preview ? preview.block_groups || [] : [];
      const matchedBlocks = blockGroups.flatMap((group) => group.members);
      const itemCount = matchedBlocks.reduce((total, block) => total + block.items.length, 0);
      elements.previewContent.replaceChildren();
      elements.previewMeta.textContent = state.inspection
        ? `${matchedBlocks.length} bloques · ${itemCount} ítems`
        : 'Sin archivo cargado';
      elements.previewEmpty.hidden = Boolean(state.inspection && matchedBlocks.length);
      elements.previewContent.hidden = !state.inspection || !matchedBlocks.length;
      if (!state.inspection) {
        elements.previewEmpty.textContent = 'Carga un archivo para ver las entidades interpretadas.';
        return;
      }
      if (!matchedBlocks.length) {
        elements.previewEmpty.textContent = 'Ninguna cabecera del modelo se ha encontrado en este archivo.';
        return;
      }

      blockGroups.forEach((group) => {
        const container = documentRef.createElement('div');
        container.className = `parser-lab-preview-block-group${group.target ? ` composed ${group.target}` : ''}`;
        if (group.target) {
          const label = documentRef.createElement('div');
          label.className = 'parser-lab-preview-composition-label';
          label.textContent = `${compositionTargetLabel(group.target)} · ${group.members.length} bloques`;
          container.appendChild(label);
        }
        group.members.forEach((block) => container.appendChild(renderPreviewBlock(block)));
        elements.previewContent.appendChild(container);
      });
    }

    function renderPreviewBlock(block) {
      const section = documentRef.createElement('section');
      const heading = documentRef.createElement('div');
      const title = documentRef.createElement('h3');
      const meta = documentRef.createElement('span');
      const items = documentRef.createElement('div');
      section.className = 'parser-lab-preview-block';
      heading.className = 'parser-lab-preview-block-heading';
      title.textContent = block.name;
      meta.textContent = `Filas ${block.start_row}–${block.end_row} · ${block.items.length} ítems`;
      heading.append(title, meta);
      items.className = 'parser-lab-preview-items';
      if (!block.items.length) {
        const empty = documentRef.createElement('div');
        empty.className = 'parser-lab-preview-no-items';
        empty.textContent = 'Bloque válido sin entidades interpretadas.';
        items.appendChild(empty);
      } else {
        let itemIndex = 0;
        block.item_groups.forEach((group) => {
          if (group.target) {
            const wrapper = documentRef.createElement('div');
            const label = documentRef.createElement('div');
            wrapper.className = `parser-lab-preview-item-group ${group.target}`;
            label.className = 'parser-lab-preview-composition-label';
            label.textContent = `${compositionTargetLabel(group.target)} · ${group.members.length} ítems`;
            wrapper.appendChild(label);
            group.members.forEach((item) => {
              wrapper.appendChild(renderPreviewItem(item, itemIndex));
              itemIndex += 1;
            });
            items.appendChild(wrapper);
            return;
          }
          const item = group.members[0];
          items.appendChild(renderPreviewItem(item, itemIndex));
          if (item.separator_after) items.appendChild(renderPreviewSeparator(item.separator_after));
          itemIndex += 1;
        });
      }
      section.append(heading, items);
      return section;
    }

    function compositionTargetLabel(target) {
      return { group: 'Grupo', page: 'Página', cartela: 'Cartela' }[target] || target;
    }

    function renderPreviewItem(item, index) {
      const card = documentRef.createElement('button');
      const order = documentRef.createElement('span');
      const principal = documentRef.createElement('strong');
      const associated = documentRef.createElement('div');
      const source = documentRef.createElement('span');
      card.type = 'button';
      card.className = 'parser-lab-preview-item';
      order.className = 'parser-lab-preview-item-order';
      order.textContent = String(index + 1).padStart(2, '0');
      principal.textContent = item.principal;
      associated.className = 'parser-lab-preview-associated';
      if (item.associated.length) {
        item.associated.forEach((value) => {
          const entry = documentRef.createElement('span');
          entry.textContent = value;
          associated.appendChild(entry);
        });
      } else {
        const empty = documentRef.createElement('em');
        empty.textContent = 'Sin valores asociados';
        associated.appendChild(empty);
      }
      source.className = 'parser-lab-preview-source';
      source.textContent = sourceRowsLabel(item.source_rows);
      card.append(order, principal, associated, source);
      if (item.source_rows.length) card.addEventListener('click', () => selectRow(item.source_rows[0]));
      return card;
    }

    function renderPreviewSeparator(meaning) {
      const separator = documentRef.createElement('div');
      const labels = {
        item: 'Siguiente ítem',
        group: 'Salto de grupo',
        page: 'Salto de página',
      };
      separator.className = `parser-lab-preview-separator ${meaning}`;
      separator.textContent = labels[meaning] || meaning;
      return separator;
    }

    function sourceRowsLabel(rows) {
      if (!rows.length) return 'Sin fila de origen';
      if (rows.length === 1) return `Fila ${rows[0]}`;
      return `Filas ${rows[0]}–${rows[rows.length - 1]}`;
    }

    function definitionSummary(definition) {
      const header = definition.header;
      const operatorLabels = {
        equals: '=',
        contains: 'contiene',
        regex: 'regex',
        nonempty: 'no vacía',
      };
      const parts = [`${header.column} ${operatorLabels[header.operator]}`];
      if (header.operator !== 'nonempty') parts.push(`“${header.value}”`);
      if (header.bold === 'required') parts.push('negrita');
      if (header.bold === 'forbidden') parts.push('sin negrita');
      if (header.merged_b_to_d === 'required') parts.push('B–D combinada');
      if (header.merged_b_to_d === 'forbidden') parts.push('no combinada');
      const separatorLabels = { item: 'separa ítems', group: 'salto de grupo', page: 'salto de página' };
      const normalized = blockModel.normalizeDefinition(definition);
      parts.push(separatorLabels[normalized.interpretation.separator.meaning]);
      return parts.join(' · ');
    }

    function openNewBlockEditor() {
      const row = selectedRow();
      if (!row) return;
      const draft = blockModel.definitionFromRow(row, state.blockDefinitions.length);
      draft.id = uniqueBlockId(draft.id);
      state.editingBlockId = null;
      populateBlockForm(draft, `Nueva cabecera desde fila ${row.row}`);
    }

    function openDefinitionEditor(definition) {
      state.editingBlockId = definition.id;
      populateBlockForm(definition, 'Editar cabecera');
    }

    function populateBlockForm(definition, title) {
      const normalized = blockModel.normalizeDefinition(definition);
      closeCompositionEditor();
      elements.blockForm.hidden = false;
      elements.blockFormTitle.textContent = title;
      elements.blockNameInput.value = normalized.name;
      elements.blockColumnSelect.value = normalized.header.column;
      elements.blockOperatorSelect.value = normalized.header.operator;
      elements.blockValueInput.value = normalized.header.value || '';
      elements.blockBoldSelect.value = normalized.header.bold;
      elements.blockMergedSelect.value = normalized.header.merged_b_to_d;
      elements.blockSeparatorSelect.value = normalized.interpretation.separator.meaning;
      elements.deleteBlockButton.hidden = !state.editingBlockId;
      elements.blockFormError.hidden = true;
      updateBlockValueInput();
      elements.blockNameInput.focus();
    }

    function closeBlockEditor() {
      state.editingBlockId = null;
      elements.blockForm.hidden = true;
      elements.blockFormError.hidden = true;
    }

    function readBlockForm() {
      return {
        id: state.editingBlockId || uniqueBlockId(`block_${String(state.blockDefinitions.length + 1).padStart(2, '0')}`),
        name: elements.blockNameInput.value.trim(),
        header: {
          column: elements.blockColumnSelect.value,
          operator: elements.blockOperatorSelect.value,
          value: elements.blockValueInput.value.trim(),
          bold: elements.blockBoldSelect.value,
          merged_b_to_d: elements.blockMergedSelect.value,
        },
        interpretation: {
          type: 'principal_with_associated_values',
          traversal: 'row_major',
          split_cell_lines: true,
          separator: {
            condition: 'empty_row',
            meaning: elements.blockSeparatorSelect.value,
            collapse_consecutive: true,
          },
        },
      };
    }

    function saveBlockDefinition(event) {
      event.preventDefault();
      const definition = readBlockForm();
      const errors = blockModel.validateDefinition(definition);
      if (errors.length) {
        elements.blockFormError.hidden = false;
        elements.blockFormError.textContent = errors.join(' ');
        return;
      }
      const index = state.blockDefinitions.findIndex((candidate) => candidate.id === state.editingBlockId);
      if (index >= 0) state.blockDefinitions.splice(index, 1, definition);
      else state.blockDefinitions.push(definition);
      closeBlockEditor();
      render();
      persistBlockModel();
    }

    function deleteBlockDefinition() {
      if (!state.editingBlockId) return;
      state.blockDefinitions = state.blockDefinitions.filter((definition) => definition.id !== state.editingBlockId);
      closeBlockEditor();
      render();
      persistBlockModel();
    }

    function moveDefinition(index, offset) {
      const nextIndex = index + offset;
      if (nextIndex < 0 || nextIndex >= state.blockDefinitions.length) return;
      const [definition] = state.blockDefinitions.splice(index, 1);
      state.blockDefinitions.splice(nextIndex, 0, definition);
      render();
      persistBlockModel();
    }

    function clearBlockModel() {
      if (!state.blockDefinitions.length) return;
      if (root.confirm && !root.confirm('¿Vaciar todas las definiciones de bloques del laboratorio?')) return;
      state.blockDefinitions = [];
      closeBlockEditor();
      render();
      persistBlockModel();
    }

    function updateBlockValueInput() {
      const disabled = elements.blockOperatorSelect.value === 'nonempty';
      elements.blockValueInput.disabled = disabled;
      if (disabled) elements.blockValueInput.value = '';
    }

    function uniqueBlockId(baseId) {
      const existing = new Set(state.blockDefinitions.map((definition) => definition.id));
      if (!existing.has(baseId)) return baseId;
      let suffix = 2;
      while (existing.has(`${baseId}_${suffix}`)) suffix += 1;
      return `${baseId}_${suffix}`;
    }

    function selectRow(rowNumber) {
      state.selectedRowNumber = rowNumber;
      const row = selectedRow();
      elements.defineBlockButton.disabled = !row || row.empty;
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
        elements.formatSummary.hidden = true;
        elements.formatSummary.replaceChildren();
        elements.json.textContent = 'Selecciona una fila para ver todos sus atributos.';
        return;
      }
      elements.selectionMeta.textContent = `Fila ${selected.row}`;
      renderFormatSummary(selected);
      elements.json.textContent = JSON.stringify(selected, null, 2);
    }

    function renderFormatSummary(row) {
      const boldColumns = COLUMNS.filter((column) => row.bold && row.bold[column]);
      const styledColumns = COLUMNS.filter((column) => row.styles && row.styles[column] !== undefined);
      const block = blockInstanceContainingRow(row.row);
      elements.formatSummary.hidden = false;
      elements.formatSummary.replaceChildren(
        formatSummaryRow('Bloque', [block ? `${block.name} · ${block.start_row}–${block.end_row}` : 'Sin bloque definido']),
        formatSummaryRow('Contenido', [row.empty ? 'Fila vacía · división interna' : 'Fila con datos']),
        formatSummaryRow('Negrita', boldColumns.length ? boldColumns : ['Ninguna']),
        formatSummaryRow('Combinación', [row.merged_b_to_d ? 'B–D' : 'Celdas separadas']),
        formatSummaryRow(
          'Estilos de origen',
          styledColumns.length ? styledColumns.map((column) => `${column} · ${row.styles[column]}`) : ['Sin estilo registrado']
        )
      );
    }

    function formatSummaryRow(label, values) {
      const rowElement = documentRef.createElement('div');
      const labelElement = documentRef.createElement('span');
      const valuesElement = documentRef.createElement('div');
      rowElement.className = 'parser-lab-format-row';
      labelElement.className = 'parser-lab-format-label';
      labelElement.textContent = label;
      valuesElement.className = 'parser-lab-format-values';
      values.forEach((value) => {
        const chip = documentRef.createElement('span');
        chip.className = 'parser-lab-format-chip';
        chip.textContent = value;
        valuesElement.appendChild(chip);
      });
      rowElement.append(labelElement, valuesElement);
      return rowElement;
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
    elements.defineBlockButton.addEventListener('click', openNewBlockEditor);
    elements.clearModelButton.addEventListener('click', clearBlockModel);
    elements.addCompositionButton.addEventListener('click', openNewCompositionEditor);
    elements.blockForm.addEventListener('submit', saveBlockDefinition);
    elements.compositionForm.addEventListener('submit', saveCompositionRule);
    elements.cancelBlockButton.addEventListener('click', closeBlockEditor);
    elements.deleteBlockButton.addEventListener('click', deleteBlockDefinition);
    elements.cancelCompositionButton.addEventListener('click', closeCompositionEditor);
    elements.deleteCompositionButton.addEventListener('click', deleteCompositionRule);
    elements.blockOperatorSelect.addEventListener('change', updateBlockValueInput);
    elements.compositionScopeSelect.addEventListener('change', updateCompositionFieldLabel);
    elements.fileInput.addEventListener('change', () => {
      const file = elements.fileInput.files && elements.fileInput.files[0];
      if (file) inspectFile(file);
    });
    elements.filterInput.addEventListener('input', () => {
      state.filter = elements.filterInput.value;
      render();
    });
    render();
    loadTemporaryBlockModel();

    return { clearInspection, inspectFile, loadTemporaryBlockModel, persistBlockModel, render, state };
  }

  root.CreditosParserLabUi = { initializeParserLab };
  if (root.CreditosParserLabBlockModel) {
    initializeParserLab();
  } else {
    const script = root.document.createElement('script');
    script.src = './parser_lab/block_model.js';
    script.addEventListener('load', () => initializeParserLab(), { once: true });
    script.addEventListener('error', () => {
      const rootElement = root.document.getElementById('parserLabRoot');
      if (rootElement) rootElement.textContent = 'No se pudo cargar el modelo aislado de bloques.';
    }, { once: true });
    root.document.head.appendChild(script);
  }
})(globalThis);
