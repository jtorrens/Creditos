#!/usr/bin/env python3
import json
import os
import pathlib
import subprocess
import sys
import tempfile


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
        load_temporary_block_model,
        save_temporary_block_model,
        source_kind_from_name,
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
        "version": 1,
        "blocks": [
            {
                "id": "block_01_direction",
                "name": "Dirección",
                "header": {
                    "column": "C",
                    "operator": "equals",
                    "value": "Dirección",
                    "bold": "ignore",
                    "merged_b_to_d": "ignore",
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
    }
    previous_temp_directory = os.environ.get("CREDITOS_PARSER_LAB_TEMP_DIR")
    try:
        with tempfile.TemporaryDirectory() as temp_directory:
            os.environ["CREDITOS_PARSER_LAB_TEMP_DIR"] = temp_directory
            saved = save_temporary_block_model(temporary_model)
            loaded = load_temporary_block_model()
            saved_path = pathlib.Path(saved["path"])
            if not saved_path.is_file() or loaded.get("model") != temporary_model:
                ok = fail("parser lab did not persist its temporary block model") and ok
            if json.loads(saved_path.read_text(encoding="utf-8")) != temporary_model:
                ok = fail("parser lab temporary block model is not valid JSON") and ok
    finally:
        if previous_temp_directory is None:
            os.environ.pop("CREDITOS_PARSER_LAB_TEMP_DIR", None)
        else:
            os.environ["CREDITOS_PARSER_LAB_TEMP_DIR"] = previous_temp_directory

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
