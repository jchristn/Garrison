#!/usr/bin/env bash
# Deploys Garrison to minikube: starts minikube if needed, builds the three images into minikube's image store,
# generates secrets if missing, applies overlays/minikube, waits for rollout, and prints the URLs.
# OBSERVABILITY=1 applies overlays/minikube-observability instead (Prometheus, Loki, Tempo, Grafana, Alloy).
source "$(dirname "$0")/common.sh"
need minikube
need kubectl

if ! minikube status >/dev/null 2>&1; then
  log "starting minikube"
  minikube start --cpus="${MINIKUBE_CPUS:-4}" --memory="${MINIKUBE_MEMORY:-8g}"
fi

if [ "${SKIP_BUILD:-0}" != "1" ]; then
  log "building images into minikube (tag ${GARRISON_TAG})"
  (cd "${REPO_DIR}" && minikube image build -t "jchristn77/garrison-server:${GARRISON_TAG}" -f src/Garrison.Server/Dockerfile .)
  (cd "${REPO_DIR}" && minikube image build -t "jchristn77/garrison-worker:${GARRISON_TAG}" -f src/Garrison.Worker/Dockerfile .)
  (cd "${REPO_DIR}" && minikube image build -t "jchristn77/garrison-dashboard:${GARRISON_TAG}" -f dashboard/Dockerfile .)
fi

"${SCRIPT_DIR}/generate-secrets.sh"
OVERLAY="$(overlay_name minikube)"
log "applying overlays/${OVERLAY}"
kubectl apply -k "${K8S_DIR}/overlays/${OVERLAY}"
wait_for_rollout

IP="$(minikube ip)"
log "dashboard:  http://${IP}:30880"
log "REST API:   http://${IP}:30870"
log "MCP:        http://${IP}:30871/mcp"
if kubectl -n "${GARRISON_NAMESPACE}" get service garrison-grafana >/dev/null 2>&1; then
  log "Grafana:    http://${IP}:30300   Prometheus: http://${IP}:30909"
fi
log "sign in to tenant default as admin@garrison with GARRISON_ADMIN_PASSWORD (default: password)"
log "macOS and Windows with the Docker driver: the NodePort URLs above are not reachable; use k8s/scripts/port-forward.sh"
print_observability
