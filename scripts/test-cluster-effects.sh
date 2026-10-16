#!/usr/bin/env bash
# Owns a disposable cluster; never changes the default Kubernetes context.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export CLUSTER_NAME="${CLUSTER_NAME:-garrison-effect-ci-$$}"
export WORK_DIR="${WORK_DIR:-$(mktemp -d)}"
export KUBECONFIG_FILE="${WORK_DIR}/kubeconfig"
export CONTEXT="k3d-${CLUSTER_NAME}"
export API_PORT="${API_PORT:-46743}" HTTP_PORT="${HTTP_PORT:-48740}"
export NODE_MEMORY="${NODE_MEMORY:-3g}" IMAGES="${IMAGES:-garrison-server garrison-worker}"
export BUILD="${BUILD:-1}" IMAGE_TAG="${IMAGE_TAG:-effect-chaos-local}"
RESULTS="${RESULTS:-${ROOT}/k8s/tests/results/cluster-effects.json}"
SINK_PORT="${SINK_PORT:-48741}"
FIXTURE_IMAGE="garrison-effect-worker:${IMAGE_TAG}"
FORWARD_PID=""
cleanup() {
  status=$?
  if [ "$status" != 0 ]; then
    kubectl --kubeconfig "$KUBECONFIG_FILE" --context "$CONTEXT" -n garrison-effects get pods -o wide || true
    kubectl --kubeconfig "$KUBECONFIG_FILE" --context "$CONTEXT" -n garrison-effects logs deployment/garrison-server --tail=150 || true
  fi
  if [ -n "$FORWARD_PID" ]; then kill "$FORWARD_PID" 2>/dev/null || true; fi
  k3d cluster delete "$CLUSTER_NAME" >/dev/null 2>&1 || true
  exit "$status"
}
# Refuse to reuse a cluster: cleanup must own everything it removes.
if k3d cluster list "$CLUSTER_NAME" >/dev/null 2>&1; then echo "Cluster already exists: $CLUSTER_NAME" >&2; exit 1; fi
trap cleanup EXIT
docker image inspect postgres:17 >/dev/null 2>&1 || docker pull postgres:17
"${ROOT}/k8s/tests/cluster-up.sh"
docker build --build-arg "BASE_IMAGE=jchristn77/garrison-worker:${IMAGE_TAG}" -t "$FIXTURE_IMAGE" "${ROOT}/k8s/tests/effect-safety"
k3d image import -c "$CLUSTER_NAME" "$FIXTURE_IMAGE"
args=(--kubeconfig "$KUBECONFIG_FILE" --context "$CONTEXT" --url "http://127.0.0.1:${HTTP_PORT}" --sink-url "http://127.0.0.1:${SINK_PORT}")
python3 "${ROOT}/k8s/tests/effect-safety/run.py" "${args[@]}" --deploy-only --server-image "jchristn77/garrison-server:${IMAGE_TAG}" --worker-image "$FIXTURE_IMAGE"
kubectl --kubeconfig "$KUBECONFIG_FILE" --context "$CONTEXT" -n garrison-effects port-forward service/effect-sink "${SINK_PORT}:8080" >"${WORK_DIR}/sink-forward.log" 2>&1 &
FORWARD_PID=$!
if [ "${EFFECT_GATEWAY_ONLY:-0}" != 1 ]; then
  python3 "${ROOT}/k8s/tests/effect-safety/run.py" "${args[@]}" --results "$RESULTS"
fi
if [ "${RUN_GATEWAY_BENCHMARK:-0}" = 1 ]; then
  python3 "${ROOT}/k8s/tests/effect-safety/gateway.py" --url "http://127.0.0.1:${HTTP_PORT}" --results "${RESULTS%.json}-gateway.json"
fi
