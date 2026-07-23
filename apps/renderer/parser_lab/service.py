import json
import os
from datetime import datetime, timezone
from pathlib import Path, PurePath
from uuid import uuid4

from .inspection import inspect_source_rows


BLOCK_MODEL_SCHEMA = "parser_lab_block_model"
BLOCK_MODEL_VERSION = 5
MODEL_LIBRARY_SCHEMA = "parser_lab_model_library"
MODEL_LIBRARY_VERSION = 1
MODEL_LIBRARY_FILENAME = "model-library.json"
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


def model_library_path():
    configured_directory = os.environ.get("CREDITOS_PARSER_LAB_TEMP_DIR")
    base_directory = Path(configured_directory) if configured_directory else PERSISTENT_BLOCK_MODEL_DIRECTORY
    return base_directory / MODEL_LIBRARY_FILENAME


def empty_block_model():
    return {
        "schema": BLOCK_MODEL_SCHEMA,
        "version": BLOCK_MODEL_VERSION,
        "blocks": [],
        "composition_rules": [],
        "normalized_rows_view": {"column_widths": {}},
    }


def empty_model_library():
    model_id = new_model_id()
    timestamp = now_iso()
    return {
        "schema": MODEL_LIBRARY_SCHEMA,
        "version": MODEL_LIBRARY_VERSION,
        "active_model_id": model_id,
        "models": [
            {
                "id": model_id,
                "name": "Modelo sin título",
                "revision": 1,
                "created_at": timestamp,
                "updated_at": timestamp,
                "model": empty_block_model(),
            }
        ],
    }


def load_model_library():
    path = model_library_path()
    if not path.exists():
        library = empty_model_library()
        write_json_document(path, library)
    else:
        library = json.loads(path.read_text(encoding="utf-8"))
        validate_model_library(library)
    return {"library": library, "path": str(path), "temporary": True}


def apply_model_library_action(payload):
    if not isinstance(payload, dict):
        raise ValueError("La operación de modelos debe ser un objeto JSON.")
    action = payload.get("action")
    loaded = load_model_library()
    library = loaded["library"]

    if action == "create":
        name = unique_model_name(library, payload.get("name") or "Modelo sin título")
        record = new_model_record(name, empty_block_model())
        library["models"].append(record)
        library["active_model_id"] = record["id"]
    elif action == "duplicate":
        source = require_model(library, payload.get("model_id"))
        name = unique_model_name(library, payload.get("name") or f"{source['name']} copia")
        record = new_model_record(name, source["model"])
        library["models"].append(record)
        library["active_model_id"] = record["id"]
    elif action == "rename":
        record = require_model(library, payload.get("model_id"))
        name = clean_model_name(payload.get("name"))
        ensure_unique_model_name(library, name, excluding_id=record["id"])
        record["name"] = name
        touch_model_record(record)
    elif action == "delete":
        record = require_model(library, payload.get("model_id"))
        library["models"] = [
            candidate for candidate in library["models"] if candidate["id"] != record["id"]
        ]
        if library["active_model_id"] == record["id"]:
            library["active_model_id"] = (
                library["models"][0]["id"] if library["models"] else None
            )
    elif action == "set_active":
        record = require_model(library, payload.get("model_id"))
        library["active_model_id"] = record["id"]
    elif action == "save":
        record = require_model(library, payload.get("model_id"))
        model = payload.get("model")
        validate_block_model(model)
        record["model"] = json.loads(json.dumps(model))
        touch_model_record(record)
    else:
        raise ValueError("La operación de modelos no es válida.")

    validate_model_library(library)
    path = model_library_path()
    write_json_document(path, library)
    return {"library": library, "path": str(path), "temporary": True}


def write_json_document(path, document):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = path.with_suffix(".tmp")
    temporary_path.write_text(
        json.dumps(document, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    temporary_path.replace(path)


def validate_model_library(library):
    if not isinstance(library, dict):
        raise ValueError("La biblioteca de modelos debe ser un objeto JSON.")
    if (
        library.get("schema") != MODEL_LIBRARY_SCHEMA
        or library.get("version") != MODEL_LIBRARY_VERSION
    ):
        raise ValueError("La biblioteca de modelos no tiene un contrato válido.")
    models = library.get("models")
    if not isinstance(models, list):
        raise ValueError("La biblioteca necesita una lista de modelos.")
    identifiers = set()
    names = set()
    for index, record in enumerate(models):
        if not isinstance(record, dict):
            raise ValueError(f"El modelo {index + 1} no es válido.")
        identifier = str(record.get("id") or "").strip()
        name = clean_model_name(record.get("name"))
        if not identifier or identifier in identifiers:
            raise ValueError("Los modelos necesitan identificadores únicos.")
        normalized_name = name.casefold()
        if normalized_name in names:
            raise ValueError("Los modelos necesitan nombres únicos.")
        if not isinstance(record.get("revision"), int) or record["revision"] < 1:
            raise ValueError(f"El modelo “{name}” tiene una revisión inválida.")
        if not isinstance(record.get("created_at"), str) or not record["created_at"]:
            raise ValueError(f"El modelo “{name}” no tiene fecha de creación.")
        if not isinstance(record.get("updated_at"), str) or not record["updated_at"]:
            raise ValueError(f"El modelo “{name}” no tiene fecha de actualización.")
        validate_block_model(record.get("model"))
        identifiers.add(identifier)
        names.add(normalized_name)
    active_model_id = library.get("active_model_id")
    if active_model_id is not None and active_model_id not in identifiers:
        raise ValueError("El modelo activo no existe en la biblioteca.")
    if models and active_model_id is None:
        raise ValueError("La biblioteca necesita un modelo activo.")
    if not models and active_model_id is not None:
        raise ValueError("Una biblioteca vacía no puede tener modelo activo.")
    return library


def new_model_record(name, model):
    timestamp = now_iso()
    return {
        "id": new_model_id(),
        "name": clean_model_name(name),
        "revision": 1,
        "created_at": timestamp,
        "updated_at": timestamp,
        "model": json.loads(json.dumps(model)),
    }


def new_model_id():
    return f"rule_model_{uuid4().hex}"


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def touch_model_record(record):
    record["revision"] += 1
    record["updated_at"] = now_iso()


def clean_model_name(name):
    clean_name = str(name or "").strip()
    if not clean_name:
        raise ValueError("El modelo necesita nombre.")
    return clean_name


def unique_model_name(library, base_name):
    clean_base = clean_model_name(base_name)
    existing = {record["name"].casefold() for record in library["models"]}
    if clean_base.casefold() not in existing:
        return clean_base
    index = 2
    while f"{clean_base} {index}".casefold() in existing:
        index += 1
    return f"{clean_base} {index}"


def ensure_unique_model_name(library, name, excluding_id=None):
    if any(
        record["id"] != excluding_id and record["name"].casefold() == name.casefold()
        for record in library["models"]
    ):
        raise ValueError("Ya existe un modelo con ese nombre.")


def require_model(library, model_id):
    record = next(
        (candidate for candidate in library["models"] if candidate["id"] == model_id),
        None,
    )
    if record is None:
        raise ValueError("El modelo seleccionado no existe.")
    return record


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
        if interpretation.get("content_start") not in {"after_header", "header"}:
            raise ValueError(f"El bloque {index + 1} tiene un inicio de contenido inválido.")
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
