#!/usr/bin/env bash
# The standard suite, one round: validate, ingest and the end-to-end command on every committed dataset, routing, load
# with the direct-invocation floor (closed loop) and open loop, and on the k3d stack also the scale-out sweep and the
# resilience scenarios. Reports go to benchmarks/results with the round label; the scale-out and open-loop load runs
# get -scale and -open suffixes. Further arguments are forwarded to every measuring command (do not repeat options the
# script sets). Exits with the worst exit code of the commands (3 when any run was incomplete).
#
#   benchmarks/run-baseline.sh round1
#   benchmarks/run-baseline.sh round1 --shared-note "garrison-k3s running alongside"
#   BENCH_STACK=local benchmarks/run-baseline.sh local1
#   DURATION=30 RATES=20,40,60 benchmarks/run-baseline.sh round2
# Environment: BENCH_STACK (k3d), DURATION (20 s per load level), WARMUP (5 s), CONCURRENCY (1,4,8,16), RATES (20,40,60,80),
# SCALE_WORKERS (1,2,3), REPEAT (3 repeats of each end-to-end probe).
source "$(dirname "$0")/common.sh"
[ $# -ge 1 ] || fail "usage: benchmarks/run-baseline.sh <round label> [options forwarded to every command]"
LABEL="$1"; shift
build_harness

worst=0
step() {
  local code=0
  log "== $*"
  "$@" || code=$?
  if [ "${code}" = "3" ]; then worst=3; elif [ "${code}" != "0" ] && [ "${worst}" != "3" ]; then worst="${code}"; fi
}

step harness validate
for dataset in synthetic-fleet garrison-live; do
  step run_measure ingest --dataset "benchmarks/datasets/${dataset}.json" --label "${LABEL}" "$@"
done
step run_measure routing --dataset benchmarks/datasets/synthetic-fleet.json --label "${LABEL}" "$@"
for dataset in synthetic-fleet garrison-live; do
  step run_measure e2e --dataset "benchmarks/datasets/${dataset}.json" --repeat "${REPEAT:-3}" --label "${LABEL}" "$@"
done
step run_measure load --arms garrison,direct --concurrency "${CONCURRENCY:-1,4,8,16}" --duration-seconds "${DURATION:-20}" --warmup-seconds "${WARMUP:-5}" --label "${LABEL}" "$@"
step run_measure load --mode open --rates "${RATES:-20,40,60,80}" --duration-seconds "${DURATION:-20}" --warmup-seconds "${WARMUP:-5}" --label "${LABEL}-open" "$@"
if [ "${BENCH_STACK:-k3d}" = "k3d" ]; then
  alpha="$(kcn get statefulset garrison-worker -o jsonpath='{.spec.replicas}')"
  step run_measure load --scale-workers "${SCALE_WORKERS:-1,2,3}" --concurrency 24 --delay-ms 100 --duration-seconds "${DURATION:-20}" --warmup-seconds "${WARMUP:-5}" --label "${LABEL}-scale" "$@"
  kcn scale statefulset/garrison-worker --replicas "${alpha}" >/dev/null
  step run_measure resilience --label "${LABEL}" "$@"
fi
log "round ${LABEL} finished (worst exit code ${worst}); reports in benchmarks/results"
exit "${worst}"
