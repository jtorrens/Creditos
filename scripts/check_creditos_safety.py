#!/usr/bin/env python3
import pathlib
import subprocess
import sys


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
CHECKS = [
    "check_import_models.py",
    "check_parser_golden.py",
    "check_parser_lab.py",
    "check_domain_no_dom.py",
    "check_domain_imports.py",
    "check_renderer_app_boundaries.py",
    "check_app_composition_size.py",
    "check_renderer_script_tags.py",
    "check_field_controls.py",
    "check_server_boundaries.py",
    "check_native_boundaries.py",
    "check_branch_isolation.py",
]
PY_COMPILE_FILES = [
    REPO_ROOT / "apps" / "renderer" / "server.py",
    *sorted((REPO_ROOT / "apps" / "renderer" / "server_db").glob("*.py")),
    *sorted((REPO_ROOT / "apps" / "renderer" / "server_services").glob("*.py")),
    *sorted((REPO_ROOT / "apps" / "renderer" / "parser_lab").glob("*.py")),
    *sorted((REPO_ROOT / "scripts").glob("check_*.py")),
    REPO_ROOT / "scripts" / "compare_png_outputs.py",
]


def main():
    compile_result = subprocess.run(
        [sys.executable, "-m", "py_compile", *[str(path) for path in PY_COMPILE_FILES]],
        cwd=str(REPO_ROOT),
        check=False,
    )
    if compile_result.returncode != 0:
        return compile_result.returncode

    for check in CHECKS:
        path = REPO_ROOT / "scripts" / check
        result = subprocess.run([sys.executable, str(path)], cwd=str(REPO_ROOT), check=False)
        if result.returncode != 0:
            return result.returncode
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
