#!/usr/bin/env python3
import pathlib
import sys
import tempfile


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
RENDERER_ROOT = REPO_ROOT / "apps" / "renderer"


def main():
    sys.path.insert(0, str(RENDERER_ROOT))
    from server_db.connection import db_connect
    from server_services.project_service import create_production, db_overview
    from server_services.shot_manager_association_service import (
        delete_shot_manager_association,
        load_shot_manager_association,
        save_shot_manager_association,
    )

    with tempfile.TemporaryDirectory() as directory:
        db_path = pathlib.Path(directory) / "creditos.db"
        with db_connect(db_path) as connection:
            series_id = create_production(connection, "Serie", "SERIES", 2, 3)
            movie_id = create_production(connection, "Película", "MOVIE")
            overview = db_overview(connection)

            series = next(item for item in overview["productions"] if item["id"] == series_id)
            movie = next(item for item in overview["productions"] if item["id"] == movie_id)
            assert series["production_type"] == "SERIES"
            assert series["season_count"] == 2
            assert series["episode_count"] == 6
            assert movie["production_type"] == "MOVIE"
            assert movie["season_count"] == 0
            assert movie["episode_count"] == 0
            assert [
                season["code"]
                for season in overview["seasons"]
                if season["production_id"] == series_id
            ] == ["S1", "S2"]
            assert [
                episode["code"]
                for episode in overview["episodes"]
                if episode["production_id"] == series_id
            ] == ["E01", "E02", "E03", "E01", "E02", "E03"]

            association = save_shot_manager_association(
                connection,
                {
                    "creditosProductionId": series_id,
                    "shotManagerProductionId": "remote-series",
                    "structureEntryId": "credits-render",
                },
            )
            assert association["creditosProductionId"] == str(series_id)
            assert load_shot_manager_association(
                connection,
                series_id,
            )["structureEntryId"] == "credits-render"
            assert delete_shot_manager_association(connection, series_id) is True
            assert load_shot_manager_association(connection, series_id) is None
            assert connection.execute("PRAGMA user_version").fetchone()[0] == 9

    print("ok movie/series hierarchy and production-level association")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
