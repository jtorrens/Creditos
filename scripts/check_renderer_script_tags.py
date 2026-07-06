#!/usr/bin/env python3
import pathlib
import re
import sys


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
RENDERER_ROOT = REPO_ROOT / "apps" / "renderer"
INDEX_PATH = RENDERER_ROOT / "index.html"
SCRIPT_RE = re.compile(r'<script\s+src="\./([^"]+\.js)"></script>')


def main():
    html = INDEX_PATH.read_text(encoding="utf-8")
    scripts = SCRIPT_RE.findall(html)
    script_set = set(scripts)
    errors = []

    expected_files = ["appApi.js", "appDatabaseSync.js", "appPreferences.js", "appBootstrap.js", "appProjectState.js", "appAutosave.js", "appReferenceVideo.js", "appPreviewSettings.js", "appComposition.js", "ui/bindings.js"]
    for folder in ["domain", "preview", "export", "ui/field_controls"]:
        expected_files.extend(
            path.relative_to(RENDERER_ROOT).as_posix()
            for path in sorted((RENDERER_ROOT / folder).glob("*.js"))
        )

    for script in expected_files:
        if script not in script_set:
            errors.append(f"index.html missing script tag for {script}")

    if not scripts or scripts[-1] != "app.js":
        errors.append("index.html must load app.js as the last script.")

    for script in ["appApi.js", "appDatabaseSync.js", "appPreferences.js", "appBootstrap.js", "appProjectState.js", "appAutosave.js", "appReferenceVideo.js", "appPreviewSettings.js", "appComposition.js", "ui/bindings.js"]:
        if script in script_set and "app.js" in script_set:
            if scripts.index(script) > scripts.index("app.js"):
                errors.append(f"{script} must load before app.js.")

    if "appComposition.js" in script_set:
        composition_index = scripts.index("appComposition.js")
        for script in [
            "preview/domPreview.js",
            "preview/canvasPreview.js",
            "preview/referenceVideoPreview.js",
            "export/movPlan.js",
            "export/frameSequence.js",
            "ui/field_controls/registry.js",
        ]:
            if script in script_set and scripts.index(script) > composition_index:
                errors.append(f"{script} must load before appComposition.js.")

    if "ui/field_controls/registry.js" in script_set:
        registry_index = scripts.index("ui/field_controls/registry.js")
        for script in scripts:
            if script.startswith("ui/field_controls/") and script != "ui/field_controls/registry.js":
                if scripts.index(script) < registry_index:
                    errors.append(f"{script} loads before field control registry.")

    if "domain/common.js" in script_set:
        common_index = scripts.index("domain/common.js")
        for script in scripts:
            if script.startswith("domain/") and script != "domain/common.js":
                if scripts.index(script) < common_index:
                    errors.append(f"{script} loads before domain/common.js.")

    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
