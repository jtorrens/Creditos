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
    const uiSupport = root.CreditosParserLabUiSupport;
    if (!uiSupport) throw new Error('No se ha cargado el soporte aislado de interfaz del Parser Lab.');

    rootElement.innerHTML = `
      <div class="parser-lab-shell">
        <div class="parser-lab-toolbar">
          <div class="parser-lab-model-library" aria-label="Conjunto de reglas activo">
            <label for="parserLabModelSelect">Modelo</label>
            <select id="parserLabModelSelect" class="text-input" disabled>
              <option>Cargando modelos…</option>
            </select>
            <button id="parserLabCreateModelBtn" type="button" disabled>Crear</button>
            <button id="parserLabDuplicateModelBtn" type="button" disabled>Duplicar</button>
            <button id="parserLabRenameModelBtn" type="button" disabled>Renombrar</button>
            <button id="parserLabDeleteModelBtn" class="parser-lab-subtle-danger" type="button" disabled>Borrar</button>
          </div>
          <div class="parser-lab-file-actions">
            <button id="parserLabOpenBtn" type="button" disabled>Cargar ODS/XLSX</button>
            <button id="parserLabClearBtn" type="button" disabled>Limpiar</button>
            <input id="parserLabFileInput" class="hidden-input" type="file" accept=".ods,.xlsx,application/vnd.oasis.opendocument.spreadsheet,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">
            <div id="parserLabSourceContext" class="parser-lab-source-context" data-origin="none">
              <span id="parserLabSourceOrigin" class="parser-lab-source-origin">Sin archivo</span>
              <span id="parserLabSourceName" class="parser-lab-source-name">No hay una fuente cargada.</span>
            </div>
          </div>
          <label class="parser-lab-filter" for="parserLabFilterInput">
            <span>Filtrar</span>
            <input id="parserLabFilterInput" class="text-input" type="search" placeholder="Fila, contenido, negrita o combinada…" disabled>
          </label>
          <div id="parserLabSummary" class="parser-lab-summary">Sin archivo cargado</div>
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
          <div class="parser-lab-splitter horizontal" data-split="left" role="separator" aria-label="Redimensionar filas y previo" aria-orientation="horizontal" tabindex="0"></div>
          <section class="parser-lab-preview-panel" aria-label="Previo simple del parser">
            <div class="parser-lab-panel-heading">
              <h2>Previo del parser</h2>
              <span id="parserLabPreviewMeta">Sin archivo cargado</span>
            </div>
            <div id="parserLabPreviewEmpty" class="parser-lab-empty">Carga un archivo para ver las entidades interpretadas.</div>
            <div id="parserLabPreviewContent" class="parser-lab-preview-content" hidden></div>
          </section>
          </div>
          <div class="parser-lab-splitter vertical" data-split="workspace" role="separator" aria-label="Redimensionar tabla e inspector" aria-orientation="vertical" tabindex="0"></div>
          <aside class="parser-lab-right-panel" aria-label="Inspector y documentos JSON">
            <div class="parser-lab-right-tabs" role="tablist" aria-label="Vista lateral">
              <button id="parserLabRightTabInspector" class="active" type="button" role="tab" aria-selected="true" aria-controls="parserLabInspectorPane" data-right-tab="inspector">Inspector</button>
              <button id="parserLabRightTabJsons" type="button" role="tab" aria-selected="false" aria-controls="parserLabJsonsPane" data-right-tab="jsons">JSONs</button>
            </div>
            <div id="parserLabInspectorPane" class="parser-lab-right-tab-pane active" role="tabpanel" aria-labelledby="parserLabRightTabInspector" data-right-pane="inspector">
              <section class="parser-lab-selection-panel" aria-label="Fila seleccionada">
                <div class="parser-lab-panel-heading">
                  <h2>Fila seleccionada</h2>
                  <span id="parserLabSelectionMeta">Sin selección</span>
                </div>
                <div class="parser-lab-block-toolbar">
                  <button id="parserLabDefineBlockBtn" type="button" disabled>Definir fila como cabecera</button>
                  <span id="parserLabModelPersistence" class="parser-lab-model-persistence" role="status" aria-live="polite">Cargando biblioteca local…</span>
                </div>
                <div id="parserLabFormatSummary" class="parser-lab-format-summary" hidden></div>
              </section>
              <div class="parser-lab-splitter horizontal" data-split="inspector" role="separator" aria-label="Redimensionar fila seleccionada y editor" aria-orientation="horizontal" tabindex="0"></div>
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
              <div class="parser-lab-block-navigation">
                <label class="parser-lab-block-filter" for="parserLabBlockFilterInput">
                  <span>Buscar bloque</span>
                  <input id="parserLabBlockFilterInput" class="text-input" type="search" placeholder="Nombre o estado…">
                </label>
                <div id="parserLabBlockList" class="parser-lab-block-list" role="tablist" aria-label="Bloques del modelo" aria-orientation="vertical">
                  <div class="parser-lab-block-empty">Selecciona una fila y define la primera cabecera.</div>
                </div>
                <label class="parser-lab-block-copy-control" for="parserLabCopyBlockTargetSelect">
                  <span>Copiar ajustes del activo</span>
                  <select id="parserLabCopyBlockTargetSelect" class="text-input" disabled>
                    <option value="">Elegir destino…</option>
                  </select>
                </label>
              </div>
              <div id="parserLabBlockEditorRegion" class="parser-lab-block-editor-content" role="tabpanel">
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
              <label>
                <span>Inicio del bloque</span>
                <select id="parserLabBlockHeaderSourceSelect" class="text-input">
                  <option value="match">Cabecera que coincide</option>
                  <option value="sheet_start">Primera fila de la hoja</option>
                  <option value="after_previous">Fila siguiente a la frontera anterior</option>
                  <option value="sheet_end">Última fila de la hoja</option>
                </select>
              </label>
              <div id="parserLabBlockHeaderMatchFields" class="parser-lab-boundary-match-fields">
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
              </div>
              <p id="parserLabBlockStructuralBoundaryNote" class="parser-lab-rule-note" hidden></p>
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
                <p id="parserLabBetweenPolicyNote" class="parser-lab-rule-note"></p>
              </div>
              <p class="parser-lab-rule-note">La orientación controla la colocación. «Crear ítems» decide sus fronteras. El rol del primer término es también el rol tipográfico del ítem, especialmente cuando solo contiene un valor.</p>
              <div id="parserLabBlockFormError" class="parser-lab-form-error" hidden></div>
            </form>
              </div>
            </div>
          </section>
            </div>
            <div id="parserLabJsonsPane" class="parser-lab-right-tab-pane" role="tabpanel" aria-labelledby="parserLabRightTabJsons" data-right-pane="jsons" hidden>
              <div class="parser-lab-json-tabs" role="tablist" aria-label="Documento JSON">
                <button id="parserLabJsonTabRow" class="active" type="button" role="tab" aria-selected="true" aria-controls="parserLabJson" data-json-tab="row">Fila</button>
                <button id="parserLabJsonTabInspection" type="button" role="tab" aria-selected="false" aria-controls="parserLabInspectionJson" data-json-tab="inspection">Inspección</button>
                <button id="parserLabJsonTabModel" type="button" role="tab" aria-selected="false" aria-controls="parserLabModelJson" data-json-tab="model">Modelo</button>
                <button id="parserLabJsonTabSemantic" type="button" role="tab" aria-selected="false" aria-controls="parserLabSemanticJson" data-json-tab="semantic">Semántico</button>
                <button id="parserLabJsonTabComposed" type="button" role="tab" aria-selected="false" aria-controls="parserLabComposedJson" data-json-tab="composed">Compuesto</button>
              </div>
              <pre id="parserLabJson" class="parser-lab-json-tab-document active" role="tabpanel" aria-labelledby="parserLabJsonTabRow" data-json-document="row">Selecciona una fila para ver todos sus atributos.</pre>
              <pre id="parserLabInspectionJson" class="parser-lab-json-tab-document" role="tabpanel" aria-labelledby="parserLabJsonTabInspection" data-json-document="inspection" hidden></pre>
              <pre id="parserLabModelJson" class="parser-lab-json-tab-document" role="tabpanel" aria-labelledby="parserLabJsonTabModel" data-json-document="model" hidden></pre>
              <pre id="parserLabSemanticJson" class="parser-lab-json-tab-document" role="tabpanel" aria-labelledby="parserLabJsonTabSemantic" data-json-document="semantic" hidden></pre>
              <pre id="parserLabComposedJson" class="parser-lab-json-tab-document" role="tabpanel" aria-labelledby="parserLabJsonTabComposed" data-json-document="composed" hidden></pre>
            </div>
          </aside>
        </div>
      </div>
      <div id="parserLabModelDialogBackdrop" class="parser-lab-model-dialog-backdrop" hidden>
        <form id="parserLabModelDialog" class="parser-lab-model-dialog" role="dialog" aria-modal="true" aria-labelledby="parserLabModelDialogTitle">
          <h3 id="parserLabModelDialogTitle">Modelo</h3>
          <p id="parserLabModelDialogMessage"></p>
          <label id="parserLabModelDialogNameField">
            <span>Nombre</span>
            <input id="parserLabModelDialogNameInput" class="text-input" type="text" autocomplete="off">
          </label>
          <div class="parser-lab-model-dialog-actions">
            <button id="parserLabModelDialogCancelBtn" type="button">Cancelar</button>
            <button id="parserLabModelDialogConfirmBtn" type="submit">Aceptar</button>
          </div>
        </form>
      </div>
    `;

    const elements = {
      openButton: documentRef.getElementById('parserLabOpenBtn'),
      clearButton: documentRef.getElementById('parserLabClearBtn'),
      modelSelect: documentRef.getElementById('parserLabModelSelect'),
      createModelButton: documentRef.getElementById('parserLabCreateModelBtn'),
      duplicateModelButton: documentRef.getElementById('parserLabDuplicateModelBtn'),
      renameModelButton: documentRef.getElementById('parserLabRenameModelBtn'),
      deleteModelButton: documentRef.getElementById('parserLabDeleteModelBtn'),
      modelDialogBackdrop: documentRef.getElementById('parserLabModelDialogBackdrop'),
      modelDialog: documentRef.getElementById('parserLabModelDialog'),
      modelDialogTitle: documentRef.getElementById('parserLabModelDialogTitle'),
      modelDialogMessage: documentRef.getElementById('parserLabModelDialogMessage'),
      modelDialogNameField: documentRef.getElementById('parserLabModelDialogNameField'),
      modelDialogNameInput: documentRef.getElementById('parserLabModelDialogNameInput'),
      modelDialogCancelButton: documentRef.getElementById('parserLabModelDialogCancelBtn'),
      modelDialogConfirmButton: documentRef.getElementById('parserLabModelDialogConfirmBtn'),
      fileInput: documentRef.getElementById('parserLabFileInput'),
      sourceContext: documentRef.getElementById('parserLabSourceContext'),
      sourceOrigin: documentRef.getElementById('parserLabSourceOrigin'),
      sourceName: documentRef.getElementById('parserLabSourceName'),
      filterInput: documentRef.getElementById('parserLabFilterInput'),
      summary: documentRef.getElementById('parserLabSummary'),
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
      blockFilterInput: documentRef.getElementById('parserLabBlockFilterInput'),
      copyBlockTargetSelect: documentRef.getElementById('parserLabCopyBlockTargetSelect'),
      blockList: documentRef.getElementById('parserLabBlockList'),
      blockEditorRegion: documentRef.getElementById('parserLabBlockEditorRegion'),
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
      blockHeaderSourceSelect: documentRef.getElementById('parserLabBlockHeaderSourceSelect'),
      blockHeaderMatchFields: documentRef.getElementById('parserLabBlockHeaderMatchFields'),
      blockStructuralBoundaryNote: documentRef.getElementById('parserLabBlockStructuralBoundaryNote'),
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
      betweenPolicyNote: documentRef.getElementById('parserLabBetweenPolicyNote'),
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
      blockFilter: '',
      blockDefinitions: [],
      compositionRules: [],
      normalizedRowsView: { column_widths: {} },
      modelLibrary: [],
      activeModelId: null,
      blockInstances: [],
      semanticPreview: null,
      composedPreview: null,
      editingBlockId: null,
      editingCompositionId: null,
      activeEditorTab: null,
      activePreviewBlockId: null,
      activeRightTab: 'inspector',
      activeJsonTab: 'row',
      modelReady: false,
      sourceOrigin: null,
      associatedContextKey: '',
    };
    let persistenceQueue = Promise.resolve();
    let resolveModelDialog = null;
    let blockEditTimer = null;
    let rowFilterTimer = null;
    let draggedBlockId = null;
    let rowByNumber = new Map();
    let rowElementByNumber = new Map();
    let blockInstanceByRow = new Map();
    let headerCandidatesByRow = new Map();
    let searchTextByRow = new Map();
    let rowDecisionByNumber = new Map();

    function termRoleOptions() {
      return `
        <option value="principal">Principal · Nombre</option>
        <option value="secondary">Secundario · Cargo</option>`;
    }

    function normalizedColumnHeader(column, label) {
      return `<th scope="col" data-normalized-column="${column}"><span class="parser-lab-column-label">${label}</span><span class="parser-lab-column-resizer" data-normalized-column-resizer="${column}" role="separator" aria-label="Cambiar ancho de la columna ${label}" aria-orientation="vertical" aria-valuemin="${MIN_NORMALIZED_COLUMN_WIDTH}" aria-valuemax="${MAX_NORMALIZED_COLUMN_WIDTH}" tabindex="0"></span></th>`;
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

    async function loadModelLibrary() {
      try {
        const response = await fetchRef('/api/parser-lab/model-library');
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'No se pudo cargar la biblioteca de modelos.');
        applyModelLibrary(payload.library);
        setPersistenceStatus('Modelos cargados desde la base de datos', payload.path);
        render();
      } catch (error) {
        setPersistenceStatus(`Sin persistencia local: ${error.message}`, '', true);
      } finally {
        state.modelReady = true;
        elements.openButton.disabled = false;
        elements.createModelButton.disabled = false;
        renderModelLibraryControls();
      }
    }

    function applyModelLibrary(library) {
      if (!library || !Array.isArray(library.models)) {
        throw new Error('El JSON local no contiene una biblioteca de modelos válida.');
      }
      state.modelLibrary = library.models.map((record) => JSON.parse(JSON.stringify(record)));
      state.activeModelId = library.active_model_id;
      const active = activeModelRecord();
      if (!active && state.modelLibrary.length) {
        throw new Error('El modelo activo no existe en la biblioteca.');
      }
      applyActiveModelRecord(active);
      renderModelLibraryControls();
    }

    function applyActiveModelRecord(record) {
      const model = record ? record.model : blockModel.modelDocument([], [], { column_widths: {} });
      const definitions = model && model.blocks;
      const compositionRules = model && model.composition_rules;
      const normalizedRowsView = model && model.normalized_rows_view;
      if (!Array.isArray(definitions)) throw new Error('El modelo no contiene una lista de bloques.');
      if (!Array.isArray(compositionRules)) throw new Error('El modelo no contiene una lista válida de reglas.');
      if (!normalizedRowsView || !normalizedRowsView.column_widths || typeof normalizedRowsView.column_widths !== 'object') {
        throw new Error('El modelo no contiene la vista de filas normalizadas.');
      }
      const errors = definitions.flatMap((definition) => blockModel.validateDefinition(definition));
      errors.push(...compositionRules.flatMap((rule) => blockModel.validateCompositionRule(rule)));
      if (errors.length) throw new Error(errors.join(' '));
      state.blockDefinitions = definitions.map(blockModel.normalizeDefinition);
      state.compositionRules = compositionRules.map(blockModel.normalizeCompositionRule);
      state.normalizedRowsView = {
        column_widths: { ...normalizedRowsView.column_widths },
      };
      state.editingBlockId = null;
      state.editingCompositionId = null;
      state.activeEditorTab = null;
      state.activePreviewBlockId = null;
      closeBlockEditor();
      closeCompositionEditor();
    }

    function activeModelRecord() {
      return state.modelLibrary.find((record) => record.id === state.activeModelId) || null;
    }

    function renderModelLibraryControls() {
      const currentValue = state.activeModelId || '';
      elements.modelSelect.replaceChildren();
      if (!state.modelLibrary.length) {
        const option = documentRef.createElement('option');
        option.value = '';
        option.textContent = 'Sin modelos';
        elements.modelSelect.appendChild(option);
      } else {
        state.modelLibrary.forEach((record) => {
          const option = documentRef.createElement('option');
          option.value = record.id;
          option.textContent = record.name;
          option.title = `Revisión ${record.revision}`;
          elements.modelSelect.appendChild(option);
        });
      }
      elements.modelSelect.value = currentValue;
      const hasActive = Boolean(activeModelRecord());
      elements.modelSelect.disabled = !state.modelReady || !state.modelLibrary.length;
      elements.createModelButton.disabled = !state.modelReady;
      elements.duplicateModelButton.disabled = !hasActive;
      elements.renameModelButton.disabled = !hasActive;
      elements.deleteModelButton.disabled = !hasActive;
    }

    async function runModelLibraryAction(action, fields = {}) {
      const response = await fetchRef('/api/parser-lab/model-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...fields }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo actualizar la biblioteca de modelos.');
      applyModelLibrary(payload.library);
      setPersistenceStatus('Modelos guardados en la base de datos', payload.path);
      render();
      return payload;
    }

    async function createModel() {
      const name = await requestModelName('Crear modelo', 'Modelo sin título', 'Crear');
      if (name === null) return;
      try {
        await runModelLibraryAction('create', { name });
      } catch (error) {
        root.alert(error.message);
      }
    }

    async function duplicateModel() {
      const active = activeModelRecord();
      if (!active) return;
      const name = await requestModelName('Duplicar modelo', `${active.name} copia`, 'Duplicar');
      if (name === null) return;
      try {
        flushPendingBlockEdit();
        await persistBlockModel();
        await runModelLibraryAction('duplicate', { model_id: active.id, name });
      } catch (error) {
        root.alert(error.message);
      }
    }

    async function renameModel() {
      const active = activeModelRecord();
      if (!active) return;
      const name = await requestModelName('Renombrar modelo', active.name, 'Renombrar');
      if (name === null || name.trim() === active.name) return;
      try {
        await runModelLibraryAction('rename', { model_id: active.id, name });
      } catch (error) {
        root.alert(error.message);
      }
    }

    async function deleteModel() {
      const active = activeModelRecord();
      if (!active) return;
      const confirmed = await requestModelConfirmation(
        'Borrar modelo',
        `Se borrará “${active.name}”. Esta acción no se puede deshacer.`,
        'Borrar',
        true
      );
      if (!confirmed) return;
      try {
        await runModelLibraryAction('delete', { model_id: active.id });
      } catch (error) {
        root.alert(error.message);
      }
    }

    async function selectModel(modelId) {
      if (!modelId || modelId === state.activeModelId) return;
      const previousId = state.activeModelId;
      try {
        flushPendingBlockEdit();
        await persistBlockModel();
        await runModelLibraryAction('set_active', { model_id: modelId });
      } catch (error) {
        elements.modelSelect.value = previousId || '';
        root.alert(error.message);
      }
    }

    function requestModelName(title, value, confirmLabel) {
      return openModelDialog({
        title,
        message: '',
        value,
        confirmLabel,
        needsName: true,
        danger: false,
      });
    }

    async function requestModelConfirmation(title, message, confirmLabel = 'Aceptar', danger = false) {
      const result = await openModelDialog({
        title,
        message,
        value: '',
        confirmLabel,
        needsName: false,
        danger,
      });
      return result !== null;
    }

    function openModelDialog({ title, message, value, confirmLabel, needsName, danger }) {
      if (resolveModelDialog) resolveModelDialog(null);
      elements.modelDialogTitle.textContent = title;
      elements.modelDialogMessage.textContent = message;
      elements.modelDialogMessage.hidden = !message;
      elements.modelDialogNameField.hidden = !needsName;
      elements.modelDialogNameInput.required = needsName;
      elements.modelDialogNameInput.value = value;
      elements.modelDialogConfirmButton.textContent = confirmLabel;
      elements.modelDialogConfirmButton.classList.toggle('danger', danger);
      elements.modelDialogConfirmButton.classList.toggle('confirm', !danger);
      elements.modelDialogBackdrop.hidden = false;
      root.requestAnimationFrame(() => {
        if (needsName) {
          elements.modelDialogNameInput.focus();
          elements.modelDialogNameInput.select();
        } else {
          elements.modelDialogConfirmButton.focus();
        }
      });
      return new Promise((resolve) => {
        resolveModelDialog = resolve;
      });
    }

    function closeModelDialog(value = null) {
      elements.modelDialogBackdrop.hidden = true;
      const resolve = resolveModelDialog;
      resolveModelDialog = null;
      if (resolve) resolve(value);
    }

    function currentBlockModelDocument() {
      return blockModel.modelDocument(
        state.blockDefinitions,
        state.compositionRules,
        state.normalizedRowsView
      );
    }

    function persistBlockModel({ keepalive = false } = {}) {
      if (!state.activeModelId) return Promise.resolve(null);
      const model = currentBlockModelDocument();
      elements.modelJson.textContent = JSON.stringify(model, null, 2);
      setPersistenceStatus('Guardando modelo…');
      persistenceQueue = persistenceQueue.catch(() => {}).then(async () => {
        const response = await fetchRef('/api/parser-lab/model-library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save', model_id: state.activeModelId, model }),
          keepalive,
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'No se pudo guardar el modelo.');
        state.modelLibrary = payload.library.models.map((record) => JSON.parse(JSON.stringify(record)));
        renderModelLibraryControls();
        setPersistenceStatus('Modelo guardado', payload.path);
        return payload;
      }).catch((error) => {
        setPersistenceStatus(`Error al guardar: ${error.message}`, '', true);
        return null;
      });
      return persistenceQueue;
    }

    function flushBlockModelOnPageHide() {
      if (blockEditTimer) {
        root.clearTimeout(blockEditTimer);
        blockEditTimer = null;
      }
      const model = currentBlockModelDocument();
      if (!state.activeModelId) return;
      const navigatorRef = root.navigator;
      if (navigatorRef && typeof navigatorRef.sendBeacon === 'function' && typeof root.Blob === 'function') {
        const body = new root.Blob([JSON.stringify({
          action: 'save',
          model_id: state.activeModelId,
          model,
        })], { type: 'application/json' });
        if (navigatorRef.sendBeacon('/api/parser-lab/model-library', body)) return;
      }
      persistBlockModel({ keepalive: true });
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

    function renderSourceContext(inspection = state.inspection) {
      if (!inspection) {
        elements.sourceContext.dataset.origin = 'none';
        elements.sourceContext.title = 'No hay una fuente cargada.';
        elements.sourceOrigin.textContent = 'Sin archivo';
        elements.sourceName.textContent = 'No hay una fuente cargada.';
        return;
      }
      const sourceKind = String(inspection.source_kind || '').toUpperCase();
      const associated = state.sourceOrigin === 'associated';
      elements.sourceContext.dataset.origin = associated ? 'associated' : 'temporary';
      elements.sourceOrigin.textContent = associated
        ? `${sourceKind} de Cartelas · predeterminado`
        : `${sourceKind} temporal de Parser Lab`;
      elements.sourceName.textContent = inspection.source;
      elements.sourceContext.title = `${elements.sourceOrigin.textContent}: ${inspection.source}`;
    }

    async function inspectFile(file, inspectOptions = {}) {
      flushPendingBlockEdit();
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
        state.sourceOrigin = inspectOptions.origin || 'temporary';
        state.associatedContextKey = inspectOptions.contextKey || '';
        state.selectedRowNumber = payload.rows && payload.rows[0] ? payload.rows[0].row : null;
        state.filter = '';
        elements.filterInput.value = '';
        render();
        if (state.selectedRowNumber !== null) selectRow(state.selectedRowNumber);
      } catch (error) {
        state.inspection = null;
        state.selectedRowNumber = null;
        state.activeEditorTab = null;
        state.activePreviewBlockId = null;
        render();
        elements.summary.classList.add('parser-lab-error');
        elements.summary.textContent = error.message;
      } finally {
        elements.openButton.disabled = false;
        elements.fileInput.value = '';
      }
    }

    function selectedProjectContext() {
      try {
        const selection = JSON.parse(root.localStorage.getItem('creditos:lastSelection') || '{}');
        if (!selection.productionId || !selection.episodeId) return null;
        return {
          productionId: selection.productionId,
          episodeId: selection.episodeId,
        };
      } catch (_error) {
        return null;
      }
    }

    async function loadAssociatedSource() {
      if (state.sourceOrigin === 'temporary') return;
      const context = selectedProjectContext();
      if (!context) return;
      const response = await fetchRef('/api/parser-lab/associated-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          production_id: context.productionId,
          episode_id: context.episodeId,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo cargar el archivo asociado.');
      const sourceFile = payload.file;
      if (!sourceFile) {
        if (state.sourceOrigin === 'associated') clearInspection();
        return;
      }
      const contextKey = `${context.productionId}:${context.episodeId}:${sourceFile.import_model_id}`;
      if (state.inspection && state.sourceOrigin === 'associated' && state.associatedContextKey === contextKey) return;
      const bytes = Uint8Array.from(root.atob(sourceFile.base64), (character) => character.charCodeAt(0));
      const file = new root.File([bytes], sourceFile.name, {
        type: sourceFile.mime || 'application/octet-stream',
      });
      await inspectFile(file, { origin: 'associated', contextKey });
    }

    function filteredRows() {
      const rows = state.inspection ? state.inspection.rows || [] : [];
      const query = state.filter.trim().toLocaleLowerCase('es');
      if (!query) return rows;
      return rows.filter((row) => (searchTextByRow.get(row.row) || '').includes(query));
    }

    function rebuildRowIndexes() {
      const rows = state.inspection ? state.inspection.rows || [] : [];
      const indexes = uiSupport.buildRowIndexes(
        rows,
        state.blockInstances,
        (state.semanticPreview && state.semanticPreview.row_decisions) || [],
        COLUMNS
      );
      rowByNumber = indexes.rowByNumber;
      blockInstanceByRow = indexes.blockInstanceByRow;
      headerCandidatesByRow = indexes.headerCandidatesByRow;
      searchTextByRow = indexes.searchTextByRow;
      rowDecisionByNumber = indexes.rowDecisionByNumber;
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
      rebuildRowIndexes();
      renderBlockModel();
      renderParserPreview();
      renderActiveJsonDocument();
      renderNormalizedRows();
    }

    function renderNormalizedRows() {
      const inspection = state.inspection;
      const rows = filteredRows();
      elements.clearButton.disabled = !inspection;
      elements.filterInput.disabled = !inspection;
      updateHeaderAction();
      elements.tableBody.replaceChildren();
      rowElementByNumber = new Map();

      if (!inspection) {
        applyNormalizedRowsView();
        renderSourceContext();
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
      renderSourceContext(inspection);
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
      rowElementByNumber = new Map(Array.from(elements.tableBody.rows).map((rowElement) => (
        [Number(rowElement.dataset.row), rowElement]
      )));
      ensureRovingTableRow();
      applyNormalizedRowsView();
      renderSelection();
      if (state.selectedRowNumber !== null && !rows.some((row) => row.row === state.selectedRowNumber)) {
        elements.selectionMeta.textContent = `Fila ${state.selectedRowNumber} · oculta por el filtro`;
      }
    }

    function renderRow(row) {
      const tr = documentRef.createElement('tr');
      const block = blockInstanceContainingRow(row.row);
      const isBlockHeader = block && block.start_row === row.row;
      const isActiveBlock = Boolean(block && (
        block.definition_id === state.activeEditorTab
        || block.definition_id === state.activePreviewBlockId
      ));
      const headerCandidates = headerCandidatesByRow.get(row.row) || [];
      const isAlternativeHeader = headerCandidates.some((instance) => instance.start_row !== row.row);
      tr.tabIndex = row.row === state.selectedRowNumber ? 0 : -1;
      tr.dataset.row = String(row.row);
      tr.classList.toggle('selected', row.row === state.selectedRowNumber);
      tr.classList.toggle('parser-lab-block-range-row', Boolean(block));
      tr.classList.toggle('parser-lab-active-block-range', isActiveBlock);
      tr.classList.toggle('parser-lab-block-header-row', Boolean(isBlockHeader));
      tr.classList.toggle('parser-lab-header-candidate-row', isAlternativeHeader);
      tr.classList.toggle('parser-lab-empty-source-row', Boolean(row.empty));
      tr.setAttribute('aria-selected', row.row === state.selectedRowNumber ? 'true' : 'false');
      tr.addEventListener('click', () => selectRow(row.row));
      tr.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectRow(row.row);
          return;
        }
        navigateTableRows(row.row, event);
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

    function ensureRovingTableRow() {
      if (elements.tableBody.querySelector('tr[tabindex="0"]')) return;
      const first = elements.tableBody.querySelector('tr[data-row]');
      if (first) first.tabIndex = 0;
    }

    function navigateTableRows(rowNumber, event) {
      const rows = Array.from(elements.tableBody.querySelectorAll('tr[data-row]'));
      const currentIndex = rows.findIndex((rowElement) => Number(rowElement.dataset.row) === rowNumber);
      const offsets = { ArrowUp: -1, ArrowDown: 1, PageUp: -10, PageDown: 10 };
      let nextIndex;
      if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = rows.length - 1;
      else if (Object.prototype.hasOwnProperty.call(offsets, event.key)) {
        nextIndex = clamp(currentIndex + offsets[event.key], 0, rows.length - 1);
      } else return;
      event.preventDefault();
      const next = rows[nextIndex];
      if (!next) return;
      selectRow(Number(next.dataset.row), true);
      next.focus({ preventScroll: true });
    }

    function appendBlockCell(rowElement, block, isHeader) {
      const cell = documentRef.createElement('td');
      cell.className = 'parser-lab-block-cell';
      cell.dataset.normalizedColumn = 'block';
      if (block) {
        const label = documentRef.createElement('span');
        label.className = isHeader ? 'parser-lab-block-badge' : 'parser-lab-block-continuation';
        label.textContent = isHeader ? block.name : `↳ ${block.name}`;
        const diagnostics = [...(block.diagnostics || []), ...(block.range_diagnostics || [])];
        if (diagnostics.length) {
          cell.classList.add('warning');
          label.title = diagnostics.map((entry) => entry.message).join(' ');
        }
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
        const resizer = elements.normalizedTable.querySelector(`[data-normalized-column-resizer="${column}"]`);
        if (resizer) {
          const currentWidth = Number.isFinite(width)
            ? width
            : elements.normalizedTable.querySelector(`th[data-normalized-column="${column}"]`).getBoundingClientRect().width;
          resizer.setAttribute('aria-valuenow', String(Math.round(currentWidth)));
          resizer.setAttribute('aria-valuetext', `${Math.round(currentWidth)} píxeles`);
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
      return rowByNumber.get(state.selectedRowNumber) || null;
    }

    function blockInstanceContainingRow(rowNumber) {
      return blockInstanceByRow.get(rowNumber) || null;
    }

    function renderBlockModel() {
      const found = state.blockInstances.filter((instance) => instance.matched).length;
      const enabled = state.blockDefinitions.filter((definition) => definition.enabled).length;
      const warnings = state.blockInstances.filter((instance) => (
        instance.match_status !== 'matched' || instance.range_status === 'warning'
      )).length;
      const blockQuery = state.blockFilter.trim().toLocaleLowerCase('es');
      const visibleDefinitions = state.blockDefinitions.filter((definition) => {
        if (!blockQuery || definition.id === state.activeEditorTab) return true;
        const instance = state.blockInstances.find((candidate) => candidate.definition_id === definition.id);
        return [definition.name, definition.id, blockInstanceStatus(instance, null)]
          .join(' ')
          .toLocaleLowerCase('es')
          .includes(blockQuery);
      });
      const visibleSuffix = blockQuery ? ` · ${visibleDefinitions.length} visibles` : '';
      elements.blockCount.textContent = `${state.blockDefinitions.length} cabeceras · ${enabled} incluidas · ${found} encontradas${warnings ? ` · ${warnings} avisos` : ''}${visibleSuffix}`;
      renderCompositionRules();
      elements.blockEditorRegion.removeAttribute('aria-labelledby');
      elements.blockList.replaceChildren();
      if (!visibleDefinitions.length && blockQuery) {
        const empty = documentRef.createElement('div');
        empty.className = 'parser-lab-block-empty';
        empty.textContent = 'Ningún bloque coincide con la búsqueda.';
        elements.blockList.appendChild(empty);
      }
      visibleDefinitions.forEach((definition, visibleIndex) => {
        const instance = state.blockInstances.find((candidate) => candidate.definition_id === definition.id);
        const interpreted = state.semanticPreview.blocks.find((candidate) => candidate.definition_id === definition.id);
        const item = documentRef.createElement('div');
        const content = documentRef.createElement('span');
        const title = documentRef.createElement('strong');
        const status = documentRef.createElement('span');
        const include = documentRef.createElement('input');
        const active = definition.id === state.activeEditorTab;
        item.className = 'parser-lab-block-tab';
        item.id = `parserLabBlockTab${visibleIndex}`;
        item.tabIndex = active ? 0 : -1;
        item.draggable = true;
        item.dataset.blockId = definition.id;
        item.title = [
          definition.name,
          ...((instance && instance.diagnostics) || []).map((entry) => entry.message),
          ...((instance && instance.range_diagnostics) || []).map((entry) => entry.message),
          'Arrastra esta pestaña sobre otra para copiar sus ajustes.',
        ].join(' ');
        item.setAttribute('role', 'tab');
        item.setAttribute('aria-controls', 'parserLabBlockEditorRegion');
        item.setAttribute('aria-selected', String(active));
        item.classList.toggle('missing', !instance || !instance.matched);
        item.classList.toggle('warning', Boolean(instance && (
          instance.match_status !== 'matched' || instance.range_status === 'warning'
        )));
        item.classList.toggle('active', active);
        item.classList.toggle('ignored', !definition.enabled);
        if (active) elements.blockEditorRegion.setAttribute('aria-labelledby', item.id);
        content.className = 'parser-lab-block-tab-copy';
        title.textContent = definition.name;
        status.className = 'parser-lab-block-status';
        status.textContent = blockInstanceStatus(instance, interpreted);
        content.append(title, status);
        include.type = 'checkbox';
        include.draggable = false;
        include.tabIndex = active ? 0 : -1;
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
          if (instance && instance.matched) {
            selectRow(instance.start_row, true, { kind: 'block-tab', id: definition.id });
          }
          else {
            const currentDefinition = state.blockDefinitions.find((candidate) => candidate.id === definition.id) || definition;
            state.activeEditorTab = definition.id;
            state.activePreviewBlockId = null;
            openDefinitionEditor(currentDefinition);
            renderBlockModel();
            renderParserPreview();
            restoreNavigationFocus({ kind: 'block-tab', id: definition.id });
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
      compositionTab.id = 'parserLabCompositionTab';
      compositionTab.className = 'parser-lab-block-tab parser-lab-composition-tab';
      compositionTab.classList.toggle('active', state.activeEditorTab === 'composition');
      compositionTab.setAttribute('role', 'tab');
      compositionTab.setAttribute('aria-controls', 'parserLabBlockEditorRegion');
      compositionTab.setAttribute('aria-selected', String(state.activeEditorTab === 'composition'));
      compositionTab.tabIndex = state.activeEditorTab === 'composition' ? 0 : -1;
      if (state.activeEditorTab === 'composition') {
        elements.blockEditorRegion.setAttribute('aria-labelledby', compositionTab.id);
      }
      compositionCopy.className = 'parser-lab-block-tab-copy';
      compositionTitle.textContent = 'Composición';
      compositionStatus.textContent = `${state.compositionRules.length} reglas`;
      compositionCopy.append(compositionTitle, compositionStatus);
      compositionTab.append(compositionCopy);
      compositionTab.addEventListener('click', showCompositionEditor);
      elements.blockList.appendChild(compositionTab);
      uiSupport.ensureRovingTabStop(elements.blockList);
      renderCopyTargetOptions();
      updateBlockReorderControls();
    }

    function renderCopyTargetOptions() {
      const source = state.blockDefinitions.find((definition) => definition.id === state.activeEditorTab);
      elements.copyBlockTargetSelect.replaceChildren();
      const prompt = documentRef.createElement('option');
      prompt.value = '';
      prompt.textContent = source ? 'Elegir destino…' : 'Selecciona un bloque…';
      elements.copyBlockTargetSelect.appendChild(prompt);
      state.blockDefinitions.forEach((definition) => {
        if (!source || definition.id === source.id) return;
        const option = documentRef.createElement('option');
        option.value = definition.id;
        option.textContent = definition.name;
        elements.copyBlockTargetSelect.appendChild(option);
      });
      elements.copyBlockTargetSelect.disabled = !source || state.blockDefinitions.length < 2;
    }

    function blockInstanceStatus(instance, interpreted) {
      if (!instance) return 'Sin diagnóstico';
      if (instance.match_status === 'invalid') return 'Definición inválida';
      if (instance.match_status === 'missing') return 'Cabecera ausente';
      if (instance.match_status === 'out_of_order') {
        return `Fuera de orden · ${instance.candidate_rows.join(', ') || 'sin fila'}`;
      }
      if (instance.match_status === 'ambiguous') {
        return `Ambigua · filas ${instance.candidate_rows.join(', ')}`;
      }
      const suffix = instance.range_status === 'warning' ? ' · rango con aviso' : '';
      return `Fila ${instance.start_row} · ${interpreted ? interpreted.items.length : 0} ítems${suffix}`;
    }

    function updateBlockReorderControls() {
      const index = state.blockDefinitions.findIndex((definition) => definition.id === state.activeEditorTab);
      elements.moveBlockUpButton.disabled = index <= 0;
      elements.moveBlockDownButton.disabled = index < 0 || index >= state.blockDefinitions.length - 1;
    }

    async function copyBlockSettings(sourceId, targetId) {
      flushPendingBlockEdit();
      draggedBlockId = null;
      if (!sourceId || !targetId || sourceId === targetId) return;
      const source = state.blockDefinitions.find((definition) => definition.id === sourceId);
      const targetIndex = state.blockDefinitions.findIndex((definition) => definition.id === targetId);
      if (!source || targetIndex < 0) return;
      const target = state.blockDefinitions[targetIndex];
      const accepted = await requestModelConfirmation(
        'Copiar ajustes de bloque',
        `¿Copiar los ajustes de “${source.name}” a “${target.name}”? La cabecera, el nombre y el contenido de “${target.name}” se conservarán.`,
        'Copiar ajustes'
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
      flushPendingBlockEdit();
      state.activeEditorTab = 'composition';
      state.editingBlockId = null;
      elements.blockForm.hidden = true;
      elements.blockEditorEmpty.hidden = true;
      elements.compositionEditor.hidden = false;
      renderBlockModel();
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
        state.activePreviewBlockId = tabEntries.some((entry) => (
          entry.block.definition_id === state.activeEditorTab
        )) ? state.activeEditorTab : null;
      }
      const tabs = documentRef.createElement('div');
      const horizontalTabs = root.matchMedia && root.matchMedia('(max-width: 700px)').matches;
      tabs.className = 'parser-lab-preview-tabs';
      tabs.setAttribute('role', 'tablist');
      tabs.setAttribute('aria-label', 'Bloques del previo');
      tabs.setAttribute('aria-orientation', horizontalTabs ? 'horizontal' : 'vertical');
      tabEntries.forEach(({ block }, tabIndex) => {
        const button = documentRef.createElement('button');
        const copy = documentRef.createElement('span');
        const name = documentRef.createElement('strong');
        const status = documentRef.createElement('span');
        const active = block.definition_id === state.activePreviewBlockId;
        button.type = 'button';
        button.id = `parserLabPreviewTab${tabIndex}`;
        button.dataset.blockId = block.definition_id;
        button.className = `parser-lab-preview-tab${active ? ' active' : ''}`;
        button.classList.toggle('ignored', !block.enabled);
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-controls', 'parserLabPreviewActivePanel');
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
        copy.className = 'parser-lab-block-tab-copy';
        name.textContent = block.name;
        status.textContent = block.enabled ? `${block.items.length} ítems` : 'Ignorado';
        copy.append(name, status);
        button.append(copy);
        button.addEventListener('click', () => {
          const instance = state.blockInstances.find((candidate) => candidate.definition_id === block.definition_id);
          if (instance && instance.matched) {
            selectRow(instance.start_row, true, { kind: 'preview-tab', id: block.definition_id });
          }
          setRightTab('inspector');
        });
        tabs.appendChild(button);
      });
      uiSupport.ensureRovingTabStop(tabs);
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
      container.id = 'parserLabPreviewActivePanel';
      container.setAttribute('role', 'tabpanel');
      container.setAttribute(
        'aria-labelledby',
        tabs.querySelector('[aria-selected="true"]')?.id || tabs.querySelector('[role="tab"]')?.id || ''
      );
      container.className = `parser-lab-preview-block-group${activeEntry.group.target ? ` composed ${activeEntry.group.target}` : ''}`;
      const groupDiagnostics = activeEntry.group.diagnostics || [];
      container.classList.toggle('has-warning', groupDiagnostics.length > 0);
      if (activeEntry.group.target) {
        const label = documentRef.createElement('div');
        label.className = 'parser-lab-preview-composition-label';
        label.textContent = `${compositionTargetLabel(activeEntry.group.target)} · ${activeEntry.group.members.length} bloques${groupDiagnostics.length ? ' · aviso' : ''}`;
        if (groupDiagnostics.length) label.title = groupDiagnostics.map((entry) => entry.message).join(' ');
        container.appendChild(label);
      }
      const visibleBlocks = activeEntry.group.target ? activeEntry.group.members : [activeEntry.block];
      visibleBlocks.forEach((block) => container.appendChild(renderPreviewBlock(block)));
      elements.previewContent.appendChild(container);
      const previewItems = Array.from(container.querySelectorAll('.parser-lab-preview-item'));
      if (previewItems.length && !previewItems.some((item) => item.tabIndex === 0)) previewItems[0].tabIndex = 0;
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
      const detectionDiagnostics = block.detection
        ? [...(block.detection.diagnostics || []), ...(block.detection.range_diagnostics || [])]
        : [];
      if (detectionDiagnostics.length) {
        const warning = documentRef.createElement('div');
        warning.className = 'parser-lab-preview-warning';
        warning.textContent = detectionDiagnostics.map((entry) => entry.message).join(' ');
        items.appendChild(warning);
      }
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
              wrapper.appendChild(renderPreviewItem(item, itemIndex, block.definition_id));
              if (shouldRenderEmptyBoundary(item.empty_rows_after)) {
                wrapper.appendChild(renderPreviewSeparator(item.empty_rows_after));
              }
              itemIndex += 1;
            });
            items.appendChild(wrapper);
            return;
          }
          const item = group.members[0];
          items.appendChild(renderPreviewItem(item, itemIndex, block.definition_id));
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

    function renderPreviewItem(item, index, blockId) {
      const card = documentRef.createElement('button');
      const order = documentRef.createElement('span');
      const termsContainer = documentRef.createElement('div');
      const source = documentRef.createElement('span');
      const trace = documentRef.createElement('span');
      card.type = 'button';
      card.dataset.blockId = blockId;
      card.dataset.itemIndex = String(index);
      card.className = `parser-lab-preview-item ${item.orientation || 'vertical'}`;
      card.tabIndex = item.source_rows.includes(state.selectedRowNumber) ? 0 : -1;
      order.className = 'parser-lab-preview-item-order';
      order.textContent = String(index + 1).padStart(2, '0');
      termsContainer.className = 'parser-lab-preview-terms';
      const terms = item.terms;
      const internalEmptyRows = item.internal_empty_rows || [];
      terms.forEach((term, termIndex) => {
        const entry = documentRef.createElement('span');
        entry.className = `parser-lab-preview-term ${term.role}`;
        entry.textContent = term.value;
        termsContainer.appendChild(entry);
        internalEmptyRows.filter((boundary) => (
          boundary.after_term_index === termIndex + 1 && shouldRenderEmptyBoundary(boundary)
        )).forEach((boundary) => {
          termsContainer.appendChild(renderPreviewSeparator(boundary, 'Hueco interno', true));
        });
      });
      source.className = 'parser-lab-preview-source';
      source.textContent = sourceRowsLabel(item.source_rows);
      trace.className = 'parser-lab-preview-trace';
      trace.textContent = item.decision_trace ? item.decision_trace.reason : '';
      card.title = trace.textContent;
      card.append(order, termsContainer, source, trace);
      if (item.source_rows.length) card.addEventListener('click', () => selectRow(
        item.source_rows[0],
        true,
        { kind: 'preview-item', id: blockId, itemIndex: index }
      ));
      card.addEventListener('keydown', (event) => navigatePreviewItems(card, event));
      return card;
    }

    function navigatePreviewItems(card, event) {
      const items = Array.from(elements.previewContent.querySelectorAll('.parser-lab-preview-item'));
      const currentIndex = items.indexOf(card);
      let nextIndex;
      if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = items.length - 1;
      else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') nextIndex = Math.max(0, currentIndex - 1);
      else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = Math.min(items.length - 1, currentIndex + 1);
      else return;
      event.preventDefault();
      const next = items[nextIndex];
      if (next) next.click();
    }

    function renderPreviewSeparator(boundary, positionLabel = '', internal = false) {
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
        preserve: `${boundary.output_count} ${boundary.output_count === 1 ? 'fila' : 'filas'}`,
      };
      const effectiveEffect = boundary.effective_effect || boundary.effect;
      separator.className = `parser-lab-preview-separator ${effectiveEffect} ${boundary.display}${internal ? ' internal' : ''}`;
      separator.style.setProperty('--parser-lab-empty-row-count', String(Math.min(12, Math.max(1, boundary.output_count || 1))));
      separator.textContent = [
        positionLabel,
        boundary.context === 'between_row_items'
          ? 'Entre ítems por fila'
          : labels[boundary.effect] || boundary.effect,
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
      const structuralLabels = {
        sheet_start: 'primera fila de la hoja',
        after_previous: 'fila siguiente a la frontera anterior',
        sheet_end: 'última fila de la hoja',
      };
      const parts = [];
      if (header.source === 'match') {
        parts.push(`${header.column} ${operatorLabels[header.operator]}`);
        if (header.operator !== 'nonempty') parts.push(`“${header.value}”`);
        if (header.bold === 'required') parts.push('negrita');
        if (header.bold === 'forbidden') parts.push('sin negrita');
        if (header.merged_b_to_d === 'required') parts.push('B–D combinada');
        if (header.merged_b_to_d === 'forbidden') parts.push('no combinada');
      } else {
        parts.push(structuralLabels[header.source] || header.source);
      }
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
      flushPendingBlockEdit();
      state.activeEditorTab = definition.id;
      state.editingBlockId = definition.id;
      populateBlockForm(definition, 'Editar frontera');
    }

    function populateBlockForm(definition, title) {
      const normalized = blockModel.normalizeDefinition(definition);
      closeCompositionEditor();
      elements.compositionEditor.hidden = true;
      elements.blockEditorEmpty.hidden = true;
      elements.blockForm.hidden = false;
      elements.blockFormTitle.textContent = title;
      elements.blockNameInput.value = normalized.name;
      elements.blockHeaderSourceSelect.value = normalized.header.source;
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
      updateBoundaryFields();
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
          source: elements.blockHeaderSourceSelect.value,
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

    function commitBlockFormToState() {
      if (!state.editingBlockId) return;
      const definition = readBlockForm();
      const errors = blockModel.validateDefinition(definition);
      if (errors.length) {
        elements.blockFormError.hidden = false;
        elements.blockFormError.textContent = errors.join(' ');
        return false;
      }
      const index = state.blockDefinitions.findIndex((candidate) => candidate.id === state.editingBlockId);
      if (index < 0) return false;
      state.blockDefinitions.splice(index, 1, definition);
      elements.blockFormError.hidden = true;
      return true;
    }

    function applyLiveBlockDefinition(event) {
      if (event) event.preventDefault();
      if (blockEditTimer) root.clearTimeout(blockEditTimer);
      blockEditTimer = null;
      if (!commitBlockFormToState()) return;
      render();
      persistBlockModel();
    }

    function scheduleLiveBlockDefinition() {
      const hadPendingEdit = Boolean(blockEditTimer);
      if (blockEditTimer) root.clearTimeout(blockEditTimer);
      blockEditTimer = null;
      if (!commitBlockFormToState()) {
        if (hadPendingEdit) persistBlockModel();
        return;
      }
      blockEditTimer = root.setTimeout(() => {
        blockEditTimer = null;
        render();
        persistBlockModel();
      }, 320);
    }

    function flushPendingBlockEdit() {
      if (!blockEditTimer) return false;
      root.clearTimeout(blockEditTimer);
      blockEditTimer = null;
      persistBlockModel();
      return true;
    }

    function moveDefinition(index, offset) {
      flushPendingBlockEdit();
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

    function revealEditingBlockStart() {
      const instance = state.blockInstances.find((candidate) => (
        candidate.definition_id === state.editingBlockId
      ));
      if (instance && instance.matched) selectRow(instance.start_row, true);
    }

    function updateBlockValueInput() {
      const disabled = (
        elements.blockHeaderSourceSelect.value !== 'match'
        || elements.blockOperatorSelect.value === 'nonempty'
      );
      elements.blockValueInput.disabled = disabled;
      if (elements.blockOperatorSelect.value === 'nonempty') elements.blockValueInput.value = '';
    }

    function updateBoundaryFields() {
      const source = elements.blockHeaderSourceSelect.value;
      const notes = {
        sheet_start: 'El bloque comienza en la primera fila normalizada de la hoja.',
        after_previous: 'El bloque comienza en la fila inmediatamente posterior a la frontera anterior.',
        sheet_end: 'El bloque comienza en la última fila normalizada de la hoja.',
      };
      elements.blockHeaderMatchFields.hidden = source !== 'match';
      elements.blockStructuralBoundaryNote.hidden = source === 'match';
      elements.blockStructuralBoundaryNote.textContent = notes[source] || '';
      updateBlockValueInput();
    }

    function updateOrientationFields() {
      const grouping = elements.blockGroupingSelect.value;
      const rowGrouping = grouping === 'row';
      const continueOption = elements.blockBetweenEffectSelect.querySelector('option[value="continue"]');
      elements.blockStartColumnField.hidden = grouping !== 'first_term';
      continueOption.textContent = rowGrouping
        ? 'Sin separación adicional · siguen siendo dos ítems'
        : 'Continuar el mismo ítem';
      elements.betweenPolicyNote.textContent = rowGrouping
        ? 'En «uno por fila», cada fila con contenido siempre es un ítem. Esta política solo decide el salto y el espacio entre ambos.'
        : 'En los otros modos, «continuar» conserva las filas vacías dentro del mismo ítem.';
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
        (candidate.candidate_rows || []).includes(state.selectedRowNumber)
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

    async function handleHeaderAction() {
      flushPendingBlockEdit();
      const row = selectedRow();
      if (!row || row.empty) return;
      const existing = selectedHeaderDefinition();
      if (existing) {
        const accepted = await requestModelConfirmation(
          'Eliminar cabecera',
          `¿Eliminar la cabecera “${existing.name}”? Dejará de actuar como frontera y los rangos contiguos se unirán.`,
          'Eliminar',
          true
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
      const insertionIndex = state.blockDefinitions.findIndex((candidate) => {
        const instance = state.blockInstances.find((entry) => entry.definition_id === candidate.id);
        return instance && instance.matched && instance.start_row > row.row;
      });
      if (insertionIndex < 0) state.blockDefinitions.push(definition);
      else state.blockDefinitions.splice(insertionIndex, 0, definition);
      state.activeEditorTab = definition.id;
      state.activePreviewBlockId = definition.id;
      state.editingBlockId = definition.id;
      render();
      openDefinitionEditor(definition);
      persistBlockModel();
    }

    function selectRow(rowNumber, reveal = false, focusRequest = null) {
      flushPendingBlockEdit();
      const previousRowNumber = state.selectedRowNumber;
      const previousEditorTab = state.activeEditorTab;
      const previousPreviewBlockId = state.activePreviewBlockId;
      const selectionHiddenByFilter = Boolean(
        reveal
        && state.filter.trim()
        && !filteredRows().some((row) => row.row === rowNumber)
      );
      if (selectionHiddenByFilter) {
        state.filter = '';
        elements.filterInput.value = '';
      }
      state.selectedRowNumber = rowNumber;
      const instance = blockInstanceContainingRow(rowNumber);
      if (instance) {
        const definition = state.blockDefinitions.find((candidate) => candidate.id === instance.definition_id);
        state.activeEditorTab = instance.definition_id;
        state.activePreviewBlockId = instance.definition_id;
        if (definition && state.editingBlockId !== definition.id) openDefinitionEditor(definition);
      } else {
        state.activeEditorTab = null;
        state.activePreviewBlockId = null;
        closeBlockEditor();
        elements.compositionEditor.hidden = true;
      }
      if (selectionHiddenByFilter) render();
      else {
        updateHeaderAction();
        renderSelection();
        if (previousEditorTab !== state.activeEditorTab) updateBlockNavigationSelection();
        if (previousPreviewBlockId !== state.activePreviewBlockId) {
          renderParserPreview({ preserveScroll: true });
        } else {
          updatePreviewItemSelection();
        }
        if (previousEditorTab !== state.activeEditorTab || previousPreviewBlockId !== state.activePreviewBlockId) {
          updateNormalizedBlockHighlight();
        }
      }
      updateNormalizedRowSelection(previousRowNumber, rowNumber, reveal);
      restoreNavigationFocus(focusRequest);
    }

    function updateNormalizedRowSelection(previousRowNumber, rowNumber, reveal) {
      const previousRow = rowElementByNumber.get(previousRowNumber);
      const nextRow = rowElementByNumber.get(rowNumber);
      if (previousRow && previousRow !== nextRow) {
        previousRow.classList.remove('selected');
        previousRow.setAttribute('aria-selected', 'false');
        previousRow.tabIndex = -1;
      }
      if (!nextRow) return;
      nextRow.classList.add('selected');
      nextRow.setAttribute('aria-selected', 'true');
      nextRow.tabIndex = 0;
      if (reveal) nextRow.scrollIntoView({ block: 'center' });
    }

    function updateBlockNavigationSelection() {
      if (state.blockFilter.trim()) {
        renderBlockModel();
        return;
      }
      elements.blockEditorRegion.removeAttribute('aria-labelledby');
      elements.blockList.querySelectorAll('.parser-lab-block-tab').forEach((tab) => {
        const tabId = tab.dataset.blockId || (tab.id === 'parserLabCompositionTab' ? 'composition' : '');
        const active = tabId === state.activeEditorTab;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        const include = tab.querySelector('input[type="checkbox"]');
        if (include) include.tabIndex = active ? 0 : -1;
        if (active) elements.blockEditorRegion.setAttribute('aria-labelledby', tab.id);
      });
      uiSupport.ensureRovingTabStop(elements.blockList);
      renderCopyTargetOptions();
      updateBlockReorderControls();
    }

    function updatePreviewItemSelection() {
      const blocksById = new Map(((state.semanticPreview && state.semanticPreview.blocks) || []).map((block) => (
        [block.definition_id, block]
      )));
      const previewItems = Array.from(elements.previewContent.querySelectorAll('.parser-lab-preview-item'));
      let hasSelectedItem = false;
      previewItems.forEach((itemElement) => {
        const block = blocksById.get(itemElement.dataset.blockId);
        const item = block && block.items[Number(itemElement.dataset.itemIndex)];
        const selected = Boolean(item && item.source_rows.includes(state.selectedRowNumber));
        itemElement.tabIndex = selected ? 0 : -1;
        hasSelectedItem = hasSelectedItem || selected;
      });
      if (!hasSelectedItem && previewItems.length) previewItems[0].tabIndex = 0;
    }

    function updateNormalizedBlockHighlight() {
      elements.tableBody.querySelectorAll('.parser-lab-active-block-range').forEach((rowElement) => {
        rowElement.classList.remove('parser-lab-active-block-range');
      });
      const activeIds = new Set([state.activeEditorTab, state.activePreviewBlockId].filter(Boolean));
      state.blockInstances.filter((instance) => (
        instance.matched && activeIds.has(instance.definition_id)
      )).forEach((instance) => {
        for (let rowNumber = instance.start_row; rowNumber <= instance.end_row; rowNumber += 1) {
          const rowElement = rowElementByNumber.get(rowNumber);
          if (rowElement) rowElement.classList.add('parser-lab-active-block-range');
        }
      });
    }

    function restoreNavigationFocus(request) {
      if (!request) return;
      const previewRequest = request.kind === 'preview-tab' || request.kind === 'preview-item';
      const container = previewRequest ? elements.previewContent : elements.blockList;
      const selector = request.kind === 'preview-item'
        ? '.parser-lab-preview-item[data-block-id][data-item-index]'
        : request.kind === 'preview-tab'
          ? '.parser-lab-preview-tab[data-block-id]'
          : '.parser-lab-block-tab[data-block-id]';
      const candidates = Array.from(container.querySelectorAll(selector));
      const target = candidates.find((element) => (
        element.dataset.blockId === request.id
        && (request.kind !== 'preview-item' || Number(element.dataset.itemIndex) === request.itemIndex)
      ));
      if (target) target.focus({ preventScroll: true });
    }

    function renderSelection() {
      const selected = selectedRow();
      if (!selected) {
        elements.selectionMeta.textContent = 'Sin selección';
        elements.formatSummary.hidden = true;
        elements.formatSummary.replaceChildren();
        elements.json.textContent = 'Selecciona una fila para ver todos sus atributos.';
        return;
      }
      elements.selectionMeta.textContent = `Fila ${selected.row}`;
      renderFormatSummary(selected);
      const block = blockInstanceContainingRow(selected.row);
      const interpretedBlock = block && state.semanticPreview && state.semanticPreview.blocks.find((entry) => (
        entry.definition_id === block.definition_id
      ));
      elements.json.textContent = JSON.stringify({
        source_row: selected,
        interpretation: rowDecision(selected.row),
        block_detection: interpretedBlock ? interpretedBlock.detection : null,
      }, null, 2);
    }

    function renderFormatSummary(row) {
      const boldColumns = COLUMNS.filter((column) => row.bold && row.bold[column]);
      const styledColumns = COLUMNS.filter((column) => row.styles && row.styles[column] !== undefined);
      const block = blockInstanceContainingRow(row.row);
      const decision = rowDecision(row.row);
      const headerCandidates = decision && decision.header_candidates || [];
      const warnings = [
        ...((decision && decision.warnings) || []),
        ...((block && block.diagnostics) || []),
        ...((block && block.range_diagnostics) || []),
      ].filter((warning, index, entries) => entries.findIndex((candidate) => (
        candidate.code === warning.code && candidate.message === warning.message
      )) === index);
      const rows = [
        formatSummaryRow('Bloque', [block ? `${block.name} · ${block.start_row}–${block.end_row}` : 'Sin bloque definido']),
        formatSummaryRow('Interpretación', [decision ? decision.reason : 'Sin decisión registrada']),
      ];
      if (headerCandidates.length) {
        rows.push(formatSummaryRow('Cabecera', headerCandidates.map((candidate) => (
          `${candidate.block_name} · ${candidate.selected ? 'seleccionada' : 'candidata'} · ${candidate.match_status}`
        ))));
      }
      if (warnings.length) rows.push(formatSummaryRow('Avisos', warnings.map((warning) => warning.message)));
      rows.push(
        formatSummaryRow('Contenido', [row.empty ? 'Fila vacía · división interna' : 'Fila con datos']),
        formatSummaryRow('Negrita', boldColumns.length ? boldColumns : ['Ninguna']),
        formatSummaryRow('Combinación', [row.merged_b_to_d ? 'B–D' : 'Celdas separadas']),
        formatSummaryRow(
          'Estilos de origen',
          styledColumns.length ? styledColumns.map((column) => `${column} · ${row.styles[column]}`) : ['Sin estilo registrado']
        )
      );
      elements.formatSummary.hidden = false;
      elements.formatSummary.replaceChildren(...rows);
    }

    function rowDecision(rowNumber) {
      return rowDecisionByNumber.get(rowNumber) || null;
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
        button.tabIndex = active ? 0 : -1;
      });
      documentRef.querySelectorAll('[data-right-pane]').forEach((pane) => {
        const active = pane.dataset.rightPane === tabName;
        pane.classList.toggle('active', active);
        pane.hidden = !active;
      });
      if (tabName === 'jsons') renderActiveJsonDocument();
    }

    function setJsonTab(tabName) {
      state.activeJsonTab = tabName;
      documentRef.querySelectorAll('[data-json-tab]').forEach((button) => {
        const active = button.dataset.jsonTab === tabName;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
      });
      documentRef.querySelectorAll('[data-json-document]').forEach((documentElement) => {
        const active = documentElement.dataset.jsonDocument === tabName;
        documentElement.classList.toggle('active', active);
        documentElement.hidden = !active;
      });
      renderActiveJsonDocument();
    }

    function renderActiveJsonDocument() {
      if (state.activeRightTab !== 'jsons') return;
      if (state.activeJsonTab === 'inspection') {
        elements.inspectionJson.textContent = JSON.stringify(state.inspection, null, 2);
      } else if (state.activeJsonTab === 'model') {
        elements.modelJson.textContent = JSON.stringify(currentBlockModelDocument(), null, 2);
      } else if (state.activeJsonTab === 'semantic') {
        elements.semanticJson.textContent = JSON.stringify(state.semanticPreview, null, 2);
      } else if (state.activeJsonTab === 'composed') {
        elements.composedJson.textContent = JSON.stringify(state.composedPreview, null, 2);
      }
    }

    function clamp(value, minimum, maximum) {
      return Math.max(minimum, Math.min(maximum, value));
    }

    function clearInspection() {
      flushPendingBlockEdit();
      state.inspection = null;
      state.sourceOrigin = null;
      state.associatedContextKey = '';
      state.selectedRowNumber = null;
      state.filter = '';
      elements.filterInput.value = '';
      elements.summary.classList.remove('parser-lab-error');
      render();
    }

    elements.openButton.addEventListener('click', () => elements.fileInput.click());
    elements.clearButton.addEventListener('click', clearInspection);
    elements.modelSelect.addEventListener('change', () => selectModel(elements.modelSelect.value));
    elements.createModelButton.addEventListener('click', createModel);
    elements.duplicateModelButton.addEventListener('click', duplicateModel);
    elements.renameModelButton.addEventListener('click', renameModel);
    elements.deleteModelButton.addEventListener('click', deleteModel);
    elements.modelDialog.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = elements.modelDialogNameField.hidden
        ? true
        : elements.modelDialogNameInput.value.trim();
      if (value === '') {
        elements.modelDialogNameInput.focus();
        return;
      }
      closeModelDialog(value);
    });
    elements.modelDialogCancelButton.addEventListener('click', () => closeModelDialog());
    elements.modelDialogBackdrop.addEventListener('click', (event) => {
      if (event.target === elements.modelDialogBackdrop) closeModelDialog();
    });
    elements.modelDialog.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeModelDialog();
    });
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
    elements.blockHeaderSourceSelect.addEventListener('change', () => {
      updateBoundaryFields();
      applyLiveBlockDefinition();
      revealEditingBlockStart();
    });
    elements.blockOperatorSelect.addEventListener('change', () => {
      updateBlockValueInput();
      applyLiveBlockDefinition();
    });
    elements.compositionScopeSelect.addEventListener('change', updateCompositionFieldLabel);
    elements.fileInput.addEventListener('change', () => {
      const file = elements.fileInput.files && elements.fileInput.files[0];
      if (file) inspectFile(file, { origin: 'temporary' });
    });
    elements.filterInput.addEventListener('input', () => {
      state.filter = elements.filterInput.value;
      if (rowFilterTimer) root.clearTimeout(rowFilterTimer);
      rowFilterTimer = root.setTimeout(() => {
        rowFilterTimer = null;
        renderNormalizedRows();
      }, 100);
    });
    elements.blockFilterInput.addEventListener('input', () => {
      state.blockFilter = elements.blockFilterInput.value;
      renderBlockModel();
    });
    elements.copyBlockTargetSelect.addEventListener('change', () => {
      const targetId = elements.copyBlockTargetSelect.value;
      const sourceId = state.activeEditorTab;
      elements.copyBlockTargetSelect.value = '';
      if (targetId) copyBlockSettings(sourceId, targetId);
    });
    documentRef.querySelectorAll('[data-right-tab]').forEach((button) => {
      button.addEventListener('click', () => setRightTab(button.dataset.rightTab));
    });
    documentRef.querySelectorAll('[data-json-tab]').forEach((button) => {
      button.addEventListener('click', () => setJsonTab(button.dataset.jsonTab));
    });
    [
      elements.blockList,
      elements.previewContent,
      documentRef.querySelector('.parser-lab-right-tabs'),
      documentRef.querySelector('.parser-lab-json-tabs'),
    ].forEach((tablist) => tablist.addEventListener('keydown', (event) => uiSupport.navigateTablist(tablist, event)));
    documentRef.querySelectorAll('[data-normalized-column-resizer]').forEach((resizer) => {
      const column = resizer.dataset.normalizedColumnResizer;
      resizer.addEventListener('pointerdown', (event) => beginNormalizedColumnResize(column, event));
      resizer.addEventListener('keydown', (event) => resizeNormalizedColumnWithKeyboard(column, event));
    });
    uiSupport.setupSplitters({ documentRef, elements, clamp });
    const parserLabTabButton = documentRef.querySelector('[data-tab="parserLab"]');
    if (parserLabTabButton) {
      parserLabTabButton.addEventListener('click', () => {
        loadAssociatedSource().catch((error) => {
          elements.summary.classList.add('parser-lab-error');
          elements.summary.textContent = error.message;
        });
      });
    }
    root.addEventListener('pagehide', flushBlockModelOnPageHide);
    setRightTab(state.activeRightTab);
    setJsonTab(state.activeJsonTab);
    render();
    loadModelLibrary();

    return { clearInspection, inspectFile, loadAssociatedSource, loadModelLibrary, persistBlockModel, render, state };
  }

  root.CreditosParserLabUi = { initializeParserLab };

  function loadParserLabDependency(globalName, source) {
    if (root[globalName]) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = root.document.createElement('script');
      script.src = source;
      script.dataset.parserLabDependency = globalName;
      script.addEventListener('load', resolve, { once: true });
      script.addEventListener('error', () => reject(new Error(`No se pudo cargar ${source}.`)), { once: true });
      root.document.head.appendChild(script);
    });
  }

  Promise.all([
    loadParserLabDependency('CreditosParserLabBlockModel', './parser_lab/block_model.js'),
    loadParserLabDependency('CreditosParserLabUiSupport', './parser_lab/ui_support.js'),
  ]).then(() => initializeParserLab()).catch((error) => {
    const rootElement = root.document.getElementById('parserLabRoot');
    if (rootElement) rootElement.textContent = `No se pudo iniciar Parser Lab: ${error.message}`;
  });
})(globalThis);
