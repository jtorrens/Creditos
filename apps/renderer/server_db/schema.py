SCHEMA_VERSION = 9


SCHEMA_SQL = """
CREATE TABLE productions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    production_type TEXT NOT NULL CHECK (production_type IN ('MOVIE', 'SERIES')),
    page_width INTEGER NOT NULL DEFAULT 1920,
    page_height INTEGER NOT NULL DEFAULT 1080,
    preview_background TEXT NOT NULL DEFAULT '#ffffff',
    import_model_id TEXT NOT NULL DEFAULT 'standard_credits_xls',
    settings_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE seasons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    production_id INTEGER NOT NULL,
    season_number INTEGER NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (production_id, season_number),
    UNIQUE (production_id, code),
    FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE
);

CREATE TABLE episodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    production_id INTEGER NOT NULL,
    season_id INTEGER NOT NULL,
    episode_number INTEGER NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (season_id, episode_number),
    UNIQUE (season_id, code),
    FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE,
    FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE
);

CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    production_id INTEGER NOT NULL,
    episode_id INTEGER,
    kind TEXT NOT NULL,
    import_model_id TEXT NOT NULL DEFAULT '',
    schema TEXT,
    version INTEGER,
    data_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE,
    FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX documents_scope_identity
ON documents (production_id, IFNULL(episode_id, 0), kind, import_model_id);

CREATE TABLE styles (
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

CREATE TABLE import_rule_models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL COLLATE NOCASE UNIQUE,
    revision INTEGER NOT NULL DEFAULT 1,
    model_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE source_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    production_id INTEGER NOT NULL,
    episode_id INTEGER,
    import_model_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    data_blob BLOB NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE,
    FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX source_files_scope_identity
ON source_files (production_id, IFNULL(episode_id, 0), import_model_id);

CREATE TABLE shot_manager_associations (
    production_id INTEGER PRIMARY KEY,
    shot_manager_production_id TEXT NOT NULL UNIQUE,
    structure_entry_id TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE
);
"""


def init_db(connection):
    current_version = connection.execute("PRAGMA user_version").fetchone()[0]
    if current_version == 0:
        connection.executescript(SCHEMA_SQL)
        connection.execute(f"PRAGMA user_version = {SCHEMA_VERSION}")
        connection.commit()
        return
    if current_version != SCHEMA_VERSION:
        raise RuntimeError(
            f"La DB usa el esquema v{current_version}. "
            f"Esta versión de Créditos requiere el esquema v{SCHEMA_VERSION}; "
            "actualiza la base de datos del proyecto."
        )
