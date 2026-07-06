#!/usr/bin/env python3
import pathlib
import sys


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
SERVER_PATH = REPO_ROOT / "apps" / "renderer" / "server.py"
BANNED_PATTERNS = [
    "CREATE TABLE",
    "ALTER TABLE",
    "INSERT INTO",
    "ON CONFLICT",
    "DELETE FROM",
    "UPDATE productions SET",
    "SELECT data_json",
    "SELECT id, name",
    "connection.execute(",
]


def main():
    text = SERVER_PATH.read_text(encoding="utf-8")
    errors = [
        f"{SERVER_PATH.relative_to(REPO_ROOT)} contains banned DB/service detail {pattern!r}"
        for pattern in BANNED_PATTERNS
        if pattern in text
    ]
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
