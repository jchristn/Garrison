#!/usr/bin/env bash
# Starts the scale stack (P14.15) from the working tree: PostgreSQL 17 in Docker (its own container, port, and volume),
# then SCALE_SERVERS Garrison.Server replicas and SCALE_WORKERS worker processes on this machine from the Release build,
# all against that PostgreSQL. Workers spread round robin across the servers, each with SCALE_SLOTS slots and only the
# fake harness on their PATH. The database starts empty on every run (the volume is recreated) unless SCALE_KEEP_DB=1.
# Everything else lives under benchmarks/.run/scale, which is wiped on every start.
#
#   benchmarks/scale-up.sh                                   # 3 servers, 10 workers x 32 slots
#   SCALE_SERVERS=1 SCALE_WORKERS=2 SCALE_SLOTS=16 benchmarks/scale-up.sh
#   benchmarks/scale-down.sh
#
# Environment (defaults in parentheses):
#   SCALE_SERVERS (3, 1 to 9)   SCALE_WORKERS (10, 1 to 29)   SCALE_SLOTS (32, 1 to 256 per worker)
#   SCALE_DB_POOL (50)          connection pool per server; PostgreSQL max_connections is servers x pool + 40
#   SCALE_PG_MEMORY (3g)        Docker memory limit of the PostgreSQL container (the Docker VM has 8 GB)
#   SCALE_PG_SHARED_BUFFERS (768MB)
#   SCALE_EVENT_COALESCE (0)    worker text-event merging (GARRISON_WORKER_EVENT_TEXT_COALESCE_MAX_CHARS); 0 stores
#                               every paced event, 2048 is the product default
#   SCALE_KEEP_DB (0)           1 keeps the existing database volume
source "$(dirname "$0")/common.sh"
need dotnet
need curl
need docker

SERVERS="${SCALE_SERVERS:-3}"
WORKERS="${SCALE_WORKERS:-10}"
SLOTS="${SCALE_SLOTS:-32}"
POOL="${SCALE_DB_POOL:-50}"
[ "${SERVERS}" -ge 1 ] && [ "${SERVERS}" -le 9 ] || fail "SCALE_SERVERS must be 1 to 9"
[ "${WORKERS}" -ge 1 ] && [ "${WORKERS}" -le 29 ] || fail "SCALE_WORKERS must be 1 to 29"
[ "${SLOTS}" -ge 1 ] && [ "${SLOTS}" -le 256 ] || fail "SCALE_SLOTS must be 1 to 256"
MAX_CONNECTIONS=$((SERVERS * POOL + 40))

for n in $(seq 1 "${SERVERS}"); do
  if curl -fs "http://127.0.0.1:$((SCALE_REST_BASE + n))/v1.0/api/health" >/dev/null 2>&1; then
    fail "something already answers on port $((SCALE_REST_BASE + n)); run benchmarks/scale-down.sh first"
  fi
done
build_projects Garrison.Server Garrison.Worker Garrison.FakeHarness Test.Benchmark
[ -f "${SERVER_DLL}" ] && [ -f "${WORKER_DLL}" ] && [ -f "${FAKE_DLL}" ] || fail "missing build output under ${BUILD_DIR}"

DOTNET="$(command -v dotnet)"
rm -rf "${SCALE_DIR}"
mkdir -p "${SCALE_DIR}/bin"

# PostgreSQL 17, sized for the 8 GB Docker VM and enough connections for every server's pool plus headroom.
docker rm -f "${SCALE_PG_CONTAINER}" >/dev/null 2>&1 || true
if [ "${SCALE_KEEP_DB:-0}" != "1" ]; then docker volume rm "${SCALE_PG_VOLUME}" >/dev/null 2>&1 || true; fi
log "starting ${SCALE_PG_IMAGE} as ${SCALE_PG_CONTAINER} on 127.0.0.1:${SCALE_PG_PORT} (max_connections ${MAX_CONNECTIONS})"
docker run -d --name "${SCALE_PG_CONTAINER}" \
  --memory "${SCALE_PG_MEMORY:-3g}" --shm-size 1g \
  -p "127.0.0.1:${SCALE_PG_PORT}:5432" \
  -v "${SCALE_PG_VOLUME}:/var/lib/postgresql/data" \
  -e POSTGRES_USER=garrison -e POSTGRES_PASSWORD="${SCALE_PG_PASSWORD}" -e POSTGRES_DB=garrison \
  "${SCALE_PG_IMAGE}" \
  -c max_connections="${MAX_CONNECTIONS}" \
  -c shared_buffers="${SCALE_PG_SHARED_BUFFERS:-768MB}" \
  -c effective_cache_size=2GB \
  -c work_mem=4MB \
  -c maintenance_work_mem=128MB \
  -c wal_buffers=16MB \
  -c max_wal_size=4GB \
  -c checkpoint_timeout=15min > "${SCALE_DIR}/postgres.id"
for _ in $(seq 1 60); do
  if docker exec "${SCALE_PG_CONTAINER}" pg_isready -U garrison -d garrison >/dev/null 2>&1; then break; fi
  sleep 1
done
docker exec "${SCALE_PG_CONTAINER}" pg_isready -U garrison -d garrison >/dev/null 2>&1 || { docker logs --tail 40 "${SCALE_PG_CONTAINER}"; fail "PostgreSQL did not become ready"; }

# The fake harness is the only harness the workers can find: PATH is this bin directory plus the system directories.
cat > "${SCALE_DIR}/bin/garrison-fake-harness" <<WRAP
#!/bin/sh
exec "${DOTNET}" "${FAKE_DLL}" "\$@"
WRAP
chmod +x "${SCALE_DIR}/bin/garrison-fake-harness"
: > "${SCALE_DIR}/pids"

start_server() {
  local n="$1" dir="${SCALE_DIR}/server-$1"
  mkdir -p "${dir}"
  cat > "${dir}/garrison.json" <<JSON
{
  "Rest": { "Hostname": "127.0.0.1", "Port": $((SCALE_REST_BASE + n)), "LivenessPort": $((SCALE_LIVENESS_BASE + n)) },
  "Mcp": { "Hostname": "127.0.0.1", "Port": $((SCALE_MCP_BASE + n)) },
  "Database": { "Type": "Postgresql", "Host": "127.0.0.1", "Port": ${SCALE_PG_PORT}, "DatabaseName": "garrison", "Username": "garrison", "Password": "${SCALE_PG_PASSWORD}", "MaxPoolSize": ${POOL} },
  "Auth": { "AdminApiKey": "${ADMIN_KEY}" },
  "Logging": { "ConsoleLogging": true, "MinimumSeverity": 2 },
  "Telemetry": { "Enabled": true, "ServeMetricsOnServicePort": true, "PrometheusHostname": "127.0.0.1", "PrometheusPort": $((SCALE_PROMETHEUS_BASE + n)), "OtlpEnable": false },
  "Cluster": { "ExpectedReplicas": ${SERVERS} }
}
JSON
  (cd "${dir}" && GARRISON_SETTINGS_FILE="${dir}/garrison.json" GARRISON_ADMIN_API_KEY="${ADMIN_KEY}" GARRISON_NODE_ID="scale-server-${n}" \
    exec "${DOTNET}" "${SERVER_DLL}" > "${SCALE_DIR}/server-${n}.log" 2>&1) &
  echo $! >> "${SCALE_DIR}/pids"
}

# The first server creates the schema; the others start once it answers.
log "starting server 1 of ${SERVERS} on http://127.0.0.1:$((SCALE_REST_BASE + 1))"
start_server 1
harness wait --url "http://127.0.0.1:$((SCALE_REST_BASE + 1))" --admin-key "${ADMIN_KEY}" --nodes 0 --timeout-seconds 120 >/dev/null || { tail -40 "${SCALE_DIR}/server-1.log"; fail "server 1 did not become ready"; }
# (seq 2 1 counts down on macOS, so the remaining servers are counted with a while loop.)
n=2
while [ "${n}" -le "${SERVERS}" ]; do log "starting server ${n} of ${SERVERS}"; start_server "${n}"; n=$((n + 1)); done
n=2
while [ "${n}" -le "${SERVERS}" ]; do
  harness wait --url "http://127.0.0.1:$((SCALE_REST_BASE + n))" --admin-key "${ADMIN_KEY}" --nodes 0 --timeout-seconds 120 >/dev/null || { tail -40 "${SCALE_DIR}/server-${n}.log"; fail "server ${n} did not become ready"; }
  n=$((n + 1))
done

start_worker() {
  local n="$1" dir="${SCALE_DIR}/worker-$1"
  local server=$(( (n - 1) % SERVERS + 1 ))
  mkdir -p "${dir}"
  # Timing experiments use a private settings file instead of changing worker production defaults.
  printf '{"EventFlushIntervalMs":%s,"LeaseWaitMs":%s}\n' "${BENCH_EVENT_FLUSH_MS:-250}" "${BENCH_LEASE_WAIT_MS:-20000}" > "${dir}/garrison-worker.json"
  (cd "${dir}" && PATH="${SCALE_DIR}/bin:/usr/bin:/bin" HOME="${dir}" \
    GARRISON_WORKER_SERVER_URL="http://127.0.0.1:$((SCALE_REST_BASE + server))" GARRISON_WORKER_NODE_NAME="scale-worker-${n}" \
    GARRISON_WORKER_LABELS="garrison.io/pool=default,bench.garrison.io/lane=scale" \
    GARRISON_WORKER_HEALTH_PORT="$((SCALE_HEALTH_BASE + n))" GARRISON_WORKER_PROMETHEUS_PORT="$((SCALE_METRICS_BASE + n))" \
    GARRISON_WORKER_WORK_ROOT="${dir}/workspaces" GARRISON_WORKER_MAX_CONCURRENT_RUNS="${SLOTS}" \
    GARRISON_WORKER_EVENT_TEXT_COALESCE_MAX_CHARS="${SCALE_EVENT_COALESCE:-0}" \
    exec "${DOTNET}" "${WORKER_DLL}" > "${SCALE_DIR}/worker-${n}.log" 2>&1) &
  echo $! >> "${SCALE_DIR}/pids"
}
for n in $(seq 1 "${WORKERS}"); do start_worker "${n}"; done

harness wait --url "http://127.0.0.1:$((SCALE_REST_BASE + 1))" --admin-key "${ADMIN_KEY}" --nodes "${WORKERS}" --timeout-seconds 180 || { tail -20 "${SCALE_DIR}"/worker-*.log; fail "not every worker became Ready"; }
cat > "${SCALE_DIR}/stack.env" <<ENV
SCALE_STACK_SERVERS=${SERVERS}
SCALE_STACK_WORKERS=${WORKERS}
SCALE_STACK_SLOTS=${SLOTS}
SCALE_STACK_POOL=${POOL}
SCALE_STACK_MAX_CONNECTIONS=${MAX_CONNECTIONS}
SCALE_STACK_COALESCE=${SCALE_EVENT_COALESCE:-0}
ENV
log "scale stack ready: ${SERVERS} servers ($(scale_urls "${SERVERS}")), ${WORKERS} workers x ${SLOTS} slots, PostgreSQL on 127.0.0.1:${SCALE_PG_PORT}; logs in ${SCALE_DIR}; stop with benchmarks/scale-down.sh"
