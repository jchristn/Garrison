#!/usr/bin/env bash
# P10.8 rolling upgrade test: restarts (or upgrades) the server Deployment while runs are queued and in flight, and
# passes only when every run Succeeded and no run creation failed.
#
#   k8s/tests/rolling-upgrade-test.sh                                    # rollout restart of garrison-server
#   UPGRADE_TAG=scaletest-next k8s/tests/rolling-upgrade-test.sh         # set a new server image tag instead
#   ROLL_WORKERS=1 k8s/tests/rolling-upgrade-test.sh                     # then roll the workers too
#
# Environment: ROLL_AFTER_RUNS (RUNS/3, roll once this many runs are created), UPGRADE_TAG (unset: restart only;
# the image must already be imported, for example with BUILD=1 IMAGE_TAG=<tag> cluster-up.sh), ROLL_WORKERS (0),
# ROLL_COUNT (1, how many back-to-back server rollouts), plus the sizes in common.sh. RUN_MS defaults to 5000 here
# so runs are in flight during the rollout.
RUN_MS="${RUN_MS:-5000}"
source "$(dirname "$0")/common.sh"
need dotnet
require_cluster

ROLL_AFTER_RUNS="${ROLL_AFTER_RUNS:-$((RUNS / 3))}"
ROLL_WORKERS="${ROLL_WORKERS:-0}"
ROLL_COUNT="${ROLL_COUNT:-1}"

label="rolling-$(deployed_sizes)"
start_loadgen "${label}" --require-success
trap 'kill "${LOADGEN_PID}" 2>/dev/null || true' INT TERM

wait_for_created "${ROLL_AFTER_RUNS}"
for i in $(seq 1 "${ROLL_COUNT}"); do
  if [ -n "${UPGRADE_TAG:-}" ] && [ "${i}" = "1" ]; then
    log "upgrading garrison-server to jchristn77/garrison-server:${UPGRADE_TAG}"
    kcn set image deployment/garrison-server "server=jchristn77/garrison-server:${UPGRADE_TAG}" >/dev/null
  else
    log "rollout restart of garrison-server (${i}/${ROLL_COUNT})"
    kcn rollout restart deployment/garrison-server >/dev/null
  fi
  started=$(date +%s)
  kcn rollout status deployment/garrison-server --timeout=600s
  log "server rollout finished in $(( $(date +%s) - started )) s"
done
if [ "${ROLL_WORKERS}" = "1" ]; then
  log "rollout restart of garrison-worker (workers drain before exiting)"
  kcn rollout restart statefulset/garrison-worker >/dev/null
  kcn rollout status statefulset/garrison-worker --timeout=1200s
fi

code=0
wait_loadgen || code=$?
if [ "${code}" != "0" ]; then
  collect_diagnostics "${RESULT_PREFIX}-diagnostics"
  log "FAIL (exit ${code}); diagnostics in ${RESULT_PREFIX}-diagnostics"
else
  log "PASS: zero failed runs across the rollout"
fi
exit "${code}"
