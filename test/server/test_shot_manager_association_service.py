import sqlite3
import sys
import unittest
from pathlib import Path


RENDERER_ROOT = Path(__file__).resolve().parents[2] / "apps" / "renderer"
sys.path.insert(0, str(RENDERER_ROOT))

from server_db.schema import init_db  # noqa: E402
from server_services.shot_manager_association_service import (  # noqa: E402
    delete_shot_manager_association,
    load_shot_manager_association,
    save_shot_manager_association,
)


class ShotManagerAssociationServiceTest(unittest.TestCase):
    def setUp(self):
        self.connection = sqlite3.connect(":memory:")
        self.connection.row_factory = sqlite3.Row
        self.connection.execute("PRAGMA foreign_keys = ON")
        init_db(self.connection)
        self.connection.execute(
            """
            INSERT INTO productions (
                id, name, episode_count, created_at, updated_at
            ) VALUES (1, 'Trazos', 1, 'now', 'now')
            """
        )
        self.connection.execute(
            """
            INSERT INTO episodes (
                id, production_id, episode_number, name, created_at, updated_at
            ) VALUES (10, 1, 1, 'Episodio 01', 'now', 'now')
            """
        )
        self.connection.commit()

    def tearDown(self):
        self.connection.close()

    def test_round_trip_uses_stable_ids(self):
        saved = save_shot_manager_association(
            self.connection,
            {
                "creditosProductionId": "1",
                "creditosEpisodeId": "10",
                "shotManagerProductionId": "production-1",
                "seasonId": "season-1",
                "episodeId": "episode-1",
                "structureEntryId": "credits-output",
            },
        )

        self.assertEqual(saved["creditosEpisodeId"], "10")
        self.assertEqual(saved["shotManagerProductionId"], "production-1")
        self.assertEqual(
            load_shot_manager_association(self.connection, 1, 10),
            saved,
        )

    def test_rejects_partial_remote_episode_identity(self):
        with self.assertRaisesRegex(
            ValueError,
            "temporada y el capítulo",
        ):
            save_shot_manager_association(
                self.connection,
                {
                    "creditosProductionId": "1",
                    "creditosEpisodeId": "10",
                    "shotManagerProductionId": "production-1",
                    "seasonId": "season-1",
                    "episodeId": None,
                    "structureEntryId": "credits-output",
                },
            )

    def test_delete_is_scoped_to_local_episode(self):
        save_shot_manager_association(
            self.connection,
            {
                "creditosProductionId": "1",
                "creditosEpisodeId": "10",
                "shotManagerProductionId": "production-1",
                "seasonId": None,
                "episodeId": None,
                "structureEntryId": "credits-output",
            },
        )

        self.assertTrue(
            delete_shot_manager_association(self.connection, "1", "10")
        )
        self.assertIsNone(
            load_shot_manager_association(self.connection, "1", "10")
        )


if __name__ == "__main__":
    unittest.main()
