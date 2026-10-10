#!/usr/bin/env bash
# =============================================================================
#  reset.sh - reset the Garrison Docker stack to factory defaults.
#
#  DESTRUCTIVE: removes the containers and every named volume (the Postgres
#  database with all agents, runs, secrets, and users, and the worker
#  workspaces), then rebuilds the images and starts a fresh stack that seeds
#  tenant default, admin@garrison / password, and the sample agents again.
#
#  Usage:   ./reset.sh             reset, rebuild, and start
#           ./reset.sh --no-start  reset only; start later with update.sh
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
START=1
[ "${1:-}" = "--no-start" ] && START=0

echo
echo "=========================================================="
echo "  Garrison - Reset to Factory Defaults"
echo "=========================================================="
echo
echo "WARNING: This is DESTRUCTIVE. The Garrison containers and all Docker volumes"
echo "(the database with every agent, run, secret, and user, and the worker"
echo "workspaces) will be deleted."
echo
printf "Type 'RESET' to confirm: "
read -r CONFIRM
echo

if [ "${CONFIRM}" != "RESET" ]; then
  echo "Aborted. No changes were made."
  exit 1
fi

cd "${DOCKER_DIR}"

echo "[1/3] Stopping containers and removing volumes..."
docker compose down -v --remove-orphans

if [ "${START}" = "0" ]; then
  echo
  echo "Factory reset complete. Start the stack with: ${DOCKER_DIR}/update.sh"
  exit 0
fi

echo
echo "[2/3] Building images and starting a fresh stack..."
docker compose build
docker compose up -d

echo
echo "[3/3] Container status:"
docker compose ps -a

echo
echo "Factory reset complete. Dashboard: http://127.0.0.1:${GARRISON_DASHBOARD_PORT:-8080}  (tenant default, admin@garrison, password)"
