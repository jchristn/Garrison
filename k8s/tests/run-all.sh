#!/usr/bin/env bash
# Runs the whole Phase 10 scale suite: cluster, deploy, load test (P10.13), rolling upgrade (P10.8), and chaos
# (P10.14), then deletes the cluster unless KEEP_CLUSTER=1. Sizes and options as in common.sh and each script.
#
#   k8s/tests/run-all.sh                                         # laptop defaults: 3 servers, 4 workers, 300 runs
#   SERVERS=3 WORKERS=10 RUNS=1000 NODE_MEMORY=12g AGENTS=2 k8s/tests/run-all.sh   # the plan's full size
#
# Exit code: 0 when all three tests passed, otherwise 1. Results under k8s/tests/results.
source "$(dirname "$0")/common.sh"

"${TEST_DIR}/cluster-up.sh"
"${TEST_DIR}/deploy.sh"

results=()
overall=0
for test in loadtest rolling-upgrade-test chaos-test; do
  log "== ${test}"
  if "${TEST_DIR}/${test}.sh"; then results+=("${test}: PASS"); else results+=("${test}: FAIL"); overall=1; fi
done

[ "${KEEP_CLUSTER:-0}" = "1" ] || "${TEST_DIR}/cluster-down.sh"
log "== summary"
for r in "${results[@]}"; do log "  ${r}"; done
log "per-run CSVs and summary.csv in ${RESULTS_DIR}"
exit "${overall}"
