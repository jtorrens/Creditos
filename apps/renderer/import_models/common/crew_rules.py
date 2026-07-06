from .credit_blocks import section_item
from .text_rules import looks_like_closing_copy_text


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
