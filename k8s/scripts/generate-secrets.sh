#!/usr/bin/env bash
# Creates the Garrison Secrets with random values. Existing garrison-secrets and garrison-node-credential are kept
# unless --force is given (rotating them after first boot changes admin and node keys).
# Optional harness credentials are read from the caller's environment and always refreshed:
#   ANTHROPIC_API_KEY, CLAUDE_CODE_OAUTH_TOKEN, OPENAI_API_KEY, MUX_BASE_URL, MUX_MODEL, MUX_API_KEY, MUX_ADAPTER_TYPE,
#   and CODEX_AUTH_JSON_FILE (path to a Codex auth.json, for example ~/.codex/auth.json)
# Secret values are never printed, except the generated admin password once.
source "$(dirname "$0")/common.sh"
need kubectl
need openssl

FORCE=0
[ "${1:-}" = "--force" ] && FORCE=1

rand() { openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c "$1"; }

kubectl get namespace "${GARRISON_NAMESPACE}" >/dev/null 2>&1 || kubectl create namespace "${GARRISON_NAMESPACE}" >/dev/null

if [ "${FORCE}" = "1" ] || ! kubectl -n "${GARRISON_NAMESPACE}" get secret garrison-secrets >/dev/null 2>&1; then
  ADMIN_PASSWORD="$(rand 20)"
  kubectl -n "${GARRISON_NAMESPACE}" create secret generic garrison-secrets \
    --from-literal=master-key="$(openssl rand -base64 32)" \
    --from-literal=signing-key="$(rand 48)" \
    --from-literal=admin-api-key="$(rand 40)" \
    --from-literal=admin-password="${ADMIN_PASSWORD}" \
    --from-literal=db-password="$(rand 32)" \
    --from-literal=default-access-key="access_$(rand 32)" \
    --from-literal=default-secret-key="secret_$(rand 48)" \
    --dry-run=client -o yaml | kubectl apply -f - >/dev/null
  log "created secret garrison-secrets"
  log "WARNING: the administrator password is shown once. Store it now."
  log "  admin user: admin@garrison.local"
  log "  admin password: ${ADMIN_PASSWORD}"
else
  log "secret garrison-secrets exists; keeping it (use --force to rotate)"
fi

if [ "${FORCE}" = "1" ] || ! kubectl -n "${GARRISON_NAMESPACE}" get secret garrison-node-credential >/dev/null 2>&1; then
  kubectl -n "${GARRISON_NAMESPACE}" create secret generic garrison-node-credential \
    --from-literal=access-key="access_$(rand 32)" \
    --from-literal=secret-key="secret_$(rand 48)" \
    --dry-run=client -o yaml | kubectl apply -f - >/dev/null
  log "created secret garrison-node-credential"
else
  log "secret garrison-node-credential exists; keeping it"
fi

ARGS=()
for key in ANTHROPIC_API_KEY CLAUDE_CODE_OAUTH_TOKEN OPENAI_API_KEY MUX_BASE_URL MUX_MODEL MUX_API_KEY MUX_ADAPTER_TYPE; do
  if [ -n "${!key:-}" ]; then
    ARGS+=("--from-literal=${key}=${!key}")
    log "harness credential ${key}: provided"
  fi
done
if [ -n "${CODEX_AUTH_JSON_FILE:-}" ]; then
  if [ -f "${CODEX_AUTH_JSON_FILE}" ]; then
    ARGS+=("--from-file=CODEX_AUTH_JSON=${CODEX_AUTH_JSON_FILE}")
    log "harness credential CODEX_AUTH_JSON: provided from ${CODEX_AUTH_JSON_FILE}"
  else
    log "CODEX_AUTH_JSON_FILE ${CODEX_AUTH_JSON_FILE} not found; skipping"
  fi
fi
if [ "${#ARGS[@]}" -gt 0 ]; then
  kubectl -n "${GARRISON_NAMESPACE}" create secret generic garrison-harness-credentials "${ARGS[@]}" \
    --dry-run=client -o yaml | kubectl apply -f - >/dev/null
  log "updated secret garrison-harness-credentials"
else
  log "no harness credentials in the environment; only the smoke-test agent will be runnable"
fi
