(function (root) {
  function createAppCartelaImages(options = {}) {
    const storageKeys = options.storageKeys || {};
    const windowRef = options.windowRef || root;

    async function associateCartelaImage() {
      const cartela = options.getSelectedCartela();
      if (!cartela) return;
      const native = options.nativeBridge();
      try {
        let result = null;
        if (native && native.openImage) {
          result = await native.openImage({ defaultPath: options.readLocalPreference(storageKeys.imageDir) });
        } else if (windowRef.showOpenFilePicker) {
          const [handle] = await windowRef.showOpenFilePicker({
            types: [{ description: 'Imagen', accept: { 'image/*': ['.png', '.jpg', '.jpeg'] } }],
            multiple: false,
          });
          const file = await handle.getFile();
          result = {
            canceled: false,
            name: file.name,
            mime: file.type || (file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' : 'image/png'),
            base64: await blobToBase64(file),
          };
        }
        if (!result || result.canceled) return;
        options.rememberFileDirectory(storageKeys.imageDir, result.filePath);
        const images = options.cartelaImages(cartela);
        options.updateSelectedCartela({
          images: images.concat({
            id: options.uniqueCartelaImageId(images),
            name: result.name || 'imagen',
            file_path: result.filePath || result.name || '',
            mime: result.mime || 'image/png',
            data_url: `data:${result.mime || 'image/png'};base64,${result.base64}`,
            scale: 1,
            offset_x: 0,
            offset_y: 0,
          }),
        });
      } catch (error) {
        if (error && error.name === 'AbortError') return;
        windowRef.alert('No se pudo asociar la imagen: ' + error.message);
      }
    }

    function removeCartelaImage(imageId) {
      const cartela = options.getSelectedCartela();
      if (!cartela) return;
      options.updateSelectedCartela({ images: options.cartelaImages(cartela).filter((image) => image.id !== imageId) });
    }

    function updateCartelaImage(imageId, fields) {
      const cartela = options.getSelectedCartela();
      if (!cartela) return;
      options.updateSelectedCartela({
        images: options.cartelaImages(cartela).map((image) => image.id === imageId ? { ...image, ...fields } : image),
      });
    }

    function blobToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new windowRef.FileReader();
        reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
        reader.onerror = () => reject(reader.error || new Error('No se pudo leer la imagen.'));
        reader.readAsDataURL(blob);
      });
    }

    return {
      associateCartelaImage,
      removeCartelaImage,
      updateCartelaImage,
    };
  }

  root.CreditosAppCartelaImages = {
    createAppCartelaImages,
  };
})(globalThis);
