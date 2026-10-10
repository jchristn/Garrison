#!/bin/sh
# Garrison bootstrap: waits for the server, creates Garrison secrets from the optional harness credentials,
# then applies the sample manifests. Idempotent; safe to re-run.
# Requires: curl, sed, grep (curlimages/curl). Inputs come from environment variables.
set -u

API="${GARRISON_API_URL:-http://garrison-server:8700}"
TENANT="${GARRISON_TENANT_ID:-ten_default}"
KEY="${GARRISON_ADMIN_API_KEY:?GARRISON_ADMIN_API_KEY is required}"
MANIFESTS="${GARRISON_MANIFEST_DIR:-/manifests}"
BASE="${API}/v1.0/api/tenants/${TENANT}"

log() { echo "[bootstrap] $*"; }

json_escape() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's/\r$//' | awk '{ printf "%s%s", (NR > 1 ? "\\n" : ""), $0 }'
}

log "waiting for ${API}/v1.0/api/health"
until curl -fsS -o /dev/null "${API}/v1.0/api/health"; do sleep 3; done
log "server healthy"

# upsert_secret <name> <kind> <value>
upsert_secret() {
  name="$1"; kind="$2"; value="$3"
  body="{\"name\":\"${name}\",\"kind\":\"${kind}\",\"value\":\"$(json_escape "${value}")\",\"description\":\"Created by the Garrison bootstrap Job.\"}"
  code=$(curl -sS -o /tmp/secret.out -w '%{http_code}' -X POST "${BASE}/secrets" \
    -H "x-api-key: ${KEY}" -H "Content-Type: application/json" --data "${body}")
  if [ "${code}" = "200" ] || [ "${code}" = "201" ]; then
    log "created secret ${name}"
    return 0
  fi
  if [ "${code}" = "409" ]; then
    id=$(curl -fsS "${BASE}/secrets?search=${name}" -H "x-api-key: ${KEY}" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n 1)
    if [ -n "${id}" ]; then
      curl -fsS -o /dev/null -X PUT "${BASE}/secrets/${id}/value" -H "x-api-key: ${KEY}" \
        -H "Content-Type: application/json" --data "{\"value\":\"$(json_escape "${value}")\"}" \
        && log "updated secret ${name}" && return 0
    fi
  fi
  log "failed to create secret ${name} (HTTP ${code}): $(cat /tmp/secret.out 2>/dev/null)"
  return 1
}

# apply_manifest <file>
apply_manifest() {
  file="$1"
  code=$(curl -sS -o /tmp/apply.out -w '%{http_code}' -X POST "${BASE}/manifests/apply" \
    -H "x-api-key: ${KEY}" -H "Content-Type: application/yaml" --data-binary "@${file}")
  log "applied $(basename "${file}") (HTTP ${code}): $(cat /tmp/apply.out)"
  [ "${code}" = "200" ] || [ "${code}" = "201" ]
}

failures=0
WORK=/tmp/manifests
mkdir -p "${WORK}"

CLAUDE_SECRET=""
if [ -n "${CLAUDE_CODE_OAUTH_TOKEN:-}" ]; then
  upsert_secret claude-oauth-token ClaudeCodeOAuthToken "${CLAUDE_CODE_OAUTH_TOKEN}" && CLAUDE_SECRET=claude-oauth-token
elif [ -n "${ANTHROPIC_API_KEY:-}" ]; then
  upsert_secret anthropic-api-key AnthropicApiKey "${ANTHROPIC_API_KEY}" && CLAUDE_SECRET=anthropic-api-key
fi
CODEX_SECRET=""
if [ -n "${OPENAI_API_KEY:-}" ]; then
  upsert_secret openai-api-key OpenAiApiKey "${OPENAI_API_KEY}" && CODEX_SECRET=openai-api-key
elif [ -n "${CODEX_AUTH_JSON:-}" ]; then
  upsert_secret codex-auth-json CodexAuthJson "${CODEX_AUTH_JSON}" && CODEX_SECRET=codex-auth-json
fi
MUX_OK=""
if [ -n "${MUX_BASE_URL:-}" ]; then
  upsert_secret mux-api-key OpenAiApiKey "${MUX_API_KEY:-none}" && MUX_OK=1
fi

apply_manifest "${MANIFESTS}/agents.yaml" || failures=$((failures + 1))

if [ -n "${CLAUDE_SECRET}" ]; then
  sed "s/__CLAUDE_SECRET__/${CLAUDE_SECRET}/g" "${MANIFESTS}/deployment-claude.yaml" > "${WORK}/deployment-claude.yaml"
  apply_manifest "${WORK}/deployment-claude.yaml" || failures=$((failures + 1))
else
  log "skipping claude-helper deployment: set CLAUDE_CODE_OAUTH_TOKEN or ANTHROPIC_API_KEY in garrison-harness-credentials"
fi

if [ -n "${CODEX_SECRET}" ]; then
  sed "s/__CODEX_SECRET__/${CODEX_SECRET}/g" "${MANIFESTS}/deployment-codex.yaml" > "${WORK}/deployment-codex.yaml"
  apply_manifest "${WORK}/deployment-codex.yaml" || failures=$((failures + 1))
else
  log "skipping codex-coder deployment: set OPENAI_API_KEY or CODEX_AUTH_JSON in garrison-harness-credentials"
fi

if [ -n "${MUX_OK}" ]; then
  sed -e "s#__MUX_BASE_URL__#${MUX_BASE_URL}#g" \
      -e "s#__MUX_MODEL__#${MUX_MODEL:-gpt-4o-mini}#g" \
      -e "s#__MUX_ADAPTER_TYPE__#${MUX_ADAPTER_TYPE:-openai-compatible}#g" \
      "${MANIFESTS}/deployment-mux.yaml" > "${WORK}/deployment-mux.yaml"
  apply_manifest "${WORK}/deployment-mux.yaml" || failures=$((failures + 1))
else
  log "skipping mux-helper deployment: set MUX_BASE_URL (and MUX_MODEL, MUX_API_KEY) in garrison-harness-credentials"
fi

for extra in "${MANIFESTS}"/extra-*.yaml; do
  [ -f "${extra}" ] || continue
  apply_manifest "${extra}" || failures=$((failures + 1))
done

if [ "${failures}" -gt 0 ]; then
  log "completed with ${failures} failure(s)"
  exit 1
fi
log "completed"
