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

    function renderCartelaImageControls(cartela) {
      const documentRef = options.documentRef || root.document;
      const wrap = documentRef.createElement('div');
      wrap.className = 'cartela-image-controls';
      wrap.appendChild(options.sectionLabel('Imágenes asociadas'));

      const actions = documentRef.createElement('div');
      actions.className = 'cartela-image-actions';
      const attachButton = documentRef.createElement('button');
      attachButton.type = 'button';
      attachButton.textContent = 'Añadir imagen';
      attachButton.addEventListener('click', associateCartelaImage);
      actions.appendChild(attachButton);
      wrap.appendChild(actions);

      const images = options.cartelaImages(cartela);
      if (!images.length) {
        const empty = documentRef.createElement('div');
        empty.className = 'cartela-images-empty';
        empty.textContent = 'Sin imágenes asociadas';
        wrap.appendChild(empty);
        return wrap;
      }

      const tableWrap = documentRef.createElement('div');
      tableWrap.className = 'cartela-images-table-wrap';
      const table = documentRef.createElement('table');
      table.className = 'cartela-images-table';
      const head = documentRef.createElement('thead');
      head.innerHTML = '<tr><th>Archivo</th><th>Escala</th><th>Offset X</th><th>Offset Y</th><th></th></tr>';
      table.appendChild(head);
      const body = documentRef.createElement('tbody');
      images.forEach((image) => {
        const row = documentRef.createElement('tr');
        const fileCell = documentRef.createElement('td');
        const fileName = documentRef.createElement('span');
        fileName.className = 'image-file-name';
        fileName.textContent = image.file_path || image.name || 'Imagen asociada';
        fileName.title = image.file_path || image.name || '';
        fileCell.appendChild(fileName);
        row.appendChild(fileCell);
        row.appendChild(cartelaImageNumberCell(image, 'scale', 0.01, 0.01));
        row.appendChild(cartelaImageNumberCell(image, 'offset_x', null, 1));
        row.appendChild(cartelaImageNumberCell(image, 'offset_y', null, 1));
        const actionsCell = documentRef.createElement('td');
        const removeButton = documentRef.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'compact-action';
        removeButton.textContent = 'Eliminar';
        removeButton.addEventListener('click', () => removeCartelaImage(image.id));
        actionsCell.appendChild(removeButton);
        row.appendChild(actionsCell);
        body.appendChild(row);
      });
      table.appendChild(body);
      tableWrap.appendChild(table);
      wrap.appendChild(tableWrap);

      return wrap;
    }

    function cartelaImageNumberCell(image, field, min, step) {
      const documentRef = options.documentRef || root.document;
      const cell = documentRef.createElement('td');
      const fallbackValue = field === 'scale' ? 1 : 0;
      const input = options.fieldControlRegistry.create('number', {
        value: Number(image[field]) || fallbackValue,
        min,
        step,
        fallbackValue,
        onInput: (value) => updateCartelaImage(image.id, { [field]: value }),
      });
      cell.appendChild(input);
      return cell;
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
      renderCartelaImageControls,
      updateCartelaImage,
    };
  }

  root.CreditosAppCartelaImages = {
    createAppCartelaImages,
  };
})(globalThis);
