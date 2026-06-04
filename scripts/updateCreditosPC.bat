@echo off
setlocal

set "REPO=%~dp0.."
set "DESKTOP=%REPO%\apps\desktop"
set "DIST=%DESKTOP%\dist"

echo === Creditos PC: actualizar, compilar e instalar ===
echo.

cd /d "%REPO%"
if errorlevel 1 goto error

echo === Actualizando repositorio ===
git pull
if errorlevel 1 goto error

echo.
echo === Instalando/actualizando dependencias ===
cd /d "%DESKTOP%"
if errorlevel 1 goto error

npm install
if errorlevel 1 goto error

echo.
echo === Generando instalador Windows ===
npm run dist:win
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

:error
echo.
echo No se pudo completar la actualizacion, compilacion o instalacion.
echo Revisa el mensaje anterior. Si hace falta, copia el error en Codex.
echo.
pause
exit /b 1
