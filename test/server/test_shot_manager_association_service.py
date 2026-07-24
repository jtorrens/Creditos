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


def snapshot():
    return {
        "production": {
            "id": "production-1",
            "name": "Trazos",
            "code": "TRZ",
            "productionType": "SERIES",
            "structureEntries": [
                {
                    "id": "credits-output",
                    "type": "OUTPUT",
                }
            ],
        },
        "seasons": [
            {
                "id": "season-1",
                "number": 1,
                "code": "S01",
                "name": "Temporada 1",
                "archivedAt": None,
            }
        ],
        "episodes": [
            {
                "id": "episode-1",
                "seasonId": "season-1",
                "number": 1,
                "code": "E01",
                "title": "Episodio 1",
                "archivedAt": None,
            }
        ],
    }


class ShotManagerAssociationServiceTest(unittest.TestCase):
    def setUp(self):
        self.connection = sqlite3.connect(":memory:")
        self.connection.row_factory = sqlite3.Row
        self.connection.execute("PRAGMA foreign_keys = ON")
        init_db(self.connection)
        self.connection.execute(
            """
            INSERT INTO productions (
                id, name, production_type, governance_mode,
                page_width, page_height, preview_background,
                import_model_id, settings_json, created_at, updated_at
            )
            VALUES (
                1, 'Trazos', 'SERIES', 'INDEPENDENT',
                1920, 1080, '#ffffff',
                'standard_credits_xls', '{}', 'now', 'now'
            )
            """
        )
        self.connection.commit()

    def tearDown(self):
        self.connection.close()

    def payload(self):
        return {
            "creditosProductionId": "1",
            "shotManagerProductionId": "production-1",
            "outputBindings": {"FINAL_RENDER": "credits-output"},
            "snapshot": snapshot(),
        }

    def test_round_trip_uses_stable_ids_and_explicit_output_binding(self):
        result = save_shot_manager_association(
            self.connection,
            self.payload(),
        )
        saved = result["association"]

        self.assertEqual(saved["shotManagerProductionId"], "production-1")
        self.assertEqual(
            saved["outputBindings"],
            {"FINAL_RENDER": "credits-output"},
        )
        self.assertEqual(
            load_shot_manager_association(self.connection, 1),
            saved,
        )

    def test_rejects_missing_final_render_without_fallback(self):
        payload = self.payload()
        payload["outputBindings"] = {}
        with self.assertRaisesRegex(ValueError, "render final"):
            save_shot_manager_association(self.connection, payload)

    def test_delete_converts_the_production_to_independent(self):
        save_shot_manager_association(self.connection, self.payload())

        self.assertTrue(delete_shot_manager_association(self.connection, "1"))
        self.assertIsNone(
            load_shot_manager_association(self.connection, "1")
        )
        mode = self.connection.execute(
            "SELECT governance_mode FROM productions WHERE id = 1"
        ).fetchone()[0]
        self.assertEqual(mode, "INDEPENDENT")


if __name__ == "__main__":
    unittest.main()
