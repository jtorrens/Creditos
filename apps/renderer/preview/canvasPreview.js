(function (root) {
  function createCanvasPreview() {
    function drawCanvasMarginOverlay(ctx, layout, zoom = 1) {
      ctx.save();
      ctx.strokeStyle = '#ff2b2b';
      ctx.lineWidth = 1 / Math.max(0.01, Number(zoom) || 1);
      ctx.beginPath();
      ctx.moveTo(layout.page_left_margin, 0);
      ctx.lineTo(layout.page_left_margin, layout.page_height);
      ctx.moveTo(layout.page_width - layout.page_right_margin, 0);
      ctx.lineTo(layout.page_width - layout.page_right_margin, layout.page_height);
      ctx.moveTo(0, layout.page_top_margin);
      ctx.lineTo(layout.page_width, layout.page_top_margin);
      ctx.moveTo(0, layout.page_height - layout.page_bottom_margin);
      ctx.lineTo(layout.page_width, layout.page_height - layout.page_bottom_margin);
      ctx.stroke();
      ctx.restore();
    }

    return {
      drawCanvasMarginOverlay,
    };
  }

  root.CreditosPreviewCanvas = {
    createCanvasPreview,
  };
})(globalThis);
