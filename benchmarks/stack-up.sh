#!/usr/bin/env bash
# Brings up the isolated benchmark stack: K3S in Docker (k3d cluster garrison-bench from k3d/cluster.yaml, ports
# 37870/37871/37443 on 127.0.0.1, its own kubeconfig in benchmarks/.run/kubeconfig), Garrison images built from the
# working tree (tag bench-local), and the benchmark overlay (k8s/): one server on PostgreSQL 17, two alpha workers, and
# one beta worker. It never reads or changes your default kubeconfig or any other cluster.
#
#   benchmarks/stack-up.sh                 # create (or reuse) the cluster, build images, deploy, wait
#   BUILD=0 benchmarks/stack-up.sh         # reuse existing bench-local images
#   SERVERS=2 ALPHA_WORKERS=3 benchmarks/stack-up.sh
#   benchmarks/stack-down.sh               # delete the cluster (the full reset)
source "$(dirname "$0")/common.sh"
need k3d
need docker
need kubectl
mkdir -p "${RUN_DIR}"
build_harness

if k3d cluster list "${CLUSTER_NAME}" >/dev/null 2>&1; then
  log "k3d cluster ${CLUSTER_NAME} exists; reusing it"
else
  log "creating k3d cluster ${CLUSTER_NAME}"
  k3d cluster create --config "${BENCH_DIR}/k3d/cluster.yaml"
fi
k3d kubeconfig get "${CLUSTER_NAME}" > "${KUBECONFIG_FILE}"
chmod 600 "${KUBECONFIG_FILE}"

if [ "${BUILD:-1}" = "1" ]; then
  log "building jchristn77/garrison-server:${IMAGE_TAG} and jchristn77/garrison-worker:${IMAGE_TAG} from the working tree"
  docker build -q -t "jchristn77/garrison-server:${IMAGE_TAG}" -f "${REPO_DIR}/src/Garrison.Server/Dockerfile" "${REPO_DIR}" >/dev/null
  docker build -q -t "jchristn77/garrison-worker:${IMAGE_TAG}" -f "${REPO_DIR}/src/Garrison.Worker/Dockerfile" "${REPO_DIR}" >/dev/null
fi
for image in garrison-server garrison-worker; do
  docker image inspect "jchristn77/${image}:${IMAGE_TAG}" >/dev/null 2>&1 || fail "image jchristn77/${image}:${IMAGE_TAG} not found; run with BUILD=1"
  log "importing jchristn77/${image}:${IMAGE_TAG}"
  k3d image import -c "${CLUSTER_NAME}" "jchristn77/${image}:${IMAGE_TAG}" >/dev/null
done
# Third-party images pinned by the shipped base: stream this platform into the node (k3d image import skips
# multi-platform images whose other platforms Docker never downloaded). Anything missing is pulled by the cluster.
platform="linux/$(docker version --format '{{.Server.Arch}}')"
for image in postgres:17 busybox:1.36 curlimages/curl:8.10.1; do
  docker image inspect "${image}" >/dev/null 2>&1 || { log "${image} not in Docker; the cluster will pull it"; continue; }
  for node in $(docker ps -q --filter "label=k3d.cluster=${CLUSTER_NAME}"); do
    docker save --platform "${platform}" "${image}" | docker exec -i "${node}" ctr -n k8s.io images import - >/dev/null 2>&1 \
      && log "imported ${image}" || log "could not import ${image}; the cluster will pull it"
  done
done

log "deploying the benchmark overlay"
kc apply -k "${BENCH_DIR}/k8s" >/dev/null
[ -n "${SERVERS:-}" ] && kcn scale deployment/garrison-server --replicas "${SERVERS}" >/dev/null
[ -n "${ALPHA_WORKERS:-}" ] && kcn scale statefulset/garrison-worker --replicas "${ALPHA_WORKERS}" >/dev/null
# Same tag, new image: restart so every pod runs what was just imported.
if [ "${BUILD:-1}" = "1" ]; then
  kcn rollout restart deployment/garrison-server statefulset/garrison-worker statefulset/garrison-worker-beta >/dev/null 2>&1 || true
fi
kcn rollout status statefulset/garrison-postgres --timeout=300s
kcn rollout status deployment/garrison-server --timeout=600s
kcn rollout status statefulset/garrison-worker --timeout=600s
kcn rollout status statefulset/garrison-worker-beta --timeout=600s

expected=$(( $(kcn get statefulset garrison-worker -o jsonpath='{.spec.replicas}') + $(kcn get statefulset garrison-worker-beta -o jsonpath='{.spec.replicas}') ))
harness wait --url "${K3D_URL}" --admin-key "${ADMIN_KEY}" --nodes "${expected}" --timeout-seconds 300 || fail "not every worker became Ready"
kcn get pods -o wide
log "bench stack ready at ${K3D_URL}; kubectl --kubeconfig ${KUBECONFIG_FILE} --context ${CONTEXT} -n garrison get pods"
