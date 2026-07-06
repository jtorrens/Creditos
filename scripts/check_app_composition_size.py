#!/usr/bin/env python3
import os
import pathlib
import sys


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
APP_JS = REPO_ROOT / "apps" / "renderer" / "app.js"
APP_JS_MAX_LINES = 2547
ALLOW_GROWTH_ENV = "CREDITOS_ALLOW_APP_JS_GROWTH"


def main():
    line_count = len(APP_JS.read_text(encoding="utf-8").splitlines())
    if line_count <= APP_JS_MAX_LINES:
        return 0

    if os.environ.get(ALLOW_GROWTH_ENV) == "1":
        print(
            f"WARNING: {APP_JS.relative_to(REPO_ROOT)} has {line_count} lines; "
            f"baseline is {APP_JS_MAX_LINES}.",
            file=sys.stderr,
        )
        return 0

    print(
        f"ERROR: {APP_JS.relative_to(REPO_ROOT)} has {line_count} lines; "
        f"baseline is {APP_JS_MAX_LINES}. Extract renderer composition instead "
        f"of growing app.js, or set {ALLOW_GROWTH_ENV}=1 for an explicit "
        "temporary override.",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
