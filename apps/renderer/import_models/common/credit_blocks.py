def normalize_group(value):
    if not value:
        return None
    try:
        number = float(value)
        return str(int(number)) if number.is_integer() else str(number)
    except ValueError:
        return value


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


def section_item(row, title, source_column, source_bold=False):
    return {
        "kind": "section",
        "row": row,
        "title": title,
        "source_column": source_column,
        "source_bold": bool(source_bold),
    }
