# AGENTS.md

Project: Electron app "Créditos".

## Required Workspace

- Do not modify the deprecated legacy Créditos workspace or its `deprecated/legacy-main` branch.
- All implementation, documentation, dependency, build, and verification work must be done in this canonical Créditos workspace on `main`.
- Before editing or generating project files, run `git branch --show-current` and confirm that this is the canonical application on `main`. Its current application version is `0.1.96`.
- If the worktree or version does not match the canonical application, stop and ask the user before moving changes.

## Parallel Work

- The isolated Parser Lab may be developed in its own dedicated branch/worktree based on the current `main`.
- Parser Lab parallel work must remain inside `apps/renderer/parser_lab` and its isolated tests. It must not modify the active database or general application files.
- All other implementation threads continue working in this canonical workspace on `main`.
- If Parser Lab needs a shared or general application change, stop and obtain explicit authorization before crossing the isolation boundary.
- Integrate completed Parser Lab work into `main` as a dedicated commit, then run the combined verification on `main`.

## Active Data And Sync Target

- The only active runtime database is `data/creditos.db`.
- Database synchronization must target `origin/main`.
- `deprecated/legacy-main` and every other `deprecated/*` branch are historical only.
- Never reintroduce `data/creditos-refactor.db`; that transitional name is deprecated.
- Do not commit local DB mutations as part of application or documentation changes unless the user explicitly requests a DB snapshot sync.

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

## Required Build Verification

- After every change to application code, run `npm run pack` from `apps/desktop` to compile the desktop executable.
- Launch or smoke-test the packaged executable before considering the task complete.
- In the final handoff, always state the application version from `apps/desktop/package.json` and the path of the packaged executable that was verified.
- The application UI must continue to display its version. Verify the visible version when testing the packaged executable.
- Generated executables and packaged application folders are verification artifacts only and must remain outside Git.

Renderer-only debugging:

```bash
python3 apps/renderer/server.py
```

On Windows:

```powershell
py apps\renderer\server.py
```

Créditos safety checks:

```bash
python3 -m py_compile apps/renderer/server.py apps/renderer/server_db/*.py apps/renderer/server_services/*.py apps/renderer/import_models/*.py apps/renderer/import_models/common/*.py scripts/check_import_models.py scripts/check_parser_golden.py scripts/check_domain_no_dom.py scripts/check_server_boundaries.py scripts/check_native_boundaries.py scripts/check_renderer_app_boundaries.py
python3 scripts/check_import_models.py
python3 scripts/check_parser_golden.py
python3 scripts/check_parser_lab.py
python3 scripts/check_domain_no_dom.py
python3 scripts/check_renderer_app_boundaries.py
python3 scripts/check_server_boundaries.py
python3 scripts/check_native_boundaries.py
python3 scripts/check_creditos_safety.py
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

## Isolated Parser Lab Tab

The parser inspection/model-development tab is an isolated laboratory feature. Its purpose is to display normalized source rows, test candidate interpretation rules, and compare candidate output without replacing or altering the production import path.

- Work for this tab must be contained in tab-specific UI, services, state, and tests.
- It must not change the behavior or output of existing import models, the production parser endpoint, source normalization, materials, structure/cartelas, rendering, export, persistence, or any other application section.
- It may consume copies of normalized reader output through an explicit inspection boundary, but it must not mutate production source data or editor state.
- Candidate results remain isolated until saved as a valid DB-backed manual import model. Production execution uses the registered `rule_based_credits` family and the exact persisted revision selected by the production; it must never read the retired local JSON library or infer a fallback rule.
- Do not refactor, reorganize, or modify general/shared application code merely to accommodate this tab. If a required change would cross the tab boundary, stop and obtain explicit user authorization for that specific change first.
- Existing parser golden outputs and application behavior must remain unchanged while the tab is developed.
