@echo off
setlocal

set "REPO=%~dp0.."
set "DESKTOP=%REPO%\apps\desktop"

echo === Creditos PC: actualizar y abrir ===
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
echo === Abriendo Creditos ===
npm start
if errorlevel 1 goto error

exit /b 0

:error
echo.
echo No se pudo completar la actualizacion o el arranque.
echo Revisa el mensaje anterior. Si hace falta, copia el error en Codex.
echo.
pause
exit /b 1
