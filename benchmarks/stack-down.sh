#!/usr/bin/env bash
# Deletes the benchmark k3d cluster (garrison-bench) and its kubeconfig: the full reset of the k3d stack. Reports in
# benchmarks/results are kept. Nothing else is touched.
source "$(dirname "$0")/common.sh"
need k3d
if k3d cluster list "${CLUSTER_NAME}" >/dev/null 2>&1; then
  k3d cluster delete "${CLUSTER_NAME}"
else
  log "no k3d cluster named ${CLUSTER_NAME}"
fi
rm -f "${KUBECONFIG_FILE}"
