#!/usr/bin/env python3
import pathlib
import re
import sys


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
DOMAIN_DIR = REPO_ROOT / "apps" / "renderer" / "domain"
BANNED_PATTERNS = {
    "document": re.compile(r"\bdocument\s*(?:\.|\[)"),
    "window": re.compile(r"\bwindow\s*(?:\.|\[)"),
    "HTMLElement": re.compile(r"\bHTMLElement\b"),
    "addEventListener": re.compile(r"\baddEventListener\b"),
    "classList": re.compile(r"\bclassList\b"),
    "querySelector": re.compile(r"\bquerySelector\b"),
    "nativeBridge": re.compile(r"\bnativeBridge\b"),
    "fetch": re.compile(r"\bfetch\b"),
    "dbPost": re.compile(r"\bdbPost\b"),
    "scheduleAutosave": re.compile(r"\bscheduleAutosave\b"),
}


def main():
    errors = []
    for path in sorted(DOMAIN_DIR.glob("*.js")):
        text = path.read_text(encoding="utf-8")
        for term, pattern in BANNED_PATTERNS.items():
            if pattern.search(text):
                errors.append(f"{path.relative_to(REPO_ROOT)} contains banned term {term!r}")
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
