#!/usr/bin/env bash
# Non-destructive update: re-applies an overlay, restarts server, workers, and dashboard so they pick up new
# images and settings, waits for the rollout, and prints pod status. Data and PVCs are kept.
# Usage: k8s/scripts/update.sh [minikube|k3s|production]
source "$(dirname "$0")/common.sh"
need kubectl
OVERLAY="${1:-k3s}"
[ -d "${K8S_DIR}/overlays/${OVERLAY}" ] || fail "unknown overlay ${OVERLAY}"

kubectl apply -k "${K8S_DIR}/overlays/${OVERLAY}"
kubectl -n "${GARRISON_NAMESPACE}" rollout restart deployment/garrison-server deployment/garrison-dashboard statefulset/garrison-worker
kubectl -n "${GARRISON_NAMESPACE}" rollout status deployment/garrison-server --timeout=600s
kubectl -n "${GARRISON_NAMESPACE}" rollout status statefulset/garrison-worker --timeout=900s
kubectl -n "${GARRISON_NAMESPACE}" rollout status deployment/garrison-dashboard --timeout=300s
kubectl -n "${GARRISON_NAMESPACE}" get pods -o wide
