#!/bin/bash

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/.." && pwd)"
DESKTOP="$REPO/apps/desktop"
APP_PATH="$DESKTOP/dist/mac-arm64/Creditos Refactor.app"
STASH_CREATED=""
RESTORE_NEEDED=""

echo "=== Creditos Mac: actualizar y compilar app ==="
echo

cd "$REPO" || exit 1

CURRENT_BRANCH="$(git branch --show-current)"
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "Este actualizador solo puede ejecutarse desde la rama main. Rama actual: $CURRENT_BRANCH"
  exit 1
fi

stash_local_changes() {
  if [ -z "$(git status --porcelain --untracked-files=all)" ]; then
    return 0
  fi

  echo "=== Guardando cambios locales temporalmente ==="
  git stash push --include-untracked -m "creditos-update-autostash" || return 1
  STASH_CREATED="1"
  RESTORE_NEEDED="1"
}

restore_local_changes() {
  if [ -z "$RESTORE_NEEDED" ]; then
    return 0
  fi

  echo
  echo "=== Restaurando cambios locales ==="
  git stash pop --index || return 1
  STASH_CREATED=""
  RESTORE_NEEDED=""
}

fail() {
  echo
  echo "No se pudo completar la actualizacion o compilacion."
  echo "Revisa el mensaje anterior. Si hace falta, copia el error en Codex."
  if [ -n "$STASH_CREATED" ]; then
    echo
    echo "Tus cambios locales siguen guardados en git stash."
    echo "Para recuperarlos manualmente: git stash pop --index"
  fi
  echo
  read -r -p "Pulsa Enter para cerrar..."
  exit 1
}

stash_local_changes || fail

echo "=== Actualizando repositorio ==="
if ! git pull; then
  fail
fi

if ! restore_local_changes; then
  echo
  echo "El repositorio se actualizo, pero no se pudieron restaurar los cambios locales automaticamente."
  echo "Tus cambios siguen guardados en git stash."
  echo "Para recuperarlos manualmente: git stash pop --index"
  echo
  read -r -p "Pulsa Enter para cerrar..."
  exit 1
fi

echo
echo "=== Instalando/actualizando dependencias ==="
cd "$DESKTOP" || fail
npm install || fail

echo
echo "=== Compilando app Mac ==="
npm run pack || fail

echo
echo "Creditos actualizado y compilado."
echo "App:"
echo "$APP_PATH"
echo
read -r -p "Pulsa Enter para cerrar..."
