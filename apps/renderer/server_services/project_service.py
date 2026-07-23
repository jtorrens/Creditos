import json

from import_models.registry import DEFAULT_IMPORT_MODEL_ID, list_import_models
from server_db.connection import default_db_path
from .common import now_iso
from .import_rule_model_service import list_rule_import_models


def row_to_dict(row):
    if row is None:
        return None
    value = dict(row)
    if "settings_json" in value:
        try:
            value["settings"] = json.loads(value.pop("settings_json") or "{}")
        except json.JSONDecodeError:
            value["settings"] = {}
    return value


def db_overview(connection):
    productions = [row_to_dict(row) for row in connection.execute(
        """
        SELECT id, name, page_width, page_height, preview_background, import_model_id, settings_json, episode_count, created_at, updated_at
        FROM productions
        ORDER BY name COLLATE NOCASE
        """
    )]
    episodes = [row_to_dict(row) for row in connection.execute(
        """
        SELECT
            episodes.id,
            episodes.production_id,
            episodes.episode_number,
            episodes.name,
            episodes.created_at,
            episodes.updated_at,
            EXISTS (
                SELECT 1
                FROM documents
                WHERE documents.episode_id = episodes.id
            ) AS has_documents
        FROM episodes
        ORDER BY production_id, episode_number
        """
    )]
    return {
        "db_path": str(default_db_path()),
        "productions": productions,
        "episodes": episodes,
        "import_models": [*list_import_models(), *list_rule_import_models(connection)],
    }


def create_production(
    connection,
    name,
    episode_count,
    page_width=1920,
    page_height=1080,
    preview_background="#ffffff",
    import_model_id=None,
    settings=None,
):
    clean_name = str(name or "").strip()
    if not clean_name:
        raise ValueError("La produccion necesita nombre.")
    count = max(1, int(episode_count or 1))
    timestamp = now_iso()
    cursor = connection.execute(
        """
        INSERT INTO productions (name, page_width, page_height, preview_background, import_model_id, settings_json, episode_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            clean_name,
            max(1, int(page_width or 1920)),
            max(1, int(page_height or 1080)),
            str(preview_background or "#ffffff").strip() or "#ffffff",
            str(import_model_id or DEFAULT_IMPORT_MODEL_ID),
            json.dumps(settings if isinstance(settings, dict) else {}, ensure_ascii=False),
            count,
            timestamp,
            timestamp,
        ),
    )
    production_id = cursor.lastrowid
    width = max(2, len(str(count)))
    for number in range(1, count + 1):
        connection.execute(
            """
            INSERT INTO episodes (production_id, episode_number, name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (production_id, number, f"Episodio {number:0{width}d}", timestamp, timestamp),
        )
    connection.commit()
    return production_id


def unique_production_name(connection, base_name):
    clean_base = str(base_name or "Produccion").strip() or "Produccion"
    existing = {
        row["name"].lower()
        for row in connection.execute("SELECT name FROM productions")
    }
    if clean_base.lower() not in existing:
        return clean_base
    index = 2
    while True:
        candidate = f"{clean_base} {index}"
        if candidate.lower() not in existing:
            return candidate
        index += 1


def delete_production(connection, production_id):
    connection.execute("DELETE FROM productions WHERE id = ?", (int(production_id),))
    connection.commit()


def duplicate_production(connection, production_id):
    source = connection.execute(
        """
        SELECT name, page_width, page_height, preview_background, import_model_id, settings_json, episode_count
        FROM productions
        WHERE id = ?
        """,
        (int(production_id),),
    ).fetchone()
    if not source:
        raise ValueError("Produccion no encontrada.")

    timestamp = now_iso()
    name = unique_production_name(connection, f"{source['name']} copia")
    cursor = connection.execute(
        """
        INSERT INTO productions (name, page_width, page_height, preview_background, import_model_id, settings_json, episode_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            name,
            int(source["page_width"] or 1920),
            int(source["page_height"] or 1080),
            source["preview_background"] or "#ffffff",
            source["import_model_id"] or DEFAULT_IMPORT_MODEL_ID,
            source["settings_json"] or "{}",
            int(source["episode_count"] or 0),
            timestamp,
            timestamp,
        ),
    )
    new_production_id = cursor.lastrowid

    episode_map = {}
    episodes = connection.execute(
        """
        SELECT id, episode_number, name
        FROM episodes
        WHERE production_id = ?
        ORDER BY episode_number
        """,
        (int(production_id),),
    ).fetchall()
    for episode in episodes:
        new_episode = connection.execute(
            """
            INSERT INTO episodes (production_id, episode_number, name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (new_production_id, episode["episode_number"], episode["name"], timestamp, timestamp),
        )
        episode_map[episode["id"]] = new_episode.lastrowid

    for document in connection.execute(
        """
        SELECT episode_id, kind, import_model_id, schema, version, data_json
        FROM documents
        WHERE production_id = ?
        """,
        (int(production_id),),
    ):
        new_episode_id = episode_map.get(document["episode_id"])
        if not new_episode_id:
            continue
        connection.execute(
            """
            INSERT INTO documents (
                production_id, episode_id, kind, import_model_id,
                schema, version, data_json, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                new_production_id,
                new_episode_id,
                document["kind"],
                document["import_model_id"],
                document["schema"],
                document["version"],
                document["data_json"],
                timestamp,
                timestamp,
            ),
        )

    for source_file in connection.execute(
        """
        SELECT episode_id, import_model_id, file_name, mime_type, data_blob
        FROM source_files
        WHERE production_id = ?
        """,
        (int(production_id),),
    ):
        new_episode_id = episode_map.get(source_file["episode_id"])
        if not new_episode_id:
            continue
        connection.execute(
            """
            INSERT INTO source_files (
                production_id, episode_id, import_model_id,
                file_name, mime_type, data_blob, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                new_production_id,
                new_episode_id,
                source_file["import_model_id"],
                source_file["file_name"],
                source_file["mime_type"],
                source_file["data_blob"],
                timestamp,
                timestamp,
            ),
        )

    for style in connection.execute(
        """
        SELECT style_id, name, data_json
        FROM styles
        WHERE production_id = ?
        """,
        (int(production_id),),
    ):
        connection.execute(
            """
            INSERT INTO styles (production_id, style_id, name, data_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (new_production_id, style["style_id"], style["name"], style["data_json"], timestamp, timestamp),
        )

    connection.commit()
    return new_production_id


def update_production(connection, production_id, fields):
    allowed = {}
    timestamp = now_iso()
    if "name" in fields:
        name = str(fields.get("name") or "").strip()
        if not name:
            raise ValueError("La produccion necesita nombre.")
        allowed["name"] = name
    if "episode_count" in fields:
        production_id = int(production_id)
        next_count = max(1, int(fields.get("episode_count") or 1))
        current_rows = connection.execute(
            """
            SELECT episode_number
            FROM episodes
            WHERE production_id = ?
            ORDER BY episode_number
            """,
            (production_id,),
        ).fetchall()
        current_numbers = {int(row["episode_number"]) for row in current_rows}
        current_count = max(current_numbers) if current_numbers else 0
        width = max(2, len(str(next_count)))
        for number in range(1, next_count + 1):
            if number in current_numbers:
                continue
            connection.execute(
                """
                INSERT INTO episodes (production_id, episode_number, name, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (production_id, number, f"Episodio {number:0{width}d}", timestamp, timestamp),
            )
        if next_count < current_count:
            connection.execute(
                """
                DELETE FROM episodes
                WHERE production_id = ? AND episode_number > ?
                """,
                (production_id, next_count),
            )
        allowed["episode_count"] = next_count
    if "page_width" in fields:
        allowed["page_width"] = max(1, int(fields.get("page_width") or 1920))
    if "page_height" in fields:
        allowed["page_height"] = max(1, int(fields.get("page_height") or 1080))
    if "preview_background" in fields:
        allowed["preview_background"] = str(fields.get("preview_background") or "#ffffff").strip() or "#ffffff"
    if "import_model_id" in fields:
        allowed["import_model_id"] = str(fields.get("import_model_id") or DEFAULT_IMPORT_MODEL_ID)
    if "settings" in fields:
        settings = fields.get("settings")
        allowed["settings_json"] = json.dumps(settings if isinstance(settings, dict) else {}, ensure_ascii=False)
    if not allowed:
        return
    allowed["updated_at"] = timestamp
    assignments = ", ".join(f"{key} = ?" for key in allowed)
    connection.execute(
        f"UPDATE productions SET {assignments} WHERE id = ?",
        [*allowed.values(), int(production_id)],
    )
    connection.commit()
