#!/usr/bin/env bash
#
# Spin up Expo Web inside a node:20-alpine container, bound to a host
# port the Playwright MCP can reach. Use this when you (or Claude) want
# a containerised, throw-away dev server for screenshot walkthroughs.
#
# Usage:
#   ./scripts/dev-server-container.sh up        # start (default port 18081)
#   ./scripts/dev-server-container.sh up 19000  # custom port
#   ./scripts/dev-server-container.sh logs      # tail bundler progress
#   ./scripts/dev-server-container.sh wait      # block until HTTP 200
#   ./scripts/dev-server-container.sh down      # tear down
#
# Notes:
#   - Mounts the repo at /app so edits are picked up by Metro.
#   - Uses the system docker socket (Docker Desktop's user socket may
#     not be running). Override with DOCKER_HOST=... if needed.
#   - First boot bundles the app (~30-60s); subsequent bundles are
#     incremental.

set -euo pipefail

CMD="${1:-up}"
PORT="${2:-18081}"
NAME="axiomancer-web"
IMAGE="node:20-alpine"
: "${DOCKER_HOST:=unix:///var/run/docker.sock}"
export DOCKER_HOST

case "$CMD" in
    up)
        if docker ps --filter "name=^${NAME}$" --format '{{.Names}}' | grep -q "$NAME"; then
            echo "container '$NAME' already running on host port $PORT" >&2
            exit 0
        fi
        # Run as the host UID/GID so files Metro writes into the mounted
        # repo (e.g. .expo/web/cache) stay owned by the host user. Without
        # this, host-side `npx expo start` later fails with EACCES on the
        # root-owned cache directory and Metro stalls before serving.
        docker run --rm -d \
            --name "$NAME" \
            --user "$(id -u):$(id -g)" \
            -e HOME=/tmp \
            -v "$PWD:/app" -w /app \
            -p "${PORT}:8081" \
            "$IMAGE" \
            sh -c "npx --yes expo start --web --port 8081 --host lan"
        echo "started: http://127.0.0.1:${PORT}"
        ;;
    logs)
        docker logs -f "$NAME"
        ;;
    wait)
        # Auto-detect the host port the container was actually bound to,
        # so callers don't have to repeat the port they passed to `up`.
        DETECTED="$(docker port "$NAME" 8081/tcp 2>/dev/null | head -n1 | awk -F: '{print $NF}')"
        WAIT_PORT="${DETECTED:-$PORT}"
        echo "waiting for http://127.0.0.1:${WAIT_PORT} ..."
        until curl -sS -o /dev/null --max-time 2 "http://127.0.0.1:${WAIT_PORT}/" 2>/dev/null; do
            if ! docker ps --filter "name=^${NAME}$" --format '{{.Status}}' | grep -q Up; then
                echo "container '$NAME' is not running" >&2
                docker logs "$NAME" 2>&1 | tail -30 || true
                exit 1
            fi
            sleep 3
        done
        echo "ready: http://127.0.0.1:${WAIT_PORT}"
        ;;
    down)
        docker rm -f "$NAME" >/dev/null 2>&1 || true
        echo "stopped"
        ;;
    *)
        echo "usage: $0 {up [port]|logs|wait|down}" >&2
        exit 2
        ;;
esac
