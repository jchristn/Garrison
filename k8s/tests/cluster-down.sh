#!/usr/bin/env bash
# Deletes the scale-test k3d cluster and its kubeconfig. Results under k8s/tests/results are kept.
source "$(dirname "$0")/common.sh"
need k3d
if k3d cluster list "${CLUSTER_NAME}" >/dev/null 2>&1; then
  k3d cluster delete "${CLUSTER_NAME}"
else
  log "no k3d cluster named ${CLUSTER_NAME}"
fi
rm -f "${KUBECONFIG_FILE}" "${WORK_DIR}/image-tag"
