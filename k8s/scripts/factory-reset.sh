#!/usr/bin/env bash
# DESTRUCTIVE: deletes the Garrison namespace including databases, workspaces, and secrets, then reinstalls the
# chosen overlay with fresh secrets. Requires typing RESET.
# Usage: k8s/scripts/factory-reset.sh [minikube|k3s|production]
source "$(dirname "$0")/common.sh"
need kubectl
OVERLAY="${1:-k3s}"
[ -d "${K8S_DIR}/overlays/${OVERLAY}" ] || fail "unknown overlay ${OVERLAY}"

printf 'This deletes namespace %s and ALL Garrison data in the current context (%s).\n' "${GARRISON_NAMESPACE}" "$(kubectl config current-context)"
printf 'Type RESET to continue: '
read -r answer
[ "${answer}" = "RESET" ] || fail "aborted"

kubectl delete namespace "${GARRISON_NAMESPACE}" --wait=true --ignore-not-found
"${SCRIPT_DIR}/generate-secrets.sh"
kubectl apply -k "${K8S_DIR}/overlays/${OVERLAY}"
wait_for_rollout
