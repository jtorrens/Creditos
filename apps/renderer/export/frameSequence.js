(function (root) {
  function createFrameSequenceExport(dependencies = {}) {
    const {
      onCancelAvailable = () => {},
      onEncoding = () => {},
      throwIfCancelled = () => {},
    } = dependencies;

    async function exportMovFramesIncrementally(native, filePath, fps, encodingProfile, writeFrames) {
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
        return native.exportMovSequence({ filePath, fps, encodingProfile, pages });
      }

      const session = await native.startMovExport({ filePath, fps, encodingProfile });
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

    return {
      exportMovFramesIncrementally,
    };
  }

  root.CreditosExportFrameSequence = {
    createFrameSequenceExport,
  };
})(globalThis);
