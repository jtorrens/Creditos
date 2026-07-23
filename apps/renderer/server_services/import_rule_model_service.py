import json
from uuid import uuid4

from import_models.common.rule_model_schema import validate_rule_model
from .common import now_iso


def load_rule_model_library(connection):
    records = [
        row_to_record(row)
        for row in connection.execute(
            """
            SELECT id, name, revision, model_json, created_at, updated_at, is_active
            FROM import_rule_models
            ORDER BY name COLLATE NOCASE, id
            """
        )
    ]
    active = next((record["id"] for record in records if record.pop("is_active")), None)
    if records and active is None:
        active = records[0]["id"]
        set_active(connection, active)
    return {
        "schema": "parser_lab_model_library",
        "version": 1,
        "active_model_id": active,
        "models": records,
    }


def apply_rule_model_library_action(connection, payload):
    if not isinstance(payload, dict):
        raise ValueError("La operación de modelos debe ser un objeto JSON.")
    action = payload.get("action")
    if action == "create":
        name = unique_name(connection, payload.get("name") or "Modelo sin título")
        record_id = f"rule_model_{uuid4().hex}"
        timestamp = now_iso()
        model = empty_rule_model()
        connection.execute(
            """
            INSERT INTO import_rule_models
                (id, name, revision, model_json, created_at, updated_at, is_active)
            VALUES (?, ?, 1, ?, ?, ?, 1)
            """,
            (record_id, name, json.dumps(model, ensure_ascii=False), timestamp, timestamp),
        )
        set_active(connection, record_id)
    elif action == "duplicate":
        source = require_record(connection, payload.get("model_id"))
        name = unique_name(connection, payload.get("name") or f"{source['name']} copia")
        record_id = f"rule_model_{uuid4().hex}"
        timestamp = now_iso()
        connection.execute(
            """
            INSERT INTO import_rule_models
                (id, name, revision, model_json, created_at, updated_at, is_active)
            VALUES (?, ?, 1, ?, ?, ?, 1)
            """,
            (record_id, name, source["model_json"], timestamp, timestamp),
        )
        set_active(connection, record_id)
    elif action == "rename":
        record = require_record(connection, payload.get("model_id"))
        name = clean_name(payload.get("name"))
        ensure_unique_name(connection, name, record["id"])
        touch_record(connection, record["id"], name=name)
    elif action == "delete":
        record = require_record(connection, payload.get("model_id"))
        connection.execute("DELETE FROM import_rule_models WHERE id = ?", (record["id"],))
        replacement = connection.execute(
            "SELECT id FROM import_rule_models ORDER BY name COLLATE NOCASE, id LIMIT 1"
        ).fetchone()
        if replacement:
            set_active(connection, replacement["id"])
    elif action == "set_active":
        record = require_record(connection, payload.get("model_id"))
        set_active(connection, record["id"])
    elif action == "save":
        record = require_record(connection, payload.get("model_id"))
        model = payload.get("model")
        validate_rule_model(model)
        touch_record(
            connection,
            record["id"],
            model_json=json.dumps(model, ensure_ascii=False),
        )
    else:
        raise ValueError("La operación de modelos no es válida.")
    connection.commit()
    return load_rule_model_library(connection)


def import_rule_model_library(connection, library):
    if not isinstance(library, dict) or not isinstance(library.get("models"), list):
        raise ValueError("La biblioteca local no es válida.")
    if connection.execute("SELECT COUNT(*) AS count FROM import_rule_models").fetchone()["count"]:
        raise ValueError("La DB ya contiene modelos de reglas.")
    active_id = library.get("active_model_id")
    for record in library["models"]:
        model = record.get("model")
        validate_rule_model(model)
        connection.execute(
            """
            INSERT INTO import_rule_models
                (id, name, revision, model_json, created_at, updated_at, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                str(record["id"]),
                clean_name(record["name"]),
                max(1, int(record.get("revision") or 1)),
                json.dumps(model, ensure_ascii=False),
                str(record.get("created_at") or now_iso()),
                str(record.get("updated_at") or now_iso()),
                1 if record["id"] == active_id else 0,
            ),
        )
    connection.commit()
    return load_rule_model_library(connection)


def list_rule_import_models(connection):
    return [
        {
            "id": row["id"],
            "label": row["name"],
            "source_kinds": ["ods", "xlsx"],
            "kind": "rule_model",
            "revision": row["revision"],
        }
        for row in connection.execute(
            "SELECT id, name, revision FROM import_rule_models ORDER BY name COLLATE NOCASE, id"
        )
    ]


def get_rule_model(connection, model_id):
    row = require_record(connection, model_id)
    model = json.loads(row["model_json"])
    validate_rule_model(model)
    return {
        "id": row["id"],
        "name": row["name"],
        "revision": row["revision"],
        "model": model,
    }


def row_to_record(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "revision": row["revision"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "model": json.loads(row["model_json"]),
        "is_active": bool(row["is_active"]),
    }


def require_record(connection, model_id):
    row = connection.execute(
        """
        SELECT id, name, revision, model_json, created_at, updated_at, is_active
        FROM import_rule_models
        WHERE id = ?
        """,
        (str(model_id or ""),),
    ).fetchone()
    if row is None:
        raise ValueError("El modelo de reglas seleccionado no existe.")
    return row


def set_active(connection, model_id):
    connection.execute("UPDATE import_rule_models SET is_active = 0")
    connection.execute("UPDATE import_rule_models SET is_active = 1 WHERE id = ?", (model_id,))


def touch_record(connection, model_id, name=None, model_json=None):
    updates = ["revision = revision + 1", "updated_at = ?"]
    values = [now_iso()]
    if name is not None:
        updates.append("name = ?")
        values.append(name)
    if model_json is not None:
        updates.append("model_json = ?")
        values.append(model_json)
    values.append(model_id)
    connection.execute(
        f"UPDATE import_rule_models SET {', '.join(updates)} WHERE id = ?",
        values,
    )


def clean_name(name):
    value = str(name or "").strip()
    if not value:
        raise ValueError("El modelo necesita nombre.")
    return value


def ensure_unique_name(connection, name, excluding_id=None):
    row = connection.execute(
        "SELECT id FROM import_rule_models WHERE name = ? COLLATE NOCASE AND id != ?",
        (name, str(excluding_id or "")),
    ).fetchone()
    if row:
        raise ValueError("Ya existe un modelo con ese nombre.")


def unique_name(connection, base_name):
    base = clean_name(base_name)
    candidate = base
    index = 2
    while connection.execute(
        "SELECT 1 FROM import_rule_models WHERE name = ? COLLATE NOCASE",
        (candidate,),
    ).fetchone():
        candidate = f"{base} {index}"
        index += 1
    return candidate


def empty_rule_model():
    return {
        "schema": "parser_lab_block_model",
        "version": 6,
        "blocks": [],
        "composition_rules": [],
        "normalized_rows_view": {"column_widths": {}},
    }
