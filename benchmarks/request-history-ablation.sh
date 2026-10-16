#!/usr/bin/env bash
# Paired off/on/on/off request-history measurements on a disposable benchmark stack only.
source "$(dirname "$0")/common.sh"
need curl
need python3
url="${BENCH_HISTORY_URL:-http://127.0.0.1:37901}"
case "${url}" in http://127.0.0.1:37800|http://127.0.0.1:3790[1-9]) ;; *) fail "use a private local or scale benchmark endpoint" ;; esac
stack="scale"
lane="bench.garrison.io/lane=scale"
default_dataset="${SCALE_DIR}/fairness-dataset.json"
if [ "${url}" = "${LOCAL_URL}" ]; then
  stack="local"
  lane="bench.garrison.io/lane=alpha"
  default_dataset="${BENCH_DIR}/datasets/synthetic-fleet.json"
fi
dataset="${BENCH_HISTORY_DATASET:-${default_dataset}}"
[ -f "${dataset}" ] || fail "set BENCH_HISTORY_DATASET to a workload matching the worker lane"
build_harness
original="$(curl --fail --silent --show-error "${url}/v1.0/api/settings" -H "x-api-key: ${ADMIN_KEY}" | python3 -c 'import sys,json; fields=json.load(sys.stdin)["fields"]; print(next(str(f["value"]).lower() for f in fields if f["path"]=="RequestHistory.Enabled"))')"
case "${original}" in true|false) ;; *) fail "could not read the original history setting" ;; esac
set_history() {
  curl --fail --silent --show-error -X PUT "${url}/v1.0/api/settings" -H "x-api-key: ${ADMIN_KEY}" -H 'Content-Type: application/json' \
    --data "{\"values\":[{\"path\":\"RequestHistory.Enabled\",\"value\":\"$1\"}]}" >/dev/null
}
restore() { set_history "${original}" || true; }
trap restore EXIT INT TERM
seed="${BENCH_HISTORY_SEED:-42}"
order="$(python3 - "${seed}" <<'PYSEED'
import random,sys
first=random.Random(int(sys.argv[1])).choice([False,True])
print('on1:true off1:false off2:false on2:true' if first else 'off1:false on1:true on2:true off2:false')
PYSEED
)"
for point in ${order}; do
  IFS=: read -r label enabled <<< "${point}"
  set_history "${enabled}"
  # Replicas receive cluster setting refreshes asynchronously; warmup also precedes measurement.
  sleep 2
  harness load --url "${url}" --admin-key "${ADMIN_KEY}" --dataset "${dataset}" --stack "${stack}" \
    --stack-details "request-history ${label}; ${BENCH_HISTORY_DETAILS:-private benchmark stack}; RequestHistory.Enabled=${enabled}; seeded counterbalanced ABBA; seed=${seed}" \
    --lane-label "${BENCH_HISTORY_LANE:-${lane}}" --mode closed --concurrency 16 --warmup-seconds "${BENCH_HISTORY_WARMUP_SECONDS:-5}" \
    --duration-seconds "${BENCH_HISTORY_DURATION_SECONDS:-30}" --database-attribution true \
    --seed "${seed}" --label "d062-history-${label}" "$@"
done
