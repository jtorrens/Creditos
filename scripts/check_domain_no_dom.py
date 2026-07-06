#!/usr/bin/env python3
import pathlib
import sys


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
DOMAIN_DIR = REPO_ROOT / "apps" / "renderer" / "domain"
BANNED_TERMS = [
    "document",
    "window",
    "HTMLElement",
    "addEventListener",
    "classList",
    "querySelector",
    "nativeBridge",
    "fetch",
    "dbPost",
    "scheduleAutosave",
]


def main():
    errors = []
    for path in sorted(DOMAIN_DIR.glob("*.js")):
        text = path.read_text(encoding="utf-8")
        for term in BANNED_TERMS:
            if term in text:
                errors.append(f"{path.relative_to(REPO_ROOT)} contains banned term {term!r}")
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
