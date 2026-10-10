#!/usr/bin/env bash
# Deploys Garrison to minikube: starts minikube if needed, builds the three images into minikube's image store,
# generates secrets if missing, applies overlays/minikube, waits for rollout, and prints the URLs.
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
  (cd "${REPO_DIR}/dashboard" && minikube image build -t "jchristn77/garrison-dashboard:${GARRISON_TAG}" .)
fi

"${SCRIPT_DIR}/generate-secrets.sh"
kubectl apply -k "${K8S_DIR}/overlays/minikube"
wait_for_rollout

IP="$(minikube ip)"
log "dashboard:  http://${IP}:30880"
log "REST API:   http://${IP}:30870"
log "MCP:        http://${IP}:30871/mcp"
log "login: admin@garrison.local with the password printed by generate-secrets (first run only)"
