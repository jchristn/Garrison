#!/usr/bin/env bash
# Runs the load generator against a throwaway local Garrison: one server (Sqlite) and WORKERS worker processes with
# the fake harness, started the same way scripts/run-sdk-harnesses.sh does. No Kubernetes and no Docker needed. Use it
# to check the load generator and the server's run path before spending time on a cluster.
#
#   k8s/tests/local-dry-run.sh                      # 2 workers, 40 runs of about 1 s
#   RUNS=100 WORKERS=3 RUN_MS=2000 k8s/tests/local-dry-run.sh
#
# Environment: RUNS (40), WORKERS (2), WORKER_CONCURRENCY (4), RUN_MS (1000), TIMEOUT_SECONDS (300),
# REST_PORT (18800), MCP_PORT (18801), HEALTH_PORT_BASE (18810), RESULTS_DIR (k8s/tests/results).
# ARTIFACTS (unset): reuse a previous build (the artifacts directory a prior run printed) instead of building.
# RESTART_SERVER_AFTER (unset): seconds after the load starts to stop the server (SIGTERM) and start it again, which
# exercises the load generator's retry path and the workers' reconnect path the way a one-replica rollout would.
# Exits with the load generator's code: 0 pass, 1 criteria not met, 2 setup error.
# Local defaults, read before common.sh applies the cluster-sized ones.
RUNS="${RUNS:-40}"
WORKERS="${WORKERS:-2}"
WORKER_CONCURRENCY="${WORKER_CONCURRENCY:-4}"
RUN_MS="${RUN_MS:-1000}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-300}"
source "$(dirname "$0")/common.sh"
REST_PORT="${REST_PORT:-18800}"
MCP_PORT="${MCP_PORT:-18801}"
HEALTH_PORT_BASE="${HEALTH_PORT_BASE:-18810}"
BASE_URL="http://127.0.0.1:${REST_PORT}"
ADMIN_KEY="garrisonadmin"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/garrison-dryrun-XXXXXX")"
ART="${ARTIFACTS:-$WORK/artifacts}"
PIDS=()

cleanup() {
  for pid in ${PIDS[@]+"${PIDS[@]}"}; do kill "$pid" 2>/dev/null || true; done
  sleep 1
  for pid in ${PIDS[@]+"${PIDS[@]}"}; do kill -9 "$pid" 2>/dev/null || true; done
}
trap cleanup EXIT

if [ -n "${ARTIFACTS:-}" ]; then
  [ -f "$ART/bin/Garrison.Server/debug_net10.0/Garrison.Server.dll" ] || fail "no server build under $ART"
  log "reusing the build in $ART"
else
  log "building server, worker, and fake harness into $ART"
  for project in Garrison.Server Garrison.Worker Garrison.FakeHarness; do
    dotnet build "$REPO_DIR/src/$project" -f net10.0 --artifacts-path "$ART" -v quiet -nologo > "$WORK/build-$project.log" 2>&1 \
      || { tail -30 "$WORK/build-$project.log"; fail "build of $project failed"; }
  done
fi

mkdir -p "$WORK/bin" "$WORK/server"
cat > "$WORK/bin/garrison-fake-harness" <<WRAP
#!/usr/bin/env bash
exec dotnet "$ART/bin/Garrison.FakeHarness/debug_net10.0/garrison-fake-harness.dll" "\$@"
WRAP
chmod +x "$WORK/bin/garrison-fake-harness"

cat > "$WORK/server/garrison.json" <<JSON
{
  "Rest": { "Hostname": "127.0.0.1", "Port": $REST_PORT },
  "Mcp": { "Hostname": "127.0.0.1", "Port": $MCP_PORT },
  "Database": { "Type": "Sqlite", "Filename": "$WORK/server/garrison.db" },
  "Logging": { "ConsoleLogging": true, "MinimumSeverity": 2 },
  "Telemetry": { "Enabled": false }
}
JSON

start_server() {
  (cd "$WORK/server" && GARRISON_SETTINGS_FILE="$WORK/server/garrison.json" GARRISON_TELEMETRY_ENABLE=false \
    exec dotnet "$ART/bin/Garrison.Server/debug_net10.0/Garrison.Server.dll" >> "$WORK/server.log" 2>&1) &
  SERVER_PID=$!
  PIDS+=($SERVER_PID)
}

curl -fs "$BASE_URL/v1.0/api/health" > /dev/null 2>&1 && fail "something already answers on $BASE_URL; stop it or set REST_PORT"
log "starting server on $BASE_URL"
start_server
for i in $(seq 1 60); do curl -fs "$BASE_URL/v1.0/api/health" > /dev/null 2>&1 && break; sleep 1; done
curl -fs "$BASE_URL/v1.0/api/health" > /dev/null || { tail -40 "$WORK/server.log"; fail "server did not become healthy"; }

for n in $(seq 1 "$WORKERS"); do
  mkdir -p "$WORK/worker-$n"
  (cd "$WORK/worker-$n" && PATH="$WORK/bin:$PATH" \
    GARRISON_WORKER_SERVER_URL="$BASE_URL" GARRISON_WORKER_NODE_NAME="dryrun-worker-$n" \
    GARRISON_WORKER_HEALTH_PORT="$((HEALTH_PORT_BASE + n))" GARRISON_WORKER_WORK_ROOT="$WORK/worker-$n/workspaces" \
    GARRISON_WORKER_MAX_CONCURRENT_RUNS="$WORKER_CONCURRENCY" GARRISON_WORKER_TELEMETRY_ENABLE=false \
    exec dotnet "$ART/bin/Garrison.Worker/debug_net10.0/Garrison.Worker.dll" > "$WORK/worker-$n.log" 2>&1) &
  PIDS+=($!)
done

for i in $(seq 1 90); do
  ready=$(curl -fs -H "x-api-key: $ADMIN_KEY" "$BASE_URL/v1.0/api/nodes?maxResults=100" 2>/dev/null | grep -o '"status":"Ready"' | wc -l | tr -d ' ' || true)
  [ "${ready:-0}" -ge "$WORKERS" ] && break
  sleep 1
done
[ "${ready:-0}" -ge "$WORKERS" ] || { tail -20 "$WORK"/worker-*.log; fail "only ${ready:-0} of $WORKERS workers registered"; }
log "server and $WORKERS workers ready (logs in $WORK)"

mkdir -p "$RESULTS_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
run_loadgen --help > /dev/null
set +e
GARRISON_ADMIN_API_KEY="$ADMIN_KEY" run_loadgen \
  --url "$BASE_URL" --runs "$RUNS" --run-ms "$RUN_MS" --timeout-seconds "$TIMEOUT_SECONDS" --poll-ms 1000 \
  --require-success --label "local-dryrun-1x${WORKERS}x${RUNS}${RESTART_SERVER_AFTER:+-restart}" \
  --csv "$RESULTS_DIR/local-dryrun-$STAMP-runs.csv" --summary "$RESULTS_DIR/summary.csv" &
LOADGEN_PID=$!
if [ -n "${RESTART_SERVER_AFTER:-}" ]; then
  sleep "$RESTART_SERVER_AFTER"
  log "stopping the server (SIGTERM)"
  kill "$SERVER_PID" 2>/dev/null; wait "$SERVER_PID" 2>/dev/null
  log "server stopped; starting it again"
  start_server
fi
wait "$LOADGEN_PID"
code=$?
set -e
[ "$code" = "0" ] || log "load generator exited $code; server and worker logs are in $WORK"
exit "$code"
