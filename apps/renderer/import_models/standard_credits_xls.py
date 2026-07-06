import zipfile
from io import BytesIO

from .common.credit_blocks import append_card_item, classify_numbered_title, new_block, normalize_group
from .common.crew_rules import normalize_trailing_closing_copy, parse_crew_row
from .common.spreadsheet_readers import choose_sheet, read_sheet_rows, workbook_sheets


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
