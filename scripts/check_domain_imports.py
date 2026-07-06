#!/usr/bin/env python3
import pathlib
import re
import sys


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
DOMAIN_DIR = REPO_ROOT / "apps" / "renderer" / "domain"
MODULE_PATTERN = re.compile(r"^\s*(import|export)\b")
REQUIRE_PATTERN = re.compile(r"\brequire\s*\(")
ROOT_ASSIGN_PATTERN = re.compile(r"\broot\.([A-Za-z_$][\w$]*)\s*=")
GLOBAL_ASSIGN_PATTERN = re.compile(r"\bglobalThis\.([A-Za-z_$][\w$]*)\s*=")
GLOBAL_STATE_PATTERN = re.compile(
    r"\b(root|globalThis)\.(appState|state|current[A-Z]\w*|selected[A-Z]\w*)\b"
)
BANNED_CALLS = [
    "fetch(",
    "dbPost(",
    "nativeBridge",
    "scheduleAutosave",
    "localStorage",
    "sessionStorage",
]


def check_path(path):
    errors = []
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if MODULE_PATTERN.search(line):
            errors.append(f"{path.relative_to(REPO_ROOT)}:{number} uses module import/export syntax")
        if REQUIRE_PATTERN.search(line):
            errors.append(f"{path.relative_to(REPO_ROOT)}:{number} uses require()")
        for name in ROOT_ASSIGN_PATTERN.findall(line):
            if not name.startswith("CreditosDomain"):
                errors.append(f"{path.relative_to(REPO_ROOT)}:{number} assigns root.{name}")
        for name in GLOBAL_ASSIGN_PATTERN.findall(line):
            errors.append(f"{path.relative_to(REPO_ROOT)}:{number} assigns globalThis.{name}")
        if GLOBAL_STATE_PATTERN.search(line):
            errors.append(f"{path.relative_to(REPO_ROOT)}:{number} touches global app state")
        for term in BANNED_CALLS:
            if term in line:
                errors.append(f"{path.relative_to(REPO_ROOT)}:{number} contains banned term {term!r}")
    return errors


def main():
    errors = []
    for path in sorted(DOMAIN_DIR.glob("*.js")):
        errors.extend(check_path(path))
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
