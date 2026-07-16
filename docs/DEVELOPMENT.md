# Development

## Requirements

### macOS

- Node.js / npm.
- Python available as `python3`.
- FFmpeg in `PATH`.

```bash
brew install ffmpeg
```

### Windows

- Node.js / npm.
- Python available through `py`.
- FFmpeg in `PATH`.

```powershell
winget install -e --id Gyan.FFmpeg
```

Close and reopen PowerShell after installing FFmpeg so `PATH` is refreshed.

## Install

Run from the repository root:

```bash
cd apps/desktop
npm install
```

## Run

```bash
cd apps/desktop
npm start
```

`npm run dev` is an alias for the same command.

## Build

Development package without installer:

```bash
cd apps/desktop
npm run pack
```

Platform installers/packages:

```bash
cd apps/desktop
npm run dist
```

Explicit platform targets:

```bash
npm run dist:mac
npm run dist:win
```

Build outputs are written to `apps/desktop/dist/` and are not versioned.

## SQLite Project Storage

The active app on `main` stores project data in `data/creditos.db`.
The transitional `data/creditos-refactor.db` name is deprecated and must not be recreated.

Hierarchy:

- `productions`
- `episodes`

Current documents are preserved as JSON payloads inside SQLite rows:

- `source`
- `structure`
- `render`
- production `styles`

This keeps the existing render/editor logic stable while replacing external JSON files as the normal persistence mechanism.

Changes in the editor are autosaved to the database. The normal workflow does not require JSON import/export or explicit Save buttons.

Because the database is a binary file, avoid editing it independently on Mac and Windows before syncing. Its in-app Git target is `origin/main`; use the in-app DB controls rather than copying the file manually.

## macOS Update Script

From the repository root on macOS:

```bash
scripts/updateCreditosMac.command
```

The script runs:

- `git pull`
- `npm install`
- `npm run pack`

The app will be rebuilt in `apps/desktop/dist/mac-arm64/Creditos.app`.

## Optional Environment Overrides

Use these only when a tool is not available through the default command or `PATH`.

macOS/Linux:

```bash
CREDITOS_PYTHON=/opt/homebrew/bin/python3 npm start
CREDITOS_FFMPEG=/opt/homebrew/bin/ffmpeg npm start
CREDITOS_FFPROBE=/opt/homebrew/bin/ffprobe npm start
```

Windows PowerShell:

```powershell
$env:CREDITOS_PYTHON="C:\Python312\python.exe"
$env:CREDITOS_FFMPEG="C:\ffmpeg\bin\ffmpeg.exe"
$env:CREDITOS_FFPROBE="C:\ffmpeg\bin\ffprobe.exe"
npm start
```

## Renderer Only

Normally the renderer runs through Electron. For debugging in a browser:

```bash
python3 apps/renderer/server.py
```

On Windows:

```powershell
py apps\renderer\server.py
```

## Windows Update And Install Script

From the repository root on Windows:

```bat
scripts\updateCreditosPC.bat
```

The script runs:

- `git pull`
- `npm install`
- `npm run dist:win`
- the newest generated `.exe` installer in `apps\desktop\dist\`

Use it when you want to update the repository and install the current Windows build.

## Windows Build Script

From the repository root on Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\update_windows_build.ps1
```

The script runs:

- `git pull`
- `npm install`
- `npm run dist`

The installer will be in `apps/desktop/dist/`, but this PowerShell script does not run it automatically.

## Git Workflow

Before working:

```bash
git switch main
git pull
```

After changes:

```bash
git status
git add <specific files>
git commit -m "Message"
git push
```

Avoid `git add .` when builds or generated media may exist.
