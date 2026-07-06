(function (root) {
  function createProjectsDomain(dependencies = {}) {
    const {
      normalizeColor = (value) => value || '#ffffff',
      normalizeSettings = (settings) => settings || {},
    } = dependencies;

    function findSelectedProduction(productions, selectedProductionId) {
      return (productions || []).find((production) => String(production.id) === String(selectedProductionId)) || null;
    }

    function productionEpisodes(episodes, productionId) {
      return (episodes || []).filter((episode) => String(episode.production_id) === String(productionId));
    }

    function productionLayout(production) {
      return {
        page_width: Math.max(1, Number(production && production.page_width) || 1920),
        page_height: Math.max(1, Number(production && production.page_height) || 1080),
        preview_background: normalizeColor((production && production.preview_background) || '#ffffff'),
      };
    }

    function productionSettings(production) {
      return normalizeSettings(production && production.settings ? production.settings : {});
    }

    function applyProductionFields(production, fields) {
      if (!production) return false;
      Object.assign(production, fields || {});
      return true;
    }

    return {
      applyProductionFields,
      findSelectedProduction,
      productionEpisodes,
      productionLayout,
      productionSettings,
    };
  }

  root.CreditosDomainProjects = {
    createProjectsDomain,
  };
})(globalThis);
