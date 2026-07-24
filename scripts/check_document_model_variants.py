#!/usr/bin/env python3
import pathlib
import sys
import tempfile


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
RENDERER_ROOT = REPO_ROOT / "apps" / "renderer"


def main():
    sys.path.insert(0, str(RENDERER_ROOT))
    from server_db.connection import db_connect
    from server_services.document_service import (
        list_structure_sources,
        load_document,
        save_document,
    )
    from server_services.project_service import create_production

    with tempfile.TemporaryDirectory() as directory:
        db_path = pathlib.Path(directory) / "creditos.db"
        with db_connect(db_path) as connection:
            series_id = create_production(
                connection,
                "Serie",
                "SERIES",
                1,
                1,
                import_model_id="modelo_ia",
            )
            episode_id = connection.execute(
                "SELECT id FROM episodes WHERE production_id = ?",
                (series_id,),
            ).fetchone()["id"]
            save_document(
                connection,
                series_id,
                episode_id,
                "source",
                {"schema": "credit_source"},
                "modelo_ia",
            )
            save_document(
                connection,
                series_id,
                episode_id,
                "structure",
                {"schema": "credit_structure", "association": "serie"},
                "modelo_ia",
            )
            assert load_document(
                connection,
                series_id,
                episode_id,
                "structure",
                "modelo_ia",
            )["association"] == "serie"
            assert [item["import_model_id"] for item in list_structure_sources(
                connection,
                series_id,
            )] == ["modelo_ia"]

            movie_id = create_production(
                connection,
                "Película",
                "FILM",
                import_model_id="modelo_ia",
            )
            save_document(
                connection,
                movie_id,
                None,
                "source",
                {"schema": "credit_source"},
                "modelo_ia",
            )
            save_document(
                connection,
                movie_id,
                None,
                "structure",
                {"schema": "credit_structure", "association": "película"},
                "modelo_ia",
            )
            assert load_document(
                connection,
                movie_id,
                None,
                "structure",
                "modelo_ia",
            )["association"] == "película"
            assert [item["episode_id"] for item in list_structure_sources(
                connection,
                movie_id,
            )] == [None]
            assert connection.execute("PRAGMA user_version").fetchone()[0] == 11

    print("ok documents persist for series episodes and movie production scope")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
