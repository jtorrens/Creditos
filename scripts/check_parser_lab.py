#!/usr/bin/env python3
import json
import pathlib
import subprocess
import sys


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
RENDERER_ROOT = REPO_ROOT / "apps" / "renderer"
SCRIPTS_ROOT = REPO_ROOT / "scripts"


def fail(message):
    print(f"ERROR: {message}", file=sys.stderr)
    return False


def main():
    sys.path.insert(0, str(RENDERER_ROOT))
    sys.path.insert(0, str(SCRIPTS_ROOT))

    from check_parser_golden import parser_cases
    from import_models.registry import IMPORT_MODELS, parse_source
    from parser_lab.inspection import empty_row, expand_empty_rows, inspect_source_rows
    from parser_lab.service import (
        inspect_uploaded_source,
        source_kind_from_name,
        validate_block_model,
    )

    ok = True
    registered_before = tuple(IMPORT_MODELS)

    for case in parser_cases():
        source_kind = "ods" if case.source_name.lower().endswith(".ods") else "xlsx"
        production_before = parse_source(case.file_bytes, case.source_name, case.import_model_id)
        inspection = inspect_source_rows(case.file_bytes, case.source_name, source_kind)
        uploaded_inspection = inspect_uploaded_source(case.file_bytes, case.source_name)
        production_after = parse_source(case.file_bytes, case.source_name, case.import_model_id)

        if production_after != production_before:
            ok = fail(f"inspection changed production parser output for {case.name}") and ok
        if inspection.get("schema") != "parser_lab_inspection" or inspection.get("version") != 2:
            ok = fail(f"invalid inspection contract for {case.name}") and ok
        if inspection.get("source") != case.source_name or inspection.get("source_kind") != source_kind:
            ok = fail(f"invalid inspection source metadata for {case.name}") and ok
        if uploaded_inspection != inspection:
            ok = fail(f"upload service changed the inspection contract for {case.name}") and ok
        if not inspection.get("rows"):
            ok = fail(f"inspection returned no rows for {case.name}") and ok

        try:
            json.dumps(inspection, ensure_ascii=False)
        except (TypeError, ValueError) as error:
            ok = fail(f"inspection is not JSON serializable for {case.name}: {error}") and ok

        print(f"ok parser lab {case.name}")

        if source_kind == "ods":
            row_six = next((row for row in inspection["rows"] if row["row"] == 6), None)
            expected_values = {"A": "", "B": "Montaje", "C": "", "D": "Editora Uno"}
            if row_six is None or row_six.get("values") != expected_values:
                ok = fail("ODS inspection did not preserve normalized row 6") and ok
            if row_six is not None and row_six.get("merged_b_to_d") is not False:
                ok = fail("ODS inspection changed row 6 merge metadata") and ok

    xlsx_paths = sorted((REPO_ROOT / "test" / "xls").rglob("*.xlsx"))
    if not xlsx_paths:
        ok = fail("parser lab has no real XLSX fixtures for batch inspection") and ok
    batch_row_counts = []
    for xlsx_path in xlsx_paths:
        inspection = inspect_source_rows(xlsx_path.read_bytes(), xlsx_path.name, "xlsx")
        rows = inspection["rows"]
        row_numbers = [row["row"] for row in rows]
        expected_numbers = list(range(row_numbers[0], row_numbers[-1] + 1)) if row_numbers else []
        if row_numbers != expected_numbers:
            ok = fail(f"parser lab did not preserve contiguous rows for {xlsx_path}") and ok
        if inspection["sheet"] != "Rodillo Final" or len(inspection["workbook_sheets"]) != 2:
            ok = fail(f"parser lab selected unexpected workbook metadata for {xlsx_path}") and ok
        if not any(row["empty"] for row in rows):
            ok = fail(f"parser lab lost empty divisions for {xlsx_path}") and ok
        if not any(row["merged_b_to_d"] for row in rows):
            ok = fail(f"parser lab lost merged-cell evidence for {xlsx_path}") and ok
        batch_row_counts.append(len(rows))
    if batch_row_counts:
        print(
            "ok parser lab xlsx batch "
            f"{len(batch_row_counts)} files · {min(batch_row_counts)}-{max(batch_row_counts)} rows"
        )

    restored = expand_empty_rows([
        {"row": 1, "values": {"A": "", "B": "", "C": "Cabecera", "D": ""}, "styles": {}, "bold": {}, "merged_b_to_d": False},
        {"row": 4, "values": {"A": "", "B": "Cargo", "C": "", "D": "Nombre"}, "styles": {}, "bold": {}, "merged_b_to_d": False},
    ])
    if [row["row"] for row in restored] != [1, 2, 3, 4]:
        ok = fail("parser lab did not restore internal empty rows") and ok
    if restored[1] != empty_row(2) or restored[2] != empty_row(3):
        ok = fail("parser lab empty-row contract is invalid") and ok
    if restored[0].get("empty") is not False or restored[3].get("empty") is not False:
        ok = fail("parser lab marked populated rows as empty") and ok

    temporary_model = {
        "schema": "parser_lab_block_model",
        "version": 6,
        "blocks": [
            {
                "id": "block_01_direction",
                "name": "Dirección",
                "header": {
                    "source": "match",
                    "column": "C",
                    "operator": "equals",
                    "value": "Dirección",
                    "bold": "ignore",
                    "merged_b_to_d": "ignore",
                },
                "enabled": True,
                "interpretation": {
                    "type": "principal_with_associated_values",
                    "content_start": "after_header",
                    "orientation": "vertical",
                    "item_grouping": "empty_rows",
                    "item_start_column": "B",
                    "traversal": "row_major",
                    "split_cell_lines": True,
                    "term_roles": {"first": "principal", "following": "secondary"},
                    "empty_rows": {
                        "leading": {"effect": "continue", "display": "ignore"},
                        "between_items": {"effect": "item", "display": "ignore"},
                        "trailing": {"effect": "continue", "display": "ignore"},
                    },
                },
            }
        ],
        "composition_rules": [
            {
                "id": "composition_01",
                "scope": "block",
                "match": {"field": "name", "operator": "equals", "value": "Dirección"},
                "action": {"type": "group_next", "count": 1, "target": "cartela"},
            }
        ],
        "normalized_rows_view": {
            "column_widths": {"block": 140, "A": 100, "B": 240, "C": 220, "D": 260}
        },
    }
    obsolete_model = {**temporary_model, "version": 4}
    try:
        validate_block_model(obsolete_model)
    except ValueError:
        pass
    else:
        ok = fail("parser lab accepted the obsolete block-model contract") and ok
    missing_content_start = json.loads(json.dumps(temporary_model))
    del missing_content_start["blocks"][0]["interpretation"]["content_start"]
    try:
        validate_block_model(missing_content_start)
    except ValueError:
        pass
    else:
        ok = fail("parser lab accepted a block without an explicit content start") and ok
    if tuple(IMPORT_MODELS) != registered_before:
        ok = fail("parser lab inspection changed the production import-model registry") and ok

    try:
        inspect_source_rows(b"not used", "unsupported.csv", "csv")
    except ValueError:
        pass
    else:
        ok = fail("parser lab accepted an unsupported source kind") and ok

    for source_name, expected_kind in (("credits.ods", "ods"), ("credits.XLSX", "xlsx")):
        if source_kind_from_name(source_name) != expected_kind:
            ok = fail(f"parser lab did not infer {expected_kind} from {source_name}") and ok

    try:
        source_kind_from_name("unsupported.csv")
    except ValueError:
        pass
    else:
        ok = fail("parser lab upload service accepted an unsupported extension") and ok

    block_check = subprocess.run(
        ["node", str(SCRIPTS_ROOT / "check_parser_lab_blocks.js")],
        cwd=str(REPO_ROOT),
        check=False,
    )
    if block_check.returncode != 0:
        ok = fail("parser lab manual block model check failed") and ok

    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
