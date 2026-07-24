import json

from import_models.registry import DEFAULT_IMPORT_MODEL_ID, list_import_models
from server_db.connection import default_db_path
from .common import now_iso
from .import_rule_model_service import list_rule_import_models


PRODUCTION_TYPES = {"MOVIE", "SERIES"}


def row_to_dict(row):
    if row is None:
        return None
    value = dict(row)
    if "settings_json" in value:
        value["settings"] = json.loads(value.pop("settings_json") or "{}")
    return value


def db_overview(connection):
    productions = [
        row_to_dict(row)
        for row in connection.execute(
            """
            SELECT
                productions.id,
                productions.name,
                productions.production_type,
                productions.page_width,
                productions.page_height,
                productions.preview_background,
                productions.import_model_id,
                productions.settings_json,
                productions.created_at,
                productions.updated_at,
                COUNT(DISTINCT seasons.id) AS season_count,
                COUNT(DISTINCT episodes.id) AS episode_count
            FROM productions
            LEFT JOIN seasons ON seasons.production_id = productions.id
            LEFT JOIN episodes ON episodes.production_id = productions.id
            GROUP BY productions.id
            ORDER BY productions.name COLLATE NOCASE
            """
        )
    ]
    seasons = [
        row_to_dict(row)
        for row in connection.execute(
            """
            SELECT id, production_id, season_number, code, name, created_at, updated_at
            FROM seasons
            ORDER BY production_id, season_number
            """
        )
    ]
    episodes = [
        row_to_dict(row)
        for row in connection.execute(
            """
            SELECT
                episodes.id,
                episodes.production_id,
                episodes.season_id,
                episodes.episode_number,
                episodes.code,
                episodes.name,
                seasons.season_number,
                seasons.code AS season_code,
                seasons.name AS season_name,
                episodes.created_at,
                episodes.updated_at,
                EXISTS (
                    SELECT 1
                    FROM documents
                    WHERE documents.episode_id = episodes.id
                ) OR EXISTS (
                    SELECT 1
                    FROM source_files
                    WHERE source_files.episode_id = episodes.id
                ) AS has_documents
            FROM episodes
            JOIN seasons ON seasons.id = episodes.season_id
            ORDER BY episodes.production_id, seasons.season_number, episodes.episode_number
            """
        )
    ]
    return {
        "db_path": str(default_db_path()),
        "productions": productions,
        "seasons": seasons,
        "episodes": episodes,
        "import_models": [*list_import_models(), *list_rule_import_models(connection)],
    }


def _production_type(value):
    normalized = str(value or "").strip().upper()
    if normalized not in PRODUCTION_TYPES:
        raise ValueError("El tipo de producción debe ser película o serie.")
    return normalized


def _positive_count(value, label):
    try:
        count = int(value)
    except (TypeError, ValueError) as error:
        raise ValueError(f"{label} debe ser un número entero.") from error
    if count < 1:
        raise ValueError(f"{label} debe ser mayor que cero.")
    return count


def _create_series_hierarchy(
    connection,
    production_id,
    season_count,
    episodes_per_season,
    timestamp,
):
    seasons = _positive_count(season_count, "El número de temporadas")
    episodes = _positive_count(episodes_per_season, "El número de capítulos")
    season_width = max(1, len(str(seasons)))
    episode_width = max(2, len(str(episodes)))
    for season_number in range(1, seasons + 1):
        season_code = f"S{season_number:0{season_width}d}"
        season = connection.execute(
            """
            INSERT INTO seasons (
                production_id, season_number, code, name, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                production_id,
                season_number,
                season_code,
                f"Temporada {season_number}",
                timestamp,
                timestamp,
            ),
        )
        for episode_number in range(1, episodes + 1):
            episode_code = f"E{episode_number:0{episode_width}d}"
            connection.execute(
                """
                INSERT INTO episodes (
                    production_id, season_id, episode_number, code, name,
                    created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    production_id,
                    season.lastrowid,
                    episode_number,
                    episode_code,
                    f"Episodio {episode_number:0{episode_width}d}",
                    timestamp,
                    timestamp,
                ),
            )


def create_production(
    connection,
    name,
    production_type,
    season_count=None,
    episodes_per_season=None,
    page_width=1920,
    page_height=1080,
    preview_background="#ffffff",
    import_model_id=None,
    settings=None,
):
    clean_name = str(name or "").strip()
    if not clean_name:
        raise ValueError("La producción necesita nombre.")
    normalized_type = _production_type(production_type)
    timestamp = now_iso()
    cursor = connection.execute(
        """
        INSERT INTO productions (
            name, production_type, page_width, page_height, preview_background,
            import_model_id, settings_json, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            clean_name,
            normalized_type,
            max(1, int(page_width or 1920)),
            max(1, int(page_height or 1080)),
            str(preview_background or "#ffffff").strip() or "#ffffff",
            str(import_model_id or DEFAULT_IMPORT_MODEL_ID),
            json.dumps(settings if isinstance(settings, dict) else {}, ensure_ascii=False),
            timestamp,
            timestamp,
        ),
    )
    production_id = cursor.lastrowid
    if normalized_type == "SERIES":
        _create_series_hierarchy(
            connection,
            production_id,
            season_count,
            episodes_per_season,
            timestamp,
        )
    connection.commit()
    return production_id


def unique_production_name(connection, base_name):
    clean_base = str(base_name or "Producción").strip() or "Producción"
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
        SELECT
            name, production_type, page_width, page_height, preview_background,
            import_model_id, settings_json
        FROM productions
        WHERE id = ?
        """,
        (int(production_id),),
    ).fetchone()
    if not source:
        raise ValueError("Producción no encontrada.")

    timestamp = now_iso()
    name = unique_production_name(connection, f"{source['name']} copia")
    cursor = connection.execute(
        """
        INSERT INTO productions (
            name, production_type, page_width, page_height, preview_background,
            import_model_id, settings_json, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            name,
            source["production_type"],
            int(source["page_width"] or 1920),
            int(source["page_height"] or 1080),
            source["preview_background"] or "#ffffff",
            source["import_model_id"] or DEFAULT_IMPORT_MODEL_ID,
            source["settings_json"] or "{}",
            timestamp,
            timestamp,
        ),
    )
    new_production_id = cursor.lastrowid

    season_map = {}
    for season in connection.execute(
        """
        SELECT id, season_number, code, name
        FROM seasons
        WHERE production_id = ?
        ORDER BY season_number
        """,
        (int(production_id),),
    ):
        new_season = connection.execute(
            """
            INSERT INTO seasons (
                production_id, season_number, code, name, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                new_production_id,
                season["season_number"],
                season["code"],
                season["name"],
                timestamp,
                timestamp,
            ),
        )
        season_map[season["id"]] = new_season.lastrowid

    episode_map = {}
    for episode in connection.execute(
        """
        SELECT id, season_id, episode_number, code, name
        FROM episodes
        WHERE production_id = ?
        ORDER BY season_id, episode_number
        """,
        (int(production_id),),
    ):
        new_episode = connection.execute(
            """
            INSERT INTO episodes (
                production_id, season_id, episode_number, code, name,
                created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                new_production_id,
                season_map[episode["season_id"]],
                episode["episode_number"],
                episode["code"],
                episode["name"],
                timestamp,
                timestamp,
            ),
        )
        episode_map[episode["id"]] = new_episode.lastrowid

    for table, columns in (
        (
            "documents",
            "kind, import_model_id, schema, version, data_json",
        ),
        (
            "source_files",
            "import_model_id, file_name, mime_type, data_blob",
        ),
    ):
        records = connection.execute(
            f"SELECT episode_id, {columns} FROM {table} WHERE production_id = ?",
            (int(production_id),),
        ).fetchall()
        column_names = [part.strip() for part in columns.split(",")]
        for record in records:
            new_episode_id = (
                episode_map[record["episode_id"]]
                if record["episode_id"] is not None
                else None
            )
            insert_columns = ", ".join(
                ["production_id", "episode_id", *column_names, "created_at", "updated_at"]
            )
            placeholders = ", ".join("?" for _ in range(4 + len(column_names)))
            connection.execute(
                f"INSERT INTO {table} ({insert_columns}) VALUES ({placeholders})",
                (
                    new_production_id,
                    new_episode_id,
                    *(record[column] for column in column_names),
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
            INSERT INTO styles (
                production_id, style_id, name, data_json, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                new_production_id,
                style["style_id"],
                style["name"],
                style["data_json"],
                timestamp,
                timestamp,
            ),
        )

    connection.commit()
    return new_production_id


def update_production(connection, production_id, fields):
    allowed = {}
    if "name" in fields:
        name = str(fields.get("name") or "").strip()
        if not name:
            raise ValueError("La producción necesita nombre.")
        allowed["name"] = name
    if "page_width" in fields:
        allowed["page_width"] = max(1, int(fields.get("page_width") or 1920))
    if "page_height" in fields:
        allowed["page_height"] = max(1, int(fields.get("page_height") or 1080))
    if "preview_background" in fields:
        allowed["preview_background"] = (
            str(fields.get("preview_background") or "#ffffff").strip() or "#ffffff"
        )
    if "import_model_id" in fields:
        allowed["import_model_id"] = str(
            fields.get("import_model_id") or DEFAULT_IMPORT_MODEL_ID
        )
    if "settings" in fields:
        settings = fields.get("settings")
        allowed["settings_json"] = json.dumps(
            settings if isinstance(settings, dict) else {},
            ensure_ascii=False,
        )
    if not allowed:
        return
    allowed["updated_at"] = now_iso()
    assignments = ", ".join(f"{key} = ?" for key in allowed)
    connection.execute(
        f"UPDATE productions SET {assignments} WHERE id = ?",
        [*allowed.values(), int(production_id)],
    )
    connection.commit()
