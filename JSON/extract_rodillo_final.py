import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path


INPUT = Path(__file__).with_name("TEST.xlsx")
OUTPUT = Path(__file__).with_name("TEST_rodillo_final_first_pass.json")
NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
XMLNS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"


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
    root = ET.fromstring(zip_file.read("xl/styles.xml"))
    fonts = []
    for font in root.find("a:fonts", NS):
        fonts.append(font.find("a:b", NS) is not None)

    bold_styles = {}
    for index, xf in enumerate(root.find("a:cellXfs", NS)):
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


def read_sheet_rows():
    with zipfile.ZipFile(INPUT) as zip_file:
        shared_strings = read_shared_strings(zip_file)
        bold_styles = read_bold_styles(zip_file)
        root = ET.fromstring(zip_file.read("xl/worksheets/sheet2.xml"))

        merged_rows = set()
        merge_cells = root.find("a:mergeCells", NS)
        if merge_cells is not None:
            for merge in merge_cells.findall("a:mergeCell", NS):
                ref = merge.attrib.get("ref", "")
                if re.match(r"B(\d+):D\1$", ref):
                    merged_rows.add(int(re.match(r"B(\d+):D\1$", ref).group(1)))

        rows = []
        for row in root.findall(".//a:sheetData/a:row", NS):
            number = int(row.attrib.get("r", "0"))
            values, styles = row_values(row, shared_strings)
            if any(values.values()):
                bold = {col: bold_styles.get(style, False) for col, style in styles.items()}
                rows.append(
                    {
                        "row": number,
                        "values": values,
                        "styles": styles,
                        "bold": bold,
                        "merged_b_to_d": number in merged_rows,
                    }
                )
        return rows


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


def parse_rows(rows):
    result = {
        "source": str(INPUT),
        "sheet": "Rodillo Final",
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
                current_block["items"].append(
                    {"kind": "unclassified", "row": row, "B": b, "C": c, "D": d}
                )

        elif current_block["type"] == "crew":
            if entry["merged_b_to_d"] and b:
                if b in {"#VALUE!", "VOLSKWAGEN"}:
                    if active_section != "Logos":
                        active_section = "Logos"
                        current_crew_item = None
                        current_block["items"].append({"kind": "section", "row": row, "title": active_section})
                    current_block["items"].append(
                        {"kind": "list_item", "row": row, "section": active_section, "value": b}
                    )
                elif active_section == "AGRADECIMIENTOS" and entry["bold"].get("B"):
                    active_section = b
                    current_crew_item = None
                    current_block["items"].append({"kind": "section", "row": row, "title": b})
                elif active_section == "AGRADECIMIENTOS":
                    current_block["items"].append(
                        {"kind": "list_item", "row": row, "section": active_section, "value": b}
                    )
                elif active_section not in {None, "Logos", "closing_copy"} and entry["bold"].get("B") and b != active_section:
                    active_section = b
                    current_crew_item = None
                    current_block["items"].append({"kind": "section", "row": row, "title": b})
                elif active_section == "Vestuario" and gap > 1:
                    active_section = "closing_copy"
                    current_crew_item = None
                    current_block["items"].append(
                        {"kind": "closing_line", "row": row, "section": active_section, "value": b}
                    )
                elif active_section == "closing_copy":
                    current_block["items"].append(
                        {"kind": "closing_line", "row": row, "section": active_section, "value": b}
                    )
                elif active_section == "Licencias Musicales":
                    current_block["items"].append(
                        {"kind": "list_item", "row": row, "section": active_section, "value": b}
                    )
                elif active_section in {"Vestuario"} and b != "Vestuario":
                    current_block["items"].append(
                        {"kind": "list_item", "row": row, "section": active_section, "value": b}
                    )
                else:
                    active_section = b
                    current_crew_item = None
                    current_block["items"].append({"kind": "section", "row": row, "title": b})
            elif c and not b and not d:
                if c == "Empresas de Servicios":
                    active_section = c
                    current_crew_item = None
                    current_block["items"].append({"kind": "section", "row": row, "title": c})
                elif active_section and active_section == "Doblaje de Figuración":
                    current_block["items"].append(
                        {"kind": "list_item", "row": row, "section": active_section, "value": c}
                    )
                else:
                    active_section = c
                    current_crew_item = None
                    current_block["items"].append({"kind": "section", "row": row, "title": c})
            elif b and d:
                current_crew_item = {
                    "kind": "crew_credit",
                    "row": row,
                    "section": active_section,
                    "role": b,
                    "names": [{"row": row, "name": d}],
                }
                current_block["items"].append(current_crew_item)
            elif d and current_crew_item:
                current_crew_item["names"].append({"row": row, "name": d})
            elif b and not c and not d:
                current_block["items"].append(
                    {"kind": "list_item", "row": row, "section": active_section, "value": b}
                )
            elif c or d:
                current_block["items"].append(
                    {"kind": "unclassified", "row": row, "section": active_section, "B": b, "C": c, "D": d}
                )

        last_data_row = row

    return result


def main():
    rows = read_sheet_rows()
    parsed = parse_rows(rows)
    OUTPUT.write_text(json.dumps(parsed, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUTPUT}")
    print(f"Blocks: {len(parsed['blocks'])}")
    for block in parsed["blocks"]:
        print(f"{block['group']}: {block['title']} ({block['type']}) -> {len(block['items'])} items")


if __name__ == "__main__":
    main()
