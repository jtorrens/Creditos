# Creditos Refactor - sincronizar y compilar en PC

Este documento sirve para mantener el PC en paridad con el Mac usando la rama paralela de refactor.

## Reglas

- Usar siempre la rama `codex/refactor-parallel`.
- No trabajar desde `main` para esta app.
- No usar carpetas sincronizadas para la DB.
- No sustituir el sync Git por backend remoto.
- La DB de runtime debe ser `data/creditos-refactor.db`.
- No usar `data/creditos.db` en Creditos Refactor.
- En PC no hacer refactors ni cambios funcionales salvo decision explicita.

## Primera instalacion en PC

Desde PowerShell:

```powershell
git clone https://github.com/jtorrens/Creditos.git <repo>
cd <repo>
git switch codex/refactor-parallel
```

Configurar entorno de Refactor para la sesion actual:

```powershell
$env:CREDITOS_APP_CHANNEL = "refactor"
$env:CREDITOS_DB_PATH = "<repo>\data\creditos-refactor.db"
```

Configurar entorno de Refactor como variables de usuario:

```powershell
[Environment]::SetEnvironmentVariable("CREDITOS_APP_CHANNEL", "refactor", "User")
[Environment]::SetEnvironmentVariable("CREDITOS_DB_PATH", "<repo>\data\creditos-refactor.db", "User")
```

Cerrar y abrir PowerShell despues de cambiar variables de usuario.

## Actualizar codigo en PC

Antes de actualizar:

```powershell
cd <repo>
git status
```

Si hay cambios locales inesperados, parar y revisarlos antes de seguir.

Actualizar rama:

```powershell
git fetch origin
git switch codex/refactor-parallel
git pull --ff-only
```

Confirmar que no estas en `main`:

```powershell
git branch --show-current
```

Debe devolver:

```text
codex/refactor-parallel
```

## Sincronizar DB refactor

La DB refactor se trata como snapshot manual por Git.

Ruta esperada:

```text
<repo>\data\creditos-refactor.db
```

Abrir la app y revisar en Producciones:

```text
DB: ...\data\creditos-refactor.db
Rama: origin/codex/refactor-parallel
Estado: sincronizada / local pendiente de subir / remota mas reciente / error
```

Usar los botones de la app:

```text
Bajar de GitHub
Subir a GitHub
```

No copiar manualmente `creditos.db` ni `creditos-refactor.db` entre maquinas.

Al bajar desde GitHub, la app:

```text
1. Para el servidor Python.
2. Crea backup local en data\db-backups\.
3. Baja la DB.
4. Ejecuta PRAGMA quick_check.
5. Si falla, restaura el backup.
```

Al subir a GitHub, la app:

```text
1. Ejecuta PRAGMA quick_check.
2. Bloquea main.
3. Bloquea DB distinta de creditos-refactor.db.
4. Sube snapshot solo a la rama de refactor.
```

Despues de subir correctamente, el estado debe quedar:

```text
Estado: sincronizada
```

## Instalar dependencias

Desde:

```powershell
cd <repo>\apps\desktop
npm install
```

Comprobar herramientas:

```powershell
node -v
npm -v
py --version
```

Para exportar MOV, FFmpeg y FFprobe deben estar en `PATH` o definidos con:

```powershell
$env:CREDITOS_FFMPEG = "<ruta-a-ffmpeg.exe>"
$env:CREDITOS_FFPROBE = "<ruta-a-ffprobe.exe>"
```

## Arrancar para probar

```powershell
cd <repo>\apps\desktop
npm start
```

Comprobar en la app:

```text
1. Nombre: Creditos Refactor.
2. DB: creditos-refactor.db.
3. Rama: origin/codex/refactor-parallel.
4. Producciones y capitulos cargan.
5. Preview funciona.
6. Export PNG funciona.
7. Export MOV corto funciona.
```

## Compilar app Windows

Desde:

```powershell
cd <repo>\apps\desktop
npm run dist:win
```

El instalador queda en:

```text
<repo>\apps\desktop\dist\
```

Si solo quieres generar carpeta sin instalador:

```powershell
npm run pack
```

## Mantener paridad Mac / PC

Flujo recomendado al cambiar de maquina:

```text
1. En la maquina que acabas de usar: abrir app, Subir a GitHub si la DB esta local pendiente.
2. En la otra maquina: git pull --ff-only.
3. Abrir app.
4. Si muestra remota mas reciente, usar Bajar de GitHub.
5. Confirmar Estado: sincronizada.
```

No editar la misma DB en dos maquinas a la vez. El flujo previsto es un unico usuario alternando Mac y PC.

## No versionar desde PC

No commitear:

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
data\db-backups\
.env
.env.local
```

## Diagnostico rapido

Copiar esta salida si algo falla:

```powershell
cd <repo>
git status --short --branch
git log --oneline -5
git branch --show-current
echo $env:CREDITOS_APP_CHANNEL
echo $env:CREDITOS_DB_PATH
Test-Path $env:CREDITOS_DB_PATH
node -v
npm -v
py --version
where ffmpeg
where ffprobe
```

Si falla la compilacion:

```powershell
cd <repo>\apps\desktop
npm run dist:win
```

Copiar el error completo.
