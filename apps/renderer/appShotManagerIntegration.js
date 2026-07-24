(function (root) {
  function element(id) {
    return root.document.getElementById(id);
  }

  function initializeShotManagerIntegration() {
    const container = element('shotManagerIntegration');
    if (!container) return;
    const bridge = root.creditosNative || null;
    async function associationRequest(endpoint, payload) {
      const response = await root.fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db_path: null, ...payload }),
      });
      const result = await response.json();
      if (!response.ok) {
        return {
          ok: false,
          error: {
            code: 'ASSOCIATION_DATABASE_ERROR',
            message: result.error || 'No se pudo actualizar la asociación.',
          },
        };
      }
      return result;
    }
    const panel = root.CreditosShotManagerIntegrationPanel.createShotManagerIntegrationPanel({
      associationApi: {
        create: (payload) => associationRequest('/api/db/create-shot-manager-production', payload),
        delete: (payload) => associationRequest('/api/db/delete-shot-manager-association', payload),
        read: (payload) => associationRequest('/api/db/read-shot-manager-association', payload),
        write: (payload) => associationRequest('/api/db/write-shot-manager-association', payload),
      },
      bridge,
      documentRef: root.document,
      domain: root.CreditosDomainShotManagerAssociation,
      els: {
        container,
        context: element('shotManagerContext'),
        createButton: element('createShotManagerProductionBtn'),
        deleteButton: element('deleteShotManagerAssociationBtn'),
        productionSelect: element('shotManagerProductionSelect'),
        refreshButton: element('refreshShotManagerBtn'),
        saveButton: element('saveShotManagerAssociationBtn'),
        sourceEpisodeSelect: element('episodeSelect'),
        sourceProductionSelect: element('productionSelect'),
        status: element('shotManagerStatus'),
        structureSelect: element('shotManagerStructureSelect'),
      },
      windowRef: root,
    });
    panel.initialize().catch((error) => {
      const status = element('shotManagerStatus');
      status.textContent = `No se pudo iniciar la conexión con Shot Manager: ${error.message}`;
      status.className = 'shot-manager-status error';
    });
  }

  if (root.document.readyState === 'loading') {
    root.document.addEventListener('DOMContentLoaded', initializeShotManagerIntegration);
  } else {
    root.queueMicrotask(initializeShotManagerIntegration);
  }
})(globalThis);
