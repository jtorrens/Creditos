(function (root) {
  function createFrameSequenceExport(dependencies = {}) {
    const {
      onCancelAvailable = () => {},
      onEncoding = () => {},
      throwIfCancelled = () => {},
      wait = () => Promise.resolve(),
    } = dependencies;

    async function exportMovFramesIncrementally(
      native,
      filePath,
      fps,
      encodingProfile,
      writeFrames,
      exportOptions = {},
    ) {
      if (!native.startMovExport || !native.addMovFrame || !native.finishMovExport) {
        const pages = [];
        await writeFrames(async ({ bytes, frameCount }) => {
          pages.push({
            pageNumber: pages.length + 1,
            duration: 1 / fps,
            frameCount,
            bytes,
          });
        });
        return native.exportMovSequence({
          filePath,
          fps,
          encodingProfile,
          pages,
          preventOverwrite: exportOptions.preventOverwrite === true,
        });
      }

      const session = await native.startMovExport({
        filePath,
        fps,
        encodingProfile,
        preventOverwrite: exportOptions.preventOverwrite === true,
      });
      onCancelAvailable(() => native.cancelMovExport({ exportId: session.exportId }));
      try {
        await writeFrames(async ({ bytes, frameCount }) => {
          await native.addMovFrame({
            exportId: session.exportId,
            bytes,
            frameCount,
          });
        });
        throwIfCancelled();
        onEncoding();
        return await native.finishMovExport({ exportId: session.exportId });
      } catch (error) {
        if (native.cancelMovExport) {
          try {
            await native.cancelMovExport({ exportId: session.exportId });
          } catch (_cancelError) {
            // Best effort cleanup; the original error is more useful to report.
          }
        }
        throw error;
      }
    }

    async function writeAnimatedFrames({
      frameCount,
      onFramesWritten = () => {},
      renderFrameBytes,
      writeFrame,
      yieldEvery = 25,
    }) {
      const totalFrames = Math.max(0, Math.round(Number(frameCount) || 0));
      for (let frame = 0; frame < totalFrames; frame += 1) {
        throwIfCancelled();
        await writeFrame({
          frameCount: 1,
          bytes: await renderFrameBytes(frame),
        });
        onFramesWritten(1, frame);
        if (frame % yieldEvery === 0) {
          await wait(0);
        }
      }
    }

    async function writeRepeatedFrames({
      bytes,
      chunkSize = 25,
      frameCount,
      onFramesWritten = () => {},
      writeFrame,
    }) {
      let remaining = Math.max(0, Math.round(Number(frameCount) || 0));
      const safeChunkSize = Math.max(1, Math.round(Number(chunkSize) || 1));
      while (remaining > 0) {
        throwIfCancelled();
        const chunk = Math.min(safeChunkSize, remaining);
        await writeFrame({ frameCount: chunk, bytes });
        remaining -= chunk;
        onFramesWritten(chunk);
        await wait(0);
      }
    }

    return {
      exportMovFramesIncrementally,
      writeAnimatedFrames,
      writeRepeatedFrames,
    };
  }

  root.CreditosExportFrameSequence = {
    createFrameSequenceExport,
  };
})(globalThis);
