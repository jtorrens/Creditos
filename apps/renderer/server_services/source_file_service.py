import base64

from .common import now_iso


def save_source_file(
    connection,
    production_id,
    episode_id,
    import_model_id,
    file_name,
    mime_type,
    file_bytes,
):
    model_id = str(import_model_id or "").strip()
    clean_name = str(file_name or "").strip()
    if not model_id:
        raise ValueError("El archivo de origen necesita un modelo de importacion.")
    if not clean_name:
        raise ValueError("El archivo de origen necesita nombre.")
    if not isinstance(file_bytes, bytes) or not file_bytes:
        raise ValueError("El archivo de origen esta vacio.")
    timestamp = now_iso()
    connection.execute(
        """
        INSERT INTO source_files (
            production_id, episode_id, import_model_id,
            file_name, mime_type, data_blob, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(production_id, episode_id, import_model_id) DO UPDATE SET
            file_name = excluded.file_name,
            mime_type = excluded.mime_type,
            data_blob = excluded.data_blob,
            updated_at = excluded.updated_at
        """,
        (
            int(production_id),
            int(episode_id),
            model_id,
            clean_name,
            str(mime_type or "application/octet-stream"),
            file_bytes,
            timestamp,
            timestamp,
        ),
    )
    connection.commit()


def load_active_source_file(connection, production_id, episode_id):
    row = connection.execute(
        """
        SELECT
            source_files.import_model_id,
            source_files.file_name,
            source_files.mime_type,
            source_files.data_blob
        FROM source_files
        JOIN productions ON productions.id = source_files.production_id
        JOIN episodes ON episodes.id = source_files.episode_id
        WHERE source_files.production_id = ?
          AND source_files.episode_id = ?
          AND episodes.production_id = source_files.production_id
          AND source_files.import_model_id = productions.import_model_id
        """,
        (int(production_id), int(episode_id)),
    ).fetchone()
    if not row:
        return None
    return {
        "import_model_id": row["import_model_id"],
        "name": row["file_name"],
        "mime": row["mime_type"],
        "base64": base64.b64encode(row["data_blob"]).decode("ascii"),
    }
