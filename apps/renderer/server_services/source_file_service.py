import base64

from .common import now_iso
from .content_scope import content_scope


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
    local_production_id, local_episode_id = content_scope(
        connection, production_id, episode_id
    )
    timestamp = now_iso()
    connection.execute(
        """
        INSERT INTO source_files (
            production_id, episode_id, import_model_id,
            file_name, mime_type, data_blob, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT DO UPDATE SET
            file_name = excluded.file_name,
            mime_type = excluded.mime_type,
            data_blob = excluded.data_blob,
            updated_at = excluded.updated_at
        """,
        (
            local_production_id,
            local_episode_id,
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
    local_production_id, local_episode_id = content_scope(
        connection, production_id, episode_id
    )
    row = connection.execute(
        """
        SELECT
            source_files.import_model_id,
            source_files.file_name,
            source_files.mime_type,
            source_files.data_blob
        FROM source_files
        JOIN productions ON productions.id = source_files.production_id
        WHERE source_files.production_id = ?
          AND source_files.episode_id IS ?
          AND source_files.import_model_id = productions.import_model_id
        """,
        (local_production_id, local_episode_id),
    ).fetchone()
    if not row:
        return None
    return {
        "import_model_id": row["import_model_id"],
        "name": row["file_name"],
        "mime": row["mime_type"],
        "base64": base64.b64encode(row["data_blob"]).decode("ascii"),
    }


def load_source_file(connection, production_id, episode_id, import_model_id):
    local_production_id, local_episode_id = content_scope(
        connection, production_id, episode_id
    )
    row = connection.execute(
        """
        SELECT source_files.file_name, source_files.mime_type, source_files.data_blob
        FROM source_files
        WHERE source_files.production_id = ?
          AND source_files.episode_id IS ?
          AND source_files.import_model_id = ?
        """,
        (
            local_production_id,
            local_episode_id,
            str(import_model_id or ""),
        ),
    ).fetchone()
    if not row:
        return None
    return {
        "name": row["file_name"],
        "mime": row["mime_type"],
        "bytes": row["data_blob"],
    }
