#!/usr/bin/env bash
# Creates a throwaway k3d cluster for the scale tests and imports the Garrison images into it.
#
#   k8s/tests/cluster-up.sh                 # import the existing jchristn77/garrison-*:v0.2.0 images
#   BUILD=1 k8s/tests/cluster-up.sh         # build the images from this checkout first (tag scaletest-local)
#
# The cluster is sized not to disturb anything else running in Docker:
#   - its kubeconfig goes to k8s/tests/.work/kubeconfig; your default kubeconfig and current context are untouched
#   - the node container is capped at NODE_MEMORY (default 4g) so it cannot starve other containers (for example a
#     running garrison-k3s cluster); lower it if Docker has less to spare, raise it for the full 3/10/1000 test
#   - Traefik, ServiceLB, and metrics-server are disabled; the server is reached through NodePort 30870 mapped to
#     127.0.0.1:${HTTP_PORT} (18870), which kube-proxy balances across server replicas
#   - API server on 127.0.0.1:${API_PORT} (6560); change API_PORT or HTTP_PORT if they collide
#
# Environment (see common.sh for the rest): NODE_MEMORY (4g), AGENTS (0), BUILD (0), IMAGE_TAG, and IMAGES (the Garrison
# images to build and import; default "garrison-server garrison-worker garrison-dashboard").
# Running it again on an existing cluster only refreshes the kubeconfig and re-imports images.
if [ "${BUILD:-0}" = "1" ] && [ -z "${IMAGE_TAG:-}" ]; then IMAGE_TAG="scaletest-local"; fi
source "$(dirname "$0")/common.sh"
need k3d
need docker
need kubectl

NODE_MEMORY="${NODE_MEMORY:-4g}"
IMAGES="${IMAGES:-garrison-server garrison-worker garrison-dashboard}"
mkdir -p "${WORK_DIR}"

if k3d cluster list "${CLUSTER_NAME}" >/dev/null 2>&1; then
  log "k3d cluster ${CLUSTER_NAME} exists; reusing it"
else
  log "creating k3d cluster ${CLUSTER_NAME} (${K3S_IMAGE}, node memory ${NODE_MEMORY}, ${AGENTS} agent node(s))"
  agent_args=()
  if [ "${AGENTS}" != "0" ]; then agent_args=(--agents "${AGENTS}" --agents-memory "${NODE_MEMORY}"); fi
  k3d cluster create "${CLUSTER_NAME}" \
    --image "${K3S_IMAGE}" \
    --servers 1 --servers-memory "${NODE_MEMORY}" \
    ${agent_args[@]+"${agent_args[@]}"} \
    --api-port "127.0.0.1:${API_PORT}" \
    --no-lb \
    -p "127.0.0.1:${HTTP_PORT}:30870@server:0:direct" \
    --k3s-arg "--disable=traefik@server:*" \
    --k3s-arg "--disable=servicelb@server:*" \
    --k3s-arg "--disable=metrics-server@server:*" \
    --kubeconfig-update-default=false \
    --kubeconfig-switch-context=false \
    --wait --timeout 300s
fi

k3d kubeconfig get "${CLUSTER_NAME}" > "${KUBECONFIG_FILE}"
chmod 600 "${KUBECONFIG_FILE}"
kc get nodes

if [ "${BUILD:-0}" = "1" ]; then
  log "building ${IMAGES} with tag ${IMAGE_TAG} (the worker image takes a while and about 2 GB)"
  for image in ${IMAGES}; do
    case "${image}" in
      garrison-server) docker build -t "jchristn77/garrison-server:${IMAGE_TAG}" -f "${REPO_DIR}/src/Garrison.Server/Dockerfile" "${REPO_DIR}" ;;
      garrison-worker) docker build -t "jchristn77/garrison-worker:${IMAGE_TAG}" -f "${REPO_DIR}/src/Garrison.Worker/Dockerfile" "${REPO_DIR}" ;;
      garrison-dashboard) docker build -t "jchristn77/garrison-dashboard:${IMAGE_TAG}" "${REPO_DIR}/dashboard" ;;
      *) fail "unknown image ${image} in IMAGES" ;;
    esac
  done
fi

for image in ${IMAGES}; do
  docker image inspect "jchristn77/${image}:${IMAGE_TAG}" >/dev/null 2>&1 \
    || fail "image jchristn77/${image}:${IMAGE_TAG} not found locally; build it (BUILD=1) or set IMAGE_TAG"
  log "importing jchristn77/${image}:${IMAGE_TAG}"
  k3d image import -c "${CLUSTER_NAME}" "jchristn77/${image}:${IMAGE_TAG}" >/dev/null
done

# Third-party images: stream only this platform into each node's containerd (k3d image import skips multi-platform
# images whose other platforms Docker never downloaded). Anything missing is pulled by the cluster.
platform="linux/$(docker version --format '{{.Server.Arch}}')"
for image in postgres:17 busybox:1.36 curlimages/curl:8.10.1; do
  docker image inspect "${image}" >/dev/null 2>&1 || { log "${image} not in Docker; the cluster will pull it"; continue; }
  for node in $(docker ps -q --filter "label=k3d.cluster=${CLUSTER_NAME}"); do
    docker save --platform "${platform}" "${image}" | docker exec -i "${node}" ctr -n k8s.io images import - >/dev/null 2>&1 \
      && log "imported ${image} into ${node}" || log "could not import ${image}; the cluster will pull it"
  done
done

echo "${IMAGE_TAG}" > "${WORK_DIR}/image-tag"
log "cluster ready. kubectl: kubectl --kubeconfig ${KUBECONFIG_FILE} get pods -A"
log "next: k8s/tests/deploy.sh"
