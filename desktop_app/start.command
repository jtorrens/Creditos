#!/bin/zsh
set -e

SCRIPT_DIR="${0:A:h}"
cd "$SCRIPT_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "No se encontro npm."
  echo "Instala Node.js desde https://nodejs.org/ y vuelve a abrir este archivo."
  echo
  read "?Pulsa Enter para cerrar..."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Instalando dependencias de Electron..."
  npm install
fi

if [ ! -f "node_modules/electron/path.txt" ] || [ ! -x "node_modules/electron/dist/Electron.app/Contents/MacOS/Electron" ]; then
  echo "Electron no esta instalado del todo. Reinstalando binario..."
  npm install
  npm run repair-electron
fi

if [ ! -f "node_modules/electron/path.txt" ] || [ ! -x "node_modules/electron/dist/Electron.app/Contents/MacOS/Electron" ]; then
  echo
  echo "No se pudo completar la instalacion de Electron."
  echo "Prueba en Terminal:"
  echo "  cd $SCRIPT_DIR"
  echo "  npm install --force"
  echo "  npm run repair-electron"
  echo
  read "?Pulsa Enter para cerrar..."
  exit 1
fi

echo "Arrancando Creditos..."
npm start
