(function (root) {
  function createAppPreviewRender(options = {}) {
    function previewZoomForContainer(container, layout) {
      const availableWidth = Math.max(120, (container && container.clientWidth ? container.clientWidth : 360) - 24);
      const availableHeight = Math.max(120, (container && container.clientHeight ? container.clientHeight : 260) - 24);
      return options.fitPreviewZoom(availableWidth, availableHeight, layout.page_width, layout.page_height);
    }

    function makeMarginOverlay(layout, zoom = options.getPngPreviewZoom()) {
      return options.makeMarginOverlayInPreview(layout, zoom);
    }

    function makePdfSheetElement(page, layout, elementOptions = {}) {
      return options.makePdfSheetElementInPreview(page, layout, {
        ...elementOptions,
        settings: elementOptions.settings || options.getProductionSettings(),
      });
    }

    return {
      makeMarginOverlay,
      makePdfSheetElement,
      previewZoomForContainer,
    };
  }

  root.CreditosAppPreviewRender = {
    createAppPreviewRender,
  };
})(globalThis);
