# Handover Codex — Proyecto Créditos / Electron Mac + Windows

## Estado operativo vigente — 2026-07-16

```text
Rama activa: main
Aplicación: Creditos Refactor
DB activa: data/creditos.db
Sync DB: origin/main
Versión: 0.1.66
```

Las ramas `deprecated/*` y `deprecated/legacy-main` son históricas. `data/creditos.db` es la única DB activa; el nombre transitorio `data/creditos-refactor.db` ya no debe utilizarse.

Las secciones fechadas anteriores a este bloque se mantienen como historial de la migración Mac/Windows; si contradicen este estado operativo, prevalece este bloque.

## Contexto

Repositorio GitHub:

```text
https://github.com/jtorrens/Creditos
```

Ruta local en Windows:

```text
D:\PROYECTOS\CREDITOS
```

El proyecto se venía trabajando desde Codex en un Mac. Se ha clonado y probado en un PC Windows para poder desarrollar, debuggear y generar la versión Windows.

La app Electron está en:

```text
apps/desktop
```

El renderer / servidor está en:

```text
apps/renderer
```

## Referencia histórica tras el primer trabajo en Mac

Fecha de esta nota: 2026-06-04.

El repositorio ya fue reorganizado y subido a GitHub. La rama principal esperada es `main`.

Commits recientes relevantes:

```text
a92b8a6 Run Windows installer from update script
79ff691 Add Windows update launcher script
9044d6a Stop tracking local app alias
0b48a6e Show app version in interface
9f44959 Prepare cross-platform development workflow
```

En aquella revisión histórica la app mostraba:

```text
v0.1.1 (histórica; no usar como versión vigente)
```

Esto sirve para comprobar rapidamente que Mac y Windows estan usando la misma version del codigo.

La estructura actual esperada del repo es:

```text
apps/desktop      App Electron
apps/renderer     UI, servidor Python, parser y exportadores
docs              Documentacion y handoffs
scripts           Scripts de actualizacion/build
test              Fixtures de prueba
```

`README.md` y `AGENTS.md` se mantienen en la raiz por convencion. `DEVELOPMENT.md` vive en:

```text
docs/DEVELOPMENT.md
```

`Creditos alias` es un alias local del Mac a la app empaquetada y no debe versionarse.

## Punto importante para Codex en Windows

Se creo este script:

```text
scripts/updateCreditosPC.bat
```

La intencion del `.bat` es que, desde Windows, haga el flujo completo:

```text
git pull
npm install
npm run dist:win
ejecutar el instalador .exe mas reciente de apps\desktop\dist
```

Jorge sospecha que el flujo todavia puede no estar funcionando del todo en Windows. Es mas facil depurarlo desde el PC porque ahi se vera el entorno real: permisos, Node, Electron Builder, Python, FFmpeg, instalador generado y rutas Windows.

Primeros pasos recomendados en Codex VS en el PC:

```powershell
cd D:\PROYECTOS\CREDITOS
git pull
git status
scripts\updateCreditosPC.bat
```

Si el `.bat` falla, no asumir que el concepto esta mal: leer el mensaje de error y depurar por pasos.

Comandos utiles para aislar el problema:

```powershell
cd D:\PROYECTOS\CREDITOS
git log --oneline -5
git status

cd apps\desktop
node -v
npm -v
py --version
where ffmpeg
where ffprobe

npm install
npm start
npm run dist:win

dir dist
```

Si `npm run dist:win` genera un `.exe`, probar manualmente:

```powershell
cd D:\PROYECTOS\CREDITOS\apps\desktop
dir dist\*.exe
```

Y ejecutar el instalador mas reciente desde Explorer o PowerShell.

Si el problema es solo encontrar o ejecutar el instalador desde el `.bat`, ajustar `scripts/updateCreditosPC.bat`.

Si el problema esta en Electron Builder, revisar `apps/desktop/package.json`.

Si el problema esta en Python, recordar que en Windows el launcher esperado por defecto es:

```text
py
```

Y puede forzarse con:

```powershell
$env:CREDITOS_PYTHON="C:\ruta\a\python.exe"
```

Si el problema esta en FFmpeg/FFprobe, deben estar en `PATH` o se puede forzar:

```powershell
$env:CREDITOS_FFMPEG="C:\ruta\a\ffmpeg.exe"
$env:CREDITOS_FFPROBE="C:\ruta\a\ffprobe.exe"
```

Comandos principales desde `apps/desktop`:

```bash
npm install
npm start
npm run pack
npm run dist
```

---

## Trabajo ya realizado en Windows

### 1. Clonado del repositorio

En el PC se clonó el repositorio en:

```powershell
D:\PROYECTOS\CREDITOS
```

Flujo usado:

```powershell
cd D:\PROYECTOS
git clone https://github.com/jtorrens/Creditos.git CREDITOS
cd D:\PROYECTOS\CREDITOS\apps\desktop
npm install
```

---

### 2. Problema inicial con Python

Al ejecutar:

```powershell
npm start
```

apareció un error porque el proyecto intentaba lanzar `python3`, que en Windows no estaba disponible como comando real. Windows intentaba usar el alias de Microsoft Store:

```text
[creditos-server] no se encontró Python; ejecutar sin argumentos para instalar desde el Microsoft Store...
```

En el PC sí existe Python, pero no como `python3`; funciona mediante `py` y/o `python`.

---

### 3. Cambio necesario en `main.js`

El proyecto tenía una llamada parecida a:

```js
serverProcess = spawn('python3', [scriptPath, String(port), '--no-open'], {
  cwd: rendererPath(),
  stdio: ['ignore', 'pipe', 'pipe'],
});
```

Para que funcione tanto en Mac como en Windows, se sustituyó por una selección según plataforma:

```js
const pythonCommand = process.platform === 'win32' ? 'py' : 'python3';

serverProcess = spawn(pythonCommand, [scriptPath, String(port), '--no-open'], {
  cwd: rendererPath(),
  stdio: ['ignore', 'pipe', 'pipe'],
});
```

Resultado esperado:

```text
Windows → py
macOS   → python3
```

Este cambio no debería afectar al Mac, porque `process.platform === 'win32'` solo se cumple en Windows.

Pendiente: confirmar si este cambio ya está commiteado y subido a GitHub.

Comandos recomendados:

```powershell
cd D:\PROYECTOS\CREDITOS
git status
git add apps/desktop/main.js
git commit -m "Use platform-specific Python command"
git push
```

---

### 4. Instalación de FFmpeg en Windows

En Mac FFmpeg se instaló con Homebrew.

En Windows se instaló con `winget`:

```powershell
winget install -e --id Gyan.FFmpeg
```

La instalación descargó el build de Gyan:

```text
https://github.com/GyanD/codexffmpeg/releases/download/8.1.1/ffmpeg-8.1.1-full_build.zip
```

Durante la instalación se añadieron alias de línea de comandos:

```text
ffmpeg
ffplay
ffprobe
```

También se modificó el `PATH`. Fue necesario cerrar y volver a abrir PowerShell para que los comandos funcionasen.

Comprobación realizada:

```powershell
ffmpeg -version
ffprobe -version
```

Estado: FFmpeg ya funciona en el PC.

---

### 5. Arranque en modo desarrollo en Windows

Tras corregir Python e instalar FFmpeg, el proyecto ya arranca correctamente en Windows con:

```powershell
cd D:\PROYECTOS\CREDITOS\apps\desktop
npm start
```

Estado: la app funciona en desarrollo en el PC.

---

### 6. Creación de ejecutable empaquetado Windows

Desde:

```powershell
cd D:\PROYECTOS\CREDITOS\apps\desktop
```

Se generó la versión Windows con:

```powershell
npm run dist
```

También puede usarse para empaquetado sin instalador:

```powershell
npm run pack
```

Resultado: se generó un instalador tipo:

```text
Creditos Setup ... .exe
```

Ubicación esperada:

```text
D:\PROYECTOS\CREDITOS\apps\desktop\dist
```

El instalador se ejecutó correctamente y creó acceso directo en el escritorio.

Importante: no se necesita distribuir a otros PCs. La app puede depender de que en este PC estén instalados globalmente Python y FFmpeg.

---

## Estado actual

- El proyecto está clonado en Windows.
- `npm install` funciona.
- `npm start` funciona tras adaptar Python.
- Python está disponible en Windows como `py`.
- FFmpeg está instalado y disponible en `PATH`.
- `npm run dist` genera el instalador Windows.
- El instalador `Creditos Setup...exe` se ha creado correctamente.
- La app instalada ha creado acceso directo en escritorio.
- No hay necesidad inmediata de empaquetar Python ni FFmpeg dentro de la app, porque no se va a distribuir a otros equipos.

---

## Objetivo siguiente

Cuando vuelvan los tokens de Codex, pedirle que deje el repositorio preparado para trabajar y debuggear indistintamente desde:

```text
Mac + Codex
Windows PC + Codex
```

La idea es que GitHub sea la fuente única de verdad y que todo lo específico de sistema operativo quede abstraído.

---

## Tareas recomendadas para Codex

### 1. Revisar y consolidar soporte multiplataforma

Codex debería revisar el proyecto completo buscando dependencias o rutas específicas de Mac/Windows.

Buscar especialmente:

```text
python3
python
py
ffmpeg
ffprobe
/Users/
D:\
C:\
darwin
win32
spawn
exec
shell scripts
```

En Windows se puede buscar con:

```powershell
cd D:\PROYECTOS\CREDITOS
Get-ChildItem -Recurse -File | Select-String "python3","/Users/","ffmpeg","ffprobe","darwin","win32","D:\","C:\"
```

En Mac:

```bash
cd /ruta/al/repo/Creditos
grep -R "python3\|/Users/\|ffmpeg\|ffprobe\|darwin\|win32\|D:\\|C:\\" .
```

Codex debería sustituir rutas absolutas por rutas relativas al proyecto o recursos resueltos dinámicamente.

---

### 2. Crear helper robusto para Python

En vez de tener la lógica suelta en `main.js`, podría crearse una función/helper:

```js
function getPythonCommand() {
  return process.platform === 'win32' ? 'py' : 'python3';
}
```

O, mejor aún, una función que permita override por variable de entorno:

```js
function getPythonCommand() {
  if (process.env.CREDITOS_PYTHON) return process.env.CREDITOS_PYTHON;
  return process.platform === 'win32' ? 'py' : 'python3';
}
```

Así se podría forzar un Python concreto si fuese necesario:

```powershell
$env:CREDITOS_PYTHON="C:\Python312\python.exe"
npm start
```

O en Mac:

```bash
CREDITOS_PYTHON=/opt/homebrew/bin/python3 npm start
```

---

### 3. Crear helper robusto para FFmpeg / FFprobe

Ahora mismo FFmpeg funciona porque está instalado globalmente en el `PATH`.

Para uso interno esto es suficiente, pero Codex debería revisar si el código llama directamente a:

```text
ffmpeg
ffprobe
```

Recomendación:

- Permitir override por variable de entorno.
- Mantener fallback a `ffmpeg` / `ffprobe` en `PATH`.

Ejemplo conceptual:

```js
const ffmpegCommand = process.env.CREDITOS_FFMPEG || 'ffmpeg';
const ffprobeCommand = process.env.CREDITOS_FFPROBE || 'ffprobe';
```

Esto permite mantener desarrollo simple en Mac/PC, pero da flexibilidad si un equipo tiene FFmpeg en otra ruta.

---

### 4. Actualizar `.gitignore`

Codex debería revisar y actualizar `.gitignore` para evitar subir builds, dependencias o archivos temporales.

Debe incluir, como mínimo:

```gitignore
# Dependencies
node_modules/

# Electron / build outputs
apps/desktop/dist/
apps/desktop/out/
dist/
out/
build/

# Installers / packaged apps
*.exe
*.msi
*.dmg
*.app
*.AppImage
*.deb
*.rpm

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# OS files
.DS_Store
Thumbs.db

# Environment overrides
.env
.env.local
```

Antes de aplicar esto, Codex debe comprobar si ya existe `.gitignore` y fusionar sin borrar reglas importantes del proyecto.

---

### 5. Añadir documentación de desarrollo

Crear o actualizar un documento tipo:

```text
DEVELOPMENT.md
```

Contenido recomendado:

- Requisitos en Mac.
- Requisitos en Windows.
- Instalación de dependencias.
- Arranque en desarrollo.
- Creación de build Windows.
- Creación de build Mac.
- Variables de entorno opcionales.
- Flujo Git recomendado.

Ejemplo de contenido mínimo:

```md
# Development

## Requirements

### macOS
- Node.js / npm
- Python available as `python3`
- FFmpeg installed with Homebrew:
  ```bash
  brew install ffmpeg
  ```

### Windows
- Node.js / npm
- Python available through `py`
- FFmpeg installed with winget:
  ```powershell
  winget install -e --id Gyan.FFmpeg
  ```

## Install

```bash
cd apps/desktop
npm install
```

## Run

```bash
npm start
```

## Build

```bash
npm run pack
npm run dist
```

## Optional environment overrides

```bash
CREDITOS_PYTHON=/custom/python
CREDITOS_FFMPEG=/custom/ffmpeg
CREDITOS_FFPROBE=/custom/ffprobe
```
```

---

### 6. Añadir instrucciones para Codex

Crear en la raíz:

```text
AGENTS.md
```

Contenido sugerido:

```md
# AGENTS.md

Proyecto Electron "Creditos".

## Estructura

- App Electron: `apps/desktop`
- Renderer / servidor: `apps/renderer`

## Comandos

Ejecutar desde `apps/desktop`:

```bash
npm install
npm start
npm run pack
npm run dist
```

## Reglas multiplataforma

- No introducir rutas absolutas de Mac o Windows.
- Usar `process.platform` cuando haya diferencias reales entre sistemas.
- En Windows, Python debe lanzarse con `py` salvo override por variable de entorno.
- En macOS, Python debe lanzarse con `python3` salvo override por variable de entorno.
- FFmpeg y FFprobe deben resolverse desde PATH o mediante variables de entorno.
- No versionar builds, instaladores ni `node_modules`.

## No subir

- `node_modules/`
- `dist/`
- `out/`
- `.exe`
- `.dmg`
- `.app`
- renders generados
```

---

### 7. Revisar scripts de `package.json`

Codex debería comprobar `apps/desktop/package.json` y confirmar que los scripts son correctos para ambos sistemas.

Scripts actuales conocidos:

```json
{
  "start": "node run-electron.js",
  "repair-electron": "node repair-electron.js",
  "pack": "electron-builder --dir",
  "dist": "electron-builder"
}
```

Posibles mejoras:

```json
{
  "start": "node run-electron.js",
  "dev": "node run-electron.js",
  "pack": "electron-builder --dir",
  "dist": "electron-builder",
  "dist:win": "electron-builder --win",
  "dist:mac": "electron-builder --mac"
}
```

No cambiar sin comprobar la configuración actual de `electron-builder`.

---

### 8. Confirmar que `dist/` no está versionado

Antes de cualquier commit:

```bash
git status
```

Si aparecen archivos generados como:

```text
apps/desktop/dist/
Creditos Setup ... .exe
win-unpacked/
```

no deben subirse al repo.

Si ya estuvieran trackeados por error:

```bash
git rm -r --cached apps/desktop/dist
```

Luego confirmar que `.gitignore` los excluye.

---

### 9. Flujo de trabajo recomendado entre Mac y PC

Antes de trabajar en cualquier equipo:

```bash
git pull
```

Después de cambios:

```bash
git status
git add <archivos concretos>
git commit -m "Mensaje descriptivo"
git push
```

En el otro equipo:

```bash
git pull
cd apps/desktop
npm install   # solo si cambió package.json/package-lock.json
npm start
```

Evitar `git add .` si hay builds generados. Preferir añadir archivos concretos.

---

---

## Decisión actual de workflow

El desarrollo principal se centrará en el Mac con Codex. El PC Windows se usará sobre todo para:

- hacer `git pull` de los cambios subidos desde el Mac;
- probar la app en Windows cuando haga falta;
- regenerar el instalador `.exe` empaquetado para uso local.

No es necesario que los hilos de Codex se sincronicen entre Mac y PC. El contexto importante debe vivir en el repositorio mediante documentación (`AGENTS.md`, `DEVELOPMENT.md`, `docs/CODEX_LOG.md` o este handoff).

---

## Proceso semiautomático deseado para actualizar la app Windows

Objetivo: después de desarrollar en Mac y hacer `git push`, en el PC debería bastar con ejecutar un script que haga todo el ciclo Windows:

```powershell
git pull
npm install
npm run dist
```

Codex debería crear un script versionado en el repo, por ejemplo:

```text
scripts/update_windows_build.ps1
```

Contenido sugerido:

```powershell
$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
$desktop = Join-Path $repo "apps\desktop"

Write-Host "=== Actualizando repositorio ==="
Set-Location $repo
git pull

Write-Host "=== Instalando/actualizando dependencias ==="
Set-Location $desktop
npm install

Write-Host "=== Generando instalador Windows ==="
npm run dist

Write-Host ""
Write-Host "=== Build terminado ==="
Write-Host "Busca el instalador en:"
Write-Host (Join-Path $desktop "dist")
```

Comando de uso desde la raíz del repo en Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\update_windows_build.ps1
```

También se puede crear un acceso directo en el escritorio con destino:

```text
powershell.exe -ExecutionPolicy Bypass -File "D:\PROYECTOS\CREDITOS\scripts\update_windows_build.ps1"
```

Codex debería documentarlo en `DEVELOPMENT.md`.

---

## Estado de Git observado en el PC

VS Code muestra solo tres archivos pendientes de sincronizar:

```text
Creditos_handover...
apps/desktop/main.js
apps/desktop/package-lock.json
```

Interpretación:

- `main.js`: sí debe subirse, porque contiene el cambio multiplataforma `py` en Windows / `python3` en Mac.
- `Creditos_handover...`: sí conviene subirlo, preferiblemente dentro de `docs/` con un nombre estable, por ejemplo `docs/CREDITOS_handover_mac_pc_codex.md`.
- `package-lock.json`: revisar antes de subir. Puede haberse modificado simplemente al ejecutar `npm install` en Windows. Si no hubo cambios reales en `package.json` ni dependencias nuevas, probablemente no hace falta commitearlo.

Comandos recomendados para revisar `package-lock.json`:

```powershell
cd D:\PROYECTOS\CREDITOS
git diff -- apps/desktop/package-lock.json
```

Si el diff es enorme o solo refleja diferencias de instalación/plataforma no deseadas, revertirlo:

```powershell
git restore apps/desktop/package-lock.json
```

Si Codex o el desarrollador confirma que el cambio es necesario, entonces sí commitearlo explícitamente.

---

## Commit mínimo recomendado ahora desde Windows

La opción más segura ahora mismo es subir solo `main.js` y el handoff actualizado, evitando `package-lock.json` salvo que el diff sea claramente necesario.

Ejemplo si el handoff se guarda en `docs/`:

```powershell
cd D:\PROYECTOS\CREDITOS

# Opcional: crear carpeta docs si no existe
mkdir docs

# Copiar/mover el handoff a docs con nombre estable si aún no está ahí
# move .\Creditos_handover_mac_pc_codex.md .\docs\CREDITOS_handover_mac_pc_codex.md

git status
git diff -- apps/desktop/package-lock.json

# Si package-lock no debe subirse:
git restore apps/desktop/package-lock.json

git add apps/desktop/main.js docs/CREDITOS_handover_mac_pc_codex.md
git commit -m "Document Mac Windows workflow and Python launcher"
git push
```

Después, en el Mac:

```bash
cd /ruta/al/repo/Creditos
git pull
```

Y cuando vuelvan los tokens, pedir a Codex en Mac que implemente las tareas pendientes.

## Prompt sugerido para Codex

Cuando haya tokens disponibles, se le puede pedir algo como:

```text
Revisa este repositorio Electron para dejarlo preparado para desarrollo multiplataforma en macOS y Windows.

Contexto:
- Repo: https://github.com/jtorrens/Creditos
- App Electron: apps/desktop
- Renderer/servidor: apps/renderer
- En Mac Python funciona como python3.
- En Windows Python funciona como py.
- En ambos entornos FFmpeg/FFprobe estarán instalados en PATH, pero quiero permitir override por variables de entorno.
- En Windows ya se ha generado correctamente un instalador con npm run dist.
- No necesito distribuir a terceros, así que no hace falta empaquetar Python ni FFmpeg dentro de la app.

Tareas:
1. Revisa el repo buscando rutas absolutas o comandos específicos de Mac/Windows.
2. Centraliza la selección de Python para que use py en Windows y python3 en macOS, con override opcional CREDITOS_PYTHON.
3. Centraliza la selección de ffmpeg y ffprobe, con override opcional CREDITOS_FFMPEG y CREDITOS_FFPROBE.
4. Actualiza .gitignore para excluir node_modules, dist, out, instaladores, builds y temporales sin borrar reglas existentes necesarias.
5. Crea DEVELOPMENT.md con requisitos y comandos para Mac y Windows.
6. Crea AGENTS.md con instrucciones para futuros trabajos de Codex.
7. Revisa package.json y, si es seguro, añade scripts explícitos dist:win y dist:mac.
8. No subas ni modifiques archivos generados en dist/.
9. Al final dame un resumen de archivos cambiados y comandos de prueba.
```

---

## Prioridad real

Como el objetivo es solo trabajar en el Mac y en este PC, no hace falta complicar la app empaquetando dependencias.

Prioridad alta:

1. Confirmar cambio Python multiplataforma.
2. Revisar rutas absolutas.
3. Actualizar `.gitignore`.
4. Añadir `DEVELOPMENT.md`.
5. Añadir `AGENTS.md`.
6. Comprobar `npm start` en Mac y PC.
7. Comprobar `npm run dist` en Windows.

Prioridad baja / opcional:

1. Empaquetar FFmpeg dentro de la app.
2. Empaquetar Python dentro de la app.
3. Crear instalador portable para terceros.
4. Automatizar builds con GitHub Actions.
