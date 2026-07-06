#!/usr/bin/env python3
import pathlib
import sys


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
MAIN_PATH = REPO_ROOT / "apps" / "desktop" / "main.js"
DESKTOP_ROOT = REPO_ROOT / "apps" / "desktop"
BANNED_PATTERNS = [
    "showOpenDialog",
    "showSaveDialog",
    "showMessageBox",
    "net.createServer",
    "http.get",
    "ipcMain.handle",
    "CREDITOS_FFMPEG",
    "CREDITOS_FFPROBE",
    "MOV_ENCODING_ARGS",
    "runGit(",
    "worktree",
    "preferenceWriteQueue",
    "spawn(",
]
BANNED_DESKTOP_JS_PATTERNS = [
    "'/opt/homebrew/bin/",
    '"/opt/homebrew/bin/',
    "'/usr/local/bin/",
    '"/usr/local/bin/',
    "'/usr/bin/",
    '"/usr/bin/',
]
MAX_MAIN_LINES = 220


def main():
    text = MAIN_PATH.read_text(encoding="utf-8")
    errors = []
    for pattern in BANNED_PATTERNS:
        if pattern in text:
            errors.append(f"{MAIN_PATH.relative_to(REPO_ROOT)} contains native service detail {pattern!r}")
    line_count = len(text.splitlines())
    if line_count > MAX_MAIN_LINES:
        errors.append(
            f"{MAIN_PATH.relative_to(REPO_ROOT)} has {line_count} lines; expected <= {MAX_MAIN_LINES}"
        )
    for path in DESKTOP_ROOT.rglob("*.js"):
        if any(part in {"node_modules", "dist", "out"} for part in path.relative_to(DESKTOP_ROOT).parts):
            continue
        js_text = path.read_text(encoding="utf-8")
        for pattern in BANNED_DESKTOP_JS_PATTERNS:
            if pattern in js_text:
                errors.append(
                    f"{path.relative_to(REPO_ROOT)} contains quoted absolute executable path {pattern!r}"
                )
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
