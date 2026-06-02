#!/bin/zsh
cd "$(dirname "$0")/.."
PORT="${1:-8787}"
URL="http://127.0.0.1:${PORT}"

python3 web_app/server.py "$PORT" --no-open &
SERVER_PID=$!

sleep 0.6
open -a "Google Chrome" "$URL"

wait "$SERVER_PID"
