BLOCK_MODEL_SCHEMA = "parser_lab_block_model"
BLOCK_MODEL_VERSION = 8


def validate_rule_model(model):
    if not isinstance(model, dict):
        raise ValueError("El modelo de reglas debe ser un objeto JSON.")
    if model.get("schema") != BLOCK_MODEL_SCHEMA or model.get("version") != BLOCK_MODEL_VERSION:
        raise ValueError("El modelo de reglas no tiene un contrato válido.")
    blocks = model.get("blocks")
    if not isinstance(blocks, list):
        raise ValueError("El modelo de reglas necesita una lista de bloques.")
    for index, block in enumerate(blocks):
        validate_rule_block(block, index)
    composition_rules = model.get("composition_rules")
    if not isinstance(composition_rules, list):
        raise ValueError("El modelo de reglas necesita una lista de composición.")
    for index, rule in enumerate(composition_rules):
        if (
            not isinstance(rule, dict)
            or not isinstance(rule.get("match"), dict)
            or not isinstance(rule.get("action"), dict)
            or not str(rule.get("id") or "").strip()
        ):
            raise ValueError(f"La regla de composición {index + 1} no es válida.")
    normalized_rows_view = model.get("normalized_rows_view")
    if not isinstance(normalized_rows_view, dict):
        raise ValueError("El modelo de reglas necesita la vista de filas normalizadas.")
    column_widths = normalized_rows_view.get("column_widths")
    allowed_columns = {"block", "A", "B", "C", "D"}
    if not isinstance(column_widths, dict) or any(column not in allowed_columns for column in column_widths):
        raise ValueError("La vista de filas normalizadas contiene columnas inválidas.")
    if column_widths and set(column_widths) != allowed_columns:
        raise ValueError("La vista de filas normalizadas necesita todos los anchos de columna.")
    if any(
        not isinstance(width, (int, float))
        or isinstance(width, bool)
        or width < 56
        or width > 900
        for width in column_widths.values()
    ):
        raise ValueError("La vista de filas normalizadas contiene anchos inválidos.")
    return model


def validate_rule_block(block, index):
    if not isinstance(block, dict) or not isinstance(block.get("header"), dict):
        raise ValueError(f"El bloque {index + 1} no tiene una cabecera válida.")
    if block["header"].get("source") not in {
        "match",
        "sheet_start",
        "after_previous",
        "sheet_end",
    }:
        raise ValueError(f"El bloque {index + 1} tiene una frontera de inicio inválida.")
    if not str(block.get("id") or "").strip() or not str(block.get("name") or "").strip():
        raise ValueError(f"El bloque {index + 1} necesita identificador y nombre.")
    if not isinstance(block.get("enabled"), bool):
        raise ValueError(f"El bloque {index + 1} necesita un estado de inclusión válido.")
    interpretation = block.get("interpretation")
    if not isinstance(interpretation, dict):
        raise ValueError(f"El bloque {index + 1} necesita una interpretación completa.")
    if interpretation.get("orientation") not in {"vertical", "horizontal"}:
        raise ValueError(f"El bloque {index + 1} tiene una orientación inválida.")
    if interpretation.get("content_start") not in {"after_header", "header"}:
        raise ValueError(f"El bloque {index + 1} tiene un inicio de contenido inválido.")
    if interpretation.get("item_grouping") not in {"empty_rows", "row", "first_term"}:
        raise ValueError(f"El bloque {index + 1} tiene una agrupación inválida.")
    if interpretation.get("item_start_column") not in {"A", "B", "C", "D"}:
        raise ValueError(f"El bloque {index + 1} tiene una columna inicial inválida.")
    if interpretation.get("item_start_merged_b_to_d") not in {"ignore", "required", "forbidden"}:
        raise ValueError(f"El bloque {index + 1} tiene una condición de combinación de inicio inválida.")
    if "separator" in interpretation:
        raise ValueError(f"El bloque {index + 1} usa el contrato antiguo de separador.")
    term_roles = interpretation.get("term_roles")
    if (
        not isinstance(term_roles, dict)
        or term_roles.get("first") not in {"principal", "secondary"}
        or term_roles.get("following") not in {"principal", "secondary"}
    ):
        raise ValueError(f"El bloque {index + 1} tiene roles tipográficos inválidos.")
    empty_rows = interpretation.get("empty_rows")
    if not isinstance(empty_rows, dict) or set(empty_rows) != {"leading", "between_items", "trailing"}:
        raise ValueError(f"El bloque {index + 1} necesita las tres políticas de filas vacías.")
    for policy in empty_rows.values():
        if (
            not isinstance(policy, dict)
            or policy.get("effect") not in {"continue", "item", "group", "page"}
            or policy.get("display") not in {"ignore", "compact", "preserve"}
        ):
            raise ValueError(f"El bloque {index + 1} tiene una política de filas vacías inválida.")
