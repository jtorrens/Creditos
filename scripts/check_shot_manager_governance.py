#!/usr/bin/env python3
import pathlib
import sys
import tempfile


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
RENDERER_ROOT = REPO_ROOT / "apps" / "renderer"


def series_snapshot(episode_count, remote_id="remote-series"):
    season_id = f"{remote_id}-season-1"
    return {
        "production": {
            "id": remote_id,
            "name": "Serie gobernada",
            "code": "SG",
            "productionType": "SERIES",
            "structureEntries": [
                {
                    "id": "credits-render",
                    "type": "OUTPUT",
                }
            ],
        },
        "seasons": [
            {
                "id": season_id,
                "number": 1,
                "code": "S1",
                "name": "Temporada 1",
                "archivedAt": None,
            }
        ],
        "episodes": [
            {
                "id": f"{remote_id}-episode-{number}",
                "seasonId": season_id,
                "number": number,
                "code": f"E{number:02d}",
                "title": f"Episodio {number:02d}",
                "archivedAt": None,
            }
            for number in range(1, episode_count + 1)
        ],
    }


def association_payload(production_id, snapshot, confirm=False):
    return {
        "creditosProductionId": production_id,
        "shotManagerProductionId": snapshot["production"]["id"],
        "outputBindings": {"FINAL_RENDER": "credits-render"},
        "snapshot": snapshot,
        "confirmDestructive": confirm,
    }


def main():
    sys.path.insert(0, str(RENDERER_ROOT))
    from server_db.connection import db_connect
    from server_services.document_service import save_document
    from server_services.project_service import create_production, duplicate_production
    from server_services.shot_manager_association_service import (
        create_governed_production,
        delete_shot_manager_association,
        load_shot_manager_association,
        save_shot_manager_association,
    )

    with tempfile.TemporaryDirectory() as directory:
        db_path = pathlib.Path(directory) / "creditos.db"
        with db_connect(db_path) as connection:
            production_id = create_production(
                connection,
                "Serie local",
                "SERIES",
                1,
                6,
            )
            episode_six = connection.execute(
                """
                SELECT id
                FROM episodes
                WHERE production_id = ? AND code = 'E06'
                """,
                (production_id,),
            ).fetchone()["id"]
            save_document(
                connection,
                production_id,
                episode_six,
                "structure",
                {"schema": "credit_structure", "version": 1},
                "standard_credits_xls",
            )

            five_episodes = series_snapshot(5)
            pending = save_shot_manager_association(
                connection,
                association_payload(production_id, five_episodes),
            )
            assert pending["confirmationRequired"] is True
            assert pending["plan"]["deletedEpisodes"] == 1
            assert pending["plan"]["contentDeletions"][0]["code"] == "E06"
            assert load_shot_manager_association(connection, production_id) is None
            assert connection.execute(
                "SELECT governance_mode FROM productions WHERE id = ?",
                (production_id,),
            ).fetchone()["governance_mode"] == "INDEPENDENT"
            assert connection.execute(
                "SELECT COUNT(*) FROM episodes WHERE production_id = ?",
                (production_id,),
            ).fetchone()[0] == 6

            synchronized = save_shot_manager_association(
                connection,
                association_payload(production_id, five_episodes, confirm=True),
            )
            assert synchronized["confirmationRequired"] is False
            assert synchronized["association"]["localHierarchy"]["governanceMode"] == "SHOT_MANAGER"
            assert synchronized["association"]["outputBindings"] == {
                "FINAL_RENDER": "credits-render"
            }
            assert connection.execute(
                "SELECT COUNT(*) FROM episodes WHERE production_id = ?",
                (production_id,),
            ).fetchone()[0] == 5
            assert connection.execute(
                "SELECT COUNT(*) FROM documents WHERE production_id = ?",
                (production_id,),
            ).fetchone()[0] == 0

            six_episodes = series_snapshot(6)
            expanded = save_shot_manager_association(
                connection,
                association_payload(production_id, six_episodes),
            )
            assert expanded["plan"]["createdEpisodes"] == 1
            hierarchy = expanded["association"]["localHierarchy"]
            assert len(hierarchy["episodes"]) == 6
            assert all(item["shotManagerEpisodeId"] for item in hierarchy["episodes"])

            duplicate_id = duplicate_production(connection, production_id)
            duplicate = connection.execute(
                "SELECT governance_mode FROM productions WHERE id = ?",
                (duplicate_id,),
            ).fetchone()
            assert duplicate["governance_mode"] == "INDEPENDENT"
            assert connection.execute(
                """
                SELECT COUNT(*)
                FROM episodes
                WHERE production_id = ?
                  AND shot_manager_episode_id IS NOT NULL
                """,
                (duplicate_id,),
            ).fetchone()[0] == 0

            assert delete_shot_manager_association(connection, production_id) is True
            assert load_shot_manager_association(connection, production_id) is None
            assert connection.execute(
                "SELECT governance_mode FROM productions WHERE id = ?",
                (production_id,),
            ).fetchone()["governance_mode"] == "INDEPENDENT"
            assert connection.execute(
                """
                SELECT COUNT(*)
                FROM episodes
                WHERE production_id = ?
                  AND shot_manager_episode_id IS NOT NULL
                """,
                (production_id,),
            ).fetchone()[0] == 0

            direct_snapshot = series_snapshot(3, "remote-direct")
            governed_id = create_governed_production(
                connection,
                {
                    "shotManagerProductionId": direct_snapshot["production"]["id"],
                    "outputBindings": {"FINAL_RENDER": "credits-render"},
                    "snapshot": direct_snapshot,
                },
            )
            direct_association = load_shot_manager_association(connection, governed_id)
            assert direct_association["shotManagerProductionId"] == "remote-direct"
            assert direct_association["localHierarchy"]["governanceMode"] == "SHOT_MANAGER"
            assert len(direct_association["localHierarchy"]["episodes"]) == 3
            assert connection.execute("PRAGMA user_version").fetchone()[0] == 11

    print("ok independent and Shot Manager governed production lifecycle")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
