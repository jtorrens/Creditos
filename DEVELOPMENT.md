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

## Windows Update Build Script

From the repository root on Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\update_windows_build.ps1
```

The script runs:

- `git pull`
- `npm install`
- `npm run dist`

The installer will be in `apps/desktop/dist/`.

## Git Workflow

Before working:

```bash
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
