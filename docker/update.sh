#!/usr/bin/env bash
# =============================================================================
#  update.sh - rebuild the Garrison images and recreate the Docker stack.
#
#  Non-destructive: named volumes (database, worker workspaces) are preserved.
#  For a destructive reset use docker/factory/reset.sh.
#
#  Usage:   ./update.sh            rebuild images from this repository (default)
#           ./update.sh --pull     pull the published images named in compose.yaml instead
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE="build"
[ "${1:-}" = "--pull" ] && MODE="pull"

cd "${SCRIPT_DIR}"

echo "========================================"
echo " Garrison - Update Docker Stack (${MODE})"
echo "========================================"

echo
if [ "${MODE}" = "pull" ]; then
  echo "[1/4] Pulling the images named in compose.yaml..."
  docker compose pull
else
  echo "[1/4] Building images (the worker image takes several minutes on the first build)..."
  docker compose build
fi

echo
echo "[2/4] Stopping the stack (volumes are preserved)..."
docker compose down

echo
echo "[3/4] Starting the stack..."
docker compose up -d

echo
echo "[4/4] Container status:"
docker compose ps -a

echo
echo "Update complete. Dashboard: http://127.0.0.1:${GARRISON_DASHBOARD_PORT:-8080}  (tenant default, admin@garrison, password)"
