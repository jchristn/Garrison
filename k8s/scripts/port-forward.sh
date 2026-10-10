#!/usr/bin/env bash
# Forwards the server (8700 REST, 8701 MCP) and the dashboard (8080) to 127.0.0.1. Ctrl+C stops both.
source "$(dirname "$0")/common.sh"
need kubectl
DASHBOARD_PORT="${DASHBOARD_PORT:-8080}"

kubectl -n "${GARRISON_NAMESPACE}" port-forward --address 127.0.0.1 svc/garrison-server 8700:8700 8701:8701 &
SERVER_PID=$!
kubectl -n "${GARRISON_NAMESPACE}" port-forward --address 127.0.0.1 svc/garrison-dashboard "${DASHBOARD_PORT}:80" &
DASHBOARD_PID=$!
trap 'kill ${SERVER_PID} ${DASHBOARD_PID} 2>/dev/null' EXIT INT TERM
log "REST http://127.0.0.1:8700  MCP http://127.0.0.1:8701/mcp  dashboard http://127.0.0.1:${DASHBOARD_PORT}"
wait
