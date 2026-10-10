#!/usr/bin/env bash
# =============================================================================
#  validate.sh - check a Garrison install end to end with the quick start agents.
#
#  For every agent: invoke it over REST, MCP, and A2A. Then: ask the delegating agent to call another agent and
#  confirm the child run in the run tree, follow a run's server-sent event stream, check the run telemetry fields,
#  and query the analytics endpoint. Prints PASS or FAIL per check and exits non-zero when anything fails.
#
#  Requires bash, curl, and jq.
#
#  Usage:   examples/validate.sh [options]
#
#  Options (each also has an environment variable; flags win):
#    --url URL          REST base URL                    GARRISON_URL       http://127.0.0.1:8700
#    --mcp-url URL      MCP endpoint                     GARRISON_MCP_URL   the REST host on port 8701, path /mcp
#    --tenant ID        tenant                           GARRISON_TENANT    default
#    --email EMAIL      user to sign in as               GARRISON_EMAIL     admin@garrison
#    --password PASS    that user's password             GARRISON_PASSWORD  password
#    --agents "A B"     agents to invoke                 GARRISON_AGENTS    "planner coder echo"
#    --delegator NAME   agent asked to delegate          GARRISON_DELEGATOR planner
#    --delegate NAME    agent it should call             GARRISON_DELEGATE  echo
#    --wait SECONDS     longest wait for one run         GARRISON_WAIT      240
#    --skip-delegation  skip the delegation check
#
#  Examples:
#    examples/validate.sh
#    examples/validate.sh --url http://127.0.0.1:9700 --mcp-url http://127.0.0.1:9701/mcp
#    examples/validate.sh --agents echo --skip-delegation        # no model credentials needed
# =============================================================================
set -uo pipefail

URL="${GARRISON_URL:-http://127.0.0.1:8700}"
MCP_URL="${GARRISON_MCP_URL:-}"
TENANT="${GARRISON_TENANT:-default}"
EMAIL="${GARRISON_EMAIL:-admin@garrison}"
PASSWORD="${GARRISON_PASSWORD:-password}"
AGENTS="${GARRISON_AGENTS:-planner coder echo}"
DELEGATOR="${GARRISON_DELEGATOR:-planner}"
DELEGATE="${GARRISON_DELEGATE:-echo}"
WAIT="${GARRISON_WAIT:-240}"
SKIP_DELEGATION=0

while [ $# -gt 0 ]; do
  case "$1" in
    --url) URL="$2"; shift 2 ;;
    --mcp-url) MCP_URL="$2"; shift 2 ;;
    --tenant) TENANT="$2"; shift 2 ;;
    --email) EMAIL="$2"; shift 2 ;;
    --password) PASSWORD="$2"; shift 2 ;;
    --agents) AGENTS="$2"; shift 2 ;;
    --delegator) DELEGATOR="$2"; shift 2 ;;
    --delegate) DELEGATE="$2"; shift 2 ;;
    --wait) WAIT="$2"; shift 2 ;;
    --skip-delegation) SKIP_DELEGATION=1; shift ;;
    -h|--help) sed -n '2,29p' "$0" | sed 's/^#  \{0,1\}//'; exit 0 ;;
    *) echo "unknown option: $1 (try --help)" >&2; exit 2 ;;
  esac
done

for tool in curl jq; do
  command -v "${tool}" >/dev/null 2>&1 || { echo "${tool} is required but was not found on PATH" >&2; exit 2; }
done

URL="${URL%/}"
if [ -z "${MCP_URL}" ]; then
  # Same scheme and host as the REST URL, port 8701.
  MCP_URL="$(printf '%s' "${URL}" | sed -E 's#^(https?://[^/:]+)(:[0-9]+)?.*#\1:8701/mcp#')"
fi
API="${URL}/v1.0/api/tenants/${TENANT}"
# The MCP and A2A calls wait at most 90 seconds on the server by default (Mcp.MaxToolWaitSeconds).
TOOL_WAIT=$(( WAIT < 90 ? WAIT : 90 ))

PASSED=0
FAILED=0
FAILURES=()
TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

pass() { PASSED=$((PASSED + 1)); printf 'PASS  %s\n' "$1"; }
fail() { FAILED=$((FAILED + 1)); FAILURES+=("$1"); printf 'FAIL  %s\n      %s\n' "$1" "$2"; }
info() { printf '      %s\n' "$*"; }

# get_run <run id>: prints the run JSON
get_run() { curl -s -m 30 "${API}/runs/$1" -H "Authorization: Bearer ${TOKEN}"; }

# wait_run <run id>: polls until the run finishes or WAIT elapses, then prints the run JSON
wait_run() {
  local id="$1" deadline=$(( $(date +%s) + WAIT )) body
  while :; do
    body="$(get_run "${id}")"
    case "$(printf '%s' "${body}" | jq -r '.status // empty' 2>/dev/null)" in
      Succeeded|Failed|Cancelled|TimedOut|Rejected) break ;;
    esac
    [ "$(date +%s)" -ge "${deadline}" ] && break
    sleep 2
  done
  printf '%s' "${body}"
}

# describe <run json>: one line with the interesting fields
describe() {
  printf '%s' "$1" | jq -r '"run \(.id // .runId) status \(.status) model \(.servedModel // "-") ttft \(.timeToFirstTokenMs // "-")ms exec \(.executionMs // "-")ms result: \((.resultText // .result // .errorMessage // "") | tostring | gsub("\\s+"; " ") | .[0:80])"' 2>/dev/null
}

# sse_json <file>: prints the JSON body whether the server answered with JSON or with server-sent events
sse_json() {
  if grep -q '^data:' "$1"; then grep '^data:' "$1" | tail -n 1 | sed 's/^data: \{0,1\}//'; else cat "$1"; fi
}

mcp_call() {
  local id="$1" body="$2"
  curl -s -m $((TOOL_WAIT + 30)) -X POST "${MCP_URL}" -H "Authorization: Bearer ${TOKEN}" -H "MCP-Session-Id: ${MCP_SESSION}" \
    -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d "${body}" > "${TMP}/mcp-${id}.out"
  sse_json "${TMP}/mcp-${id}.out"
}

echo "Garrison validation"
echo "  REST   ${URL}"
echo "  MCP    ${MCP_URL}"
echo "  tenant ${TENANT}   user ${EMAIL}   agents: ${AGENTS}"
echo

# --- Server and sign-in -------------------------------------------------------
HEALTH="$(curl -s -m 10 "${URL}/v1.0/api/health")"
if [ "$(printf '%s' "${HEALTH}" | jq -r '.status // empty' 2>/dev/null)" = "healthy" ]; then
  pass "server health"
else
  fail "server health" "GET ${URL}/v1.0/api/health answered: ${HEALTH:-nothing}. Is the stack running and is the URL right?"
  echo; echo "Cannot continue without a healthy server."; exit 1
fi

TOKEN="$(curl -s -m 10 -X POST "${URL}/v1.0/token" -H "Content-Type: application/json" \
  -d "$(jq -cn --arg e "${EMAIL}" --arg p "${PASSWORD}" --arg t "${TENANT}" '{email:$e,password:$p,tenantId:$t}')" | jq -r '.token // empty' 2>/dev/null)"
if [ -n "${TOKEN}" ]; then
  pass "sign in as ${EMAIL}"
else
  fail "sign in as ${EMAIL}" "POST /v1.0/token returned no token. Check --email, --password, and --tenant."
  echo; echo "Cannot continue without a token."; exit 1
fi

NODES="$(curl -s -m 10 "${API}/../../nodes" -H "Authorization: Bearer ${TOKEN}" | jq -r '[.objects[]? | select(.status == "Ready")] | length' 2>/dev/null)"
if [ "${NODES:-0}" -ge 1 ] 2>/dev/null; then
  pass "workers ready (${NODES})"
else
  fail "workers ready" "no worker node reports Ready in GET /v1.0/api/nodes; runs would stay queued"
fi

DEPLOYMENTS="$(curl -s -m 10 -G "${API}/deployments" -H "Authorization: Bearer ${TOKEN}" --data-urlencode "maxResults=1000")"
for agent in ${AGENTS}; do
  agent_id="$(curl -s -m 10 -G "${API}/agents" -H "Authorization: Bearer ${TOKEN}" --data-urlencode "search=${agent}" --data-urlencode "maxResults=100" \
    | jq -r --arg n "${agent}" '[.objects[]? | select(.name == $n)][0].id // empty' 2>/dev/null)"
  if [ -z "${agent_id}" ]; then
    fail "agent ${agent} has an active deployment" "no agent named ${agent} in tenant ${TENANT}; apply examples/multi-agent.yaml first"
    continue
  fi
  count="$(printf '%s' "${DEPLOYMENTS}" | jq -r --arg a "${agent_id}" '[.objects[]? | select(.agentId == $a and .active)] | length' 2>/dev/null)"
  if [ "${count:-0}" -ge 1 ] 2>/dev/null; then
    pass "agent ${agent} has an active deployment"
  else
    fail "agent ${agent} has an active deployment" "agent ${agent} exists but has no active deployment, so invoking it would be rejected"
  fi
done

# --- REST ----------------------------------------------------------------------
LAST_RUN=""
for agent in ${AGENTS}; do
  body="$(curl -s -m $((WAIT + 30)) -X POST "${API}/agents/${agent}/invoke" -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$(jq -cn --arg i "Reply with one short sentence that includes the word READY." --argjson w "${WAIT}" '{input:$i,wait:true,waitSeconds:$w}')")"
  status="$(printf '%s' "${body}" | jq -r '.status // empty' 2>/dev/null)"
  if [ "${status}" = "Queued" ] || [ "${status}" = "Leased" ] || [ "${status}" = "Running" ]; then
    # The invoke stopped waiting (HTTP 202); follow the run until it finishes or WAIT elapses again.
    body="$(wait_run "$(printf '%s' "${body}" | jq -r .id)")"
    status="$(printf '%s' "${body}" | jq -r '.status // empty' 2>/dev/null)"
  fi
  if [ "${status}" = "Succeeded" ]; then
    pass "REST invoke ${agent}"; info "$(describe "${body}")"
    [ -z "${LAST_RUN}" ] && LAST_RUN="$(printf '%s' "${body}" | jq -r .id)"
  else
    fail "REST invoke ${agent}" "$(describe "${body}" || printf '%s' "${body}" | head -c 300)"
  fi
done

# --- MCP -----------------------------------------------------------------------
curl -s -m 15 -D "${TMP}/mcp-headers" -o "${TMP}/mcp-init.out" -X POST "${MCP_URL}" -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"garrison-validate","version":"1"}}}'
MCP_SESSION="$(grep -i '^mcp-session-id:' "${TMP}/mcp-headers" 2>/dev/null | head -n 1 | cut -d' ' -f2 | tr -d '\r')"
if [ -n "${MCP_SESSION}" ]; then
  pass "MCP initialize"
  curl -s -m 10 -o /dev/null -X POST "${MCP_URL}" -H "Authorization: Bearer ${TOKEN}" -H "MCP-Session-Id: ${MCP_SESSION}" \
    -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","method":"notifications/initialized"}'
  listed="$(mcp_call list '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"garrison_list_agents","arguments":{"maxResults":100}}}' \
    | jq -r '.result.content[0].text | fromjson | [.agents[].name] | join(" ")' 2>/dev/null)"
  missing=""
  for agent in ${AGENTS}; do case " ${listed} " in *" ${agent} "*) ;; *) missing="${missing} ${agent}" ;; esac; done
  if [ -z "${missing}" ]; then pass "MCP garrison_list_agents"; else fail "MCP garrison_list_agents" "missing:${missing} (listed: ${listed:-none})"; fi
  n=10
  for agent in ${AGENTS}; do
    n=$((n + 1))
    req="$(jq -cn --argjson id "${n}" --arg a "${agent}" --arg t "${TENANT}" --argjson w "${TOOL_WAIT}" \
      '{jsonrpc:"2.0",id:$id,method:"tools/call",params:{name:"garrison_invoke_agent",arguments:{tenantId:$t,agent:$a,input:"Reply with one short sentence that includes the word READY.",waitSeconds:$w}}}')"
    summary="$(mcp_call "${n}" "${req}" | jq -c '.result.content[0].text | fromjson' 2>/dev/null)"
    if [ "$(printf '%s' "${summary}" | jq -r '.finished' 2>/dev/null)" = "false" ]; then
      summary="$(wait_run "$(printf '%s' "${summary}" | jq -r .runId)")"
    fi
    if [ "$(printf '%s' "${summary}" | jq -r '.status' 2>/dev/null)" = "Succeeded" ]; then
      pass "MCP invoke ${agent}"; info "$(describe "${summary}")"
    else
      fail "MCP invoke ${agent}" "$(describe "${summary}" || head -c 300 "${TMP}/mcp-${n}.out")"
    fi
  done
else
  fail "MCP initialize" "no MCP-Session-Id from ${MCP_URL}: $(head -c 200 "${TMP}/mcp-init.out" 2>/dev/null). Is --mcp-url right?"
fi

# --- A2A -----------------------------------------------------------------------
for agent in ${AGENTS}; do
  card="$(curl -s -m 10 "${URL}/v1.0/a2a/${TENANT}/${agent}/.well-known/agent-card.json" | jq -r '.name // empty' 2>/dev/null)"
  if [ -n "${card}" ]; then pass "A2A agent card ${agent}"; else fail "A2A agent card ${agent}" "no card; is exposure.a2a true on the agent?"; fi
  req="$(jq -cn --arg m "validate-${agent}-$(date +%s)-${RANDOM}" \
    '{jsonrpc:"2.0",id:"1",method:"SendMessage",params:{message:{role:"ROLE_USER",messageId:$m,parts:[{text:"Reply with one short sentence that includes the word READY."}]}}}')"
  body="$(curl -s -m $((TOOL_WAIT + 30)) -X POST "${URL}/v1.0/a2a/${TENANT}/${agent}" -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" -d "${req}")"
  state="$(printf '%s' "${body}" | jq -r '.result.task.status.state // empty' 2>/dev/null)"
  task="$(printf '%s' "${body}" | jq -r '.result.task.id // empty' 2>/dev/null)"
  if [ "${state}" = "TASK_STATE_SUBMITTED" ] || [ "${state}" = "TASK_STATE_WORKING" ]; then
    run="$(wait_run "${task}")"
    [ "$(printf '%s' "${run}" | jq -r .status)" = "Succeeded" ] && state="TASK_STATE_COMPLETED"
  fi
  if [ "${state}" = "TASK_STATE_COMPLETED" ]; then
    pass "A2A SendMessage ${agent}"; info "task ${task}: $(printf '%s' "${body}" | jq -r '(.result.task.artifacts[0].parts[0].text // "") | gsub("\\s+"; " ") | .[0:80]')"
  else
    fail "A2A SendMessage ${agent}" "state ${state:-none}: $(printf '%s' "${body}" | head -c 300)"
  fi
done

# --- Streaming -----------------------------------------------------------------
STREAM_AGENT="${DELEGATE}"
case " ${AGENTS} " in *" ${STREAM_AGENT} "*) ;; *) STREAM_AGENT="$(printf '%s' "${AGENTS}" | awk '{print $1}')" ;; esac
started="$(curl -s -m 30 -X POST "${API}/agents/${STREAM_AGENT}/invoke" -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" -d '{"input":"Count from one to five.","wait":false}')"
sid="$(printf '%s' "${started}" | jq -r '.id // empty' 2>/dev/null)"
if [ -n "${sid}" ]; then
  curl -s -N -m $((WAIT + 10)) "${API}/runs/${sid}/events/stream" -H "Authorization: Bearer ${TOKEN}" -H "Accept: text/event-stream" > "${TMP}/stream.out" 2>/dev/null
  events="$(grep -c '^event: run.event' "${TMP}/stream.out")"
  # The stream ends with a run.completed event that carries the finished run.
  final="$(grep -A1 '^event: run.completed' "${TMP}/stream.out" | grep '^data:' | tail -n 1 | sed 's/^data: \{0,1\}//' | jq -r '.status // empty' 2>/dev/null)"
  if [ "${events}" -ge 1 ] && [ "${final}" = "Succeeded" ]; then
    pass "SSE event stream (${STREAM_AGENT}: ${events} events, final status ${final})"
  else
    fail "SSE event stream" "run ${sid}: ${events} events, last status ${final:-none}"
  fi
else
  fail "SSE event stream" "could not start a run of ${STREAM_AGENT}: $(printf '%s' "${started}" | head -c 200)"
fi

# --- Delegation ----------------------------------------------------------------
if [ "${SKIP_DELEGATION}" = "0" ]; then
  prompt="Use the garrison_invoke_agent tool to invoke the agent named ${DELEGATE} with the input ping. Then reply with the result text that ${DELEGATE} returned."
  body="$(curl -s -m $((WAIT + 30)) -X POST "${API}/agents/${DELEGATOR}/invoke" -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" -d "$(jq -cn --arg i "${prompt}" --argjson w "${WAIT}" '{input:$i,wait:true,waitSeconds:$w}')")"
  parent="$(printf '%s' "${body}" | jq -r '.id // empty' 2>/dev/null)"
  case "$(printf '%s' "${body}" | jq -r '.status // empty' 2>/dev/null)" in
    Queued|Leased|Running) body="$(wait_run "${parent}")" ;;
  esac
  if [ "$(printf '%s' "${body}" | jq -r '.status' 2>/dev/null)" = "Succeeded" ]; then
    pass "delegating run ${DELEGATOR}"; info "$(describe "${body}")"
  else
    fail "delegating run ${DELEGATOR}" "$(describe "${body}" || printf '%s' "${body}" | head -c 300)"
  fi
  if [ -n "${parent}" ]; then
    child="$(curl -s -m 10 "${API}/runs/${parent}/children" -H "Authorization: Bearer ${TOKEN}" \
      | jq -c --arg d "${DELEGATE}" '[(.objects // .)[] | select(.agentName == $d)][0] // empty' 2>/dev/null)"
    if [ -n "${child}" ] && [ "$(printf '%s' "${child}" | jq -r .parentRunId)" = "${parent}" ]; then
      pass "run tree: ${DELEGATOR} -> ${DELEGATE}"
      info "child $(printf '%s' "${child}" | jq -r '"\(.id) depth \(.depth) chain \(.callChain) status \(.status)"')"
    else
      fail "run tree: ${DELEGATOR} -> ${DELEGATE}" "no child run of ${DELEGATE} under ${parent}; the agent may not have called the tool"
    fi
  fi
fi

# --- Telemetry -----------------------------------------------------------------
if [ -n "${LAST_RUN}" ]; then
  run="$(get_run "${LAST_RUN}")"
  missing="$(printf '%s' "${run}" | jq -r '[ "queueMs","totalMs","executionMs","timeToFirstTokenMs","inputTokens","outputTokens","servedModel" ] | map(select(. as $f | ($run[$f] == null))) | join(" ")' --argjson run "${run}" 2>/dev/null)"
  if [ -z "${missing}" ]; then
    pass "run telemetry fields"
    info "$(printf '%s' "${run}" | jq -r '"queue \(.queueMs)ms ttft \(.timeToFirstTokenMs)ms streaming \(.streamingMs)ms exec \(.executionMs)ms total \(.totalMs)ms tokens in \(.inputTokens) out \(.outputTokens) cost \((.costUsd // 0) * 1000000 | round / 1000000) model \(.servedModel)"')"
  else
    fail "run telemetry fields" "run ${LAST_RUN} is missing: ${missing}"
  fi
else
  fail "run telemetry fields" "no successful REST run to inspect"
fi

analytics="$(curl -s -m 30 -G "${API}/analytics/runs" -H "Authorization: Bearer ${TOKEN}" --data-urlencode "groupBy=agent")"
runs="$(printf '%s' "${analytics}" | jq -r '.totals.runs // empty' 2>/dev/null)"
labels="$(printf '%s' "${analytics}" | jq -r '[.series[].label] | join(" ")' 2>/dev/null)"
if [ -n "${runs}" ] && [ "${runs}" -ge 1 ]; then
  pass "analytics endpoint (${runs} runs in the last 24 hours; agents: ${labels})"
else
  fail "analytics endpoint" "GET analytics/runs: $(printf '%s' "${analytics}" | head -c 300)"
fi

echo
echo "${PASSED} passed, ${FAILED} failed"
if [ "${FAILED}" -gt 0 ]; then
  for f in "${FAILURES[@]}"; do echo "  failed: ${f}"; done
  exit 1
fi
exit 0
