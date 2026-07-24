#!/usr/bin/env python3
import json
import pathlib
import sqlite3
import sys
import tempfile


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
RENDERER_ROOT = REPO_ROOT / "apps" / "renderer"
SCRIPTS_ROOT = REPO_ROOT / "scripts"


def definition(block_id, name, column, value, orientation, grouping, roles):
    return {
        "id": block_id,
        "name": name,
        "enabled": True,
        "header": {
            "source": "match",
            "column": column,
            "operator": "equals",
            "value": value,
            "bold": "ignore",
            "merged_b_to_d": "ignore",
        },
        "interpretation": {
            "type": "principal_with_associated_values",
            "orientation": orientation,
            "content_start": "after_header",
            "item_grouping": grouping,
            "item_start_column": "B",
            "item_boundary_effect": "item",
            "traversal": "row_major",
            "split_cell_lines": True,
            "term_roles": roles,
            "empty_rows": {
                "leading": {"effect": "continue", "display": "ignore"},
                "between_items": {"effect": "item", "display": "ignore"},
                "trailing": {"effect": "continue", "display": "ignore"},
            },
        },
    }


def main():
    sys.path.insert(0, str(RENDERER_ROOT))
    sys.path.insert(0, str(SCRIPTS_ROOT))
    from check_parser_golden import traz_ods_fixture
    from server_db.connection import db_connect
    from server_services.import_rule_model_service import (
        apply_rule_model_library_action,
        import_rule_model_library,
        list_rule_import_models,
        load_rule_model_library,
    )
    from server_services.import_service import import_credit_source

    model = {
        "schema": "parser_lab_block_model",
        "version": 7,
        "blocks": [
            definition(
                "direction",
                "Dirección",
                "C",
                "Dirección",
                "vertical",
                "empty_rows",
                {"first": "principal", "following": "secondary"},
            ),
            definition(
                "cast",
                "Han intervenido",
                "C",
                "Han intervenido",
                "horizontal",
                "row",
                {"first": "secondary", "following": "principal"},
            ),
            definition(
                "crew",
                "Equipo técnico",
                "C",
                "Equipo técnico",
                "horizontal",
                "row",
                {"first": "secondary", "following": "principal"},
            ),
        ],
        "composition_rules": [],
        "normalized_rows_view": {"column_widths": {}},
    }
    record_id = "rule_model_test"
    library = {
        "schema": "parser_lab_model_library",
        "version": 1,
        "active_model_id": record_id,
        "models": [
            {
                "id": record_id,
                "name": "Modelo de prueba",
                "revision": 3,
                "created_at": "2026-07-23T00:00:00+00:00",
                "updated_at": "2026-07-23T00:00:00+00:00",
                "model": model,
            }
        ],
    }

    with tempfile.TemporaryDirectory() as directory:
        db_path = pathlib.Path(directory) / "creditos.db"
        with db_connect(db_path) as connection:
            imported = import_rule_model_library(connection, library)
            assert imported["active_model_id"] == record_id
            assert load_rule_model_library(connection)["models"][0]["revision"] == 3
            assert list_rule_import_models(connection) == [
                {
                    "id": record_id,
                    "label": "Modelo de prueba",
                    "source_kinds": ["ods", "xlsx"],
                    "kind": "rule_model",
                    "revision": 3,
                }
            ]
            parsed = import_credit_source(
                connection,
                traz_ods_fixture(),
                "traz_minimal.ods",
                record_id,
            )
            assert parsed["import_model_id"] == record_id
            assert parsed["import_rule_model"]["revision"] == 3
            assert [block["title"] for block in parsed["blocks"]] == [
                "Dirección",
                "Han intervenido",
                "Equipo técnico",
            ]
            assert [len(block["items"]) for block in parsed["blocks"]] == [1, 1, 2]
            saved = apply_rule_model_library_action(
                connection,
                {"action": "save", "model_id": record_id, "model": model},
            )
            assert saved["models"][0]["revision"] == 4
            duplicated = apply_rule_model_library_action(
                connection,
                {"action": "duplicate", "model_id": record_id, "name": "Modelo copia"},
            )
            duplicate_id = duplicated["active_model_id"]
            assert duplicate_id != record_id
            renamed = apply_rule_model_library_action(
                connection,
                {"action": "rename", "model_id": duplicate_id, "name": "Modelo renombrado"},
            )
            duplicate = next(item for item in renamed["models"] if item["id"] == duplicate_id)
            assert duplicate["name"] == "Modelo renombrado"
            deleted = apply_rule_model_library_action(
                connection,
                {"action": "delete", "model_id": duplicate_id},
            )
            assert [item["id"] for item in deleted["models"]] == [record_id]
            assert deleted["active_model_id"] == record_id
            assert connection.execute("PRAGMA user_version").fetchone()[0] == 5

        legacy_model = json.loads(json.dumps(model))
        legacy_model["version"] = 6
        for block in legacy_model["blocks"]:
            block["interpretation"].pop("item_boundary_effect")
        with sqlite3.connect(db_path) as legacy_connection:
            legacy_connection.execute(
                "UPDATE import_rule_models SET model_json = ? WHERE id = ?",
                (json.dumps(legacy_model, ensure_ascii=False), record_id),
            )
            legacy_connection.execute("PRAGMA user_version = 4")
        with db_connect(db_path) as migrated_connection:
            migrated = load_rule_model_library(migrated_connection)["models"][0]
            assert migrated["model"]["version"] == 7
            assert all(
                block["interpretation"]["item_boundary_effect"] == "item"
                for block in migrated["model"]["blocks"]
            )
            assert migrated["revision"] == 5

    print("ok rule import models DB persistence and production parser")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
