#!/usr/bin/env bash
# Deploys Garrison to the current kubectl context (K3S on a host, K3S running in Docker, or a k3d cluster).
#
# k3d (k3s in Docker, the usual way to run K3S on macOS and Windows; brew install k3d):
#   k3d cluster create garrison --api-port 127.0.0.1:6550 -p "127.0.0.1:8080:80@loadbalancer"
#   K3D_CLUSTER=garrison k8s/scripts/deploy-k3s.sh --build
#
# K3S in Docker (no host install needed; docs/KUBERNETES.md has the full recipe, including other ports):
#   docker run -d --name garrison-k3s --privileged -p 127.0.0.1:6443:6443 -p 127.0.0.1:8080:80 rancher/k3s:v1.31.4-k3s1 server
#   until docker exec garrison-k3s test -s /etc/rancher/k3s/k3s.yaml; do sleep 2; done
#   docker cp garrison-k3s:/etc/rancher/k3s/k3s.yaml ~/.kube/garrison-k3s.yaml && export KUBECONFIG=~/.kube/garrison-k3s.yaml
#   K3S_CONTAINER=garrison-k3s k8s/scripts/deploy-k3s.sh --build
#
# Options:
#   --build   build images locally with docker and import them into K3S: into the k3d cluster named by K3D_CLUSTER,
#             into the container named by K3S_CONTAINER, or into a host K3S with sudo k3s ctr
source "$(dirname "$0")/common.sh"
need kubectl

BUILD=0
[ "${1:-}" = "--build" ] && BUILD=1

import_image() {
  local image="$1"
  if [ -n "${K3D_CLUSTER:-}" ]; then
    k3d image import -c "${K3D_CLUSTER}" "${image}" >/dev/null
  elif [ -n "${K3S_CONTAINER:-}" ]; then
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
  # Third-party images the manifests use. Importing the ones Docker already has saves K3S from pulling them
  # (postgres:17 alone is about 160 MB); anything missing is pulled by K3S as usual.
  # Best effort: a pulled image can carry an index for platforms Docker never downloaded, so save only this one.
  platform="linux/$(docker version --format '{{.Server.Arch}}')"
  for image in postgres:17 busybox:1.36 curlimages/curl:8.10.1; do
    docker image inspect "${image}" >/dev/null 2>&1 || continue
    if [ -n "${K3D_CLUSTER:-}" ]; then
      k3d image import -c "${K3D_CLUSTER}" "${image}" >/dev/null 2>&1 \
        && log "imported ${image}" || log "could not import ${image}; K3S will pull it"
    elif [ -n "${K3S_CONTAINER:-}" ]; then
      docker save --platform "${platform}" "${image}" | docker exec -i "${K3S_CONTAINER}" ctr images import - >/dev/null 2>&1 \
        && log "imported ${image}" || log "could not import ${image}; K3S will pull it"
    else
      docker save --platform "${platform}" "${image}" | sudo k3s ctr images import - >/dev/null 2>&1 \
        && log "imported ${image}" || log "could not import ${image}; K3S will pull it"
    fi
  done
fi

"${SCRIPT_DIR}/generate-secrets.sh"
kubectl apply -k "${K8S_DIR}/overlays/k3s"
wait_for_rollout

log "sign in to tenant default as admin@garrison with GARRISON_ADMIN_PASSWORD (default: password)"
log "add '127.0.0.1 garrison.local' (or your K3S node IP) to /etc/hosts, then open http://garrison.local"
log "when K3S runs in Docker with -p 8080:80, use http://garrison.local:8080"
