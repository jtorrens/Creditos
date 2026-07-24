import re
import zipfile
from io import BytesIO
from pathlib import PurePath

from .common.normalized_rows import expand_empty_rows, read_normalized_workbook
from .common.source_schema import validate_source_json
from .common.rule_model_schema import validate_rule_model


IMPORT_MODEL = {
    "id": "rule_based_credits",
    "label": "Modelo manual de reglas",
    "source_kinds": ["ods", "xlsx"],
    "dynamic_template": True,
    "parse": lambda file_bytes, source_name, options=None: parse(
        file_bytes, source_name, options or {}
    ),
}


def parse(file_bytes, source_name, options):
    rule_record = options.get("rule_model")
    if not isinstance(rule_record, dict):
        raise ValueError("La importación necesita un modelo de reglas persistido.")
    model = rule_record.get("model")
    validate_rule_model(model)
    source_kind = PurePath(source_name).suffix.lower().lstrip(".")
    if source_kind not in {"ods", "xlsx"}:
        raise ValueError("El modelo de reglas solo admite archivos .ods y .xlsx.")
    with zipfile.ZipFile(BytesIO(file_bytes)) as zip_file:
        sheets, sheet, sparse_rows = read_normalized_workbook(zip_file, source_kind)
    rows = expand_empty_rows(sparse_rows)
    instances = find_block_instances(rows, model["blocks"])
    unresolved = blocking_instances(model["blocks"], instances)
    if unresolved:
        details = ", ".join(
            f"{instance['name']} ({status_label(instance['match_status'])})"
            for instance in unresolved
        )
        raise ValueError(f"El modelo no puede aplicarse de forma inequívoca: {details}.")
    matched = matched_block_pairs(model["blocks"], instances)
    if any(definition["enabled"] for definition in model["blocks"]) and not matched:
        raise ValueError("El modelo no coincide con ninguna frontera habilitada del archivo.")
    blocks = []
    for definition, instance in matched:
        interpreted = interpret_block(rows, instance, definition)
        blocks.append(source_block(definition, interpreted))
    result = {
        "source": source_name,
        "sheet": sheet["name"],
        "columns": {
            "A": "rule_source",
            "B": "rule_source",
            "C": "rule_source",
            "D": "rule_source",
        },
        "blocks": blocks,
        "workbook_sheets": [
            {"name": item["name"], "is_active": bool(item["is_active"])}
            for item in sheets
        ],
        "import_model_id": rule_record["id"],
        "import_rule_model": {
            "id": rule_record["id"],
            "name": rule_record["name"],
            "revision": rule_record["revision"],
        },
        "composition_rules": model.get("composition_rules", []),
    }
    validate_source_json(result)
    return result


def blocking_instances(definitions, instances):
    return [
        instance
        for definition, instance in zip(definitions, instances)
        if definition["enabled"]
        and instance["match_status"] in {"ambiguous", "out_of_order"}
    ]


def matched_block_pairs(definitions, instances):
    return [
        (definition, instance)
        for definition, instance in zip(definitions, instances)
        if definition["enabled"] and instance["match_status"] == "matched"
    ]


def find_block_instances(rows, definitions):
    cursor = 0
    instances = []
    for definition in definitions:
        source = definition["header"]["source"]
        matched = [
            index for index, row in enumerate(rows)
            if row_matches(row, definition)
        ]
        if source == "sheet_start":
            candidates = [0] if rows else []
        elif source == "sheet_end":
            candidates = [len(rows) - 1] if rows else []
        elif source == "after_previous":
            candidates = [cursor] if cursor < len(rows) else []
        else:
            candidates = matched
        ordered = [index for index in candidates if index >= cursor]
        preceding = [index for index in candidates if index < cursor]
        if not ordered:
            status = "out_of_order" if preceding else "missing"
            instances.append(instance_record(definition, status, candidates))
            continue
        status = "ambiguous" if len(ordered) > 1 else "matched"
        selected = ordered[0]
        instances.append(instance_record(definition, status, candidates, selected))
        cursor = selected + 1
    matched_instances = [item for item in instances if item["source_index"] is not None]
    for index, instance in enumerate(matched_instances):
        next_instance = matched_instances[index + 1] if index + 1 < len(matched_instances) else None
        end_index = next_instance["source_index"] - 1 if next_instance else len(rows) - 1
        instance["end_index"] = end_index
        instance["end_row"] = rows[end_index]["row"]
    return instances


def instance_record(definition, status, candidates, selected=None):
    return {
        "definition_id": definition["id"],
        "name": definition["name"],
        "match_status": status,
        "candidate_rows": candidates,
        "source_index": selected,
        "start_row": None if selected is None else selected,
        "end_index": selected,
        "end_row": None,
    }


def row_matches(row, definition):
    header = definition["header"]
    if header["source"] != "match":
        return False
    actual = str(row.get("values", {}).get(header["column"], "") or "")
    expected = str(header.get("value") or "")
    operator = header["operator"]
    left = normalize_text(actual)
    right = normalize_text(expected)
    if operator == "nonempty":
        value_matches = bool(left)
    elif operator == "equals":
        value_matches = left == right
    elif operator == "contains":
        value_matches = right in left
    elif operator == "regex":
        value_matches = bool(re.search(expected, actual, flags=re.IGNORECASE))
    else:
        value_matches = False
    return (
        value_matches
        and requirement_matches(
            bool(row.get("bold", {}).get(header["column"])),
            header["bold"],
        )
        and requirement_matches(
            bool(row.get("merged_b_to_d")),
            header["merged_b_to_d"],
        )
    )


def interpret_block(rows, instance, definition):
    interpretation = definition["interpretation"]
    body_start = (
        instance["source_index"]
        if interpretation["content_start"] == "header"
        else instance["source_index"] + 1
    )
    body = rows[body_start:instance["end_index"] + 1]
    populated = [index for index, row in enumerate(body) if not is_empty(row)]
    if not populated:
        return {"items": [], "start_row": rows[instance["source_index"]]["row"]}
    first, last = populated[0], populated[-1]
    if interpretation["item_grouping"] == "row":
        items = interpret_rows(body, first, last, interpretation)
    elif interpretation["item_grouping"] == "first_term":
        items = interpret_first_term(body, first, last, interpretation)
    else:
        items = interpret_empty_groups(body, first, last, interpretation)
    return {
        "items": items,
        "start_row": rows[instance["source_index"]]["row"],
        "end_row": rows[instance["end_index"]]["row"],
    }


def interpret_rows(body, first, last, interpretation):
    items = []
    pending_empty = []
    for row in body[first:last + 1]:
        if is_empty(row):
            pending_empty.append(row)
            continue
        if pending_empty and items:
            apply_boundary(items[-1], interpretation, pending_empty)
        pending_empty = []
        values = flatten_row(row, interpretation)
        if values:
            items.append(build_item(values, [row["row"]], interpretation))
    return items


def interpret_first_term(body, first, last, interpretation):
    items = []
    values = []
    source_rows = []
    pending_empty = []

    def flush():
        nonlocal values, source_rows
        if values:
            items.append(build_item(values, source_rows, interpretation))
        values, source_rows = [], []

    for index in range(first, last + 1):
        row = body[index]
        if is_empty(row):
            pending_empty.append(row)
            continue
        if pending_empty and values:
            boundary = boundary_for(interpretation, pending_empty)
            if boundary["effect"] == "continue":
                pass
            else:
                flush()
                if items:
                    items[-1]["boundary_after"] = boundary
        pending_empty = []
        starts_item = bool(str(row["values"].get(interpretation["item_start_column"], "")).strip())
        if starts_item and values:
            flush()
        start_column = (
            "A"
            if interpretation["content_start"] == "header" and index == first
            else interpretation["item_start_column"]
        )
        row_values = flatten_row(row, interpretation, start_column)
        if row_values:
            source_rows.append(row["row"])
            values.extend(row_values)
    flush()
    return items


def interpret_empty_groups(body, first, last, interpretation):
    items = []
    values = []
    source_rows = []
    empty_rows = []

    def flush(boundary=None):
        nonlocal values, source_rows
        if values:
            item = build_item(values, source_rows, interpretation)
            if boundary:
                item["boundary_after"] = boundary
            items.append(item)
        values, source_rows = [], []

    for row in body[first:last + 1]:
        if is_empty(row):
            empty_rows.append(row)
            continue
        if empty_rows and values:
            boundary = boundary_for(interpretation, empty_rows)
            if boundary["effect"] != "continue":
                flush(boundary)
        empty_rows = []
        row_values = flatten_row(row, interpretation)
        if row_values:
            source_rows.append(row["row"])
            values.extend(row_values)
    flush()
    return items


def flatten_row(row, interpretation, start_column="A"):
    columns = ["A", "B", "C", "D"]
    start = columns.index(start_column)
    entries = []
    for column in columns[start:]:
        raw = str(row["values"].get(column, "") or "")
        parts = raw.splitlines() if interpretation.get("split_cell_lines") else [raw]
        for line, part in enumerate(parts, start=1):
            value = part.strip()
            if value:
                entries.append({
                    "row": row["row"],
                    "column": column,
                    "line": line,
                    "value": value,
                })
    return entries


def build_item(values, source_rows, interpretation):
    terms = []
    for index, value in enumerate(values):
        terms.append({
            **value,
            "role": (
                interpretation["term_roles"]["first"]
                if index == 0
                else interpretation["term_roles"]["following"]
            ),
        })
    return {
        "terms": terms,
        "source_rows": list(source_rows),
        "boundary_after": None,
    }


def apply_boundary(item, interpretation, empty_rows):
    item["boundary_after"] = boundary_for(interpretation, empty_rows)


def boundary_for(interpretation, empty_rows):
    policy = interpretation["empty_rows"]["between_items"]
    count = len(empty_rows)
    return {
        "effect": policy["effect"],
        "display": policy["display"],
        "source_count": count,
        "output_count": count if policy["display"] == "preserve" else 1 if policy["display"] == "compact" else 0,
    }


def source_block(definition, interpreted):
    output_items = []
    page_break_after_item_indexes = []
    output_row = interpreted["start_row"]
    for index, item in enumerate(interpreted["items"]):
        principal = [term for term in item["terms"] if term["role"] == "principal"]
        secondary = [term for term in item["terms"] if term["role"] == "secondary"]
        role = " · ".join(term["value"] for term in secondary)
        names = [
            {
                "row": output_row + name_index,
                "source_row": term["row"],
                "name": term["value"],
            }
            for name_index, term in enumerate(principal)
        ]
        output_items.append({
            "kind": "credit",
            "row": output_row,
            "source_row": item["source_rows"][0] if item["source_rows"] else interpreted["start_row"],
            "role": role,
            "names": names,
        })
        boundary = item.get("boundary_after") or {}
        if boundary.get("effect") == "page":
            page_break_after_item_indexes.append(index)
        output_row += max(1, len(names)) + int(boundary.get("output_count") or 0)
    return {
        "group": definition["id"],
        "title": definition["name"],
        "titles": [definition["name"]],
        "type": "rule_block",
        "start_row": interpreted["start_row"],
        "items": output_items,
        "layout_hint": "roll_section" if definition["interpretation"]["orientation"] == "horizontal" else "card",
        "orientation_hint": definition["interpretation"]["orientation"],
        "page_break_after_item_indexes": page_break_after_item_indexes,
    }


def is_empty(row):
    return bool(row.get("empty")) or not any(
        str(row.get("values", {}).get(column, "") or "").strip()
        for column in ("A", "B", "C", "D")
    )


def normalize_text(value):
    return " ".join(str(value or "").strip().split()).casefold()


def requirement_matches(actual, requirement):
    if requirement == "ignore":
        return True
    if requirement == "required":
        return actual
    if requirement == "forbidden":
        return not actual
    return False


def status_label(status):
    return {
        "missing": "frontera ausente",
        "out_of_order": "fuera de orden",
        "ambiguous": "frontera ambigua",
    }.get(status, status)
