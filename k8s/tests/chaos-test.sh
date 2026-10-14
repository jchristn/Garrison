#!/usr/bin/env bash
# P10.14 chaos test: deletes random server and worker pods while runs are in flight, and passes only when no run is
# stuck: every run ends Succeeded, or Failed with an outcome the retry policy allows (NodeLost or StaleLease after
# maxAttempts), within TIMEOUT_SECONDS of the last submission. No run creation may fail either.
#
#   k8s/tests/chaos-test.sh
#   CHAOS_INTERVAL=5 CHAOS_TARGETS=worker k8s/tests/chaos-test.sh
#
# Environment:
#   CHAOS_INTERVAL (15)      seconds between kills
#   CHAOS_DURATION (180)     seconds of chaos, starting when the first runs are created
#   CHAOS_TARGETS            server,worker (default both); one target kind is picked at random per kill
#   CHAOS_FORCE (1)          1: kill with --grace-period=0 --force (a crash: no drain, leases expire and runs are
#                            requeued); 0: normal delete (SIGTERM: servers shut down, workers drain)
#   MAX_ATTEMPTS (3)         deployment maxAttempts for the load-test agent (effectPolicy is AtLeastOnce)
#   RUN_MS defaults to 5000 here so kills land on running harnesses.
RUN_MS="${RUN_MS:-5000}"
source "$(dirname "$0")/common.sh"
need dotnet
require_cluster

CHAOS_INTERVAL="${CHAOS_INTERVAL:-15}"
CHAOS_DURATION="${CHAOS_DURATION:-180}"
CHAOS_TARGETS="${CHAOS_TARGETS:-server,worker}"
CHAOS_FORCE="${CHAOS_FORCE:-1}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-3}"

label="chaos-$(deployed_sizes)"
start_loadgen "${label}" --max-attempts "${MAX_ATTEMPTS}" --effect-policy AtLeastOnce
trap 'kill "${LOADGEN_PID}" 2>/dev/null || true' INT TERM
CHAOS_LOG="${RESULT_PREFIX}-chaos.log"

IFS=',' read -r -a targets <<< "${CHAOS_TARGETS}"
delete_args=(--wait=false)
[ "${CHAOS_FORCE}" = "1" ] && delete_args=(--grace-period=0 --force --wait=false)

wait_for_created 1
end=$(( $(date +%s) + CHAOS_DURATION ))
kills=0
while [ "$(date +%s)" -lt "${end}" ] && kill -0 "${LOADGEN_PID}" 2>/dev/null; do
  sleep "${CHAOS_INTERVAL}"
  kind="${targets[$((RANDOM % ${#targets[@]}))]}"
  if [ "${kind}" = "server" ]; then pods="$(server_pods)"; else pods="$(worker_pods)"; fi
  count=$(printf '%s\n' "${pods}" | grep -c . || true)
  if [ "${count}" = "0" ]; then log "no Running ${kind} pod to kill; skipping"; continue; fi
  pod="$(printf '%s\n' "${pods}" | sed -n "$(( RANDOM % count + 1 ))p")"
  log "killing ${kind} pod ${pod}" | tee -a "${CHAOS_LOG}"
  kcn delete pod "${pod}" "${delete_args[@]}" >/dev/null 2>&1 || log "delete of ${pod} failed"
  kills=$((kills + 1))
done
log "chaos over after ${kills} kill(s); waiting for the load generator" | tee -a "${CHAOS_LOG}"

code=0
wait_loadgen || code=$?
if [ "${code}" != "0" ]; then
  collect_diagnostics "${RESULT_PREFIX}-diagnostics"
  log "FAIL (exit ${code}); diagnostics in ${RESULT_PREFIX}-diagnostics"
else
  log "PASS: no stuck runs after ${kills} pod kill(s)"
fi
exit "${code}"
