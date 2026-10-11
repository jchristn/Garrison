#!/usr/bin/env bash
# The CI gate: starts the local stack from the working tree, runs the deterministic subset (validate, routing, e2e
# correctness with the direct arm, ingest correctness, on the synthetic and live datasets), compares every report with
# its committed baseline in benchmarks/baselines/, stops the stack, and exits with the gate's code (0 no regression,
# 1 regression or error, 3 incomplete). Latency is never compared here. Previous gate outputs are removed first.
#
#   benchmarks/ci-gate.sh                 # compare against benchmarks/baselines
#   benchmarks/ci-gate.sh --update        # write new baselines (a reviewed change; say why in the commit message)
source "$(dirname "$0")/common.sh"
"${BENCH_DIR}/start-bench-server.sh"
trap '"${BENCH_DIR}/stop-bench-server.sh"' EXIT
NO_BUILD=1 build_harness
code=0
harness ci-gate --url "${LOCAL_URL}" --stack local --fake-harness "${FAKE_DLL}" \
  --stack-details "local processes from the working tree: 1 server (Sqlite), ${LOCAL_ALPHA_WORKERS:-1} alpha + ${LOCAL_BETA_WORKERS:-1} beta workers x ${WORKER_SLOTS:-4} slots" "$@" || code=$?
if [ "${code}" != "0" ]; then
  log "ci-gate exited ${code}; server and worker logs are in ${LOCAL_DIR}"
  tail -20 "${LOCAL_DIR}/server.log" || true
fi
exit "${code}"
