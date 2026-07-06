import re
import xml.etree.ElementTree as ET


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
