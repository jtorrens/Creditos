#!/usr/bin/env python3
import pathlib
import sys


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
APP_JS = REPO_ROOT / "apps" / "renderer" / "app.js"
TYPOGRAPHY_EDITOR_FILES = [
    REPO_ROOT / "apps" / "renderer" / "appStyleEditor.js",
    REPO_ROOT / "apps" / "renderer" / "appCartelaTypography.js",
    REPO_ROOT / "apps" / "renderer" / "ui" / "panels" / "settingsPanel.js",
]
BANNED_PATTERNS = [
    "createElement('input')",
    "createElement('select')",
    "type = 'color'",
    "type = 'number'",
    "type = 'text'",
    "type = 'checkbox'",
]
TYPOGRAPHY_BANNED_PATTERNS = [
    "makeFontSizeControl",
    "makeFontFamilyControl",
    "makeFontStyleControl",
    "fieldControlRegistry.create('color'",
    "font-family-select",
]


def main():
    text = APP_JS.read_text(encoding="utf-8")
    errors = [
        f"{APP_JS.relative_to(REPO_ROOT)} creates typed field control directly with {pattern!r}"
        for pattern in BANNED_PATTERNS
        if pattern in text
    ]
    for path in TYPOGRAPHY_EDITOR_FILES:
        editor_text = path.read_text(encoding="utf-8")
        errors.extend(
            f"{path.relative_to(REPO_ROOT)} creates typography controls ad hoc with {pattern!r}"
            for pattern in TYPOGRAPHY_BANNED_PATTERNS
            if pattern in editor_text
        )
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
