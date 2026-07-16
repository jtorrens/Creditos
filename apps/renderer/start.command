#!/bin/zsh
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"
PORT="${1:-8787}"
URL="http://127.0.0.1:${PORT}"

export CREDITOS_APP_CHANNEL="${CREDITOS_APP_CHANNEL:-main}"
export CREDITOS_DB_PATH="${CREDITOS_DB_PATH:-$REPO_ROOT/data/creditos.db}"

python3 apps/renderer/server.py "$PORT" --no-open &
SERVER_PID=$!

sleep 0.6
open -a "Google Chrome" "$URL"

wait "$SERVER_PID"
