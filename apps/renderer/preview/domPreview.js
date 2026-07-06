(function (root) {
  function createDomPreview(dependencies = {}) {
    const {
      cartelaImages = () => [],
      contentAreaRect = () => ({ x: 0, y: 0, width: 0, height: 0 }),
      documentRef = root.document,
    } = dependencies;

    function makeMarginOverlay(layout, zoom = 1) {
      const overlay = documentRef.createElement('div');
      overlay.className = 'margin-overlay';
      const area = contentAreaRect(layout);
      const guides = [
        ['vertical', layout.page_left_margin * zoom, false],
        ['vertical', (layout.page_width - layout.page_right_margin) * zoom, false],
        ['horizontal', layout.page_top_margin * zoom, false],
        ['horizontal', (layout.page_height - layout.page_bottom_margin) * zoom, false],
        ['vertical', (area.x + (area.width / 2)) * zoom, true],
        ['horizontal', (area.y + (area.height / 2)) * zoom, true],
      ];

      guides.forEach(([direction, position, center]) => {
        const guide = documentRef.createElement('div');
        guide.className = `margin-guide ${direction}${center ? ' center' : ''}`;
        if (direction === 'vertical') guide.style.left = `${position}px`;
        else guide.style.top = `${position}px`;
        if (center && direction === 'vertical') {
          guide.style.top = `${area.y * zoom}px`;
          guide.style.height = `${area.height * zoom}px`;
        } else if (center) {
          guide.style.left = `${area.x * zoom}px`;
          guide.style.width = `${area.width * zoom}px`;
        }
        overlay.appendChild(guide);
      });

      return overlay;
    }

    function makePdfCartelaImages(cartela, layout) {
      const area = contentAreaRect(layout);
      return cartelaImages(cartela).map((image) => {
        const imageEl = documentRef.createElement('img');
        imageEl.className = 'pdf-cartela-image';
        imageEl.alt = '';
        imageEl.src = image.data_url;
        imageEl.style.left = `${area.x + (area.width / 2) + (Number(image.offset_x) || 0)}px`;
        imageEl.style.top = `${area.y + (area.height / 2) + (Number(image.offset_y) || 0)}px`;
        imageEl.style.transform = `translate(-50%, -50%) scale(${Math.max(0.01, Number(image.scale) || 1)})`;
        return imageEl;
      });
    }

    return {
      makeMarginOverlay,
      makePdfCartelaImages,
    };
  }

  root.CreditosPreviewDom = {
    createDomPreview,
  };
})(globalThis);
