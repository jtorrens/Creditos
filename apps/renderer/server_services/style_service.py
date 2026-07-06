import json

from .common import now_iso


def save_style(connection, production_id, data):
    if not isinstance(data, dict):
        raise ValueError("El estilo debe ser un objeto.")
    style_id = str(data.get("id") or "").strip()
    if not style_id:
        raise ValueError("El estilo necesita id.")
    name = str(data.get("name") or style_id).strip()
    timestamp = now_iso()
    connection.execute(
        """
        INSERT INTO styles (production_id, style_id, name, data_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(production_id, style_id) DO UPDATE SET
            name = excluded.name,
            data_json = excluded.data_json,
            updated_at = excluded.updated_at
        """,
        (int(production_id), style_id, name, json.dumps(data, ensure_ascii=False), timestamp, timestamp),
    )
    connection.commit()


def load_styles(connection, production_id):
    rows = connection.execute(
        """
        SELECT data_json
        FROM styles
        WHERE production_id = ?
        ORDER BY name COLLATE NOCASE
        """,
        (int(production_id),),
    )
    return [json.loads(row["data_json"]) for row in rows]


def delete_style(connection, production_id, style_id):
    connection.execute(
        "DELETE FROM styles WHERE production_id = ? AND style_id = ?",
        (int(production_id), str(style_id or "")),
    )
    connection.commit()
