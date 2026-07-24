import json
from datetime import datetime, timezone


SCHEMA_VERSION = 8


def init_db(connection):
    current_version = connection.execute("PRAGMA user_version").fetchone()[0]
    if current_version > SCHEMA_VERSION:
        raise RuntimeError(
            f"La DB usa el esquema v{current_version}, pero esta app solo admite hasta v{SCHEMA_VERSION}."
        )
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS productions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            page_width INTEGER NOT NULL DEFAULT 1920,
            page_height INTEGER NOT NULL DEFAULT 1080,
            preview_background TEXT NOT NULL DEFAULT '#ffffff',
            import_model_id TEXT NOT NULL DEFAULT 'standard_credits_xls',
            settings_json TEXT NOT NULL DEFAULT '{}',
            episode_count INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS episodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            production_id INTEGER NOT NULL,
            episode_number INTEGER NOT NULL,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE (production_id, episode_number),
            FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            production_id INTEGER NOT NULL,
            episode_id INTEGER NOT NULL,
            kind TEXT NOT NULL,
            import_model_id TEXT NOT NULL DEFAULT '',
            schema TEXT,
            version INTEGER,
            data_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE (production_id, episode_id, kind, import_model_id),
            FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE,
            FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS styles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            production_id INTEGER NOT NULL,
            style_id TEXT NOT NULL,
            name TEXT NOT NULL,
            data_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE (production_id, style_id),
            FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS import_rule_models (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL COLLATE NOCASE UNIQUE,
            revision INTEGER NOT NULL DEFAULT 1,
            model_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS source_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            production_id INTEGER NOT NULL,
            episode_id INTEGER NOT NULL,
            import_model_id TEXT NOT NULL,
            file_name TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            data_blob BLOB NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE (production_id, episode_id, import_model_id),
            FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE,
            FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS shot_manager_associations (
            production_id INTEGER NOT NULL,
            episode_id INTEGER NOT NULL,
            shot_manager_production_id TEXT NOT NULL,
            shot_manager_season_id TEXT,
            shot_manager_episode_id TEXT,
            structure_entry_id TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (production_id, episode_id),
            FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE,
            FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE,
            CHECK (
                (shot_manager_season_id IS NULL AND shot_manager_episode_id IS NULL)
                OR
                (shot_manager_season_id IS NOT NULL AND shot_manager_episode_id IS NOT NULL)
            )
        );
        """
    )
    columns = {row["name"] for row in connection.execute("PRAGMA table_info(productions)")}
    if "page_width" not in columns:
        connection.execute("ALTER TABLE productions ADD COLUMN page_width INTEGER NOT NULL DEFAULT 1920")
    if "page_height" not in columns:
        connection.execute("ALTER TABLE productions ADD COLUMN page_height INTEGER NOT NULL DEFAULT 1080")
    if "preview_background" not in columns:
        connection.execute("ALTER TABLE productions ADD COLUMN preview_background TEXT NOT NULL DEFAULT '#ffffff'")
    if "import_model_id" not in columns:
        connection.execute(
            "ALTER TABLE productions ADD COLUMN import_model_id TEXT NOT NULL DEFAULT 'standard_credits_xls'"
        )
    if "settings_json" not in columns:
        connection.execute("ALTER TABLE productions ADD COLUMN settings_json TEXT NOT NULL DEFAULT '{}'")
    document_columns = {row["name"] for row in connection.execute("PRAGMA table_info(documents)")}
    if "import_model_id" not in document_columns:
        connection.executescript(
            """
            ALTER TABLE documents RENAME TO documents_without_import_model;

            CREATE TABLE documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                production_id INTEGER NOT NULL,
                episode_id INTEGER NOT NULL,
                kind TEXT NOT NULL,
                import_model_id TEXT NOT NULL DEFAULT '',
                schema TEXT,
                version INTEGER,
                data_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE (production_id, episode_id, kind, import_model_id),
                FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE,
                FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
            );

            INSERT INTO documents (
                id, production_id, episode_id, kind, import_model_id,
                schema, version, data_json, created_at, updated_at
            )
            SELECT
                documents_without_import_model.id,
                documents_without_import_model.production_id,
                documents_without_import_model.episode_id,
                documents_without_import_model.kind,
                CASE
                    WHEN documents_without_import_model.kind = 'reference' THEN ''
                    ELSE COALESCE(
                        (
                            SELECT json_extract(source_document.data_json, '$.import_model_id')
                            FROM documents_without_import_model AS source_document
                            WHERE source_document.production_id = documents_without_import_model.production_id
                              AND source_document.episode_id = documents_without_import_model.episode_id
                              AND source_document.kind = 'source'
                              AND json_valid(source_document.data_json)
                        ),
                        productions.import_model_id
                    )
                END,
                documents_without_import_model.schema,
                documents_without_import_model.version,
                documents_without_import_model.data_json,
                documents_without_import_model.created_at,
                documents_without_import_model.updated_at
            FROM documents_without_import_model
            JOIN productions ON productions.id = documents_without_import_model.production_id;

            DROP TABLE documents_without_import_model;
            """
        )
    if current_version < 5:
        migrate_rule_models_v7(connection)
    if current_version < 6:
        migrate_rule_models_v8(connection)
    if current_version < 7:
        migrate_rule_models_v9(connection)
    connection.execute(f"PRAGMA user_version = {SCHEMA_VERSION}")
    connection.commit()


def migrate_rule_models_v7(connection):
    timestamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    for row in connection.execute(
        "SELECT id, model_json FROM import_rule_models"
    ).fetchall():
        model = json.loads(row["model_json"])
        if model.get("schema") != "parser_lab_block_model" or model.get("version") != 6:
            continue
        for block in model.get("blocks", []):
            interpretation = block.get("interpretation") or {}
            empty_effect = (
                interpretation.get("empty_rows", {})
                .get("between_items", {})
                .get("effect")
            )
            interpretation["item_boundary_effect"] = (
                empty_effect if empty_effect in {"item", "group", "page"} else "item"
            )
        model["version"] = 7
        connection.execute(
            """
            UPDATE import_rule_models
            SET model_json = ?, revision = revision + 1, updated_at = ?
            WHERE id = ?
            """,
            (json.dumps(model, ensure_ascii=False), timestamp, row["id"]),
        )


def migrate_rule_models_v8(connection):
    timestamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    for row in connection.execute(
        "SELECT id, model_json FROM import_rule_models"
    ).fetchall():
        model = json.loads(row["model_json"])
        if model.get("schema") != "parser_lab_block_model" or model.get("version") != 7:
            continue
        for block in model.get("blocks", []):
            interpretation = block.get("interpretation") or {}
            interpretation.pop("item_boundary_effect", None)
            interpretation["item_start_merged_b_to_d"] = "ignore"
        model["version"] = 8
        connection.execute(
            """
            UPDATE import_rule_models
            SET model_json = ?, revision = revision + 1, updated_at = ?
            WHERE id = ?
            """,
            (json.dumps(model, ensure_ascii=False), timestamp, row["id"]),
        )


def migrate_rule_models_v9(connection):
    timestamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    for row in connection.execute(
        "SELECT id, model_json FROM import_rule_models"
    ).fetchall():
        model = json.loads(row["model_json"])
        if model.get("schema") != "parser_lab_block_model" or model.get("version") != 8:
            continue
        for block in model.get("blocks", []):
            interpretation = block.get("interpretation") or {}
            interpretation["border_enclosure"] = {
                "mode": "ignore",
                "start_column": "B",
                "end_column": "D",
                "effect": "page",
            }
        model["version"] = 9
        connection.execute(
            """
            UPDATE import_rule_models
            SET model_json = ?, revision = revision + 1, updated_at = ?
            WHERE id = ?
            """,
            (json.dumps(model, ensure_ascii=False), timestamp, row["id"]),
        )
