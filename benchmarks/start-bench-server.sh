#!/usr/bin/env bash
# Starts the local benchmark stack from the working tree: Garrison.Server (Release, Sqlite) and worker processes on
# two lanes (alpha and beta), with only the fake harness on their PATH. Everything lives under benchmarks/.run/local,
# which is wiped on every start, and the committed bench settings (config/garrison-bench.json) are copied in fresh each
# time so the server never runs on settings it wrote itself. This is the stack ci-gate uses; for scale and resilience
# use the k3d stack (stack-up.sh).
#
#   benchmarks/start-bench-server.sh                      # 1 alpha + 1 beta worker, 4 slots each
#   LOCAL_ALPHA_WORKERS=2 WORKER_SLOTS=8 benchmarks/start-bench-server.sh
#   benchmarks/stop-bench-server.sh
source "$(dirname "$0")/common.sh"
need dotnet
need curl

if curl -fs "${LOCAL_URL}/v1.0/api/health" >/dev/null 2>&1; then
  fail "something already answers on ${LOCAL_URL}; run benchmarks/stop-bench-server.sh first"
fi
build_projects Garrison.Server Garrison.Worker Garrison.FakeHarness Test.Benchmark
[ -f "${SERVER_DLL}" ] && [ -f "${WORKER_DLL}" ] && [ -f "${FAKE_DLL}" ] || fail "missing build output under ${BUILD_DIR}"

DOTNET="$(command -v dotnet)"
rm -rf "${LOCAL_DIR}"
mkdir -p "${LOCAL_DIR}/server" "${LOCAL_DIR}/bin"
cp "${BENCH_DIR}/config/garrison-bench.json" "${LOCAL_DIR}/server/garrison.json"

# The fake harness is the only harness the workers can find: PATH is this bin directory plus the system directories.
cat > "${LOCAL_DIR}/bin/garrison-fake-harness" <<WRAP
#!/bin/sh
exec "${DOTNET}" "${FAKE_DLL}" "\$@"
WRAP
chmod +x "${LOCAL_DIR}/bin/garrison-fake-harness"

log "starting the server on ${LOCAL_URL}"
(cd "${LOCAL_DIR}/server" && GARRISON_SETTINGS_FILE="${LOCAL_DIR}/server/garrison.json" GARRISON_ADMIN_API_KEY="${ADMIN_KEY}" \
  exec "${DOTNET}" "${SERVER_DLL}" > "${LOCAL_DIR}/server.log" 2>&1) &
echo $! > "${LOCAL_DIR}/pids"
harness wait --url "${LOCAL_URL}" --admin-key "${ADMIN_KEY}" --nodes 0 --timeout-seconds 90 >/dev/null || { tail -40 "${LOCAL_DIR}/server.log"; fail "the server did not become ready"; }

start_worker() {
  local lane="$1" n="$2" index="$3"
  local name="bench-${lane}-${n}" dir="${LOCAL_DIR}/worker-${lane}-${n}"
  mkdir -p "${dir}"
  # Timing experiments use a private settings file instead of changing worker production defaults.
  printf '{"EventFlushIntervalMs":%s,"LeaseWaitMs":%s}\n' "${BENCH_EVENT_FLUSH_MS:-250}" "${BENCH_LEASE_WAIT_MS:-20000}" > "${dir}/garrison-worker.json"
  (cd "${dir}" && PATH="${LOCAL_DIR}/bin:/usr/bin:/bin" HOME="${dir}" \
    GARRISON_WORKER_SERVER_URL="${LOCAL_URL}" GARRISON_WORKER_NODE_NAME="${name}" \
    GARRISON_WORKER_LABELS="garrison.io/pool=default,bench.garrison.io/lane=${lane}" \
    GARRISON_WORKER_HEALTH_PORT="$((LOCAL_HEALTH_BASE + index))" GARRISON_WORKER_PROMETHEUS_PORT="$((LOCAL_METRICS_BASE + index))" \
    GARRISON_WORKER_WORK_ROOT="${dir}/workspaces" GARRISON_WORKER_MAX_CONCURRENT_RUNS="${WORKER_SLOTS:-4}" \
    exec "${DOTNET}" "${WORKER_DLL}" > "${LOCAL_DIR}/worker-${lane}-${n}.log" 2>&1) &
  echo $! >> "${LOCAL_DIR}/pids"
}
index=1
for ((n=1; n<=${LOCAL_ALPHA_WORKERS:-1}; n++)); do start_worker alpha "${n}" "${index}"; index=$((index + 1)); done
for ((n=1; n<=${LOCAL_BETA_WORKERS:-1}; n++)); do start_worker beta "${n}" "${index}"; index=$((index + 1)); done
expected=$((index - 1))

harness wait --url "${LOCAL_URL}" --admin-key "${ADMIN_KEY}" --nodes "${expected}" --timeout-seconds 120 || { tail -20 "${LOCAL_DIR}"/worker-*.log; fail "not every worker became Ready"; }
log "local stack ready: ${LOCAL_URL}, ${expected} workers (logs in ${LOCAL_DIR}); stop with benchmarks/stop-bench-server.sh"
