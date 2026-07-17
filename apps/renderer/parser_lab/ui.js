(function (root) {
  const COLUMNS = ['A', 'B', 'C', 'D'];
  const RESIZABLE_NORMALIZED_COLUMNS = ['block', ...COLUMNS];
  const MIN_NORMALIZED_COLUMN_WIDTH = 56;
  const MAX_NORMALIZED_COLUMN_WIDTH = 900;

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
        <div id="parserLabWorkspace" class="parser-lab-workspace">
          <div id="parserLabLeftPane" class="parser-lab-left-pane">
          <section class="parser-lab-table-panel" aria-label="Filas normalizadas">
            <div class="parser-lab-panel-heading">
              <h2>Filas normalizadas</h2>
              <span id="parserLabSheetMeta">El lector todavía no ha procesado ningún archivo.</span>
            </div>
            <div id="parserLabTableEmpty" class="parser-lab-empty">Carga un archivo para inspeccionar las columnas A–D antes de aplicar reglas de modelo.</div>
            <div id="parserLabTableWrap" class="parser-lab-table-wrap" hidden>
              <table id="parserLabNormalizedTable" class="parser-lab-table">
                <colgroup>
                  <col class="parser-lab-row-column">
                  <col class="parser-lab-block-column" data-normalized-column="block">
                  <col data-normalized-column="A">
                  <col data-normalized-column="B">
                  <col data-normalized-column="C">
                  <col data-normalized-column="D">
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">Fila</th>
                    ${normalizedColumnHeader('block', 'Bloque')}
                    ${normalizedColumnHeader('A', 'A')}
                    ${normalizedColumnHeader('B', 'B')}
                    ${normalizedColumnHeader('C', 'C')}
                    ${normalizedColumnHeader('D', 'D')}
                  </tr>
                </thead>
                <tbody id="parserLabTableBody"></tbody>
              </table>
            </div>
          </section>
          <div class="parser-lab-splitter horizontal" data-split="left" role="separator" aria-orientation="horizontal" tabindex="0"></div>
          <section class="parser-lab-preview-panel" aria-label="Previo simple del parser">
            <div class="parser-lab-panel-heading">
              <h2>Previo del parser</h2>
              <span id="parserLabPreviewMeta">Sin archivo cargado</span>
            </div>
            <div id="parserLabPreviewEmpty" class="parser-lab-empty">Carga un archivo para ver las entidades interpretadas.</div>
            <div id="parserLabPreviewContent" class="parser-lab-preview-content" hidden></div>
          </section>
          </div>
          <div class="parser-lab-splitter vertical" data-split="workspace" role="separator" aria-orientation="vertical" tabindex="0"></div>
          <aside class="parser-lab-right-panel" aria-label="Inspector y documentos JSON">
            <div class="parser-lab-right-tabs" role="tablist">
              <button class="active" type="button" role="tab" aria-selected="true" data-right-tab="inspector">Inspector</button>
              <button type="button" role="tab" aria-selected="false" data-right-tab="jsons">JSONs</button>
            </div>
            <div id="parserLabInspectorPane" class="parser-lab-right-tab-pane active" data-right-pane="inspector">
              <section class="parser-lab-selection-panel" aria-label="Fila seleccionada">
                <div class="parser-lab-panel-heading">
                  <h2>Fila seleccionada</h2>
                  <span id="parserLabSelectionMeta">Sin selección</span>
                </div>
                <div class="parser-lab-block-toolbar">
                  <button id="parserLabDefineBlockBtn" type="button" disabled>Definir fila como cabecera</button>
                  <span id="parserLabModelPersistence" class="parser-lab-model-persistence">Cargando JSON local…</span>
                </div>
                <div id="parserLabFormatSummary" class="parser-lab-format-summary" hidden></div>
              </section>
              <div class="parser-lab-splitter horizontal" data-split="inspector" role="separator" aria-orientation="horizontal" tabindex="0"></div>
          <section class="parser-lab-block-panel" aria-label="Modelo manual de bloques">
            <div class="parser-lab-panel-heading">
              <h2>Editor de bloques</h2>
              <span id="parserLabBlockCount">0 bloques</span>
            </div>
            <div class="parser-lab-block-editor-workspace">
              <div class="parser-lab-block-reorder" aria-label="Reordenar bloque activo">
                <button id="parserLabMoveBlockUpBtn" type="button" title="Subir bloque" disabled>↑</button>
                <button id="parserLabMoveBlockDownBtn" type="button" title="Bajar bloque" disabled>↓</button>
              </div>
              <div id="parserLabBlockList" class="parser-lab-block-list" role="tablist" aria-orientation="vertical">
              <div class="parser-lab-block-empty">Selecciona una fila y define la primera cabecera.</div>
              </div>
              <div class="parser-lab-block-editor-content">
                <div id="parserLabBlockEditorEmpty" class="parser-lab-block-empty">Selecciona una cabecera para editarla.</div>
                <div id="parserLabCompositionEditor" hidden>
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
                </div>
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
              <label>
                <span>El contenido empieza</span>
                <select id="parserLabBlockContentStartSelect" class="text-input">
                  <option value="after_header">Después de la cabecera</option>
                  <option value="header">En la propia fila de cabecera</option>
                </select>
              </label>
              <label>
                <span>Orientación</span>
                <select id="parserLabBlockOrientationSelect" class="text-input">
                  <option value="vertical">Vertical · términos hacia abajo</option>
                  <option value="horizontal">Horizontal · términos en línea</option>
                </select>
              </label>
              <label>
                <span>Primer término / ítem único</span>
                <select id="parserLabBlockFirstRoleSelect" class="text-input">
                  ${termRoleOptions()}
                </select>
              </label>
              <label>
                <span>Crear ítems</span>
                <select id="parserLabBlockGroupingSelect" class="text-input">
                  <option value="empty_rows">Hasta una fila vacía</option>
                  <option value="row">Uno por fila</option>
                  <option value="first_term">Hasta encontrar otro primer término</option>
                </select>
              </label>
              <label id="parserLabBlockStartColumnField" hidden>
                <span>Columna del primer término · inicia otro ítem</span>
                <select id="parserLabBlockStartColumnSelect" class="text-input">
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </label>
              <label>
                <span>Términos asociados</span>
                <select id="parserLabBlockFollowingRoleSelect" class="text-input">
                  ${termRoleOptions()}
                </select>
              </label>
              <div class="parser-lab-empty-row-rules">
                <div class="parser-lab-form-title">Filas vacías</div>
                ${emptyRowPolicyFields('Leading', 'Cabecera → primer ítem')}
                ${emptyRowPolicyFields('Between', 'Entre ítems')}
                ${emptyRowPolicyFields('Trailing', 'Último ítem → siguiente bloque')}
              </div>
              <p class="parser-lab-rule-note">La orientación controla la colocación. «Crear ítems» decide sus fronteras. El rol del primer término es también el rol tipográfico del ítem, especialmente cuando solo contiene un valor.</p>
              <div id="parserLabBlockFormError" class="parser-lab-form-error" hidden></div>
            </form>
              </div>
            </div>
          </section>
            </div>
            <div id="parserLabJsonsPane" class="parser-lab-right-tab-pane" data-right-pane="jsons" hidden>
              <div class="parser-lab-json-tabs" role="tablist">
                <button class="active" type="button" role="tab" aria-selected="true" data-json-tab="row">Fila</button>
                <button type="button" role="tab" aria-selected="false" data-json-tab="inspection">Inspección</button>
                <button type="button" role="tab" aria-selected="false" data-json-tab="model">Modelo</button>
                <button type="button" role="tab" aria-selected="false" data-json-tab="semantic">Semántico</button>
                <button type="button" role="tab" aria-selected="false" data-json-tab="composed">Compuesto</button>
              </div>
              <pre id="parserLabJson" class="parser-lab-json-tab-document active" data-json-document="row">Selecciona una fila para ver todos sus atributos.</pre>
              <pre id="parserLabInspectionJson" class="parser-lab-json-tab-document" data-json-document="inspection" hidden></pre>
              <pre id="parserLabModelJson" class="parser-lab-json-tab-document" data-json-document="model" hidden></pre>
              <pre id="parserLabSemanticJson" class="parser-lab-json-tab-document" data-json-document="semantic" hidden></pre>
              <pre id="parserLabComposedJson" class="parser-lab-json-tab-document" data-json-document="composed" hidden></pre>
            </div>
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
      sourceStep: documentRef.getElementById('parserLabSourceStep'),
      blocksStep: documentRef.getElementById('parserLabBlocksStep'),
      compositionStep: documentRef.getElementById('parserLabCompositionStep'),
      previewStep: documentRef.getElementById('parserLabPreviewStep'),
      sheetMeta: documentRef.getElementById('parserLabSheetMeta'),
      tableEmpty: documentRef.getElementById('parserLabTableEmpty'),
      tableWrap: documentRef.getElementById('parserLabTableWrap'),
      normalizedTable: documentRef.getElementById('parserLabNormalizedTable'),
      tableBody: documentRef.getElementById('parserLabTableBody'),
      workspace: documentRef.getElementById('parserLabWorkspace'),
      leftPane: documentRef.getElementById('parserLabLeftPane'),
      inspectorPane: documentRef.getElementById('parserLabInspectorPane'),
      blockCount: documentRef.getElementById('parserLabBlockCount'),
      defineBlockButton: documentRef.getElementById('parserLabDefineBlockBtn'),
      modelPersistence: documentRef.getElementById('parserLabModelPersistence'),
      moveBlockUpButton: documentRef.getElementById('parserLabMoveBlockUpBtn'),
      moveBlockDownButton: documentRef.getElementById('parserLabMoveBlockDownBtn'),
      blockList: documentRef.getElementById('parserLabBlockList'),
      blockEditorEmpty: documentRef.getElementById('parserLabBlockEditorEmpty'),
      compositionEditor: documentRef.getElementById('parserLabCompositionEditor'),
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
      blockContentStartSelect: documentRef.getElementById('parserLabBlockContentStartSelect'),
      blockOrientationSelect: documentRef.getElementById('parserLabBlockOrientationSelect'),
      blockGroupingSelect: documentRef.getElementById('parserLabBlockGroupingSelect'),
      blockStartColumnField: documentRef.getElementById('parserLabBlockStartColumnField'),
      blockStartColumnSelect: documentRef.getElementById('parserLabBlockStartColumnSelect'),
      blockFirstRoleSelect: documentRef.getElementById('parserLabBlockFirstRoleSelect'),
      blockFollowingRoleSelect: documentRef.getElementById('parserLabBlockFollowingRoleSelect'),
      blockLeadingEffectSelect: documentRef.getElementById('parserLabBlockLeadingEffectSelect'),
      blockLeadingDisplaySelect: documentRef.getElementById('parserLabBlockLeadingDisplaySelect'),
      blockBetweenEffectSelect: documentRef.getElementById('parserLabBlockBetweenEffectSelect'),
      blockBetweenDisplaySelect: documentRef.getElementById('parserLabBlockBetweenDisplaySelect'),
      blockTrailingEffectSelect: documentRef.getElementById('parserLabBlockTrailingEffectSelect'),
      blockTrailingDisplaySelect: documentRef.getElementById('parserLabBlockTrailingDisplaySelect'),
      blockFormError: documentRef.getElementById('parserLabBlockFormError'),
      modelJson: documentRef.getElementById('parserLabModelJson'),
      semanticJson: documentRef.getElementById('parserLabSemanticJson'),
      composedJson: documentRef.getElementById('parserLabComposedJson'),
      inspectionJson: documentRef.getElementById('parserLabInspectionJson'),
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
      normalizedRowsView: { column_widths: {} },
      blockInstances: [],
      semanticPreview: null,
      composedPreview: null,
      editingBlockId: null,
      editingCompositionId: null,
      activeEditorTab: null,
      activePreviewBlockId: null,
      activeRightTab: 'inspector',
      activeJsonTab: 'row',
    };
    let persistenceQueue = Promise.resolve();
    let blockEditTimer = null;
    let draggedBlockId = null;

    function termRoleOptions() {
      return `
        <option value="principal">Principal · Nombre</option>
        <option value="secondary">Secundario · Cargo</option>`;
    }

    function normalizedColumnHeader(column, label) {
      return `<th scope="col" data-normalized-column="${column}"><span class="parser-lab-column-label">${label}</span><span class="parser-lab-column-resizer" data-normalized-column-resizer="${column}" role="separator" aria-label="Cambiar ancho de la columna ${label}" aria-orientation="vertical" tabindex="0"></span></th>`;
    }

    function emptyRowPolicyFields(prefix, label) {
      return `
        <fieldset class="parser-lab-empty-row-policy">
          <legend>${label}</legend>
          <div class="parser-lab-form-grid">
            <label>
              <span>Efecto</span>
              <select id="parserLabBlock${prefix}EffectSelect" class="text-input">
                <option value="continue">Continuar el mismo ítem</option>
                <option value="item">Siguiente ítem</option>
                <option value="group">Salto de grupo</option>
                <option value="page">Salto de página</option>
              </select>
            </label>
            <label>
              <span>Espacio</span>
              <select id="parserLabBlock${prefix}DisplaySelect" class="text-input">
                <option value="ignore">Ignorar</option>
                <option value="compact">Compactar a una fila</option>
                <option value="preserve">Respetar filas originales</option>
              </select>
            </label>
          </div>
        </fieldset>`;
    }

    function setEmptyRowPolicyFields(prefix, policy) {
      elements[`block${prefix}EffectSelect`].value = policy.effect;
      elements[`block${prefix}DisplaySelect`].value = policy.display;
    }

    function readEmptyRowPolicyFields(prefix) {
      return {
        effect: elements[`block${prefix}EffectSelect`].value,
        display: elements[`block${prefix}DisplaySelect`].value,
      };
    }

    async function loadTemporaryBlockModel() {
      try {
        const response = await fetchRef('/api/parser-lab/block-model');
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'No se pudo cargar el JSON temporal.');
        const definitions = payload.model && payload.model.blocks;
        const compositionRules = payload.model && payload.model.composition_rules;
        const normalizedRowsView = payload.model && payload.model.normalized_rows_view;
        if (!Array.isArray(definitions)) throw new Error('El JSON temporal no contiene una lista de bloques.');
        if (!Array.isArray(compositionRules)) throw new Error('El JSON temporal no contiene una lista válida de reglas.');
        if (!normalizedRowsView || !normalizedRowsView.column_widths || typeof normalizedRowsView.column_widths !== 'object') {
          throw new Error('El JSON temporal no contiene la vista de filas normalizadas.');
        }
        const errors = definitions.flatMap((definition) => blockModel.validateDefinition(definition));
        errors.push(...compositionRules.flatMap((rule) => blockModel.validateCompositionRule(rule)));
        if (errors.length) throw new Error(errors.join(' '));
        state.blockDefinitions = definitions.map(blockModel.normalizeDefinition);
        state.compositionRules = compositionRules.map(blockModel.normalizeCompositionRule);
        state.normalizedRowsView = {
          column_widths: { ...normalizedRowsView.column_widths },
        };
        setPersistenceStatus('JSON local cargado', payload.path);
        render();
      } catch (error) {
        setPersistenceStatus(`Sin persistencia local: ${error.message}`, '', true);
      }
    }

    function persistBlockModel() {
      const model = blockModel.modelDocument(
        state.blockDefinitions,
        state.compositionRules,
        state.normalizedRowsView
      );
      elements.modelJson.textContent = JSON.stringify(model, null, 2);
      setPersistenceStatus('Guardando JSON local…');
      persistenceQueue = persistenceQueue.catch(() => {}).then(async () => {
        const response = await fetchRef('/api/parser-lab/block-model', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(model),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'No se pudo guardar el JSON temporal.');
        setPersistenceStatus('JSON local guardado', payload.path);
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
      elements.inspectionJson.textContent = JSON.stringify(inspection, null, 2);
      elements.composedJson.textContent = JSON.stringify(state.composedPreview, null, 2);
      const rows = filteredRows();
      elements.clearButton.disabled = !inspection;
      elements.filterInput.disabled = !inspection;
      updateHeaderAction();
      elements.tableBody.replaceChildren();
      renderBlockModel();
      renderParserPreview();
      renderWorkflow();

      if (!inspection) {
        applyNormalizedRowsView();
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
      applyNormalizedRowsView();
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
      cell.dataset.normalizedColumn = 'block';
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
      cell.dataset.normalizedColumn = column;
      cell.classList.toggle('parser-lab-cell-bold', isBold);
      cell.textContent = row.values && row.values[column] || '';
      cell.title = cellDescription(column, isBold, style);
      rowElement.appendChild(cell);
    }

    function applyNormalizedRowsView() {
      const widths = state.normalizedRowsView.column_widths;
      let totalWidth = 64;
      let hasCompleteWidths = true;
      RESIZABLE_NORMALIZED_COLUMNS.forEach((column) => {
        const width = widths[column];
        const col = elements.normalizedTable.querySelector(`col[data-normalized-column="${column}"]`);
        if (Number.isFinite(width)) {
          col.style.width = `${width}px`;
          totalWidth += width;
        } else {
          col.style.width = '';
          hasCompleteWidths = false;
        }
      });
      elements.normalizedTable.style.width = hasCompleteWidths ? `${totalWidth}px` : '';
    }

    function currentNormalizedColumnWidths() {
      return Object.fromEntries(RESIZABLE_NORMALIZED_COLUMNS.map((column) => {
        const header = elements.normalizedTable.querySelector(`th[data-normalized-column="${column}"]`);
        return [column, clamp(Math.round(header.getBoundingClientRect().width), MIN_NORMALIZED_COLUMN_WIDTH, MAX_NORMALIZED_COLUMN_WIDTH)];
      }));
    }

    function resizeNormalizedColumn(column, width, baseWidths) {
      state.normalizedRowsView = {
        column_widths: {
          ...baseWidths,
          [column]: clamp(Math.round(width), MIN_NORMALIZED_COLUMN_WIDTH, MAX_NORMALIZED_COLUMN_WIDTH),
        },
      };
      applyNormalizedRowsView();
    }

    function beginNormalizedColumnResize(column, event) {
      if (!RESIZABLE_NORMALIZED_COLUMNS.includes(column)) return;
      event.preventDefault();
      event.stopPropagation();
      const baseWidths = currentNormalizedColumnWidths();
      const startX = event.clientX;
      const startWidth = baseWidths[column];
      elements.normalizedTable.classList.add('resizing-columns');
      resizeNormalizedColumn(column, startWidth, baseWidths);
      const move = (moveEvent) => resizeNormalizedColumn(
        column,
        startWidth + moveEvent.clientX - startX,
        baseWidths
      );
      const stop = () => {
        documentRef.removeEventListener('pointermove', move);
        documentRef.removeEventListener('pointerup', stop);
        documentRef.removeEventListener('pointercancel', stop);
        elements.normalizedTable.classList.remove('resizing-columns');
        persistBlockModel();
      };
      documentRef.addEventListener('pointermove', move);
      documentRef.addEventListener('pointerup', stop);
      documentRef.addEventListener('pointercancel', stop);
    }

    function resizeNormalizedColumnWithKeyboard(column, event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const widths = currentNormalizedColumnWidths();
      resizeNormalizedColumn(column, widths[column] + (event.key === 'ArrowRight' ? 16 : -16), widths);
      persistBlockModel();
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
      const enabled = state.blockDefinitions.filter((definition) => definition.enabled).length;
      elements.blockCount.textContent = `${state.blockDefinitions.length} cabeceras · ${enabled} incluidas · ${found} encontradas`;
      elements.modelJson.textContent = JSON.stringify(
        blockModel.modelDocument(
          state.blockDefinitions,
          state.compositionRules,
          state.normalizedRowsView
        ),
        null,
        2
      );
      elements.semanticJson.textContent = JSON.stringify(state.semanticPreview, null, 2);
      elements.composedJson.textContent = JSON.stringify(state.composedPreview, null, 2);
      renderCompositionRules();
      elements.blockList.replaceChildren();
      state.blockDefinitions.forEach((definition, index) => {
        const instance = state.blockInstances.find((candidate) => candidate.definition_id === definition.id);
        const interpreted = state.semanticPreview.blocks.find((candidate) => candidate.definition_id === definition.id);
        const item = documentRef.createElement('div');
        const content = documentRef.createElement('span');
        const title = documentRef.createElement('strong');
        const status = documentRef.createElement('span');
        const include = documentRef.createElement('input');
        item.className = 'parser-lab-block-tab';
        item.tabIndex = 0;
        item.draggable = true;
        item.dataset.blockId = definition.id;
        item.title = 'Arrastra esta pestaña sobre otra para copiar sus ajustes.';
        item.setAttribute('role', 'tab');
        item.setAttribute('aria-selected', String(definition.id === state.activeEditorTab));
        item.classList.toggle('missing', !instance || !instance.matched);
        item.classList.toggle('active', definition.id === state.activeEditorTab);
        item.classList.toggle('ignored', !definition.enabled);
        content.className = 'parser-lab-block-tab-copy';
        title.textContent = definition.name;
        status.className = 'parser-lab-block-status';
        status.textContent = instance && instance.matched
          ? `Fila ${instance.start_row} · ${interpreted.items.length} ítems`
          : 'No encontrada';
        content.append(title, status);
        include.type = 'checkbox';
        include.draggable = false;
        include.checked = definition.enabled;
        include.title = include.checked ? 'Bloque incluido en el previo' : 'Bloque ignorado; su cabecera sigue siendo una frontera';
        include.setAttribute('aria-label', `Incluir ${definition.name} en el previo`);
        include.addEventListener('click', (event) => event.stopPropagation());
        include.addEventListener('change', () => {
          definition.enabled = include.checked;
          render();
          persistBlockModel();
        });
        item.append(content, include);
        item.addEventListener('click', () => {
          if (instance && instance.matched) selectRow(instance.start_row, true);
          else {
            state.activeEditorTab = definition.id;
            state.activePreviewBlockId = null;
            openDefinitionEditor(definition);
            renderBlockModel();
            renderParserPreview();
          }
          setRightTab('inspector');
        });
        item.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          item.click();
        });
        item.addEventListener('dragstart', (event) => {
          draggedBlockId = definition.id;
          item.classList.add('dragging');
          if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'copy';
            event.dataTransfer.setData('text/plain', definition.id);
          }
        });
        item.addEventListener('dragover', (event) => {
          if (!draggedBlockId || draggedBlockId === definition.id) return;
          event.preventDefault();
          item.classList.add('drop-target');
          if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
        });
        item.addEventListener('dragleave', () => item.classList.remove('drop-target'));
        item.addEventListener('drop', (event) => {
          event.preventDefault();
          item.classList.remove('drop-target');
          copyBlockSettings(draggedBlockId, definition.id);
        });
        item.addEventListener('dragend', () => {
          draggedBlockId = null;
          elements.blockList.querySelectorAll('.dragging, .drop-target').forEach((tab) => {
            tab.classList.remove('dragging', 'drop-target');
          });
        });
        elements.blockList.appendChild(item);
      });

      const compositionTab = documentRef.createElement('button');
      const compositionCopy = documentRef.createElement('span');
      const compositionTitle = documentRef.createElement('strong');
      const compositionStatus = documentRef.createElement('span');
      compositionTab.type = 'button';
      compositionTab.className = 'parser-lab-block-tab parser-lab-composition-tab';
      compositionTab.classList.toggle('active', state.activeEditorTab === 'composition');
      compositionTab.setAttribute('role', 'tab');
      compositionTab.setAttribute('aria-selected', String(state.activeEditorTab === 'composition'));
      compositionCopy.className = 'parser-lab-block-tab-copy';
      compositionTitle.textContent = 'Composición';
      compositionStatus.textContent = `${state.compositionRules.length} reglas`;
      compositionCopy.append(compositionTitle, compositionStatus);
      compositionTab.append(compositionCopy);
      compositionTab.addEventListener('click', showCompositionEditor);
      elements.blockList.appendChild(compositionTab);
      updateBlockReorderControls();
    }

    function updateBlockReorderControls() {
      const index = state.blockDefinitions.findIndex((definition) => definition.id === state.activeEditorTab);
      elements.moveBlockUpButton.disabled = index <= 0;
      elements.moveBlockDownButton.disabled = index < 0 || index >= state.blockDefinitions.length - 1;
    }

    function copyBlockSettings(sourceId, targetId) {
      draggedBlockId = null;
      if (!sourceId || !targetId || sourceId === targetId) return;
      const source = state.blockDefinitions.find((definition) => definition.id === sourceId);
      const targetIndex = state.blockDefinitions.findIndex((definition) => definition.id === targetId);
      if (!source || targetIndex < 0) return;
      const target = state.blockDefinitions[targetIndex];
      const accepted = !root.confirm || root.confirm(
        `¿Copiar los ajustes de “${source.name}” a “${target.name}”? La cabecera y el nombre de “${target.name}” se conservarán.`
      );
      if (!accepted) return;
      const updated = blockModel.copyDefinitionSettings(target, source);
      state.blockDefinitions.splice(targetIndex, 1, updated);
      state.activeEditorTab = updated.id;
      state.activePreviewBlockId = updated.id;
      const instance = state.blockInstances.find((candidate) => candidate.definition_id === updated.id);
      render();
      if (instance && instance.matched) selectRow(instance.start_row, true);
      else openDefinitionEditor(updated);
      persistBlockModel();
    }

    function showCompositionEditor() {
      state.activeEditorTab = 'composition';
      state.editingBlockId = null;
      elements.blockForm.hidden = true;
      elements.blockEditorEmpty.hidden = true;
      elements.compositionEditor.hidden = false;
      renderBlockModel();
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
      showCompositionEditor();
      state.editingCompositionId = null;
      populateCompositionForm(blockModel.normalizeCompositionRule({
        id: uniqueCompositionId(),
        scope: 'item',
        match: { field: 'principal', operator: 'equals', value: '' },
        action: { type: 'group_next', count: 1, target: 'page' },
      }), 'Nueva regla de composición');
    }

    function openCompositionEditor(rule) {
      showCompositionEditor();
      state.editingCompositionId = rule.id;
      populateCompositionForm(rule, 'Editar regla de composición');
    }

    function populateCompositionForm(rule, title) {
      const normalized = blockModel.normalizeCompositionRule(rule);
      state.editingBlockId = null;
      elements.blockForm.hidden = true;
      elements.blockEditorEmpty.hidden = true;
      elements.compositionEditor.hidden = false;
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

    function previewScrollPosition() {
      const tabs = elements.previewContent.querySelector('.parser-lab-preview-tabs');
      const items = elements.previewContent.querySelector('.parser-lab-preview-items');
      return {
        tabs: tabs ? { top: tabs.scrollTop, left: tabs.scrollLeft } : null,
        items: items ? { top: items.scrollTop, left: items.scrollLeft } : null,
      };
    }

    function restorePreviewScrollPosition(position) {
      if (!position) return;
      const tabs = elements.previewContent.querySelector('.parser-lab-preview-tabs');
      const items = elements.previewContent.querySelector('.parser-lab-preview-items');
      if (tabs && position.tabs) {
        tabs.scrollTop = position.tabs.top;
        tabs.scrollLeft = position.tabs.left;
      }
      if (items && position.items) {
        items.scrollTop = position.items.top;
        items.scrollLeft = position.items.left;
      }
    }

    function renderParserPreview({ preserveScroll = false } = {}) {
      const scrollPosition = preserveScroll ? previewScrollPosition() : null;
      const preview = state.composedPreview;
      const blockGroups = preview ? preview.block_groups || [] : [];
      const composedEntries = blockGroups.flatMap((group) => group.members.map((block) => ({ block, group })));
      const matchedBlocks = state.semanticPreview
        ? state.semanticPreview.blocks.filter((block) => block.matched)
        : [];
      const enabledBlocks = matchedBlocks.filter((block) => block.enabled);
      const itemCount = enabledBlocks.reduce((total, block) => total + block.items.length, 0);
      elements.previewContent.replaceChildren();
      elements.previewMeta.textContent = state.inspection
        ? `${matchedBlocks.length} bloques · ${enabledBlocks.length} incluidos · ${itemCount} ítems`
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

      const tabEntries = matchedBlocks.map((semanticBlock) => {
        const composedEntry = composedEntries.find((entry) => (
          entry.block.definition_id === semanticBlock.definition_id
        ));
        return composedEntry || {
          block: { ...semanticBlock, item_groups: [] },
          group: { target: null, members: [semanticBlock] },
        };
      });
      if (!tabEntries.some((entry) => entry.block.definition_id === state.activePreviewBlockId)) {
        state.activePreviewBlockId = null;
      }
      const tabs = documentRef.createElement('div');
      tabs.className = 'parser-lab-preview-tabs';
      tabs.setAttribute('role', 'tablist');
      tabs.setAttribute('aria-orientation', 'vertical');
      tabEntries.forEach(({ block }) => {
        const button = documentRef.createElement('button');
        const copy = documentRef.createElement('span');
        const name = documentRef.createElement('strong');
        const status = documentRef.createElement('span');
        const active = block.definition_id === state.activePreviewBlockId;
        button.type = 'button';
        button.className = `parser-lab-preview-tab${active ? ' active' : ''}`;
        button.classList.toggle('ignored', !block.enabled);
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-selected', String(active));
        copy.className = 'parser-lab-block-tab-copy';
        name.textContent = block.name;
        status.textContent = block.enabled ? `${block.items.length} ítems` : 'Ignorado';
        copy.append(name, status);
        button.append(copy);
        button.addEventListener('click', () => {
          const instance = state.blockInstances.find((candidate) => candidate.definition_id === block.definition_id);
          if (instance && instance.matched) selectRow(instance.start_row, true);
          setRightTab('inspector');
        });
        tabs.appendChild(button);
      });
      elements.previewContent.appendChild(tabs);

      const activeEntry = tabEntries.find((entry) => entry.block.definition_id === state.activePreviewBlockId);
      if (!activeEntry) {
        const prompt = documentRef.createElement('div');
        prompt.className = 'parser-lab-preview-no-items';
        prompt.textContent = 'Selecciona una fila dentro de un bloque o una pestaña para ver su interpretación.';
        elements.previewContent.appendChild(prompt);
        restorePreviewScrollPosition(scrollPosition);
        return;
      }
      const container = documentRef.createElement('div');
      container.className = `parser-lab-preview-block-group${activeEntry.group.target ? ` composed ${activeEntry.group.target}` : ''}`;
      if (activeEntry.group.target) {
        const label = documentRef.createElement('div');
        label.className = 'parser-lab-preview-composition-label';
        label.textContent = `${compositionTargetLabel(activeEntry.group.target)} · ${activeEntry.group.members.length} bloques`;
        container.appendChild(label);
      }
      container.appendChild(renderPreviewBlock(activeEntry.block));
      elements.previewContent.appendChild(container);
      restorePreviewScrollPosition(scrollPosition);
    }

    function renderPreviewBlock(block) {
      const section = documentRef.createElement('section');
      const heading = documentRef.createElement('div');
      const identity = documentRef.createElement('div');
      const title = documentRef.createElement('h3');
      const meta = documentRef.createElement('span');
      const navigation = documentRef.createElement('div');
      const startButton = documentRef.createElement('button');
      const endButton = documentRef.createElement('button');
      const items = documentRef.createElement('div');
      section.className = 'parser-lab-preview-block';
      heading.className = 'parser-lab-preview-block-heading';
      title.textContent = block.name;
      meta.textContent = `Filas ${block.start_row}–${block.end_row} · ${block.items.length} ítems`;
      identity.className = 'parser-lab-preview-block-identity';
      identity.append(title, meta);
      navigation.className = 'parser-lab-preview-block-navigation';
      startButton.type = 'button';
      startButton.textContent = '↑ Inicio';
      startButton.title = `Ir a la fila ${block.start_row}, principio de ${block.name}`;
      startButton.addEventListener('click', () => selectRow(block.start_row, true));
      endButton.type = 'button';
      endButton.textContent = '↓ Final';
      endButton.title = `Ir a la fila ${block.end_row}, final de ${block.name}`;
      endButton.addEventListener('click', () => selectRow(block.end_row, true));
      navigation.append(startButton, endButton);
      heading.append(identity, navigation);
      items.className = 'parser-lab-preview-items';
      if (!block.enabled) {
        section.classList.add('ignored');
        meta.textContent = `Filas ${block.start_row}–${block.end_row} · frontera conservada`;
        const ignored = documentRef.createElement('div');
        ignored.className = 'parser-lab-preview-no-items';
        ignored.textContent = 'Bloque ignorado. Su cabecera sigue delimitando los bloques vecinos.';
        items.appendChild(ignored);
        section.append(heading, items);
        return section;
      }
      if (shouldRenderEmptyBoundary(block.leading_empty_rows)) {
        items.appendChild(renderPreviewSeparator(block.leading_empty_rows, 'Iniciales'));
      }
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
              if (shouldRenderEmptyBoundary(item.empty_rows_after)) {
                wrapper.appendChild(renderPreviewSeparator(item.empty_rows_after));
              }
              itemIndex += 1;
            });
            items.appendChild(wrapper);
            return;
          }
          const item = group.members[0];
          items.appendChild(renderPreviewItem(item, itemIndex));
          if (shouldRenderEmptyBoundary(item.empty_rows_after)) {
            items.appendChild(renderPreviewSeparator(item.empty_rows_after));
          }
          itemIndex += 1;
        });
      }
      if (shouldRenderEmptyBoundary(block.trailing_empty_rows)) {
        items.appendChild(renderPreviewSeparator(block.trailing_empty_rows, 'Finales'));
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
      const termsContainer = documentRef.createElement('div');
      const source = documentRef.createElement('span');
      card.type = 'button';
      card.className = `parser-lab-preview-item ${item.orientation || 'vertical'}`;
      order.className = 'parser-lab-preview-item-order';
      order.textContent = String(index + 1).padStart(2, '0');
      termsContainer.className = 'parser-lab-preview-terms';
      const terms = item.terms;
      terms.forEach((term) => {
        const entry = documentRef.createElement('span');
        entry.className = `parser-lab-preview-term ${term.role}`;
        entry.textContent = term.value;
        termsContainer.appendChild(entry);
      });
      source.className = 'parser-lab-preview-source';
      source.textContent = sourceRowsLabel(item.source_rows);
      card.append(order, termsContainer, source);
      if (item.source_rows.length) card.addEventListener('click', () => selectRow(item.source_rows[0], true));
      return card;
    }

    function renderPreviewSeparator(boundary, positionLabel = '') {
      const separator = documentRef.createElement('div');
      const labels = {
        continue: 'Continúa el mismo ítem',
        item: 'Siguiente ítem',
        group: 'Salto de grupo',
        page: 'Salto de página',
      };
      const displayLabels = {
        ignore: 'espacio ignorado',
        compact: '1 fila',
        preserve: `${boundary.output_count} filas`,
      };
      separator.className = `parser-lab-preview-separator ${boundary.effect} ${boundary.display}`;
      separator.textContent = [
        positionLabel,
        labels[boundary.effect] || boundary.effect,
        displayLabels[boundary.display],
      ].filter(Boolean).join(' · ');
      return separator;
    }

    function shouldRenderEmptyBoundary(boundary) {
      return Boolean(boundary && (boundary.effect !== 'continue' || boundary.display !== 'ignore'));
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
      const effectLabels = { continue: 'continúa', item: 'siguiente ítem', group: 'grupo', page: 'página' };
      const displayLabels = { ignore: 'ignora hueco', compact: 'compacta a 1', preserve: 'respeta hueco' };
      const normalized = blockModel.normalizeDefinition(definition);
      const policies = normalized.interpretation.empty_rows;
      const orientationLabels = {
        vertical: 'vertical',
        horizontal: 'horizontal',
      };
      const groupingLabels = {
        empty_rows: 'ítems hasta fila vacía',
        row: 'un ítem por fila',
        first_term: `ítems hasta otro primer término en ${normalized.interpretation.item_start_column}`,
      };
      parts.push(orientationLabels[normalized.interpretation.orientation]);
      parts.push(normalized.interpretation.content_start === 'header'
        ? 'contenido desde cabecera'
        : 'contenido después de cabecera');
      parts.push(groupingLabels[normalized.interpretation.item_grouping]);
      parts.push(`roles: ${normalized.interpretation.term_roles.first} → ${normalized.interpretation.term_roles.following}`);
      parts.push(`inicio: ${effectLabels[policies.leading.effect]}/${displayLabels[policies.leading.display]}`);
      parts.push(`entre: ${effectLabels[policies.between_items.effect]}/${displayLabels[policies.between_items.display]}`);
      parts.push(`final: ${effectLabels[policies.trailing.effect]}/${displayLabels[policies.trailing.display]}`);
      return parts.join(' · ');
    }

    function openDefinitionEditor(definition) {
      state.activeEditorTab = definition.id;
      state.editingBlockId = definition.id;
      populateBlockForm(definition, 'Editar cabecera');
    }

    function populateBlockForm(definition, title) {
      const normalized = blockModel.normalizeDefinition(definition);
      closeCompositionEditor();
      elements.compositionEditor.hidden = true;
      elements.blockEditorEmpty.hidden = true;
      elements.blockForm.hidden = false;
      elements.blockFormTitle.textContent = title;
      elements.blockNameInput.value = normalized.name;
      elements.blockColumnSelect.value = normalized.header.column;
      elements.blockOperatorSelect.value = normalized.header.operator;
      elements.blockValueInput.value = normalized.header.value || '';
      elements.blockBoldSelect.value = normalized.header.bold;
      elements.blockMergedSelect.value = normalized.header.merged_b_to_d;
      elements.blockContentStartSelect.value = normalized.interpretation.content_start;
      elements.blockOrientationSelect.value = normalized.interpretation.orientation;
      elements.blockGroupingSelect.value = normalized.interpretation.item_grouping;
      elements.blockStartColumnSelect.value = normalized.interpretation.item_start_column;
      elements.blockFirstRoleSelect.value = normalized.interpretation.term_roles.first;
      elements.blockFollowingRoleSelect.value = normalized.interpretation.term_roles.following;
      setEmptyRowPolicyFields('Leading', normalized.interpretation.empty_rows.leading);
      setEmptyRowPolicyFields('Between', normalized.interpretation.empty_rows.between_items);
      setEmptyRowPolicyFields('Trailing', normalized.interpretation.empty_rows.trailing);
      elements.blockFormError.hidden = true;
      updateBlockValueInput();
      updateOrientationFields();
    }

    function closeBlockEditor() {
      state.editingBlockId = null;
      elements.blockForm.hidden = true;
      elements.blockFormError.hidden = true;
      if (state.activeEditorTab !== 'composition') elements.blockEditorEmpty.hidden = false;
    }

    function readBlockForm() {
      const current = state.blockDefinitions.find((definition) => definition.id === state.editingBlockId);
      return {
        id: state.editingBlockId || uniqueBlockId(`block_${String(state.blockDefinitions.length + 1).padStart(2, '0')}`),
        name: elements.blockNameInput.value.trim(),
        enabled: current ? current.enabled : true,
        header: {
          column: elements.blockColumnSelect.value,
          operator: elements.blockOperatorSelect.value,
          value: elements.blockValueInput.value.trim(),
          bold: elements.blockBoldSelect.value,
          merged_b_to_d: elements.blockMergedSelect.value,
        },
        interpretation: {
          type: 'principal_with_associated_values',
          content_start: elements.blockContentStartSelect.value,
          orientation: elements.blockOrientationSelect.value,
          item_grouping: elements.blockGroupingSelect.value,
          item_start_column: elements.blockStartColumnSelect.value,
          traversal: 'row_major',
          split_cell_lines: true,
          term_roles: {
            first: elements.blockFirstRoleSelect.value,
            following: elements.blockFollowingRoleSelect.value,
          },
          empty_rows: {
            leading: readEmptyRowPolicyFields('Leading'),
            between_items: readEmptyRowPolicyFields('Between'),
            trailing: readEmptyRowPolicyFields('Trailing'),
          },
        },
      };
    }

    function applyLiveBlockDefinition(event) {
      if (event) event.preventDefault();
      if (!state.editingBlockId) return;
      if (blockEditTimer) root.clearTimeout(blockEditTimer);
      blockEditTimer = null;
      const definition = readBlockForm();
      const errors = blockModel.validateDefinition(definition);
      if (errors.length) {
        elements.blockFormError.hidden = false;
        elements.blockFormError.textContent = errors.join(' ');
        return;
      }
      const index = state.blockDefinitions.findIndex((candidate) => candidate.id === state.editingBlockId);
      if (index < 0) return;
      state.blockDefinitions.splice(index, 1, definition);
      elements.blockFormError.hidden = true;
      render();
      persistBlockModel();
    }

    function scheduleLiveBlockDefinition() {
      if (blockEditTimer) root.clearTimeout(blockEditTimer);
      blockEditTimer = root.setTimeout(applyLiveBlockDefinition, 320);
    }

    function moveDefinition(index, offset) {
      const nextIndex = index + offset;
      if (nextIndex < 0 || nextIndex >= state.blockDefinitions.length) return;
      const [definition] = state.blockDefinitions.splice(index, 1);
      state.blockDefinitions.splice(nextIndex, 0, definition);
      render();
      persistBlockModel();
    }

    function moveActiveDefinition(offset) {
      const index = state.blockDefinitions.findIndex((definition) => definition.id === state.activeEditorTab);
      if (index >= 0) moveDefinition(index, offset);
    }

    function updateBlockValueInput() {
      const disabled = elements.blockOperatorSelect.value === 'nonempty';
      elements.blockValueInput.disabled = disabled;
      if (disabled) elements.blockValueInput.value = '';
    }

    function updateOrientationFields() {
      elements.blockStartColumnField.hidden = elements.blockGroupingSelect.value !== 'first_term';
    }

    function uniqueBlockId(baseId) {
      const existing = new Set(state.blockDefinitions.map((definition) => definition.id));
      if (!existing.has(baseId)) return baseId;
      let suffix = 2;
      while (existing.has(`${baseId}_${suffix}`)) suffix += 1;
      return `${baseId}_${suffix}`;
    }

    function selectedHeaderDefinition() {
      const instance = state.blockInstances.find((candidate) => (
        candidate.matched && candidate.start_row === state.selectedRowNumber
      ));
      return instance
        ? state.blockDefinitions.find((definition) => definition.id === instance.definition_id) || null
        : null;
    }

    function updateHeaderAction() {
      const row = selectedRow();
      const header = selectedHeaderDefinition();
      elements.defineBlockButton.disabled = !row || row.empty;
      elements.defineBlockButton.textContent = header ? 'Eliminar cabecera' : 'Definir como cabecera';
      elements.defineBlockButton.classList.toggle('parser-lab-context-danger', Boolean(header));
      elements.defineBlockButton.title = header
        ? 'Elimina esta frontera y une su rango con el bloque anterior.'
        : 'Crea inmediatamente una frontera de bloque desde esta fila.';
    }

    function handleHeaderAction() {
      const row = selectedRow();
      if (!row || row.empty) return;
      const existing = selectedHeaderDefinition();
      if (existing) {
        const accepted = !root.confirm || root.confirm(
          `¿Eliminar la cabecera “${existing.name}”? Dejará de actuar como frontera y los rangos contiguos se unirán.`
        );
        if (!accepted) return;
        state.blockDefinitions = state.blockDefinitions.filter((definition) => definition.id !== existing.id);
        if (state.activeEditorTab === existing.id) state.activeEditorTab = null;
        if (state.activePreviewBlockId === existing.id) state.activePreviewBlockId = null;
        closeBlockEditor();
        render();
        persistBlockModel();
        return;
      }
      const definition = blockModel.definitionFromRow(row, state.blockDefinitions.length);
      definition.id = uniqueBlockId(definition.id);
      state.blockDefinitions.push(definition);
      state.activeEditorTab = definition.id;
      state.activePreviewBlockId = definition.id;
      state.editingBlockId = definition.id;
      render();
      openDefinitionEditor(definition);
      persistBlockModel();
    }

    function selectRow(rowNumber, reveal = false) {
      state.selectedRowNumber = rowNumber;
      const instance = blockInstanceContainingRow(rowNumber);
      if (instance) {
        const definition = state.blockDefinitions.find((candidate) => candidate.id === instance.definition_id);
        state.activeEditorTab = instance.definition_id;
        state.activePreviewBlockId = instance.definition_id;
        if (definition) openDefinitionEditor(definition);
      } else {
        state.activeEditorTab = null;
        state.activePreviewBlockId = null;
        closeBlockEditor();
        elements.compositionEditor.hidden = true;
      }
      updateHeaderAction();
      Array.from(elements.tableBody.rows).forEach((rowElement) => {
        const selected = Number(rowElement.dataset.row) === rowNumber;
        rowElement.classList.toggle('selected', selected);
        rowElement.setAttribute('aria-selected', selected ? 'true' : 'false');
        if (selected && reveal) rowElement.scrollIntoView({ block: 'center' });
      });
      renderSelection();
      renderBlockModel();
      renderParserPreview({ preserveScroll: true });
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

    function setRightTab(tabName) {
      state.activeRightTab = tabName;
      documentRef.querySelectorAll('[data-right-tab]').forEach((button) => {
        const active = button.dataset.rightTab === tabName;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', String(active));
      });
      documentRef.querySelectorAll('[data-right-pane]').forEach((pane) => {
        const active = pane.dataset.rightPane === tabName;
        pane.classList.toggle('active', active);
        pane.hidden = !active;
      });
    }

    function setJsonTab(tabName) {
      state.activeJsonTab = tabName;
      documentRef.querySelectorAll('[data-json-tab]').forEach((button) => {
        const active = button.dataset.jsonTab === tabName;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', String(active));
      });
      documentRef.querySelectorAll('[data-json-document]').forEach((documentElement) => {
        const active = documentElement.dataset.jsonDocument === tabName;
        documentElement.classList.toggle('active', active);
        documentElement.hidden = !active;
      });
    }

    function setupSplitters() {
      documentRef.querySelectorAll('.parser-lab-splitter').forEach((splitter) => {
        splitter.addEventListener('pointerdown', (event) => beginResize(splitter, event));
      });
    }

    function beginResize(splitter, event) {
      event.preventDefault();
      const split = splitter.dataset.split;
      const target = split === 'workspace' ? elements.workspace : split === 'left' ? elements.leftPane : elements.inspectorPane;
      const rect = target.getBoundingClientRect();
      const move = (moveEvent) => {
        if (split === 'workspace') {
          const percentage = clamp(((moveEvent.clientX - rect.left) / rect.width) * 100, 38, 78);
          target.style.setProperty('--parser-lab-left-size', `${percentage}%`);
        } else {
          const percentage = clamp(((moveEvent.clientY - rect.top) / rect.height) * 100, 22, 78);
          const variable = split === 'left' ? '--parser-lab-table-size' : '--parser-lab-selection-size';
          target.style.setProperty(variable, `${percentage}%`);
        }
      };
      const stop = () => {
        documentRef.removeEventListener('pointermove', move);
        documentRef.removeEventListener('pointerup', stop);
      };
      documentRef.addEventListener('pointermove', move);
      documentRef.addEventListener('pointerup', stop);
    }

    function clamp(value, minimum, maximum) {
      return Math.max(minimum, Math.min(maximum, value));
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
    elements.defineBlockButton.addEventListener('click', handleHeaderAction);
    elements.moveBlockUpButton.addEventListener('click', () => moveActiveDefinition(-1));
    elements.moveBlockDownButton.addEventListener('click', () => moveActiveDefinition(1));
    elements.addCompositionButton.addEventListener('click', openNewCompositionEditor);
    elements.blockForm.addEventListener('submit', applyLiveBlockDefinition);
    elements.compositionForm.addEventListener('submit', saveCompositionRule);
    elements.cancelCompositionButton.addEventListener('click', closeCompositionEditor);
    elements.deleteCompositionButton.addEventListener('click', deleteCompositionRule);
    elements.blockNameInput.addEventListener('input', scheduleLiveBlockDefinition);
    elements.blockValueInput.addEventListener('input', scheduleLiveBlockDefinition);
    [
      elements.blockColumnSelect,
      elements.blockBoldSelect,
      elements.blockMergedSelect,
      elements.blockContentStartSelect,
      elements.blockOrientationSelect,
      elements.blockStartColumnSelect,
      elements.blockFirstRoleSelect,
      elements.blockFollowingRoleSelect,
      elements.blockLeadingEffectSelect,
      elements.blockLeadingDisplaySelect,
      elements.blockBetweenEffectSelect,
      elements.blockBetweenDisplaySelect,
      elements.blockTrailingEffectSelect,
      elements.blockTrailingDisplaySelect,
    ].forEach((select) => select.addEventListener('change', applyLiveBlockDefinition));
    elements.blockGroupingSelect.addEventListener('change', () => {
      updateOrientationFields();
      applyLiveBlockDefinition();
    });
    elements.blockOperatorSelect.addEventListener('change', () => {
      updateBlockValueInput();
      applyLiveBlockDefinition();
    });
    elements.compositionScopeSelect.addEventListener('change', updateCompositionFieldLabel);
    elements.fileInput.addEventListener('change', () => {
      const file = elements.fileInput.files && elements.fileInput.files[0];
      if (file) inspectFile(file);
    });
    elements.filterInput.addEventListener('input', () => {
      state.filter = elements.filterInput.value;
      render();
    });
    documentRef.querySelectorAll('[data-right-tab]').forEach((button) => {
      button.addEventListener('click', () => setRightTab(button.dataset.rightTab));
    });
    documentRef.querySelectorAll('[data-json-tab]').forEach((button) => {
      button.addEventListener('click', () => setJsonTab(button.dataset.jsonTab));
    });
    documentRef.querySelectorAll('[data-normalized-column-resizer]').forEach((resizer) => {
      const column = resizer.dataset.normalizedColumnResizer;
      resizer.addEventListener('pointerdown', (event) => beginNormalizedColumnResize(column, event));
      resizer.addEventListener('keydown', (event) => resizeNormalizedColumnWithKeyboard(column, event));
    });
    setupSplitters();
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
