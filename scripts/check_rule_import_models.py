#!/usr/bin/env python3
import json
import pathlib
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
            "item_start_merged_b_to_d": "ignore",
            "traversal": "row_major",
            "split_cell_lines": True,
            "term_roles": roles,
            "empty_rows": {
                "leading": {"effect": "continue", "display": "ignore"},
                "between_items": {"effect": "item", "display": "ignore"},
                "trailing": {"effect": "continue", "display": "ignore"},
            },
            "border_enclosure": {
                "mode": "ignore",
                "start_column": "B",
                "end_column": "D",
                "effect": "page",
            },
        },
    }


def main():
    sys.path.insert(0, str(RENDERER_ROOT))
    sys.path.insert(0, str(SCRIPTS_ROOT))
    from check_parser_golden import traz_ods_fixture
    from import_models.rule_based_credits import apply_border_enclosures, find_border_enclosures
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
        "version": 9,
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
    bordered_rows = [
        {
            "row": 10,
            "borders": {
                "B": {"top": True, "right": False, "bottom": False, "left": True},
                "C": {"top": True, "right": False, "bottom": False, "left": False},
                "D": {"top": True, "right": True, "bottom": False, "left": False},
            },
        },
        {
            "row": 11,
            "borders": {
                "B": {"top": False, "right": False, "bottom": True, "left": True},
                "C": {"top": False, "right": False, "bottom": True, "left": False},
                "D": {"top": False, "right": True, "bottom": True, "left": False},
            },
        },
    ]
    border_policy = {
        "mode": "enclosed",
        "start_column": "B",
        "end_column": "D",
        "effect": "page",
    }
    assert find_border_enclosures(bordered_rows, border_policy) == [{
        "start_row": 10,
        "end_row": 11,
        "start_column": "B",
        "end_column": "D",
    }]
    bordered_items = [
        {
            "source_rows": [10],
            "boundary_after": {
                "effect": "page",
                "display": "ignore",
                "source_count": 1,
                "output_count": 0,
            },
        },
        {"source_rows": [11], "boundary_after": None},
    ]
    apply_border_enclosures(
        bordered_rows,
        {"border_enclosure": border_policy},
        bordered_items,
    )
    assert bordered_items[0]["boundary_after"]["effect"] == "item"
    assert bordered_items[0]["boundary_after"]["source"] == "border_enclosure_internal"
    assert bordered_items[1]["boundary_after"]["effect"] == "page"
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
            assert connection.execute("PRAGMA user_version").fetchone()[0] == 9

    print("ok rule import models DB persistence and production parser")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
