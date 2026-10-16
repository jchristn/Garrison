#!/usr/bin/env bash
# Run the existing fairness experiment on the private scale stack's worker lane.
source "$(dirname "$0")/common.sh"
[ -f "${SCALE_DIR}/stack.env" ] || fail "start benchmarks/scale-up.sh first"
source "${SCALE_DIR}/stack.env"
python3 - "${BENCH_DIR}/datasets/synthetic-fleet.json" "${SCALE_DIR}/fairness-dataset.json" <<'PY'
import json, sys
value = json.load(open(sys.argv[1]))
for corpus in value['corpora']:
    if corpus['id'] == 'load':
        for item in corpus['items']:
            if 'manifest' in item:
                item['manifest'] = item['manifest'].replace('bench.garrison.io/lane: alpha', 'bench.garrison.io/lane: scale')
with open(sys.argv[2], 'w') as target:
    json.dump(value, target, indent=2)
    target.write('\n')
PY
build_harness
urls="$(scale_urls "${SCALE_STACK_SERVERS}")"
harness fairness --dataset "${SCALE_DIR}/fairness-dataset.json" --url "${urls%%,*}" --urls "${urls}" \
  --stack scale --stack-details "${SCALE_STACK_SERVERS} control-plane replicas; ${SCALE_STACK_WORKERS} workers x ${SCALE_STACK_SLOTS} slots; PostgreSQL; load corpus selector changed from alpha to scale" \
  --quiet-runs 30 --max-connections 4096 --max-quiet-p95-ms 10000 "$@"
