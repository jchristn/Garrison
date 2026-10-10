#!/usr/bin/env bash
# Forwards the server (REST 8700, MCP 8701) and the dashboard (8080) to 127.0.0.1. When the observability stack is
# deployed (k3s-observability, minikube-observability, or Helm observability.enabled), it also forwards Grafana
# (3000), Prometheus (9090), Loki (3100), and Tempo (3200). Ctrl+C stops them all.
# When a local port is taken, pick others: REST_PORT=9700 MCP_PORT=9701 DASHBOARD_PORT=9080 GRAFANA_PORT=3001
# PROMETHEUS_PORT=9091 LOKI_PORT=3101 TEMPO_PORT=3201 k8s/scripts/port-forward.sh
# The server's GARRISON_GRAFANA_URL and related settings assume the default ports; change them (overlay or Settings
# page) if you change these.
source "$(dirname "$0")/common.sh"
need kubectl
REST_PORT="${REST_PORT:-8700}"
MCP_PORT="${MCP_PORT:-8701}"
DASHBOARD_PORT="${DASHBOARD_PORT:-8080}"
GRAFANA_PORT="${GRAFANA_PORT:-3000}"
PROMETHEUS_PORT="${PROMETHEUS_PORT:-9090}"
LOKI_PORT="${LOKI_PORT:-3100}"
TEMPO_PORT="${TEMPO_PORT:-3200}"

OBSERVABILITY_PRESENT=0
kubectl -n "${GARRISON_NAMESPACE}" get service garrison-grafana >/dev/null 2>&1 && OBSERVABILITY_PRESENT=1

PORTS="${REST_PORT} ${MCP_PORT} ${DASHBOARD_PORT}"
[ "${OBSERVABILITY_PRESENT}" = "1" ] && PORTS="${PORTS} ${GRAFANA_PORT} ${PROMETHEUS_PORT} ${LOKI_PORT} ${TEMPO_PORT}"
for port in ${PORTS}; do
  if (exec 3<>"/dev/tcp/127.0.0.1/${port}") 2>/dev/null; then
    fail "127.0.0.1:${port} is already in use; choose free ports with REST_PORT, MCP_PORT, DASHBOARD_PORT, GRAFANA_PORT, PROMETHEUS_PORT, LOKI_PORT, and TEMPO_PORT"
  fi
done

PIDS=""
forward() {
  kubectl -n "${GARRISON_NAMESPACE}" port-forward --address 127.0.0.1 "$@" &
  PIDS="${PIDS} $!"
}
trap 'kill ${PIDS} 2>/dev/null' EXIT INT TERM

forward svc/garrison-server "${REST_PORT}:8700" "${MCP_PORT}:8701"
forward svc/garrison-dashboard "${DASHBOARD_PORT}:80"
log "REST http://127.0.0.1:${REST_PORT}  MCP http://127.0.0.1:${MCP_PORT}/mcp  dashboard http://127.0.0.1:${DASHBOARD_PORT}"
if [ "${OBSERVABILITY_PRESENT}" = "1" ]; then
  forward svc/garrison-grafana "${GRAFANA_PORT}:3000"
  forward svc/garrison-prometheus "${PROMETHEUS_PORT}:9090"
  forward svc/garrison-loki "${LOKI_PORT}:3100"
  forward svc/garrison-tempo "${TEMPO_PORT}:3200"
  log "Grafana http://127.0.0.1:${GRAFANA_PORT} (admin)  Prometheus http://127.0.0.1:${PROMETHEUS_PORT}  Loki http://127.0.0.1:${LOKI_PORT}  Tempo http://127.0.0.1:${TEMPO_PORT}"
fi
wait
