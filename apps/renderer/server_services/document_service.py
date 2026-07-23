import json

from .common import now_iso


DOCUMENT_KINDS = {"source", "structure", "render", "reference"}
MODEL_SCOPED_DOCUMENT_KINDS = {"source", "structure", "render"}


def document_import_model_id(kind, import_model_id):
    if kind not in MODEL_SCOPED_DOCUMENT_KINDS:
        return ""
    model_id = str(import_model_id or "").strip()
    if not model_id:
        raise ValueError("El documento necesita un modelo de importacion.")
    return model_id


def save_document(connection, production_id, episode_id, kind, data, import_model_id=None):
    if kind not in DOCUMENT_KINDS:
        raise ValueError("Tipo de documento no valido.")
    if not isinstance(data, dict):
        raise ValueError("El documento debe ser un objeto.")
    model_id = document_import_model_id(kind, import_model_id)
    timestamp = now_iso()
    schema = data.get("schema")
    version = data.get("version")
    connection.execute(
        """
        INSERT INTO documents (
            production_id, episode_id, kind, import_model_id,
            schema, version, data_json, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(production_id, episode_id, kind, import_model_id) DO UPDATE SET
            schema = excluded.schema,
            version = excluded.version,
            data_json = excluded.data_json,
            updated_at = excluded.updated_at
        """,
        (
            int(production_id),
            int(episode_id),
            kind,
            model_id,
            schema,
            version if isinstance(version, int) else None,
            json.dumps(data, ensure_ascii=False),
            timestamp,
            timestamp,
        ),
    )
    connection.commit()


def load_document(connection, production_id, episode_id, kind, import_model_id=None):
    if kind not in DOCUMENT_KINDS:
        raise ValueError("Tipo de documento no valido.")
    model_id = document_import_model_id(kind, import_model_id)
    row = connection.execute(
        """
        SELECT data_json
        FROM documents
        WHERE production_id = ? AND episode_id = ? AND kind = ? AND import_model_id = ?
        """,
        (int(production_id), int(episode_id), kind, model_id),
    ).fetchone()
    return json.loads(row["data_json"]) if row else None


def list_structure_sources(connection, production_id):
    rows = connection.execute(
        """
        SELECT structure.episode_id, structure.import_model_id, structure.updated_at
        FROM documents AS structure
        WHERE structure.production_id = ?
          AND structure.kind = 'structure'
          AND EXISTS (
              SELECT 1
              FROM documents AS source
              WHERE source.production_id = structure.production_id
                AND source.episode_id = structure.episode_id
                AND source.import_model_id = structure.import_model_id
                AND source.kind = 'source'
          )
        ORDER BY structure.episode_id, structure.import_model_id
        """,
        (int(production_id),),
    ).fetchall()
    return [
        {
            "episode_id": row["episode_id"],
            "import_model_id": row["import_model_id"],
            "updated_at": row["updated_at"],
        }
        for row in rows
    ]
