#!/usr/bin/env python3
import base64
import pathlib
import sys
import tempfile


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
RENDERER_ROOT = REPO_ROOT / "apps" / "renderer"


def main():
    sys.path.insert(0, str(RENDERER_ROOT))
    from server_db.connection import db_connect
    from server_services.project_service import (
        create_production,
        duplicate_production,
        update_production,
    )
    from server_services.source_file_service import (
        load_active_source_file,
        save_source_file,
    )

    with tempfile.TemporaryDirectory() as directory:
        db_path = pathlib.Path(directory) / "creditos.db"
        with db_connect(db_path) as connection:
            production_id = create_production(
                connection,
                "Produccion",
                "SERIES",
                1,
                1,
                import_model_id="modelo_a",
            )
            episode_id = connection.execute(
                "SELECT id FROM episodes WHERE production_id = ?",
                (production_id,),
            ).fetchone()["id"]

            save_source_file(
                connection,
                production_id,
                episode_id,
                "modelo_a",
                "origen_a.ods",
                "application/vnd.oasis.opendocument.spreadsheet",
                b"archivo-a",
            )
            save_source_file(
                connection,
                production_id,
                episode_id,
                "modelo_b",
                "origen_b.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                b"archivo-b",
            )

            active = load_active_source_file(connection, production_id, episode_id)
            assert active["import_model_id"] == "modelo_a"
            assert active["name"] == "origen_a.ods"
            assert base64.b64decode(active["base64"]) == b"archivo-a"

            update_production(connection, production_id, {"import_model_id": "modelo_b"})
            active = load_active_source_file(connection, production_id, episode_id)
            assert active["import_model_id"] == "modelo_b"
            assert active["name"] == "origen_b.xlsx"
            assert base64.b64decode(active["base64"]) == b"archivo-b"

            duplicate_id = duplicate_production(connection, production_id)
            duplicate_episode_id = connection.execute(
                "SELECT id FROM episodes WHERE production_id = ?",
                (duplicate_id,),
            ).fetchone()["id"]
            duplicate_active = load_active_source_file(
                connection,
                duplicate_id,
                duplicate_episode_id,
            )
            assert duplicate_active["name"] == "origen_b.xlsx"
            assert base64.b64decode(duplicate_active["base64"]) == b"archivo-b"
            assert connection.execute("PRAGMA user_version").fetchone()[0] == 10

            movie_id = create_production(
                connection,
                "Película",
                "FILM",
                import_model_id="modelo_a",
            )
            save_source_file(
                connection,
                movie_id,
                None,
                "modelo_a",
                "pelicula.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                b"archivo-pelicula",
            )
            movie_active = load_active_source_file(connection, movie_id, None)
            assert movie_active["name"] == "pelicula.xlsx"

    print("ok associated source files persist per import model")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
