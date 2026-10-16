#!/usr/bin/env bash
# One-factor timing ablation on a private local SQLite benchmark stack. Never touches the Compose or scale stacks.
# Duration/warmup are configurable for quick smoke checks. Every arm creates a fresh stack and reports its exact settings.
source "$(dirname "$0")/common.sh"
need dotnet
need curl
need python3
# A seed randomizes each repeated round reproducibly. Without a seed, the legacy fixed order is retained.
mkdir -p "${RUN_DIR}"
manifest="${TIMING_MANIFEST:-${RUN_DIR}/timing-sweep-$(date -u +%Y%m%d-%H%M%S).json}"
schedule="${manifest%.json}.tsv"
python3 "${BENCH_DIR}/timing-schedule.py" plan --manifest "${manifest}" --schedule "${schedule}" \
  --repeat "${TIMING_REPEAT:-1}" --seed "${TIMING_RANDOM_SEED:-}" \
  --duration "${TIMING_DURATION_SECONDS:-20}" --warmup "${TIMING_WARMUP_SECONDS:-5}" --concurrency "${TIMING_CONCURRENCY:-16}"
log "timing schedule and provenance: ${manifest}"
if [ "${TIMING_PLAN_ONLY:-0}" = "1" ]; then cat "${schedule}"; exit 0; fi
if curl -fs "${LOCAL_URL}/v1.0/api/health" >/dev/null 2>&1; then
  fail "the local benchmark port is in use; stop its owner before running the timing sweep"
fi
build_projects Garrison.Server Garrison.Worker Garrison.FakeHarness Test.Benchmark
python3 "${BENCH_DIR}/timing-schedule.py" binaries --manifest "${manifest}" --build-dir "${BUILD_DIR}"
export NO_BUILD=1
running=0
cleanup() {
  if [ "${running}" = "1" ]; then "${BENCH_DIR}/stop-bench-server.sh"; running=0; fi
}
trap cleanup EXIT INT TERM
# name / lease long poll (server and worker) / worker event flush / server event poll
while IFS=$'\t' read -r trial order label lease flush poll report_label; do
  python3 "${BENCH_DIR}/timing-schedule.py" snapshot --manifest "${manifest}" --trial "${trial}" --order "${order}" --phase before
  log "timing trial ${trial}, order ${order}: ${label}, seed ${TIMING_RANDOM_SEED:-fixed}"
  stream_label="timing-stream-${report_label#timing-}"
  export BENCH_LEASE_WAIT_MS="${lease}" BENCH_EVENT_FLUSH_MS="${flush}"
  running=1
  "${BENCH_DIR}/start-bench-server.sh"
  body="$(python3 - "${lease}" "${poll}" <<'PY'
import json, sys
print(json.dumps({'values': [{'path': 'Scheduling.LeaseWaitMs', 'value': sys.argv[1]}, {'path': 'Scheduling.EventPollMs', 'value': sys.argv[2]}]}))
PY
)"
  curl --fail --silent --show-error -X PUT "${LOCAL_URL}/v1.0/api/settings" -H "x-api-key: ${ADMIN_KEY}" -H 'Content-Type: application/json' --data "${body}" > "${LOCAL_DIR}/timing-settings.json"
  harness load --url "${LOCAL_URL}" --admin-key "${ADMIN_KEY}" --stack local \
    --stack-details "timing ablation ${label}; trial=${trial}, order=${order}, seed=${TIMING_RANDOM_SEED:-fixed}; SQLite; LeaseWaitMs=${lease}, EventFlushIntervalMs=${flush}, EventPollMs=${poll}; ${LOCAL_ALPHA_WORKERS:-1} alpha + ${LOCAL_BETA_WORKERS:-1} beta workers x ${WORKER_SLOTS:-4} slots" \
    --mode closed --concurrency "${TIMING_CONCURRENCY:-16}" --warmup-seconds "${TIMING_WARMUP_SECONDS:-5}" --duration-seconds "${TIMING_DURATION_SECONDS:-20}" \
    --results-dir "${TIMING_RESULTS_DIR:-${BENCH_DIR}/results}" --label "${report_label}" "$@"
  # The load arm has no event subscriber. A short streaming arm isolates EventPollMs effects on delivery latency.
  if [ "${TIMING_STREAM_PROBES:-1}" = "1" ]; then
    harness e2e --url "${LOCAL_URL}" --admin-key "${ADMIN_KEY}" --stack local \
      --stack-details "stream timing ${label}; trial=${trial}, order=${order}, seed=${TIMING_RANDOM_SEED:-fixed}; LeaseWaitMs=${lease}, EventFlushIntervalMs=${flush}, EventPollMs=${poll}" \
      --direct false --stream true --repeat "${TIMING_STREAM_REPEAT:-2}" --warmup 0 --limit "${TIMING_STREAM_LIMIT:-8}" --results-dir "${TIMING_RESULTS_DIR:-${BENCH_DIR}/results}" --label "${stream_label}"
  fi
  cleanup
  python3 "${BENCH_DIR}/timing-schedule.py" snapshot --manifest "${manifest}" --trial "${trial}" --order "${order}" --phase after --results-dir "${TIMING_RESULTS_DIR:-${BENCH_DIR}/results}"
done < "${schedule}"
