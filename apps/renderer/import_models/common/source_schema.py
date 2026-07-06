ITEM_REQUIRED_FIELDS = {
    "credit": {"role", "names"},
    "cast": {"actor", "character"},
    "crew_credit": {"role", "names", "section"},
    "section": {"title", "source_column", "source_bold"},
    "list_item": {"section", "value"},
    "closing_line": {"section", "value"},
    "unclassified": set(),
}


def validate_source_json(source_json):
    require_type(source_json, dict, "source_json")
    require_type(source_json.get("source"), str, "source")
    require_type(source_json.get("sheet"), str, "sheet")
    require_type(source_json.get("columns"), dict, "columns")
    require_type(source_json.get("blocks"), list, "blocks")

    for block_index, block in enumerate(source_json["blocks"]):
        validate_block(block, f"blocks[{block_index}]")

    return source_json


def validate_block(block, path):
    require_type(block, dict, path)
    for key in ("group", "title", "titles", "type", "start_row", "items"):
        if key not in block:
            raise_schema_error(f"{path}.{key} is required")
    if block["group"] is not None:
        require_type(block["group"], str, f"{path}.group")
    require_type(block["title"], str, f"{path}.title")
    require_type(block["titles"], list, f"{path}.titles")
    require_type(block["type"], str, f"{path}.type")
    require_type(block["start_row"], int, f"{path}.start_row")
    require_type(block["items"], list, f"{path}.items")
    for title_index, title in enumerate(block["titles"]):
        require_type(title, str, f"{path}.titles[{title_index}]")
    for item_index, item in enumerate(block["items"]):
        validate_item(item, f"{path}.items[{item_index}]")


def validate_item(item, path):
    require_type(item, dict, path)
    require_type(item.get("kind"), str, f"{path}.kind")
    require_type(item.get("row"), int, f"{path}.row")
    kind = item["kind"]
    if kind not in ITEM_REQUIRED_FIELDS:
        raise_schema_error(f"{path}.kind has unsupported value {kind!r}")
    for key in ITEM_REQUIRED_FIELDS[kind]:
        if key not in item:
            raise_schema_error(f"{path}.{key} is required for kind {kind!r}")
    if "names" in item:
        validate_names(item["names"], f"{path}.names")


def validate_names(names, path):
    require_type(names, list, path)
    for index, item in enumerate(names):
        item_path = f"{path}[{index}]"
        require_type(item, dict, item_path)
        require_type(item.get("row"), int, f"{item_path}.row")
        require_type(item.get("name"), str, f"{item_path}.name")


def require_type(value, expected_type, path):
    if not isinstance(value, expected_type):
        expected_name = expected_type.__name__
        raise_schema_error(f"{path} must be {expected_name}")


def raise_schema_error(message):
    raise ValueError(f"Invalid source_json: {message}")
