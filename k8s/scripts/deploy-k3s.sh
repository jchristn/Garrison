#!/usr/bin/env bash
# Deploys Garrison to the current kubectl context (K3S on a host, or K3S running in Docker).
#
# K3S in Docker (no host install needed):
#   docker run -d --name garrison-k3s --privileged -p 6443:6443 -p 8080:80 rancher/k3s:v1.31.4-k3s1 server
#   docker cp garrison-k3s:/etc/rancher/k3s/k3s.yaml ./k3s.yaml && export KUBECONFIG=$PWD/k3s.yaml
#   K3S_CONTAINER=garrison-k3s k8s/scripts/deploy-k3s.sh --build
#
# Options:
#   --build   build images locally with docker and import them into K3S
#             (into the container named by K3S_CONTAINER, or into a host K3S with sudo k3s ctr)
source "$(dirname "$0")/common.sh"
need kubectl

BUILD=0
[ "${1:-}" = "--build" ] && BUILD=1

import_image() {
  local image="$1"
  if [ -n "${K3S_CONTAINER:-}" ]; then
    docker save "${image}" | docker exec -i "${K3S_CONTAINER}" ctr images import - >/dev/null
  else
    docker save "${image}" | sudo k3s ctr images import - >/dev/null
  fi
  log "imported ${image}"
}

if [ "${BUILD}" = "1" ]; then
  need docker
  log "building images (tag ${GARRISON_TAG})"
  docker build -t "jchristn77/garrison-server:${GARRISON_TAG}" -f "${REPO_DIR}/src/Garrison.Server/Dockerfile" "${REPO_DIR}"
  docker build -t "jchristn77/garrison-worker:${GARRISON_TAG}" -f "${REPO_DIR}/src/Garrison.Worker/Dockerfile" "${REPO_DIR}"
  docker build -t "jchristn77/garrison-dashboard:${GARRISON_TAG}" "${REPO_DIR}/dashboard"
  for image in garrison-server garrison-worker garrison-dashboard; do import_image "jchristn77/${image}:${GARRISON_TAG}"; done
fi

"${SCRIPT_DIR}/generate-secrets.sh"
kubectl apply -k "${K8S_DIR}/overlays/k3s"
wait_for_rollout

log "add '127.0.0.1 garrison.local' (or your K3S node IP) to /etc/hosts, then open http://garrison.local"
log "when K3S runs in Docker with -p 8080:80, use http://garrison.local:8080"
