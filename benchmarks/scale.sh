#!/usr/bin/env bash
# Control plane load to failure (P14.15): starts the scale stack (scale-up.sh), runs the scale command for one or more
# tiers, writes each report to benchmarks/results (JSON and Markdown), and tears the stack down again.
#
#   benchmarks/scale.sh smoke        # 1 server, 2 workers x 16 slots, 100 runs at 20/s; about 2 minutes
#   benchmarks/scale.sh 1k           # 3 servers, 10 workers x 32 slots, 1,000 runs per level, 25 to 400 runs/s
#   benchmarks/scale.sh 10k          # same stack, 10,000 runs per level, 50 to 400 runs/s
#   benchmarks/scale.sh all          # 1k then 10k on one stack
#   SCALE_RATES=50,100 benchmarks/scale.sh 1k --plateau-ratio 0.8   # extra options go to the scale command
#
# Environment: everything scale-up.sh reads (SCALE_SERVERS, SCALE_WORKERS, SCALE_SLOTS, SCALE_DB_POOL, ...), plus
#   SCALE_KEEP_STACK (0)   1 leaves the stack running afterwards (stop it with benchmarks/scale-down.sh)
#   SCALE_REUSE (0)        1 uses a stack that is already up instead of starting one
#   SCALE_DURATION_MS (1000), SCALE_EVENTS_PER_SECOND (20)   the fake run: events per second for this many ms
#   SCALE_RUNS, SCALE_RATES   runs per level and the comma-separated offered rates, instead of the tier defaults
source "$(dirname "$0")/common.sh"
tier="${1:-}"
[ $# -gt 0 ] && shift
case "${tier}" in
  smoke)
    : "${SCALE_SERVERS:=1}" "${SCALE_WORKERS:=2}" "${SCALE_SLOTS:=16}"
    tiers="smoke" ;;
  1k|10k|all)
    : "${SCALE_SERVERS:=3}" "${SCALE_WORKERS:=10}" "${SCALE_SLOTS:=32}"
    if [ "${tier}" = "all" ]; then tiers="1k 10k"; else tiers="${tier}"; fi ;;
  *)
    fail "usage: benchmarks/scale.sh smoke|1k|10k|all [scale command options]" ;;
esac
export SCALE_SERVERS SCALE_WORKERS SCALE_SLOTS
DURATION_MS="${SCALE_DURATION_MS:-1000}"
EVENTS_PER_SECOND="${SCALE_EVENTS_PER_SECOND:-20}"

teardown() {
  if [ "${SCALE_KEEP_STACK:-0}" != "1" ] && [ "${SCALE_REUSE:-0}" != "1" ]; then "${BENCH_DIR}/scale-down.sh" || true; fi
}
if [ "${SCALE_REUSE:-0}" = "1" ]; then
  build_harness
else
  trap teardown EXIT
  "${BENCH_DIR}/scale-up.sh"
fi

urls="$(scale_urls "${SCALE_SERVERS}")"
first="${urls%%,*}"
details="scale stack from the working tree: ${SCALE_SERVERS} servers on PostgreSQL 17 (Docker, pool ${SCALE_DB_POOL:-50} per server), ${SCALE_WORKERS} workers x ${SCALE_SLOTS} slots, fake harness ${EVENTS_PER_SECOND} events/s for ${DURATION_MS} ms, worker event merging ${SCALE_EVENT_COALESCE:-0}"
status=0
for t in ${tiers}; do
  case "${t}" in
    smoke) runs="${SCALE_RUNS:-100}"; rates="${SCALE_RATES:-20}" ;;
    1k) runs="${SCALE_RUNS:-1000}"; rates="${SCALE_RATES:-25,50,100,200,300,400}" ;;
    10k) runs="${SCALE_RUNS:-10000}"; rates="${SCALE_RATES:-50,100,200,300,400}" ;;
  esac
  log "tier ${t}: ${runs} runs per level at ${rates} runs/s"
  harness scale --url "${first}" --urls "${urls}" --stack scale --stack-details "${details}" \
    --tier "${SCALE_SERVERS}x${SCALE_WORKERS}-${t}" --label "scale-${t}" \
    --runs "${runs}" --rates "${rates}" --duration-ms "${DURATION_MS}" --events-per-second "${EVENTS_PER_SECOND}" "$@" || status=$?
done
exit "${status}"
