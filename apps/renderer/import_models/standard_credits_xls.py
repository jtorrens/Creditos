import re
import zipfile
import xml.etree.ElementTree as ET
from io import BytesIO


NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
}
XMLNS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
ODS_NS = {
    "office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
    "table": "urn:oasis:names:tc:opendocument:xmlns:table:1.0",
    "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
    "style": "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
    "fo": "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
}


def ods_attr(namespace, name):
    return f"{{{ODS_NS[namespace]}}}{name}"


def col_from_ref(ref):
    match = re.match(r"([A-Z]+)", ref or "")
    return match.group(1) if match else ""


def normalize_group(value):
    if not value:
        return None
    try:
        number = float(value)
        return str(int(number)) if number.is_integer() else str(number)
    except ValueError:
        return value


def read_shared_strings(zip_file):
    if "xl/sharedStrings.xml" not in zip_file.namelist():
        return []
    root = ET.fromstring(zip_file.read("xl/sharedStrings.xml"))
    strings = []
    for si in root.findall("a:si", NS):
        strings.append("".join((t.text or "") for t in si.iter(f"{XMLNS}t")))
    return strings


def read_bold_styles(zip_file):
    if "xl/styles.xml" not in zip_file.namelist():
        return {}

    root = ET.fromstring(zip_file.read("xl/styles.xml"))
    fonts_node = root.find("a:fonts", NS)
    cell_xfs_node = root.find("a:cellXfs", NS)
    if fonts_node is None or cell_xfs_node is None:
        return {}

    fonts = [font.find("a:b", NS) is not None for font in fonts_node]
    bold_styles = {}
    for index, xf in enumerate(cell_xfs_node):
        font_id = int(xf.attrib.get("fontId", "0"))
        bold_styles[str(index)] = fonts[font_id] if font_id < len(fonts) else False
    return bold_styles


def cell_value(cell, shared_strings):
    cell_type = cell.attrib.get("t")
    value = cell.find("a:v", NS)
    inline = cell.find("a:is", NS)

    if cell_type == "s" and value is not None:
        return shared_strings[int(value.text)].strip()
    if cell_type == "inlineStr" and inline is not None:
        return "".join((t.text or "") for t in inline.iter(f"{XMLNS}t")).strip()
    if cell_type == "e" and value is not None:
        return value.text.strip()
    if value is not None:
        return value.text.strip()
    return ""


def row_values(row, shared_strings):
    values = {"A": "", "B": "", "C": "", "D": ""}
    styles = {}
    for cell in row.findall("a:c", NS):
        col = col_from_ref(cell.attrib.get("r"))
        if col in values:
            values[col] = cell_value(cell, shared_strings)
            styles[col] = cell.attrib.get("s")
    return values, styles


def workbook_sheets(zip_file):
    workbook = ET.fromstring(zip_file.read("xl/workbook.xml"))
    rels = ET.fromstring(zip_file.read("xl/_rels/workbook.xml.rels"))
    relmap = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels}

    workbook_view = workbook.find("a:bookViews/a:workbookView", NS)
    active_tab = int(workbook_view.attrib.get("activeTab", "0")) if workbook_view is not None else 0

    sheets = []
    for index, sheet in enumerate(workbook.find("a:sheets", NS)):
        rel_id = sheet.attrib.get(f"{{{NS['r']}}}id")
        target = relmap[rel_id]
        if not target.startswith("xl/"):
            target = "xl/" + target.lstrip("/")
        sheets.append(
            {
                "index": index,
                "name": sheet.attrib["name"],
                "path": target,
                "is_active": index == active_tab,
            }
        )
    return sheets


def choose_sheet(sheets):
    for sheet in sheets:
        normalized_name = re.sub(r"[\s_]+", " ", sheet["name"].lower()).strip()
        if normalized_name == "rodillo final":
            return sheet
    for sheet in sheets:
        if sheet["is_active"]:
            return sheet
    return sheets[0]


def read_sheet_rows(zip_file, sheet_path):
    shared_strings = read_shared_strings(zip_file)
    bold_styles = read_bold_styles(zip_file)
    root = ET.fromstring(zip_file.read(sheet_path))

    merged_rows = set()
    merge_cells = root.find("a:mergeCells", NS)
    if merge_cells is not None:
        for merge in merge_cells.findall("a:mergeCell", NS):
            ref = merge.attrib.get("ref", "")
            match = re.match(r"B(\d+):D\1$", ref)
            if match:
                merged_rows.add(int(match.group(1)))

    rows = []
    for row in root.findall(".//a:sheetData/a:row", NS):
        number = int(row.attrib.get("r", "0"))
        values, styles = row_values(row, shared_strings)
        if any(values.values()):
            rows.append(
                {
                    "row": number,
                    "values": values,
                    "styles": styles,
                    "bold": {col: bold_styles.get(style, False) for col, style in styles.items()},
                    "merged_b_to_d": number in merged_rows,
                }
            )
    return rows


def read_ods_styles(zip_file, content_root):
    style_nodes = list(content_root.findall(".//style:style", ODS_NS))
    if "styles.xml" in zip_file.namelist():
        styles_root = ET.fromstring(zip_file.read("styles.xml"))
        style_nodes.extend(styles_root.findall(".//style:style", ODS_NS))

    definitions = {}
    for node in style_nodes:
        name = node.attrib.get(ods_attr("style", "name"))
        if not name:
            continue
        text_properties = node.find("style:text-properties", ODS_NS)
        definitions[name] = {
            "parent": node.attrib.get(ods_attr("style", "parent-style-name")),
            "bold": bool(
                text_properties is not None
                and text_properties.attrib.get(ods_attr("fo", "font-weight")) == "bold"
            ),
        }

    def is_bold(style_name, seen=None):
        if not style_name or style_name not in definitions:
            return False
        seen = set(seen or ())
        if style_name in seen:
            return False
        seen.add(style_name)
        definition = definitions[style_name]
        return definition["bold"] or is_bold(definition["parent"], seen)

    return {name: is_bold(name) for name in definitions}


def ods_cell_text(cell):
    paragraphs = cell.findall("text:p", ODS_NS)
    if paragraphs:
        text = "\n".join("".join(paragraph.itertext()) for paragraph in paragraphs).strip()
        if text:
            return text
    for attribute in ("string-value", "value", "boolean-value", "date-value", "time-value"):
        value = cell.attrib.get(ods_attr("office", attribute))
        if value is not None:
            return str(value).strip()
    return ""


def read_ods_sheet_rows(table, bold_styles):
    rows = []
    logical_row = 0
    cell_tag = ods_attr("table", "table-cell")
    covered_tag = ods_attr("table", "covered-table-cell")

    for row_node in table.findall("table:table-row", ODS_NS):
        row_repeats = max(1, int(row_node.attrib.get(ods_attr("table", "number-rows-repeated"), "1")))
        values = {"A": "", "B": "", "C": "", "D": ""}
        styles = {}
        bold = {}
        merged_b_to_d = False
        column_index = 0

        for cell in row_node:
            if cell.tag not in {cell_tag, covered_tag}:
                continue
            repeats = max(1, int(cell.attrib.get(ods_attr("table", "number-columns-repeated"), "1")))
            span = max(1, int(cell.attrib.get(ods_attr("table", "number-columns-spanned"), "1")))
            style_name = cell.attrib.get(ods_attr("table", "style-name"))
            value = ods_cell_text(cell) if cell.tag == cell_tag else ""
            if column_index == 1 and span >= 3:
                merged_b_to_d = True
            for offset in range(repeats):
                current_index = column_index + offset
                if current_index > 3:
                    break
                column = chr(ord("A") + current_index)
                values[column] = value if offset == 0 else ""
                if style_name:
                    styles[column] = style_name
                    bold[column] = bold_styles.get(style_name, False)
            column_index += repeats
            if column_index > 3:
                break

        for _ in range(row_repeats):
            logical_row += 1
            if any(values.values()):
                rows.append(
                    {
                        "row": logical_row,
                        "values": dict(values),
                        "styles": dict(styles),
                        "bold": dict(bold),
                        "merged_b_to_d": merged_b_to_d,
                    }
                )
    return rows


def read_ods_workbook(zip_file):
    root = ET.fromstring(zip_file.read("content.xml"))
    bold_styles = read_ods_styles(zip_file, root)
    tables = root.findall(".//table:table", ODS_NS)
    sheets = [
        {
            "index": index,
            "name": table.attrib.get(ods_attr("table", "name"), f"Hoja {index + 1}"),
            "table": table,
            "is_active": index == 0,
        }
        for index, table in enumerate(tables)
    ]
    sheet = choose_sheet(sheets)
    return sheets, sheet, read_ods_sheet_rows(sheet["table"], bold_styles)


def new_block(row, group, title, block_type):
    return {
        "group": group,
        "title": title,
        "titles": [title],
        "type": block_type,
        "start_row": row,
        "items": [],
    }


def classify_numbered_title(title):
    if title in {"Han intervenido", "Pequeñas Partes"}:
        return "cast"
    if title == "RODILLO FINAL":
        return "crew"
    return "cards"


def append_card_item(block, row, role):
    item = {"kind": "credit", "row": row, "role": role, "names": []}
    block["items"].append(item)
    return item


def parse_rows(rows, source_name, sheet_name):
    result = {
        "source": source_name,
        "sheet": sheet_name,
        "columns": {"A": "group", "B": "role_or_name", "C": "center_title_or_role", "D": "name_or_character"},
        "blocks": [],
    }

    current_block = None
    current_card = None
    current_crew_item = None
    last_data_row = None
    active_section = None

    for entry in rows:
        row = entry["row"]
        values = entry["values"]
        a, b, c, d = values["A"], values["B"], values["C"], values["D"]
        gap = 0 if last_data_row is None else row - last_data_row

        if a and c:
            group = normalize_group(a)
            block_type = classify_numbered_title(c)
            if current_block and current_block["group"] == group and current_block["type"] == "cards":
                current_block["titles"].append(c)
            else:
                current_block = new_block(row, group, c, block_type)
                result["blocks"].append(current_block)
            current_card = None
            current_crew_item = None
            active_section = None
            if current_block["type"] == "cards":
                current_card = append_card_item(current_block, row, c)
            last_data_row = row
            continue

        if current_block is None:
            last_data_row = row
            continue

        if current_block["type"] == "cards":
            if c:
                if current_card is None or (gap > 1 and current_card["names"]):
                    current_card = append_card_item(current_block, row, c)
                else:
                    current_card["names"].append({"row": row, "name": c})

        elif current_block["type"] == "cast":
            if b and d:
                current_block["items"].append({"kind": "cast", "row": row, "actor": b, "character": d})
            elif b or c or d:
                current_block["items"].append({"kind": "unclassified", "row": row, "B": b, "C": c, "D": d})

        elif current_block["type"] == "crew":
            active_section, current_crew_item = parse_crew_row(
                current_block, entry, row, b, c, d, gap, active_section, current_crew_item
            )

        last_data_row = row

    normalize_trailing_closing_copy(result)
    return result


def section_item(row, title, source_column, source_bold=False):
    return {
        "kind": "section",
        "row": row,
        "title": title,
        "source_column": source_column,
        "source_bold": bool(source_bold),
    }


def parse_crew_row(block, entry, row, b, c, d, gap, active_section, current_crew_item):
    if entry["merged_b_to_d"] and b:
        if b in {"#VALUE!", "VOLSKWAGEN"}:
            if active_section != "Logos":
                active_section = "Logos"
                current_crew_item = None
                block["items"].append(section_item(row, active_section, "B:D", entry["bold"].get("B")))
            block["items"].append({"kind": "list_item", "row": row, "section": active_section, "value": b})
        elif active_section == "AGRADECIMIENTOS" and entry["bold"].get("B"):
            active_section = b
            current_crew_item = None
            block["items"].append(section_item(row, b, "B:D", entry["bold"].get("B")))
        elif active_section == "AGRADECIMIENTOS":
            block["items"].append({"kind": "list_item", "row": row, "section": active_section, "value": b})
        elif active_section == "Licencias Musicales":
            block["items"].append({"kind": "list_item", "row": row, "section": active_section, "value": b})
        elif active_section not in {None, "Logos", "closing_copy"} and entry["bold"].get("B") and b != active_section:
            active_section = b
            current_crew_item = None
            block["items"].append(section_item(row, b, "B:D", entry["bold"].get("B")))
        elif active_section == "closing_copy":
            block["items"].append({"kind": "closing_line", "row": row, "section": active_section, "value": b})
        elif active_section == "Vestuario" and b != "Vestuario":
            block["items"].append({"kind": "list_item", "row": row, "section": active_section, "value": b})
        else:
            active_section = b
            current_crew_item = None
            block["items"].append(section_item(row, b, "B:D", entry["bold"].get("B")))
    elif c and not b and not d:
        if active_section == "closing_copy":
            block["items"].append({"kind": "closing_line", "row": row, "section": active_section, "value": c})
        elif c == "Empresas de Servicios":
            active_section = c
            current_crew_item = None
            block["items"].append(section_item(row, c, "C", entry["bold"].get("C")))
        elif active_section in {"Doblaje de Figuracion", "Doblaje de Figuración"}:
            block["items"].append({"kind": "list_item", "row": row, "section": active_section, "value": c})
        else:
            active_section = c
            current_crew_item = None
            block["items"].append(section_item(row, c, "C", entry["bold"].get("C")))
    elif b and d:
        current_crew_item = {
            "kind": "crew_credit",
            "row": row,
            "section": active_section,
            "role": b,
            "names": [{"row": row, "name": d}],
        }
        block["items"].append(current_crew_item)
    elif d and current_crew_item:
        current_crew_item["names"].append({"row": row, "name": d})
    elif b and not c and not d:
        if b == "Licencias Musicales":
            active_section = b
            current_crew_item = None
            block["items"].append(section_item(row, b, "B", entry["bold"].get("B")))
        else:
            block["items"].append({"kind": "list_item", "row": row, "section": active_section, "value": b})
    elif c or d:
        block["items"].append({"kind": "unclassified", "row": row, "section": active_section, "B": b, "C": c, "D": d})

    return active_section, current_crew_item


def normalize_trailing_closing_copy(result):
    for block in result.get("blocks", []):
        if block.get("type") != "crew":
            continue
        items = block.get("items", [])
        suffix_start = len(items)
        while suffix_start > 0 and is_trailing_copy_suffix_candidate(items[suffix_start - 1]):
            suffix_start -= 1
        if suffix_start == len(items):
            continue
        suffix = items[suffix_start:]
        marker_offset = next(
            (index for index, item in enumerate(suffix) if looks_like_closing_copy_text(item.get("value") or item.get("title") or "")),
            None,
        )
        start = suffix_start + marker_offset if marker_offset is not None else suffix_start
        block["items"] = items[:start] + [
            {
                "kind": "closing_line",
                "row": item.get("row"),
                "section": "closing_copy",
                "value": item.get("value") or item.get("title") or "",
            }
            for item in items[start:]
        ]


def is_trailing_copy_suffix_candidate(item):
    if item.get("kind") == "closing_line":
        return True
    if item.get("kind") == "section":
        return item.get("source_column") in {"B:D", "C"} and not item.get("source_bold")
    if item.get("kind") == "list_item":
        return True
    return False


def looks_like_closing_copy_text(value):
    text = normalize_copy_text(value)
    return any(
        marker in text
        for marker in [
            "produccion",
            "colaboracion",
            "copyright",
            "deposito legal",
            "copy animado",
            "atresmedia",
        ]
    ) or "©" in str(value or "")


def normalize_copy_text(value):
    text = str(value or "").lower()
    replacements = {
        "á": "a",
        "é": "e",
        "í": "i",
        "ó": "o",
        "ú": "u",
        "ü": "u",
        "ñ": "n",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    return re.sub(r"\s+", " ", text).strip()


def parse(file_bytes, source_name, options=None):
    with zipfile.ZipFile(BytesIO(file_bytes)) as zip_file:
        sheets = workbook_sheets(zip_file)
        sheet = choose_sheet(sheets)
        rows = read_sheet_rows(zip_file, sheet["path"])
        parsed = parse_rows(rows, source_name, sheet["name"])
        parsed["workbook_sheets"] = [{"name": s["name"], "is_active": s["is_active"]} for s in sheets]
        parsed["import_model_id"] = IMPORT_MODEL["id"]
        return parsed


IMPORT_MODEL = {
    "id": "standard_credits_xls",
    "label": "XLS Créditos Buendía",
    "source_kinds": ["xlsx"],
    "parse": parse,
}
