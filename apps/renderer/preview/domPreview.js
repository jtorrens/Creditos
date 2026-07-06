(function (root) {
  function createDomPreview(dependencies = {}) {
    const {
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

    return {
      makeMarginOverlay,
    };
  }

  root.CreditosPreviewDom = {
    createDomPreview,
  };
})(globalThis);
