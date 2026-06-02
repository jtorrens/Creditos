/**
 * Container-bound Google Apps Script for extracting the active sheet into
 * a structured credits JSON.
 */

const MENU_NAME = 'Creditos JSON';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(MENU_NAME)
    .addItem('Ver / descargar JSON de hoja activa', 'showActiveSheetJsonDialog')
    .addItem('Guardar JSON de hoja activa en Drive', 'saveActiveSheetJsonToDrive')
    .addToUi();
}

function showActiveSheetJsonDialog() {
  const html = HtmlService.createHtmlOutputFromFile('Dialog')
    .setWidth(900)
    .setHeight(650);
  SpreadsheetApp.getUi().showModalDialog(html, 'Creditos JSON');
}

function getActiveSheetCreditsPayload() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getActiveSheet();
  const data = extractCreditsFromSheet_(sheet);
  const safeSpreadsheetName = safeFilePart_(spreadsheet.getName());
  const safeSheetName = safeFilePart_(sheet.getName());

  return {
    json: JSON.stringify(data, null, 2),
    fileName: `${safeSpreadsheetName}_${safeSheetName}_credits.json`,
    sheetName: sheet.getName(),
  };
}

function getActiveSheetCreditsJson() {
  return getActiveSheetCreditsPayload().json;
}

function saveActiveSheetJsonToDrive() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const payload = getActiveSheetCreditsPayload();
  const spreadsheetFile = DriveApp.getFileById(spreadsheet.getId());
  const parents = spreadsheetFile.getParents();
  const file = parents.hasNext()
    ? parents.next().createFile(payload.fileName, payload.json, MimeType.PLAIN_TEXT)
    : DriveApp.createFile(payload.fileName, payload.json, MimeType.PLAIN_TEXT);

  spreadsheet.toast('JSON guardado en Drive.', MENU_NAME, 5);
  return file.getUrl();
}

function extractCreditsFromSheet_(sheet) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const rows = readRodilloRows_(sheet);
  return parseRodilloRows_(rows, spreadsheet.getName(), sheet.getName());
}

function readRodilloRows_(sheet) {
  const lastRow = sheet.getLastRow();
  if (!lastRow) return [];

  const values = sheet.getRange(1, 1, lastRow, 4).getDisplayValues();
  const fontWeights = sheet.getRange(1, 1, lastRow, 4).getFontWeights();
  const mergedRows = readMergedBtoDRows_(sheet, lastRow);
  const rows = [];

  values.forEach((rowValues, index) => {
    const cleanValues = rowValues.map((value) => String(value || '').trim());
    if (!cleanValues.some(Boolean)) return;

    rows.push({
      row: index + 1,
      values: {
        A: cleanValues[0],
        B: cleanValues[1],
        C: cleanValues[2],
        D: cleanValues[3],
      },
      bold: {
        A: fontWeights[index][0] === 'bold',
        B: fontWeights[index][1] === 'bold',
        C: fontWeights[index][2] === 'bold',
        D: fontWeights[index][3] === 'bold',
      },
      mergedBtoD: mergedRows.has(index + 1),
    });
  });

  return rows;
}

function readMergedBtoDRows_(sheet, lastRow) {
  const mergedRows = new Set();
  const mergedRanges = sheet.getRange(1, 2, lastRow, 3).getMergedRanges();

  mergedRanges.forEach((range) => {
    if (range.getColumn() === 2 && range.getNumColumns() >= 3 && range.getNumRows() === 1) {
      mergedRows.add(range.getRow());
    }
  });

  return mergedRows;
}

function parseRodilloRows_(rows, sourceName, sheetName) {
  const result = {
    source: sourceName,
    sheet: sheetName,
    columns: {
      A: 'group',
      B: 'role_or_name',
      C: 'center_title_or_role',
      D: 'name_or_character',
    },
    blocks: [],
  };

  let currentBlock = null;
  let currentCard = null;
  let currentCrewItem = null;
  let lastDataRow = null;
  let activeSection = null;

  rows.forEach((entry) => {
    const row = entry.row;
    const { A: a, B: b, C: c, D: d } = entry.values;
    const gap = lastDataRow === null ? 0 : row - lastDataRow;

    if (a && c) {
      const group = normalizeGroup_(a);
      const blockType = classifyNumberedTitle_(c);

      if (currentBlock && currentBlock.group === group && currentBlock.type === 'cards') {
        currentBlock.titles.push(c);
      } else {
        currentBlock = newBlock_(row, group, c, blockType);
        result.blocks.push(currentBlock);
      }

      currentCard = null;
      currentCrewItem = null;
      activeSection = null;

      if (currentBlock.type === 'cards') {
        currentCard = appendCardItem_(currentBlock, row, c);
      }

      lastDataRow = row;
      return;
    }

    if (!currentBlock) {
      lastDataRow = row;
      return;
    }

    if (currentBlock.type === 'cards') {
      if (c) {
        if (!currentCard || (gap > 1 && currentCard.names.length)) {
          currentCard = appendCardItem_(currentBlock, row, c);
        } else {
          currentCard.names.push({ row, name: c });
        }
      }
    } else if (currentBlock.type === 'cast') {
      if (b && d) {
        currentBlock.items.push({ kind: 'cast', row, actor: b, character: d });
      } else if (b || c || d) {
        currentBlock.items.push({ kind: 'unclassified', row, B: b, C: c, D: d });
      }
    } else if (currentBlock.type === 'crew') {
      const crewState = parseCrewRow_({
        block: currentBlock,
        entry,
        row,
        b,
        c,
        d,
        gap,
        activeSection,
        currentCrewItem,
      });
      activeSection = crewState.activeSection;
      currentCrewItem = crewState.currentCrewItem;
    }

    lastDataRow = row;
  });

  return result;
}

function parseCrewRow_(state) {
  const { block, entry, row, b, c, d, gap } = state;
  let { activeSection, currentCrewItem } = state;

  if (entry.mergedBtoD && b) {
    if (b === '#VALUE!' || b === 'VOLSKWAGEN') {
      if (activeSection !== 'Logos') {
        activeSection = 'Logos';
        currentCrewItem = null;
        block.items.push({ kind: 'section', row, title: activeSection });
      }
      block.items.push({ kind: 'list_item', row, section: activeSection, value: b });
    } else if (activeSection === 'AGRADECIMIENTOS' && entry.bold.B) {
      activeSection = b;
      currentCrewItem = null;
      block.items.push({ kind: 'section', row, title: b });
    } else if (activeSection === 'AGRADECIMIENTOS') {
      block.items.push({ kind: 'list_item', row, section: activeSection, value: b });
    } else if (activeSection && !['Logos', 'closing_copy'].includes(activeSection) && entry.bold.B && b !== activeSection) {
      activeSection = b;
      currentCrewItem = null;
      block.items.push({ kind: 'section', row, title: b });
    } else if (activeSection === 'Vestuario' && gap > 1) {
      activeSection = 'closing_copy';
      currentCrewItem = null;
      block.items.push({ kind: 'closing_line', row, section: activeSection, value: b });
    } else if (activeSection === 'closing_copy') {
      block.items.push({ kind: 'closing_line', row, section: activeSection, value: b });
    } else if (activeSection === 'Licencias Musicales') {
      block.items.push({ kind: 'list_item', row, section: activeSection, value: b });
    } else if (activeSection === 'Vestuario' && b !== 'Vestuario') {
      block.items.push({ kind: 'list_item', row, section: activeSection, value: b });
    } else {
      activeSection = b;
      currentCrewItem = null;
      block.items.push({ kind: 'section', row, title: b });
    }
  } else if (c && !b && !d) {
    if (c === 'Empresas de Servicios') {
      activeSection = c;
      currentCrewItem = null;
      block.items.push({ kind: 'section', row, title: c });
    } else if (activeSection === 'Doblaje de Figuracion' || activeSection === 'Doblaje de Figuración') {
      block.items.push({ kind: 'list_item', row, section: activeSection, value: c });
    } else {
      activeSection = c;
      currentCrewItem = null;
      block.items.push({ kind: 'section', row, title: c });
    }
  } else if (b && d) {
    currentCrewItem = {
      kind: 'crew_credit',
      row,
      section: activeSection,
      role: b,
      names: [{ row, name: d }],
    };
    block.items.push(currentCrewItem);
  } else if (d && currentCrewItem) {
    currentCrewItem.names.push({ row, name: d });
  } else if (b && !c && !d) {
    block.items.push({ kind: 'list_item', row, section: activeSection, value: b });
  } else if (c || d) {
    block.items.push({ kind: 'unclassified', row, section: activeSection, B: b, C: c, D: d });
  }

  return { activeSection, currentCrewItem };
}

function newBlock_(row, group, title, blockType) {
  return {
    group,
    title,
    titles: [title],
    type: blockType,
    start_row: row,
    items: [],
  };
}

function appendCardItem_(block, row, role) {
  const item = { kind: 'credit', row, role, names: [] };
  block.items.push(item);
  return item;
}

function classifyNumberedTitle_(title) {
  if (title === 'Han intervenido' || title === 'Pequeñas Partes') return 'cast';
  if (title === 'RODILLO FINAL') return 'crew';
  return 'cards';
}

function normalizeGroup_(value) {
  const number = Number(value);
  if (!Number.isNaN(number)) {
    return Number.isInteger(number) ? String(number) : String(number);
  }
  return value;
}

function safeFilePart_(value) {
  return String(value || 'sheet')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Backwards-compatible wrappers for earlier pasted versions.
function showRodilloFinalJsonDialog() {
  showActiveSheetJsonDialog();
}

function getRodilloFinalJson() {
  return getActiveSheetCreditsJson();
}

function saveRodilloFinalJsonToDrive() {
  return saveActiveSheetJsonToDrive();
}
