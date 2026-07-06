#!/usr/bin/env python3
import pathlib
import subprocess
import sys


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
CHECKS = [
    "check_import_models.py",
    "check_parser_golden.py",
    "check_domain_no_dom.py",
    "check_renderer_app_boundaries.py",
    "check_server_boundaries.py",
    "check_native_boundaries.py",
    "check_branch_isolation.py",
]


def main():
    for check in CHECKS:
        path = REPO_ROOT / "scripts" / check
        result = subprocess.run([sys.executable, str(path)], cwd=str(REPO_ROOT), check=False)
        if result.returncode != 0:
            return result.returncode
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
