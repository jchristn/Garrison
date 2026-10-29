#!/usr/bin/env bash
# Shared settings and helpers for the Phase 10 scale tests (k8s/tests). Sourced, not executed.
#
# Every kubectl and helm call in these scripts goes through the test cluster's own kubeconfig
# ($WORK_DIR/kubeconfig) and context, so other clusters (for example a running garrison-k3s) and your default
# kubeconfig are never read or changed.
#
# Sizes (defaults fit a laptop whose Docker VM has about 8 GB shared with other containers; the plan's full test is
# SERVERS=3 WORKERS=10 RUNS=1000, see docs/SCALING.md):
#   SERVERS (3)              control-plane replicas (Postgresql)
#   WORKERS (4)              worker replicas, fake harness only
#   WORKER_CONCURRENCY (4)   GARRISON_WORKER_MAX_CONCURRENT_RUNS per worker
#   RUNS (300)               runs the load generator starts at once
#   RUN_MS (3000)            approximate run time of each fake-harness run
#   TIMEOUT_SECONDS (900)    wait for every run to finish after the last submit; afterwards a run counts as stuck
# Cluster:
#   CLUSTER_NAME (garrison-scale), K3S_IMAGE (rancher/k3s:v1.31.4-k3s1), AGENTS (0 extra k3d agent nodes),
#   API_PORT (6560), HTTP_PORT (18870, the server's NodePort 30870 on 127.0.0.1)
#   IMAGE_TAG: tag of the jchristn77/garrison-* images (default: what cluster-up.sh imported, else v0.2.0)
#   WORK_DIR (k8s/tests/.work), RESULTS_DIR (k8s/tests/results)
# Another cluster: KUBECONFIG_FILE, CONTEXT, and BASE_URL (how this machine reaches the server's REST port) override
# the k3d defaults for deploy.sh and the tests; cluster-up.sh and cluster-down.sh only manage k3d.
set -euo pipefail

TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$(cd "${TEST_DIR}/.." && pwd)"
REPO_DIR="$(cd "${K8S_DIR}/.." && pwd)"

CLUSTER_NAME="${CLUSTER_NAME:-garrison-scale}"
K3S_IMAGE="${K3S_IMAGE:-rancher/k3s:v1.31.4-k3s1}"
AGENTS="${AGENTS:-0}"
API_PORT="${API_PORT:-6560}"
HTTP_PORT="${HTTP_PORT:-18870}"
NAMESPACE="garrison"

SERVERS="${SERVERS:-3}"
WORKERS="${WORKERS:-4}"
WORKER_CONCURRENCY="${WORKER_CONCURRENCY:-4}"
RUNS="${RUNS:-300}"
RUN_MS="${RUN_MS:-3000}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-900}"

WORK_DIR="${WORK_DIR:-${TEST_DIR}/.work}"
RESULTS_DIR="${RESULTS_DIR:-${TEST_DIR}/results}"
KUBECONFIG_FILE="${KUBECONFIG_FILE:-${WORK_DIR}/kubeconfig}"
# The tag cluster-up.sh imported, unless IMAGE_TAG is set.
IMAGE_TAG="${IMAGE_TAG:-$(cat "${WORK_DIR}/image-tag" 2>/dev/null || echo v0.2.0)}"
CONTEXT="${CONTEXT:-k3d-${CLUSTER_NAME}}"
BASE_URL="${BASE_URL:-http://127.0.0.1:${HTTP_PORT}}"

log() { printf '[scale-test %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }
fail() { printf '[scale-test] error: %s\n' "$*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || fail "$1 is required but was not found on PATH"; }

# kubectl against the test cluster only.
kc() { kubectl --kubeconfig "${KUBECONFIG_FILE}" --context "${CONTEXT}" "$@"; }
kcn() { kc -n "${NAMESPACE}" "$@"; }

require_cluster() {
  [ -f "${KUBECONFIG_FILE}" ] || fail "no test cluster kubeconfig at ${KUBECONFIG_FILE}; run k8s/tests/cluster-up.sh first"
  kc get nodes >/dev/null 2>&1 || fail "test cluster ${CLUSTER_NAME} is not reachable; run k8s/tests/cluster-up.sh"
}

admin_key() {
  kcn get secret garrison-secrets -o jsonpath='{.data.admin-api-key}' | base64 -d
}

# Builds the load generator once into WORK_DIR and runs it with the given arguments.
run_loadgen() {
  local out="${WORK_DIR}/loadgen-build"
  local dll="${out}/bin/Garrison.LoadGen/release_net10.0/garrison-loadgen.dll"
  mkdir -p "${WORK_DIR}"
  if [ ! -f "${dll}" ] || [ -n "$(find "${TEST_DIR}/loadgen" "${REPO_DIR}/sdk/csharp/Garrison.Sdk" -name '*.cs' -newer "${dll}" 2>/dev/null | head -n 1)" ]; then
    log "building the load generator"
    dotnet build "${TEST_DIR}/loadgen" -c Release -f net10.0 --artifacts-path "${out}" -v quiet -nologo >"${WORK_DIR}/loadgen-build.log" 2>&1 \
      || { tail -30 "${WORK_DIR}/loadgen-build.log"; fail "load generator build failed"; }
  fi
  dotnet "${dll}" "$@"
}

# Names of the Running server or worker pods.
server_pods() { kcn get pods -l app.kubernetes.io/name=garrison-server --field-selector=status.phase=Running -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}'; }
worker_pods() { kcn get pods -l app.kubernetes.io/name=garrison-worker --field-selector=status.phase=Running -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}'; }

# Snapshot of pods and recent server and worker logs into a results directory.
collect_diagnostics() {
  local dir="$1"
  mkdir -p "${dir}"
  kcn get pods -o wide > "${dir}/pods.txt" 2>&1 || true
  kcn get events --sort-by=.lastTimestamp > "${dir}/events.txt" 2>&1 || true
  for pod in $(kcn get pods -l 'app.kubernetes.io/name in (garrison-server,garrison-worker)' -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' 2>/dev/null); do
    kcn logs "${pod}" --tail=2000 > "${dir}/${pod}.log" 2>&1 || true
    kcn logs "${pod}" --previous --tail=2000 > "${dir}/${pod}.previous.log" 2>/dev/null || rm -f "${dir}/${pod}.previous.log"
  done
}

# Deployed sizes, for labels.
deployed_sizes() {
  local servers workers
  servers="$(kcn get deployment garrison-server -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "?")"
  workers="$(kcn get statefulset garrison-worker -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "?")"
  printf '%sx%sx%s' "${servers}" "${workers}" "${RUNS}"
}

# Starts the load generator in the background against the test cluster. Sets LOADGEN_PID and LOADGEN_LOG.
#   start_loadgen <label> [extra loadgen args...]
start_loadgen() {
  local label="$1"; shift
  local stamp; stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  mkdir -p "${RESULTS_DIR}"
  RESULT_PREFIX="${RESULTS_DIR}/${stamp}-${label}"
  LOADGEN_LOG="${RESULT_PREFIX}.log"
  # Build in the foreground so the background process starts runs right away.
  run_loadgen --help >/dev/null
  GARRISON_ADMIN_API_KEY="$(admin_key)" run_loadgen \
    --url "${BASE_URL}" --runs "${RUNS}" --run-ms "${RUN_MS}" --timeout-seconds "${TIMEOUT_SECONDS}" \
    --label "${label}" --csv "${RESULT_PREFIX}-runs.csv" --summary "${RESULTS_DIR}/summary.csv" "$@" \
    > "${LOADGEN_LOG}" 2>&1 &
  LOADGEN_PID=$!
  log "load generator started (pid ${LOADGEN_PID}); log ${LOADGEN_LOG}"
}

# Waits for the background load generator, prints its report, and returns its exit code.
wait_loadgen() {
  local code=0
  wait "${LOADGEN_PID}" || code=$?
  sed -n '/^== /,$p' "${LOADGEN_LOG}"
  return "${code}"
}

# Waits until the load generator has created at least <n> runs (reads its progress lines), or it exits.
wait_for_created() {
  local n="$1"
  while kill -0 "${LOADGEN_PID}" 2>/dev/null; do
    if grep -Eq "created ([0-9]+)" "${LOADGEN_LOG}" 2>/dev/null; then
      local created; created="$(grep -Eo 'created [0-9]+' "${LOADGEN_LOG}" | tail -n 1 | awk '{print $2}')"
      [ "${created:-0}" -ge "${n}" ] && return 0
    fi
    sleep 1
  done
}
