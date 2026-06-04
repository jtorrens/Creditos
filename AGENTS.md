# AGENTS.md

Project: Electron app "Créditos".

## Structure

- Electron desktop app: `apps/desktop`
- Renderer and local Python server: `apps/renderer`
- Shared fixtures: `test`
- Technical docs and handoffs: `docs`

## Commands

Run from `apps/desktop`:

```bash
npm install
npm start
npm run pack
npm run dist
```

Renderer-only debugging:

```bash
python3 apps/renderer/server.py
```

## Cross-Platform Rules

- Do not introduce absolute Mac or Windows paths.
- Use paths relative to the repository or Electron resource paths.
- Python must be selected through the desktop helper:
  - Windows default: `py`
  - macOS default: `python3`
  - override: `CREDITOS_PYTHON`
- FFmpeg and FFprobe must resolve from `PATH` or overrides:
  - `CREDITOS_FFMPEG`
  - `CREDITOS_FFPROBE`
- Keep generated builds out of Git.

## Do Not Version

- `node_modules/`
- `apps/desktop/dist/`
- `apps/desktop/out/`
- packaged apps/installers (`.exe`, `.msi`, `.dmg`, `.app`, etc.)
- generated renders and videos
- local `.env` files

## Git Hygiene

- Prefer `git add <specific files>`.
- Check `git status` before committing.
- Do not revert unrelated user changes.
- If `package-lock.json` changes, inspect the diff before committing.
