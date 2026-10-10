#!/usr/bin/env bash
# Shared helpers for the Garrison Kubernetes scripts. Sourced, not executed.
set -euo pipefail

GARRISON_NAMESPACE="${GARRISON_NAMESPACE:-garrison}"
GARRISON_TAG="${GARRISON_TAG:-v0.1.0-alpha}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_DIR="$(cd "${K8S_DIR}/.." && pwd)"

log() { printf '[garrison] %s\n' "$*"; }
fail() { printf '[garrison] error: %s\n' "$*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || fail "$1 is required but was not found on PATH"; }

wait_for_rollout() {
  log "waiting for rollout"
  kubectl -n "${GARRISON_NAMESPACE}" rollout status statefulset/garrison-postgres --timeout=300s 2>/dev/null || true
  kubectl -n "${GARRISON_NAMESPACE}" rollout status deployment/garrison-server --timeout=600s
  kubectl -n "${GARRISON_NAMESPACE}" rollout status statefulset/garrison-worker --timeout=600s
  kubectl -n "${GARRISON_NAMESPACE}" rollout status deployment/garrison-dashboard --timeout=300s
  kubectl -n "${GARRISON_NAMESPACE}" wait --for=condition=complete job/garrison-bootstrap --timeout=300s \
    || log "bootstrap Job has not completed; inspect it with: kubectl -n ${GARRISON_NAMESPACE} logs job/garrison-bootstrap"
}
