import json
import os
from pathlib import Path, PurePath

from .inspection import inspect_source_rows


BLOCK_MODEL_SCHEMA = "parser_lab_block_model"
BLOCK_MODEL_VERSION = 4
BLOCK_MODEL_FILENAME = "block-model.json"
PERSISTENT_BLOCK_MODEL_DIRECTORY = Path.home() / ".creditos" / "parser-lab"


def inspect_uploaded_source(file_bytes, source_name, source_kind=None):
    """Build a parser-lab inspection document from an uploaded spreadsheet."""
    kind = source_kind or source_kind_from_name(source_name)
    return inspect_source_rows(file_bytes, source_name, kind)


def source_kind_from_name(source_name):
    suffix = PurePath(str(source_name or "")).suffix.lower().lstrip(".")
    if suffix not in {"ods", "xlsx"}:
        raise ValueError("Parser Lab solo admite archivos .ods y .xlsx.")
    return suffix


def temporary_block_model_path():
    configured_directory = os.environ.get("CREDITOS_PARSER_LAB_TEMP_DIR")
    base_directory = Path(configured_directory) if configured_directory else PERSISTENT_BLOCK_MODEL_DIRECTORY
    return base_directory / BLOCK_MODEL_FILENAME


def empty_block_model():
    return {
        "schema": BLOCK_MODEL_SCHEMA,
        "version": BLOCK_MODEL_VERSION,
        "blocks": [],
        "composition_rules": [],
        "normalized_rows_view": {"column_widths": {}},
    }


def load_temporary_block_model():
    path = temporary_block_model_path()
    if not path.exists():
        model = empty_block_model()
    else:
        model = json.loads(path.read_text(encoding="utf-8"))
        validate_block_model(model)
    return {"model": model, "path": str(path), "temporary": True}


def save_temporary_block_model(model):
    validate_block_model(model)
    path = temporary_block_model_path()
    write_block_model(path, model)
    return {"model": model, "path": str(path), "temporary": True}


def write_block_model(path, model):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = path.with_suffix(".tmp")
    temporary_path.write_text(
        json.dumps(model, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    temporary_path.replace(path)


def validate_block_model(model):
    if not isinstance(model, dict):
        raise ValueError("El modelo temporal de bloques debe ser un objeto JSON.")
    if model.get("schema") != BLOCK_MODEL_SCHEMA or model.get("version") != BLOCK_MODEL_VERSION:
        raise ValueError("El modelo temporal de bloques no tiene un contrato válido.")
    blocks = model.get("blocks")
    if not isinstance(blocks, list):
        raise ValueError("El modelo temporal de bloques necesita una lista de bloques.")
    for index, block in enumerate(blocks):
        if not isinstance(block, dict) or not isinstance(block.get("header"), dict):
            raise ValueError(f"El bloque {index + 1} no tiene una cabecera válida.")
        if not str(block.get("id") or "").strip() or not str(block.get("name") or "").strip():
            raise ValueError(f"El bloque {index + 1} necesita identificador y nombre.")
        if not isinstance(block.get("enabled"), bool):
            raise ValueError(f"El bloque {index + 1} necesita un estado de inclusión válido.")
        interpretation = block.get("interpretation")
        if not isinstance(interpretation, dict):
            raise ValueError(f"El bloque {index + 1} necesita una interpretación completa.")
        if interpretation.get("orientation") not in {"vertical", "horizontal"}:
            raise ValueError(f"El bloque {index + 1} tiene una orientación inválida.")
        if interpretation.get("item_grouping") not in {"empty_rows", "row", "first_term"}:
            raise ValueError(f"El bloque {index + 1} tiene una agrupación inválida.")
        if "separator" in interpretation:
            raise ValueError(f"El bloque {index + 1} usa el contrato antiguo de separador.")
        term_roles = interpretation.get("term_roles")
        if not isinstance(term_roles, dict) or term_roles.get("first") not in {"principal", "secondary"} or term_roles.get("following") not in {"principal", "secondary"}:
            raise ValueError(f"El bloque {index + 1} tiene roles tipográficos inválidos.")
        empty_rows = interpretation.get("empty_rows")
        if not isinstance(empty_rows, dict) or set(empty_rows) != {"leading", "between_items", "trailing"}:
            raise ValueError(f"El bloque {index + 1} necesita las tres políticas de filas vacías.")
        for policy in empty_rows.values():
            if not isinstance(policy, dict) or policy.get("effect") not in {"continue", "item", "group", "page"} or policy.get("display") not in {"ignore", "compact", "preserve"}:
                raise ValueError(f"El bloque {index + 1} tiene una política de filas vacías inválida.")
    composition_rules = model.get("composition_rules")
    if not isinstance(composition_rules, list):
        raise ValueError("El modelo temporal necesita una lista de reglas de composición.")
    for index, rule in enumerate(composition_rules):
        if not isinstance(rule, dict) or not isinstance(rule.get("match"), dict) or not isinstance(rule.get("action"), dict):
            raise ValueError(f"La regla de composición {index + 1} no es válida.")
        if not str(rule.get("id") or "").strip():
            raise ValueError(f"La regla de composición {index + 1} necesita identificador.")
    normalized_rows_view = model.get("normalized_rows_view")
    if not isinstance(normalized_rows_view, dict):
        raise ValueError("El modelo temporal necesita la vista de filas normalizadas.")
    column_widths = normalized_rows_view.get("column_widths")
    allowed_columns = {"block", "A", "B", "C", "D"}
    if not isinstance(column_widths, dict) or any(column not in allowed_columns for column in column_widths):
        raise ValueError("La vista de filas normalizadas contiene columnas inválidas.")
    if column_widths and set(column_widths) != allowed_columns:
        raise ValueError("La vista de filas normalizadas necesita todos los anchos de columna.")
    if any(not isinstance(width, (int, float)) or isinstance(width, bool) or width < 56 or width > 900 for width in column_widths.values()):
        raise ValueError("La vista de filas normalizadas contiene anchos inválidos.")
    return model
