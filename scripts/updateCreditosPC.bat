@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "REPO=%~dp0.."
set "DESKTOP=%REPO%\apps\desktop"
set "DIST=%DESKTOP%\dist"
set "DB_PATH=%REPO%\data\creditos.db"
set "STASH_CREATED="
set "RESTORE_NEEDED="

echo === Creditos PC: actualizar, compilar e instalar ===
echo.

cd /d "%REPO%"
if errorlevel 1 goto error

call :stash_local_changes
if errorlevel 1 goto error

echo === Actualizando repositorio ===
git pull
if errorlevel 1 goto pull_error

call :restore_local_changes
if errorlevel 1 goto restore_error

echo.
echo === Configurando DB compartida ===
set "CREDITOS_DB_PATH=%DB_PATH%"
setx CREDITOS_DB_PATH "%DB_PATH%" >nul
if errorlevel 1 goto error
echo CREDITOS_DB_PATH=%DB_PATH%

echo.
echo === Instalando/actualizando dependencias ===
cd /d "%DESKTOP%"
if errorlevel 1 goto error

call npm install
if errorlevel 1 goto error

echo.
echo === Generando instalador Windows ===
if exist "%DIST%\*.exe" del /q "%DIST%\*.exe" >nul 2>nul
call npm run dist:win
if errorlevel 1 goto error

echo.
echo === Buscando instalador generado ===
set "INSTALLER="
for /f "delims=" %%F in ('dir /b /a:-d /o:-d "%DIST%\*.exe" 2^>nul') do (
  set "INSTALLER=%DIST%\%%F"
  goto found_installer
)

echo No se encontro ningun instalador .exe en "%DIST%".
goto error

:found_installer
echo Instalador: "%INSTALLER%"
echo.
echo === Ejecutando instalador ===
start /wait "" "%INSTALLER%"
if errorlevel 1 goto error

echo.
echo Creditos actualizado e instalado.
echo.
pause
exit /b 0

:pull_error
echo.
echo El git pull fallo.
if defined STASH_CREATED (
  echo Tus cambios locales siguen guardados en git stash.
  echo Para recuperarlos manualmente: git stash pop --index
)
echo.
pause
exit /b 1

:restore_error
echo.
echo El repositorio se actualizo, pero no se pudieron restaurar los cambios locales automaticamente.
echo Tus cambios siguen guardados en git stash.
echo Para recuperarlos manualmente: git stash pop --index
echo.
pause
exit /b 1

:error
echo.
echo No se pudo completar la actualizacion, compilacion o instalacion.
echo Revisa el mensaje anterior. Si hace falta, copia el error en Codex.
echo.
pause
exit /b 1

:stash_local_changes
set "WORKTREE_DIRTY="
for /f %%F in ('git status --porcelain --untracked-files=all') do (
  set "WORKTREE_DIRTY=1"
  goto stash_check_done
)

:stash_check_done
if not defined WORKTREE_DIRTY (
  exit /b 0
)

echo === Guardando cambios locales temporalmente ===
git stash push --include-untracked -m "creditos-update-autostash"
if errorlevel 1 exit /b 1
set "STASH_CREATED=1"
set "RESTORE_NEEDED=1"
exit /b 0

:restore_local_changes
if not defined RESTORE_NEEDED exit /b 0

echo.
echo === Restaurando cambios locales ===
git stash pop --index
if errorlevel 1 exit /b 1
set "RESTORE_NEEDED="
set "STASH_CREATED="
exit /b 0
