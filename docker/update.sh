#!/usr/bin/env bash
# =============================================================================
#  update.sh - rebuild the Garrison images and recreate the Docker stack.
#
#  Non-destructive: named volumes (database, worker workspaces) are preserved.
#  First, env-secrets.sh makes sure .env holds every key and password the stack
#  requires, generating random values for any that can safely be created.
#  For a destructive reset use docker/factory/reset.sh.
#
#  Usage:   ./update.sh                   rebuild images from this repository (default)
#           ./update.sh --pull            pull the published images named in compose.yaml instead
#           ./update.sh --observability   also run the observability profile (Prometheus, Loki, Tempo, Grafana,
#                                         Alloy) with compose.observability.yaml; combines with --pull
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE="build"
OBSERVABILITY=0
for arg in "$@"; do
  case "${arg}" in
    --pull) MODE="pull" ;;
    --observability) OBSERVABILITY=1 ;;
    *) echo "Unknown option ${arg}. Usage: ./update.sh [--pull] [--observability]"; exit 1 ;;
  esac
done

# Compose files and profile. Without --observability the stack runs without the observability services (and stops
# them if a previous update started them).
COMPOSE=(docker compose -f compose.yaml)
if [ "${OBSERVABILITY}" = "1" ]; then
  COMPOSE=(docker compose -f compose.yaml -f compose.observability.yaml --profile observability)
fi

cd "${SCRIPT_DIR}"

# Keys, passwords, and seeded credentials: compose.yaml has no defaults for them (SR-08).
"${SCRIPT_DIR}/env-secrets.sh"

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
GRAFANA_PORT="$(env_value GARRISON_GRAFANA_PORT 3000)"
PROMETHEUS_PORT="$(env_value GARRISON_PROMETHEUS_PORT 9090)"
LOKI_PORT="$(env_value GARRISON_LOKI_PORT 3100)"
TEMPO_PORT="$(env_value GARRISON_TEMPO_PORT 3200)"

# When the stack is not already running, make sure its host ports are free before spending minutes on a build.
if [ -z "$(docker compose ps -q 2>/dev/null)" ]; then
  busy=""
  entries=("GARRISON_REST_PORT=${REST_PORT}" "GARRISON_MCP_PORT=${MCP_PORT}" \
           "GARRISON_DASHBOARD_PORT=${DASHBOARD_PORT}" "GARRISON_POSTGRES_PORT=${POSTGRES_PORT}")
  if [ "${OBSERVABILITY}" = "1" ]; then
    entries+=("GARRISON_GRAFANA_PORT=${GRAFANA_PORT}" "GARRISON_PROMETHEUS_PORT=${PROMETHEUS_PORT}" \
              "GARRISON_LOKI_PORT=${LOKI_PORT}" "GARRISON_TEMPO_PORT=${TEMPO_PORT}")
  fi
  for entry in "${entries[@]}"; do
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
echo " Garrison - Update Docker Stack (${MODE}$([ "${OBSERVABILITY}" = "1" ] && printf ', observability'))"
echo "========================================"

echo
if [ "${MODE}" = "pull" ]; then
  echo "[1/4] Pulling the images named in compose.yaml..."
  "${COMPOSE[@]}" pull
else
  echo "[1/4] Building images (the worker image takes several minutes on the first build)..."
  "${COMPOSE[@]}" build
fi

echo
echo "[2/4] Stopping the stack (volumes are preserved)..."
docker compose -f compose.yaml --profile observability down

echo
echo "[3/4] Starting the stack..."
"${COMPOSE[@]}" up -d

echo
echo "[4/4] Container status:"
"${COMPOSE[@]}" ps -a

echo
echo "Update complete."
echo "  Dashboard  http://127.0.0.1:${DASHBOARD_PORT}  (tenant default, admin@garrison, GARRISON_ADMIN_PASSWORD from .env)"
echo "  REST, A2A  http://127.0.0.1:${REST_PORT}"
echo "  MCP        http://127.0.0.1:${MCP_PORT}/mcp"
if [ "${OBSERVABILITY}" = "1" ]; then
  echo "  Grafana    http://127.0.0.1:${GRAFANA_PORT}  (admin, GARRISON_GRAFANA_PASSWORD from .env)"
  echo "  Prometheus http://127.0.0.1:${PROMETHEUS_PORT}"
fi
echo "The garrison-bootstrap container is meant to exit with code 0 once it has created the sample agents."
