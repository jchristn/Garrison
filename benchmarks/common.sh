#!/usr/bin/env bash
# Shared settings and helpers for the benchmark scripts (benchmarks/*.sh). Sourced, not executed. Bash 3.2 safe.
#
# Port block 37xxx, all on 127.0.0.1 (see README.md, "Ports"):
#   k3d stack (stack-up.sh):         REST 37870, MCP 37871, Kubernetes API 37443, cluster garrison-bench
#   local stack (start-bench-server): REST 37800, MCP 37801, Prometheus 37464, worker health 37811+, worker metrics 37821+
# Environment:
#   BENCH_STACK (k3d)      which stack bench.sh, run-baseline.sh, and ci-gate.sh talk to: k3d or local
#   NO_BUILD (0)           1 reuses the last Release build in benchmarks/.run/build
#   LOCAL_ALPHA_WORKERS (1), LOCAL_BETA_WORKERS (1), WORKER_SLOTS (4)   local stack sizes
set -euo pipefail

BENCH_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${BENCH_DIR}/.." && pwd)"
RUN_DIR="${BENCH_DIR}/.run"
BUILD_DIR="${RUN_DIR}/build"
LOCAL_DIR="${RUN_DIR}/local"

CLUSTER_NAME="garrison-bench"
CONTEXT="k3d-${CLUSTER_NAME}"
KUBECONFIG_FILE="${RUN_DIR}/kubeconfig"
IMAGE_TAG="bench-local"
K3D_URL="http://127.0.0.1:37870"

LOCAL_REST_PORT=37800
LOCAL_URL="http://127.0.0.1:${LOCAL_REST_PORT}"
LOCAL_HEALTH_BASE=37810
LOCAL_METRICS_BASE=37820
ADMIN_KEY="garrison-benchmark-admin-key-not-for-production"

HARNESS_DLL="${BUILD_DIR}/bin/Test.Benchmark/release_net10.0/Garrison.Benchmark.dll"
SERVER_DLL="${BUILD_DIR}/bin/Garrison.Server/release_net10.0/Garrison.Server.dll"
WORKER_DLL="${BUILD_DIR}/bin/Garrison.Worker/release_net10.0/Garrison.Worker.dll"
FAKE_DLL="${BUILD_DIR}/bin/Garrison.FakeHarness/release_net10.0/garrison-fake-harness.dll"

log() { printf '[bench %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }
fail() { printf '[bench] error: %s\n' "$*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || fail "$1 is required but was not found on PATH"; }

# kubectl against the bench cluster only; never the default kubeconfig or another cluster.
kc() { kubectl --kubeconfig "${KUBECONFIG_FILE}" --context "${CONTEXT}" "$@"; }
kcn() { kc -n garrison "$@"; }

# Builds the given projects (under src/) in Release into benchmarks/.run/build, unless NO_BUILD=1.
build_projects() {
  [ "${NO_BUILD:-0}" = "1" ] && return 0
  need dotnet
  mkdir -p "${RUN_DIR}"
  for project in "$@"; do
    log "building ${project} (Release)"
    dotnet build "${REPO_DIR}/src/${project}" -c Release -f net10.0 --artifacts-path "${BUILD_DIR}" -v quiet -nologo > "${RUN_DIR}/build-${project}.log" 2>&1 \
      || { tail -30 "${RUN_DIR}/build-${project}.log"; fail "build of ${project} failed (log: ${RUN_DIR}/build-${project}.log)"; }
  done
}

build_harness() {
  build_projects Test.Benchmark Garrison.FakeHarness
  [ -f "${HARNESS_DLL}" ] || fail "no harness build at ${HARNESS_DLL}; run without NO_BUILD=1"
}

harness() { dotnet "${HARNESS_DLL}" "$@"; }

# Options that point a measuring command at the selected stack (BENCH_STACK).
stack_args() {
  if [ "${BENCH_STACK:-k3d}" = "local" ]; then
    printf '%s\n' --url "${LOCAL_URL}" --stack local --fake-harness "${FAKE_DLL}" \
      --stack-details "local processes from the working tree: 1 server (Sqlite), ${LOCAL_ALPHA_WORKERS:-1} alpha + ${LOCAL_BETA_WORKERS:-1} beta workers x ${WORKER_SLOTS:-4} slots"
  else
    printf '%s\n' --url "${K3D_URL}" --stack k3d --kubeconfig "${KUBECONFIG_FILE}" --context "${CONTEXT}" --fake-harness "${FAKE_DLL}" \
      --stack-details "k3d ${CLUSTER_NAME} (rancher/k3s:v1.31.4-k3s1, 3 GB node): $(kcn get deployment garrison-server -o jsonpath='{.spec.replicas}' 2>/dev/null || echo '?') server(s) on PostgreSQL 17, $(kcn get statefulset garrison-worker -o jsonpath='{.spec.replicas}' 2>/dev/null || echo '?') alpha + $(kcn get statefulset garrison-worker-beta -o jsonpath='{.spec.replicas}' 2>/dev/null || echo '?') beta workers x 4 slots"
  fi
}

# Runs a measuring harness command against the selected stack: run_measure <command> [options...]
run_measure() {
  local command="$1"; shift
  local args=()
  while IFS= read -r line; do args+=("${line}"); done < <(stack_args)
  harness "${command}" "${args[@]}" "$@"
}
