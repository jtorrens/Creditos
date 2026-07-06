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

On Windows:

```powershell
py apps\renderer\server.py
```

Refactor safety checks:

```bash
python3 -m py_compile apps/renderer/server.py apps/renderer/import_models/*.py scripts/check_import_models.py
python3 scripts/check_import_models.py
python3 scripts/check_parser_golden.py
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

## Architecture Rules

The application currently works. Do not refactor by rewriting.

Prefer small, behavior-preserving extractions. Do not move logic across ownership boundaries.

### Ownership

- Import/parsing rules live in `apps/renderer/import_models`.
- Parser entrypoints are registered through `import_models/registry.py`.
- UI panels must not implement parser logic.
- UI panels must not invent typed field controls once a field registry exists.
- Domain modules must not touch DOM, browser APIs, Electron APIs, or DB APIs.
- Preview modules must not mutate domain/editor state.
- Export modules consume prepared pages/render data.
- Electron main process owns native dialogs, filesystem, server lifecycle, Git sync, and FFmpeg integration.
- Registries route. They do not implement behavior.

### Before Changing Code

Before adding a new feature or refactor, identify:

1. Which layer owns the concept?
2. Whether a registry/manifest already exists.
3. Which data crosses the boundary.
4. Which check protects the boundary.
