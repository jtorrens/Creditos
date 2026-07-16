#!/usr/bin/env python3
import json
import pathlib
import sys


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
PACKAGE_PATH = REPO_ROOT / "apps" / "desktop" / "package.json"
DATABASE_SYNC_PATH = REPO_ROOT / "apps" / "desktop" / "native" / "databaseSync.js"

ACTIVE_WORKFLOW_FILES = [
    REPO_ROOT / "AGENTS.md",
    REPO_ROOT / "README.md",
    REPO_ROOT / "SINCRONIZACION_PC.md",
    REPO_ROOT / "PC_SYNC_BUILD.md",
    REPO_ROOT / "docs" / "CREDITOS_RUNBOOK.md",
    REPO_ROOT / "docs" / "CREDITOS_QA_MATRIX.md",
    REPO_ROOT / "docs" / "CODEX_PC_BUILD.md",
    REPO_ROOT / "docs" / "DEVELOPMENT.md",
    REPO_ROOT / "docs" / "README.md",
]

REQUIRED_CANONICAL_DB_FILES = [
    REPO_ROOT / "apps" / "desktop" / "native" / "appPaths.js",
    REPO_ROOT / "apps" / "renderer" / "appProjectSelection.js",
    REPO_ROOT / "apps" / "renderer" / "server_db" / "connection.py",
    REPO_ROOT / "apps" / "renderer" / "start.command",
    REPO_ROOT / "scripts" / "updateCreditosPC.bat",
    REPO_ROOT / "scripts" / "update_windows_build.ps1",
]

BANNED_ACTIVE_BRANCH_PATTERNS = [
    "codex/refactor-parallel",
    "codex/cartela-style-animation",
]


def main():
    errors = []
    package = json.loads(PACKAGE_PATH.read_text(encoding="utf-8"))
    product_name = package.get("build", {}).get("productName", "")
    app_id = package.get("build", {}).get("appId", "")
    if product_name != "Creditos":
        errors.append("apps/desktop/package.json productName must be Creditos.")
    if app_id != "com.jtorrens.creditos":
        errors.append("apps/desktop/package.json appId must be com.jtorrens.creditos.")

    database_sync = DATABASE_SYNC_PATH.read_text(encoding="utf-8")
    if "status.syncTargetBranch === 'main'" not in database_sync:
        errors.append("databaseSync.js must protect the active main sync target.")
    if "creditos.db" not in database_sync:
        errors.append("databaseSync.js must restrict main sync to creditos.db.")
    if "creditos-refactor.db" in database_sync:
        errors.append("databaseSync.js contains the deprecated creditos-refactor.db name.")

    for path in ACTIVE_WORKFLOW_FILES:
        text = path.read_text(encoding="utf-8")
        if "main" not in text:
            errors.append(f"{path.relative_to(REPO_ROOT)} does not identify main as the active branch.")
        if "creditos.db" not in text:
            errors.append(f"{path.relative_to(REPO_ROOT)} does not identify creditos.db as the active DB.")
        for pattern in BANNED_ACTIVE_BRANCH_PATTERNS:
            if pattern in text:
                errors.append(f"{path.relative_to(REPO_ROOT)} contains deprecated active branch {pattern!r}.")

    for path in REQUIRED_CANONICAL_DB_FILES:
        text = path.read_text(encoding="utf-8")
        if "creditos.db" not in text:
            errors.append(f"{path.relative_to(REPO_ROOT)} does not reference creditos.db.")

    for script in [REPO_ROOT / "scripts" / "updateCreditosPC.bat", REPO_ROOT / "scripts" / "update_windows_build.ps1"]:
        text = script.read_text(encoding="utf-8")
        if "CREDITOS_APP_CHANNEL" not in text or '"main"' not in text:
            errors.append(f"{script.relative_to(REPO_ROOT)} must set CREDITOS_APP_CHANNEL=main.")
        if "creditos-refactor.db" in text:
            errors.append(f"{script.relative_to(REPO_ROOT)} contains deprecated creditos-refactor.db.")

    for script in [
        REPO_ROOT / "scripts" / "updateCreditosMac.command",
        REPO_ROOT / "scripts" / "updateCreditosPC.bat",
        REPO_ROOT / "scripts" / "update_windows_build.ps1",
    ]:
        if "main" not in script.read_text(encoding="utf-8"):
            errors.append(f"{script.relative_to(REPO_ROOT)} must require the active main branch.")

    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
