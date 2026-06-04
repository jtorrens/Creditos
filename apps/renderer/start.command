#!/bin/zsh
cd "$(dirname "$0")/.."
cd ..
PORT="${1:-8787}"
URL="http://127.0.0.1:${PORT}"

python3 apps/renderer/server.py "$PORT" --no-open &
SERVER_PID=$!

sleep 0.6
open -a "Google Chrome" "$URL"

wait "$SERVER_PID"
