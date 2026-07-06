import zipfile
from io import BytesIO

from .common.credit_blocks import append_card_item, new_block
from .common.crew_rules import normalize_trailing_closing_copy, parse_crew_row
from .common.spreadsheet_readers import read_ods_workbook


def stable_group(prefix, title, seen):
    key = " ".join(str(title or "block").lower().split())
    count = seen.get((prefix, key), 0) + 1
    seen[(prefix, key)] = count
    suffix = f"_{count}" if count > 1 else ""
    return f"{prefix}_{key}{suffix}"


def card_names(entry):
    values = entry["values"]
    return [value for value in (values["B"], values["C"], values["D"]) if value]


def parse_cards(rows, result, seen_groups):
    segment = []
    previous_row = None

    def finish_segment():
        if not segment:
            return
        first = segment[0]
        values = first["values"]
        title = values["C"] or values["B"] or values["D"]
        if not title or title == "CARTONES O RODILLO":
            segment.clear()
            return
        block = new_block(first["row"], stable_group("card", title, seen_groups), title, "cards")
        item = append_card_item(block, first["row"], title)
        for entry in segment[1:]:
            for name in card_names(entry):
                item["names"].append({"row": entry["row"], "name": name})
        result["blocks"].append(block)
        segment.clear()

    for entry in rows:
        if previous_row is not None and (
            entry["row"] - previous_row > 1
            or (entry["merged_b_to_d"] and segment)
        ):
            finish_segment()
        segment.append(entry)
        previous_row = entry["row"]
    finish_segment()


def parse_cast(rows, result, seen_groups):
    current = None
    for entry in rows:
        values = entry["values"]
        b, c, d = values["B"], values["C"], values["D"]
        if c and not b and not d:
            current = new_block(entry["row"], stable_group("cast", c, seen_groups), c, "cast")
            result["blocks"].append(current)
        elif b and d and current is not None:
            current["items"].append({"kind": "cast", "row": entry["row"], "actor": b, "character": d})
        elif (b or c or d) and current is not None:
            current["items"].append({"kind": "unclassified", "row": entry["row"], "B": b, "C": c, "D": d})


def parse_crew(rows, result):
    if not rows:
        return
    first = rows[0]
    title = first["values"]["C"] or first["values"]["B"] or "RODILLO FINAL"
    block = new_block(first["row"], "crew", "RODILLO FINAL", "crew")
    result["blocks"].append(block)
    active_section = None
    current_item = None
    previous_row = None
    for entry in rows:
        values = entry["values"]
        gap = 0 if previous_row is None else entry["row"] - previous_row
        active_section, current_item = parse_crew_row(
            block,
            entry,
            entry["row"],
            values["B"],
            values["C"],
            values["D"],
            gap,
            active_section,
            current_item,
        )
        previous_row = entry["row"]
    if not block["items"] and title:
        block["title"] = title
        block["titles"] = [title]
    normalize_acknowledgements(block)


def normalize_acknowledgements(block):
    normalized = []
    in_acknowledgements = False
    active_subsection = None
    for item in block.get("items", []):
        if item.get("kind") == "section" and item.get("title") == "AGRADECIMIENTOS":
            in_acknowledgements = True
            active_subsection = None
            normalized.append(item)
            continue
        if not in_acknowledgements or item.get("kind") != "section":
            normalized.append(item)
            continue
        if item.get("source_bold"):
            active_subsection = item.get("title")
            normalized.append(item)
            continue
        normalized.append(
            {
                "kind": "list_item",
                "row": item.get("row"),
                "section": active_subsection or "AGRADECIMIENTOS",
                "value": item.get("title") or "",
            }
        )
    block["items"] = normalized


def parse_rows(rows, source_name, sheet_name):
    result = {
        "source": source_name,
        "sheet": sheet_name,
        "columns": {"A": "marker", "B": "role_or_character", "C": "center_title", "D": "name_or_actor"},
        "blocks": [],
    }
    seen_groups = {}
    cast_start = next(
        (index for index, entry in enumerate(rows) if entry["values"]["C"] == "Han intervenido"),
        len(rows),
    )
    crew_start = next(
        (index for index, entry in enumerate(rows) if entry["values"]["C"] == "Equipo técnico"),
        len(rows),
    )
    parse_cards(rows[:cast_start], result, seen_groups)
    parse_cast(rows[cast_start:crew_start], result, seen_groups)
    parse_crew(rows[crew_start:], result)
    normalize_trailing_closing_copy(result)
    return result


def parse(file_bytes, source_name, options=None):
    with zipfile.ZipFile(BytesIO(file_bytes)) as zip_file:
        sheets, sheet, rows = read_ods_workbook(zip_file)
        parsed = parse_rows(rows, source_name, sheet["name"])
        parsed["workbook_sheets"] = [{"name": item["name"], "is_active": item["is_active"]} for item in sheets]
        parsed["import_model_id"] = IMPORT_MODEL["id"]
        return parsed


IMPORT_MODEL = {
    "id": "traz_credits_ods",
    "label": "ODS Créditos TRAZ",
    "source_kinds": ["ods"],
    "parse": parse,
}
