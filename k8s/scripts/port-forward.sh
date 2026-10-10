#!/usr/bin/env bash
# Forwards the server (REST 8700, MCP 8701) and the dashboard (8080) to 127.0.0.1. Ctrl+C stops both.
# When a local port is taken, pick others: REST_PORT=9700 MCP_PORT=9701 DASHBOARD_PORT=9080 k8s/scripts/port-forward.sh
source "$(dirname "$0")/common.sh"
need kubectl
REST_PORT="${REST_PORT:-8700}"
MCP_PORT="${MCP_PORT:-8701}"
DASHBOARD_PORT="${DASHBOARD_PORT:-8080}"

for port in "${REST_PORT}" "${MCP_PORT}" "${DASHBOARD_PORT}"; do
  if (exec 3<>"/dev/tcp/127.0.0.1/${port}") 2>/dev/null; then
    fail "127.0.0.1:${port} is already in use; choose free ports with REST_PORT, MCP_PORT, and DASHBOARD_PORT"
  fi
done

kubectl -n "${GARRISON_NAMESPACE}" port-forward --address 127.0.0.1 svc/garrison-server "${REST_PORT}:8700" "${MCP_PORT}:8701" &
SERVER_PID=$!
kubectl -n "${GARRISON_NAMESPACE}" port-forward --address 127.0.0.1 svc/garrison-dashboard "${DASHBOARD_PORT}:80" &
DASHBOARD_PID=$!
trap 'kill ${SERVER_PID} ${DASHBOARD_PID} 2>/dev/null' EXIT INT TERM
log "REST http://127.0.0.1:${REST_PORT}  MCP http://127.0.0.1:${MCP_PORT}/mcp  dashboard http://127.0.0.1:${DASHBOARD_PORT}"
wait
