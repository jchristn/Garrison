#!/usr/bin/env bash
# =============================================================================
#  run-autonomy-example.sh - run the gerbil keeper example (examples/autonomous/gerbil) end to end against a running
#  Garrison server and worker (AA12.3).
#
#  With the fake variant (the default) it plays walkthrough 11.1 of AUTONOMOUS_AGENTS_PLAN.md one tick at a time:
#    1. healthy     the tick remembers what it saw and completes Quiet; the interval doubles
#    2. down        the first 503 completes Attention; the interval snaps back to the minimum
#    3. still-down  the second 503 raises a non-blocking escalation to the on-call role and completes Escalated
#    4. answered    the script answers "wait"; the answer wakes the keeper, which records it in memory
#  Each step applies a scenario file (the gerbil deployment with that tick's scripted tool calls) and wakes the keeper.
#  The server needs agent memory on (GARRISON_AGENT_MEMORY_ENABLE=true) for the memory checks; without it they warn.
#
#  With --variant claude-code it applies the Claude Code deployment instead, wakes the keeper once, and reports how the
#  tick ended. That needs a secret named claude-credential and a worker with Claude Code.
#
#  Requires bash, curl, and jq. Prints PASS, WARN, or FAIL per check and exits non-zero when anything fails.
#
#  Options (each also has an environment variable; flags win). Nothing is hard-coded except 127.0.0.1 defaults:
#    --url URL          REST base URL                      GARRISON_URL       http://127.0.0.1:8700
#    --tenant ID        tenant                             GARRISON_TENANT    default
#    --token TOKEN      bearer token (skips sign-in)       GARRISON_TOKEN
#    --email EMAIL      user to sign in as                 GARRISON_EMAIL     admin@garrison
#    --password PASS    that user's password               GARRISON_PASSWORD  (required without a token)
#    --variant NAME     fake or claude-code                GARRISON_VARIANT   fake
#    --wait SECONDS     longest wait for one tick          GARRISON_WAIT      120
#    --cleanup          delete the gerbil-keeper mandate at the end, so the keeper stops ticking
#
#  Examples:
#    GARRISON_PASSWORD=... scripts/run-autonomy-example.sh
#    scripts/run-autonomy-example.sh --url http://127.0.0.1:9700 --token "$TOKEN" --cleanup
# =============================================================================
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXAMPLE="${ROOT}/examples/autonomous/gerbil"
URL="${GARRISON_URL:-http://127.0.0.1:8700}"
TENANT="${GARRISON_TENANT:-default}"
TOKEN="${GARRISON_TOKEN:-}"
EMAIL="${GARRISON_EMAIL:-admin@garrison}"
PASSWORD="${GARRISON_PASSWORD:-}"
VARIANT="${GARRISON_VARIANT:-fake}"
WAIT="${GARRISON_WAIT:-120}"
CLEANUP=0

while [ $# -gt 0 ]; do
  case "$1" in
    --url) URL="$2"; shift 2 ;;
    --tenant) TENANT="$2"; shift 2 ;;
    --token) TOKEN="$2"; shift 2 ;;
    --email) EMAIL="$2"; shift 2 ;;
    --password) PASSWORD="$2"; shift 2 ;;
    --variant) VARIANT="$2"; shift 2 ;;
    --wait) WAIT="$2"; shift 2 ;;
    --cleanup) CLEANUP=1; shift ;;
    -h|--help) sed -n '2,33p' "$0" | sed 's/^#  \{0,1\}//'; exit 0 ;;
    *) echo "unknown option: $1 (try --help)" >&2; exit 2 ;;
  esac
done

for tool in curl jq; do
  command -v "${tool}" >/dev/null 2>&1 || { echo "${tool} is required but was not found on PATH" >&2; exit 2; }
done
case "${VARIANT}" in fake|claude-code) ;; *) echo "--variant must be fake or claude-code" >&2; exit 2 ;; esac

URL="${URL%/}"
API="${URL}/v1.0/api/tenants/${TENANT}"
PASSED=0
FAILED=0
WARNED=0

pass() { PASSED=$((PASSED + 1)); printf 'PASS  %s\n' "$1"; }
fail() { FAILED=$((FAILED + 1)); printf 'FAIL  %s\n      %s\n' "$1" "$2"; }
warn() { WARNED=$((WARNED + 1)); printf 'WARN  %s\n      %s\n' "$1" "$2"; }
info() { printf '      %s\n' "$*"; }

api() {
  # api METHOD PATH [JSON body]: prints the response body
  if [ $# -ge 3 ]; then
    curl -s -m 60 -X "$1" "${API}$2" -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" -d "$3"
  else
    curl -s -m 60 -X "$1" "${API}$2" -H "Authorization: Bearer ${TOKEN}"
  fi
}

apply() {
  # apply FILE...: applies the files as one manifest and prints the result
  local first=1 file
  for file in "$@"; do
    [ "${first}" = "1" ] || printf '\n---\n'
    first=0
    cat "${EXAMPLE}/${file}"
  done | curl -s -m 60 -X POST "${API}/manifests/apply" -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/yaml" --data-binary @-
}

applied_ok() {
  # applied_ok RESULT LABEL: passes when no document failed
  local failed
  failed="$(printf '%s' "$1" | jq -r '.failedCount // empty' 2>/dev/null)"
  if [ "${failed}" = "0" ]; then
    pass "$2"; info "$(printf '%s' "$1" | jq -r '[.items[] | "\(.kind)/\(.name) \(.result)"] | join(", ")')"
    return 0
  fi
  fail "$2" "$(printf '%s' "$1" | jq -r '[.items[]? | select(.result == "Failed") | "\(.kind)/\(.name): \(.message)"] | join("; ")' 2>/dev/null || printf '%s' "$1" | head -c 300)"
  return 1
}

tick_ids() { api GET "/mandates/${MANDATE}/ticks?maxResults=100" | jq -r '[.objects[]?.id] | join(" ")'; }

wait_tick() {
  # wait_tick "KNOWN IDS": waits for a tick that is not in the list to finish, then prints it
  local known="$1" deadline=$(( $(date +%s) + WAIT )) page id tick
  while :; do
    page="$(api GET "/mandates/${MANDATE}/ticks?maxResults=100")"
    for id in $(printf '%s' "${page}" | jq -r '.objects[]?.id'); do
      case " ${known} " in *" ${id} "*) continue ;; esac
      tick="$(printf '%s' "${page}" | jq -c --arg i "${id}" '.objects[] | select(.id == $i)')"
      if [ "$(printf '%s' "${tick}" | jq -r '.finishedUtc // empty')" != "" ]; then printf '%s' "${tick}"; return 0; fi
    done
    [ "$(date +%s)" -ge "${deadline}" ] && return 1
    sleep 2
  done
}

wake() { api POST "/mandates/${MANDATE}/wake" > /dev/null; }

interval() { api GET "/mandates/${MANDATE}" | jq -r '.currentIntervalSeconds'; }

memory_has() {
  # memory_has KEY: prints the entry's writer run, or nothing
  api GET "/memory/entries?scopeKind=Agent&scopeId=${AGENT}&maxResults=100" | jq -r --arg k "$1" '[.objects[]? | select(.key == $k)][0].writerRunId // empty' 2>/dev/null
}

check_memory() {
  # check_memory KEY TICK LABEL
  local writer
  writer="$(memory_has "$1")"
  if [ -n "${writer}" ] && [ "${writer}" = "$(printf '%s' "$2" | jq -r .runId)" ]; then
    pass "$3"
  else
    warn "$3" "no memory entry $1 written by this tick; is agent memory on (GARRISON_AGENT_MEMORY_ENABLE=true)?"
  fi
}

step() {
  # step SCENARIO OUTCOME LABEL: applies a scenario, wakes the keeper, waits for its tick, and checks the outcome
  local result known tick outcome
  result="$(apply "scenarios/$1.yaml")"
  applied_ok "${result}" "apply scenario $1" || return 1
  known="$(tick_ids)"
  wake
  if ! tick="$(wait_tick "${known}")"; then fail "$3" "no tick finished within ${WAIT} seconds"; return 1; fi
  outcome="$(printf '%s' "${tick}" | jq -r .outcome)"
  if [ "${outcome}" = "$2" ]; then
    pass "$3"; info "tick $(printf '%s' "${tick}" | jq -r '"\(.id) woke by \(.wakeSource): \(.summary)"')"
  else
    fail "$3" "outcome ${outcome}, expected $2: $(printf '%s' "${tick}" | jq -c '{errorCode, errorMessage, summary}')"
    return 1
  fi
  LAST_TICK="${tick}"
}

echo "Gerbil keeper example (${VARIANT})"
echo "  REST   ${URL}"
echo "  tenant ${TENANT}"
echo

# --- Server and sign-in -------------------------------------------------------
HEALTH="$(curl -s -m 10 "${URL}/v1.0/api/health" | jq -r '.status // empty' 2>/dev/null)"
if [ "${HEALTH}" = "healthy" ]; then pass "server health"; else fail "server health" "GET ${URL}/v1.0/api/health did not answer healthy. Is the server running?"; exit 1; fi

if [ -z "${TOKEN}" ]; then
  if [ -z "${PASSWORD}" ]; then echo "Set GARRISON_TOKEN, or GARRISON_PASSWORD (or --password) to sign in as ${EMAIL}." >&2; exit 2; fi
  TOKEN="$(curl -s -m 10 -X POST "${URL}/v1.0/token" -H "Content-Type: application/json" \
    -d "$(jq -cn --arg e "${EMAIL}" --arg p "${PASSWORD}" --arg t "${TENANT}" '{email:$e,password:$p,tenantId:$t}')" | jq -r '.token // empty' 2>/dev/null)"
  if [ -n "${TOKEN}" ]; then pass "sign in as ${EMAIL}"; else fail "sign in as ${EMAIL}" "POST /v1.0/token returned no token"; exit 1; fi
fi

NODES="$(curl -s -m 10 "${URL}/v1.0/api/nodes" -H "Authorization: Bearer ${TOKEN}" | jq -r '[.objects[]? | select(.status == "Ready")] | length' 2>/dev/null)"
if [ "${NODES:-0}" -ge 1 ] 2>/dev/null; then pass "workers ready (${NODES})"; else fail "workers ready" "no worker reports Ready; ticks would stay queued"; exit 1; fi

# --- Apply ----------------------------------------------------------------------
if [ "${VARIANT}" = "fake" ]; then
  RESULT="$(apply gerbil.yaml fake-harness.yaml scenarios/healthy.yaml)"
else
  RESULT="$(apply gerbil.yaml claude-code.yaml)"
fi
applied_ok "${RESULT}" "apply the gerbil (${VARIANT})" || exit 1
MANDATE_JSON="$(api GET "/mandates/gerbil-keeper")"
MANDATE="$(printf '%s' "${MANDATE_JSON}" | jq -r '.id // empty')"
AGENT="$(printf '%s' "${MANDATE_JSON}" | jq -r '.agentId // empty')"
[ -n "${MANDATE}" ] || { fail "mandate gerbil-keeper" "not found after the apply"; exit 1; }
info "mandate ${MANDATE}, status $(printf '%s' "${MANDATE_JSON}" | jq -r .status), next wake $(printf '%s' "${MANDATE_JSON}" | jq -r .nextWakeUtc)"
CREATED="$(printf '%s' "${RESULT}" | jq -r '[.items[] | select(.kind == "Mandate" and .result == "Created")] | length')"
if [ "$(printf '%s' "${MANDATE_JSON}" | jq -r .status)" = "Paused" ]; then api POST "/mandates/${MANDATE}/resume" > /dev/null; CREATED=1; fi

# --- Ticks ----------------------------------------------------------------------
FIRST_KNOWN="$(tick_ids)"
# A new mandate's first wake is due now; an existing one needs a wake.
[ "${CREATED}" = "0" ] && wake
if ! FIRST="$(wait_tick "${FIRST_KNOWN}")"; then
  fail "first tick" "no tick finished within ${WAIT} seconds; is the leader sweeping and a worker leasing?"
  exit 1
fi

if [ "${VARIANT}" = "claude-code" ]; then
  outcome="$(printf '%s' "${FIRST}" | jq -r .outcome)"
  case "${outcome}" in
    Quiet|Acted|Attention|Escalated) pass "Claude Code tick reported ${outcome}"; info "$(printf '%s' "${FIRST}" | jq -r .summary)" ;;
    *) fail "Claude Code tick" "outcome ${outcome}: $(printf '%s' "${FIRST}" | jq -c '{errorCode, errorMessage, runId}')" ;;
  esac
else
  if [ "$(printf '%s' "${FIRST}" | jq -r .outcome)" = "Quiet" ]; then
    pass "healthy tick completes Quiet"; info "tick $(printf '%s' "${FIRST}" | jq -r '"\(.id): \(.summary)"')"
  else
    fail "healthy tick completes Quiet" "$(printf '%s' "${FIRST}" | jq -c '{outcome, errorCode, errorMessage}')"
  fi
  CURRENT="$(interval)"
  if [ "${CURRENT}" -ge 1800 ] 2>/dev/null; then pass "a quiet tick backs off (interval ${CURRENT} s)"; else fail "a quiet tick backs off" "interval ${CURRENT}"; fi
  check_memory last-seen-healthy "${FIRST}" "the tick remembered last-seen-healthy"

  if step down Attention "the first 503 completes Attention"; then
    CURRENT="$(interval)"
    if [ "${CURRENT}" = "900" ]; then pass "Attention snaps the interval back to 900 s"; else fail "Attention snaps the interval back" "interval ${CURRENT}"; fi
  fi

  if step still-down Escalated "the second 503 escalates"; then
    ESCALATION="$(api GET "/escalations?mandateId=${MANDATE}&status=Open&maxResults=100" \
      | jq -c --arg t "$(printf '%s' "${LAST_TICK}" | jq -r .id)" '[.objects[]? | select(.mandateTickId == $t)][0] // empty')"
    if [ -n "${ESCALATION}" ]; then
      pass "a non-blocking escalation to the on-call role"
      info "$(printf '%s' "${ESCALATION}" | jq -r '"\(.id) \(.mode) \(.severity) to \(.targetKind) \(.targetName // .targetId): \(.question)"')"
      result="$(apply scenarios/answered.yaml)"
      applied_ok "${result}" "apply scenario answered"
      known="$(tick_ids)"
      answered="$(api POST "/escalations/$(printf '%s' "${ESCALATION}" | jq -r .id)/answer" '{"choice":"wait","text":"The provider is on it. Keep watching."}')"
      if [ "$(printf '%s' "${answered}" | jq -r .status)" = "Answered" ]; then pass "answer the escalation: wait"; else fail "answer the escalation" "$(printf '%s' "${answered}" | head -c 300)"; fi
      if tick="$(wait_tick "${known}")"; then
        if [ "$(printf '%s' "${tick}" | jq -r .wakeSource)" = "EscalationAnswer" ] && [ "$(printf '%s' "${tick}" | jq -r .outcome)" = "Acted" ]; then
          pass "the answer wakes the keeper, which records it"; info "tick $(printf '%s' "${tick}" | jq -r '"\(.id): \(.summary)"')"
          check_memory on-call-instruction "${tick}" "the instruction is in memory"
        else
          fail "the answer wakes the keeper" "$(printf '%s' "${tick}" | jq -c '{wakeSource, outcome, summary}')"
        fi
      else
        fail "the answer wakes the keeper" "no tick finished within ${WAIT} seconds"
      fi
    else
      fail "a non-blocking escalation to the on-call role" "no open escalation from tick $(printf '%s' "${LAST_TICK}" | jq -r .id)"
    fi
  fi
fi

# --- Cleanup --------------------------------------------------------------------
if [ "${CLEANUP}" = "1" ]; then
  code="$(curl -s -m 30 -o /dev/null -w '%{http_code}' -X DELETE "${API}/mandates/${MANDATE}?force=true" -H "Authorization: Bearer ${TOKEN}")"
  if [ "${code}" = "204" ]; then pass "delete the gerbil-keeper mandate"; else fail "delete the gerbil-keeper mandate" "HTTP ${code}"; fi
else
  info "The keeper keeps ticking. Pause it with POST ${API}/mandates/gerbil-keeper/pause, or rerun with --cleanup."
fi

echo
echo "${PASSED} passed, ${WARNED} warned, ${FAILED} failed"
[ "${FAILED}" -gt 0 ] && exit 1
exit 0
