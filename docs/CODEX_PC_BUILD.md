# Codex PC Build — Creditos

Este documento es para continuar desde Codex VS en Windows y compilar/probar la version PC.

## Regla de trabajo

- Los cambios de codigo se hacen normalmente desde el Mac.
- En el PC, Codex debe centrarse en:
  - actualizar desde GitHub,
  - instalar dependencias,
  - compilar la app Windows,
  - instalar/probar,
  - reportar errores con logs claros.
- No hacer refactors ni cambios funcionales desde el PC salvo que Jorge lo pida expresamente.

## Repositorio

Repositorio:

```text
https://github.com/jtorrens/Creditos
```

Rama principal de trabajo:

```text
main
```

Ruta recomendada en Windows:

```text
D:\PROYECTOS\CREDITOS
```

Estructura importante:

```text
apps\desktop      Electron, package.json, build Windows
apps\renderer     UI, servidor Python, DB API, modulos de importacion
data              DB SQLite compartida del proyecto
docs              documentacion
scripts           scripts de actualizacion/build
test              fixtures de prueba sin videos generados
```

## Flujo rapido recomendado

Desde PowerShell o Terminal:

```powershell
cd D:\PROYECTOS\CREDITOS
git status
git switch main
git pull
scripts\updateCreditosPC.bat
```

El `.bat` intenta hacer el flujo completo:

```text
git pull
configurar CREDITOS_APP_CHANNEL=refactor
configurar CREDITOS_DB_PATH a data\creditos-refactor.db del repositorio
npm install
npm run dist:win
ejecutar el instalador .exe mas reciente
```

Si funciona, no hace falta hacer nada mas.

## Flujo manual de debug

Si el `.bat` falla, probar por pasos:

```powershell
cd D:\PROYECTOS\CREDITOS
git status
git log --oneline -5

cd apps\desktop
node -v
npm -v
py --version
npm install
npm start
```

Para generar instalador Windows:

```powershell
cd D:\PROYECTOS\CREDITOS\apps\desktop
npm run dist:win
dir dist
```

Si se genera un `.exe`, ejecutar el instalador mas reciente desde `apps\desktop\dist`.

## DB refactor

La DB histórica deprecated es:

```text
D:\PROYECTOS\CREDITOS\data\creditos.db
```

En `main` no se usa esa DB. La DB activa debe ser:

```text
D:\PROYECTOS\CREDITOS\data\creditos-refactor.db
```

La app instalada en Windows puede arrancar fuera del repositorio. Por eso el script `scripts\updateCreditosPC.bat` deja configurada una variable de entorno de usuario:

```text
CREDITOS_APP_CHANNEL=refactor
CREDITOS_DB_PATH=D:\PROYECTOS\CREDITOS\data\creditos-refactor.db
```

Comprobar en PowerShell:

```powershell
echo $env:CREDITOS_DB_PATH
Test-Path $env:CREDITOS_DB_PATH
```

Si la app aparece vacia en PC, lo primero es comprobar esta variable. Si esta vacia o apunta a otro sitio, ejecutar de nuevo:

```powershell
cd D:\PROYECTOS\CREDITOS
scripts\updateCreditosPC.bat
```

Luego cerrar y volver a abrir la app instalada.

## Requisitos de entorno

### Node / npm

Debe haber Node y npm disponibles en PATH.

```powershell
node -v
npm -v
```

### Python

En Windows el proyecto debe usar:

```text
py
```

Si hace falta forzar otro Python:

```powershell
$env:CREDITOS_PYTHON="C:\ruta\a\python.exe"
```

### FFmpeg / FFprobe

Para exportar MOV, FFmpeg y FFprobe deben estar en PATH o definirse con:

```powershell
$env:CREDITOS_FFMPEG="C:\ruta\a\ffmpeg.exe"
$env:CREDITOS_FFPROBE="C:\ruta\a\ffprobe.exe"
```

Comprobacion:

```powershell
where ffmpeg
where ffprobe
```

## Comandos utiles

Desde `apps\desktop`:

```powershell
npm install
npm start
npm run pack
npm run dist:win
```

Renderer solo, si hace falta aislar servidor:

```powershell
cd D:\PROYECTOS\CREDITOS
py apps\renderer\server.py
```

## Que comprobar en la app Windows

1. La app abre sin consola inutil o errores visibles.
2. Producciones carga la DB de `data\creditos-refactor.db`.
3. Se puede seleccionar produccion y episodio.
4. Se ve la version de la app en la interfaz.
5. Preview funciona en modo paginas y scroll.
6. Si hay video de referencia asociado, se puede mostrar en Preview.
7. Export MOV genera ProRes 4444 con alpha si no se incluye fondo/video.
8. Si se incluye fondo/video, el render sale con el fondo de produccion y video integrado.

## No versionar desde PC

No subir:

```text
node_modules\
apps\desktop\dist\
apps\desktop\out\
*.exe
*.msi
*.dmg
*.app
*.mov
*.mp4
*.m4v
.env
.env.local
```

Si aparecen cambios locales inesperados:

```powershell
git status --short
```

Consultar con Jorge antes de commitear nada desde PC.

## Si hay error

Copiar en este hilo:

```powershell
git status --short
git log --oneline -5
node -v
npm -v
py --version
echo $env:CREDITOS_DB_PATH
Test-Path $env:CREDITOS_DB_PATH
where ffmpeg
where ffprobe
```

Y el bloque completo del error de:

```powershell
npm start
```

o:

```powershell
npm run dist:win
```
