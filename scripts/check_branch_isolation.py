#!/usr/bin/env python3
import json
import pathlib
import sys


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
PACKAGE_PATH = REPO_ROOT / "apps" / "desktop" / "package.json"
DATABASE_SYNC_PATH = REPO_ROOT / "apps" / "desktop" / "native" / "databaseSync.js"

REQUIRED_REFACTOR_DB_FILES = [
    REPO_ROOT / "apps" / "desktop" / "native" / "appPaths.js",
    REPO_ROOT / "apps" / "renderer" / "app.js",
    REPO_ROOT / "apps" / "renderer" / "server_db" / "connection.py",
    REPO_ROOT / "apps" / "renderer" / "start.command",
    REPO_ROOT / "scripts" / "updateCreditosPC.bat",
    REPO_ROOT / "scripts" / "update_windows_build.ps1",
]

BANNED_DATABASE_SYNC_PATTERNS = [
    "origin/main",
    "HEAD:main",
    "git push origin main",
    "git checkout origin/main",
]


def main():
    errors = []
    package = json.loads(PACKAGE_PATH.read_text(encoding="utf-8"))
    product_name = package.get("build", {}).get("productName", "")
    app_id = package.get("build", {}).get("appId", "")
    if "refactor" not in product_name.lower():
        errors.append("apps/desktop/package.json productName must contain Refactor.")
    if ".refactor" not in app_id.lower():
        errors.append("apps/desktop/package.json appId must contain .refactor.")

    database_sync = DATABASE_SYNC_PATH.read_text(encoding="utf-8")
    for pattern in BANNED_DATABASE_SYNC_PATTERNS:
        if pattern in database_sync:
            errors.append(f"databaseSync.js contains production DB sync target {pattern!r}.")

    for path in REQUIRED_REFACTOR_DB_FILES:
        text = path.read_text(encoding="utf-8")
        if "creditos-refactor.db" not in text:
            errors.append(f"{path.relative_to(REPO_ROOT)} does not reference creditos-refactor.db.")

    for script in [REPO_ROOT / "scripts" / "updateCreditosPC.bat", REPO_ROOT / "scripts" / "update_windows_build.ps1"]:
        text = script.read_text(encoding="utf-8")
        if "CREDITOS_APP_CHANNEL" not in text or "refactor" not in text:
            errors.append(f"{script.relative_to(REPO_ROOT)} must set CREDITOS_APP_CHANNEL=refactor.")
        if "data\\creditos.db" in text or "data/creditos.db" in text:
            errors.append(f"{script.relative_to(REPO_ROOT)} must not default to data/creditos.db.")

    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
