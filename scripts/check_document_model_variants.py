#!/usr/bin/env python3
import json
import pathlib
import sqlite3
import sys
import tempfile


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
RENDERER_ROOT = REPO_ROOT / "apps" / "renderer"


def create_v2_database(path):
    connection = sqlite3.connect(path)
    connection.executescript(
        """
        PRAGMA user_version = 2;
        CREATE TABLE productions (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            import_model_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE episodes (
            id INTEGER PRIMARY KEY,
            production_id INTEGER NOT NULL,
            episode_number INTEGER NOT NULL,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE documents (
            id INTEGER PRIMARY KEY,
            production_id INTEGER NOT NULL,
            episode_id INTEGER NOT NULL,
            kind TEXT NOT NULL,
            schema TEXT,
            version INTEGER,
            data_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE (production_id, episode_id, kind)
        );
        INSERT INTO productions VALUES (1, 'Prueba', 'modelo_ia', 'now', 'now');
        INSERT INTO episodes VALUES (1, 1, 1, 'Episodio 01', 'now', 'now');
        INSERT INTO documents VALUES (
            1, 1, 1, 'source', 'credit_source', 1,
            '{"schema":"credit_source","import_model_id":"modelo_reglas"}', 'now', 'now'
        );
        INSERT INTO documents VALUES (
            2, 1, 1, 'structure', 'credit_structure', 1,
            '{"schema":"credit_structure","association":"ia"}', 'now', 'now'
        );
        INSERT INTO documents VALUES (
            3, 1, 1, 'reference', 'reference_video', 1,
            '{"schema":"reference_video","file_path":"video.mov"}', 'now', 'now'
        );
        """
    )
    connection.commit()
    connection.close()


def main():
    sys.path.insert(0, str(RENDERER_ROOT))
    from server_db.connection import db_connect
    from server_services.document_service import list_structure_sources, load_document, save_document

    with tempfile.TemporaryDirectory() as directory:
        db_path = pathlib.Path(directory) / "creditos.db"
        create_v2_database(db_path)

        with db_connect(db_path) as connection:
            assert connection.execute("PRAGMA user_version").fetchone()[0] == 4
            assert load_document(connection, 1, 1, "structure", "modelo_ia") is None
            assert load_document(connection, 1, 1, "structure", "modelo_reglas")["association"] == "ia"
            assert load_document(connection, 1, 1, "reference")["file_path"] == "video.mov"
            assert [item["import_model_id"] for item in list_structure_sources(connection, 1)] == ["modelo_reglas"]

            save_document(
                connection,
                1,
                1,
                "structure",
                {"schema": "credit_structure", "association": "ia_actualizada"},
                "modelo_ia",
            )
            save_document(
                connection,
                1,
                1,
                "source",
                {"schema": "credit_source", "import_model_id": "modelo_ia"},
                "modelo_ia",
            )

            assert load_document(connection, 1, 1, "structure", "modelo_ia")["association"] == "ia_actualizada"
            assert load_document(connection, 1, 1, "structure", "modelo_reglas")["association"] == "ia"
            rows = connection.execute(
                """
                SELECT import_model_id, data_json
                FROM documents
                WHERE production_id = 1 AND episode_id = 1 AND kind = 'structure'
                ORDER BY import_model_id
                """
            ).fetchall()
            assert [(row["import_model_id"], json.loads(row["data_json"])["association"]) for row in rows] == [
                ("modelo_ia", "ia_actualizada"),
                ("modelo_reglas", "ia"),
            ]
            assert [item["import_model_id"] for item in list_structure_sources(connection, 1)] == [
                "modelo_ia",
                "modelo_reglas",
            ]

    print("ok document associations persist independently per import model")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
