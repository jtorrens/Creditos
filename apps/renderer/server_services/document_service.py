import json

from .common import now_iso


DOCUMENT_KINDS = {"source", "structure", "render", "reference"}


def save_document(connection, production_id, episode_id, kind, data):
    if kind not in DOCUMENT_KINDS:
        raise ValueError("Tipo de documento no valido.")
    if not isinstance(data, dict):
        raise ValueError("El documento debe ser un objeto.")
    timestamp = now_iso()
    schema = data.get("schema")
    version = data.get("version")
    connection.execute(
        """
        INSERT INTO documents (production_id, episode_id, kind, schema, version, data_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(production_id, episode_id, kind) DO UPDATE SET
            schema = excluded.schema,
            version = excluded.version,
            data_json = excluded.data_json,
            updated_at = excluded.updated_at
        """,
        (
            int(production_id),
            int(episode_id),
            kind,
            schema,
            version if isinstance(version, int) else None,
            json.dumps(data, ensure_ascii=False),
            timestamp,
            timestamp,
        ),
    )
    connection.commit()


def load_document(connection, production_id, episode_id, kind):
    if kind not in DOCUMENT_KINDS:
        raise ValueError("Tipo de documento no valido.")
    row = connection.execute(
        """
        SELECT data_json
        FROM documents
        WHERE production_id = ? AND episode_id = ? AND kind = ?
        """,
        (int(production_id), int(episode_id), kind),
    ).fetchone()
    return json.loads(row["data_json"]) if row else None
