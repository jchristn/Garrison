#!/usr/bin/env bash
# =============================================================================
#  reset.sh - reset the Garrison Docker stack to factory defaults.
#
#  DESTRUCTIVE: removes the containers and every named volume (the Postgres
#  database with all agents, runs, secrets, and users, the worker
#  workspaces, and the observability data: Prometheus, Loki, Tempo, Grafana,
#  and Alloy), then rebuilds the images and starts a fresh stack that seeds
#  tenant default, admin@garrison, and the sample agents again. Keys,
#  passwords, and seeded credentials missing from docker/.env are generated
#  with random values (env-secrets.sh --fresh); values already there are kept.
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

echo "[1/3] Stopping containers and removing volumes (including observability data)..."
# The observability profile is named so its containers and volumes are removed too.
# compose.yaml requires the keys and passwords even to stop the stack; removing it needs none of them, so placeholders
# stand in for any that .env lacks (the shell environment wins over .env, and these values reach no container).
PLACEHOLDERS=()
for name in GARRISON_DB_PASSWORD GARRISON_MASTER_KEY GARRISON_AUTH_SIGNING_KEY GARRISON_ADMIN_API_KEY GARRISON_ADMIN_PASSWORD \
            GARRISON_DEFAULT_ACCESS_KEY GARRISON_DEFAULT_SECRET_KEY GARRISON_NODE_ACCESS_KEY GARRISON_NODE_SECRET_KEY \
            GARRISON_GRAFANA_PASSWORD; do
  PLACEHOLDERS+=("${name}=unused-during-reset")
done
env "${PLACEHOLDERS[@]}" docker compose -f compose.yaml --profile observability down -v --remove-orphans

# The volumes are gone, so every missing key and password can be generated (SR-08).
"${DOCKER_DIR}/env-secrets.sh" --fresh

if [ "${START}" = "0" ]; then
  echo
  echo "Factory reset complete. Start the stack with: ${DOCKER_DIR}/update.sh (add --observability for Grafana and friends)"
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
echo "Factory reset complete. Dashboard: http://127.0.0.1:${GARRISON_DASHBOARD_PORT:-8080}  (tenant default, admin@garrison, GARRISON_ADMIN_PASSWORD from docker/.env)"
