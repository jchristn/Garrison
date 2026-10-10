#!/usr/bin/env bash
# P10.13 load test: starts RUNS concurrent fake-harness runs against the scale-test cluster and records claim latency
# (queued to leased), run time, throughput, and failures. Passes only when every run Succeeded.
#
#   k8s/tests/loadtest.sh                         # RUNS=300, RUN_MS=3000
#   RUNS=1000 TIMEOUT_SECONDS=1800 k8s/tests/loadtest.sh
#
# Results: k8s/tests/results/<time>-load-<servers>x<workers>x<runs>-runs.csv (one row per run), the .log, and one
# row appended to k8s/tests/results/summary.csv. With RUNS above the cluster's slots (WORKERS x WORKER_CONCURRENCY),
# claim latency mostly measures the backlog; for scheduler overhead alone, run with RUNS at or below the slot count.
source "$(dirname "$0")/common.sh"
need dotnet
require_cluster

label="load-$(deployed_sizes)"
start_loadgen "${label}" --require-success
code=0
wait_loadgen || code=$?
if [ "${code}" != "0" ]; then
  collect_diagnostics "${RESULT_PREFIX}-diagnostics"
  log "FAIL (exit ${code}); diagnostics in ${RESULT_PREFIX}-diagnostics"
fi
exit "${code}"
