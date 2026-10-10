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

# Port settings: the shell environment wins, then .env, then the compose.yaml defaults (the same order Compose uses).
env_value() {
  local name="$1" fallback="$2" value="${!1:-}"
  if [ -z "${value}" ] && [ -f .env ]; then
    value="$(grep -E "^${name}=" .env | tail -n 1 | cut -d= -f2- | tr -d '"'"'"' \r')"
  fi
  printf '%s' "${value:-${fallback}}"
}
REST_PORT="$(env_value GARRISON_REST_PORT 8700)"
MCP_PORT="$(env_value GARRISON_MCP_PORT 8701)"
DASHBOARD_PORT="$(env_value GARRISON_DASHBOARD_PORT 8080)"
POSTGRES_PORT="$(env_value GARRISON_POSTGRES_PORT 5433)"

# When the stack is not already running, make sure its host ports are free before spending minutes on a build.
if [ -z "$(docker compose ps -q 2>/dev/null)" ]; then
  busy=""
  for entry in "GARRISON_REST_PORT=${REST_PORT}" "GARRISON_MCP_PORT=${MCP_PORT}" \
               "GARRISON_DASHBOARD_PORT=${DASHBOARD_PORT}" "GARRISON_POSTGRES_PORT=${POSTGRES_PORT}"; do
    port="${entry#*=}"
    if (exec 3<>"/dev/tcp/127.0.0.1/${port}") 2>/dev/null; then busy="${busy}  ${entry} (127.0.0.1:${port} is already in use)\n"; fi
  done
  if [ -n "${busy}" ]; then
    printf 'These host ports are taken by something else:\n%b' "${busy}"
    echo "Pick free ports in docker/.env (copy .env.example if you have not), for example GARRISON_REST_PORT=9700, then run this again."
    exit 1
  fi
fi

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
echo "Update complete."
echo "  Dashboard  http://127.0.0.1:${DASHBOARD_PORT}  (tenant default, admin@garrison, password password unless you changed it)"
echo "  REST, A2A  http://127.0.0.1:${REST_PORT}"
echo "  MCP        http://127.0.0.1:${MCP_PORT}/mcp"
echo "The garrison-bootstrap container is meant to exit with code 0 once it has created the sample agents."
