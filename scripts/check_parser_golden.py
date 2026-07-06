#!/usr/bin/env python3
import argparse
import json
import pathlib
import sys
import zipfile
from dataclasses import dataclass
from io import BytesIO


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
SNAPSHOT_DIR = REPO_ROOT / "test" / "import_models" / "golden"


@dataclass(frozen=True)
class ParserCase:
    name: str
    import_model_id: str
    source_name: str
    file_bytes: bytes


def standard_xlsx_fixture():
    matches = sorted((REPO_ROOT / "test" / "xls" / "CAP 01").glob("*251031.xlsx"))
    if not matches:
        raise FileNotFoundError("Missing standard XLSX fixture matching test/xls/CAP 01/*251031.xlsx")
    return matches[0].read_bytes()


def ods_cell(value="", span=1):
    span_attr = f' table:number-columns-spanned="{span}"' if span > 1 else ""
    text = f"<text:p>{escape_xml(value)}</text:p>" if value else "<text:p/>"
    return f'<table:table-cell office:value-type="string"{span_attr}>{text}</table:table-cell>'


def ods_row(values, merge_b_to_d=False):
    if merge_b_to_d:
        cells = [ods_cell(values[0]), ods_cell(values[1], span=3)]
    else:
        cells = [ods_cell(value) for value in values]
    return "<table:table-row>" + "".join(cells) + "</table:table-row>"


def escape_xml(value):
    return (
        str(value)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def traz_ods_fixture():
    rows = [
        ods_row(["", "", "Dirección", ""]),
        ods_row(["", "Ana Alvarez", "", ""]),
        ods_row(["", "", "Han intervenido", ""]),
        ods_row(["", "Actor Uno", "", "Personaje Uno"]),
        ods_row(["", "", "Equipo técnico", ""]),
        ods_row(["", "Montaje", "", "Editora Uno"]),
        ods_row(["", "Una producción de Ejemplo Studios", "", ""], merge_b_to_d=True),
    ]
    content_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<office:document-content
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0">
  <office:body>
    <office:spreadsheet>
      <table:table table:name="Rodillo final">
        {''.join(rows)}
      </table:table>
    </office:spreadsheet>
  </office:body>
</office:document-content>
"""
    buffer = BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.writestr("content.xml", content_xml)
    return buffer.getvalue()


def parser_cases():
    return [
        ParserCase(
            name="standard_credits_xls_cap01_251031",
            import_model_id="standard_credits_xls",
            source_name="standard_cap01_251031.xlsx",
            file_bytes=standard_xlsx_fixture(),
        ),
        ParserCase(
            name="traz_credits_ods_minimal",
            import_model_id="traz_credits_ods",
            source_name="traz_minimal.ods",
            file_bytes=traz_ods_fixture(),
        ),
    ]


def render_json(data):
    return json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True) + "\n"


def run_case(case, update=False):
    sys.path.insert(0, str(REPO_ROOT / "apps" / "renderer"))
    from import_models.registry import parse_source

    actual = render_json(parse_source(case.file_bytes, case.source_name, case.import_model_id))
    snapshot_path = SNAPSHOT_DIR / f"{case.name}.json"
    if update:
        snapshot_path.parent.mkdir(parents=True, exist_ok=True)
        snapshot_path.write_text(actual, encoding="utf-8")
        print(f"updated {snapshot_path.relative_to(REPO_ROOT)}")
        return True
    if not snapshot_path.exists():
        print(f"ERROR: missing snapshot {snapshot_path.relative_to(REPO_ROOT)}", file=sys.stderr)
        return False
    expected = snapshot_path.read_text(encoding="utf-8")
    if actual != expected:
        print(f"ERROR: parser golden changed for {case.name}", file=sys.stderr)
        print(f"       update explicitly with: python3 scripts/check_parser_golden.py --update", file=sys.stderr)
        return False
    print(f"ok {case.name}")
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--update", action="store_true", help="Rewrite golden snapshots from current parser output.")
    args = parser.parse_args()

    ok = True
    for case in parser_cases():
        ok = run_case(case, update=args.update) and ok
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
