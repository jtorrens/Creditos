#!/usr/bin/env python3
import json
import pathlib
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
    from parser_lab.inspection import inspect_source_rows
    from parser_lab.service import inspect_uploaded_source, source_kind_from_name

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
        if inspection.get("schema") != "parser_lab_inspection" or inspection.get("version") != 1:
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

    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
