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
  wait_for_observability
}

# OBSERVABILITY=1 turns the minikube and k3s overlays into their -observability variants (components/observability).
# An overlay name that already ends in -observability is used as is.
overlay_name() {
  local base="$1"
  if [ "${OBSERVABILITY:-0}" = "1" ] && [ "${base%-observability}" = "${base}" ] && [ -d "${K8S_DIR}/overlays/${base}-observability" ]; then
    printf '%s-observability' "${base}"
  else
    printf '%s' "${base}"
  fi
}

# Third-party images of the observability component, read from its manifests so there is one list to maintain.
observability_images() {
  grep -h '^ *image: ' "${K8S_DIR}/components/observability/"*.yaml | awk '{print $2}' | sort -u
}

# Waits for the observability stack when it is deployed (Grafana present); a no-op otherwise.
wait_for_observability() {
  kubectl -n "${GARRISON_NAMESPACE}" get deployment garrison-grafana >/dev/null 2>&1 || return 0
  log "waiting for the observability stack"
  for name in garrison-prometheus garrison-loki garrison-tempo garrison-alloy garrison-grafana; do
    kubectl -n "${GARRISON_NAMESPACE}" rollout status "deployment/${name}" --timeout=600s
  done
}

# Prints how to reach Grafana when the observability stack is deployed.
print_observability() {
  kubectl -n "${GARRISON_NAMESPACE}" get service garrison-grafana >/dev/null 2>&1 || return 0
  log "observability: run k8s/scripts/port-forward.sh, then open Grafana at http://127.0.0.1:${GRAFANA_PORT:-3000}"
  log "  Grafana user admin, password from GARRISON_GRAFANA_PASSWORD at secret creation (otherwise random, printed once);"
  log "  read it back with: kubectl -n ${GARRISON_NAMESPACE} get secret garrison-grafana -o jsonpath='{.data.admin-password}' | base64 -d"
}
