(function (root) {
  function createAppFileOutput(options = {}) {
    const documentRef = options.documentRef || root.document;
    const windowRef = options.windowRef || root;

    function downloadBlob(blob, fileName) {
      const link = documentRef.createElement('a');
      link.href = windowRef.URL.createObjectURL(blob);
      link.download = fileName;
      documentRef.body.appendChild(link);
      link.click();
      link.remove();
      windowRef.URL.revokeObjectURL(link.href);
    }

    async function saveBlobAs(blob, fileName) {
      const native = options.nativeBridge();
      if (native && native.savePng) {
        await native.savePng({ fileName, bytes: await blobToBytes(blob) });
        return;
      }

      if (!windowRef.showSaveFilePicker) {
        downloadBlob(blob, fileName);
        return;
      }
      const handle = await windowRef.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'PNG',
            accept: { 'image/png': ['.png'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    }

    async function blobToBytes(blob) {
      return await blob.arrayBuffer();
    }

    async function writeBlobToDirectory(directory, fileName, blob) {
      const handle = await directory.getFileHandle(fileName, { create: true });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    }

    function wait(ms) {
      return new Promise((resolve) => windowRef.setTimeout(resolve, ms));
    }

    return {
      blobToBytes,
      downloadBlob,
      saveBlobAs,
      wait,
      writeBlobToDirectory,
    };
  }

  root.CreditosAppFileOutput = {
    createAppFileOutput,
  };
})(globalThis);
