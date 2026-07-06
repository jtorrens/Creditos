#!/usr/bin/env python3
import pathlib
import sys


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
APP_JS = REPO_ROOT / "apps" / "renderer" / "app.js"
BANNED_PATTERNS = [
    "createElement('input')",
    "createElement('select')",
    "type = 'color'",
    "type = 'number'",
    "type = 'text'",
    "type = 'checkbox'",
]


def main():
    text = APP_JS.read_text(encoding="utf-8")
    errors = [
        f"{APP_JS.relative_to(REPO_ROOT)} creates typed field control directly with {pattern!r}"
        for pattern in BANNED_PATTERNS
        if pattern in text
    ]
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
