#!/usr/bin/env bash
# Runs the fake-harness smoke test inside the cluster and prints its log. Exit code 0 means a run succeeded
# end to end (REST, scheduling, a worker, the harness process, and completion).
source "$(dirname "$0")/common.sh"
need kubectl

kubectl -n "${GARRISON_NAMESPACE}" delete job garrison-smoke-test --ignore-not-found >/dev/null
kubectl apply -k "${K8S_DIR}/overlays/smoke-test"
if kubectl -n "${GARRISON_NAMESPACE}" wait --for=condition=complete job/garrison-smoke-test --timeout="${SMOKE_TIMEOUT:-300s}"; then
  kubectl -n "${GARRISON_NAMESPACE}" logs job/garrison-smoke-test
  log "smoke test passed"
else
  kubectl -n "${GARRISON_NAMESPACE}" logs job/garrison-smoke-test || true
  fail "smoke test failed"
fi
