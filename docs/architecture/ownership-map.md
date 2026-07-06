# Refactor Ownership Map

This project is functionally stable. Refactors should preserve behavior and move only one responsibility at a time.

## Current Pressure Points

- `apps/renderer/app.js`: renderer composition root and state wiring.
- `apps/renderer/appLifecycle.js`: rebuild/render cycle, tab activation, source metadata, and JSON preview.
- `apps/renderer/server.py`: HTTP routing, SQLite, persistence, endpoints, and import entrypoint.
- `apps/desktop/main.js`: Electron host, dialogs, preferences, Git sync, FFmpeg/MOV, and server lifecycle.

## Target Ownership

| Concept | Owner | Consumers | Should not live in |
|---|---|---|---|
| XLS/ODS import models | `apps/renderer/import_models/` | `server.py`, import services | UI, preview, export |
| `source_json` contract | import/domain schema | domain builders | ad hoc UI code |
| `materials` | domain materials | structure builder | DOM/UI |
| `structure_json` | domain structure/editor commands | persistence, render builder | preview/export directly |
| `render_json` | domain render builder | preview/export | editor panels |
| Physical pagination | domain pagination | preview/export | UI handlers |
| Effective cartela styles | domain styles | editor/preview/export | loose input helpers |
| Field controls | field control registry | panels/inspectors | individual panels |
| Preview DOM/canvas | preview modules | UI | domain builders |
| PNG export | export/png | UI commands/native | domain |
| MOV timeline | export/mov planning and desktop/native MOV | UI commands | monolithic `app.js` |
| SQLite schema/repos | server/db | services/server routes | HTTP handler bodies |
| Electron dialogs | desktop/native/dialogs | preload/ipc | renderer domain |
| Git DB sync | desktop/native/databaseSync | UI/native bridge | renderer |
| FFmpeg sessions | desktop/native/movExport | export orchestrator | UI panels |

## Immediate Order

1. Keep the current behavior observable and runnable.
2. Protect import model boundaries with checks and golden outputs.
3. Move shared parser helpers into `import_models/common`.
4. Add a `source_json` validator before expanding import formats.
5. Extract pure domain modules from `app.js` only after checks exist.

## Refactor Criteria

Each refactor must answer:

1. Which responsibility is moving?
2. Which files change?
3. Why behavior does not change?
4. Which check or test protects the boundary?
