def init_db(connection):
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
            schema TEXT,
            version INTEGER,
            data_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE (production_id, episode_id, kind),
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
    connection.commit()
