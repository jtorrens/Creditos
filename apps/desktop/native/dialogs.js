const fs = require('fs/promises');
const path = require('path');

function createNativeDialogs({
  dialog,
  ensureMovExtension,
  getMainWindow,
  normalizeMovEncodingProfile,
}) {
  function pngFilters() {
    return [{ name: 'PNG', extensions: ['png'] }];
  }

  function imageFilters() {
    return [{ name: 'Imagen', extensions: ['png', 'jpg', 'jpeg'] }];
  }

  function referenceVideoFilters() {
    return [{ name: 'Video', extensions: ['mov', 'mp4', 'm4v', 'webm'] }];
  }

  function jsonFilters() {
    return [{ name: 'JSON', extensions: ['json'] }];
  }

  function movFilters() {
    return [{ name: 'QuickTime Movie', extensions: ['mov'] }];
  }

  async function openXlsx(payload) {
    const result = await dialog.showOpenDialog(getMainWindow(), {
      title: 'Asociar archivo de créditos',
      defaultPath: payload && payload.defaultPath ? payload.defaultPath : undefined,
      properties: ['openFile'],
      filters: [{ name: 'Hojas de cálculo', extensions: ['xlsx', 'ods'] }],
    });
    if (result.canceled || !result.filePaths[0]) return { canceled: true };
    const filePath = result.filePaths[0];
    const bytes = await fs.readFile(filePath);
    return { canceled: false, filePath, name: path.basename(filePath), base64: bytes.toString('base64') };
  }

  async function openImage(payload) {
    const result = await dialog.showOpenDialog(getMainWindow(), {
      title: 'Asociar imagen',
      defaultPath: payload && payload.defaultPath ? payload.defaultPath : undefined,
      properties: ['openFile'],
      filters: imageFilters(),
    });
    if (result.canceled || !result.filePaths[0]) return { canceled: true };
    const filePath = result.filePaths[0];
    const bytes = await fs.readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const mime = extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' : 'image/png';
    return { canceled: false, filePath, name: path.basename(filePath), mime, base64: bytes.toString('base64') };
  }

  async function openReferenceVideo(payload) {
    const result = await dialog.showOpenDialog(getMainWindow(), {
      title: 'Asociar video de referencia',
      defaultPath: payload && payload.defaultPath ? payload.defaultPath : undefined,
      properties: ['openFile'],
      filters: referenceVideoFilters(),
    });
    if (result.canceled || !result.filePaths[0]) return { canceled: true };
    const filePath = result.filePaths[0];
    return { canceled: false, filePath, name: path.basename(filePath) };
  }

  async function savePng(payload) {
    const bytes = payload && payload.bytes;
    if (!bytes) throw new Error('No hay PNG para guardar.');
    const result = await dialog.showSaveDialog(getMainWindow(), {
      title: 'Guardar PNG',
      defaultPath: payload.fileName || 'creditos.png',
      filters: pngFilters(),
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    await fs.writeFile(result.filePath, Buffer.from(bytes));
    return { canceled: false, filePath: result.filePath, name: path.basename(result.filePath) };
  }

  async function exportPngSequence(payload) {
    const pages = (payload && payload.pages) || [];
    if (!pages.length) throw new Error('No hay PNGs para exportar.');
    const result = await dialog.showOpenDialog(getMainWindow(), {
      title: 'Elegir carpeta de salida PNG',
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || !result.filePaths[0]) return { canceled: true };

    const directory = result.filePaths[0];
    for (const page of pages) {
      await fs.writeFile(path.join(directory, page.fileName), Buffer.from(page.bytes));
    }
    return { canceled: false, directory, count: pages.length };
  }

  async function chooseMovPath(payload) {
    const profile = normalizeMovEncodingProfile(payload && payload.encodingProfile);
    const result = await dialog.showSaveDialog(getMainWindow(), {
      title: profile.startsWith('h264_') ? 'Exportar MOV H.264' : 'Exportar MOV ProRes',
      defaultPath: payload && payload.defaultPath ? payload.defaultPath : 'creditos.mov',
      filters: movFilters(),
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    const filePath = ensureMovExtension(result.filePath);
    return { canceled: false, filePath, name: path.basename(filePath) };
  }

  async function importStyleJsonFiles() {
    const result = await dialog.showOpenDialog(getMainWindow(), {
      title: 'Importar estilos JSON',
      properties: ['openFile', 'multiSelections'],
      filters: jsonFilters(),
    });
    if (result.canceled || !result.filePaths.length) return { canceled: true };
    const styles = [];
    for (const filePath of result.filePaths) {
      styles.push({
        filePath,
        name: path.basename(filePath),
        text: await fs.readFile(filePath, 'utf8'),
      });
    }
    return { canceled: false, styles };
  }

  async function chooseStyleOverrideAction(payload) {
    const result = await dialog.showMessageBox(getMainWindow(), {
      type: 'question',
      buttons: ['Cancelar', 'Descartar overrides', 'Conservar overrides'],
      defaultId: 1,
      cancelId: 0,
      title: 'Cambiar estilo',
      message: payload && payload.message
        ? payload.message
        : 'Esta cartela tiene overrides. ¿Quieres conservarlos o usar exactamente los valores del nuevo estilo?',
      detail: 'Si descartas overrides, la cartela quedará limpia y se verá con los valores del estilo seleccionado.',
    });
    if (result.response === 2) return { action: 'keep' };
    if (result.response === 1) return { action: 'discard' };
    return { action: 'cancel' };
  }

  async function confirm(payload) {
    const result = await dialog.showMessageBox(getMainWindow(), {
      type: 'question',
      buttons: ['Cancelar', payload && payload.confirmLabel ? payload.confirmLabel : 'Aceptar'],
      defaultId: 1,
      cancelId: 0,
      title: payload && payload.title ? payload.title : 'Confirmar',
      message: payload && payload.message ? payload.message : 'Confirmar accion',
    });
    return { confirmed: result.response === 1 };
  }

  return {
    chooseMovPath,
    chooseStyleOverrideAction,
    confirm,
    exportPngSequence,
    importStyleJsonFiles,
    openImage,
    openReferenceVideo,
    openXlsx,
    savePng,
  };
}

module.exports = { createNativeDialogs };
